import { chromium } from "playwright";

const URL = "http://127.0.0.1:8894/";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(URL);
await page.waitForTimeout(3600);

const headline = await page.evaluate(() => document.getElementById("textRun").textContent);
console.log("headline after intro (should be Type):", headline);

await page.mouse.click(250, 315);
await page.waitForTimeout(200);
const focused = await page.evaluate(() => document.activeElement?.id);
console.log("focused after tap (should be chestText):", focused);
await page.keyboard.type("OK");
await page.waitForTimeout(200);

console.log("--- console/page errors ---");
console.log(errors.length ? errors.join("\n") : "(none)");

await browser.close();
