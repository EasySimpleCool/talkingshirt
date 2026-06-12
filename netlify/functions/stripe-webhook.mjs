// netlify/functions/stripe-webhook.mjs
// Receives checkout.session.completed from Stripe, appends one order line
// to orders/orders.jsonl in the GitHub orders repo.
//
// Env vars required (Netlify → Site settings → Environment variables):
//   STRIPE_SECRET_KEY      sk_live_...
//   STRIPE_WEBHOOK_SECRET  whsec_...   (from the webhook endpoint you create)
//   GH_TOKEN               fine-grained PAT, Contents read/write on orders repo
//   GH_ORDERS_REPO         easysimplecool/talkingshirt-orders
//
// Stripe endpoint URL: https://<your-netlify-site>/.netlify/functions/stripe-webhook
// Events: checkout.session.completed only.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const REPO = process.env.GH_ORDERS_REPO; // "owner/repo"
const FILE_PATH = 'orders/orders.jsonl';
const GH_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

export const handler = async (event) => {
  // --- 1. Verify Stripe signature (raw body required) ---
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored' };
  }

  const session = stripeEvent.data.object;

  try {
    // --- 2. Extract size + text + qty ---
    // Preferred: session.metadata.size / session.metadata.text
    // Fallback: parse the line item description, e.g. `Size Small — "Chickens"`
    let { size, text } = session.metadata || {};
    let qty = 1;

    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
    });
    if (items.data.length > 0) {
      qty = items.data[0].quantity || 1;
      if (!size || !text) {
        const desc = items.data[0].description || '';
        // matches: Size Small — "Chickens"   (em dash or hyphen, straight or curly quotes)
        const m = desc.match(/Size\s+(\S+)\s*[—–-]\s*[“"](.+)[”"]/);
        if (m) {
          size = size || m[1];
          text = text || m[2];
        }
      }
    }

    if (!text) {
      console.error('No text found for session', session.id);
      // Still 200 — don't make Stripe retry forever; flag via log
      return { statusCode: 200, body: 'no text found, logged' };
    }

    const order = {
      ref: session.id.slice(-6).toUpperCase(), // short ref for page names
      sid: session.id,                          // full id for Stripe lookup
      text,
      size: size || '?',
      qty,
      ts: new Date().toISOString(),
    };

    // --- 3. Append to orders.jsonl on GitHub (idempotent on sid) ---
    const ghHeaders = {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'talkingshirt-webhook',
    };

    let existing = '';
    let sha;
    const getRes = await fetch(GH_API, { headers: ghHeaders });
    if (getRes.status === 200) {
      const file = await getRes.json();
      existing = Buffer.from(file.content, 'base64').toString('utf8');
      sha = file.sha;
    } else if (getRes.status !== 404) {
      throw new Error(`GitHub GET failed: ${getRes.status}`);
    }

    // Stripe retries webhooks — never append the same session twice
    if (existing.includes(session.id)) {
      return { statusCode: 200, body: 'duplicate, skipped' };
    }

    const updated = existing + JSON.stringify(order) + '\n';
    const putRes = await fetch(GH_API, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `order ${order.ref}: "${order.text}" (${order.size} x${order.qty})`,
        content: Buffer.from(updated).toString('base64'),
        ...(sha && { sha }),
      }),
    });
    if (!putRes.ok) {
      throw new Error(`GitHub PUT failed: ${putRes.status} ${await putRes.text()}`);
    }

    return { statusCode: 200, body: `recorded ${order.ref}` };
  } catch (err) {
    console.error('Order recording failed:', err);
    // 500 → Stripe retries automatically (good: transient GitHub failures self-heal)
    return { statusCode: 500, body: 'internal error' };
  }
};
