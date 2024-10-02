/** @import * as types from "../types" */

import { accounts } from "../data/accounts";
import { getTotalPaymentData, PAYDOWN_METHODS } from "../paydownData";

/**
 * 
 * @returns {types.State}
 */
const State = () => ({
  snowball: 0,
  paydownData: {
    paymentArray: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    totalPaid: 0,
    accountPayoffOrder: [],
    startDate: new Date(),
    endDate: new Date(),
    monthsLeft: 0,
    paydownMethod: "",
    startingSnowball: 0,
    finalSnowball: 0
  },
  accounts: accounts,
});

/**
 * 
 * @param {types.State} state
 * @returns 
 */
const Actions = (state) => ({
  fetchPaydownData: () => {
    state.paydownData = getTotalPaymentData(state.accounts, PAYDOWN_METHODS.snowball, state.snowball || 0);
  },
  setSnowball: (value) => state.snowball = value
});

export const state = State();
export const actions = Actions(state);