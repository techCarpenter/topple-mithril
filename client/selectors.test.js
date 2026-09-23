import test from 'node:test';
import assert from 'node:assert/strict';
import { Selectors } from './selectors.js';

function fixture(overrides = {}) {
  return {
    loans: [{ id: 1, name: 'Card', provider: '', apr: 0, minPayment: 10 }],
    snapshots: [{ accountId: 1, date: new Date(2026, 0, 1), balance: 100 }],
    paydownMethod: 'snowball', snowball: 0, extraPayments: [], snowballAdjustments: [],
    ...overrides
  };
}

test('recorded balance retains its date while the monthly estimate changes', () => {
  const selectors = Selectors(fixture(), () => new Date(2026, 1, 28));
  const [row] = selectors.accountProjectionRows();
  assert.equal(row.recordedBalance, 100);
  assert.equal(row.lastSnapshot.getMonth(), 0);
  assert.equal(row.estimatedBalance, 90);
});

test('same-day results are cached; local month rollover refreshes all date-dependent selectors', () => {
  let now = new Date(2026, 1, 28, 23, 59);
  const selectors = Selectors(fixture(), () => now);
  const projection = selectors.paydownData();
  const baseline = selectors.baselinePaydownData();
  const rows = selectors.accountProjectionRows();
  const comparison = selectors.paydownComparison();
  now = new Date(2026, 1, 28, 23, 59, 59);
  assert.strictEqual(selectors.paydownData(), projection);
  now = new Date(2026, 2, 1);
  assert.notStrictEqual(selectors.paydownData(), projection);
  assert.notStrictEqual(selectors.baselinePaydownData(), baseline);
  assert.notStrictEqual(selectors.accountProjectionRows(), rows);
  assert.notStrictEqual(selectors.paydownComparison(), comparison);
  assert.equal(selectors.paydownData().monthsLeft, projection.monthsLeft - 1);
  assert.equal(selectors.accountProjectionRows()[0].estimatedBalance, 80);
  assert.equal(selectors.paydownComparison().currentBalance, 80);
});

test('a future observation becomes usable on its local calendar day without changing state', () => {
  let now = new Date(2026, 0, 1, 23, 59);
  const state = fixture();
  state.snapshots[0].date = new Date(2026, 0, 2);
  const selectors = Selectors(state, () => now);
  assert.ok(selectors.paydownData().errors.length);
  assert.equal(selectors.accountProjectionRows()[0].recordedBalance, 100);
  assert.equal(selectors.accountProjectionRows()[0].estimatedBalance, null);
  now = new Date(2026, 0, 2);
  assert.deepEqual(selectors.paydownData().errors, []);
  assert.equal(selectors.accountProjectionRows()[0].estimatedBalance, 100);
});

test('paid-off accounts estimate zero rather than falling back to their recorded balance', () => {
  const state = fixture();
  state.loans.push({ id: 2, name: 'Longer loan', apr: 0, minPayment: 1 });
  state.snapshots[0].balance = 10;
  state.snapshots.push({ accountId: 2, date: new Date(2026, 0, 1), balance: 100 });
  const selectors = Selectors(state, () => new Date(2026, 2, 1));
  const row = selectors.accountProjectionRows().find(row => row.id === 1);
  assert.equal(row.recordedBalance, 10);
  assert.equal(row.estimatedBalance, 0);
});
