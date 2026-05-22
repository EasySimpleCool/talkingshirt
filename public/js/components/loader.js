const COMPONENTS_BASE = "/js/components";

/** @type {Record<string, string>} */
const TEMPLATES = {
  header: "header.html",
  "header-logo-only": "header-logo-only.html",
  button: "button.html",
  "button-disabled": "button-disabled.html",
  "size-select": "size-select.html",
  footer: "footer.html",
  post: "post.html",
  "success-content": "success-content.html",
};

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
async function fetchTemplate(name) {
  const file = TEMPLATES[name];
  if (!file) {
    throw new Error(`Unknown component: ${name}`);
  }
  const res = await fetch(`${COMPONENTS_BASE}/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`);
  }
  return res.text();
}

/**
 * Mount nested [data-mount] nodes inside `root`.
 * @param {ParentNode} root
 */
async function mountNested(root) {
  const nested = [...root.querySelectorAll("[data-mount]")];
  await Promise.all(
    nested.map(async (el) => {
      const name = el.getAttribute("data-mount");
      if (!name) return;
      el.innerHTML = await fetchTemplate(name);
      await mountNested(el);
    }),
  );
}

/**
 * Wire rebuild demo interactions (Header About toggle).
 */
export function initRebuildDemo() {
  const toggle = document.querySelector("[data-about-toggle], #headerToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("about-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/**
 * Mount all `[data-component]` hosts on the page.
 */
function resolveComponentName(host) {
  const base = host.getAttribute("data-component");
  if (!base) return null;
  const variant = host.getAttribute("data-variant");
  if (variant === "disabled" && base === "button") {
    return "button-disabled";
  }
  if (variant === "logo-only" && base === "header") {
    return "header-logo-only";
  }
  return base;
}

export async function mountAll() {
  const hosts = [...document.querySelectorAll("[data-component]")];
  await Promise.all(
    hosts.map(async (host) => {
      const name = resolveComponentName(host);
      if (!name) return;
      host.innerHTML = await fetchTemplate(name);
      await mountNested(host);
    }),
  );
  initRebuildDemo();
}
