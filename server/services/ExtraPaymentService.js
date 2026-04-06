import { db } from "../db.js";

const DEFAULT_USER_ID = 1;
const EXTRA_PAYMENT_COLUMNS = `
  id,
  user_id AS userId,
  date,
  amount
`;

/**
 * @param {{ id?: number, date: number, amount: number }} extraPayment
 */
function toExtraPaymentParams(extraPayment) {
  return {
    id: extraPayment.id,
    userId: DEFAULT_USER_ID,
    date: extraPayment.date,
    amount: extraPayment.amount
  };
}

const ExtraPaymentService = {
  /**
   * @returns {Promise<object[]>}
   */
  getExtraPayments: async () => {
    const query = db.prepare(`
      SELECT
        ${EXTRA_PAYMENT_COLUMNS}
      FROM
        extrapayments
      WHERE
        user_id = @userId
      ORDER BY
        date,
        id
    `);

    return query.all({ userId: DEFAULT_USER_ID });
  },
  /**
   * @param {number} extraPaymentId
   * @returns {Promise<object | null>}
   */
  getExtraPaymentById: async (extraPaymentId) => {
    const query = db.prepare(`
      SELECT
        ${EXTRA_PAYMENT_COLUMNS}
      FROM
        extrapayments
      WHERE
        id = @extraPaymentId
        AND user_id = @userId
    `);

    return query.get({
      extraPaymentId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  },
  /**
   * @param {object[] | object} newExtraPayments
   * @returns {Promise<object[]>}
   */
  addExtraPayment: async (newExtraPayments) => {
    const extraPayments = Array.isArray(newExtraPayments) ? newExtraPayments : [newExtraPayments];

    if (extraPayments.length === 0) {
      return [];
    }

    const insertExtraPayment = db.prepare(`
      INSERT INTO extrapayments
        (user_id,
        date,
        amount)
      VALUES (
        @userId,
        @date,
        @amount
      ) RETURNING
        ${EXTRA_PAYMENT_COLUMNS};
    `);

    const insertExtraPayments = db.transaction((extraPaymentsToInsert) => {
      return extraPaymentsToInsert.map(extraPayment => insertExtraPayment.get(toExtraPaymentParams(extraPayment)));
    });

    return insertExtraPayments(extraPayments);
  },
  /**
   * @param {object} extraPayment
   * @returns {Promise<object | null>}
   */
  updateExtraPayment: async (extraPayment) => {
    const update = db.prepare(`
      UPDATE extrapayments
      SET
        date = @date,
        amount = @amount
      WHERE
        id = @id
        AND user_id = @userId
      RETURNING
        ${EXTRA_PAYMENT_COLUMNS};
    `);

    return update.get(toExtraPaymentParams(extraPayment)) ?? null;
  },
  /**
   * @param {number} extraPaymentId
   * @returns {Promise<object | null>}
   */
  deleteExtraPayment: async (extraPaymentId) => {
    const remove = db.prepare(`
      DELETE FROM extrapayments
      WHERE
        id = @extraPaymentId
        AND user_id = @userId
      RETURNING
        ${EXTRA_PAYMENT_COLUMNS};
    `);

    return remove.get({
      extraPaymentId,
      userId: DEFAULT_USER_ID
    }) ?? null;
  }
};

export { ExtraPaymentService }
