import { renderHtml } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/IconText",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: { control: "text" },
    icon: { control: "text" },
  },
};

/**
 * @param {{ label: string, icon: string }} args
 */
function renderIconText({ label, icon }) {
  return renderHtml(`
    <span class="icon-text" data-row data-gap="2xs">
      <span class="icon-text__label type-small">${label}</span>
      <img class="icon-text__icon" src="${icon}" alt="" />
    </span>
  `);
}

export const About = {
  args: {
    label: "About",
    icon: "/assets/images/ball.svg",
  },
  render: renderIconText,
};

export const Close = {
  args: {
    label: "Close",
    icon: "/assets/images/close.svg",
  },
  render: renderIconText,
};
