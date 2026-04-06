import m from "mithril";
import { ChartCanvas } from "../charting/ChartCanvas.js";
import { buildProgressChartConfig } from "../charting/plannerCharts.js";
import { selectors, state } from "../state/index.js";

/** @type {m.Component} */
const ProgressBarChart = {
  view: () => {
    if (state.loans.length === 0) {
      return m("p", "No loan data available.");
    }

    if (state.snapshots.length === 0) {
      return m("p", "No snapshot data available yet. Add snapshots to render the balance chart.");
    }

    const chartConfig = buildProgressChartConfig(
      selectors.payoffLoans(),
      selectors.historicBalanceArray(),
      selectors.paydownData()
    );

    return m("div.chart-canvas-shell", [
      m(ChartCanvas, {
        key: "progress-chart",
        type: chartConfig.type,
        data: chartConfig.data,
        options: chartConfig.options,
        className: "planner-chart-canvas",
        label: "Account progress chart"
      })
    ]);
  }
};

export { ProgressBarChart, ProgressBarChart as PlotlyBarChart };
