import Database from "better-sqlite3";
import path from "path";

import {
  accounts,
  extraPayments,
  snapshots,
  snowballAdjustments
} from "../client/data/accounts.js";

const DEFAULT_USER_ID = 1;
const DB_FILE_PATH = path.resolve("data", "topple-dev.db");

function toTimestamp(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const isoCandidate = new Date(value);

    if (!Number.isNaN(isoCandidate.getTime())) {
      return isoCandidate.getTime();
    }

    const [month, day, year] = value.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  throw new Error(`Unsupported date value: ${value}`);
}

const db = new Database(DB_FILE_PATH);
db.pragma("foreign_keys = ON");

const existingUser = db.prepare(`
  SELECT id
  FROM users
  WHERE id = ?
`).get(DEFAULT_USER_ID);

if (!existingUser) {
  throw new Error(`Expected user ${DEFAULT_USER_ID} to exist in ${DB_FILE_PATH}`);
}

const existingAccountIds = new Set(
  db.prepare(`
    SELECT id
    FROM accounts
    WHERE user_id = ?
  `).all(DEFAULT_USER_ID).map(account => account.id)
);

const flattenedSnapshots = snapshots.flatMap(snapshot =>
  snapshot.balances.map(balance => ({
    userId: DEFAULT_USER_ID,
    accountId: balance.loanID,
    date: toTimestamp(snapshot.date),
    balance: balance.balance
  }))
);

const validSnapshots = flattenedSnapshots.filter(snapshot => existingAccountIds.has(snapshot.accountId));

const normalizedExtraPayments = extraPayments.map(payment => ({
  userId: DEFAULT_USER_ID,
  date: toTimestamp(payment.date),
  amount: payment.amount
}));

const normalizedSnowballAdjustments = snowballAdjustments.map(adjustment => ({
  userId: DEFAULT_USER_ID,
  date: toTimestamp(adjustment.date),
  amount: adjustment.amount
}));

const reseed = db.transaction(() => {
  db.prepare("DELETE FROM snapshots WHERE user_id = ?").run(DEFAULT_USER_ID);
  db.prepare("DELETE FROM extrapayments WHERE user_id = ?").run(DEFAULT_USER_ID);
  db.prepare("DELETE FROM snowballadjustments WHERE user_id = ?").run(DEFAULT_USER_ID);

  const insertSnapshot = db.prepare(`
    INSERT INTO snapshots (user_id, account_id, date, balance)
    VALUES (@userId, @accountId, @date, @balance)
  `);

  const insertExtraPayment = db.prepare(`
    INSERT INTO extrapayments (user_id, date, amount)
    VALUES (@userId, @date, @amount)
  `);

  const insertSnowballAdjustment = db.prepare(`
    INSERT INTO snowballadjustments (user_id, date, amount)
    VALUES (@userId, @date, @amount)
  `);

  for (const snapshot of validSnapshots) {
    insertSnapshot.run(snapshot);
  }

  for (const payment of normalizedExtraPayments) {
    insertExtraPayment.run(payment);
  }

  for (const adjustment of normalizedSnowballAdjustments) {
    insertSnowballAdjustment.run(adjustment);
  }
});

reseed();

console.log(`Seeded ${validSnapshots.length} snapshots into ${DB_FILE_PATH}`);
console.log(`Seeded ${normalizedExtraPayments.length} extra payments into ${DB_FILE_PATH}`);
console.log(`Seeded ${normalizedSnowballAdjustments.length} snowball adjustments into ${DB_FILE_PATH}`);
console.log(`Mock accounts exported in client/data/accounts.js: ${accounts.length}`);
