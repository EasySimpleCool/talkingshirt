import { renderHtml } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/IconText",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Icon + label pair (`308:1314`). Template: `icon-text.html`. Used in Header for About/Close toggle.",
      },
    },
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
      <span class="icon-text__icon" style="--icon-text-mask: url('${icon}')" aria-hidden="true"></span>
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
