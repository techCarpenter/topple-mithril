/** @import * as types from "../types" */

import { accounts, snapshots } from "../data/accounts";
import { getHistoricBalanceData, getFuturePaydownData, PAYDOWN_METHODS, dateSortAsc } from "../paydownData";

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
  historicBalanceArray: [],
  accounts: accounts,
  balanceSnapshots: snapshots
});

/**
 * 
 * @param {types.State} state
 * @returns 
 */
const Actions = (state) => ({
  fetchPaydownData: () => {
    state.historicBalanceArray = getHistoricBalanceData(state.balanceSnapshots);

    let balanceHistory = state.historicBalanceArray.reduce((acc, cur) => {
      acc = [...acc, ...cur.balances.map(bal => ({ date: cur.date, loanID: bal.loanID, balance: bal.balance }))];
      return acc;
    }, []);

    for (let i = 0; i < state.accounts.length; i++) {
      let loanId = state.accounts[i].id;
      let recentSnapshots = balanceHistory
        .filter(bal => bal.loanID === loanId);

      recentSnapshots.sort((a, b) => dateSortAsc(a.date, b.date)).reverse();

      let recentSnapshotDate = recentSnapshots[0];
      state.accounts[i].dateOpened = recentSnapshotDate.date;
      state.accounts[i].balance = recentSnapshotDate.balance;
    }

    state.paydownData = getFuturePaydownData(state.accounts, PAYDOWN_METHODS.snowball, state.snowball || 0);
  },
  setSnowball: (value) => state.snowball = value
});

export const state = State();
export const actions = Actions(state);