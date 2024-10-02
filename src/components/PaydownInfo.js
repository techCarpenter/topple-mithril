import m from "mithril";
import { getPaidToCurrent, percentFormat, currencyFormat, currentBalance, dateFormat, getTotalPaymentData, PAYDOWN_METHODS } from "../paydownData";
import { state, actions } from "../state";

let infoItems = [];

function updateInfo() {
  let paidAmt = getPaidToCurrent(state.paydownData);
  let progress = ((paidAmt / state.paydownData.totalPaid) * 100);

  infoItems = [
    {
      title: `Progress (${percentFormat(progress, 1)})`,
      value: progress
    },
    {
      title: "Total Saved",
      value: currencyFormat(getTotalPaymentData(state.accounts, PAYDOWN_METHODS.minPayments, 0).totalPaid - state.paydownData.totalPaid)
    },
    {
      title: "Current Balance",
      value: currencyFormat(currentBalance(state.paydownData))
    },
    {
      title: "Paid So Far",
      value: currencyFormat(paidAmt)
    },
    {
      title: "Starting Balance",
      value: currencyFormat(state.accounts.map((acct) => acct.balance).reduce((acc, cur) => acc + cur))
    },
    {
      title: "Time Remaining",
      value: `${(state.paydownData.monthsLeft / 12).toFixed(2)} Years`
    },
    {
      title: "Total Paid",
      value: currencyFormat(state.paydownData.totalPaid)
    },
    {
      title: "Final Snowball",
      value: currencyFormat(state.paydownData.finalSnowball)
    },
    {
      title: "Total Interest Paid",
      value: currencyFormat(state.paydownData.totalInterestPaid)
    },
    {
      title: "DEBT FREE",
      value: dateFormat(state.paydownData.endDate)
    }];
}

/**
 * @type {m.Component}
 */
const PaydownInfo = {
  view: function () {
    return [
      m("div", { style: { margin: "10px 0"}}, [
        m("label", { for: "snowball" }, "Snowball: "),
        m("input#snowball", {
          type: "number", min: "0", step: "20", value: state.snowball, onchange: function (e) {
            e.preventDefault();
            actions.setSnowball(parseInt(e.target.value));
          }
        })
      ]),
      m("hr"),
      m("h3", "Paydown Info"),
      m("div.info-block",
        [...infoItems.map(item => {
          return m("div.paydown-stat-block", [
            m("h4", item.title),
            item.title.startsWith("Progress")
              ? m("div", { style: { width: "100%", border: "1px solid darkgray" } },
                m("div", { style: { height: "25px", backgroundColor: "limegreen", width: `${item.value}%` } }))
              : m("p", item.value)
          ]);
        })
        ]
      )]
  },
  oninit: () => updateInfo(),
  onbeforeupdate: () => updateInfo()
}

export { PaydownInfo }