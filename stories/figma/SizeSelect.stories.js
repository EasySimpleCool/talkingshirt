import { userEvent, within } from "storybook/test";
import { renderTemplate } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/SizeSelect",
  parameters: {
    layout: "centered",
  },
};

export const Default = {
  render: () => {
    const root = renderTemplate("size-select");
    return root.firstElementChild ?? root;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText("Size");
    await userEvent.selectOptions(select, "Medium");
  },
};
