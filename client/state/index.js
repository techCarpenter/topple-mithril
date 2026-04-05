/** @import * as types from "../types" */

import m from "mithril";
import { accounts, extraPayments, snapshots, snowballAdjustments } from "../data/accounts";
import { getHistoricBalanceData, calculatePaydownSchedule, PAYDOWN_METHODS, dateSortAsc } from "../paydownData";

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
const Actions = (state) => {
  const actions = {
    initialize: async () => {
      try {
        await actions.fetchAccounts();
        actions.fetchPaydownData();
      } catch (error) {
        console.error("Failed to initialize account data:", error);
      } finally {
        m.redraw();
      }
    },
    fetchAccounts: async () => {
      const response = await fetch("/api/v1/loans", { method: "GET" });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status}`);
      }

      const data = await response.json();

      console.log("data", data);
      state.accounts = data;

      return data;
    },
    fetchPaydownData: () => {
      if (!Array.isArray(state.accounts) || state.accounts.length === 0) {
        return;
      }

      state.historicBalanceArray = getHistoricBalanceData(state.balanceSnapshots);

      console.log("historicBalanceArray", state.historicBalanceArray);

      let balanceHistory = state.historicBalanceArray.reduce((/** @type {Object[]} */acc, cur) => {
        acc = [...acc, ...cur.balances.map(bal => ({ date: cur.date, loanID: bal.loanID, balance: bal.balance }))];
        return acc;
      }, []);
      console.log("balanceHistory", balanceHistory);

      for (let i = 0; i < state.accounts.length; i++) {
        let loanId = state.accounts[i].id;
        console.log("loanId: ", loanId)
        let recentSnapshots = balanceHistory
          .filter(bal => bal.loanID === loanId);

        console.log("recentSnapshots", recentSnapshots);

        recentSnapshots.sort((a, b) => dateSortAsc(a.date, b.date)).reverse();

        if (recentSnapshots.length === 0) {
          continue;
        }

        let recentSnapshotDate = recentSnapshots[0];
        state.accounts[i].dateOpened = recentSnapshotDate.date;
        state.accounts[i].balance = recentSnapshotDate.balance;
        console.log(state.accounts);
      }

      state.paydownData = calculatePaydownSchedule(state.accounts, PAYDOWN_METHODS.snowball, state.snowball || 0, extraPayments, snowballAdjustments);
      // console.log(state.paydownData.accountPayoffOrder.map(payoff => `${state.accounts.filter(acc => acc.id === payoff.id)[0].name} - ${payoff.payoffDate.toISOString()}`).join("\n"));
    },
    setSnowball: (value) => {
      state.snowball = Number.isFinite(value) ? value : 0;
      actions.fetchPaydownData();
    }
  };

  return actions;
};

export const state = State();
export const actions = Actions(state);
