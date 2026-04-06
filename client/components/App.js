import m from "mithril";
import { actions, state } from "../state/index.js";
import { PlannerDashboard } from "./PlannerDashboard.js";
import { LoanManager } from "./LoanManager.js";
import { SnapshotManager } from "./SnapshotManager.js";
import { ExtraPaymentManager } from "./ExtraPaymentManager.js";
import { SnowballAdjustmentManager } from "./SnowballAdjustmentManager.js";
import { StatusBanner } from "./StatusBanner.js";

const NAV_ITEMS = [
  { id: "planner", label: "Planner" },
  { id: "accounts", label: "Accounts" },
  { id: "snapshots", label: "Snapshots" },
  { id: "extra-payments", label: "Extra Payments" },
  { id: "snowball-adjustments", label: "Snowball Adjustments" }
];

function renderActiveView() {
  switch (state.activeView) {
    case "accounts":
      return m(LoanManager);
    case "snapshots":
      return m(SnapshotManager);
    case "extra-payments":
      return m(ExtraPaymentManager);
    case "snowball-adjustments":
      return m(SnowballAdjustmentManager);
    case "planner":
    default:
      return m(PlannerDashboard);
  }
}

/** @type {m.Component} */
const App = {
  view: function () {
    return m("div.app-shell", [
      m("section.hero-frame", [
        m("p.eyebrow", "Topple"),
        m("h1.primary-title", "Account Paydown Visualizer"),
        m("p.hero-copy", "Build your payoff plan, keep balances current, and compare the impact of every extra dollar.")
      ]),
      m(StatusBanner),
      m("nav.tab-nav", NAV_ITEMS.map((item) => (
        m("button", {
          key: item.id,
          type: "button",
          className: state.activeView === item.id ? "is-active" : "",
          onclick: () => actions.setActiveView(item.id)
        }, item.label)
      ))),
      state.loading.initialize
        ? m("section.panel", m("p", "Loading account data..."))
        : renderActiveView()
    ]);
  },
  oninit: () => {
    void actions.initialize();
  }
};

export { App };
