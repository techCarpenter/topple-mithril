/** @import * as types from "../types.js" */
import { db } from "../db.js";

const DEFAULT_USER_ID = 1;
const LOAN_COLUMNS = `
  id,
  user_id AS userId,
  name,
  provider,
  apr,
  min_payment AS minPayment
`;

/**
 * @param {types.Loan | undefined} loan
 * @returns {types.Loan | null}
 */
function normalizeLoan(loan) {
  if (!loan) {
    return null;
  }

  return {
    ...loan,
    provider: loan.provider ?? ""
  };
}

/**
 * @param {types.Loan} loan
 */
function toLoanParams(loan) {
  return {
    id: loan.id,
    userId: DEFAULT_USER_ID,
    name: loan.name,
    provider: loan.provider?.trim() || null,
    apr: loan.apr,
    minPayment: loan.minPayment
  };
}

const LoanService = {
  /**
   * @returns {Promise<types.Loan[]>}
   */
  getLoans: async () => {
    const query = db.prepare(`
      SELECT
        ${LOAN_COLUMNS}
      FROM
        accounts
      WHERE
        user_id = @userId
      ORDER BY
        id`);

    return /** @type {types.Loan[]} */ (
      query.all({ userId: DEFAULT_USER_ID }).map(normalizeLoan)
    );
  },
  /**
   * @param {number} loanId
   * @returns {Promise<types.Loan | null>}
   */
  getLoanById: async (loanId) => {
    const query = db.prepare(`
      SELECT
        ${LOAN_COLUMNS}
      FROM
        accounts
      WHERE
        id = @loanId
        AND user_id = @userId`);

    return normalizeLoan(query.get({
      loanId,
      userId: DEFAULT_USER_ID
    }));
  },
  /**
   * @param {types.Loan[] | types.Loan} newLoans
   * @returns {Promise<types.Loan[]>}
   */
  addLoan: async (newLoans) => {
    const loans = Array.isArray(newLoans) ? newLoans : [newLoans];

    if (loans.length === 0) {
      return [];
    }

    const insertLoan = db.prepare(`
      INSERT INTO accounts
        (user_id,
        name,
        provider,
        apr,
        min_payment)
      VALUES (
        @userId,
        @name,
        @provider,
        @apr,
        @minPayment
      ) RETURNING
       ${LOAN_COLUMNS};
      `);

    const insertLoans = db.transaction((loansToInsert) => {
      return loansToInsert.map(loan => normalizeLoan(insertLoan.get(toLoanParams(loan))));
    });

    return /** @type {types.Loan[]} */ (insertLoans(loans));
  },
  /**
   * @param {types.Loan} loan
   * @returns {Promise<types.Loan | null>}
   */
  updateLoan: async (loan) => {
    const update = db.prepare(`
    UPDATE accounts
    SET
      name = @name,
      provider = @provider,
      apr = @apr,
      min_payment = @minPayment
    WHERE
      id = @id
      AND user_id = @userId
    RETURNING
      ${LOAN_COLUMNS};
    `);

    return normalizeLoan(update.get(toLoanParams(loan)));
  },
  /**
   * @param {number} loanId
   * @returns {Promise<types.Loan | null>}
   */
  deleteLoan: async (loanId) => {
    const remove = db.prepare(`
      DELETE FROM accounts
      WHERE
        id = @loanId
        AND user_id = @userId
      RETURNING
        ${LOAN_COLUMNS};
    `);

    return normalizeLoan(remove.get({
      loanId,
      userId: DEFAULT_USER_ID
    }));
  },
}

export { LoanService }
