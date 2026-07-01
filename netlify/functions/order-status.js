import { orderCapacityStatus } from "./_shared/constants.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

// Lets the static frontend ask whether orders are open, so flipping the
// ORDERS_DISABLED env var in Netlify updates the site without a redeploy.
export default async () => {
  const status = await orderCapacityStatus();
  return json(200, { ordersOpen: status.ordersOpen, remaining: status.remaining });
};
