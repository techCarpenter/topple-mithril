/** @import * as types from "../types" */

import m from "mithril";
import * as Plotly from "plotly.js-basic-dist-min";
import { CreateTrace, lineGraphConfig } from "../paydownScatterPlotConfig";
import { deepCopy } from "../paydownData";
import { selectors, state } from "../state/index.js";

let config = deepCopy(lineGraphConfig);

function plotChartData() {
  let now = new Date();
  config.layout.shapes[0].x0 = now;
  config.layout.shapes[0].x1 = now;

  const payoffLoans = selectors.payoffLoans();
  const historicBalanceArray = selectors.historicBalanceArray();
  const paydownData = selectors.paydownData();
  let updatedChart = updateChart(payoffLoans, historicBalanceArray, paydownData, config);
  config.data = updatedChart.data;
  config.layout.datarevision = updatedChart.layout.datarevision;
  config.layout.height = 450;

  Plotly.react("plotly-chart", config.data, config.layout, config.config);
}

/**
 * @param {types.Loan[]} accounts
 * @param {types.SnapshotDetail[]} historicBalanceArray
 * @param {types.PaydownDataDetail} paydownData
 * @param {Plotly.PlotlyDataLayoutConfig} chartConfig
 */
const updateChart = (accounts, historicBalanceArray, paydownData, chartConfig) => {
  let updatedConfig = deepCopy(chartConfig);
  if (accounts && accounts !== null && accounts.length > 0) {

    try {
      let xTrace = [...historicBalanceArray.map(x => x.date).slice(0, -1), ...paydownData.paymentArray.map(x => x.date)];
      let traces = [],
        yTrace = [];

      for (let i = 0; i < accounts.length; i++) {
        let historicYData = historicBalanceArray.slice(0, -1).map(
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
          projectedYData = paydownData.paymentArray.map(
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
const PlotlyLineChart = {
  view: () => {
    if (state.loans.length === 0) {
      return m("p", "No loan data available.");
    }

    if (state.snapshots.length === 0) {
      return m("p", "No snapshot data available yet. Add snapshots to render the payoff chart.");
    }

    return m("div#plotly-chart")
  },
  oncreate: () => {
    if (state.snapshots.length > 0) {
      plotChartData();
    }
  },
  onupdate: () => {
    if (state.snapshots.length > 0) {
      plotChartData();
    }
  }
}

export { PlotlyLineChart }
