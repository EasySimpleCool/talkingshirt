# Code Connect

[Figma Code Connect](https://www.figma.com/developers/code-connect) maps design components to production HTML snippets in Dev Mode. This repo uses the official **CLI + template files** (`.figma.ts`) integration.

## Status

| Step | Status |
|------|--------|
| Repo templates in `code-connect/` | Ready |
| Publish to Figma | **Blocked** until work Org file + published library + `FIGMA_ACCESS_TOKEN` |
| Dev Mode verification | **Blocked** (same) |

See [`figma-files.md`](figma-files.md) for personal vs work file registry and handoff checklist.

## Hygiene (production untouched)

- Templates live only in [`code-connect/`](../code-connect/) — not imported by `public/`, Storybook, or Netlify.
- [`figma.config.json`](../figma.config.json) limits scanning to `code-connect/**/*.figma.ts`.
- Tokens and layout rules unchanged — snippets may list CDN + `main.css` in `imports` for Dev Mode context only.

## Setup

```bash
npm install
```

Requires Node 18+. `@figma/code-connect` is a devDependency.

### Environment (gitignored)

Copy [`design-audit/.env.example`](../design-audit/.env.example) to `design-audit/.env` (or root `.env` if you prefer one file):

```bash
FIGMA_ACCESS_TOKEN=   # work account; scopes: Code Connect Write, File content Read
FIGMA_FILE_KEY=       # work file key after duplicate (see figma-files.md)
```

Do not commit tokens.

## Publish (when unblocked)

1. Complete [work handoff](figma-files.md#work-handoff-checklist).
2. Replace every `WORK_URL_TBD` in `code-connect/*.figma.ts` with the work component URL (`// url=https://...`).
3. Run:

```bash
npm run code-connect:publish
```

Uses `FIGMA_ACCESS_TOKEN` from the environment (or pass `--token=...`).

Unpublish a bad mapping:

```bash
npx figma connect unpublish --node=NODE_URL --label=HTML
```

## Property model

Authoring and template mapping: [`figma-component-spec.md`](figma-component-spec.md).

## Local checks (no Figma API)

```bash
npx figma connect --help
```

TypeScript types for templates: `tsconfig.json` includes only `code-connect/**`.

Template files may only `import` from `figma` (CLI limitation). Shared `imports` arrays are duplicated per file.

```bash
npx figma connect publish --dry-run --exit-on-unreadable-files
```

## Related tooling

| Tool | Role |
|------|------|
| **Storybook** | Runnable component previews (`npm run storybook`) |
| **design-audit** | Token/name drift vs Figma variables |
| **Code Connect** | Dev Mode HTML snippets only |
