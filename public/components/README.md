# TalkingSh*rt components

Token-driven UI pieces for the static site. All visual values come from:

`https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@main/dist/index.css`

## Files

| File | Role |
|------|------|
| `tokens-aliases.css` | Local aliases built only from `--number-*` (nav size, motion duration) |
| `layout.css` | `[data-section]`, `[data-container]`, `[data-row]`, `[data-stack]`, `[data-gap]` |
| `type.css` | `.type-medium`, `.type-small` |
| `top-nav.css` + `top-nav.html` | Product header with About toggle |
| `top-nav-simple.html` | Success-page header |
| `button.css` + `button.html` | Add to cart |
| `size-select.css` + `size-select.html` | Size picker |
| `footer.css` + `footer.html` | Footer bar (nested button + size-select) |
| `post.css` + `post.html` | About post block |
| `about-panel.css` + `about-panel.html` | About section shell |
| `success-content.css` + `success-content.html` | Success page copy block |
| `index.css` | Imports all component styles |

## Preview

Open `/rebuild.html` (uses `/js/components.js` to load `*.html` templates).

## Usage

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/EasySimpleCool/talkingshirt-tokens@main/dist/index.css" />
<link rel="stylesheet" href="/components/index.css" />
<div data-component="button"></div>
<script type="module">
  import { mountAll } from "/js/components.js";
  mountAll();
</script>
```

`index.html` and `success.html` are unchanged on this branch; they still use inline CSS until migrated.
