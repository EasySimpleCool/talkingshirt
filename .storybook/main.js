/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/html-vite",
  staticDirs: [
    { from: "../public/css", to: "/css" },
    { from: "../public/js", to: "/js" },
    { from: "../public/assets", to: "/assets" },
  ],
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    const base = process.env.STORYBOOK_BASE || "/";
    return mergeConfig(config, { base, publicDir: false });
  },
};

export default config;
