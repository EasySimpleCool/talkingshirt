import { chromium } from "playwright";

const URL = "http://127.0.0.1:8894/";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
page.on("pageerror", (err) => console.log("pageerror:", String(err)));

await page.goto(URL);
await page.waitForTimeout(2600); // let intro finish + placeholder start

console.log("--- case 1: tap in, leave empty, hit Enter -> view mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
let footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer visible with NO text (should be false):", footerVisible);

console.log("--- case 2: tap back in, type text, hit Enter -> view mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
await page.keyboard.type("HI");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer visible WITH text (should be true):", footerVisible);

console.log("--- case 3: tap back in, clear text, hit Enter -> view mode ---");
await page.mouse.click(250, 315);
await page.waitForTimeout(200);
await page.keyboard.press("Control+A");
await page.keyboard.press("Backspace");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
footerVisible = await page.evaluate(() =>
  document.querySelector(".footer").classList.contains("footer--visible"),
);
console.log("footer visible after clearing text (should be false):", footerVisible);

await browser.close();
