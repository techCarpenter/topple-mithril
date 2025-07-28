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
  let updatedConfig = copy(chartConfig)
  if (accounts && accounts !== null && accounts.length > 0) {
    try {
      let xTrace = [...state.historicBalanceArray.map(x => x.date).slice(0, -1), ...state.paydownData.paymentArray.map(x => x.date)];
      let traces = [],
        yTrace = [];

      for (let i = 0; i < accounts.length; i++) {
        let historicYData = state.historicBalanceArray.slice(0, -1).map(
          balancePeriod => {
            let balanceInfo = balancePeriod.balances.filter(
              bal => bal.loanID === accounts[i].id);
            if (balanceInfo.length > 0) {
              return balanceInfo[0].balance;
            } else {
              return null;
            }
          }
        ),
          projectedYData = state.paydownData.paymentArray.map(
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
          );
        yTrace = [...historicYData, ...projectedYData];
        traces.push(
          CreateTrace({
            y: yTrace,
            x: xTrace,
            name: accounts[i].name
          })
        );
      }

      updatedConfig.data = traces;
      updatedConfig.layout.datarevision = Date.now();
    } catch (err) {
      console.error("Error updating chart:", err);
    }
  }
  return updatedConfig;
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