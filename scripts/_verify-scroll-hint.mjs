import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8888";
const OUT = "C:\\Users\\easys\\AppData\\Local\\Temp\\claude\\c--Users-easys-Code-talkingshirt\\0ee9cd71-f57c-49ee-a3ef-3d825afbda97\\scratchpad";

const browser = await chromium.launch();

async function shot(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("#scrollHint");
  await page.waitForTimeout(400); // allow initial opacity transition
  await page.screenshot({ path: `${OUT}/${name}-top.png` });

  const hint = page.locator("#scrollHint");
  const box = await hint.boundingBox();
  const opacity = await hint.evaluate((el) => getComputedStyle(el).opacity);
  console.log(`${name}: box=${JSON.stringify(box)} opacity=${opacity} viewport=${width}x${height}`);

  // scroll down a bit and confirm it fades out
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  const opacityAfterScroll = await hint.evaluate((el) => getComputedStyle(el).opacity);
  console.log(`${name}: opacity after scroll=${opacityAfterScroll}`);
  await page.screenshot({ path: `${OUT}/${name}-scrolled.png` });

  // scroll back to top and confirm it fades back in
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const opacityBackAtTop = await hint.evaluate((el) => getComputedStyle(el).opacity);
  console.log(`${name}: opacity back at top=${opacityBackAtTop}`);

  if (errors.length) {
    console.log(`${name}: console errors:`, errors);
  }
  await page.close();
}

await shot("desktop", 1920, 1080);
await shot("mobile", 390, 844);

await browser.close();
