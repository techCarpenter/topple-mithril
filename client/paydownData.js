// Refactored paydownData.js
// New (with Changes)
/** @import * as types from "./types" */

// Constants
const PAYDOWN_METHODS = {
  avalanche: "avalanche",
  snowball: "snowball",
  minPayments: "minPayments",
  custom: "custom"
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
 * @returns {types.PaydownDataDetail} An array of payment details with the date and an array of payments
 */
function calculatePaydownSchedule(
  loans,
  paydownMethod = PAYDOWN_METHODS.snowball,
  initSnowball = 0,
  oneTimePayments = []
) {
  // Input validation
  if (!Array.isArray(loans) || loans.length === 0) {
    throw new Error('Loans array is required and cannot be empty');
  }

  if (initSnowball < 0) {
    throw new Error('Initial snowball amount cannot be negative');
  }

  if (!Object.values(PAYDOWN_METHODS).includes(paydownMethod)) {
    throw new Error(`Invalid paydown method: ${paydownMethod}`);
  }

  let /** @type {types.AccountPayoffDetail[]}*/ accountPayoffOrder = [],
    /** @type {types.PayPeriodDetail[]} */ allPaymentData = [],
    snowballAmount = 0,
    /** @type {types.Loan[]} */ loansCopy = deepCopy(loans),
    startDate = loansCopy.map(loan => loan.dateOpened).sort(dateSortAsc)[0],
    currentYear = startDate.getFullYear(),
    currentMonth = startDate.getMonth(),
    monthsLeft = 0,
    nowMonth = new Date().getMonth(),
    nowYear = new Date().getFullYear();

  loansCopy = prioritizeLoans(loansCopy, paydownMethod);

  // Loop over each payment period
  do {
    if (currentYear === nowYear && currentMonth === nowMonth) {
      snowballAmount += initSnowball;
    }
    if (isCurrentOrFutureMonth(currentMonth, currentYear, nowMonth, nowYear)) {
      monthsLeft++;
    }

    let /** @type {number} */ extraPayment,
      /** @type {types.PayPeriodDetail} */ currentPaymentObj;

    // Calculate payments for current period
    ({
      loans: loansCopy,
      extraPayment,
      paymentObj: currentPaymentObj
    } = calculateMonthlyPaymentDetails(loansCopy, currentMonth, currentYear));

    // Apply extra payments
    ({ loans: loansCopy, paymentObj: currentPaymentObj } = applyExtraPayments(
      currentPaymentObj,
      extraPayment,
      snowballAmount,
      paydownMethod,
      startDate,
      loansCopy,
      oneTimePayments
    ));

    let reprioritizeLoans = false;

    // Remove paid-off loans and add to snowball
    loansCopy = loansCopy.filter(loan => {
      if (loan.balance <= 0) {
        snowballAmount += loan.minPayment;
        accountPayoffOrder.push({
          id: loan.id,
          payoffDate: currentPaymentObj.date,
          newSnowball: snowballAmount
        });
        reprioritizeLoans = true;
        return false;
      }
      return true;
    });

    if (reprioritizeLoans) {
      loansCopy = prioritizeLoans(loansCopy, paydownMethod);
      reprioritizeLoans = false;
    }

    allPaymentData.push(currentPaymentObj);

    // Move to next payment period
    ({ currentMonth, currentYear } = getNextMonthYear(currentMonth, currentYear));
  } while (loansCopy.length > 0);

  const totalInterestPaid = getTotalInterestPaid(allPaymentData);
  const totalPrincipalPaid = getTotalPrincipalPaid(allPaymentData);
  const totalPaid = totalInterestPaid + totalPrincipalPaid;

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
    finalSnowball: snowballAmount
  };
}

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
  const curMonthInterest = loan.balance * (1 + ratePerMonth) - loan.balance;
  const curMonthPrincipal = loan.minPayment - curMonthInterest;
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
  const oneTimePayment = oneTimePayments.find(pmnt => {
    const paymentDate = new Date(pmnt.date);
    return paymentDate.getMonth() === currentMonth &&
      paymentDate.getFullYear() === currentYear;
  });

  if (oneTimePayment) {
    extraPayment += oneTimePayment.amount;
  }

  if (!shouldApplyExtraPayments(paymentObj, extraPayment, snowballAmount, paydownMethod, startDate)) {
    return { loans, paymentObj };
  }

  let paymentIndex = paymentObj.payments.length - 1;
  let /** @type {number} */ remainingExtraPayment = parseFloat((extraPayment + snowballAmount).toFixed(2));

  while (remainingExtraPayment > 0 && !isLastLoanPaidOff(paymentObj.payments, paymentIndex)) {
    // Skip to next unpaid loan
    while (paymentObj.payments[paymentIndex].balance <= 0 && paymentIndex > 0) {
      paymentIndex--;
    }

    const /** @type {types.PaymentDetail} */ topAccount = paymentObj.payments[paymentIndex];

    if (topAccount.balance > 0) {
      const paymentToApply = Math.min(remainingExtraPayment, topAccount.balance);

      topAccount.principalPaid += paymentToApply;
      topAccount.totalPaid += paymentToApply;
      topAccount.balance -= paymentToApply;
      remainingExtraPayment -= paymentToApply;

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
function isLastLoanPaidOff(payments, paymentIndex) {
  return payments[paymentIndex].balance === 0 && paymentIndex === 0;
}

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
      paymentDetails.principalPaid = parseFloat((curMonthPrincipal + Math.min(0, futureBalance)).toFixed(2));
      paymentDetails.totalPaid = parseFloat((paymentDetails.interestPaid + paymentDetails.principalPaid).toFixed(2));

      loan.balance = futureBalance;
      paymentObj.payments.push(paymentDetails);
    }
    // If loan hasn't opened yet, skip it (don't add empty payment details)
  }

  return { loans, extraPayment, paymentObj };
}

/**
 * Checks if this is the month the loan was opened
 * @param {types.Loan} loan The loan to check
 * @param {number} currentMonth Current month
 * @param {number} currentYear Current year
 * @returns {boolean} True if loan opens this month
 */
function isLoanOpeningMonth(loan, currentMonth, currentYear) {
  return loan.dateOpened.getMonth() === currentMonth &&
    loan.dateOpened.getFullYear() === currentYear;
}

/**
 * Checks if loan is active and should have a payment this month
 * @param {types.Loan} loan The loan to check
 * @param {number} currentMonth Current month
 * @param {number} currentYear Current year
 * @returns {boolean} True if loan is active for payment
 */
function isLoanActiveForPayment(loan, currentMonth, currentYear) {
  return (loan.dateOpened.getMonth() < currentMonth &&
    loan.dateOpened.getFullYear() === currentYear) ||
    loan.dateOpened.getFullYear() < currentYear;
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
    loanArrayCopy.sort((loan1, loan2) => {
      if (loan1.apr < loan2.apr) {
        return -1;
      } else if (loan1.apr > loan2.apr) {
        return 1;
      } else {
        // If APRs are equal, sort by decreasing balance
        if (loan1.balance > loan2.balance) {
          return -1;
        } else if (loan1.balance < loan2.balance) {
          return 1;
        }
        return 0;
      }
    });
  // Order by decreasing balance, then increasing
  } else if (paymentMethod === PAYDOWN_METHODS.snowball) {
    loanArrayCopy.sort((loan1, loan2) => {
      if (loan1.balance > loan2.balance) {
        return -1;
      } else if (loan1.balance < loan2.balance) {
        return 1;
      } else {
        // If balances are equal, prioritize higher APR
        if (loan1.apr < loan2.apr) {
          return -1;
        } else if (loan1.apr > loan2.apr) {
          return 1;
        }
        return 0;
      }
    });
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
  const [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Calculates the current total balance across all loans
 * @param {types.PaydownDataDetail} paydownData Paydown calculation results
 * @returns {number} Current total balance, or 0 if no current payment found
 */
function currentBalance(paydownData) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

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