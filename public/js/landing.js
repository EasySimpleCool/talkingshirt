export function initLanding() {
  const scrollContainer = document.querySelector(".scroll-container");
  const animatedText = document.getElementById("animatedText");
  const scrollArrow = document.getElementById("scrollArrow");
  const tshirtContainer = document.getElementById("tshirtContainer");
  const chestText = document.getElementById("chestText");
  const chestTextContainer = document.querySelector(".chest-text-container");
  const footer = document.querySelector(".footer-drawer");
  const addToCartBtn = document.getElementById("addToCart");
  const sizeSelect = document.getElementById("sizeSelect");
  const sizeSelectText = document.getElementById("sizeSelectText");
  const navBtn = document.getElementById("navBtn");
  const aboutPanel = document.getElementById("aboutPanel");

  const FULL_TEXT = "Talk some sh*rt";

  const P = {
    idle: 0,
    type: 0.28,
    pause: 0.34,
    delete: 0.85,
    edit: 1.0,
  };

  const COLOR_FLIP_START = 0.3;
  const COLOR_FLIP_END = 0.55;

  function parseCssColorToRgb(cssColor) {
    const hex = cssColor.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const h =
        hex[1].length === 3
          ? hex[1]
              .split("")
              .map((c) => c + c)
              .join("")
          : hex[1];
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    const rgb = cssColor.match(/(\d+(?:\.\d+)?)/g);
    if (rgb && rgb.length >= 3) {
      return [Number(rgb[0]), Number(rgb[1]), Number(rgb[2])];
    }
    throw new Error(`Unsupported CSS color in token: "${cssColor}"`);
  }

  function readToken(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  const FG_DARK_RGB = parseCssColorToRgb(readToken("--theme-fg"));
  const FG_DARK_CSS = `rgb(${FG_DARK_RGB.join(", ")})`;
  const BG_LIGHT_RGB = parseCssColorToRgb(readToken("--theme-bg"));
  const BG_LIGHT_CSS = `rgb(${BG_LIGHT_RGB.join(", ")})`;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function setHeadline(text, caretPos) {
    let pos = caretPos;
    if (pos == null || pos < 0 || pos > text.length) {
      pos = text.length;
    }
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    animatedText.innerHTML =
      before + '<span class="cursor"></span>' + after;
  }

  function syncHeadlineFromInput() {
    setHeadline(chestText.value, chestText.selectionStart);
  }

  function setHeadlineOpacity(value) {
    animatedText.style.opacity = String(value);
  }

  function setShirtRise(riseVh) {
    tshirtContainer.style.transform = `translate(-50%, calc(-1 * var(--layout-chest-y) + ${riseVh}vh))`;
  }

  function setShirtOpacity(value) {
    tshirtContainer.style.opacity = String(value);
  }

  function setHeadlineTransform(scale, xOffsetPx) {
    const x = xOffsetPx || 0;
    animatedText.style.transform = `translate(calc(-50% + ${x}px), -50%) scale(${scale})`;
  }

  function setHeadlineColor(color) {
    animatedText.style.color = color;
  }

  function setCursorBg(color) {
    if (color) {
      animatedText.style.setProperty("--cursor-bg", color);
    } else {
      animatedText.style.removeProperty("--cursor-bg");
    }
  }

  function getFinalScale() {
    const copyPx = parseFloat(getComputedStyle(animatedText).fontSize);
    const chestPx = parseFloat(getComputedStyle(chestText).fontSize);
    if (!copyPx || !chestPx) return 0.25;
    return chestPx / copyPx;
  }

  function getChestOffsetX() {
    const rect = chestTextContainer.getBoundingClientRect();
    return rect.left + rect.width / 2 - window.innerWidth / 2;
  }

  function handleScroll() {
    if (document.body.classList.contains("about-open")) return;

    const scrollTop = window.scrollY;
    const maxScroll =
      scrollContainer.offsetHeight - document.documentElement.clientHeight;
    const progress = clamp(scrollTop / maxScroll, 0, 1);

    if (progress <= P.idle) {
      setHeadline("");
      setHeadlineOpacity(1);
      setHeadlineTransform(1, 0);
      setHeadlineColor(FG_DARK_CSS);
      setCursorBg(null);
      scrollArrow.classList.add("visible");
      setShirtRise(100);
      setShirtOpacity(0);
      chestText.classList.remove("editable");
      footer.classList.remove("visible");
      return;
    }

    scrollArrow.classList.remove("visible");

    if (progress < P.type) {
      const t = (progress - P.idle) / (P.type - P.idle);
      const len = Math.floor(t * (FULL_TEXT.length + 1));
      setHeadline(FULL_TEXT.slice(0, len));
      setHeadlineOpacity(1);
      setHeadlineTransform(1, 0);
      setHeadlineColor(FG_DARK_CSS);
      setCursorBg(null);
      setShirtRise(100);
      setShirtOpacity(0);
      chestText.classList.remove("editable");
      footer.classList.remove("visible");
      return;
    }

    if (progress < P.pause) {
      setHeadline(FULL_TEXT);
      setHeadlineOpacity(1);
      setHeadlineTransform(1, 0);
      setHeadlineColor(FG_DARK_CSS);
      setCursorBg(null);
      setShirtRise(100);
      setShirtOpacity(0);
      footer.classList.remove("visible");
      return;
    }

    if (progress < P.delete) {
      const t = (progress - P.pause) / (P.delete - P.pause);
      const eased = easeOutQuart(t);
      const len = Math.round(lerp(FULL_TEXT.length, 0, t));
      setHeadline(FULL_TEXT.slice(0, len));
      setShirtRise(lerp(100, 0, eased));
      setShirtOpacity(eased);

      const finalScale = getFinalScale();
      const chestX = getChestOffsetX();
      setHeadlineTransform(
        lerp(1, finalScale, eased),
        lerp(0, chestX, eased),
      );

      const dark = FG_DARK_RGB;
      const light = BG_LIGHT_RGB;
      const colorT = clamp(
        (t - COLOR_FLIP_START) / (COLOR_FLIP_END - COLOR_FLIP_START),
        0,
        1,
      );
      const c = dark.map((d, i) => Math.round(lerp(d, light[i], colorT)));
      setHeadlineColor(`rgb(${c[0]}, ${c[1]}, ${c[2]})`);
      const cursorAlpha = lerp(1, 0.5, colorT);
      setCursorBg(`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${cursorAlpha})`);
      setHeadlineOpacity(1);

      chestText.classList.remove("editable");
      footer.classList.remove("visible");
      return;
    }

    setShirtRise(0);
    setShirtOpacity(1);
    setHeadlineTransform(getFinalScale(), getChestOffsetX());
    setHeadlineColor(BG_LIGHT_CSS);
    setCursorBg(
      `rgba(${BG_LIGHT_RGB[0]}, ${BG_LIGHT_RGB[1]}, ${BG_LIGHT_RGB[2]}, 0.5)`,
    );
    setHeadlineOpacity(1);
    syncHeadlineFromInput();

    chestText.classList.add("editable");
    if (chestText.value.trim().length > 0) {
      footer.classList.add("visible");
    } else {
      footer.classList.remove("visible");
    }
  }

  chestText.addEventListener("input", () => {
    syncHeadlineFromInput();
    const hasText = chestText.value.trim().length > 0;
    if (hasText) {
      footer.classList.add("visible");
    } else {
      footer.classList.remove("visible");
    }
  });

  document.addEventListener("selectionchange", () => {
    if (document.activeElement === chestText) {
      syncHeadlineFromInput();
    }
  });

  sizeSelect.addEventListener("change", () => {
    sizeSelectText.textContent = sizeSelect.value;
  });

  const addToCartWrap = document.getElementById("addToCartWrap");
  addToCartWrap.addEventListener("click", () => {
    if (!addToCartBtn.disabled) return;
    if (!document.body.classList.contains("about-open")) {
      navBtn.click();
    }
  });

  addToCartBtn.addEventListener("click", async () => {
    const text = chestText.value.trim();
    const size = sizeSelect.value;
    if (!text) return;

    const originalLabel = addToCartBtn.textContent;
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "Loading…";

    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ size, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error(err);
      alert("Sorry, we couldn't start checkout. Please try again.");
      addToCartBtn.disabled = false;
      addToCartBtn.textContent = originalLabel;
    }
  });

  navBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("about-open");
    navBtn.setAttribute("aria-label", open ? "Close about" : "About");
    navBtn.setAttribute("aria-expanded", String(open));
    aboutPanel.setAttribute("aria-hidden", String(!open));
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
    if (open && document.activeElement === chestText) {
      chestText.blur();
    }
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);

  window.addEventListener("scrollend", () => {
    if (document.body.classList.contains("about-open")) return;
    if (!chestText.classList.contains("editable")) return;
    const active = document.activeElement;
    const ownsFocus =
      active &&
      active !== document.body &&
      active.matches("input, select, textarea, button");
    if (active !== chestText && !ownsFocus) {
      chestText.focus({ preventScroll: true });
    }
  });

  scrollContainer.addEventListener("click", () => {
    if (document.body.classList.contains("about-open")) return;
    if (!chestText.classList.contains("editable")) return;
    if (document.activeElement === chestText) return;
    chestText.focus({ preventScroll: true });
  });

  handleScroll();
}
