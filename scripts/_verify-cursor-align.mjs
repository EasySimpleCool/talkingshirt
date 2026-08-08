import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8888";

const browser = await chromium.launch();

async function check(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("#scrollHint");
  await page.waitForTimeout(400);

  const hintBox = await page.locator("#scrollHint").boundingBox();
  const cursorBox = await page.locator("#cursor").boundingBox();
  const hintCenter = hintBox.x + hintBox.width / 2;
  const cursorCenter = cursorBox.x + cursorBox.width / 2;
  console.log(`${name}: hintCenter=${hintCenter.toFixed(2)} cursorCenter=${cursorCenter.toFixed(2)} delta=${(cursorCenter - hintCenter).toFixed(2)}px`);

  await page.close();
}

await check("desktop", 1920, 1080);
await check("mobile", 390, 844);

await browser.close();
