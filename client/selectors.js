/** @import * as types from "./types" */

import { calculatePaydownSchedule, currentBalance, getHistoricBalanceData, PAYDOWN_METHODS } from "./paydownData.js";

function createMemoizedSelector(projector) {
  let lastArgs = null;
  let lastResult = null;

  return (...args) => {
    if (
      lastArgs &&
      lastArgs.length === args.length &&
      lastArgs.every((arg, index) => arg === args[index])
    ) {
      return lastResult;
    }

    lastArgs = args;
    lastResult = projector(...args);
    return lastResult;
  };
}

function createEmptyPaydownData(paydownMethod = PAYDOWN_METHODS.snowball) {
  return {
    paymentArray: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    totalPaid: 0,
    accountPayoffOrder: [],
    startDate: new Date(),
    endDate: new Date(),
    monthsLeft: 0,
    paydownMethod,
    startingSnowball: 0,
    finalSnowball: 0
  };
}

const selectBalanceSnapshots = createMemoizedSelector((snapshots) => {
  /** @type {Map<number, types.SnapshotDetail>} */
  const groupedSnapshots = new Map();

  for (const snapshot of snapshots) {
    const snapshotDate = groupedSnapshots.get(snapshot.date);

    if (snapshotDate) {
      snapshotDate.balances.push({
        loanID: snapshot.accountId,
        balance: snapshot.balance
      });
      continue;
    }

    groupedSnapshots.set(snapshot.date, {
      date: new Date(snapshot.date),
      balances: [
        {
          loanID: snapshot.accountId,
          balance: snapshot.balance
        }
      ]
    });
  }

  return Array.from(groupedSnapshots.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, snapshot]) => snapshot);
});

const selectPayoffLoans = createMemoizedSelector((loans, snapshots) => {
  /** @type {Map<number, types.SnapshotRecord>} */
  const latestSnapshotByLoanId = new Map();

  for (const snapshot of snapshots) {
    const latestSnapshot = latestSnapshotByLoanId.get(snapshot.accountId);

    if (!latestSnapshot || snapshot.date > latestSnapshot.date) {
      latestSnapshotByLoanId.set(snapshot.accountId, snapshot);
    }
  }

  return loans.reduce((/** @type {types.Loan[]} */ payoffLoans, loan) => {
    const latestSnapshot = latestSnapshotByLoanId.get(loan.id);

    if (!latestSnapshot) {
      return payoffLoans;
    }

    payoffLoans.push({
      ...loan,
      balance: latestSnapshot.balance,
      payoffStartDate: new Date(latestSnapshot.date),
      lastSnapshot: new Date(latestSnapshot.date)
    });

    return payoffLoans;
  }, []);
});

const selectHistoricBalanceArray = createMemoizedSelector((balanceSnapshots) => {
  return getHistoricBalanceData(balanceSnapshots);
});

const selectPaydownData = createMemoizedSelector((payoffLoans, paydownMethod, snowball, extraPayments, snowballAdjustments) => {
  if (payoffLoans.length === 0) {
    return createEmptyPaydownData(paydownMethod);
  }

  return calculatePaydownSchedule(
    payoffLoans,
    paydownMethod,
    snowball || 0,
    extraPayments,
    snowballAdjustments
  );
});

const selectBaselinePaydownData = createMemoizedSelector((payoffLoans) => {
  if (payoffLoans.length === 0) {
    return createEmptyPaydownData(PAYDOWN_METHODS.minPayments);
  }

  return calculatePaydownSchedule(
    payoffLoans,
    PAYDOWN_METHODS.minPayments,
    0,
    [],
    []
  );
});

const selectPayoffTimeline = createMemoizedSelector((payoffLoans, paydownData) => {
  const loanNamesById = new Map(
    payoffLoans.map(loan => [String(loan.id), loan.name])
  );

  return paydownData.accountPayoffOrder.map((entry, index) => ({
    ...entry,
    order: index + 1,
    name: loanNamesById.get(String(entry.id)) || `Account ${entry.id}`
  }));
});

const selectAccountProjectionRows = createMemoizedSelector((payoffLoans, paydownData) => {
  const payoffById = new Map(
    paydownData.accountPayoffOrder.map(entry => [String(entry.id), entry])
  );
  const currentMonthBalance = new Map();

  const currentPeriod = paydownData.paymentArray.find(paymentPeriod => {
    const now = new Date();
    return paymentPeriod.date.getFullYear() === now.getFullYear() &&
      paymentPeriod.date.getMonth() === now.getMonth();
  });

  if (currentPeriod) {
    for (const payment of currentPeriod.payments) {
      currentMonthBalance.set(String(payment.loanID), payment.balance);
    }
  }

  return payoffLoans.map(loan => ({
    id: loan.id,
    name: loan.name,
    provider: loan.provider,
    apr: loan.apr,
    minPayment: loan.minPayment,
    currentBalance: currentMonthBalance.get(String(loan.id)) ?? loan.balance ?? 0,
    projectedPayoffDate: payoffById.get(String(loan.id))?.payoffDate ?? null
  }));
});

const selectPaydownComparison = createMemoizedSelector((paydownData, baselinePaydownData) => ({
  currentBalance: currentBalance(paydownData),
  interestSaved: baselinePaydownData.totalInterestPaid - paydownData.totalInterestPaid,
  totalSaved: baselinePaydownData.totalPaid - paydownData.totalPaid,
  monthsSaved: baselinePaydownData.monthsLeft - paydownData.monthsLeft
}));

function Selectors(state) {
  return {
    balanceSnapshots: () => selectBalanceSnapshots(state.snapshots),
    historicBalanceArray: () => selectHistoricBalanceArray(selectBalanceSnapshots(state.snapshots)),
    payoffLoans: () => selectPayoffLoans(state.loans, state.snapshots),
    paydownData: () => selectPaydownData(
      selectPayoffLoans(state.loans, state.snapshots),
      state.paydownMethod,
      state.snowball,
      state.extraPayments,
      state.snowballAdjustments
    ),
    baselinePaydownData: () => selectBaselinePaydownData(
      selectPayoffLoans(state.loans, state.snapshots)
    ),
    payoffTimeline: () => selectPayoffTimeline(
      selectPayoffLoans(state.loans, state.snapshots),
      selectPaydownData(
        selectPayoffLoans(state.loans, state.snapshots),
        state.paydownMethod,
        state.snowball,
        state.extraPayments,
        state.snowballAdjustments
      )
    ),
    accountProjectionRows: () => selectAccountProjectionRows(
      selectPayoffLoans(state.loans, state.snapshots),
      selectPaydownData(
        selectPayoffLoans(state.loans, state.snapshots),
        state.paydownMethod,
        state.snowball,
        state.extraPayments,
        state.snowballAdjustments
      )
    ),
    paydownComparison: () => selectPaydownComparison(
      selectPaydownData(
        selectPayoffLoans(state.loans, state.snapshots),
        state.paydownMethod,
        state.snowball,
        state.extraPayments,
        state.snowballAdjustments
      ),
      selectBaselinePaydownData(
        selectPayoffLoans(state.loans, state.snapshots)
      )
    )
  };
}

export { Selectors };
