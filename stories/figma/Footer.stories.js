import { frameBar, renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Footer",
  parameters: {
    layout: "centered",
  },
};

export const Default = {
  render: () => {
    const root = renderTemplate("footer");
    const footer = root.querySelector(".footer-slider") ?? root;
    return frameBar(footer);
  },
};
