/** @import * as types from "../types" */

/** @type {types.Loan[]} */
const accounts = [
  {
    id: "001",
    name: "0129",
    provider: "Discover",
    balance: 5351.71,
    apr: 5.74,
    minPayment: 166.43,
    dateOpened: new Date("2024-08-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "002",
    name: "0127",
    provider: "Discover",
    balance: 12161.54,
    apr: 5.24,
    minPayment: 162.46,
    dateOpened: new Date("2024-08-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "003",
    name: "B-A",
    provider: "Nelnet",
    balance: 3269.19,
    apr: 3.61,
    minPayment: 17.98,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "004",
    name: "B-B",
    provider: "Nelnet",
    balance: 2098.22,
    apr: 3.61,
    minPayment: 11.54,
    dateOpened: new Date("2024-05-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "005",
    name: "B-C",
    provider: "Nelnet",
    balance: 3510.96,
    apr: 4.41,
    minPayment: 24.65,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "006",
    name: "B-D",
    provider: "Nelnet",
    balance: 1770.68,
    apr: 4.41,
    minPayment: 12.44,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "007",
    name: "B-E",
    provider: "Nelnet",
    balance: 5064.23,
    apr: 4.04,
    minPayment: 29,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "008",
    name: "B-F",
    provider: "Nelnet",
    balance: 6987.9,
    apr: 4.04,
    minPayment: 40.01,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "009",
    name: "B-G",
    provider: "Nelnet",
    balance: 5033.02,
    apr: 3.51,
    minPayment: 27.41,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "010",
    name: "B-H",
    provider: "Nelnet",
    balance: 6635.73,
    apr: 3.51,
    minPayment: 36.14,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "011",
    name: "H-A",
    provider: "Nelnet",
    balance: 3251.51,
    apr: 3.86,
    minPayment: 40.24,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "012",
    name: "H-B",
    provider: "Nelnet",
    balance: 3940.87,
    apr: 4.66,
    minPayment: 50.03,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "013",
    name: "H-C",
    provider: "Nelnet",
    balance: 1001.19,
    apr: 4.66,
    minPayment: 12.81,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "014",
    name: "H-D",
    provider: "Nelnet",
    balance: 5028.15,
    apr: 4.29,
    minPayment: 63.07,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "015",
    name: "H-E",
    provider: "Nelnet",
    balance: 5010.41,
    apr: 3.76,
    minPayment: 61.8,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  {
    id: "016",
    name: "H-F",
    provider: "Nelnet",
    balance: 6676.12,
    apr: 3.76,
    minPayment: 82.34,
    dateOpened: new Date("2024-04-01T00:00:00"),
    lastSnapshot: null
  },
  // {
  //   id: "017",
  //   name: "Mortgage",
  //   provider: "Mr. Cooper",
  //   balance: 236901.36,
  //   apr: 6.5,
  //   minPayment: 1531.18,
  //   dateOpened: new Date("2024-09-01T00:00:00")
  // }
];
// const accounts = [
//   {
//     id: "001",
//     name: "0129",
//     provider: "Discover",
//     balance: 0,
//     apr: 5.74,
//     minPayment: 166.43,
//     dateOpened: new Date("2024-08-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "002",
//     name: "0127",
//     provider: "Discover",
//     balance: 0,
//     apr: 5.24,
//     minPayment: 162.46,
//     dateOpened: new Date("2024-08-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "003",
//     name: "B-A",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.61,
//     minPayment: 17.98,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "004",
//     name: "B-B",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.61,
//     minPayment: 11.54,
//     dateOpened: new Date("2024-05-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "005",
//     name: "B-C",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.41,
//     minPayment: 24.65,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "006",
//     name: "B-D",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.41,
//     minPayment: 12.44,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "007",
//     name: "B-E",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.04,
//     minPayment: 29,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "008",
//     name: "B-F",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.04,
//     minPayment: 40.01,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "009",
//     name: "B-G",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.51,
//     minPayment: 27.41,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "010",
//     name: "B-H",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.51,
//     minPayment: 36.14,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "011",
//     name: "H-A",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.86,
//     minPayment: 40.24,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "012",
//     name: "H-B",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.66,
//     minPayment: 50.03,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "013",
//     name: "H-C",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.66,
//     minPayment: 12.81,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "014",
//     name: "H-D",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 4.29,
//     minPayment: 63.07,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "015",
//     name: "H-E",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.76,
//     minPayment: 61.8,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   },
//   {
//     id: "016",
//     name: "H-F",
//     provider: "Nelnet",
//     balance: 0,
//     apr: 3.76,
//     minPayment: 82.34,
//     dateOpened: new Date("2024-04-01T00:00:00"),
//     lastSnapshot: null
//   }
// ];

/** @type {types.ExtraPayment[]} */
const extraPayments = [
  // {
  //   date: "01-01-2027",
  //   amount: 50000
  // },
  // {
  //   date: "01-01-2025",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2026",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2027",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2028",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2029",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2030",
  //   amount: 2000
  // },
  // {
  //   date: "01-01-2031",
  //   amount: 2000
  // }
];

/**
 * @type {types.SnapshotDetail[]}
 */
const snapshots = [
  {
    date: new Date("2024-08-01T00:00:00"),
    balances: [
      {
        loanID: "001",
        name: "0129",
        balance: 5351.71,
      },
      {
        loanID: "002",
        name: "0127",
        balance: 12161.54,
      },
      {
        loanID: "003",
        name: "B-A",
        balance: 3269.19,
      },
      {
        loanID: "004",
        name: "B-B",
        balance: 2098.22,
      },
      {
        loanID: "005",
        name: "B-C",
        balance: 3510.96,
      },
      {
        loanID: "006",
        name: "B-D",
        balance: 1770.68,
      },
      {
        loanID: "007",
        name: "B-E",
        balance: 5064.23,
      },
      {
        loanID: "008",
        name: "B-F",
        balance: 6987.9,
      },
      {
        loanID: "009",
        name: "B-G",
        balance: 5033.02,
      },
      {
        loanID: "010",
        name: "B-H",
        balance: 6635.73,
      },
      {
        loanID: "011",
        name: "H-A",
        balance: 3251.51,
      },
      {
        loanID: "012",
        name: "H-B",
        balance: 3940.87,
      },
      {
        loanID: "013",
        name: "H-C",
        balance: 1001.19,
      },
      {
        loanID: "014",
        name: "H-D",
        balance: 5028.15,
      },
      {
        loanID: "015",
        name: "H-E",
        balance: 5010.41,
      },
      {
        loanID: "016",
        name: "H-F",
        balance: 6676.12,
      },
    ]
  },
  {
    date: new Date("2019-05-01T00:00:00"),
    balances: [
      {
        loanID: "001",
        name: "0129",
        balance: 18801,
      },
      {
        loanID: "002",
        name: "0127",
        balance: 18214,
      }
    ]
  },
  {
    date: new Date("2017-11-01T00:00:00"),
    balances: [
      {
        loanID: "001",
        name: "0129",
        balance: 19993,
      },
      {
        loanID: "002",
        name: "0127",
        balance: 19636,
      },
      {
        loanID: "003",
        name: "B-A",
        balance: 3500,
      },
      {
        loanID: "004",
        name: "B-B",
        balance: 2289,
      },
      {
        loanID: "005",
        name: "B-C",
        balance: 4500,
      },
      {
        loanID: "006",
        name: "B-D",
        balance: 2257,
      },
      {
        loanID: "007",
        name: "B-E",
        balance: 5500,
      },
      {
        loanID: "008",
        name: "B-F",
        balance: 7511,
      },
      {
        loanID: "009",
        name: "B-G",
        balance: 5500,
      },
      {
        loanID: "010",
        name: "B-H",
        balance: 7186,
      }
    ]
  },
  {
    date: new Date("2018-06-01T00:00:00"),
    balances: [
      {
        loanID: "011",
        name: "H-A",
        balance: 3251.51,
      },
      {
        loanID: "012",
        name: "H-B",
        balance: 3940.87,
      },
      {
        loanID: "013",
        name: "H-C",
        balance: 1001.19,
      },
      {
        loanID: "014",
        name: "H-D",
        balance: 5028.15,
      },
      {
        loanID: "015",
        name: "H-E",
        balance: 5010.41,
      },
      {
        loanID: "016",
        name: "H-F",
        balance: 6676.12,
      }
    ]
  }]
  .reduce((/** @type {types.SnapshotDetail[]} */ acc, cur) => {
    let updatedBalances = cur.balances.map(balance => {
      return {
        loanID: balance.loanID,
        balance: balance.balance,
      };
    })
    acc.push({
      date: cur.date,
      balances: [...updatedBalances]
    });
    return acc;
  }, []);

const snowballChanges = [
  {
    date: new Date("2024-12-01"),
    amount: 2000
  }
]

export {
  accounts,
  extraPayments,
  snapshots,
  snowballChanges
}