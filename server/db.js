import Database from "better-sqlite3";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SERVER_DIR, "..");
const APP_DATA_DIR = process.env.DATA_DIR ?? path.resolve(PROJECT_ROOT, "data");
const SCHEMA_FILE_PATH = process.env.SCHEMA_FILE ?? path.resolve(PROJECT_ROOT, "data", "schema.sql");
const DEFAULT_DB_FILE_PATH = process.env.NODE_ENV === "production"
  ? path.resolve(APP_DATA_DIR, "topple-prod.db")
  : path.resolve(APP_DATA_DIR, "topple-dev.db");
const DB_FILE_PATH = process.env.DB_FILE ?? DEFAULT_DB_FILE_PATH;

const db = new Database(DB_FILE_PATH, {
  fileMustExist: false,
  readonly: false,
  verbose: process.env.NODE_ENV === "production" ? undefined : console.log
});

db.pragma("foreign_keys = ON");

// WAL mode is a solid default for a single-node SQLite app.
db.pragma("journal_mode = WAL");

function migrateExtraPaymentsTable(database) {
  const columns = database.prepare("PRAGMA table_info(extrapayments)").all();

  if (columns.length === 0) {
    return;
  }

  const hasAccountId = columns.some(column => column.name === "account_id");
  const hasBalance = columns.some(column => column.name === "balance");
  const hasAmount = columns.some(column => column.name === "amount");

  if (!hasAccountId && hasAmount && !hasBalance) {
    return;
  }

  database.transaction(() => {
    database.exec(`
      ALTER TABLE extrapayments RENAME TO extrapayments_legacy;

      CREATE TABLE extrapayments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date INTEGER NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      INSERT INTO extrapayments (id, user_id, date, amount)
      SELECT
        id,
        user_id,
        date,
        ${hasAmount ? "amount" : "balance"}
      FROM extrapayments_legacy;

      DROP TABLE extrapayments_legacy;
    `);
  })();
}

function migrateSnowballAdjustmentsTable(database) {
  const columns = database.prepare("PRAGMA table_info(snowballadjustments)").all();

  if (columns.length === 0) {
    return;
  }

  const hasAccountId = columns.some(column => column.name === "account_id");
  const hasBalance = columns.some(column => column.name === "balance");
  const hasAmount = columns.some(column => column.name === "amount");

  if (!hasAccountId && hasAmount && !hasBalance) {
    return;
  }

  database.transaction(() => {
    database.exec(`
      ALTER TABLE snowballadjustments RENAME TO snowballadjustments_legacy;

      CREATE TABLE snowballadjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date INTEGER NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      INSERT INTO snowballadjustments (id, user_id, date, amount)
      SELECT
        id,
        user_id,
        date,
        ${hasAmount ? "amount" : "balance"}
      FROM snowballadjustments_legacy;

      DROP TABLE snowballadjustments_legacy;
    `);
  })();
}

const MIGRATIONS = [
  {
    version: 1,
    name: "initial_schema",
    apply: async (database) => {
      const schema = await readFile(SCHEMA_FILE_PATH, "utf8");
      database.exec(schema);
    }
  },
  {
    version: 2,
    name: "normalize_extra_payments",
    apply: (database) => {
      migrateExtraPaymentsTable(database);
    }
  },
  {
    version: 3,
    name: "normalize_snowball_adjustments",
    apply: (database) => {
      migrateSnowballAdjustmentsTable(database);
    }
  },
  {
    version: 4,
    name: "store_calendar_dates",
    apply: (database) => {
      for (const table of ["snapshots", "extrapayments", "snowballadjustments"]) {
        const rows = database.prepare(`SELECT id, date FROM ${table}`).all();
        const update = database.prepare(`UPDATE ${table} SET date = @date WHERE id = @id`);
        const transaction = database.transaction(items => items.forEach(row => {
          const value = row.date;
          if (typeof value === "number") {
            const date = new Date(value);
            update.run({ id: row.id, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` });
          } else if (typeof value === "string" && /^\d{10,13}$/.test(value)) {
            const timestamp = Number(value) * (value.length === 10 ? 1000 : 1);
            const date = new Date(timestamp);
            update.run({ id: row.id, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` });
          } else if (typeof value === "string" && value.length > 10) {
            update.run({ id: row.id, date: value.slice(0, 10) });
          }
        }));
        transaction(rows);
      }
    }
  },
  {
    version: 5,
    name: "declare_calendar_dates_as_text",
    apply: (database) => {
      database.transaction(() => {
        database.exec(`
          ALTER TABLE snapshots RENAME TO snapshots_legacy_dates;
          CREATE TABLE snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            balance REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
          );
          INSERT INTO snapshots (id, user_id, account_id, date, balance)
            SELECT id, user_id, account_id, date, balance FROM snapshots_legacy_dates;
          DROP TABLE snapshots_legacy_dates;

          ALTER TABLE extrapayments RENAME TO extrapayments_legacy_dates;
          CREATE TABLE extrapayments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
          INSERT INTO extrapayments (id, user_id, date, amount)
            SELECT id, user_id, date, amount FROM extrapayments_legacy_dates;
          DROP TABLE extrapayments_legacy_dates;

          ALTER TABLE snowballadjustments RENAME TO snowballadjustments_legacy_dates;
          CREATE TABLE snowballadjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
          INSERT INTO snowballadjustments (id, user_id, date, amount)
            SELECT id, user_id, date, amount FROM snowballadjustments_legacy_dates;
          DROP TABLE snowballadjustments_legacy_dates;
        `);
      })();
    }
  }
];

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function applyMigrations(database) {
  ensureMigrationsTable(database);

  const appliedVersions = new Set(
    database.prepare("SELECT version FROM schema_migrations").all().map(row => row.version)
  );
  const recordMigration = database.prepare(`
    INSERT INTO schema_migrations (version, name)
    VALUES (@version, @name)
  `);

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    await migration.apply(database);
    recordMigration.run({
      version: migration.version,
      name: migration.name
    });
  }
}

await applyMigrations(db);

export { db };
