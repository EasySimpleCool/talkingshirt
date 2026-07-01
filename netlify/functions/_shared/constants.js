export const MAX_TEXT_LENGTH = 12;
export const ALLOWED_SIZES = new Set(["Small", "Medium", "Large", "XLarge", "XXLarge"]);
export const UNIT_AMOUNT_CENTS = 2300;
export const SHIPPING_AMOUNT_CENTS = 1000;
export const CURRENCY = "aud";

// Kill switch: set ORDERS_DISABLED=true in Netlify to pause all orders.
// Both create-checkout and order-status read this so the UI and the
// server agree without a redeploy — just flip the env var.
export function ordersDisabled() {
  const flag = Netlify.env.get("ORDERS_DISABLED");
  return flag === "true" || flag === "1" || flag === "yes";
}
