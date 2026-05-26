import { userEvent, within } from "storybook/test";
import {
  frameBar,
  renderTemplate,
  wireHeaderToggle,
} from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Header",
  parameters: {
    layout: "centered",
  },
};

function renderHeaderFrame() {
  const wrap = document.createElement("div");
  const root = renderTemplate("header");
  const header = root.querySelector(".header") ?? root;
  wrap.appendChild(frameBar(header));
  wireHeaderToggle(wrap);
  return wrap;
}

export const TypeHome = {
  name: "Type Home",
  render: renderHeaderFrame,
};

export const TypeAbout = {
  name: "Type About",
  render: () => {
    const wrap = renderHeaderFrame();
    wrap.classList.add("about-open");
    const header = wrap.querySelector(".header");
    const toggle = wrap.querySelector(".header__toggle");
    if (header) header.setAttribute("data-type", "about");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close about");
    }
    return wrap;
  },
};

export const ToggleInteraction = {
  name: "Toggle interaction",
  render: renderHeaderFrame,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "About" });
    await userEvent.click(toggle);
  },
};
