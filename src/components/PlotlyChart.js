import m from "mithril";
import * as Plotly from "plotly.js-basic-dist-min";
import { CreateTrace, plotlyConfig } from "../plotlyConfig";
import { copy } from "../paydownData";
import { state } from "../state";

let config = copy(plotlyConfig);

function plotChartData() {
  let now = new Date();
  config.layout.shapes[0].x0 = now;
  config.layout.shapes[0].x1 = now;
  
  let updatedChart = updateChart(state.accounts, config);
  config.data = updatedChart.data;
  config.layout.datarevision = updatedChart.layout.datarevision;
  config.layout.height = 450;

  Plotly.react("plotly-chart", config.data, config.layout, config.config);
}

const updateChart = (accounts, chartConfig) => {
  if (accounts && accounts !== null && accounts.length > 0) {
    try {
      let xTrace = state.paydownData.paymentArray.map(x => x.date);
      let traces = [];

      for (let i = 0; i < accounts.length; i++) {
        traces.push(
          CreateTrace({
            y: state.paydownData.paymentArray.map(
              payPeriod => {
                let paymentInfo = payPeriod.payments.filter(
                  payment =>
                    payment.loanID === accounts[i].id
                );
                if (paymentInfo.length > 0) {
                  return paymentInfo[0].balance;
                } else {
                  return null;
                }
              }
            ),
            x: xTrace,
            name: accounts[i].name
          })
        );
      }

      chartConfig.data = traces;
      chartConfig.layout.datarevision = Date.now();
    } catch (err) {
      console.error("Error updating chart:", err);
    }
    return chartConfig;
  }
};

/**
 * @type {m.Component}
 */
const PlotlyChart = {
  view: () => {
    return m("div#plotly-chart")
  },
  oncreate: () => plotChartData(),
  onupdate: () => plotChartData()
}

export { PlotlyChart }