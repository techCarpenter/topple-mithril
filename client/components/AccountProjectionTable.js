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
          m("h3", "Projected account details")
        ]),
        m("p.section-copy", "Review the current balance and projected payoff date for each account.")
      ]),
      rows.length === 0
        ? m("p.empty-copy", "Add snapshots to see account-level payoff dates.")
        : [
          m("div.table-wrap.account-projection-desktop", [
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
          ]),
          m("div.account-projection-mobile", rows.map((row) => (
            m("article.account-projection-card", { key: `${row.id}-mobile` }, [
              m("div.account-projection-card-header", [
                m("div", [
                  m("strong", row.name),
                  row.provider ? m("p.table-subtext", row.provider) : null
                ]),
                m("p.account-projection-payoff", row.projectedPayoffDate ? dateFormat(row.projectedPayoffDate) : "Not projected")
              ]),
              m("div.account-projection-metrics", [
                m("div.account-projection-metric", [
                  m("span.account-projection-label", "APR"),
                  m("strong", `${row.apr.toFixed(2)}%`)
                ]),
                m("div.account-projection-metric", [
                  m("span.account-projection-label", "Min payment"),
                  m("strong", currencyFormat(row.minPayment))
                ]),
                m("div.account-projection-metric", [
                  m("span.account-projection-label", "Current balance"),
                  m("strong", currencyFormat(row.currentBalance))
                ])
              ])
            ])
          )))
        ]
    ]);
  }
};

export { AccountProjectionTable };
