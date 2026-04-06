import Database from "better-sqlite3";
import { readFile } from "fs/promises";
import path from "path";

const SCHEMA_FILE_PATH = path.resolve("data", "schema.sql");
const DB_DEV_FILE_PATH = path.resolve("data", "topple-dev.db");
const DB_PROD_FILE_PATH = path.resolve("data", "topple-prod.db");
const DB_FILE_PATH = process.env.NODE_ENV === "production" ? DB_PROD_FILE_PATH : DB_DEV_FILE_PATH;

const db = new Database(DB_FILE_PATH, {
  fileMustExist: false,
  readonly: false,
  verbose: process.env.NODE_ENV === "production" ? undefined : console.log
});

//WAL mode for improved performance
db.pragma('journal_mode = WAL');

await readFile(SCHEMA_FILE_PATH)
  .then(file => db.exec(file.toString()))
  .catch(err => console.error(err));

function migrateSnowballAdjustmentsTable() {
  const columns = db.prepare("PRAGMA table_info(snowballadjustments)").all();
  const hasAccountId = columns.some(column => column.name === "account_id");

  if (!hasAccountId) {
    return;
  }

  db.transaction(() => {
    db.exec(`
      ALTER TABLE snowballadjustments RENAME TO snowballadjustments_legacy;

      CREATE TABLE snowballadjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date INTEGER NOT NULL,
        balance REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      INSERT INTO snowballadjustments (id, user_id, date, balance)
      SELECT id, user_id, date, balance
      FROM snowballadjustments_legacy;

      DROP TABLE snowballadjustments_legacy;
    `);
  })();
}

migrateSnowballAdjustmentsTable();

export { db };
