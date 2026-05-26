import { loadTemplate, renderHtml } from "../lib/render-template.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Figma/Post",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    title: { control: "text" },
    date: { control: "text" },
    datetime: { control: "text" },
    body: { control: "text" },
  },
};

/**
 * @param {{ title: string, date: string, datetime: string, body: string }} args
 */
function renderPost(args) {
  const template = loadTemplate("post");
  const root = renderHtml(template);
  const post = root.querySelector(".post");
  if (!post) return root;

  const label = post.querySelector(".post-label");
  const dateEl = post.querySelector(".post-date");
  const bodyEl = post.querySelector(".post-body");

  if (label) label.textContent = args.title;
  if (dateEl) {
    dateEl.textContent = args.date;
    dateEl.setAttribute("datetime", args.datetime);
  }
  if (bodyEl) bodyEl.textContent = args.body;

  return post;
}

export const Launch = {
  args: {
    title: "Launch",
    date: "2/04/26",
    datetime: "2026-04-02",
    body:
      "TalkingSh*rt is a simple idea. No graphics, no logos, just a word on your chest.",
  },
  render: renderPost,
};

export const Sorry = {
  args: {
    title: "Sorry",
    date: "12/04/26",
    datetime: "2026-04-12",
    body: "Orders are suspended, staff are away from the tools. We'll be back soon.",
  },
  render: renderPost,
};
