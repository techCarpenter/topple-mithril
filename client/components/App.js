import m from "mithril"
import { PlotlyLineChart } from "./PaydownScatterPlot"
import { PlotlyBarChart } from "./PayoffBarChart"
import { actions } from "../state"
import { PaydownInfo } from "./PaydownInfo"

/** @type {m.Component} */
const App = {
  view: function () {
    return [m(PlotlyLineChart), m("hr"), m(PaydownInfo), m("hr"), m(PlotlyBarChart)];
  },
  oninit: () => actions.fetchPaydownData(),
  onbeforeupdate: () => actions.fetchPaydownData()
}

export { App }