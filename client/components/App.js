import m from "mithril"
import { PlotlyChart } from "./PlotlyChart"
import { actions } from "../state"
import { PaydownInfo } from "./PaydownInfo"

/** @type {m.Component} */
const App = {
  view: function () {
    return [m(PlotlyChart), m(PaydownInfo)];
  },
  oninit: () => actions.fetchPaydownData(),
  onbeforeupdate: () => actions.fetchPaydownData()
}

export { App }