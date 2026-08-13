export function initLanding() {
  const stageEl = document.querySelector(".stage");
  const fixedContent = document.querySelector(".fixed-content");
  const footerSlider = document.querySelector(".footer-slider");
  const animatedText = document.getElementById("animatedText");
  const textRun = document.getElementById("textRun");
  const cursor = document.getElementById("cursor");
  const tshirtContainer = document.getElementById("tshirtContainer");
  const chestText = document.getElementById("chestText");
  const chestTextContainer = document.querySelector(".chest-text-container");
  const footer = document.querySelector(".footer");
  const addToCartBtn = document.getElementById("addToCart");
  const addToCartWrap = document.getElementById("addToCartWrap");
  const sizeSelect = document.getElementById("sizeSelect");
  const sizeSelectText = document.getElementById("sizeSelectText");
  const headerToggle = document.getElementById("headerToggle");
  const logo = document.querySelector(".logo");
  const aboutContent = document.getElementById("aboutContent");
  const ordersPausedPost = document.getElementById("ordersPausedPost");
  const ordersOpenPost = document.getElementById("ordersOpenPost");
  const stockLeft = document.getElementById("stockLeft");

  // Frozen layout-viewport height, used instead of live vh/clientHeight
  // everywhere in the stage. Brave on iOS shrinks the layout viewport for the
  // on-screen keyboard (unlike Safari/Chrome, which only shrink the visual
  // viewport per spec), which would otherwise corrupt shirt geometry
  // mid-type. Only refreshed while chestText isn't focused, so a
  // keyboard-driven change (which only ever happens while focused) never
  // updates it — only genuine resizes do.
  let stageHeight = window.innerHeight;
  document.documentElement.style.setProperty("--stage-h", `${stageHeight}px`);

  // Real cursor + fine pointer = desktop-class device where auto-focus after
  // the intro is a win. On touch it silently swallows the tap that would
  // otherwise raise the on-screen keyboard, so mobile stays tap-to-focus.
  const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function refreshStageHeight() {
    if (document.activeElement === chestText) return;
    if (Math.abs(window.innerHeight - stageHeight) < 100) return;
    stageHeight = window.innerHeight;
    document.documentElement.style.setProperty("--stage-h", `${stageHeight}px`);
  }

  // Reference-counted body scroll lock shared by the About panel and chest-
  // text edit mode, so one closing/blurring can't clobber the other's lock
  // if they ever briefly overlap (About force-blurs chestText on open).
  let scrollLockCount = 0;
  function lockScroll() {
    scrollLockCount++;
    document.documentElement.classList.add("is-scroll-locked");
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.classList.remove("is-scroll-locked");
    }
  }

  const ORDER_LABEL = addToCartBtn.textContent.trim();

  const FULL_TEXT = "Talk some sh*rt";

  const PLACEHOLDER_TEXT = "Type";
  const PLACEHOLDER_TYPE_MS = 90;
  let placeholderTimer = null;
  let placeholderActive = false;
  let placeholderSettled = false;

  const P = {
    idle: 0,
    type: 0.28,
    pause: 0.34,
    delete: 0.85,
    edit: 1.0,
  };

  // Which "lane" of the journey we're in. Orthogonal to editLocked/
  // placeholderActive/placeholderSettled below, which stay meaningful within
  // any mode — this is the one cross-cutting, mutually-exclusive concern
  // several independent listeners need to branch on.
  const MODE = { AUTOPLAY: "autoplay", READY: "ready", EDIT: "edit", VIEW: "view" };
  let mode = MODE.AUTOPLAY;

  // Single source of truth for the animation's position (0-1), driven purely
  // by time (see startAnimating) — never derived from real document scroll.
  let progress = 0;

  const AUTOPLAY_START_DELAY_MS = 1000; // initial blank/blink hold
  let autoplayRafId = null;
  let autoplayTimer1 = null;

  const AUTOPLAY_STAGES = [
    // Ramp from blank to the full "Talk some sh*rt" headline.
    { from: 0, to: P.pause, duration: 1000, ease: easeInQuad },
    // Continue from full headline to empty/shirt-risen end state.
    // Linear-in-time: render()'s own pause<=progress<delete branch already
    // applies its own easeOutQuart to the sub-range t for the rise/crossfade
    // visuals, so a second easing here on top would double up.
    { from: P.pause, to: 1, duration: 1000, ease: (t) => t },
  ];

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
  const LIVE_CARET_COLOR = `rgba(${BG_LIGHT_RGB[0]}, ${BG_LIGHT_RGB[1]}, ${BG_LIGHT_RGB[2]}, 0.5)`;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function easeInQuad(t) {
    return t * t;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function setHeadline(text) {
    textRun.textContent = text;
    textRun.classList.remove("chest-placeholder");
  }

  function syncHeadlineFromInput() {
    setHeadline(chestText.value);
  }

  function setHeadlinePlaceholder(len) {
    textRun.textContent = PLACEHOLDER_TEXT.slice(0, len);
    textRun.classList.add("chest-placeholder");
  }

  function startPlaceholderTyping() {
    if (placeholderTimer || chestText.value.length > 0) return;
    placeholderActive = true;
    updateCaretMode();
    if (placeholderSettled) return;
    let len = 0;
    setHeadlinePlaceholder(len);
    placeholderTimer = setInterval(() => {
      len += 1;
      setHeadlinePlaceholder(len);
      if (len >= PLACEHOLDER_TEXT.length) {
        clearInterval(placeholderTimer);
        placeholderTimer = null;
        placeholderSettled = true;
      }
    }, PLACEHOLDER_TYPE_MS);
  }

  function stopPlaceholderTyping() {
    if (placeholderTimer) {
      clearInterval(placeholderTimer);
      placeholderTimer = null;
    }
    placeholderActive = false;
    updateCaretMode();
  }

  function setHeadlineOpacity(value) {
    animatedText.style.opacity = String(value);
  }

  function setShirtRise(riseVh) {
    tshirtContainer.style.transform = `translate(-50%, calc(-1 * var(--layout-chest-y) + ${riseVh / 100} * var(--stage-h) + var(--layout-shirt-keyboard-drop, 0px)))`;
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

  // Exactly one of {fake overlay text, real chestText text} is visible at a
  // time. "Live editing" = editable and not mid-placeholder-hint-animation.
  // The overlay is rendered large and CSS-scaled down to align with chestText,
  // and font kerning/hinting isn't perfectly linear across sizes — so once
  // live editing starts, chestText's own text (and caret) take over as the
  // sole visible rendering, rather than trying to keep two separately-sized
  // renderings of the same string pixel-aligned glyph-for-glyph.
  function updateCaretMode() {
    const isLiveEditing =
      chestText.classList.contains("editable") && !placeholderActive;
    cursor.style.visibility = isLiveEditing ? "hidden" : "";
    chestText.style.caretColor = isLiveEditing ? LIVE_CARET_COLOR : "transparent";
    chestText.style.color = isLiveEditing ? BG_LIGHT_CSS : "transparent";
    setHeadlineOpacity(isLiveEditing ? 0 : 1);
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

  function isKeyboardOpen() {
    const vv = window.visualViewport;
    return vv ? stageHeight - vv.height > 150 : false;
  }

  function render() {
    if (document.body.classList.contains("about-open")) return;
    if (editLocked) return;
    if (mode === MODE.VIEW) return;

    if (progress < P.delete) stopPlaceholderTyping();

    if (progress <= P.idle) {
      setHeadline("");
      setHeadlineOpacity(1);
      setHeadlineTransform(1, 0);
      setHeadlineColor(FG_DARK_CSS);
      setCursorBg(null);
      setShirtRise(100);
      setShirtOpacity(0);
      chestText.classList.remove("editable");
      updateCaretMode();
      footer.classList.remove("footer--visible");
      return;
    }

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
      updateCaretMode();
      footer.classList.remove("footer--visible");
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
      chestText.classList.remove("editable");
      updateCaretMode();
      footer.classList.remove("footer--visible");
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
      updateCaretMode();
      footer.classList.remove("footer--visible");
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
    if (!placeholderActive) {
      syncHeadlineFromInput();
    }

    chestText.classList.add("editable");
    updateCaretMode();
    if (chestText.value.trim().length > 0) {
      footer.classList.add("footer--visible");
    } else {
      footer.classList.remove("footer--visible");
    }
  }

  // View-mode: reached when the user dismisses the keyboard. The footer
  // drawer (size + order) only shows once there's text on the shirt.
  function enterViewMode() {
    mode = MODE.VIEW;
    footer.classList.toggle(
      "footer--visible",
      chestText.value.trim().length > 0,
    );
  }

  chestText.addEventListener("input", () => {
    stopPlaceholderTyping();
    syncHeadlineFromInput();
    const hasText = chestText.value.trim().length > 0;
    if (hasText) {
      footer.classList.add("footer--visible");
      placeholderSettled = false;
    } else {
      footer.classList.remove("footer--visible");
      startPlaceholderTyping();
    }
  });

  chestText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      chestText.blur();
    }
  });

  chestText.addEventListener("focus", () => {
    // render() adds .editable (and its pointer-events:auto) purely off
    // progress, which crosses P.delete before autoplay's rAF loop itself
    // reports done — a precisely-timed direct click on the input during that
    // tail window could otherwise focus it early. Bounce it back out so
    // "ignore input during autoplay" holds for this path too.
    if (mode === MODE.AUTOPLAY) {
      chestText.blur();
      return;
    }
    mode = MODE.EDIT;
    enterEditLock();
    if (chestText.value.length === 0) {
      startPlaceholderTyping();
    }
  });

  chestText.addEventListener("blur", () => {
    // Only tear the placeholder down once the user has committed real text.
    // An empty-field blur (e.g. clicking the footer strip) should leave the
    // "Type" overlay visible — placeholderActive flipping false while the
    // input is empty would make updateCaretMode hide it, and there is no
    // real value to paint in its place, so the shirt would go blank.
    if (chestText.value.length > 0) {
      stopPlaceholderTyping();
    }
    exitEditLock();
    enterViewMode();
  });

  sizeSelect.addEventListener("change", () => {
    sizeSelectText.textContent = sizeSelect.value;
  });

  // Orders kill switch. The button and About posts default to the "open"
  // state in the HTML; if the server reports orders are paused we flip the
  // UI to match. A disabled button swallows clicks (CSS pointer-events:none),
  // so the wrapper catches them and opens the About panel instead, where the
  // "Orders are suspended" post lives.
  function applyOrdersState(ordersOpen) {
    addToCartBtn.disabled = !ordersOpen;
    addToCartBtn.setAttribute("aria-disabled", String(!ordersOpen));
    addToCartBtn.textContent = ordersOpen ? ORDER_LABEL : "Orders paused";
    if (ordersPausedPost) ordersPausedPost.hidden = ordersOpen;
    if (ordersOpenPost) ordersOpenPost.hidden = !ordersOpen;
  }

  // Shows the live "N Left" count when a cap is configured and orders remain.
  // A null remaining (no cap) or 0 (paused/full) hides it.
  function applyRemaining(remaining) {
    if (!stockLeft) return;
    if (typeof remaining === "number" && remaining > 0) {
      stockLeft.textContent = `${remaining} Left`;
      stockLeft.hidden = false;
    } else {
      stockLeft.hidden = true;
    }
  }

  addToCartWrap.addEventListener("click", (e) => {
    if (e.target === addToCartBtn) return;
    if (!addToCartBtn.disabled) return;
    if (!document.body.classList.contains("about-open")) {
      headerToggle.click();
    }
  });

  (async () => {
    try {
      const res = await fetch("/.netlify/functions/order-status");
      const data = await res.json().catch(() => ({}));
      applyOrdersState(data.ordersOpen !== false);
      applyRemaining(data.remaining);
    } catch {
      // If the check fails, leave orders open (the safe default is that the
      // server-side guard in create-checkout still refuses paused orders).
    }
  })();

  addToCartBtn.addEventListener("click", async () => {
    if (addToCartBtn.disabled) return;
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
      if (data.ordersOpen === false) {
        applyOrdersState(false);
        applyRemaining(0);
        if (!document.body.classList.contains("about-open")) {
          headerToggle.click();
        }
        return;
      }
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

  headerToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("about-open");
    headerToggle.setAttribute("aria-label", open ? "Close about" : "About");
    headerToggle.setAttribute("aria-expanded", String(open));
    aboutContent.setAttribute("aria-hidden", String(!open));
    if (open) {
      lockScroll();
    } else {
      unlockScroll();
    }
    if (open && document.activeElement === chestText) {
      chestText.blur();
    }
  });

  window.addEventListener("resize", () => {
    refreshStageHeight();
    render();
  });

  // Edit-mode keyboard clearance: while chestText is locked/focused, the
  // keyboard shrinks visualViewport.height. Rather than resizing
  // .fixed-content live to match (which used to make every top:%-based
  // descendant jitter as the keyboard animated, since they resolve against
  // its shrinking box), .fixed-content's own height stays pinned to the
  // frozen --stage-h (see landing.css) and we instead wait for the
  // visualViewport events to go quiet, then apply a single deliberate
  // translateY shift that clears the keyboard.
  let editLocked = false;
  let editClearanceShiftPx = 0;
  let vvSettleTimer = null;
  const VV_SETTLE_MS = 120;
  const STAGE_CENTER_FRACTION =
    (parseFloat(readToken("--layout-stage-center")) || 36) / 100;

  function applyFixedTransform() {
    const vv = window.visualViewport;
    const panY = vv ? vv.offsetTop : 0;
    const y = panY - editClearanceShiftPx;
    fixedContent.style.transform = y ? `translateY(${y}px)` : "";
  }

  function applyEditKeyboardClearance() {
    const vv = window.visualViewport;
    if (!vv) return;
    const keyboardInsetPx = Math.max(0, stageHeight - vv.height);
    editClearanceShiftPx = editLocked
      ? Math.min(STAGE_CENTER_FRACTION * keyboardInsetPx, keyboardInsetPx)
      : 0;
    applyFixedTransform();
  }

  function scheduleEditKeyboardClearance() {
    if (!editLocked) return;
    clearTimeout(vvSettleTimer);
    vvSettleTimer = setTimeout(applyEditKeyboardClearance, VV_SETTLE_MS);
  }

  function enterEditLock() {
    editLocked = true;
    lockScroll();
  }

  function exitEditLock() {
    editLocked = false;
    clearTimeout(vvSettleTimer);
    editClearanceShiftPx = 0;
    applyFixedTransform();
    unlockScroll();
  }

  function syncFixedToVisualViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    applyFixedTransform();
    const keyboardInset = window.innerHeight - vv.height - vv.offsetTop;
    footerSlider.style.bottom = keyboardInset > 0 ? `${keyboardInset}px` : "";
    document.body.classList.toggle("keyboard-open", isKeyboardOpen());
    scheduleEditKeyboardClearance();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncFixedToVisualViewport);
    window.visualViewport.addEventListener("scroll", syncFixedToVisualViewport);
    syncFixedToVisualViewport();
  }

  // Sole entry point into Edit-mode: an explicit tap, never a silent
  // programmatic focus. Auto-focusing on scrollend (as this used to) doesn't
  // reliably raise the on-screen keyboard on iOS/Android since it isn't
  // driven by a real user gesture.
  stageEl.addEventListener("click", () => {
    if (document.body.classList.contains("about-open")) return;
    if (!chestText.classList.contains("editable")) return;
    if (mode !== MODE.READY && mode !== MODE.VIEW) return;
    if (document.activeElement === chestText) return;
    chestText.focus({ preventScroll: true });
  });

  logo.addEventListener("click", (e) => {
    e.preventDefault();
    if (document.body.classList.contains("about-open")) headerToggle.click();
    if (document.activeElement === chestText) chestText.blur();
    runIntroSequence();
  });

  // Auto-play orchestrator: plays the intro on load and is replayed by the
  // logo click above. Fully self-resetting so it's safe to re-enter mid-run
  // (e.g. the logo mashed repeatedly) without competing scroll loops.
  function runIntroSequence() {
    cancelAnimationFrame(autoplayRafId);
    clearTimeout(autoplayTimer1);

    if (editLocked) exitEditLock();
    stopPlaceholderTyping();
    placeholderSettled = false;
    footer.classList.remove("footer--visible");

    mode = MODE.AUTOPLAY;

    progress = 0;
    render();

    autoplayTimer1 = setTimeout(startAnimating, AUTOPLAY_START_DELAY_MS);
  }

  function startAnimating() {
    let lastTs = null;
    let stageIndex = 0;
    let elapsedInStage = 0;

    function finish() {
      progress = 1;
      render();
      mode = MODE.READY;
      if (isDesktopPointer) {
        chestText.focus({ preventScroll: true });
      } else {
        startPlaceholderTyping();
      }
    }

    function frame(ts) {
      const delta = lastTs === null ? 0 : ts - lastTs;
      lastTs = ts;
      if (!document.body.classList.contains("about-open")) {
        elapsedInStage += delta;
      }

      // Advance past any stages that fully elapsed within one frame delta
      // (e.g. after a tab-switch stall), rather than getting stuck replaying
      // a finished stage.
      while (
        stageIndex < AUTOPLAY_STAGES.length &&
        elapsedInStage >= AUTOPLAY_STAGES[stageIndex].duration
      ) {
        elapsedInStage -= AUTOPLAY_STAGES[stageIndex].duration;
        stageIndex += 1;
      }

      if (stageIndex >= AUTOPLAY_STAGES.length) {
        finish();
        return;
      }

      const stage = AUTOPLAY_STAGES[stageIndex];
      const t = clamp(elapsedInStage / stage.duration, 0, 1);
      const eased = stage.ease(t);
      progress = lerp(stage.from, stage.to, eased);
      render();

      autoplayRafId = requestAnimationFrame(frame);
    }
    autoplayRafId = requestAnimationFrame(frame);
  }

  runIntroSequence();
}
