import m from "mithril";
import { currencyFormat, dateFormat, percentFormat, PAYDOWN_METHODS } from "../paydownData.js";
import { actions, selectors, state } from "../state/index.js";

const METHOD_LABELS = {
  [PAYDOWN_METHODS.snowball]: "Snowball",
  [PAYDOWN_METHODS.avalanche]: "Avalanche",
  [PAYDOWN_METHODS.minPayments]: "Minimum Payments"
};

function buildSummaryItems() {
  const balanceSnapshots = selectors.balanceSnapshots();
  const paydownData = selectors.paydownData();
  const baselinePaydownData = selectors.baselinePaydownData();
  const comparison = selectors.paydownComparison();
  const hasPaydownData = paydownData.paymentArray.length > 0;
  const initialBalances = balanceSnapshots
    .map((snapshot) => snapshot.balances)
    .flat()
    .reduce((acc, current) => {
      acc[current.loanID] = Math.max(acc[current.loanID] ?? 0, current.balance);
      return acc;
    }, {});
  const startingBalance = Object.values(initialBalances).reduce((acc, current) => acc + current, 0);
  const progress = startingBalance > 0
    ? (((startingBalance - comparison.currentBalance) / startingBalance) * 100)
    : 0;

  return [
    { title: `Progress (${percentFormat(progress, 1)})`, value: progress, kind: "progress" },
    { title: "Starting Balance", value: currencyFormat(startingBalance) },
    { title: "Current Balance", value: currencyFormat(comparison.currentBalance) },
    { title: "Projected Payoff", value: hasPaydownData ? dateFormat(paydownData.endDate) : "Not available" },
    {
      title: "Time Remaining",
      value: hasPaydownData
        ? `${Math.floor(paydownData.monthsLeft / 12)} years, ${paydownData.monthsLeft % 12} months`
        : "Not available"
    },
    { title: "Total Interest", value: currencyFormat(paydownData.totalInterestPaid) },
    { title: "Total Paid", value: currencyFormat(paydownData.totalPaid) },
    { title: "Final Snowball", value: currencyFormat(paydownData.finalSnowball) },
    { title: "Interest Saved", value: currencyFormat(comparison.interestSaved) },
    { title: "Total Saved", value: currencyFormat(comparison.totalSaved) },
    { title: "Months Saved", value: hasPaydownData ? `${comparison.monthsSaved}` : "0" },
    {
      title: "Baseline Payoff",
      value: baselinePaydownData.paymentArray.length > 0 ? dateFormat(baselinePaydownData.endDate) : "Not available"
    }
  ];
}

/** @type {m.Component} */
const PaydownInfo = {
  view: function () {
    const payoffLoans = selectors.payoffLoans();
    const summaryItems = buildSummaryItems();

    return m("section.stack-lg", [
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Scenario Controls"),
            m("h3", "Adjust the plan")
          ]),
          m("p.section-copy", "Choose a payoff strategy and monthly snowball amount to update the projection instantly.")
        ]),
        m("div.control-grid", [
          m("label.form-field", [
            m("span", "Paydown method"),
            m("select", {
              value: state.paydownMethod,
              onchange: (event) => actions.setPaydownMethod(event.target.value)
            }, Object.entries(METHOD_LABELS).map(([value, label]) => (
              m("option", { key: value, value }, label)
            )))
          ]),
          m("label.form-field", [
            m("span", "Monthly extra snowball"),
            m("input", {
              id: "snowball",
              type: "number",
              min: "0",
              step: "10",
              value: state.snowball,
              oninput: (event) => actions.setSnowball(parseFloat(event.target.value))
            })
          ])
        ]),
        payoffLoans.length === 0
          ? m("p.empty-copy", "Planner metrics will populate once at least one account has a snapshot.")
          : null
      ]),
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Summary"),
            m("h3", "Plan snapshot")
          ]),
          m("p.section-copy", "These metrics reflect the currently selected strategy, recurring snowball amount, and saved adjustments.")
        ]),
        m("div.info-grid", summaryItems.map((item) => (
          m("div.paydown-stat-block", { key: item.title }, [
            m("h4", item.title),
            item.kind === "progress"
              ? m("div.progress-track", [
                m("div.progress-bar", { style: { width: `${item.value}%` } })
              ])
              : m("p.stat-value", item.value)
          ])
        )))
      ])
    ]);
  }
};

export { PaydownInfo };
