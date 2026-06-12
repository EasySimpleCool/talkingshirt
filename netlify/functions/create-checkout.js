import Stripe from "stripe";
import {
  ALLOWED_SIZES,
  CURRENCY,
  SHIPPING_AMOUNT_CENTS,
  UNIT_AMOUNT_CENTS,
} from "./_shared/constants.js";
import { sanitiseCustomText } from "./_shared/sanitise.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return json(500, { error: "Server is missing STRIPE_SECRET_KEY" });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const size = typeof payload?.size === "string" ? payload.size : "";
  const textResult = sanitiseCustomText(payload?.text);

  if (!ALLOWED_SIZES.has(size)) {
    return json(400, { error: "Invalid size" });
  }
  if (!textResult.ok) {
    return json(400, { error: textResult.error });
  }

  const text = textResult.text;
  const stripe = new Stripe(secretKey);
  const origin = Netlify.env.get("URL") || new URL(req.url).origin;
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
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_AMOUNT_CENTS, currency: CURRENCY },
            display_name: "Standard shipping",
          },
        },
      ],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error("Stripe session create failed:", err);
    return json(500, { error: "Could not start checkout" });
  }
};
