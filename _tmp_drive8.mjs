import { chromium } from "playwright";

const URL = "http://127.0.0.1:8894/";
const shotDir =
  "C:\\Users\\easys\\AppData\\Local\\Temp\\claude\\c--Users-easys-Code-talkingshirt\\c0ef1305-c887-4bd0-9903-0f7e987bbe54\\scratchpad";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
page.on("console", (msg) => console.log("[console]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", String(err)));
page.on("requestfailed", (req) => console.log("[requestfailed]", req.url(), req.failure()?.errorText));

await page.goto(URL);
await page.waitForTimeout(500);
await page.screenshot({ path: `${shotDir}\\debug-t500.png` });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${shotDir}\\debug-t3000.png` });

const state = await page.evaluate(() => ({
  headline: document.getElementById("textRun")?.textContent,
  stageExists: !!document.querySelector(".stage"),
  chestTextExists: !!document.getElementById("chestText"),
}));
console.log("state:", JSON.stringify(state));

await browser.close();
