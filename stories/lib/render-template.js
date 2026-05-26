const templateModules = import.meta.glob("../../public/js/components/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * @param {string} name — template basename (e.g. "button", "size-select")
 * @returns {string}
 */
export function loadTemplate(name) {
  const entry = Object.entries(templateModules).find(([path]) =>
    path.endsWith(`/${name}.html`),
  );
  if (!entry) {
    throw new Error(`Unknown template: ${name}`);
  }
  return entry[1];
}

/**
 * Sync version of loader.js mountNested for story render().
 * @param {ParentNode} root
 */
export function mountNested(root) {
  for (const el of root.querySelectorAll("[data-mount]")) {
    const name = el.getAttribute("data-mount");
    if (!name) continue;
    el.innerHTML = loadTemplate(name);
    mountNested(el);
  }
}

/**
 * @param {string} name
 * @returns {HTMLDivElement}
 */
export function renderTemplate(name) {
  const wrap = document.createElement("div");
  wrap.innerHTML = loadTemplate(name);
  mountNested(wrap);
  return wrap;
}

/**
 * @param {string} html
 * @returns {HTMLDivElement}
 */
export function renderHtml(html) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  mountNested(wrap);
  return wrap;
}

/**
 * Bar-width frame matching Figma artboard (~390px).
 * @param {HTMLElement} child
 * @returns {HTMLDivElement}
 */
export function frameBar(child) {
  const frame = document.createElement("div");
  frame.style.width = "390px";
  frame.style.maxWidth = "100%";
  frame.appendChild(child);
  return frame;
}

/**
 * Wire Header About toggle on a wrapper (scoped .about-open, not document.body).
 * @param {HTMLElement} root
 */
export function wireHeaderToggle(root) {
  const toggle = root.querySelector(".header__toggle");
  if (!toggle) return;

  const host = root.classList.contains("header")
    ? root.parentElement
    : root.querySelector(".header")?.parentElement ?? root;

  toggle.addEventListener("click", () => {
    const open = host?.classList.toggle("about-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close about" : "About");
    const header = root.querySelector(".header");
    if (header) header.setAttribute("data-type", open ? "about" : "home");
  });
}
