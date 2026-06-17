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
  ],
};

export default preview;
