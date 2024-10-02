/** @import * as types from "./types" */

const PAYDOWN_METHODS = {
  avalanche: "avalanche",
  snowball: "snowball",
  minPayments: "minPayments",
  custom: "custom"
};

/**
 * Gets the full string value of the month by number
 * @param {Number} monthInt The number denoting the month
 * @returns {String} The name of the corresponding month
 */
function getMonthString(monthInt) {
  switch (monthInt) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    default:
      return "December";
  }
}

/**
 * Calculates all payment data for loans.
 * @param {types.Loan[]} loans Array of loans
 * @param {string} paydownMethod String to set paydown method
 * @param {number} initSnowball Starting snowball payment amount (default is 0)
 * @param {types.ExtraPayment[]} oneTimePayments Extra one-off payments
 * @returns {types.PaydownDataDetail} An array of payment details with the date and an array of payments
 */
function getTotalPaymentData(
  loans,
  paydownMethod = PAYDOWN_METHODS.snowball,
  initSnowball = 0,
  oneTimePayments = []
) {
  let /** @type {types.AccountPayoffDetail[]}*/ accountPayoffOrder = [],
    /** @type {types.PayPeriodDetail[]} */ allPaymentData = [],
    snowballAmt = initSnowball,
    /** @type {types.Loan[]} */ loansCopy = copy(loans),
    startDate = loansCopy.map(loan => loan.dateOpened).sort(dateSortAsc)[0],
    curYear = startDate.getFullYear(),
    curMonth = startDate.getMonth(),
    /** @type {number} */ monthsLeft = 0,
    nowMonth = new Date().getMonth(),
    nowYear = new Date().getFullYear();

  loansCopy = prioritizeLoans(loansCopy, paydownMethod);

  // Loop over each payment period
  do {
    if (curYear > nowYear || (curYear === nowYear && curMonth >= nowMonth)) {
      monthsLeft++;
    }

    let /** @type {number} */ extraPayment,
      /** @type {types.PayPeriodDetail} */ curPaymentObj;

    // loop over each loan
    ({
      loans: loansCopy,
      extraPayment,
      paymentObj: curPaymentObj
    } = getNextPayments(loansCopy, curMonth, curYear));

    // Add extra payments before pushing pay period
    ({ loans: loansCopy, paymentObj: curPaymentObj } = addExtraPayments(
      curPaymentObj,
      extraPayment,
      snowballAmt,
      paydownMethod,
      startDate,
      loansCopy,
      oneTimePayments
    ));

    loansCopy = loansCopy.filter(loan => {
      if (loan.balance <= 0) {
        snowballAmt += loan.minPayment;
        accountPayoffOrder.push({
          id: loan.id,
          payoffDate: curPaymentObj.date,
          newSnowball: snowballAmt
        });
        return false;
      } else {
        return true;
      }
    });

    loansCopy = prioritizeLoans(loansCopy, paydownMethod);

    allPaymentData.push(curPaymentObj);

    // Calculate Next Payment Period
    ({ curMonth, curYear } = getNextMonthYear(curMonth, curYear));
  } while (loansCopy.length > 0);

  let totalInterestPaid = getTotalInterestPaid(allPaymentData),
    totalPrincipalPaid = getTotalPrincipalPaid(allPaymentData),
    totalPaid = totalInterestPaid + totalPrincipalPaid;

  let returnObj = {
    paymentArray: allPaymentData,
    totalInterestPaid,
    totalPrincipalPaid,
    totalPaid,
    accountPayoffOrder,
    startDate,
    endDate: new Date(curYear, curMonth, 1),
    monthsLeft,
    paydownMethod,
    startingSnowball: initSnowball,
    finalSnowball: snowballAmt
  };

  return returnObj;
}

/**
 *
 * @param {types.PayPeriodDetail[]} allPaymentData
 * @returns {number}
 */
function getTotalInterestPaid(allPaymentData) {
  let allPayments = allPaymentData.reduce((
    /** @type {types.PaymentDetail[]} */ acc,
    cur
  ) => {
    acc = [...acc, ...cur.payments];
    return acc;
  }, []);
  let totalInterestPaid = allPayments.reduce((acc, cur) => {
    acc += cur.interestPaid;
    return acc;
  }, 0);
  return totalInterestPaid;
}

/**
 *
 * @param {types.PayPeriodDetail[]} allPaymentData
 * @returns {number}
 */
function getTotalPrincipalPaid(allPaymentData) {
  let allPayments = allPaymentData.reduce((
    /** @type {types.PaymentDetail[]} */ acc,
    cur
  ) => {
    acc = [...acc, ...cur.payments];
    return acc;
  }, []);
  let totalPrincipalPaid = allPayments.reduce((acc, cur) => {
    acc += cur.principalPaid;
    return acc;
  }, 0);
  return totalPrincipalPaid;
}

/**
 * @param {types.PayPeriodDetail} paymentObj
 * @param {number} extraPayment
 * @param {number} snowballAmt
 * @param {string} paydownMethod
 * @param {Date} startDate
 * @param {types.Loan[]} loans
 * @param {types.ExtraPayment[]} oneTimePayments
 * @returns {types.ExtraPaymentReturn}
 */
function addExtraPayments(
  paymentObj,
  extraPayment,
  snowballAmt,
  paydownMethod,
  startDate,
  loans,
  oneTimePayments = []
) {
  let curMonth = paymentObj.date.getMonth(),
    curYear = paymentObj.date.getFullYear();
  let oneTimePayment = oneTimePayments.find(pmnt => {
    let paymentDate = new Date(pmnt.date);
    return paymentDate.getMonth() === curMonth &&
      paymentDate.getFullYear() === curYear;
  });

  if (oneTimePayment) {
    extraPayment += oneTimePayment.amount;
  }

  if (
    paymentObj.payments.length > 0 &&
    (extraPayment > 0 || snowballAmt > 0) &&
    paydownMethod !== PAYDOWN_METHODS.minPayments &&
    !(
      paymentObj.date.getFullYear() === startDate.getFullYear() &&
      paymentObj.date.getMonth() === startDate.getMonth()
    )
  ) {
    let paymentIndex = paymentObj.payments.length - 1,
      /** @type {types.PaymentDetail} */ topAccount,
      /** @type {number} */ formattedExtraPayment,
      eraseExtraPayment = false;

    extraPayment += snowballAmt;
    formattedExtraPayment = parseFloat(extraPayment.toFixed(2));

    while (
      formattedExtraPayment > 0 &&
      !(paymentObj.payments[paymentIndex].balance === 0 && paymentIndex === 0)
    ) {
      while (
        paymentObj.payments[paymentIndex].balance <= 0 &&
        paymentIndex > 0
      ) {
        paymentIndex--;
      }

      topAccount = paymentObj.payments[paymentIndex];

      if (topAccount.balance > 0) {
        if (topAccount.balance - formattedExtraPayment < 0) {
          formattedExtraPayment -= topAccount.balance;
          topAccount.principalPaid += topAccount.balance;
          topAccount.totalPaid += topAccount.balance;
          topAccount.balance = 0;
        } else {
          topAccount.principalPaid += formattedExtraPayment;
          topAccount.totalPaid += formattedExtraPayment;
          topAccount.balance -= formattedExtraPayment;
          eraseExtraPayment = true;
        }

        let loanIndex = loans.findIndex(l => l.id === topAccount.loanID);
        if (loanIndex >= 0) {
          loans[loanIndex].balance = topAccount.balance;
        }

        if (eraseExtraPayment) {
          formattedExtraPayment = 0;
          eraseExtraPayment = false;
        }
      }
    }
  }
  return { loans, paymentObj };
}

/**
 *
 * @param {number} curMonth
 * @param {number} curYear
 * @returns {Object}
 */
function getNextMonthYear(curMonth, curYear) {
  if (curMonth === 11) {
    curYear++;
    curMonth = 0;
  } else {
    curMonth++;
  }
  return { curMonth, curYear };
}

/**
 * @param {types.Loan[]} loans
 * @param {number} curMonth
 * @param {number} curYear
 * @returns {types.NextPaymentsReturn}
 */
function getNextPayments(loans, curMonth, curYear) {
  let /** @type {number} */ ratePerMonth,
    /** @type {number} */ futureBalance,
    /** @type {number} */ curMonthInterest,
    /** @type {number} */ curMonthPrincipal,
    extraPayment = 0,
    /** @type {types.PayPeriodDetail} */
    paymentObj = {
      date: new Date(curYear, curMonth, 1),
      payments: []
    };
  for (let loan of loans) {
    /** @type {types.PaymentDetail} */
    let paymentDetails = {
      loanID: loan.id,
      balance: loan.balance,
      interestPaid: 0,
      principalPaid: 0,
      totalPaid: 0
    };
    ratePerMonth = loan.apr / 1200;

    if (
      loan.dateOpened.getMonth() === curMonth &&
      loan.dateOpened.getFullYear() === curYear
    ) {
      // Handle initial account balance
      paymentDetails.loanID = loan.id;
      paymentDetails.balance = loan.balance;
    } else if (
      (loan.dateOpened.getMonth() < curMonth &&
        loan.dateOpened.getFullYear() === curYear) ||
      loan.dateOpened.getFullYear() < curYear
    ) {
      // Handle payments
      // Calculate future value after interest accrues and payment is applied
      curMonthInterest = loan.balance * (1 + ratePerMonth) - loan.balance;
      curMonthPrincipal = loan.minPayment - curMonthInterest;
      futureBalance = parseFloat(
        (loan.balance + curMonthInterest - loan.minPayment).toFixed(2)
      );

      if (futureBalance >= loan.balance && futureBalance !== 0) {
        throw new Error("Minimum payment will not cover interest every month.");
      }
      if (futureBalance <= 0) {
        extraPayment += -futureBalance;
        curMonthPrincipal += futureBalance;
        futureBalance = 0;
      }
      paymentDetails.loanID = loan.id;
      paymentDetails.balance = futureBalance;
      paymentDetails.interestPaid = parseFloat(curMonthInterest.toFixed(2));
      paymentDetails.principalPaid = parseFloat(curMonthPrincipal.toFixed(2));
      paymentDetails.totalPaid = parseFloat(
        (curMonthInterest + curMonthPrincipal).toFixed(2)
      );
      loan.balance = futureBalance;
    } else {
      //prevent adding empty payment details to payments
      continue;
    }
    paymentObj.payments.push(paymentDetails);
  }
  return { loans, extraPayment, paymentObj };
}

/**
 *
 * @param {types.Loan[]} loanArray
 * @param {string} paymentMethod
 * @returns {types.Loan[]}
 */
function prioritizeLoans(
  loanArray,
  paymentMethod = PAYDOWN_METHODS.minPayments
) {
  if (paymentMethod === PAYDOWN_METHODS.minPayments) return loanArray;

  if (paymentMethod === PAYDOWN_METHODS.avalanche) {
    loanArray.sort((loan1, loan2) => {
      if (loan1.apr < loan2.apr) {
        return -1;
      } else if (loan1.apr > loan2.apr) {
        return 1;
      } else {
        if (loan1.balance > loan2.balance) {
          return -1;
        } else if (loan1.balance < loan2.balance) {
          return 1;
        }
        return 0;
      }
    });
  } else if (paymentMethod === PAYDOWN_METHODS.snowball) {
    loanArray.sort((loan1, loan2) => {
      if (loan1.balance > loan2.balance) {
        return -1;
      } else if (loan1.balance < loan2.balance) {
        return 1;
      } else {
        if (loan1.apr < loan2.apr) {
          return -1;
        } else if (loan1.apr > loan2.apr) {
          return 1;
        }
        return 0;
      }
    });
  }

  return loanArray;
}

/**
 * Callback for sorting by date
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number} 1 for first is greater, 0 for equal, and -1 for second is greater
 */
function dateSortAsc(date1, date2) {
  let year1 = date1.getFullYear(),
    month1 = date1.getMonth(),
    year2 = date2.getFullYear(),
    month2 = date2.getMonth();

  if (year1 < year2) {
    return -1;
  } else if (year1 > year2) {
    return 1;
  } else {
    if (month1 < month2) {
      return -1;
    } else if (month1 > month2) {
      return 1;
    } else {
      return 0;
    }
  }
}

/**
 * Method to create a new copy with no overlapping references.
 * @param {*} aObject Item to copy
 * @returns {*} Returns a copy of the input
 */
function copy(aObject) {
  if (!aObject) {
    return aObject;
  }

  let v;
  let /** @type {Array|Object} */ bObject = Array.isArray(aObject) ? [] : {};
  for (const k in aObject) {
    v = aObject[k];
    bObject[k] =
      Object.prototype.toString.call(v) === "[object Date]"
        ? new Date(v.getTime())
        : typeof v === "object"
          ? copy(v)
          : v;
  }

  return bObject;
}

/**
 * Format a number as a percentage
 * @param {number} value The value to format
 * @param {number} decPlaces Number of decimal places
 * @returns {String} The value as a percentage-formatted string
 */
function percentFormat(value, decPlaces = 2) {
  return (value / 100).toLocaleString("en-US", {
    style: "percent",
    minimumFractionDigits: decPlaces,
    maximumFractionDigits: decPlaces
  });
}

/**
 * Format a number as a currency
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
 *
 * @param {Date} date
 * @returns {String}
 */
function dateStringFromDate(date) {
  return `${date.getFullYear().toString()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long"
}).format;

/**
 *
 * @param {String} dateString
 * @returns {Date}
 */
function dateFromString(dateString) {
  let [year, month, day] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

const currentBalance = (paydownData) => {
  let curYear = new Date().getFullYear();
  let curMonth = new Date().getMonth();

  return paydownData.paymentArray
    .filter(
      (pmt) =>
        pmt.date.getFullYear() === curYear &&
        pmt.date.getMonth() === curMonth
    )[0]
    .payments.map(pmt => pmt.balance)
    .reduce((acc, cur) => acc + cur);
};

/**
 *
 * @param {types.PayPeriodDetail} pmt
 * @returns {Boolean}
 */
const paymentsBeforeToday = pmt => {
  let now = new Date();
  return (
    pmt.date.getFullYear() < now.getFullYear() ||
    (pmt.date.getMonth() < now.getMonth() &&
      pmt.date.getFullYear() === now.getFullYear())
  );
};

/**
 *
 * @param {types.PaydownDataDetail} paydownData
 * @returns {number}
 */
function getPaidToCurrent(paydownData) {
  try {
    return paydownData.paymentArray
      .filter(paymentsBeforeToday)
      .map(pmt => {
        return pmt.payments.map(
          (payment) => payment.totalPaid
        );
      })
      .flat()
      .reduce((acc, cur) => acc + cur);
  } catch {
    return 0;
  }
};

export {
  PAYDOWN_METHODS,
  dateFormat,
  dateFromString,
  dateStringFromDate,
  currencyFormat,
  percentFormat,
  dateSortAsc,
  prioritizeLoans,
  getTotalPaymentData,
  getMonthString,
  copy,
  getPaidToCurrent,
  paymentsBeforeToday,
  currentBalance
};
