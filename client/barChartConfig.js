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
    color: "#f8f8f8"
  },
  yaxis: {
    title: { text: "Amount ($)" },
    color: "#f8f8f8",
    showline: true
  },
  font: {
    family: "Arial",
    color: "#f8f8f8"
  },
  legend: {
    orientation: "h",
    x: 0.5,
    y: 1.05,
    yanchor: "middle",
    xanchor: "center"
  },
  margin: {
    t: 5,
    r: 40,
    b: 40,
    l: 40
  },
  paper_bgcolor: "#222222",
  plot_bgcolor: "#222222",
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