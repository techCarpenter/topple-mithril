/** @import * as types from "../types.js" */
import { db } from "../db.js";

const DEFAULT_USER_ID = 1;
const SNAPSHOT_COLUMNS = `
  id,
  user_id AS userId,
  account_id AS accountId,
  date,
  balance
`;

/**
 * @param {{ id?: number, accountId: number, date: number, balance: number }} snapshot
 */
function toSnapshotParams(snapshot) {
  return {
    id: snapshot.id,
    userId: DEFAULT_USER_ID,
    accountId: snapshot.accountId,
    date: snapshot.date,
    balance: snapshot.balance
  };
}

const SnapshotService = {
  /**
   * @returns {Promise<object[]>}
   */
  getSnapshots: async () => {
    const query = db.prepare(`
      SELECT
        ${SNAPSHOT_COLUMNS}
      FROM
        snapshots
      WHERE
        user_id = @userId
      ORDER BY
        date,
        id
    `);

    return query.all({ userId: DEFAULT_USER_ID });
  },
  /**
   * @param {number} snapshotId
   * @returns {Promise<object | null>}
   */
  getSnapshotById: async (snapshotId) => {
    const query = db.prepare(`
      SELECT
        ${SNAPSHOT_COLUMNS}
      FROM
        snapshots
      WHERE
        id = @snapshotId
        AND user_id = @userId
    `);

    return query.get({
      snapshotId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  },
  /**
   * @param {object[] | object} newSnapshots
   * @returns {Promise<object[]>}
   */
  addSnapshot: async (newSnapshots) => {
    const snapshots = Array.isArray(newSnapshots) ? newSnapshots : [newSnapshots];

    if (snapshots.length === 0) {
      return [];
    }

    const insertSnapshot = db.prepare(`
      INSERT INTO snapshots
        (user_id,
        account_id,
        date,
        balance)
      VALUES (
        @userId,
        @accountId,
        @date,
        @balance
      ) RETURNING
        ${SNAPSHOT_COLUMNS};
    `);

    const insertSnapshots = db.transaction((snapshotsToInsert) => {
      return snapshotsToInsert.map(snapshot => insertSnapshot.get(toSnapshotParams(snapshot)));
    });

    return insertSnapshots(snapshots);
  },
  /**
   * @param {object} snapshot
   * @returns {Promise<object | null>}
   */
  updateSnapshot: async (snapshot) => {
    const update = db.prepare(`
      UPDATE snapshots
      SET
        account_id = @accountId,
        date = @date,
        balance = @balance
      WHERE
        id = @id
        AND user_id = @userId
      RETURNING
        ${SNAPSHOT_COLUMNS};
    `);

    return update.get(toSnapshotParams(snapshot)) ?? null;
  },
  /**
   * @param {number} snapshotId
   * @returns {Promise<object | null>}
   */
  deleteSnapshot: async (snapshotId) => {
    const remove = db.prepare(`
      DELETE FROM snapshots
      WHERE
        id = @snapshotId
        AND user_id = @userId
      RETURNING
        ${SNAPSHOT_COLUMNS};
    `);

    return remove.get({
      snapshotId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  }
};

export { SnapshotService }
