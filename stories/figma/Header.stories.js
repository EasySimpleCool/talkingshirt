import { userEvent } from "storybook/test";
import { renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Header",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Top nav bar (`79:486`). Template: `header.html`. Type Home and Type About states, driven by the same hidden-checkbox toggle as production — no story-only JS.",
      },
    },
  },
};

export const TypeHome = {
  name: "Type Home",
  render: () => renderTemplate("header"),
};

export const TypeAbout = {
  name: "Type About",
  render: () => {
    const root = renderTemplate("header");
    root.querySelector(".about-toggle").checked = true;
    root.querySelector(".header").setAttribute("data-type", "about");
    return root;
  },
};

export const ToggleInteraction = {
  name: "Toggle interaction",
  render: () => renderTemplate("header"),
  play: async ({ canvasElement }) => {
    // Click the <label>, not the visually-hidden checkbox it controls.
    await userEvent.click(canvasElement.querySelector(".header__toggle"));
  },
};
