/**
 * @typedef Loan
 * @property {String} name
 * @property {Date} dateOpened
 * @property {string} id
 * @property {number} balance
 * @property {string} provider
 * @property {number} apr
 * @property {number} minPayment
 *
 * @typedef BalanceDetail
 * @property {string} loanID
 * @property {number} balance
 * 
 * @typedef PaymentDetail
 * @property {string} loanID
 * @property {number} balance
 * @property {number} interestPaid
 * @property {number} principalPaid
 * @property {number} totalPaid
 *
 * @typedef PayPeriodDetail
 * @property {Date} date
 * @property {PaymentDetail[]} payments
 * 
 * @typedef SnapshotDetail
 * @property {Date} date
 * @property {BalanceDetail[]} balances
 *
 * @typedef AccountPayoffDetail
 * @property {string} id
 * @property {Date} payoffDate
 * @property {number} newSnowball
 *
 * @typedef Line
 * @property {string} shape
 * @property {number} smoothing
 * @property {number} width
 *
 * @typedef PlotlyTrace
 * @property {string} name
 * @property {number[]} x
 * @property {number[]} y
 * @property {string} mode
 * @property {string} type
 * @property {Line} line
 *
 * @typedef PaydownDataDetail
 * @property {PayPeriodDetail[]} paymentArray
 * @property {number} totalInterestPaid
 * @property {number} totalPrincipalPaid
 * @property {number} totalPaid
 * @property {AccountPayoffDetail[]} accountPayoffOrder
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {number} monthsLeft
 * @property {string} paydownMethod
 * @property {number} startingSnowball
 * @property {number} finalSnowball
 *
 * @typedef ExtraPayment
 * @property {string} date
 * @property {number} amount
 * 
 * @typedef NextPaymentsReturn
 * @property {Loan[]} loans
 * @property {number} extraPayment
 * @property {PayPeriodDetail} paymentObj
 * 
 * @typedef ExtraPaymentReturn
 * @property {Loan[]} loans
 * @property {PayPeriodDetail} paymentObj
 * 
 * @typedef State
 * @property {number} snowball
 * @property {PaydownDataDetail} paydownData
 * @property {Loan[]} accounts
 * @property {SnapshotDetail[]} historicBalanceArray
 */
export { }