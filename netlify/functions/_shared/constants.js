export const MAX_TEXT_LENGTH = 12;
export const ALLOWED_SIZES = new Set(["Small", "Medium", "Large", "XLarge", "XXLarge"]);
export const UNIT_AMOUNT_CENTS = 2300;
export const SHIPPING_AMOUNT_CENTS = 1000;
export const CURRENCY = "aud";

// Kill switch: set ORDERS_DISABLED=true in Netlify to pause all orders.
// Both create-checkout and order-status read this so the UI and the
// server agree without a redeploy — just flip the env var.
export function ordersDisabled() {
  const flag = Netlify.env.get("ORDERS_DISABLED");
  return flag === "true" || flag === "1" || flag === "yes";
}

const ORDERS_FILE_PATH = "orders/orders.jsonl";

// Parse a positive integer env var. Missing, blank, zero, or invalid all
// mean "no cap" (returns null), so a cap only applies when explicitly set.
function positiveIntEnv(name) {
  const raw = Netlify.env.get(name);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function maxOrdersTotal() {
  return positiveIntEnv("MAX_ORDERS_TOTAL");
}

export function maxOrdersPerWindow() {
  return positiveIntEnv("MAX_ORDERS_PER_WINDOW");
}

export function orderWindowDays() {
  return positiveIntEnv("ORDER_WINDOW_DAYS");
}

// Count recorded orders from the GitHub orders log. Reuses the same repo,
// token, and headers as stripe-webhook.js. Returns { total, inWindow } where
// inWindow counts orders newer than (now - windowDays); when no window is
// configured, inWindow equals total. A missing file (404) means zero orders.
export async function countOrders() {
  const repo = Netlify.env.get("GH_ORDERS_REPO");
  const token = Netlify.env.get("GH_TOKEN");
  if (!repo || !token) throw new Error("Missing GH_ORDERS_REPO / GH_TOKEN");

  const api = `https://api.github.com/repos/${repo}/contents/${ORDERS_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "talkingshirt-order-cap",
  };

  const res = await fetch(api, { headers });
  if (res.status === 404) return { total: 0, inWindow: 0 };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);

  const file = await res.json();
  const contents = atob(file.content.replace(/\n/g, ""));
  const lines = contents.split("\n").filter((line) => line.trim() !== "");

  const windowDays = orderWindowDays();
  const cutoff =
    windowDays != null ? Date.now() - windowDays * 24 * 60 * 60 * 1000 : null;

  let inWindow = 0;
  for (const line of lines) {
    if (cutoff == null) continue;
    let ts;
    try {
      ts = Date.parse(JSON.parse(line).ts);
    } catch {
      ts = NaN;
    }
    if (Number.isFinite(ts) && ts >= cutoff) inWindow += 1;
  }

  return {
    total: lines.length,
    inWindow: cutoff == null ? lines.length : inWindow,
  };
}

// Combines the manual kill switch, the hard total cap, and the rolling window
// cap into one answer. Fails open on GitHub read errors so a transient outage
// never blocks sales — the manual ORDERS_DISABLED switch remains authoritative.
export async function ordersAtCapacity() {
  if (ordersDisabled()) {
    return { atCapacity: true, reason: "disabled" };
  }

  const totalCap = maxOrdersTotal();
  const windowCap = maxOrdersPerWindow();
  if (totalCap == null && windowCap == null) {
    return { atCapacity: false, reason: null };
  }

  let counts;
  try {
    counts = await countOrders();
  } catch (err) {
    console.error("Order count failed; failing open:", err);
    return { atCapacity: false, reason: null };
  }

  if (totalCap != null && counts.total >= totalCap) {
    return { atCapacity: true, reason: "total" };
  }
  if (windowCap != null && counts.inWindow >= windowCap) {
    return { atCapacity: true, reason: "window" };
  }
  return { atCapacity: false, reason: null };
}
