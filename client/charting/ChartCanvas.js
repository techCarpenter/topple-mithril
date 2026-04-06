import m from "mithril";
import { Chart } from "./chartjs.js";

function createChart(canvas, attrs) {
  const context = canvas.getContext("2d");

  return new Chart(context, {
    type: attrs.type,
    data: attrs.data,
    options: attrs.options
  });
}

/** @type {m.Component} */
const ChartCanvas = {
  view: (vnode) => m("canvas", {
    className: vnode.attrs.className || "",
    role: vnode.attrs.role || "img",
    "aria-label": vnode.attrs.label || "Chart"
  }),
  oncreate: (vnode) => {
    vnode.state.chart = createChart(vnode.dom, vnode.attrs);
  },
  onupdate: (vnode) => {
    const chart = vnode.state.chart;

    if (!chart) {
      vnode.state.chart = createChart(vnode.dom, vnode.attrs);
      return;
    }

    if (chart.config.type !== vnode.attrs.type) {
      chart.destroy();
      vnode.state.chart = createChart(vnode.dom, vnode.attrs);
      return;
    }

    chart.data = vnode.attrs.data;
    chart.options = vnode.attrs.options;
    chart.update("none");
  },
  onremove: (vnode) => {
    if (vnode.state.chart) {
      vnode.state.chart.destroy();
      vnode.state.chart = null;
    }
  }
};

export { ChartCanvas };
