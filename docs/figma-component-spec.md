# Figma component spec (Code Connect)

Property model for the five Figma components plus SizeSelect. Use this when editing the Figma file (personal now, work after duplicate) and when maintaining `code-connect/*.figma.ts`.

Code names: [`design-audit/name-map.yaml`](../design-audit/name-map.yaml). Figma component names stay **PascalCase**; HTML/CSS use kebab-case.

## Global rules

1. Prefer **component properties** (TEXT, VARIANT, BOOLEAN, INSTANCE_SWAP) over unprefixed layer text overrides.
2. **Publishable units** for the work library: IconText, Button, Header, Footer, Post; SizeSelect only if it exists as its own component set in Figma.
3. **INSTANCE_SWAP** for icons and nested design-system pieces (Button inside Footer, IconText inside Header when modeled as instances).
4. **Stable layer names** for `findInstance()` when a slot is not an INSTANCE_SWAP prop (documented per component below).
5. Re-validate property names in Dev Mode after work duplicate — names must match `getString` / `getEnum` calls in templates exactly (case-sensitive).

## IconText

| Property | Figma type | Values / notes | Code |
|----------|------------|----------------|------|
| `Label` | TEXT | e.g. About, Close | `.icon-text__label` |
| `Icon` | VARIANT or INSTANCE_SWAP | About → `ball.svg`, Close → `close.svg` | `.icon-text__icon` modifier (`--ball` / `--close`) |

**Template:** [`code-connect/IconText.figma.ts`](../code-connect/IconText.figma.ts)  
**HTML:** [`public/js/components/icon-text.html`](../public/js/components/icon-text.html)

If `Icon` is VARIANT (not swap), use: `About`, `Close` mapping to the `icon-text__icon--ball` and `icon-text__icon--close` modifier classes (each sets a `--icon-text-mask` to the matching SVG).

## Button

| Property | Figma type | Values / notes | Code |
|----------|------------|----------------|------|
| `Label` | TEXT | e.g. Order \| $23, Orders paused | button text |
| `State` | VARIANT | `Default`, `Hover`, `Disabled` | default / `.button--hover` / `disabled` attr |

**Template:** [`code-connect/Button.figma.ts`](../code-connect/Button.figma.ts)  
**HTML:** [`button.html`](../public/js/components/button.html), [`button-disabled.html`](../public/js/components/button-disabled.html)

## Post

| Property | Figma type | Values / notes | Code |
|----------|------------|----------------|------|
| `Title` | TEXT | post label | `.post-label` |
| `Date` | TEXT | display date | `.post-date` text |
| `Datetime` | TEXT | ISO date for `datetime` | `.post-date` attribute |
| `Body` | TEXT | paragraph | `.post-body` |

**Template:** [`code-connect/Post.figma.ts`](../code-connect/Post.figma.ts)  
**HTML:** [`post.html`](../public/js/components/post.html)

## SizeSelect

| Property | Figma type | Values / notes | Code |
|----------|------------|----------------|------|
| `Size` | VARIANT | Small, Medium, Large, XLarge, XXLarge | label + `<option selected>` |

**Template:** [`code-connect/SizeSelect.figma.ts`](../code-connect/SizeSelect.figma.ts)  
**HTML:** [`size-select.html`](../public/js/components/size-select.html)  
**Usage:** Nested in Footer; production loads via `data-mount="size-select"`.

## Footer

| Child | Integration | Code |
|-------|-------------|------|
| SizeSelect | INSTANCE_SWAP `SizeSelect` or layer `SizeSelect` | `executeTemplate()` → `id: size-select` |
| Button | INSTANCE_SWAP `Button` or layer `Button` | `executeTemplate()` → `id: button` |

**Template:** [`code-connect/Footer.figma.ts`](../code-connect/Footer.figma.ts)  
**HTML:** [`footer.html`](../public/js/components/footer.html) — production uses `data-mount` for children; Dev Mode snippet shows resolved nested markup.

## Header

| Property | Figma type | Values / notes | Code |
|----------|------------|----------------|------|
| `Type` | VARIANT | `Home`, `About` | `data-type="home"` \| `data-type="about"` |

Toggle uses inline IconText (not `data-mount`). Layer names for `findInstance` (if not INSTANCE_SWAP):

- `header__toggle-state--home` / `header__toggle-state--about` (class on span.icon-text)

**About** variant: `aria-expanded="true"`, `aria-label="Close about"` on `.header__toggle`.

**Template:** [`code-connect/Header.figma.ts`](../code-connect/Header.figma.ts)  
**HTML:** [`header.html`](../public/js/components/header.html)

## Personal Figma prep (optional, before work access)

On the personal file, align component properties to the tables above so duplicate-to-work does not require restructuring. Publishing Code Connect from personal Pro is not supported — prep only.
