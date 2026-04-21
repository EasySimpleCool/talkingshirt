import Stripe from "stripe";

const ALLOWED_SIZES = new Set(["Small", "Medium", "Large", "XLarge"]);
const MAX_TEXT_LENGTH = 10;
const UNIT_AMOUNT_CENTS = 1700;
const CURRENCY = "aud";

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
  const rawText = typeof payload?.text === "string" ? payload.text : "";
  const text = rawText.trim();

  if (!ALLOWED_SIZES.has(size)) {
    return json(400, { error: "Invalid size" });
  }
  if (text.length === 0) {
    return json(400, { error: "Custom text is required" });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json(400, { error: "Custom text is too long" });
  }

  const stripe = new Stripe(secretKey);

  // The deployed site URL is the most reliable base for success/cancel URLs.
  // Fall back to the request's own origin when running under `netlify dev`.
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
              name: "TalkingShirt Black Tee",
              description: `Size ${size} — "${text}"`,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      shipping_address_collection: { allowed_countries: ["AU"] },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error("Stripe session create failed:", err);
    return json(500, { error: "Could not start checkout" });
  }
};
