import m from "mithril";
import { PlannerSummary } from "./PlannerSummary.js";
import { PlannerChartPanel } from "./PlannerChartPanel.js";
import { PayoffDates } from "./PayoffDates.js";
import { AccountProjectionTable } from "./AccountProjectionTable.js";
import { state } from "../state/index.js";

/** @type {m.Component} */
const PlannerDashboard = {
  view: () => {
    return m("section.stack-lg", [
      m("header.planner-header", [
        m("div", [
          m("p.eyebrow", "Planner"),
          m("h1.page-title", "Debt payoff planner"),
          m("p.planner-header-copy", "Model the payoff path, compare outcomes, and keep the essentials visible.")
        ])
      ]),
      m(PlannerSummary),
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
