import { ordersAtCapacity } from "./_shared/constants.js";

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
  const capacity = await ordersAtCapacity();
  return json(200, { ordersOpen: !capacity.atCapacity });
};
