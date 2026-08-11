import { chromium, devices } from "playwright";

const errors = [];
const logs = [];

async function run(label, deviceOpts) {
  console.log(`\n=== ${label} ===`);
  const browser = await chromium.launch();
  const context = await browser.newContext(deviceOpts);
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[${label}] ${msg.text()}`);
    }
    logs.push(`[${label}][${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${label}] pageerror: ${err.message}`));

  await page.goto("http://127.0.0.1:8888", { waitUntil: "networkidle" });
  await page.waitForSelector("#chestText", { state: "attached" });

  // Desktop scroll check before edit mode
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(300);
  const afterWheel = await page.evaluate(() => window.scrollY);
  console.log(`scrollY before=${before} afterWheel=${afterWheel}`);

  // Scroll to bottom of scroll-container to enter editable zone
  await page.evaluate(() => {
    const sc = document.querySelector(".scroll-container");
    window.scrollTo(0, sc.offsetHeight);
  });
  await page.waitForTimeout(300);

  const editableInfo = await page.evaluate(() => {
    const ct = document.getElementById("chestText");
    return {
      editable: ct.classList.contains("editable"),
      scrollLocked: document.documentElement.classList.contains("is-scroll-locked"),
    };
  });
  console.log("after scroll-to-bottom:", editableInfo);

  await page.click("#chestText");
  await page.waitForTimeout(200);

  const focusInfo = await page.evaluate(() => ({
    active: document.activeElement && document.activeElement.id,
    scrollLocked: document.documentElement.classList.contains("is-scroll-locked"),
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
  }));
  console.log("after focus:", focusInfo);

  // Try to scroll while focused (should be inert)
  const scrollYBeforeLockAttempt = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(200);
  const scrollYAfterLockAttempt = await page.evaluate(() => window.scrollY);
  console.log(`scroll while locked: before=${scrollYBeforeLockAttempt} after=${scrollYAfterLockAttempt} (should be equal)`);

  await page.keyboard.type("Hello world");
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);

  const blurInfo = await page.evaluate(() => ({
    active: document.activeElement && document.activeElement.id,
    scrollLocked: document.documentElement.classList.contains("is-scroll-locked"),
    chestValue: document.getElementById("chestText").value,
  }));
  console.log("after Enter/blur:", blurInfo);

  // Confirm scroll works again after blur
  const scrollYBeforeUnlockCheck = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -1000);
  await page.waitForTimeout(200);
  const scrollYAfterUnlockCheck = await page.evaluate(() => window.scrollY);
  console.log(`scroll after unlock: before=${scrollYBeforeUnlockCheck} after=${scrollYAfterUnlockCheck} (should differ)`);

  await page.screenshot({ path: `/tmp/${label.replace(/\s+/g, "_")}_final.png` });

  await browser.close();
}

await run("desktop");
await run("mobile", { ...devices["iPhone 13"] });

console.log("\n=== CONSOLE ERRORS ===");
if (errors.length === 0) {
  console.log("none");
} else {
  errors.forEach((e) => console.log(e));
}
