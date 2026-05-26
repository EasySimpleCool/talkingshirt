import "../stories/figma/storybook.css";

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (story, context) => {
      const rendered = story();
      if (context.parameters.layout === "fullscreen") {
        return rendered;
      }

      const root = document.createElement("div");
      root.setAttribute("data-section", "lg");
      const container = document.createElement("div");
      container.setAttribute("data-container", "");

      if (rendered instanceof Node) {
        container.appendChild(rendered);
      } else {
        container.innerHTML = String(rendered);
      }

      root.appendChild(container);
      return root;
    },
  ],
};

export default preview;
