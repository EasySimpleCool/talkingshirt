import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("response", (r) => { if (r.status() === 404) console.log(r.status(), r.url()); });
await page.goto("http://127.0.0.1:8888", { waitUntil: "networkidle" });
await browser.close();
