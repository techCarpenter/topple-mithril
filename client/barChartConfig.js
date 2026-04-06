/** @import * as types from "./types" */

// Plotly.js chart config
/** @type {Partial<Plotly.Config>} */
const CONFIG = {
  displaylogo: false,
  staticPlot: true,
  responsive: true
};

/** @type {Partial<Plotly.Layout>} */
const LAYOUT = {
  xaxis: {
    title: { text: "Account" },
    color: "#d8e0e3",
    gridcolor: "#2a3237",
    zerolinecolor: "#2a3237"
  },
  yaxis: {
    title: { text: "Amount ($)" },
    color: "#d8e0e3",
    showline: true,
    gridcolor: "#2a3237",
    zerolinecolor: "#2a3237"
  },
  height: 340,
  font: {
    family: "Arial",
    color: "#d8e0e3"
  },
  legend: {
    orientation: "h",
    x: 0.5,
    y: 1.05,
    yanchor: "middle",
    xanchor: "center"
  },
  margin: {
    t: 10,
    r: 20,
    b: 36,
    l: 44
  },
  paper_bgcolor: "#1d2327",
  plot_bgcolor: "#151a1d",
  datarevision: 0,
  barmode: "stack"
};

/**
 * 
 * @param {*} param0 
 * @returns {Plotly.Data}
 */
const CreateBarTrace = ({
  name = "",
  x = [],
  y = [],
  type = "bar",
  color = "",
  text = "",
  width = 0.9,
  usePattern = false,
} = {}) => ({
  name,
  x,
  y,
  type,
  marker: {
    color: color,
    pattern: usePattern ? {
      shape: "/",
      bgcolor: color,
      fgcolor: "#222222",
      fillmode: "replace",
      size: 5
    } : undefined
  },
  text,
  width
});

const barChartConfig = {
  /** @type {Plotly.Data[]} */
  data: [],
  layout: LAYOUT,
  config: CONFIG
};

export { barChartConfig, CreateBarTrace };
