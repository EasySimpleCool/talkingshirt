# TalkingSh*rt components

Five Figma components: **IconText**, **Button**, **Header**, **Footer**, **Post**. Code names match 1:1 (kebab-case in HTML/CSS).

CDN (load first, before `main.css`):

`https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@6989e7981a44a6f747d5c7f76d439aa85399cc93/dist/index.css`

Pinned to `6989e79`. Bundle: `input.css` → `screen.css` → `output.css` → `comps.css`.

## Layout

See [`layout.md`](layout.md). Every block: `[data-section]` → `[data-container]` → `[data-stack]` or `[data-row]`.

## Files

| File | Figma | Status |
|------|-------|--------|
| `header.css` + `header.html` | Header (Type=Home \| About) | Partial — border/motion placeholders in `base.css` |
| `header-logo-only.html` | Header Type=Home, no IconText | Rebuild / success only |
| `icon-text.css` + `icon-text.html` | IconText | Partial — `comp/nav/icon-size` placeholder |
| `button.css` + `button.html` | Button | Partial — `comp/button/bg-disabled` pending |
| `footer.css` + `footer.html` | Footer | Partial — border/motion placeholders |
| `post.css` + `post.html` | Post | Partial — border placeholder |
| `size-select.css` + `size-select.html` | (inside Footer) | Partial — link underline placeholder |
| `type.css` | Medium / Small text styles | Ready — Output tier `--text-medium-*`, `--text-small-*` |
| `success-content.css` | — | Page chrome, not a Figma component |
| `rebuild-page.css` + `rebuild.css` | — | Gallery only |

**About** is not a component — `Header type=About` + a page-level `.about-content` Post stack.

Landing animation: [`/css/landing.css`](../public/css/landing.css) — code-only; consumes `--theme-*` for color.

## Token audit

### Output tier (`output.css`)

- `theme/{fg, bg, fg-alt, faint, faint-alt}`
- `text/medium/{font-size, font-weight, line-height, letter-spacing}` → `--text-medium-*`
- `text/small/{font-size, font-weight, line-height, letter-spacing}` → `--text-small-*`

### Comps tier (`comps.css`)

- **comp.button:** `fg`, `bg-default`, `bg-hover`, `b-rad`, `v-pad`, `h-pad`, `min-h`
- **comp.section:** `md/{height, h-pad, v-pad}`, `lg/{h-pad, v-pad}`
- **comp.container:** `max-w`
- **comp.stack:** `2xs`, `xs`, `sm`, `md`, `lg`
- **comp.post:** `gap`

### Placeholders in `base.css` (awaiting ts-tokens)

| CSS var | Meaning |
|---------|---------|
| `--comp-border-width` | 1px borders |
| `--comp-nav-icon-size` | IconText icon size |
| `--comp-link-underline-offset` | Underlined labels / links |
| `--motion-slide-dur`, `--motion-fade-dur`, `--motion-ease` | Transitions until motion tokens ship |

### Still to add in ts-tokens

- `comp/button/bg-disabled`
- `comp/border/width`, `comp/nav/icon-size`, `comp/link/underline-offset`
- `motion/*` (when ready)

## Preview

Local Storybook:

```bash
npm run storybook
```

Open http://localhost:6006.

Published gallery: `/storybook/` on the Netlify site (built via `npm run build:site` on deploy). Legacy path `/rebuild.html` redirects there.
