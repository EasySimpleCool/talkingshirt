// url=WORK_URL_TBD
// url-personal-ref=https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main?node-id=308-1314
// source=public/js/components/icon-text.html
// component=icon-text
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

const label = instance.getString("Label");

const iconSrc = instance.getEnum("Icon", {
  About: "/assets/images/ball.svg",
  Close: "/assets/images/close.svg",
});

const iconSwap = instance.getInstanceSwap("Icon");
let iconPart;
if (iconSwap && iconSwap.type === "INSTANCE") {
  iconPart = iconSwap.executeTemplate().example;
} else {
  iconPart = figma.code`<img class="icon-text__icon" src="${iconSrc}" alt="" width="24" height="24" />`;
}

export default {
  id: "icon-text",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<span class="icon-text" data-row data-gap="2xs">
  <span class="icon-text__label type-small">${label}</span>
  ${iconPart}
</span>
  `,
  metadata: { nestable: true },
};
