// Serves `/` with order state (button label, N left, About-panel status post)
// injected server-side, so the first paint reflects reality without any JS.
// Runs at the CDN edge; falls back to origin HTML on any error so a broken
// status check never takes the landing page down.

// Same capacity logic the checkout guard runs, so the rendered page and
// create-checkout can never disagree about whether orders are open.
import { orderCapacityStatus } from "../functions/_shared/constants.js";

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
    status = await orderCapacityStatus();
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
