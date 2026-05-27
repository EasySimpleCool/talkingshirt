import { frameBar, renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Button",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "CTA button (`194:1095`). Template: `button.html`. Width hugs label content; height floor from `--comp-button-min-h`.",
      },
    },
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

export const InFooter = {
  name: "In footer",
  parameters: { sectionDecorator: false },
  render: () => {
    const root = renderTemplate("footer");
    const footer = root.querySelector(".footer-slider") ?? root;
    return frameBar(footer);
  },
};
