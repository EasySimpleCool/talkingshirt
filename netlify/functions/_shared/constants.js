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

export function maxOrdersPerWeek() {
  return positiveIntEnv("MAX_ORDERS_PER_WEEK");
}

const DEFAULT_TIMEZONE = "Australia/Melbourne";

// The IANA timezone the weekly cap resets in. Defaults to Melbourne so "N Left"
// means "left this calendar week" in local time, resetting Monday midnight.
export function orderTimezone() {
  const tz = Netlify.env.get("ORDER_TIMEZONE");
  return tz && tz.trim() !== "" ? tz.trim() : DEFAULT_TIMEZONE;
}

// Offset (ms) between wall-clock time in `timeZone` and UTC at `date`.
function tzOffsetMs(timeZone, date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - date.getTime();
}

// Epoch (ms) for a wall-clock time in `timeZone`. Accurate outside the ~1h DST
// transition windows, which don't matter for a weekly order cap.
function zonedWallTimeToEpoch(y, m, d, h, mi, s, timeZone) {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  return guess - tzOffsetMs(timeZone, new Date(guess));
}

// Epoch (ms) of the most recent Monday 00:00 in `timeZone` — the start of the
// current calendar week.
export function weekStartEpoch(timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = {};
  for (const p of dtf.formatToParts(new Date())) parts[p.type] = p.value;
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);

  // A calendar date's weekday is the same in any timezone.
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;

  const monday = new Date(Date.UTC(y, m - 1, d - daysSinceMonday));
  return zonedWallTimeToEpoch(
    monday.getUTCFullYear(),
    monday.getUTCMonth() + 1,
    monday.getUTCDate(),
    0,
    0,
    0,
    timeZone,
  );
}

// Count recorded orders from the GitHub orders log. Reuses the same repo,
// token, and headers as stripe-webhook.js. Returns { total, inWeek } where
// inWeek counts orders since the start of the current calendar week in the
// configured timezone; when no weekly cap is set, inWeek equals total. A
// missing file (404) means zero orders.
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
  if (res.status === 404) return { total: 0, inWeek: 0 };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);

  const file = await res.json();
  const contents = atob(file.content.replace(/\n/g, ""));
  const lines = contents.split("\n").filter((line) => line.trim() !== "");

  const cutoff =
    maxOrdersPerWeek() != null ? weekStartEpoch(orderTimezone()) : null;

  let inWeek = 0;
  for (const line of lines) {
    if (cutoff == null) continue;
    let ts;
    try {
      ts = Date.parse(JSON.parse(line).ts);
    } catch {
      ts = NaN;
    }
    if (Number.isFinite(ts) && ts >= cutoff) inWeek += 1;
  }

  return {
    total: lines.length,
    inWeek: cutoff == null ? lines.length : inWeek,
  };
}

// Combines the manual kill switch, the hard total cap, and the weekly cap into
// one answer, plus how many orders remain before the nearest cap. `remaining`
// is null when no cap is configured (unlimited) and clamps at 0. Fails open on
// GitHub read errors so a transient outage never blocks sales — the manual
// ORDERS_DISABLED switch remains authoritative.
export async function orderCapacityStatus() {
  if (ordersDisabled()) {
    return { ordersOpen: false, remaining: 0, reason: "disabled" };
  }

  const totalCap = maxOrdersTotal();
  const weeklyCap = maxOrdersPerWeek();
  if (totalCap == null && weeklyCap == null) {
    return { ordersOpen: true, remaining: null, reason: null };
  }

  let counts;
  try {
    counts = await countOrders();
  } catch (err) {
    console.error("Order count failed; failing open:", err);
    return { ordersOpen: true, remaining: null, reason: null };
  }

  const remTotal = totalCap != null ? totalCap - counts.total : Infinity;
  const remWeek = weeklyCap != null ? weeklyCap - counts.inWeek : Infinity;
  const remaining = Math.max(0, Math.min(remTotal, remWeek));
  const reason =
    remaining > 0 ? null : remTotal <= remWeek ? "total" : "week";

  return { ordersOpen: remaining > 0, remaining, reason };
}

// Thin wrapper kept for create-checkout: just the open/closed decision.
export async function ordersAtCapacity() {
  const status = await orderCapacityStatus();
  return { atCapacity: !status.ordersOpen, reason: status.reason };
}
