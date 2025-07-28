import m from "mithril";
import { App } from "./components/App.js";

let appElement = document.querySelector("#app") || new Element();

m.mount(appElement, App)