// url=WORK_URL_TBD
// url-personal-ref=https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main?node-id=79-486
// source=public/js/components/header.html
// component=header
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

const type = instance.getEnum("Type", {
  Home: "home",
  About: "about",
});

const isAbout = type === "about";
const ariaExpanded = isAbout ? "true" : "false";
const toggleLabel = isAbout ? "Close about" : "About";

function resolveIconText(layerName: string) {
  const layer = instance.findInstance(layerName, { traverseInstances: true });
  if (layer && layer.type === "INSTANCE") {
    return layer.executeTemplate().example;
  }
  return undefined;
}

const homeToggle =
  resolveIconText("header__toggle-state--home") ??
  figma.code`
        <span class="header__toggle-state header__toggle-state--home icon-text" data-row data-gap="2xs">
          <span class="icon-text__label type-small">About</span>
          <span class="icon-text__icon icon-text__icon--ball" aria-hidden="true"></span>
        </span>`;

const aboutToggle =
  resolveIconText("header__toggle-state--about") ??
  figma.code`
        <span class="header__toggle-state header__toggle-state--about icon-text" data-row data-gap="2xs">
          <span class="icon-text__label type-small">Close</span>
          <span class="icon-text__icon icon-text__icon--close" aria-hidden="true"></span>
        </span>`;

export default {
  id: "header",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<div class="header header--fixed" data-section="md" data-type="${type}" role="banner">
  <div data-container>
    <div data-row data-justify="between">
      <div class="header__start">
        <a class="logo" href="/" aria-label="TalkingSh*rt home">
          <img class="logo__img" src="/assets/images/Logo.svg" alt="" />
        </a>
        <div class="header__title type-medium" aria-hidden="true">About</div>
      </div>
      <button
        class="header__toggle"
        type="button"
        data-about-toggle
        aria-label="${toggleLabel}"
        aria-controls="aboutContent"
        aria-expanded="${ariaExpanded}"
      >
        ${homeToggle}
        ${aboutToggle}
      </button>
    </div>
  </div>
</div>
  `,
  metadata: { nestable: false },
};
