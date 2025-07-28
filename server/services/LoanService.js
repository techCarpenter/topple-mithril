/** @import * as types from "../types.js" */
import { db } from "../db.js";

const LoanService = {
  /**
   * @returns {Promise<types.Loan[]>}
   */
  getLoans: async () => {
    let query = db.prepare(`
      SELECT
        id,
        user_id as userId,
        name,
        apr,
        min_payment as minPayment,
        is_closed as isClosed
      FROM
        loans
      WHERE
        user_id = 1`);

    return /** @type {types.Loan[]} */ (query.all());
  },
  /**
   * @param {number} loanId
   */
  getLoanById: async (loanId) => {
    console.log(`Get loan with loanId = ${loanId}`)
    let query = db.prepare(`
      SELECT
        id,
        user_id as userId,
        name,
        apr,
        min_payment as minPayment,
        is_closed as isClosed
      FROM
        loans
      WHERE
        id = ${loanId} AND user_id = 1`);

    return /** @type {types.Loan} */ (query.get());
  },
  /**
   * @param {types.Loan[]} newLoans
   * @returns {Promise<types.Loan[]>}
   */
  addLoan: async (newLoans) => {
    let returnedLoans = [];

    let insertLoan = db.prepare(`
      INSERT INTO loans
        (user_id,
        name,
        apr,
        min_payment,
        is_closed)
      VALUES (
        1,
        @name,
        @apr,
        @minPayment,
        0
      ) RETURNING
       id,
       name,
       user_id AS userId,
       min_payment AS minPayment,
       is_closed AS isClosed;
      `);

    let insertLoans = db.transaction((loans) => {
      for (let i = 0; i < loans.length; i++) {
        returnedLoans = [insertLoan.get(loans[i]), ...returnedLoans];
      }
    });
    insertLoans(newLoans);
    return returnedLoans;
  },
  updateLoan: async (loan) => {
    let update = db.prepare(`
    UPDATE loans
    SET
      user_id = 1,
      name = @name,
      apr = @apr,
      min_payment = @minPayment,
      is_closed = @isClosed
    WHERE
      id = @id
    RETURNING
      id,
      user_id AS userId,
      name,
      apr,
      min_payment AS minPayment,
      is_closed AS isClosed;
    `);

    return update.get(loan);

  },
  deleteLoan: async (loanId) => { },
}

export { LoanService }