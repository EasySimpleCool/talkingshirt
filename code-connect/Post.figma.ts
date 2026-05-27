// url=WORK_URL_TBD
// url-personal-ref=https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main?node-id=79-543
// source=public/js/components/post.html
// component=post
import figma from "figma";

const DEV_IMPORTS = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css">',
  '<link rel="stylesheet" href="/css/main.css">',
];

const instance = figma.selectedInstance;

const title = instance.getString("Title");
const date = instance.getString("Date");
const datetime = instance.getString("Datetime");
const body = instance.getString("Body");

export default {
  id: "post",
  imports: [...DEV_IMPORTS],
  example: figma.code`
<div class="post" data-stack>
  <div class="post-head" data-row data-justify="between">
    <span class="post-label type-small">${title}</span>
    <time class="post-date type-small" datetime="${datetime}">${date}</time>
  </div>
  <p class="post-body type-medium">${body}</p>
  <div class="post-divider" aria-hidden="true"></div>
</div>
  `,
  metadata: { nestable: true },
};
