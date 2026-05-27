# TalkingSh*rt

Custom tees. Static site published from `public/` on Netlify.

## Local dev

```bash
npm run dev
```

Open http://127.0.0.1:8888/ (port increments if 8888 is busy).

- `/` — landing page (scroll animation, checkout)
- `/success.html` — order confirmation
- `/rebuild.html` — redirects to `/storybook/` (legacy path)

### Component gallery (Storybook)

Local:

```bash
npm run storybook
```

Open http://localhost:6006. Stories render templates from `public/js/components/*.html`.

Published (after Netlify deploy): `/storybook/` on your site domain.

Build locally:

```bash
npm run build:site
```

## Structure

```
public/
  css/main.css           # Component CSS bundle
  css/landing.css        # Landing-only styles (index.html)
  css/components/        # Hand-written component CSS
  js/main.js             # Page bootstrap
  js/landing.js          # Landing interactions
  js/components/         # Partial loader + HTML templates
  assets/images/         # SVG, PNG
netlify/functions/       # Stripe checkout + webhook
stories/                 # Storybook stories (Figma components)
.storybook/              # Storybook config
docs/                    # Internal docs (not deployed)
```

## Tokens

Design tokens load from jsDelivr (external `talkingshirt-tokens` repo). Every page loads the CDN bundle first, then local CSS. See [`docs/components.md`](docs/components.md) and [`.cursor/rules/main-rules.mdc`](.cursor/rules/main-rules.mdc).

## Environment

Copy `.env.example` to `.env` for local Netlify functions:

- `STRIPE_SECRET_KEY` — checkout session creation
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification

Set the same variables in the Netlify dashboard for production.
