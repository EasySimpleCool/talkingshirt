// url=WORK_URL_TBD
// source=public/js/components/size-select.html
// component=size-select
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

const size = instance.getEnum("Size", {
  Small: "Small",
  Medium: "Medium",
  Large: "Large",
  XLarge: "XLarge",
});

const selectedSmall = size === "Small" ? " selected" : "";
const selectedMedium = size === "Medium" ? " selected" : "";
const selectedLarge = size === "Large" ? " selected" : "";
const selectedXLarge = size === "XLarge" ? " selected" : "";

export default {
  id: "size-select",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<label class="size-select">
  <span class="size-select-text type-medium">${size}</span>
  <select class="size-select-native" aria-label="Size">
    <option value="Small"${selectedSmall}>Small</option>
    <option value="Medium"${selectedMedium}>Medium</option>
    <option value="Large"${selectedLarge}>Large</option>
    <option value="XLarge"${selectedXLarge}>XLarge</option>
  </select>
</label>
  `,
  metadata: { nestable: true },
};
