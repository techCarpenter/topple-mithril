import m from "mithril"

const PayoffDates = {
  view: function () {
    m("div", { style: { minWidth: "200px" } }, [
      m("h3", "PayoffDates"),
      m("div", { id: "payoff-dates" })
    ]);
  }
}

export { PayoffDates };