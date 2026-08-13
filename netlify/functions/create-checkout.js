import Stripe from "stripe";
import {
  ALLOWED_SIZES,
  CURRENCY,
  PICKUP_SHIPPING_LABEL,
  SHIPPING_AMOUNT_CENTS,
  UNIT_AMOUNT_CENTS,
  ordersAtCapacity,
} from "./_shared/constants.js";
import { sanitiseCustomText } from "./_shared/sanitise.js";

function redirect(location) {
  return new Response(null, {
    status: 303,
    headers: { location, "cache-control": "no-store" },
  });
}

function errorRedirect(origin, code) {
  const url = new URL("/", origin);
  url.searchParams.set("checkout_error", code);
  return redirect(url.toString());
}

function isFormRequest(req) {
  const type = req.headers.get("content-type") || "";
  return (
    type.includes("application/x-www-form-urlencoded") ||
    type.includes("multipart/form-data")
  );
}

async function readPayload(req) {
  if (isFormRequest(req)) {
    const form = await req.formData();
    return {
      size: form.get("size"),
      text: form.get("text"),
    };
  }
  return req.json();
}

export default async (req) => {
  const origin = Netlify.env.get("URL") || new URL(req.url).origin;

  if (req.method !== "POST") {
    return errorRedirect(origin, "method");
  }

  const capacity = await ordersAtCapacity();
  if (capacity.atCapacity) {
    return errorRedirect(origin, "paused");
  }

  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return errorRedirect(origin, "server");
  }

  let payload;
  try {
    payload = await readPayload(req);
  } catch {
    return errorRedirect(origin, "invalid");
  }

  const size = typeof payload?.size === "string" ? payload.size : "";
  const textResult = sanitiseCustomText(payload?.text);

  if (!ALLOWED_SIZES.has(size)) {
    return errorRedirect(origin, "size");
  }
  if (!textResult.ok) {
    return errorRedirect(origin, "text");
  }

  const text = textResult.text;
  const stripe = new Stripe(secretKey);
  const metadata = { size, custom_text: text };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: UNIT_AMOUNT_CENTS,
            product_data: {
              name: "TalkingSh*rt Tee",
              description: `Size ${size} — "${text}"`,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata, statement_descriptor_suffix: "TEE" },
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_AMOUNT_CENTS, currency: CURRENCY },
            display_name: "Standard shipping",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: CURRENCY },
            display_name: PICKUP_SHIPPING_LABEL,
          },
        },
      ],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return redirect(session.url);
  } catch (err) {
    console.error("Stripe session create failed:", err);
    return errorRedirect(origin, "stripe");
  }
};
