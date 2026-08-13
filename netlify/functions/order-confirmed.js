import Stripe from "stripe";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Serves the confirmation page with the fulfillment message baked in, so no
// client JS is needed on success.html to swap pickup/delivery copy. Bundled
// with the static template via [functions."order-confirmed"].included_files
// in netlify.toml.
const TEMPLATE_PATH = resolve("public/success.html");
let cachedTemplate;
async function loadTemplate() {
  if (!cachedTemplate) cachedTemplate = await readFile(TEMPLATE_PATH, "utf8");
  return cachedTemplate;
}

const DELIVERY_MESSAGE = "Thanks for ordering, your sh*rt is on the way.";
const PICKUP_MESSAGE =
  "Thanks for ordering — I'll message you soon to sort a time and place nearby to hand it over.";

function htmlResponse(status, body) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function renderMessage(message) {
  const tpl = await loadTemplate();
  return tpl.replace(
    /<!--SUCCESS_MESSAGE-->[^<]*/,
    `<!--SUCCESS_MESSAGE-->${message}`,
  );
}

export default async (req) => {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return htmlResponse(200, await renderMessage(DELIVERY_MESSAGE));
  }

  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return htmlResponse(200, await renderMessage(DELIVERY_MESSAGE));
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const message =
      session.shipping_cost?.amount_total === 0
        ? PICKUP_MESSAGE
        : DELIVERY_MESSAGE;
    return htmlResponse(200, await renderMessage(message));
  } catch (err) {
    console.error("Order confirmed lookup failed:", err);
    return htmlResponse(200, await renderMessage(DELIVERY_MESSAGE));
  }
};
