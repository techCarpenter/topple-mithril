import m from "mithril";
import { ProjectionLineChart } from "./PaydownScatterPlot.js";
import { ProgressBarChart } from "./PayoffBarChart.js";
import { actions, selectors, state } from "../state/index.js";

const CHART_OPTIONS = [
  { id: "projection", label: "Projection" },
  { id: "progress", label: "Account Progress" }
];

/** @type {m.Component} */
const PlannerChartPanel = {
  view: () => {
    const payoffLoans = selectors.payoffLoans();
    const hasPlannerData = payoffLoans.length > 0;

    return m("section.panel", [
      m("div.panel-header.panel-header-tight", [
        m("div", [
          m("p.eyebrow", "Charts"),
          m("h3", state.plannerChartMode === "projection" ? "Balance projection" : "Account progress")
        ]),
        m("div.segmented-control", CHART_OPTIONS.map((option) => (
          m("button", {
            key: option.id,
            type: "button",
            className: state.plannerChartMode === option.id ? "is-active" : "",
            "aria-pressed": state.plannerChartMode === option.id ? "true" : "false",
            disabled: !hasPlannerData,
            onclick: () => actions.setPlannerChartMode(option.id)
          }, option.label)
        )))
      ]),
      m("p.section-copy", state.plannerChartMode === "projection"
        ? "Track historical balances against the current payoff path."
        : "Compare how much of each balance is already behind you."),
      hasPlannerData
        ? m("div.chart-panel", [
          state.plannerChartMode === "projection"
            ? m(ProjectionLineChart)
            : m(ProgressBarChart)
        ])
        : m("div.planner-empty-state", [
          m("h4", "Planner charts need account balances"),
          m("p.empty-copy", "Add an account and save at least one snapshot to unlock projections.")
        ])
    ]);
  }
};

export { PlannerChartPanel };
