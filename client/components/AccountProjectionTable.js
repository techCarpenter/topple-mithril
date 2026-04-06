import m from "mithril";
import { currencyFormat, dateFormat } from "../paydownData.js";
import { selectors } from "../state/index.js";

/** @type {m.Component} */
const AccountProjectionTable = {
  view: () => {
    const rows = selectors.accountProjectionRows();

    return m("section.panel", [
      m("div.panel-header", [
        m("div", [
          m("p.eyebrow", "Accounts"),
          m("h3", "Projected Account Details")
        ]),
        m("p.section-copy", "Review the latest balance and projected payoff date for each account.")
      ]),
      rows.length === 0
        ? m("p.empty-copy", "Add snapshots to see projected payoff dates by account.")
        : m("div.table-wrap", [
          m("table.responsive-table", [
            m("thead", m("tr", [
              m("th", "Account"),
              m("th", "APR"),
              m("th", "Min Payment"),
              m("th", "Current Balance"),
              m("th", "Projected Payoff")
            ])),
            m("tbody", rows.map((row) => (
              m("tr", { key: row.id }, [
                m("td", { "data-label": "Account" }, [
                  m("strong", row.name),
                  row.provider ? m("div.table-subtext", row.provider) : null
                ]),
                m("td", { "data-label": "APR" }, `${row.apr.toFixed(2)}%`),
                m("td", { "data-label": "Min Payment" }, currencyFormat(row.minPayment)),
                m("td", { "data-label": "Current Balance" }, currencyFormat(row.currentBalance)),
                m("td", { "data-label": "Projected Payoff" }, row.projectedPayoffDate ? dateFormat(row.projectedPayoffDate) : "Not projected")
              ])
            )))
          ])
        ])
    ]);
  }
};

export { AccountProjectionTable };
