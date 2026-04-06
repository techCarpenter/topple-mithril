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
    title: { text: "Time" },
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
  shapes: [
    {
      type: "line",
      x0: null,
      y0: 0,
      x1: null,
      yref: "paper",
      y1: 1,
      line: {
        color: "#ff8f7ccc",
        width: 1
      }
    }
  ],
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

/** @type {Plotly.PlotlyDataLayoutConfig} */
const lineGraphConfig = {
  /** @type {Plotly.Data[]} */
  data: [],
  layout: LAYOUT,
  config: CONFIG
};

export { lineGraphConfig, CreateTrace };
