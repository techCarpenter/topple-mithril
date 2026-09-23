// Refactored paydownData.js
// New (with Changes)
/** @import * as types from "./types" */

// Constants
const PAYDOWN_METHODS = {
  avalanche: "avalanche",
  snowball: "snowball",
  minPayments: "minPayments"
};

const PERCENT_TO_DECIMAL = 100;
const APR_TO_MONTHLY_RATE_DIVISOR = 1200; // 12 months * 100 for percentage
const DECEMBER_MONTH_INDEX = 11;

/**
 * Gets the full string value of the month by number
 * @param {number} monthInt The number denoting the month (0-11)
 * @returns {string} The name of the corresponding month
 */
function getMonthString(monthInt) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[monthInt] || "December";
}

/**
 * Calculates all payment data for loans.
 * @param {types.Loan[]} loans Array of loans
 * @param {string} paydownMethod String to set paydown method
 * @param {number} initSnowball Starting snowball payment amount (default is 0)
 * @param {types.ExtraPayment[]} oneTimePayments Extra one-off payments
 * @param {types.ExtraPayment[]} snowballAdjustments Adjustments to the monthly snowball
 * @returns {types.PaydownDataDetail} An array of payment details with the date and an array of payments
 */
function calculatePaydownSchedule(
  loans,
  paydownMethod = PAYDOWN_METHODS.snowball,
  initSnowball = 0,
  oneTimePayments = [],
  snowballAdjustments = [],
  asOfDate,
  maxMonths = 1200
) {
  const failure = (message) => ({ paymentArray: [], totalInterestPaid: 0, totalPrincipalPaid: 0, totalPaid: 0, accountPayoffOrder: [], startDate: asOfDate, endDate: asOfDate, monthsLeft: 0, paydownMethod, startingSnowball: initSnowball, finalSnowball: initSnowball, errors: [message], startingBalances: [] });
  if (!Array.isArray(loans) || loans.length === 0) return failure("Add at least one account with a balance observation.");
  if (!(asOfDate instanceof Date) || Number.isNaN(asOfDate.getTime())) return failure("Choose a valid as-of date.");
  if (!Number.isFinite(initSnowball) || initSnowball < 0 || !Number.isInteger(maxMonths) || maxMonths < 1 || maxMonths > 1200) return failure("Extra payments and projection horizon must be valid non-negative amounts and at most 1200 months.");
  if (![PAYDOWN_METHODS.avalanche, PAYDOWN_METHODS.snowball, PAYDOWN_METHODS.minPayments].includes(paydownMethod)) return failure(`Invalid paydown method: ${paydownMethod}`);
  const validLoan = loan => Number.isFinite(loan.balance) && loan.balance >= 0 && Number.isFinite(loan.apr) && loan.apr >= 0 && loan.apr <= 1000 && Number.isFinite(loan.minPayment) && loan.minPayment > 0 && loan.payoffStartDate instanceof Date && !Number.isNaN(loan.payoffStartDate.getTime());
  if (loans.some(loan => !validLoan(loan) || roundCents(loan.minPayment) <= 0)) return failure("Loans need valid dates, non-negative balances, APRs from 0% to 1000%, and positive cent-level minimum payments.");
  if (loans.some(loan => loan.payoffStartDate > asOfDate)) return failure("A balance observation is later than the projection as-of date.");
  if ([...oneTimePayments, ...snowballAdjustments].some(item => !(item.date instanceof Date) || Number.isNaN(item.date.getTime()) || !Number.isFinite(item.amount) || item.amount < 0)) return failure("One-time payments and snowball adjustments need valid dates and non-negative amounts.");
  if (loans.some(loan => loan.balance > 0 && loan.minPayment <= roundCents(loan.balance * loan.apr / APR_TO_MONTHLY_RATE_DIVISOR))) return failure("A minimum payment does not cover monthly interest; the balance will not amortize.");

  let accountPayoffOrder = [], allPaymentData = [], snowballAmount = 0;
  let loansCopy = deepCopy(loans).map(loan => ({ ...loan, balance: roundCents(loan.balance), minPayment: roundCents(loan.minPayment) }));
  const startDate = new Date(Math.min(...loansCopy.map(loan => loan.payoffStartDate.getTime())));
  let currentYear = startDate.getFullYear(), currentMonth = startDate.getMonth(), monthsLeft = 0;
  const nowMonth = asOfDate.getMonth(), nowYear = asOfDate.getFullYear();
  loansCopy = prioritizeLoans(loansCopy, paydownMethod);
  const startingBalances = loansCopy.map(loan => ({ id: loan.id, date: new Date(loan.payoffStartDate), balance: loan.balance }));
  if (loansCopy.every(loan => loan.balance === 0)) {
    return {
      paymentArray: [{ date: startDate, payments: loansCopy.map(loan => ({ loanID: loan.id, balance: 0, interestPaid: 0, principalPaid: 0, totalPaid: 0 })) }],
      totalInterestPaid: 0, totalPrincipalPaid: 0, totalPaid: 0,
      accountPayoffOrder: loansCopy.map(loan => ({ id: loan.id, payoffDate: loan.payoffStartDate, newSnowball: 0 })),
      startDate, endDate: startDate, monthsLeft: 0, paydownMethod, startingSnowball: initSnowball,
      finalSnowball: initSnowball, errors: [], startingBalances, alreadyPaidOff: true
    };
  }
  let periods = 0;
  do {
    if (periods >= maxMonths) return { ...failure(`Projection exceeded its ${maxMonths}-month horizon.`), paymentArray: allPaymentData, accountPayoffOrder, startDate, monthsLeft, startingBalances };
    periods++;
    if (currentYear === nowYear && currentMonth === nowMonth) snowballAmount += initSnowball;
    const currentMonthSnowballAdjustments = snowballAdjustments.filter(change => change.date.getFullYear() === currentYear && change.date.getMonth() === currentMonth);
    snowballAmount = roundCents(snowballAmount + currentMonthSnowballAdjustments.reduce((sum, change) => sum + change.amount, 0));
    if (isCurrentOrFutureMonth(currentMonth, currentYear, nowMonth, nowYear)) monthsLeft++;
    let extraPayment, currentPaymentObj;
    ({ loans: loansCopy, extraPayment, paymentObj: currentPaymentObj } = calculateMonthlyPaymentDetails(loansCopy, currentMonth, currentYear));
    ({ loans: loansCopy, paymentObj: currentPaymentObj } = applyExtraPayments(currentPaymentObj, extraPayment, snowballAmount, paydownMethod, startDate, loansCopy, oneTimePayments));
    loansCopy = loansCopy.filter(loan => {
      if (loan.balance <= 0) {
        snowballAmount = roundCents(snowballAmount + loan.minPayment);
        accountPayoffOrder.push({ id: loan.id, payoffDate: currentPaymentObj.date, newSnowball: snowballAmount });
        return false;
      }
      return true;
    });
    loansCopy = prioritizeLoans(loansCopy, paydownMethod);
    allPaymentData.push(currentPaymentObj);
    ({ currentMonth, currentYear } = getNextMonthYear(currentMonth, currentYear));
  } while (loansCopy.length > 0);

  const totalInterestPaid = roundCents(getTotalInterestPaid(allPaymentData));
  const totalPrincipalPaid = roundCents(getTotalPrincipalPaid(allPaymentData));
  const totalPaid = roundCents(totalInterestPaid + totalPrincipalPaid);

  return {
    paymentArray: allPaymentData,
    totalInterestPaid,
    totalPrincipalPaid,
    totalPaid,
    accountPayoffOrder,
    startDate,
    endDate: new Date(currentYear, currentMonth, 1),
    monthsLeft,
    paydownMethod,
    startingSnowball: initSnowball,
    finalSnowball: snowballAmount,
    errors: [], startingBalances, alreadyPaidOff: false
  };
}

function roundCents(amount) { return Math.round((amount + Number.EPSILON) * 100) / 100; }

/**
 * Checks if the given month/year is current or future relative to now
 * @param {number} month Month to check (0-11)
 * @param {number} year Year to check
 * @param {number} nowMonth Current month
 * @param {number} nowYear Current year
 * @returns {boolean} True if month/year is current or future
 */
function isCurrentOrFutureMonth(month, year, nowMonth, nowYear) {
  return year > nowYear || (year === nowYear && month >= nowMonth);
}

/**
 * Checks if this is the first payment period (same as start date)
 * @param {Date} paymentDate Current payment date
 * @param {Date} startDate Start date of loan schedule
 * @returns {boolean} True if this is the first payment period
 */
function isFirstPaymentPeriod(paymentDate, startDate) {
  return paymentDate.getFullYear() === startDate.getFullYear() &&
    paymentDate.getMonth() === startDate.getMonth();
}

/**
 * Determines if extra payments should be applied for this payment period
 * @param {types.PayPeriodDetail} paymentObj Current payment period
 * @param {number} extraPayment Extra payment amount
 * @param {number} snowballAmount Snowball amount
 * @param {string} paydownMethod Payment method
 * @param {Date} startDate Start date
 * @returns {boolean} True if extra payments should be applied
 */
function shouldApplyExtraPayments(paymentObj, extraPayment, snowballAmount, paydownMethod, startDate) {
  return paymentObj.payments.length > 0 &&
    (extraPayment > 0 || snowballAmount > 0) &&
    paydownMethod !== PAYDOWN_METHODS.minPayments &&
    !isFirstPaymentPeriod(paymentObj.date, startDate);
}

/**
 * Generates historic balance data with filled gaps
 * @param {types.SnapshotDetail[]} balanceSnapshots Array of balance snapshots
 * @returns {types.SnapshotDetail[]} Complete array with filled gaps
 */
function getHistoricBalanceData(balanceSnapshots) {
  if (!Array.isArray(balanceSnapshots) || balanceSnapshots.length === 0) {
    return [];
  }

  let /** @type {types.SnapshotDetail[]} */ snapshotsCopy = deepCopy(balanceSnapshots),
    startDate = snapshotsCopy.map(snap => snap.date).sort(dateSortAsc)[0],
    currentYear = startDate.getFullYear(),
    currentMonth = startDate.getMonth(),
    lastSnapshotTime = Math.max(...snapshotsCopy.map(a => a.date.getTime())),
    lastSnapshotMonth = new Date(lastSnapshotTime).getMonth(),
    lastSnapshotYear = new Date(lastSnapshotTime).getFullYear(),
    balanceArray = [],
    currentSnapshot = null;

  do {
    currentSnapshot = snapshotsCopy.find(snap =>
      snap.date.getMonth() === currentMonth &&
      snap.date.getFullYear() === currentYear
    );

    balanceArray.push(currentSnapshot ?? {
      date: new Date(currentYear, currentMonth, 1),
      balances: []
    });

    ({ currentMonth, currentYear } = getNextMonthYear(currentMonth, currentYear));
  } while (new Date(currentYear, currentMonth, 1) <= new Date(lastSnapshotYear, lastSnapshotMonth, 1));

  return balanceArray;
}

/**
 * Calculates total interest paid across all payments
 * @param {types.PayPeriodDetail[]} allPaymentData Array of payment periods
 * @returns {number} Total interest paid
 */
function getTotalInterestPaid(allPaymentData) {
  const allPayments = allPaymentData.reduce((
    /** @type {types.PaymentDetail[]} */ acc,
    cur
  ) => {
    return [...acc, ...cur.payments];
  }, []);

  return allPayments.reduce((acc, cur) => acc + cur.interestPaid, 0);
}

/**
 * Calculates total principal paid across all payments
 * @param {types.PayPeriodDetail[]} allPaymentData Array of payment periods
 * @returns {number} Total principal paid
 */
function getTotalPrincipalPaid(allPaymentData) {
  const allPayments = allPaymentData.reduce((
    /** @type {types.PaymentDetail[]} */ acc,
    cur
  ) => {
    return [...acc, ...cur.payments];
  }, []);

  return allPayments.reduce((acc, cur) => acc + cur.principalPaid, 0);
}

/**
 * Calculates interest and principal components of a payment
 * @param {types.Loan} loan The loan being paid
 * @param {number} ratePerMonth Monthly interest rate
 * @returns {Object} Object with curMonthInterest and curMonthPrincipal
 */
function calculateInterestAndPrincipal(loan, ratePerMonth) {
  const curMonthInterest = roundCents(loan.balance * ratePerMonth);
  const curMonthPrincipal = roundCents(loan.minPayment - curMonthInterest);
  return { curMonthInterest, curMonthPrincipal };
}

/**
 * Applies extra payments to loans using the snowball method.
 * Extra payments are applied to the loan with highest priority first,
 * then cascaded down to lower priority loans if amount remains.
 * 
 * @param {types.PayPeriodDetail} paymentObj Current payment period details
 * @param {number} extraPayment Additional payment amount available
 * @param {number} snowballAmount Accumulated snowball from paid-off loans
 * @param {string} paydownMethod Payment method being used
 * @param {Date} startDate Start date of payment schedule
 * @param {types.Loan[]} loans Array of current loans
 * @param {types.ExtraPayment[]} oneTimePayments Array of one-time payments
 * @returns {types.ExtraPaymentReturn} Updated loans and payment object
 */
function applyExtraPayments(
  paymentObj,
  extraPayment,
  snowballAmount,
  paydownMethod,
  startDate,
  loans,
  oneTimePayments = []
) {
  const currentMonth = paymentObj.date.getMonth();
  const currentYear = paymentObj.date.getFullYear();

  // Check for one-time payments this month
  const oneTimePayment = oneTimePayments.filter(pmnt => {
    const paymentDate = new Date(pmnt.date);
    return paymentDate.getMonth() === currentMonth &&
      paymentDate.getFullYear() === currentYear;
  });

  extraPayment = roundCents(extraPayment + oneTimePayment.reduce((sum, payment) => sum + payment.amount, 0));

  if (!shouldApplyExtraPayments(paymentObj, extraPayment, snowballAmount, paydownMethod, startDate)) {
    return { loans, paymentObj };
  }

  let paymentIndex = 0;
  let /** @type {number} */ remainingExtraPayment = parseFloat((extraPayment + snowballAmount).toFixed(2));

  while (remainingExtraPayment > 0) {
    // Skip to next unpaid loan
    while (paymentIndex < paymentObj.payments.length && paymentObj.payments[paymentIndex].balance <= 0) paymentIndex++;
    if (paymentIndex >= paymentObj.payments.length) break;

    const /** @type {types.PaymentDetail} */ topAccount = paymentObj.payments[paymentIndex];

    if (topAccount.balance > 0) {
      const paymentToApply = Math.min(remainingExtraPayment, topAccount.balance);

      topAccount.principalPaid += paymentToApply;
      topAccount.totalPaid += paymentToApply;
      topAccount.balance -= paymentToApply;
      remainingExtraPayment = roundCents(remainingExtraPayment - paymentToApply);

      // Update corresponding loan balance
      const loanIndex = loans.findIndex(l => l.id === topAccount.loanID);
      if (loanIndex >= 0) {
        loans[loanIndex].balance = topAccount.balance;
      }
    }
  }

  return { loans, paymentObj };
}

/**
 * Checks if only the last loan is paid off and we're at index 0
 * @param {types.PaymentDetail[]} payments Array of payments
 * @param {number} paymentIndex Current payment index
 * @returns {boolean} True if last loan is paid off and at index 0
 */
/**
 * Calculates the next month and year
 * @param {number} currentMonth Current month (0-11)
 * @param {number} currentYear Current year
 * @returns {Object} Object with currentMonth and currentYear for next period
 */
function getNextMonthYear(currentMonth, currentYear) {
  if (currentMonth === DECEMBER_MONTH_INDEX) {
    return { currentMonth: 0, currentYear: currentYear + 1 };
  } else {
    return { currentMonth: currentMonth + 1, currentYear };
  }
}

/**
 * Calculates payment details for all loans for a given month/year
 * @param {types.Loan[]} loans Array of loans
 * @param {number} currentMonth Current month (0-11)
 * @param {number} currentYear Current year
 * @returns {types.NextPaymentsReturn} Updated loans, extra payment, and payment object
 */
function calculateMonthlyPaymentDetails(loans, currentMonth, currentYear) {
  let extraPayment = 0;
  /** @type {types.PayPeriodDetail} */
  const paymentObj = {
    date: new Date(currentYear, currentMonth, 1),
    payments: []
  };

  for (const loan of loans) {
    /** @type {types.PaymentDetail} */
    const paymentDetails = {
      loanID: loan.id,
      balance: loan.balance,
      interestPaid: 0,
      principalPaid: 0,
      totalPaid: 0
    };
    const ratePerMonth = loan.apr / APR_TO_MONTHLY_RATE_DIVISOR;


    if (isLoanOpeningMonth(loan, currentMonth, currentYear)) {
      // Handle initial account balance
      paymentDetails.loanID = loan.id;
      paymentDetails.balance = loan.balance;
      paymentObj.payments.push(paymentDetails);
    } else if (isLoanActiveForPayment(loan, currentMonth, currentYear)) {
      // Calculate payment for active loan
      const { curMonthInterest, curMonthPrincipal } = calculateInterestAndPrincipal(loan, ratePerMonth);
      let futureBalance = parseFloat((loan.balance + curMonthInterest - loan.minPayment).toFixed(2));

      // Validate minimum payment covers interest
      if (futureBalance >= loan.balance && futureBalance !== 0) {
        throw new Error(`Minimum payment for loan ${loan.id} will not cover interest every month.`);
      }

      // Handle overpayment
      if (futureBalance <= 0) {
        extraPayment += -futureBalance;
        futureBalance = 0;
      }

      paymentDetails.loanID = loan.id;
      paymentDetails.balance = futureBalance;
      paymentDetails.interestPaid = parseFloat(curMonthInterest.toFixed(2));
      paymentDetails.principalPaid = roundCents(Math.min(loan.balance, curMonthPrincipal));
      paymentDetails.totalPaid = parseFloat((paymentDetails.interestPaid + paymentDetails.principalPaid).toFixed(2));

      loan.balance = futureBalance;
      paymentObj.payments.push(paymentDetails);
    }
    // If loan hasn't opened yet, skip it (don't add empty payment details)
  }

  return { loans, extraPayment, paymentObj };
}

/**
 * Checks if this is the month the payoff starts for the loan
 * @param {types.Loan} loan The loan to check
 * @param {number} currentMonth Current month
 * @param {number} currentYear Current year
 * @returns {boolean} True if payoff starts this month
 */
function isLoanOpeningMonth(loan, currentMonth, currentYear) {
  return loan.payoffStartDate.getMonth() === currentMonth &&
    loan.payoffStartDate.getFullYear() === currentYear;
}

/**
 * Checks if loan is active and should have a payment this month
 * @param {types.Loan} loan The loan to check
 * @param {number} currentMonth Current month
 * @param {number} currentYear Current year
 * @returns {boolean} True if loan is active for payment
 */
function isLoanActiveForPayment(loan, currentMonth, currentYear) {
  return (loan.payoffStartDate.getMonth() < currentMonth &&
    loan.payoffStartDate.getFullYear() === currentYear) ||
    loan.payoffStartDate.getFullYear() < currentYear;
}

/**
 * Prioritizes loans based on the selected paydown method
 * @param {types.Loan[]} loanArray Array of loans to prioritize
 * @param {string} paymentMethod Method to use for prioritization
 * @returns {types.Loan[]} Sorted array of loans
 */
function prioritizeLoans(loanArray, paymentMethod = PAYDOWN_METHODS.minPayments) {
  if (paymentMethod === PAYDOWN_METHODS.minPayments) {
    return loanArray;
  }

  const loanArrayCopy = [...loanArray]; // Create copy to avoid mutation

  // Order by increasing interest rate, then decreasing balance
  if (paymentMethod === PAYDOWN_METHODS.avalanche) {
    loanArrayCopy.sort((loan1, loan2) => loan2.apr - loan1.apr || loan1.balance - loan2.balance || loan1.id - loan2.id);
  // Order by decreasing balance, then increasing
  } else if (paymentMethod === PAYDOWN_METHODS.snowball) {
    loanArrayCopy.sort((loan1, loan2) => loan1.balance - loan2.balance || loan2.apr - loan1.apr || loan1.id - loan2.id);
  }
  // console.log(loanArrayCopy);
  return loanArrayCopy;
}

/**
 * Callback for sorting dates in ascending order
 * @param {Date} date1 First date
 * @param {Date} date2 Second date
 * @returns {number} -1 if date1 < date2, 1 if date1 > date2, 0 if equal
 */
function dateSortAsc(date1, date2) {
  const year1 = date1.getFullYear();
  const month1 = date1.getMonth();
  const year2 = date2.getFullYear();
  const month2 = date2.getMonth();

  if (year1 < year2) return -1;
  if (year1 > year2) return 1;
  if (month1 < month2) return -1;
  if (month1 > month2) return 1;
  return 0;
}

/**
 * Creates a deep copy of an object with no overlapping references
 * @param {*} aObject Item to copy
 * @returns {*} Deep copy of the input
 */
function deepCopy(aObject) {
  if (!aObject) {
    return aObject;
  }

  let /** @type {Array|Object} */ bObject = Array.isArray(aObject) ? [] : {};
  for (const k in aObject) {
    const v = aObject[k];
    bObject[k] = Object.prototype.toString.call(v) === "[object Date]"
      ? new Date(v.getTime())
      : typeof v === "object"
        ? deepCopy(v)
        : v;
  }

  return bObject;
}

/**
 * Formats a number as a percentage
 * @param {number} value The value to format
 * @param {number} decPlaces Number of decimal places
 * @returns {string} The value as a percentage-formatted string
 */
function percentFormat(value, decPlaces = 2) {
  return (value / PERCENT_TO_DECIMAL).toLocaleString("en-US", {
    style: "percent",
    minimumFractionDigits: decPlaces,
    maximumFractionDigits: decPlaces
  });
}

/**
 * Formats a number as currency
 * @param {number} value The value to format
 * @returns {string} The value as a currency-formatted string
 */
function currencyFormat(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Converts a Date object to YYYY-MM-DD string format
 * @param {Date} date Date to convert
 * @returns {string} Date in YYYY-MM-DD format
 */
function dateStringFromDate(date) {
  return `${date.getFullYear().toString()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
}

/**
 * Date formatter for displaying month and year
 */
function dateFormat(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long"
  }).format(date);
}

/**
 * Converts a YYYY-MM-DD string to Date object
 * @param {string} dateString Date string in YYYY-MM-DD format
 * @returns {Date} Corresponding Date object
 */
function dateFromString(dateString) {
  if (dateString instanceof Date) return new Date(dateString.getTime());
  if (typeof dateString === "number") return new Date(dateString);
  const [year, month, day] = dateString.split("-");
  const date = new Date(0);
  date.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Calculates the current total balance across all loans
 * @param {types.PaydownDataDetail} paydownData Paydown calculation results
 * @param {Date} asOfDate Local date used for the projection
 * @returns {number} Current total balance, or 0 if no current payment found
 */
function currentBalance(paydownData, asOfDate) {
  const currentYear = asOfDate.getFullYear();
  const currentMonth = asOfDate.getMonth();

  const currentPayment = paydownData.paymentArray
    .find(pmt =>
      pmt.date.getFullYear() === currentYear &&
      pmt.date.getMonth() === currentMonth
    );

  if (!currentPayment || !currentPayment.payments.length) {
    return 0;
  }

  return currentPayment.payments
    .map(pmt => pmt.balance)
    .reduce((acc, cur) => acc + cur, 0);
};

/**
 * Determines if a payment period is before today
 * @param {types.PayPeriodDetail} pmt Payment period to check
 * @returns {boolean} True if payment is before current month
 */
function paymentsBeforeToday(pmt) {
  const now = new Date();
  return (
    pmt.date.getFullYear() < now.getFullYear() ||
    (pmt.date.getMonth() < now.getMonth() &&
      pmt.date.getFullYear() === now.getFullYear())
  );
};

/**
 * Calculates total amount paid up to current date
 * @param {types.PaydownDataDetail} paydownData Paydown calculation results
 * @returns {number} Total amount paid to current date
 */
function getPaidToCurrent(paydownData) {
  try {
    return paydownData.paymentArray
      .filter(paymentsBeforeToday)
      .flatMap(pmt => pmt.payments.map(payment => payment.totalPaid))
      .reduce((acc, cur) => acc + cur, 0);
  } catch (error) {
    console.warn('Error calculating paid to current:', error);
    return 0;
  }
}

/**
 * Prepares chart data by combining historic and projected balance data
 * @param {types.Loan[]} accounts Array of loan accounts
 * @param {types.SnapshotDetail[]} historicBalanceArray Historic balance snapshots
 * @param {types.PayPeriodDetail[]} paymentArray Projected payment data
 * @returns {Object} Object with xData (dates) and yData (balances per account)
 */
function getChartData(accounts, historicBalanceArray, paymentArray) {
  const xData = [
    ...historicBalanceArray.map(x => x.date).slice(0, -1),
    ...paymentArray.map(x => x.date)
  ];

  const yData = accounts.map(account => {
    const historicYData = historicBalanceArray.slice(0, -1).map(balancePeriod => {
      const balanceInfo = balancePeriod.balances.find(bal => bal.loanID === account.id);
      return balanceInfo ? balanceInfo.balance : null;
    });

    const projectedYData = paymentArray.map(payPeriod => {
      const paymentInfo = payPeriod.payments.find(payment => payment.loanID === account.id);
      return paymentInfo ? paymentInfo.balance : null;
    });

    return [...historicYData, ...projectedYData];
  });

  return { xData, yData };
}

// Export with both old and new function names for backward compatibility
export {
  PAYDOWN_METHODS,
  dateFormat,
  dateFromString,
  dateStringFromDate,
  currencyFormat,
  percentFormat,
  dateSortAsc,
  prioritizeLoans,
  calculatePaydownSchedule,
  getMonthString,
  deepCopy,
  getPaidToCurrent,
  paymentsBeforeToday,
  currentBalance,
  getHistoricBalanceData,
  getChartData
};
