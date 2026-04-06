import m from "mithril";
import * as Plotly from "plotly.js-basic-dist-min";
import { CreateBarTrace, barChartConfig } from "../barChartConfig";
import { deepCopy } from "../paydownData";
import { selectors, state } from "../state/index.js";

let config = deepCopy(barChartConfig);

function plotChartData() {
  const payoffLoans = selectors.payoffLoans();
  const historicBalanceArray = selectors.historicBalanceArray();
  const paydownData = selectors.paydownData();
  let updatedChart = updateChart(payoffLoans, historicBalanceArray, paydownData, config);
  config.data = updatedChart.data;
  config.layout.datarevision = updatedChart.layout.datarevision;

  Plotly.react("payff-bar-chart", config.data, config.layout, config.config);
}

const updateChart = (accounts, historicBalanceArray, paydownData, chartConfig) => {
  let updatedConfig = deepCopy(chartConfig);

  if (accounts && accounts !== null && accounts.length > 0) {
    try {
      let data = [];
      const currentMonthPaymentPeriod = paydownData.paymentArray.find(payPeriod => {
        const now = new Date();
        return payPeriod.date.getFullYear() === now.getFullYear() &&
          payPeriod.date.getMonth() === now.getMonth();
      }) ?? paydownData.paymentArray[0];

      for (let i = 0; i < accounts.length; i++) {
        let historicYData = historicBalanceArray.slice(0, -1).map(
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
          currentBalance = currentMonthPaymentPeriod?.payments.find(p => p.loanID === accounts[i].id)?.balance ?? accounts[i].balance ?? 0,
          maxBalance = Math.max(accounts[i].balance ?? 0, ...historicYData);

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
    if (state.loans.length === 0) {
      return m("p", "No loan data available.");
    }

    if (state.snapshots.length === 0) {
      return m("p", "No snapshot data available yet. Add snapshots to render the balance chart.");
    }

    return m("div#payff-bar-chart")
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

export { PlotlyBarChart }
