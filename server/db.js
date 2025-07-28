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

readFile(SCHEMA_FILE_PATH)
  .then(file => db.exec(file.toString()))
  .catch(err => console.error(err));

export { db };