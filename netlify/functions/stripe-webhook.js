import Stripe from "stripe";

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
  const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");

  if (!secretKey || !webhookSecret) {
    return json(500, { error: "Server is missing Stripe configuration" });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return json(400, { error: "Missing stripe-signature header" });
  }

  const stripe = new Stripe(secretKey);
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return json(400, { error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Checkout completed:", session.id, session.metadata);
    // Fulfillment hook: persist order, notify print partner, etc.
  }

  return json(200, { received: true });
};
