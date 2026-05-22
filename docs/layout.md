# Layout system

How to structure markup in TalkingShirt. Read this before adding or editing any component.

## The rule

**Every shell is `section > container > stack | row`.** No exceptions, no shortcuts, no laying things out on native tags.

Layout is expressed through four data attributes — `[data-section]`, `[data-container]`, `[data-stack]`, `[data-row]` — and only through them. Class names (`.top-nav`, `.about-panel`, `.post`) carry visual chrome (background, border, position, animation), never layout.

## The primitives

### `[data-section]`

The outermost shell of any block of content. Owns the page's vertical rhythm and side padding.

| Variant             | Padding        | Height                           | When to use                                      |
| ------------------- | -------------- | -------------------------------- | ------------------------------------------------ |
| `data-section="md"` | `0 24px` h-pad | fixed `80px`, contents v-centred | Bars: top-nav, footer-drawer                     |
| `data-section="lg"` | `40px 24px`    | content-driven                   | Padded content blocks: about-panel, success page |

Sections are full-bleed by default. They never cap their own width — that's the container's job.

### `[data-container]`

Caps content width and centres it inside the section.

- `max-width: 800px` (from `--comp-container-max-w`)
- `margin-inline: auto`
- `position: relative` — children can absolutely-position against the container's edges, not the section's
- `container-type: inline-size` — children can read the live container width as `100cqi`

Always sits directly inside a `[data-section]`. Never bare on the page.

### `[data-stack]`

Vertical flex column. The default for grouping content.

- `flex-direction: column`
- `align-items: flex-start`
- `width: 100%` — children span the column by default
- No gap by default — add `data-gap="sm"` or `data-gap="lg"`

### `[data-row]`

Horizontal flex row.

- `flex-direction: row`
- `align-items: center`
- `width: 100%`
- Add `data-justify="between"` for `justify-content: space-between`

### `[data-gap]`

The only way to set gap on a stack or row.

- `data-gap="2xs"` → `--comp-stack-2xs` (4px)
- `data-gap="xs"` → `--comp-stack-xs` (8px)
- `data-gap="sm"` → `--comp-stack-sm` (16px)
- `data-gap="md"` → `--comp-stack-md` (24px)
- `data-gap="lg"` → `--comp-stack-lg` (40px)

No arbitrary gap values. If a component needs its own gap (e.g. `.post`), set `gap` on the component class using a dedicated comp token (`--comp-post-gap`), not by hard-coding a number.

## The pattern

Every block follows the same nesting:

```html
<div data-section="md|lg">
  <div data-container>
    <div data-stack data-gap="sm|lg">
      <!-- or data-row, or nested combinations -->
    </div>
  </div>
</div>
```

Stack and row are composable — a stack can contain rows, a row can contain stacks. Nest as deep as the layout needs.

## Real examples from the codebase

**Top-nav (a bar):**

```html
<div class="top-nav" data-section="md" role="banner">
  <div data-container>
    <div data-row>
      <!-- logo, title, button -->
    </div>
  </div>
</div>
```

**About panel (a long scrollable block):**

```html
<div class="about-panel" data-section="lg">
  <div data-container>
    <div data-stack data-gap="lg">
      <div class="post" data-stack>
        <div class="post-head" data-row data-justify="between">
          <span>...</span>
          <time>...</time>
        </div>
        <p>...</p>
      </div>
      <!-- more posts -->
    </div>
  </div>
</div>
```

Note: `.post` is a `[data-stack]` with its own gap token (`--comp-post-gap`) — component-specific spacing overrides the generic stack gap, but the primitive is still the same.

**Footer-drawer (a bar with two ends):**

```html
<div class="footer-drawer" data-section="md">
  <div data-container>
    <div data-row data-justify="between">
      <label>...</label>
      <button>...</button>
    </div>
  </div>
</div>
```

## What components are for

Components (`.top-nav`, `.about-panel`, `.post`, `.add-to-cart`) own chrome only:

- `position`, `top/left/right/bottom`, `z-index`
- `background`, `border`, `border-radius`
- `transition`, `transform`, `opacity` (animation state)
- `color` (when it can't come from a parent)
- Component-specific spacing tied to a `comp/*` token

Components **do not** set their own:

- `display: flex`, `flex-direction`, `align-items`, `justify-content`, `gap` — those come from `[data-stack]` / `[data-row]` / `[data-gap]`
- `padding` that duplicates a section's padding — that comes from `[data-section]`
- `max-width` for content — that comes from `[data-container]`

If you find yourself writing flex rules on a component class, you're skipping the primitive. Add the data attribute instead.

## Building a new component — the checklist

1. **Wrap it in a section.** Pick `md` for bars (fixed height, centred contents) or `lg` for content blocks (40/24 padding).
2. **Put a container inside.** Always.
3. **Inside the container, reach for `[data-stack]` first.** Use `[data-row]` only when items genuinely sit on one axis.
4. **Set gap with `data-gap`.** If neither `sm` nor `lg` is right, the answer is a new `comp/stack/*` token — stop and ask before adding one.
5. **Write the component class for chrome only.** Background, border, position, animation. Never layout.
6. **Check for native-tag styling.** No `padding` on `<section>`, no `gap` on `<div>` without a primitive, no `display: flex` on a component class.

## Anti-patterns

```html
<!-- WRONG — section bare on the page -->
<section data-section="lg">
  <h1>Title</h1>
</section>

<!-- RIGHT — section > container > stack -->
<section data-section="lg">
  <div data-container>
    <div data-stack data-gap="sm">
      <h1>Title</h1>
    </div>
  </div>
</section>
```

```css
/* WRONG — layout on the component class */
.my-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 40px 24px;
  max-width: 800px;
}

/* RIGHT — primitives handle layout, component class handles chrome */
.my-card {
  background: var(--theme-bg);
  border: 1px solid var(--theme-faint-alt);
  border-radius: 8px;
}
```

```html
<!-- And the matching markup -->
<div class="my-card" data-section="lg">
  <div data-container>
    <div data-stack data-gap="sm">...</div>
  </div>
</div>
```

## Why it's set up this way

- **Single source of truth for layout.** Section padding lives in one place. Gaps live in one place. Changing them changes every component at once.
- **Tokens stay enforceable.** Every layout value is a `--comp-*` CSS variable backed by a Figma token. Bypassing the primitives means hard-coding numbers, which breaks the design system.
- **Components stay small.** A component's CSS is 5–10 lines of chrome, not 30 lines of re-implemented flexbox.
- **The Figma file matches the code.** `comp/section`, `comp/container`, `comp/stack` exist as variables in Figma for exactly this reason. The markup mirrors the design.

## Adding new layout

If a layout need genuinely can't be expressed with the current primitives — flag it. Propose the new primitive or token, get approval, then add it to both the CSS and the Figma token chain. Don't quietly add a one-off rule.
