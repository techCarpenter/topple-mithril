/** @import * as types from "../types" */

/** @type {types.Loan[]} */
const accounts = [
  // {
  //   id: "001",
  //   name: "3845372",
  //   provider: "Firstmark",
  //   apr: 5.74,
  //   minPayment: 166.43,
  // },
  // {
  //   id: "002",
  //   name: "3845371",
  //   provider: "Firstmark",
  //   apr: 5.24,
  //   minPayment: 162.46,
  // },
  // {
  //   id: "003",
  //   name: "B-A",
  //   provider: "Nelnet",
  //   apr: 3.61,
  //   minPayment: 17.98,
  // },
  // {
  //   id: "004",
  //   name: "B-B",
  //   provider: "Nelnet",
  //   apr: 3.61,
  //   minPayment: 11.54,
  // },
  // {
  //   id: "005",
  //   name: "B-C",
  //   provider: "Nelnet",
  //   apr: 4.41,
  //   minPayment: 24.65,
  // },
  // {
  //   id: "006",
  //   name: "B-D",
  //   provider: "Nelnet",
  //   apr: 4.41,
  //   minPayment: 12.44,
  // },
  // {
  //   id: "007",
  //   name: "B-E",
  //   provider: "Nelnet",
  //   apr: 4.04,
  //   minPayment: 29,
  // },
  // {
  //   id: "008",
  //   name: "B-F",
  //   provider: "Nelnet",
  //   apr: 4.04,
  //   minPayment: 40.01,
  // },
  // {
  //   id: "009",
  //   name: "B-G",
  //   provider: "Nelnet",
  //   apr: 3.51,
  //   minPayment: 27.41,
  // },
  // {
  //   id: "010",
  //   name: "B-H",
  //   provider: "Nelnet",
  //   apr: 3.51,
  //   minPayment: 36.14,
  // },
  // {
  //   id: "011",
  //   name: "H-A",
  //   provider: "Nelnet",
  //   apr: 3.86,
  //   minPayment: 40.24,
  // },
  // {
  //   id: "012",
  //   name: "H-B",
  //   provider: "Nelnet",
  //   apr: 4.66,
  //   minPayment: 50.03,
  // },
  // {
  //   id: "013",
  //   name: "H-C",
  //   provider: "Nelnet",
  //   apr: 4.66,
  //   minPayment: 12.81,
  // },
  // {
  //   id: "014",
  //   name: "H-D",
  //   provider: "Nelnet",
  //   apr: 4.29,
  //   minPayment: 63.07,
  // },
  // {
  //   id: "015",
  //   name: "H-E",
  //   provider: "Nelnet",
  //   apr: 3.76,
  //   minPayment: 61.8,
  // },
  // {
  //   id: "016",
  //   name: "H-F",
  //   provider: "Nelnet",
  //   apr: 3.76,
  //   minPayment: 82.34,
  // }
];

/** @type {types.ExtraPayment[]} */
const extraPayments = [
  // {
  //   date: "04-01-2026", amount: 131
  // },
  // {
  //   date: "05-01-2026", amount: 262
  // },
  // {
  //   date: "06-01-2026", amount: 393
  // },
  // {
  //   date: "07-01-2026", amount: 525
  // },
  // {
  //   date: "08-01-2026", amount: 656
  // },
  // {
  //   date: "09-01-2026", amount: 787
  // },
  // {
  //   date: "10-01-2026", amount: 918
  // },
  // {
  //   date: "11-01-2026", amount: 1050
  // },
  // {
  //   date: "12-01-2026", amount: 1181
  // },
  // {
  //   date: "01-01-2027", amount: 1312
  // },
  // {
  //   date: "02-01-2027", amount: 1443
  // },
  // {
  //   date: "03-01-2027", amount: 1575
  // },
  // {
  //   date: "04-01-2027", amount: 1575
  // },
  // {
  //   date: "05-01-2027", amount: 1575
  // },
  // {
  //   date: "06-01-2027", amount: 1575
  // },
  // {
  //   date: "07-01-2027", amount: 1575
  // },
  // {
  //   date: "08-01-2027", amount: 1575
  // },
  // {
  //   date: "09-01-2027", amount: 1575
  // },
  // {
  //   date: "10-01-2027", amount: 1575
  // },
  // {
  //   date: "11-01-2027", amount: 1575
  // },
  // {
  //   date: "12-01-2027", amount: 1575
  // },
  // {
  //   date: "01-01-2028", amount: 1575
  // },
  // {
  //   date: "02-01-2028", amount: 1575
  // },
  // {
  //   date: "03-01-2028", amount: 1575
  // },
  // {
  //   date: "04-01-2028", amount: 1575
  // },
  // {
  //   date: "05-01-2028", amount: 1575
  // },
  // {
  //   date: "06-01-2028", amount: 1575
  // },
  // {
  //   date: "07-01-2028", amount: 1575
  // },
  // {
  //   date: "08-01-2028", amount: 1575
  // },
  // {
  //   date: "09-01-2028", amount: 1575
  // },
  // {
  //   date: "10-01-2028", amount: 1575
  // },
  // {
  //   date: "11-01-2028", amount: 1575
  // },
  // {
  //   date: "12-01-2028", amount: 1575
  // },
  // {
  //   date: "01-01-2029", amount: 1575
  // },
  // {
  //   date: "02-01-2029", amount: 1575
  // },
  // {
  //   date: "03-01-2029", amount: 1575
  // }
];

/**
 * @type {types.SnapshotDetail[]}
 */
const snapshots = [
  {
    date: new Date("2025-09-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 3514,
      },
      {
        loanID: 2,
        name: "3845351",
        balance: 10878,
      },
      {
        loanID: 3,
        name: "B-A",
        balance: 3133,
      },
      {
        loanID: 4,
        name: "B-B",
        balance: 2011,
      },
      {
        loanID: 5,
        name: "B-C",
        balance: 3314,
      },
      {
        loanID: 6,
        name: "B-D",
        balance: 1671,
      },
      {
        loanID: 7,
        name: "B-E",
        balance: 4863,
      },
      {
        loanID: 8,
        name: "B-F",
        balance: 6711,
      },
      {
        loanID: 9,
        name: "B-G",
        balance: 4821,
      },
      {
        loanID: 10,
        name: "B-H",
        balance: 6357,
      },
      {
        loanID: 11,
        name: "H-A",
        balance: 3057,
      },
      {
        loanID: 12,
        name: "H-B",
        balance: 3749,
      },
      {
        loanID: 13,
        name: "H-C",
        balance: 952,
      },
      {
        loanID: 14,
        name: "H-D",
        balance: 4758,
      },
      {
        loanID: 15,
        name: "H-E",
        balance: 4705,
      },
      {
        loanID: 16,
        name: "H-F",
        balance: 6269,
      },
    ]
  },
  {
    date: new Date("2025-07-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 3840.9,
      },
      {
        loanID: 2,
        name: "3845351",
        balance: 11104.98,
      },
      {
        loanID: 3,
        name: "B-A",
        balance: 3159.23,
      },
      {
        loanID: 4,
        name: "B-B",
        balance: 2027.64,
      },
      {
        loanID: 5,
        name: "B-C",
        balance: 3350.64,
      },
      {
        loanID: 6,
        name: "B-D",
        balance: 1689.70,
      },
      {
        loanID: 7,
        name: "B-E",
        balance: 4904.18,
      },
      {
        loanID: 8,
        name: "B-F",
        balance: 6767.15,
      },
      {
        loanID: 9,
        name: "B-G",
        balance: 4861.44,
      },
      {
        loanID: 10,
        name: "B-H",
        balance: 6409.48,
      },
      {
        loanID: 11,
        name: "H-A",
        balance: 3091.87,
      },
      {
        loanID: 12,
        name: "H-B",
        balance: 3787.7,
      },
      {
        loanID: 13,
        name: "H-C",
        balance: 962.24,
      },
      {
        loanID: 14,
        name: "H-D",
        balance: 4808.91,
      },
      {
        loanID: 15,
        name: "H-E",
        balance: 4758.23,
      },
      {
        loanID: 16,
        name: "H-F",
        balance: 6340.01,
      },
    ]
  },
  {
    date: new Date("2025-03-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 4297.95,
      }
    ]
  },
  {
    date: new Date("2025-01-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 4764.04,
      },
      {
        loanID: 2,
        name: "3845371",
        balance: 11679.18,
      }
    ]
  },
  {
    date: new Date("2024-08-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 5351.71,
      },
      {
        loanID: 2,
        name: "3845371",
        balance: 12161.54,
      },
      {
        loanID: 3,
        name: "B-A",
        balance: 3269.19,
      },
      {
        loanID: 4,
        name: "B-B",
        balance: 2098.22,
      },
      {
        loanID: 5,
        name: "B-C",
        balance: 3510.96,
      },
      {
        loanID: 6,
        name: "B-D",
        balance: 1770.68,
      },
      {
        loanID: 7,
        name: "B-E",
        balance: 5064.23,
      },
      {
        loanID: 8,
        name: "B-F",
        balance: 6987.9,
      },
      {
        loanID: 9,
        name: "B-G",
        balance: 5033.02,
      },
      {
        loanID: 10,
        name: "B-H",
        balance: 6635.73,
      },
      {
        loanID: 11,
        name: "H-A",
        balance: 3251.51,
      },
      {
        loanID: 12,
        name: "H-B",
        balance: 3940.87,
      },
      {
        loanID: 13,
        name: "H-C",
        balance: 1001.19,
      },
      {
        loanID: 14,
        name: "H-D",
        balance: 5028.15,
      },
      {
        loanID: 15,
        name: "H-E",
        balance: 5010.41,
      },
      {
        loanID: 16,
        name: "H-F",
        balance: 6676.12,
      },
      // {
      //   loanID: 17,
      //   name: "Mortgage",
      //   balance: 236901.36,
      // },
    ]
  },
  {
    date: new Date("2019-05-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 18801,
      },
      {
        loanID: 2,
        name: "3845371",
        balance: 18214,
      }
    ]
  },
  {
    date: new Date("2017-11-01T00:00:00"),
    balances: [
      {
        loanID: 1,
        name: "3845372",
        balance: 19993,
      },
      {
        loanID: 2,
        name: "3845371",
        balance: 19636,
      },
      {
        loanID: 3,
        name: "B-A",
        balance: 3500,
      },
      {
        loanID: 4,
        name: "B-B",
        balance: 2289,
      },
      {
        loanID: 5,
        name: "B-C",
        balance: 4500,
      },
      {
        loanID: 6,
        name: "B-D",
        balance: 2257,
      },
      {
        loanID: 7,
        name: "B-E",
        balance: 5500,
      },
      {
        loanID: 8,
        name: "B-F",
        balance: 7511,
      },
      {
        loanID: 9,
        name: "B-G",
        balance: 5500,
      },
      {
        loanID: 10,
        name: "B-H",
        balance: 7186,
      }
    ]
  },
  {
    date: new Date("2018-06-01T00:00:00"),
    balances: [
      {
        loanID: 11,
        name: "H-A",
        balance: 3251.51,
      },
      {
        loanID: 12,
        name: "H-B",
        balance: 3940.87,
      },
      {
        loanID: 13,
        name: "H-C",
        balance: 1001.19,
      },
      {
        loanID: 14,
        name: "H-D",
        balance: 5028.15,
      },
      {
        loanID: 15,
        name: "H-E",
        balance: 5010.41,
      },
      {
        loanID: 16,
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

  /**
   * @type {types.ExtraPayment[]}
   */
const snowballAdjustments = [
  // {
  //   date: "05-01-2026", amount: 360, note: "Raise at work"
  // }
]

export {
  accounts,
  extraPayments,
  snapshots,
  snowballAdjustments
}
