import { db } from "../db.js";

const DEFAULT_USER_ID = 1;
const SNOWBALL_ADJUSTMENT_COLUMNS = `
  id,
  user_id AS userId,
  date,
  balance AS amount
`;

/**
 * @param {{ id?: number, date: number, amount: number }} snowballAdjustment
 */
function toSnowballAdjustmentParams(snowballAdjustment) {
  return {
    id: snowballAdjustment.id,
    userId: DEFAULT_USER_ID,
    date: snowballAdjustment.date,
    amount: snowballAdjustment.amount
  };
}

const SnowballAdjustmentService = {
  /**
   * @returns {Promise<object[]>}
   */
  getSnowballAdjustments: async () => {
    const query = db.prepare(`
      SELECT
        ${SNOWBALL_ADJUSTMENT_COLUMNS}
      FROM
        snowballadjustments
      WHERE
        user_id = @userId
      ORDER BY
        date,
        id
    `);

    return query.all({ userId: DEFAULT_USER_ID });
  },
  /**
   * @param {number} snowballAdjustmentId
   * @returns {Promise<object | null>}
   */
  getSnowballAdjustmentById: async (snowballAdjustmentId) => {
    const query = db.prepare(`
      SELECT
        ${SNOWBALL_ADJUSTMENT_COLUMNS}
      FROM
        snowballadjustments
      WHERE
        id = @snowballAdjustmentId
        AND user_id = @userId
    `);

    return query.get({
      snowballAdjustmentId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  },
  /**
   * @param {object[] | object} newSnowballAdjustments
   * @returns {Promise<object[]>}
   */
  addSnowballAdjustment: async (newSnowballAdjustments) => {
    const snowballAdjustments = Array.isArray(newSnowballAdjustments) ? newSnowballAdjustments : [newSnowballAdjustments];

    if (snowballAdjustments.length === 0) {
      return [];
    }

    const insertSnowballAdjustment = db.prepare(`
      INSERT INTO snowballadjustments
        (user_id,
        date,
        balance)
      VALUES (
        @userId,
        @date,
        @amount
      ) RETURNING
        ${SNOWBALL_ADJUSTMENT_COLUMNS};
    `);

    const insertSnowballAdjustments = db.transaction((snowballAdjustmentsToInsert) => {
      return snowballAdjustmentsToInsert.map(snowballAdjustment => insertSnowballAdjustment.get(toSnowballAdjustmentParams(snowballAdjustment)));
    });

    return insertSnowballAdjustments(snowballAdjustments);
  },
  /**
   * @param {object} snowballAdjustment
   * @returns {Promise<object | null>}
   */
  updateSnowballAdjustment: async (snowballAdjustment) => {
    const update = db.prepare(`
      UPDATE snowballadjustments
      SET
        date = @date,
        balance = @amount
      WHERE
        id = @id
        AND user_id = @userId
      RETURNING
        ${SNOWBALL_ADJUSTMENT_COLUMNS};
    `);

    return update.get(toSnowballAdjustmentParams(snowballAdjustment)) ?? null;
  },
  /**
   * @param {number} snowballAdjustmentId
   * @returns {Promise<object | null>}
   */
  deleteSnowballAdjustment: async (snowballAdjustmentId) => {
    const remove = db.prepare(`
      DELETE FROM snowballadjustments
      WHERE
        id = @snowballAdjustmentId
        AND user_id = @userId
      RETURNING
        ${SNOWBALL_ADJUSTMENT_COLUMNS};
    `);

    return remove.get({
      snowballAdjustmentId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  }
};

export { SnowballAdjustmentService }
