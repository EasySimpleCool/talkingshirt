# TalkingSh*rt components

Five Figma components: **IconText**, **Button**, **Header**, **Footer**, **Post**. Code names match 1:1 (kebab-case in HTML/CSS).

CDN (load first, before `main.css`):

`https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@main/dist/index.css`

Bundle: `input.css` → `screen.css` → `output.css` → `comps.css`. Every page and
Storybook track `@main`, so a token release reaches all three at once — the flip
side is that it lands without a site deploy.

## Layout

See [`layout.md`](layout.md). Every block: `[data-section]` → `[data-container]` → `[data-stack]` or `[data-row]`.

## Files

CSS lives in `public/css/components/`. The `.html` files are gallery-only
copies of the production markup in `stories/templates/` — the live pages are
hand-written static HTML with no client-side template loader.

| File | Figma | Status |
|------|-------|--------|
| `header.css` + `header.html` | Header (Type=Home \| About) | Partial — border/motion placeholders in `base.css` |
| `icon-text.css` | IconText | Partial — `comp/nav/icon-size` placeholder |
| `button.css` + `button.html` | Button | Partial — `comp/button/bg-disabled` pending |
| `footer.css` + `footer.html` | Footer | Partial — border/motion placeholders |
| `post.css` + `post.html` | Post | Partial — border placeholder |
| `size-select.css` + `size-select.html` | (inside Footer) | Partial — link underline placeholder |
| `type.css` | Medium / Small text styles | Ready — Output tier `--output-text-medium-*`, `--output-text-small-*` |
| `success-content.css` | — | Page chrome, not a Figma component |

**About** is not a component — `Header type=About` + a page-level `.about-content` Post stack. The
Home/About swap is CSS-only: a hidden `.about-toggle` checkbox ahead of the header, read by
sibling selectors in `header.css`. Storybook renders the same markup, so there is no
story-only variant of those rules.

Landing animation: [`/css/landing.css`](../public/css/landing.css) — code-only; consumes `--output-*` for color.

## Token audit

### Output tier (`output.css`)

- `color/{fg, bg, fg-alt, bg-alt, faint}` → `--output-color-*`
- `text/medium/{font-family, font-size, font-weight, line-height, letter-spacing}` → `--output-text-medium-*`
- `text/small/{font-family, font-size, font-weight, line-height, letter-spacing}` → `--output-text-small-*`

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

## Figma and Code Connect

- File registry (personal vs work): [`figma-files.md`](figma-files.md)
- Component property model: [`figma-component-spec.md`](figma-component-spec.md)
- Dev Mode snippets (publish when work org ready): [`code-connect.md`](code-connect.md)

## Preview

Local Storybook:

```bash
npm run storybook
```

Open http://localhost:6006.

Published gallery: `/storybook/` on the Netlify site (built via `npm run build:site` on deploy). Legacy path `/rebuild.html` redirects there.
