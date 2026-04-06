import m from "mithril";
import { PlotlyLineChart } from "./PaydownScatterPlot.js";
import { PlotlyBarChart } from "./PayoffBarChart.js";
import { PaydownInfo } from "./PaydownInfo.js";
import { PayoffDates } from "./PayoffDates.js";
import { AccountProjectionTable } from "./AccountProjectionTable.js";
import { selectors, state } from "../state/index.js";

/** @type {m.Component} */
const PlannerDashboard = {
  view: () => {
    const payoffLoans = selectors.payoffLoans();

    return m("section.stack-lg", [
      m("div.hero-card", [
        m("p.eyebrow", "Planner Dashboard"),
        m("h1.primary-title", "Model your debt paydown plan"),
        m("p.hero-copy", "Track current balances, test payoff strategies, and keep the whole plan current from one place.")
      ]),
      m(PaydownInfo),
      payoffLoans.length === 0
        ? m("section.panel.empty-state", [
          m("h3", "Start with an account and a snapshot"),
          m("p", "The charts and payoff projections appear once at least one account has a balance snapshot.")
        ])
        : m("section.panel", [
          m("h3", "Balance History And Projection"),
          m(PlotlyLineChart)
        ]),
      payoffLoans.length > 0
        ? m("section.panel", [
          m("h3", "Current Progress By Account"),
          m(PlotlyBarChart)
        ])
        : null,
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
