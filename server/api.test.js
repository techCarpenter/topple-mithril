import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import Fastify from "fastify";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(mkdtempSync(path.join(tmpdir(), "topple-tests-")), "legacy.db");
process.env.DB_FILE = dbFile;
const legacy = new Database(dbFile);
legacy.exec(readFileSync(path.join(root, "data/schema.sql"), "utf8").replaceAll("date TEXT NOT NULL", "date INTEGER NOT NULL"));
legacy.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  INSERT INTO schema_migrations(version,name) VALUES (1,'initial_schema'),(2,'normalize_extra_payments'),(3,'normalize_snowball_adjustments');
  INSERT INTO users(name,email,username) VALUES ('Test','test@example.test','test');
  INSERT INTO accounts(user_id,name,apr,min_payment) VALUES (1,'Card',20,25);
`);
const legacyDate = new Date(2026, 2, 8, 23, 45).getTime();
legacy.prepare("INSERT INTO snapshots(user_id,account_id,date,balance) VALUES (1,1,?,100)").run(legacyDate);
legacy.prepare("INSERT INTO extrapayments(user_id,date,amount) VALUES (1,?,20)").run(legacyDate);
legacy.prepare("INSERT INTO snowballadjustments(user_id,date,amount) VALUES (1,?,10)").run(legacyDate);
legacy.close();

const { db } = await import("./db.js");
const [{ loanRoutes }, { snapshotRoutes }, { extraPaymentRoutes }, { snowballAdjustmentRoutes }] = await Promise.all([
  import("./routes/LoanRoutes.js"), import("./routes/SnapshotRoutes.js"), import("./routes/ExtraPaymentRoutes.js"), import("./routes/SnowballAdjustmentRoutes.js")
]);

test("date migration preserves legacy local dates and rows", () => {
  const expected = `${legacyDate ? new Date(legacyDate).getFullYear() : 0}-${String(new Date(legacyDate).getMonth() + 1).padStart(2, "0")}-${String(new Date(legacyDate).getDate()).padStart(2, "0")}`;
  for (const table of ["snapshots", "extrapayments", "snowballadjustments"]) {
    const row = db.prepare(`SELECT date FROM ${table}`).get();
    assert.equal(row.date, expected);
  }
  assert.equal(db.prepare("SELECT count(*) AS n FROM snapshots").get().n, 1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM schema_migrations").get().n, 5);
  for (const table of ["snapshots", "extrapayments", "snowballadjustments"]) {
    assert.equal(db.prepare(`PRAGMA table_info(${table})`).all().find(column => column.name === "date").type, "TEXT");
  }
});

test("Fastify rejects invalid account, balance, date, and extra payment values", async () => {
  const app = Fastify();
  app.setErrorHandler((error, _request, reply) => reply.code(error.validation ? 400 : (error.statusCode ?? 500)).send({ msg: error.message }));
  await app.register(loanRoutes, { prefix: "/api/v1" });
  await app.register(snapshotRoutes, { prefix: "/api/v1" });
  await app.register(extraPaymentRoutes, { prefix: "/api/v1" });
  await app.register(snowballAdjustmentRoutes, { prefix: "/api/v1" });
  await app.ready();
  const invalidBodies = [
    ["POST", "/api/v1/loans", { name: "Card", apr: -1, minPayment: 5 }],
    ["POST", "/api/v1/loans", { name: "Card", apr: 10, minPayment: 0 }],
    ["POST", "/api/v1/snapshots", { accountId: 1, date: "2026-02-30", balance: 10 }],
    ["POST", "/api/v1/snapshots", { accountId: 1, date: 8640000000000000, balance: 10 }],
    ["POST", "/api/v1/snapshots", { accountId: 1, date: "2026-02-01", balance: -1 }],
    ["POST", "/api/v1/extra-payments", { date: "2026-02-01", amount: -1 }],
    ["POST", "/api/v1/snowball-adjustments", { date: "2026-02-01", amount: -1 }]
  ];
  for (const [method, url, payload] of invalidBodies) {
    const response = await app.inject({ method, url, payload });
    assert.equal(response.statusCode, 400, `${url} should reject ${JSON.stringify(payload)}: ${response.body}`);
  }
  const accepted = await app.inject({ method: "POST", url: "/api/v1/snapshots", payload: { accountId: 1, date: "2026-02-28", balance: 0 } });
  assert.equal(accepted.statusCode, 201);
  assert.equal(JSON.parse(accepted.body).date, "2026-02-28");
  await app.close();
});

test.after(() => db.close());
