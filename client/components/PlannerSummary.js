import m from "mithril";
import { currencyFormat, dateFormat, percentFormat, PAYDOWN_METHODS } from "../paydownData.js";
import { actions, selectors, state } from "../state/index.js";

const METHOD_LABELS = {
  [PAYDOWN_METHODS.snowball]: "Snowball",
  [PAYDOWN_METHODS.avalanche]: "Avalanche",
  [PAYDOWN_METHODS.minPayments]: "Minimum Payments"
};

function formatTimeRemaining(monthsLeft, hasPaydownData) {
  if (!hasPaydownData) {
    return "Not available";
  }

  const years = Math.floor(monthsLeft / 12);
  const months = monthsLeft % 12;

  if (years === 0) {
    return `${months} mo`;
  }

  if (months === 0) {
    return `${years} yr`;
  }

  return `${years} yr ${months} mo`;
}

function buildPlannerMetrics() {
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

  return {
    primaryMetrics: [
      {
        label: "Current Balance",
        value: hasPaydownData ? currencyFormat(comparison.currentBalance) : "Not available",
        note: hasPaydownData ? `${percentFormat(progress, 1)} paid down` : "Add a snapshot to show balances"
      },
      {
        label: "Projected Payoff",
        value: hasPaydownData ? dateFormat(paydownData.endDate) : "Not available",
        note: hasPaydownData ? `${paydownData.accountPayoffOrder.length} accounts in plan` : "Add a snapshot to project dates"
      },
      {
        label: "Time Remaining",
        value: formatTimeRemaining(paydownData.monthsLeft, hasPaydownData),
        note: hasPaydownData ? "Based on current settings" : "Waiting on planner data"
      },
      {
        label: "Interest Saved",
        value: hasPaydownData ? currencyFormat(comparison.interestSaved) : "Not available",
        note: "Compared with minimum payments"
      }
    ],
    secondaryMetrics: [
      { label: "Starting Balance", value: currencyFormat(startingBalance) },
      { label: "Progress", value: percentFormat(progress, 1) },
      { label: "Total Interest", value: hasPaydownData ? currencyFormat(paydownData.totalInterestPaid) : "Not available" },
      { label: "Total Paid", value: hasPaydownData ? currencyFormat(paydownData.totalPaid) : "Not available" },
      { label: "Final Snowball", value: hasPaydownData ? currencyFormat(paydownData.finalSnowball) : "Not available" },
      { label: "Total Saved", value: hasPaydownData ? currencyFormat(comparison.totalSaved) : "Not available" },
      { label: "Months Saved", value: hasPaydownData ? `${comparison.monthsSaved}` : "Not available" },
      {
        label: "Baseline Payoff",
        value: baselinePaydownData.paymentArray.length > 0 ? dateFormat(baselinePaydownData.endDate) : "Not available"
      }
    ]
  };
}

/** @type {m.Component} */
const PlannerSummary = {
  view: () => {
    const payoffLoans = selectors.payoffLoans();
    const { primaryMetrics, secondaryMetrics } = buildPlannerMetrics();

    return m("section.stack-md", [
      m("div.planner-top-grid", [
        m("section.panel", [
          m("div.panel-header.panel-header-tight", [
            m("div", [
              m("p.eyebrow", "Scenario"),
              m("h2.section-title", "Adjust the plan")
            ]),
            m("p.section-copy", "Change the payoff method or extra monthly amount to refresh the projection.")
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
          m("p.inline-helper", payoffLoans.length === 0
            ? "Add one account and one snapshot to start the planner."
            : "Saved extra payments and snowball adjustments are included automatically.")
        ]),
        m("section.panel", [
          m("div.panel-header.panel-header-tight", [
            m("div", [
              m("p.eyebrow", "Snapshot"),
              m("h2.section-title", "Today's outlook")
            ]),
            m("p.section-copy", "Four key numbers stay visible while you explore the plan.")
          ]),
          m("div.planner-kpi-grid", primaryMetrics.map((metric) => (
            m("article.planner-kpi-card", { key: metric.label }, [
              m("p.planner-kpi-label", metric.label),
              m("p.planner-kpi-value", metric.value),
              m("p.planner-kpi-note", metric.note)
            ])
          )))
        ])
      ]),
      m("section.panel", [
        m("div.panel-header.panel-header-tight", [
          m("div", [
            m("p.eyebrow", "Plan details"),
            m("h3", "Secondary metrics")
          ]),
          m("button.button-secondary.button-compact", {
            type: "button",
            "aria-expanded": state.plannerDetailsExpanded ? "true" : "false",
            onclick: () => actions.setPlannerDetailsExpanded(!state.plannerDetailsExpanded)
          }, state.plannerDetailsExpanded ? "Hide details" : "Show details")
        ]),
        state.plannerDetailsExpanded
          ? m("div.planner-details-grid", secondaryMetrics.map((metric) => (
            m("div.planner-detail-row", { key: metric.label }, [
              m("span.planner-detail-label", metric.label),
              m("strong.planner-detail-value", metric.value)
            ])
          )))
          : m("p.section-copy", "Open this panel for progress, baseline, and payoff totals.")
      ])
    ]);
  }
};

export { PlannerSummary };
