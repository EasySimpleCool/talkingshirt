// url=WORK_URL_TBD
// url-personal-ref=https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main?node-id=79-418
// source=public/js/components/footer.html
// component=footer
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

function resolveChild(propName: string, layerName: string) {
  const swap = instance.getInstanceSwap(propName);
  if (swap && swap.type === "INSTANCE") {
    return swap.executeTemplate().example;
  }
  const layer = instance.findInstance(layerName, { traverseInstances: true });
  if (layer && layer.type === "INSTANCE") {
    return layer.executeTemplate().example;
  }
  return undefined;
}

const sizeSelectPart = resolveChild("SizeSelect", "SizeSelect");
const buttonPart = resolveChild("Button", "Button");

export default {
  id: "footer",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<!-- Production: data-mount="size-select" and data-mount="button" via loader.js -->
<div class="footer-slider footer-slider--static">
  <div class="footer footer--visible" data-section="md" role="contentinfo">
    <div data-container>
      <div data-row data-justify="between">
        ${sizeSelectPart ?? figma.code`<div data-mount="size-select"></div>`}
        ${buttonPart ?? figma.code`<div data-mount="button"></div>`}
      </div>
    </div>
  </div>
</div>
  `,
  metadata: { nestable: false },
};
