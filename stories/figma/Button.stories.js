import { renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Button",
  parameters: {
    layout: "centered",
  },
};

export const Default = {
  render: () => {
    const root = renderTemplate("button");
    return root.firstElementChild ?? root;
  },
};

export const Hover = {
  render: () => {
    const root = renderTemplate("button");
    const btn = root.querySelector(".button");
    if (btn) btn.classList.add("button--hover");
    return root.firstElementChild ?? root;
  },
};

export const Disabled = {
  render: () => {
    const root = renderTemplate("button-disabled");
    return root.firstElementChild ?? root;
  },
};
