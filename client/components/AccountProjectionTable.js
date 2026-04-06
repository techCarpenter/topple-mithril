import m from "mithril";
import { currencyFormat, dateFormat } from "../paydownData.js";
import { selectors } from "../state/index.js";

/** @type {m.Component} */
const AccountProjectionTable = {
  view: () => {
    const rows = selectors.accountProjectionRows();

    return m("section.panel", [
      m("h3", "Account Details"),
      rows.length === 0
        ? m("p.empty-copy", "Add snapshots to see projected payoff dates by account.")
        : m("div.table-wrap", [
          m("table", [
            m("thead", m("tr", [
              m("th", "Account"),
              m("th", "APR"),
              m("th", "Min Payment"),
              m("th", "Current Balance"),
              m("th", "Projected Payoff")
            ])),
            m("tbody", rows.map((row) => (
              m("tr", { key: row.id }, [
                m("td", [
                  m("strong", row.name),
                  row.provider ? m("div.table-subtext", row.provider) : null
                ]),
                m("td", `${row.apr.toFixed(2)}%`),
                m("td", currencyFormat(row.minPayment)),
                m("td", currencyFormat(row.currentBalance)),
                m("td", row.projectedPayoffDate ? dateFormat(row.projectedPayoffDate) : "Not projected")
              ])
            )))
          ])
        ])
    ]);
  }
};

export { AccountProjectionTable };
