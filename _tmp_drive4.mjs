import { chromium } from "playwright";

const URL = "http://127.0.0.1:8894/";
const shotDir =
  "C:\\Users\\easys\\AppData\\Local\\Temp\\claude\\c--Users-easys-Code-talkingshirt\\c0ef1305-c887-4bd0-9903-0f7e987bbe54\\scratchpad";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(URL);

async function shot(name) {
  await page.screenshot({ path: `${shotDir}\\${name}.png` });
}

async function textAndScroll(label) {
  const info = await page.evaluate(() => ({
    scrollY: window.scrollY,
    headline: document.getElementById("textRun").textContent,
  }));
  console.log(label, JSON.stringify(info));
}

// t=0: idle
await textAndScroll("t=0");

// Poll frequently through the whole sequence to find where the dwell is.
const samples = [];
for (let i = 0; i < 44; i++) {
  await page.waitForTimeout(150);
  const info = await page.evaluate(() => ({
    ms: performance.now(),
    scrollY: window.scrollY,
    headline: document.getElementById("textRun").textContent,
  }));
  samples.push(info);
}
console.log("--- samples (every 150ms) ---");
for (const s of samples) {
  console.log(`scrollY=${s.scrollY}\theadline="${s.headline}"`);
}

await shot("A-after-samples");

console.log("--- clicking to enter edit, typing, Enter to view mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
await page.keyboard.type("HI");
await page.waitForTimeout(200);
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
await shot("B-view-mode-no-zoom");
const wrapperTransform = await page.evaluate(
  () => getComputedStyle(document.querySelector(".tshirt-wrapper")).transform,
);
console.log("tshirt-wrapper computed transform (should be 'none'):", wrapperTransform);
const footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer--visible in view mode:", footerVisible);

console.log("--- console errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");

await browser.close();
