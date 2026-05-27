import "../stories/figma/storybook.css";

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  globalTypes: {
    screen: {
      description: "Force CDN data-screen token tier",
      toolbar: {
        icon: "mobile",
        items: [
          { value: "", title: "Auto" },
          { value: "mobile", title: "Mobile" },
          { value: "desktop", title: "Desktop" },
        ],
      },
    },
  },
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
    docs: {
      story: { inline: true },
      source: { type: "dynamic", language: "html" },
    },
    viewport: {
      viewports: {
        figmaMobile: {
          name: "Figma mobile",
          styles: { width: "390px", height: "844px" },
        },
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
        container: {
          name: "Container max",
          styles: { width: "800px", height: "800px" },
        },
      },
      defaultViewport: "figmaMobile",
    },
  },
  decorators: [
    (story, context) => {
      const screen = context.globals?.screen;
      if (screen) {
        document.documentElement.dataset.screen = screen;
      } else {
        delete document.documentElement.dataset.screen;
      }
      return story();
    },
    (story, context) => {
      const rendered = story();
      if (context.parameters.layout === "fullscreen") {
        return rendered;
      }
      if (context.parameters.sectionDecorator === false) {
        return rendered;
      }

      const root = document.createElement("div");
      root.setAttribute("data-section", "lg");
      const container = document.createElement("div");
      container.setAttribute("data-container", "");
      const stack = document.createElement("div");
      stack.setAttribute("data-stack", "");

      if (rendered instanceof Node) {
        stack.appendChild(rendered);
      } else {
        stack.innerHTML = String(rendered);
      }

      container.appendChild(stack);
      root.appendChild(container);
      return root;
    },
  ],
};

export default preview;
