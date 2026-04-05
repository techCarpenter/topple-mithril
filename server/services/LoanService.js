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
        min_payment as minPayment
      FROM
        accounts
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
        min_payment as minPayment
      FROM
        accounts
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
      INSERT INTO accounts
        (user_id,
        name,
        apr,
        min_payment)
      VALUES (
        1,
        @name,
        @apr,
        @minPayment
      ) RETURNING
       id,
       name,
       user_id AS userId,
       min_payment AS minPayment;
      `);

    let insertLoans = db.transaction((loans) => {
      for (let i = 0; i < loans.length; i++) {
        returnedLoans = [insertLoan.get(loans[i]), ...returnedLoans];
      }
    });
    insertLoans(newLoans);
    return returnedLoans;
  },
  /**
   * @param {types.Loan} loan
   */
  updateLoan: async (loan) => {
    let update = db.prepare(`
    UPDATE accounts
    SET
      user_id = 1,
      name = @name,
      apr = @apr,
      min_payment = @minPayment
    WHERE
      id = @id
    RETURNING
      id,
      user_id AS userId,
      name,
      apr,
      min_payment AS minPayment;
    `);

    return update.get(loan);

  },
  /**
   * @param {Number} loanId
   */
  deleteLoan: async (loanId) => { console.warn("deleteAccount not implemented"); },
}

export { LoanService }