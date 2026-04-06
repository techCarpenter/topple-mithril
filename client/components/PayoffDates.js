import m from "mithril";
import { currencyFormat, dateFormat } from "../paydownData.js";
import { selectors } from "../state/index.js";

/** @type {m.Component} */
const PayoffDates = {
  view: function () {
    const payoffTimeline = selectors.payoffTimeline();

    return m("section.panel", [
      m("div.panel-header", [
        m("div", [
          m("p.eyebrow", "Timeline"),
          m("h3", "Payoff Timeline")
        ]),
        m("p.section-copy", "See the expected payoff sequence and how the snowball grows over time.")
      ]),
      payoffTimeline.length === 0
        ? m("p.empty-copy", "Projected payoff dates appear here after you add account balances.")
        : m("ol.payoff-timeline", payoffTimeline.map((item) => (
          m("li.payoff-timeline-item", { key: item.id }, [
            m("div.timeline-order", `${item.order}`),
            m("div", [
              m("strong", item.name),
              m("p.timeline-copy", `Projected payoff: ${dateFormat(item.payoffDate)}`),
              m("p.timeline-copy", `New snowball: ${currencyFormat(item.newSnowball)}`)
            ])
          ])
        )))
    ]);
  }
};

export { PayoffDates };
