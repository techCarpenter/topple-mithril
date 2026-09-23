import test from "node:test";
import assert from "node:assert/strict";
import { calculatePaydownSchedule, PAYDOWN_METHODS } from "./paydownData.js";

const loan = (overrides = {}) => ({ id: 1, name: "Card", provider: "", apr: 0, minPayment: 10, balance: 100, payoffStartDate: new Date(2026, 0, 1), ...overrides });
const asOfDate = new Date(2026, 5, 15);

test("records the opening balance before payments begin in the following month", () => {
  const result = calculatePaydownSchedule([loan()], PAYDOWN_METHODS.snowball, 0, [], [], asOfDate);
  assert.equal(result.paymentArray[0].payments[0].balance, 100);
  assert.equal(result.paymentArray[0].totalPaid ?? 0, 0);
  assert.equal(result.paymentArray[1].date.getMonth(), 1);
  assert.equal(result.paymentArray[1].payments[0].balance, 90);
});

test("rounds monthly interest to cents and handles a final partial payment", () => {
  const interest = calculatePaydownSchedule([loan({ balance: 1000, apr: 10, minPayment: 100 })], PAYDOWN_METHODS.minPayments, 0, [], [], asOfDate);
  assert.equal(interest.paymentArray[1].payments[0].interestPaid, 8.33);
  const final = calculatePaydownSchedule([loan({ balance: 10, minPayment: 333 })], PAYDOWN_METHODS.minPayments, 0, [], [], asOfDate);
  assert.equal(final.paymentArray[1].payments[0].principalPaid, 10);
  assert.equal(final.totalPrincipalPaid, 10);
});

test("sums same-month one-time payments and snowball adjustments", () => {
  const result = calculatePaydownSchedule([loan()], PAYDOWN_METHODS.snowball, 0,
    [{ date: new Date(2026, 2, 1), amount: 10 }, { date: new Date(2026, 2, 28), amount: 15 }],
    [{ date: new Date(2026, 2, 2), amount: 5 }, { date: new Date(2026, 2, 5), amount: 5 }], asOfDate);
  assert.equal(result.paymentArray[2].payments[0].balance, 45);
});

test("avalanche and snowball use stable priority and tie-break ordering", () => {
  const loans = [loan({ id: 2, name: "second", apr: 20, balance: 100 }), loan({ id: 1, name: "first", apr: 20, balance: 100 })];
  const result = calculatePaydownSchedule(loans, PAYDOWN_METHODS.avalanche, 10, [], [], new Date(2026, 0, 15));
  assert.equal(result.paymentArray[1].payments[0].loanID, 1);
  assert.equal(result.paymentArray[1].payments[0].balance, 81.67);
});

test("minimum-payment projections ignore additional cash", () => {
  const result = calculatePaydownSchedule([loan()], PAYDOWN_METHODS.minPayments, 100,
    [{ date: new Date(2026, 1, 1), amount: 50 }], [], asOfDate);
  assert.equal(result.paymentArray[1].payments[0].balance, 90);
});

test("preserves uneven latest observations for each starting balance", () => {
  const result = calculatePaydownSchedule([
    loan({ id: 1, payoffStartDate: new Date(2026, 0, 1) }),
    loan({ id: 2, payoffStartDate: new Date(2026, 1, 1), balance: 75 })
  ], PAYDOWN_METHODS.snowball, 0, [], [], asOfDate);
  assert.deepEqual(result.startingBalances.map(item => [item.id, item.date.getMonth()]).sort((a, b) => a[0] - b[0]), [[1, 0], [2, 1]]);
  assert.equal(result.paymentArray[1].payments.find(item => item.loanID === 2).balance, 75);
  assert.equal(result.paymentArray[1].payments.find(item => item.loanID === 2).interestPaid, 0);
});

test("reports invalid, future, non-amortizing, paid-off, and over-horizon cases", () => {
  assert.match(calculatePaydownSchedule([loan({ balance: -1 })], undefined, 0, [], [], asOfDate).errors[0], /non-negative/);
  assert.match(calculatePaydownSchedule([loan({ payoffStartDate: new Date(2026, 6, 1) })], undefined, 0, [], [], asOfDate).errors[0], /later/);
  assert.match(calculatePaydownSchedule([loan({ apr: 12, balance: 1000, minPayment: 1 })], undefined, 0, [], [], asOfDate).errors[0], /cover monthly interest/);
  const paid = calculatePaydownSchedule([loan({ balance: 0 })], undefined, 0, [], [], asOfDate);
  assert.equal(paid.alreadyPaidOff, true);
  assert.equal(paid.paymentArray.length, 1);
  assert.match(calculatePaydownSchedule([loan({ balance: 2000, minPayment: 1 })], undefined, 0, [], [], asOfDate).errors[0], /horizon/);
});
