import { getChartData } from "../paydownData.js";

const CHART_COLORS = [
  "#7cc0ff",
  "#79d492",
  "#ffc56f",
  "#ff9f8f",
  "#c8a7ff",
  "#73d8de",
  "#f2e48f",
  "#f6a3d4"
];

function getSeriesColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function createBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    events: [],
    normalized: true,
    interaction: {
      mode: "nearest",
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#d8e0e3",
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: false,
          padding: 16
        }
      },
      tooltip: {
        enabled: false
      }
    }
  };
}

function createCommonScales() {
  return {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Amount ($)",
        color: "#d8e0e3"
      },
      ticks: {
        color: "#d8e0e3"
      },
      grid: {
        color: "#2a3237"
      },
      border: {
        color: "#2a3237"
      }
    }
  };
}

function buildProjectionChartConfig(payoffLoans, historicBalanceArray, paydownData) {
  const { xData, yData } = getChartData(payoffLoans, historicBalanceArray, paydownData.paymentArray);
  const datasets = payoffLoans.map((loan, index) => ({
    label: loan.name,
    data: xData.map((date, pointIndex) => ({
      x: date.getTime(),
      y: yData[index]?.[pointIndex] ?? null
    })),
    borderColor: getSeriesColor(index),
    backgroundColor: getSeriesColor(index),
    borderWidth: 2,
    tension: 0.24,
    spanGaps: true,
    pointRadius: 0,
    pointHoverRadius: 0
  }));

  return {
    type: "line",
    data: { datasets },
    options: {
      ...createBaseOptions(),
      parsing: false,
      scales: {
        ...createCommonScales(),
        x: {
          type: "time",
          time: {
            unit: "month"
          },
          title: {
            display: true,
            text: "Time",
            color: "#d8e0e3"
          },
          ticks: {
            color: "#d8e0e3"
          },
          grid: {
            color: "#2a3237"
          },
          border: {
            color: "#2a3237"
          }
        }
      },
      plugins: {
        ...createBaseOptions().plugins,
        annotation: {
          annotations: {
            today: {
              type: "line",
              xMin: Date.now(),
              xMax: Date.now(),
              borderColor: "#ff8f7c",
              borderWidth: 1
            }
          }
        }
      }
    }
  };
}

function formatBarData(value) {
  if (value > 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${value.toFixed(0)}`;
}

function buildProgressChartConfig(payoffLoans, historicBalanceArray, paydownData) {
  const currentMonthPaymentPeriod = paydownData.paymentArray.find((payPeriod) => {
    const now = new Date();

    return payPeriod.date.getFullYear() === now.getFullYear() &&
      payPeriod.date.getMonth() === now.getMonth();
  }) ?? paydownData.paymentArray[0];

  const rows = payoffLoans.map((account) => {
    const historicYData = historicBalanceArray.slice(0, -1).map((balancePeriod) => {
      const balanceInfo = balancePeriod.balances.find((bal) => bal.loanID === account.id);
      return balanceInfo ? balanceInfo.balance : 0;
    });
    const currentBalance = currentMonthPaymentPeriod?.payments.find((payment) => payment.loanID === account.id)?.balance
      ?? account.balance
      ?? 0;
    const maxBalance = Math.max(account.balance ?? 0, ...historicYData);

    return {
      name: account.name,
      paid: maxBalance - currentBalance,
      remaining: currentBalance
    };
  }).sort((a, b) => (a.remaining < b.remaining ? -1 : 1));

  return {
    type: "bar",
    data: {
      labels: rows.map((row) => row.name),
      datasets: [
        {
          label: "Balance",
          data: rows.map((row) => row.remaining),
          backgroundColor: "#97a4ab",
          borderColor: "#97a4ab",
          borderWidth: 1
        },
        {
          label: "Paid",
          data: rows.map((row) => row.paid),
          backgroundColor: "#79d492",
          borderColor: "#79d492",
          borderWidth: 1
        }
      ]
    },
    options: {
      ...createBaseOptions(),
      parsing: true,
      scales: {
        ...createCommonScales(),
        x: {
          stacked: true,
          title: {
            display: true,
            text: "Account",
            color: "#d8e0e3"
          },
          ticks: {
            color: "#d8e0e3"
          },
          grid: {
            color: "#2a3237"
          },
          border: {
            color: "#2a3237"
          }
        },
        y: {
          ...createCommonScales().y,
          stacked: true
        }
      },
      plugins: {
        ...createBaseOptions().plugins,
        tooltip: {
          enabled: false,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatBarData(context.parsed.y)}`
          }
        }
      }
    }
  };
}

export { buildProjectionChartConfig, buildProgressChartConfig };
