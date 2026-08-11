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

async function info(label) {
  const d = await page.evaluate(() => ({
    scrollY: window.scrollY,
    bodyScrollHeight: document.body.scrollHeight,
    innerHeight: window.innerHeight,
    headline: document.getElementById("textRun").textContent,
    scrollHintExists: !!document.getElementById("scrollHint"),
  }));
  console.log(label, JSON.stringify(d));
}

await info("t=0");

// Try to scroll via JS wheel dispatch + scrollTo directly, confirm no movement.
await page.mouse.wheel(0, 500);
await page.waitForTimeout(100);
await info("after wheel attempt");

// Poll through the whole sequence.
const samples = [];
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(150);
  const d = await page.evaluate(() => ({
    ms: performance.now(),
    scrollY: window.scrollY,
    headline: document.getElementById("textRun").textContent,
  }));
  samples.push(d);
}
console.log("--- samples (every 150ms) ---");
for (const s of samples) {
  console.log(`scrollY=${s.scrollY}\theadline="${s.headline}"`);
}

await shot("final-state");

// Confirm computed overflow on html/body.
const overflow = await page.evaluate(() => ({
  html: getComputedStyle(document.documentElement).overflow,
  body: getComputedStyle(document.body).overflow,
}));
console.log("computed overflow:", JSON.stringify(overflow));

console.log("--- tap to edit, type, Enter -> view mode, tap back in ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
const focused1 = await page.evaluate(() => document.activeElement?.id);
console.log("focused after tap:", focused1);
await page.keyboard.type("YO");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer visible in view mode:", footerVisible);
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
const focused2 = await page.evaluate(() => document.activeElement?.id);
console.log("focused after 2nd tap:", focused2);

console.log("--- logo click replay ---");
await page.click(".logo");
await page.waitForTimeout(100);
await info("right after logo click");
await page.waitForTimeout(2200);
const valAfterReplay = await page.evaluate(() => document.getElementById("chestText").value);
console.log("value after replay (should be YO):", valAfterReplay);

console.log("--- console errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");

await browser.close();
