import m from "mithril";
import * as Plotly from "plotly.js-basic-dist-min";
import { CreateBarTrace, barChartConfig } from "../barChartConfig";
import { deepCopy } from "../paydownData";
import { state } from "../state";

let config = deepCopy(barChartConfig);

function plotChartData() {
  let updatedChart = updateChart(state.accounts, config);
  config.data = updatedChart.data;
  config.layout.datarevision = updatedChart.layout.datarevision;

  Plotly.react("payff-bar-chart", config.data, config.layout, config.config);
}

const updateChart = (accounts, chartConfig) => {
  let updatedConfig = deepCopy(chartConfig);

  if (accounts && accounts !== null && accounts.length > 0) {
    try {
      let data = [];

      for (let i = 0; i < accounts.length; i++) {
        let historicYData = state.historicBalanceArray.slice(0, -1).map(
          balancePeriod => {
            let balanceInfo = balancePeriod.balances.filter(
              bal => bal.loanID === accounts[i].id);
            if (balanceInfo.length > 0) {
              return balanceInfo[0].balance;
            } else {
              return 0;
            }
          }
        ),
          currentBalance = state.paydownData.paymentArray.filter(payPeriod => payPeriod.date.getFullYear() === (new Date).getFullYear() && payPeriod.date.getMonth() === (new Date).getMonth())[0].payments.filter(p => p.loanID === accounts[i].id)[0].balance,
          maxBalance = Math.max(...historicYData);

        data.push({
          name: accounts[i].name,
          max: maxBalance,
          paid: maxBalance - currentBalance,
          remaining: currentBalance
        });
      }
      data.sort((a, b) => a.remaining < b.remaining ? -1 : 1);

      let traces = [],
        xTrace = data.map(d => d.name);

      traces.push(
        CreateBarTrace({
          y: data.map(d => d.remaining),
          x: xTrace,
          name: "Balance",
          color: "#dddddd",
          text: formatBarData(data.map(d => d.remaining))
        })
      );
      traces.push(
        CreateBarTrace({
          y: data.map(d => d.paid),
          x: xTrace,
          name: "Paid",
          color: "limegreen",
          text: formatBarData(data.map(d => d.paid)),
        })
      );

      updatedConfig.data = traces;
      updatedConfig.layout.datarevision = Date.now();
    } catch (err) {
      console.error("Error updating chart:", err);
    }
  }
  return updatedConfig;
};

function formatBarData(data) {
  return data.map(d => {
    if (d > 1000) {
      return `$${(d / 1000).toFixed(1)}k`;
    } else {
      return `$${d.toFixed(0)}`
    }
  });
}

/**
 * @type {m.Component}
 */
const PlotlyBarChart = {
  view: () => {
    return m("div#payff-bar-chart")
  },
  oncreate: () => plotChartData(),
  onupdate: () => plotChartData()
}

export { PlotlyBarChart }
