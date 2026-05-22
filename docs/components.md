# TalkingSh*rt components

Design-system components for the static site. **Components consume Output + Comps tiers only** (`--theme-*`, `--comp-*`). Input (`--color-*`, `--number-*`) and Screen (`--number-sm/md/lg`) live in the token CDN and must not appear in this folder.

CDN (load first, before `main.css`):

`https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@269a193e0d0fc8d58b03e3fe026d80f68cca1352/dist/index.css`

Pinned to commit `269a193` until jsDelivr `@main` includes `@import "./comps.css"`. The bundle chains `input.css` → `screen.css` → `output.css` (theme) → `comps.css` (components).

## Four-tier model

| Tier | File | Job | Component access |
|------|------|-----|------------------|
| Input | `input.css` | Primitives (`--color-*`, `--number-*` with px units) | Never |
| Screen | `screen.css` | Context modifiers (mobile/desktop via `@media` and `[data-screen]`) | Never |
| Output | `output.css` | Theme semantic roles | `var(--theme-*)` only |
| Comps | `comps.css` | Per-component tokens | `var(--comp-*)` only |

Components are written once with no spacing/sizing media queries. Responsiveness comes from the Screen layer re-resolving refs upstream.

## Layout

See [`layout.md`](layout.md). Every block: `[data-section]` → `[data-container]` → `[data-stack]` or `[data-row]`. Component CSS is chrome only (border, position, animation) — never flex, gap, or section padding on a component class.

## Files

| File | Role | Status |
|------|------|--------|
| `layout.css` | `[data-section]`, `[data-container]`, `[data-row]`, `[data-stack]`, `[data-gap]` | Ready (Comps tokens) |
| `type.css` | `.type-medium` / `.type-small` — Figma **Medium** / **Small** (`307:32`) | Local `--type-*` in `base.css` until CDN |
| `icon-text.css` | Label + 24px icon row (`comp.stack.2xs`) | Partial — uses `comp.nav.icon-size` (pending) |
| `top-nav.css` + `top-nav.html` | Header (Figma Home/About) + IconText nav | Partial — motion/border tokens pending |
| `top-nav-simple.html` | Success header | Ready |
| `button.css` + `button.html` | Add to cart | Ready (disabled opacity pending token) |
| `size-select.css` + `size-select.html` | Size picker | Partial — border/underline tokens pending |
| `footer.css` + `footer.html` | Footer bar | Partial — motion/border tokens pending |
| `post.css` + `post.html` | About post block | Partial — border token pending |
| `about-panel.css` + `about-panel.html` | About shell | Ready |
| `success-content.css` + `success-content.html` | Success copy block | Partial — underline offset token pending |
| `rebuild-page.css` | Dev preview chrome only | theme + comp vars only |
| `main.css` | Bundle import | — |

Landing-only UI (shirt, scroll, cursor) lives in [`/css/landing.css`](../public/css/landing.css), not in `main.css`.

## Token audit

### Theme (Output tier — `output.css`)

- `fg`, `bg`, `fg-alt`, `faint`, `faint-alt`

### Comps (Comps tier — `comps.css`)

- **comp.button:** `bg-default`, `bg-hover`, `fg`, `b-rad`, `v-pad`, `h-pad`, `min-h` (raw `56` upstream — preserved audit artifact)
- **comp.section:** `lg.v-pad`, `lg.h-pad`, `md.v-pad`, `md.h-pad`, `md.height`
- **comp.container:** `max-w`
- **comp.stack:** `2xs`, `xs`, `sm`, `md`, `lg`
- **comp.post:** `gap`

### Proposed Comps tokens (stop — awaiting tokens repo + CDN)

| Proposed CSS var | Meaning | Used in |
|------------------|---------|---------|
| `--type-medium-size` | 24px — `.type-medium` | `type.css` (in `base.css` until CDN) |
| `--type-small-size` | 12px — `.type-small` | `type.css` |
| `--type-weight-bold` | 700 — `.type-medium` | `type.css` |
| `--type-weight-medium` | 500 — `.type-small` | `type.css` |
| `--comp-border-width` | 1px borders, divider stroke | top-nav, footer, post, about-panel, size-select, rebuild-page |
| `--comp-nav-icon-size` | Nav ? / × hit target | `top-nav.css` |
| `--motion-slide-dur` | Slide transition duration | top-nav, footer, product |
| `--motion-fade-dur` | Fade transition duration | top-nav, footer, product |
| `--motion-ease` | Shared easing curve | top-nav, footer, product |
| `--comp-button-disabled-opacity` | Disabled button opacity | `button.css` |
| `--comp-link-underline-offset` | Underline offset | size-select, success-content |

### Documented non-token exceptions

| Property | Reason |
|----------|--------|
| `z-index` on fixed chrome | Not in token set; layout stacking only |
| `opacity: 0` / `opacity: 1` | Binary show/hide for nav icon crossfade — not a spacing/color token |

## New token workflow

1. Stop — do not hard-code or use Input/Screen vars.
2. Propose name + semantic meaning + tier (Output vs Comps) + resolution.
3. Wait for approval.
4. Add to `talkingshirt-tokens`, wait for jsDelivr (~10 min).
5. Reference in component CSS.

## Preview

```bash
npm run dev
```

Open http://127.0.0.1:8888/rebuild.html

## Usage

```html
<!-- pin: 269a193 until jsDelivr @main includes comps.css -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@269a193e0d0fc8d58b03e3fe026d80f68cca1352/dist/index.css"
/>
<link rel="stylesheet" href="/css/main.css" />
<div data-component="button"></div>
<script type="module" src="/js/main.js"></script>
```
