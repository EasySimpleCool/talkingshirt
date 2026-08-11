import { chromium, devices } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 13"] });
const page = await context.newPage();
page.on("pageerror", (err) => console.log("pageerror:", err.message));

await page.goto("http://127.0.0.1:8888", { waitUntil: "networkidle" });
await page.waitForSelector("#chestText", { state: "attached" });

await page.evaluate(() => {
  const sc = document.querySelector(".scroll-container");
  window.scrollTo(0, sc.offsetHeight);
});
await page.waitForTimeout(300);
await page.click("#chestText");
await page.waitForTimeout(200);
await page.keyboard.type("Hello world");
await page.waitForTimeout(200);

const style = await page.evaluate(() => {
  const fc = document.querySelector(".fixed-content");
  const cs = getComputedStyle(fc);
  return { height: cs.height, transform: cs.transform, stageH: getComputedStyle(document.documentElement).getPropertyValue("--stage-h") };
});
console.log("fixed-content style:", style);

await page.screenshot({ path: "C:/tmp/edit_mode_no_kb.png" });

// Simulate keyboard opening by shrinking visualViewport (emulate via CDP window resize won't shrink vv;
// instead directly dispatch a synthetic visualViewport resize by resizing the page viewport)
await page.setViewportSize({ width: 390, height: 500 }); // shrink to emulate keyboard covering ~344px
await page.waitForTimeout(400); // let 120ms settle timer fire

const style2 = await page.evaluate(() => {
  const fc = document.querySelector(".fixed-content");
  const cs = getComputedStyle(fc);
  const ct = document.getElementById("chestText").getBoundingClientRect();
  return { height: cs.height, transform: cs.transform, chestTextRect: ct, innerHeight: window.innerHeight };
});
console.log("after viewport shrink (simulated keyboard):", style2);

await page.screenshot({ path: "C:/tmp/edit_mode_with_kb.png" });

await browser.close();
