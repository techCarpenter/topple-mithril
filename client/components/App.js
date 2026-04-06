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
      m("section.panel.app-header", [
        m("div.app-header-main", [
          m("p.eyebrow", "Topple"),
          m("h1.app-title", "Account Paydown Visualizer"),
          m("p.app-subtitle", "Compact payoff planning with balances, projections, and scenario controls in one place.")
        ]),
        m("div.app-header-meta", [
          m("p.hero-meta-label", "Current view"),
          m("p.hero-meta-value", NAV_ITEMS.find((item) => item.id === state.activeView)?.label || "Planner")
        ])
      ]),
      m(StatusBanner),
      m("div.mobile-nav.panel", [
        m("label.form-field", [
          m("span", "View"),
          m("select", {
            value: state.activeView,
            onchange: (event) => actions.setActiveView(event.target.value)
          }, NAV_ITEMS.map((item) => (
            m("option", { key: item.id, value: item.id }, item.label)
          )))
        ])
      ]),
      m("nav.tab-nav.desktop-nav", NAV_ITEMS.map((item) => (
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
