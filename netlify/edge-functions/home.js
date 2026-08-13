// Serves `/` with order state (button label, N left, About-panel status post)
// injected server-side, so the first paint reflects reality without any JS.
// Runs at the CDN edge; falls back to origin HTML on any error so a broken
// status check never takes the landing page down.

import {
  ordersDisabled,
  maxOrdersTotal,
  maxOrdersPerWeek,
  orderTimezone,
  weekStartEpoch,
} from "../functions/_shared/constants.js";

async function countOrdersEdge() {
  const repo = Netlify.env.get("GH_ORDERS_REPO");
  const token = Netlify.env.get("GH_TOKEN");
  if (!repo || !token) throw new Error("Missing GH_ORDERS_REPO / GH_TOKEN");

  const api = `https://api.github.com/repos/${repo}/contents/orders/orders.jsonl`;
  const res = await fetch(api, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "talkingshirt-edge",
    },
  });
  if (res.status === 404) return { total: 0, inWeek: 0 };
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);

  const file = await res.json();
  const contents = atob(file.content.replace(/\n/g, ""));
  const lines = contents.split("\n").filter((l) => l.trim() !== "");

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

  return { total: lines.length, inWeek: cutoff == null ? lines.length : inWeek };
}

async function orderStatus() {
  if (ordersDisabled()) {
    return { ordersOpen: false, remaining: 0 };
  }
  const totalCap = maxOrdersTotal();
  const weeklyCap = maxOrdersPerWeek();
  if (totalCap == null && weeklyCap == null) {
    return { ordersOpen: true, remaining: null };
  }
  let counts;
  try {
    counts = await countOrdersEdge();
  } catch (err) {
    console.error("Order count failed; failing open:", err);
    return { ordersOpen: true, remaining: null };
  }
  const remTotal = totalCap != null ? totalCap - counts.total : Infinity;
  const remWeek = weeklyCap != null ? weeklyCap - counts.inWeek : Infinity;
  const remaining = Math.max(0, Math.min(remTotal, remWeek));
  return { ordersOpen: remaining > 0, remaining };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStatusPost(status) {
  if (status.ordersOpen) return "";
  return `
    <div class="post" data-stack id="ordersPausedPost">
      <div class="post-head" data-row data-justify="between">
        <span class="post-label type-small">Paused</span>
        <time class="post-date type-small" datetime="2026-04-12">12/04/26</time>
      </div>
      <p class="post-body type-medium">
        Orders are paused for the moment — we'll be back on the tools soon.
      </p>
      <div class="post-divider" aria-hidden="true"></div>
    </div>
  `;
}

function renderStockLeft(status) {
  if (typeof status.remaining !== "number" || status.remaining <= 0) return "";
  return `<span class="stock-left type-small">${escapeHtml(status.remaining)} Left</span>`;
}

function rewriteOrderButton(html, status) {
  const label = status.ordersOpen ? "Order | $23" : "Orders paused";
  const disabled = status.ordersOpen ? "" : " disabled aria-disabled=\"true\"";
  return html.replace(
    /<button([^>]*class="button[^"]*"[^>]*)>\s*Order \| \$23\s*<\/button>/,
    `<button$1${disabled}>${label}</button>`,
  );
}

export default async (request, context) => {
  const originResponse = await context.next();
  const contentType = originResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return originResponse;

  let status;
  try {
    status = await orderStatus();
  } catch (err) {
    console.error("orderStatus failed; serving origin:", err);
    return originResponse;
  }

  let html = await originResponse.text();
  html = html
    .replace("<!--ORDER_STATE_POST-->", renderStatusPost(status))
    .replace("<!--STOCK_LEFT-->", renderStockLeft(status));
  html = rewriteOrderButton(html, status);

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export const config = { path: "/" };
