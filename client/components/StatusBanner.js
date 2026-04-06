import m from "mithril";
import { actions, state } from "../state/index.js";

/** @type {m.Component} */
const StatusBanner = {
  view: () => {
    if (!state.notice && !state.errors.initialize) {
      return null;
    }

    const kind = state.errors.initialize ? "error" : state.notice?.kind || "info";
    const message = state.errors.initialize || state.notice?.message;

    return m(`div.notice-banner.${kind}`, [
      m("span", message),
      state.notice
        ? m("button.notice-dismiss", {
          type: "button",
          onclick: () => actions.clearNotice()
        }, "Dismiss")
        : null
    ]);
  }
};

export { StatusBanner };
