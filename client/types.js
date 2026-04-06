/**
 * @typedef Loan
 * @property {string} name
 * @property {number} id
 * @property {string} provider
 * @property {number} apr
 * @property {number} minPayment
 * @property {Date} [payoffStartDate]
 * @property {number} [balance]
 * @property {Date | null} [lastSnapshot]
 *
 * @typedef BalanceDetail
 * @property {number} loanID
 * @property {number} balance
 *
 * @typedef SnapshotRecord
 * @property {number} id
 * @property {number} userId
 * @property {number} accountId
 * @property {number} date
 * @property {number} balance
 *
 * @typedef PaymentDetail
 * @property {number} loanID
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
 * @property {number} id
 * @property {Date} payoffDate
 * @property {number} newSnowball
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
 * @property {number} id
 * @property {number} userId
 * @property {number} date
 * @property {number} amount
 *
 * @typedef SnowballAdjustment
 * @property {number} id
 * @property {number} userId
 * @property {number} date
 * @property {number} amount
 *
 * @typedef Notice
 * @property {"success" | "error"} kind
 * @property {string} message
 * @property {number} timestamp
 *
 * @typedef State
 * @property {string} activeView
 * @property {number} snowball
 * @property {string} paydownMethod
 * @property {Loan[]} loans
 * @property {SnapshotRecord[]} snapshots
 * @property {ExtraPayment[]} extraPayments
 * @property {SnowballAdjustment[]} snowballAdjustments
 * @property {{ initialize: boolean, loans: boolean, snapshots: boolean, extraPayments: boolean, snowballAdjustments: boolean }} loading
 * @property {{ loans: boolean, snapshots: boolean, extraPayments: boolean, snowballAdjustments: boolean }} mutations
 * @property {{ initialize: string | null, loans: string | null, snapshots: string | null, extraPayments: string | null, snowballAdjustments: string | null }} errors
 * @property {{ loan: string | null, snapshot: string | null, extraPayment: string | null, snowballAdjustment: string | null }} formErrors
 * @property {Notice | null} notice
 * @property {{ loan: { name: string, provider: string, apr: string, minPayment: string }, snapshot: { accountId: string, date: string, balance: string }, extraPayment: { date: string, amount: string }, snowballAdjustment: { date: string, amount: string } }} forms
 * @property {{ loanId: number | null, snapshotId: number | null, extraPaymentId: number | null, snowballAdjustmentId: number | null }} editing
 */
export default {};
