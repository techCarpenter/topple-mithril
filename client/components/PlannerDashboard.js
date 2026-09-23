import m from "mithril";
import { PlannerSummary } from "./PlannerSummary.js";
import { PlannerChartPanel } from "./PlannerChartPanel.js";
import { PayoffDates } from "./PayoffDates.js";
import { AccountProjectionTable } from "./AccountProjectionTable.js";
import { selectors, state } from "../state/index.js";
import { dateStringFromDate } from "../paydownData.js";

/** @type {m.Component} */
const PlannerDashboard = {
  view: () => {
    const payoffLoans = selectors.payoffLoans();
    const paydownData = selectors.paydownData();
    const asOfDate = selectors.asOfDate();
    const snapshotDates = payoffLoans.map(loan => loan.lastSnapshot).filter(Boolean);
    const dateKeys = new Set(snapshotDates.map(dateStringFromDate));
    const stale = snapshotDates.some(date => asOfDate.getTime() - date.getTime() > 45 * 86400000);
    const future = snapshotDates.some(date => date > asOfDate);
    const uneven = dateKeys.size > 1 || payoffLoans.length < state.loans.length;
    return m("section.stack-lg", [
      m("header.planner-header", [
        m("div", [
          m("p.eyebrow", "Planner"),
          m("h1.page-title", "Debt payoff planner"),
          m("p.planner-header-copy", "Model the payoff path, compare outcomes, and keep the essentials visible.")
        ])
      ]),
      m(PlannerSummary),
      paydownData.errors?.length
        ? m("section.panel.inline-message.error", paydownData.errors.join(" "))
        : paydownData.alreadyPaidOff
          ? m("section.panel.inline-message", "All recorded balances are already paid off.")
        : stale || uneven || future
          ? m("section.panel.inline-message", [stale ? "Some balances are more than 45 days old. " : "", uneven ? "Accounts have missing or different observation dates; each projection uses that account’s latest balance. " : "", future ? "A balance observation is future-dated and cannot be projected." : ""])
          : null,
      m(PlannerChartPanel),
      m("div.dashboard-secondary-grid", [
        m(PayoffDates),
        m(AccountProjectionTable)
      ]),
      state.errors.loans || state.errors.snapshots || state.errors.extraPayments || state.errors.snowballAdjustments
        ? m("section.panel.inline-message.error", "Some planner data could not be refreshed. Check the notices above and try again.")
        : null
    ]);
  }
};

export { PlannerDashboard };
