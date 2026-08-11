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
  console.log(`saved ${name}.png`);
}

async function scrollY() {
  return await page.evaluate(() => window.scrollY);
}

console.log("--- t=0 (should be idle, cursor blinking, blank page) ---");
await shot("01-idle");
console.log("scrollY:", await scrollY());

await page.waitForTimeout(1600);
console.log("--- after start delay, animation should be underway ---");
await shot("02-mid-animation-start");
console.log("scrollY:", await scrollY());

await page.waitForTimeout(2200);
console.log("--- mid animation ---");
await shot("03-mid-animation");
console.log("scrollY:", await scrollY());

await page.waitForTimeout(3000);
console.log("--- animation should be done, placeholder typing ---");
await shot("04-placeholder");
console.log("scrollY:", await scrollY());
console.log(
  "editable class present:",
  await page.evaluate(() =>
    document.getElementById("chestText").classList.contains("editable"),
  ),
);

console.log("--- clicking stage to enter edit mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(300);
const focused = await page.evaluate(
  () => document.activeElement && document.activeElement.id,
);
console.log("document.activeElement.id after click:", focused);
await shot("05-edit-mode-focused");

console.log("--- typing text ---");
await page.keyboard.type("HELLO");
await page.waitForTimeout(300);
await shot("06-typed-text");

console.log("--- pressing Enter to blur -> view mode ---");
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
await shot("07-view-mode");
const footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer--visible after Enter (view mode):", footerVisible);
const zoomTransform = await page.evaluate(
  () => document.querySelector(".tshirt-wrapper").style.transform,
);
console.log("tshirt-wrapper transform (should be scale(0.8)):", zoomTransform);

console.log("--- clicking back into field from view mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(300);
const focused2 = await page.evaluate(
  () => document.activeElement && document.activeElement.id,
);
console.log("document.activeElement.id after 2nd click:", focused2);
const zoomTransform2 = await page.evaluate(
  () => document.querySelector(".tshirt-wrapper").style.transform,
);
console.log(
  "tshirt-wrapper transform after re-focus (should be ''):",
  JSON.stringify(zoomTransform2),
);
await shot("08-back-in-edit-mode");

console.log("--- clicking logo to reset/replay (text should persist) ---");
await page.click(".logo");
await page.waitForTimeout(200);
await shot("09-logo-reset-idle");
console.log("scrollY right after logo click (should be 0):", await scrollY());

await page.waitForTimeout(1600 + 4200 + 200);
await shot("10-logo-replay-done");
const inputValueAfterReplay = await page.evaluate(
  () => document.getElementById("chestText").value,
);
console.log(
  "chestText.value after replay (should still be HELLO):",
  inputValueAfterReplay,
);

console.log("--- console errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");

await browser.close();
