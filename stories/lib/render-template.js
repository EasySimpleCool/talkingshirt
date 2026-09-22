// Gallery-only copies of the production markup. The live pages are
// hand-written static HTML (no client-side template loader), so these exist
// purely so Storybook can render each Figma component in isolation.
const templateModules = import.meta.glob("../templates/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Templates that own a form control write `{{id}}`; each render gets a fresh
// value so repeated stories on one docs page never collide on an id.
let idSeq = 0;

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
  return entry[1].replaceAll("{{id}}", `tpl-${name}-${++idSeq}`);
}

/**
 * Expand `[data-mount]` hosts with the template they name.
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
  return renderHtml(loadTemplate(name));
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
