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
    title: "Time",
    color: "#f8f8f8"
  },
  yaxis: {
    title: "Amount ($)",
    color: "#f8f8f8",
    showline: true
  },
  height: 450,
  shapes: [
    {
      type: "line",
      x0: null,
      y0: 0,
      x1: null,
      yref: "paper",
      y1: 1,
      line: {
        color: "#ff4646cc",
        width: 1.5
      }
    }
  ],
  font: {
    family: "Arial",
    // size: 14,
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
  datarevision: 0
};

/**
 * 
 * @param {*} param0 
 * @returns {Plotly.Data}
 */
const CreateTrace = ({
  name = "",
  x = [],
  y = [],
  mode = "lines",
  type = "scatter",
  line = { shape: "spline", smoothing: 0.1, width: 2 },
  connectgaps = true
} = {}) => ({
  name,
  x,
  y,
  mode,
  type,
  line,
  connectgaps
});

const plotlyConfig = {
  /** @type {Plotly.Data[]} */
  data: [],
  layout: LAYOUT,
  config: CONFIG
};

export { plotlyConfig, CreateTrace };