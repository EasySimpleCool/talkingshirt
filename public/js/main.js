import { initLanding } from "./landing.js";
import { mountAll } from "./components/loader.js";

if (document.querySelector(".scroll-container")) {
  initLanding();
}

if (document.querySelector("[data-component]")) {
  mountAll().catch((err) => {
    console.error(err);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div data-section="lg"><div data-container><p class="type-small" style="color: var(--theme-fg)">Failed to load components: ${err.message}</p></div></div>`,
    );
  });
}
