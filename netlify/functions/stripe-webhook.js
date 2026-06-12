import Stripe from "stripe";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const FILE_PATH = "orders/orders.jsonl";

async function recordOrder(session) {
  const repo = Netlify.env.get("GH_ORDERS_REPO"); // EasySimpleCool/talkingshirt-orders
  const token = Netlify.env.get("GH_TOKEN");
  if (!repo || !token) throw new Error("Missing GH_ORDERS_REPO / GH_TOKEN");

  // size + text come from checkout metadata (set in create-checkout.js);
  // description regex is a fallback if metadata is ever absent.
  let size = session.metadata?.size;
  let text = session.metadata?.custom_text;
  if (!size || !text) {
    const desc = session?.display_items?.[0]?.custom?.description ?? "";
    const m = desc.match(/Size\s+(\S+)\s*[—–-]\s*[“"](.+)[”"]/);
    if (m) {
      size = size || m[1];
      text = text || m[2];
    }
  }
  if (!text) throw new Error(`No custom text on session ${session.id}`);

  const order = {
    ref: session.id.slice(-6).toUpperCase(),
    sid: session.id,
    text,
    size: size || "?",
    qty: 1,
    ts: new Date().toISOString(),
  };

  const api = `https://api.github.com/repos/${repo}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "talkingshirt-webhook",
  };

  let existing = "";
  let sha;
  const getRes = await fetch(api, { headers });
  if (getRes.status === 200) {
    const file = await getRes.json();
    existing = atob(file.content.replace(/\n/g, ""));
    sha = file.sha;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET failed: ${getRes.status}`);
  }

  // Stripe retries webhooks — never record the same session twice
  if (existing.includes(session.id)) return { ...order, duplicate: true };

  const updated = existing + JSON.stringify(order) + "\n";
  const putRes = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `order ${order.ref}: "${order.text}" (${order.size})`,
      content: btoa(unescape(encodeURIComponent(updated))),
      ...(sha && { sha }),
    }),
  });
  if (!putRes.ok) {
    throw new Error(
      `GitHub PUT failed: ${putRes.status} ${await putRes.text()}`,
    );
  }
  return order;
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
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return json(400, { error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const order = await recordOrder(session);
      console.log("Order recorded:", order);
    } catch (err) {
      console.error("Order recording failed:", err);
      // 500 → Stripe retries automatically; transient GitHub failures self-heal
      return json(500, { error: "Order recording failed" });
    }
  }

  return json(200, { received: true });
};
