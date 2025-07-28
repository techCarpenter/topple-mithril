import m from "mithril";
import { percentFormat, currencyFormat, currentBalance, dateFormat } from "../paydownData";
import { state, actions } from "../state";

let infoItems = [];

function updateInfo() {
  // let paidAmt = getPaidToCurrent(state.paydownData);

  let startingAmount = state.balanceSnapshots.map(snap => snap.balances).flat().reduce((acc, cur) => { acc[cur.loanID] = Math.max(acc[cur.loanID] ?? 0, cur.balance); return acc; }, {});
  let maxBalance = Object.values(startingAmount).reduce((acc, cur) => acc + cur);
  let progress = (((maxBalance - currentBalance(state.paydownData)) / maxBalance) * 100);

  infoItems = [
    {
      title: `Progress (${percentFormat(progress, 1)})`,
      value: progress
    },
    {
      title: "Starting Balance",
      value: currencyFormat(maxBalance)
    },
    {
      title: "Current Balance",
      value: currencyFormat(currentBalance(state.paydownData))
    },
    // {
    //   title: "Total Paid",
    //   value: currencyFormat(state.paydownData.totalPaid)
    // },
    // {
    //   title: "Total Interest",
    //   value: currencyFormat(state.paydownData.totalInterestPaid)
    // },
    {
      title: "Final Snowball",
      value: currencyFormat(state.paydownData.finalSnowball)
    },
    {
      title: "Time Remaining",
      value: `${Math.floor(state.paydownData.monthsLeft / 12)} Years, ${(state.paydownData.monthsLeft % 12)} Months`
    },
    {
      title: "DEBT FREE",
      value: dateFormat(state.paydownData.endDate)
    },
    // {
    //   title: "Total Saved",
    //   value: currencyFormat(getFuturePaydownData(state.accounts, PAYDOWN_METHODS.minPayments, 0).totalPaid - state.paydownData.totalPaid)
    // },
    // {
    //   title: "Paid So Far",
    //   value: currencyFormat(paidAmt)
    // },
  ];
}

/**
 * @type {m.Component}
 */
const PaydownInfo = {
  view: function () {
    return [
      m("div", { style: { margin: "10px 0" } }, [
        m("label", { for: "snowball" }, "Extra Snowball: "),
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