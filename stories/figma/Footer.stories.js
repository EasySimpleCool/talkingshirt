import { frameBar, renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Footer",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    sectionDecorator: false,
    docs: {
      description: {
        component:
          "Footer bar (`79:418`). Template: `footer.html`. Mounts SizeSelect and Button in a `data-row data-justify=\"between\"` bar shell.",
      },
    },
  },
};

export const Default = {
  render: () => {
    const root = renderTemplate("footer");
    const footer = root.querySelector(".footer-slider") ?? root;
    return frameBar(footer);
  },
};
