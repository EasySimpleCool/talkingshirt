import { MAX_TEXT_LENGTH } from "./constants.js";

/**
 * Trim and validate custom chest text from checkout payload.
 * @param {unknown} rawText
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
export function sanitiseCustomText(rawText) {
  const text = typeof rawText === "string" ? rawText.trim() : "";

  if (text.length === 0) {
    return { ok: false, error: "Custom text is required" };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "Custom text is too long" };
  }

  return { ok: true, text };
}
