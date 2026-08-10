import Stripe from "stripe";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

// Lets success.html ask which shipping option a completed checkout used, so
// it can show a pickup-specific confirmation message instead of the delivery
// one. Only exposes the pickup/delivery flag — nothing else from the session.
export default async (req) => {
  const secretKey = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return json(500, { error: "Server is missing STRIPE_SECRET_KEY" });
  }

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return json(400, { error: "Missing session_id" });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const fulfillment =
      session.shipping_cost?.amount_total === 0 ? "pickup" : "delivery";
    return json(200, { fulfillment });
  } catch (err) {
    console.error("Order summary lookup failed:", err);
    return json(404, { error: "Order not found" });
  }
};
