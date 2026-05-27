// url=WORK_URL_TBD
// url-personal-ref=https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main?node-id=194-1095
// source=public/js/components/button.html
// component=button
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

const label = instance.getString("Label");

const state = instance.getEnum("State", {
  Default: "default",
  Hover: "hover",
  Disabled: "disabled",
});

const isDisabled = state === "disabled";
const hoverClass = state === "hover" ? " button--hover" : "";

export default {
  id: "button",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<span class="button-wrap">
  <button class="button type-medium${hoverClass}" type="button" ${isDisabled ? "disabled" : ""}>
    ${label}
  </button>
</span>
  `,
  metadata: { nestable: true },
};
