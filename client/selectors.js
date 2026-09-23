/** @import * as types from "./types" */

import { calculatePaydownSchedule, currentBalance, dateFromString, dateStringFromDate, getHistoricBalanceData, PAYDOWN_METHODS } from "./paydownData.js";

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

function createEmptyPaydownData(paydownMethod, asOfDate) {
  return {
    paymentArray: [],
    totalInterestPaid: 0,
    totalPrincipalPaid: 0,
    totalPaid: 0,
    accountPayoffOrder: [],
    startDate: asOfDate,
    endDate: asOfDate,
    monthsLeft: 0,
    paydownMethod,
    startingSnowball: 0,
    finalSnowball: 0,
    errors: [],
    startingBalances: []
  };
}

const selectBalanceSnapshots = createMemoizedSelector((snapshots) => {
  /** @type {Map<number, types.SnapshotDetail>} */
  const groupedSnapshots = new Map();

  for (const snapshot of snapshots) {
    const key = dateStringFromDate(dateFromString(snapshot.date));
    const snapshotDate = groupedSnapshots.get(key);

    if (snapshotDate) {
      snapshotDate.balances.push({
        loanID: snapshot.accountId,
        balance: snapshot.balance
      });
      continue;
    }

    groupedSnapshots.set(key, {
      date: dateFromString(snapshot.date),
      balances: [
        {
          loanID: snapshot.accountId,
          balance: snapshot.balance
        }
      ]
    });
  }

  return Array.from(groupedSnapshots.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
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
      payoffStartDate: dateFromString(latestSnapshot.date),
      lastSnapshot: dateFromString(latestSnapshot.date)
    });

    return payoffLoans;
  }, []);
});

const selectHistoricBalanceArray = createMemoizedSelector((balanceSnapshots) => {
  return getHistoricBalanceData(balanceSnapshots);
});

const selectPaydownData = createMemoizedSelector((payoffLoans, paydownMethod, snowball, extraPayments, snowballAdjustments, asOfDate) => {
  if (payoffLoans.length === 0) {
    return createEmptyPaydownData(paydownMethod, asOfDate);
  }

  return calculatePaydownSchedule(
    payoffLoans,
    paydownMethod,
    snowball || 0,
    extraPayments,
    snowballAdjustments,
    asOfDate
  );
});

const selectBaselinePaydownData = createMemoizedSelector((payoffLoans, asOfDate) => {
  if (payoffLoans.length === 0) {
    return createEmptyPaydownData(PAYDOWN_METHODS.minPayments, asOfDate);
  }

  return calculatePaydownSchedule(
    payoffLoans,
    PAYDOWN_METHODS.minPayments,
    0,
    [],
    [],
    asOfDate
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

const selectAccountProjectionRows = createMemoizedSelector((payoffLoans, paydownData, asOfDate) => {
  const payoffById = new Map(
    paydownData.accountPayoffOrder.map(entry => [String(entry.id), entry])
  );
  const currentMonthBalance = new Map();

  const currentPeriod = paydownData.paymentArray.find(paymentPeriod => {
    return paymentPeriod.date.getFullYear() === asOfDate.getFullYear() &&
      paymentPeriod.date.getMonth() === asOfDate.getMonth();
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
    lastSnapshot: loan.lastSnapshot,
    recordedBalance: loan.balance,
    estimatedBalance: paydownData.errors?.length ? null : (
      currentMonthBalance.get(String(loan.id)) ??
      (payoffById.get(String(loan.id))?.payoffDate <= asOfDate ? 0 : null)
    ),
    projectedPayoffDate: payoffById.get(String(loan.id))?.payoffDate ?? null
  }));
});

const selectPaydownComparison = createMemoizedSelector((paydownData, baselinePaydownData, asOfDate) => ({
  currentBalance: currentBalance(paydownData, asOfDate),
  interestSaved: baselinePaydownData.totalInterestPaid - paydownData.totalInterestPaid,
  totalSaved: baselinePaydownData.totalPaid - paydownData.totalPaid,
  monthsSaved: baselinePaydownData.monthsLeft - paydownData.monthsLeft
}));

function Selectors(state, clock = () => new Date()) {
  let cachedAsOfDate;
  function getAsOfDate() {
    const today = dateFromString(dateStringFromDate(clock()));
    if (!cachedAsOfDate || today.getTime() !== cachedAsOfDate.getTime()) cachedAsOfDate = today;
    return cachedAsOfDate;
  }
  const payoffLoans = () => selectPayoffLoans(state.loans, state.snapshots);
  const paydownData = (asOfDate = getAsOfDate()) => selectPaydownData(
    payoffLoans(), state.paydownMethod, state.snowball, state.extraPayments,
    state.snowballAdjustments, asOfDate
  );
  const baselinePaydownData = (asOfDate = getAsOfDate()) => selectBaselinePaydownData(payoffLoans(), asOfDate);

  return {
    asOfDate: getAsOfDate,
    balanceSnapshots: () => selectBalanceSnapshots(state.snapshots),
    historicBalanceArray: () => selectHistoricBalanceArray(selectBalanceSnapshots(state.snapshots)),
    payoffLoans,
    paydownData,
    baselinePaydownData,
    payoffTimeline: () => selectPayoffTimeline(payoffLoans(), paydownData()),
    accountProjectionRows: () => {
      const asOfDate = getAsOfDate();
      return selectAccountProjectionRows(payoffLoans(), paydownData(asOfDate), asOfDate);
    },
    paydownComparison: () => {
      const asOfDate = getAsOfDate();
      return selectPaydownComparison(paydownData(asOfDate), baselinePaydownData(asOfDate), asOfDate);
    }
  };
}

export { Selectors };
