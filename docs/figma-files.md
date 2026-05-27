# Figma files

Single registry for which Figma file is canonical for each workflow. Do not duplicate file keys elsewhere — link here.

## Files

| Role | Display name | Account | File key | URL |
|------|--------------|---------|----------|-----|
| Reference / design | talkingshirt — main | Personal Pro | `PusPmQilWCtdXjIiNIxeKn` | [Open in Figma](https://www.figma.com/design/PusPmQilWCtdXjIiNIxeKn/talkingshirt---main) |
| **Code Connect canonical** | talkingshirt — main (work) | Work Org | `WORK_FILE_KEY_TBD` | _Fill after duplicate to work org_ |

## Component node IDs

### Personal file (reference until work handoff)

Copy link uses `node-id` with hyphens; APIs use colons (`308:1314`).

| Component | Node ID | Code Connect template |
|-----------|---------|------------------------|
| IconText | `308:1314` | [`code-connect/IconText.figma.ts`](../code-connect/IconText.figma.ts) |
| Button | `194:1095` | [`code-connect/Button.figma.ts`](../code-connect/Button.figma.ts) |
| Header | `79:486` | [`code-connect/Header.figma.ts`](../code-connect/Header.figma.ts) |
| Footer | `79:418` | [`code-connect/Footer.figma.ts`](../code-connect/Footer.figma.ts) |
| Post | `79:543` | [`code-connect/Post.figma.ts`](../code-connect/Post.figma.ts) |
| SizeSelect | _(nested in Footer; no standalone node in registry)_ | [`code-connect/SizeSelect.figma.ts`](../code-connect/SizeSelect.figma.ts) |

### Work file (after duplicate)

Replace `WORK_FILE_KEY_TBD` and each `// url=` in `code-connect/*.figma.ts` with **Copy link to selection** from the work org file (main component, not a random instance). Update this table in the same PR.

## Which tool uses which file

| Tool | File to use |
|------|-------------|
| **Code Connect** (`npm run code-connect:publish`) | Work org only (Org/Enterprise + published library) |
| **design-audit** (`scan_figma.py`) | Personal until `FIGMA_FILE_KEY` in `.env` points at work duplicate |
| **Storybook** | Renders code templates; Figma links are documentation only |

## Rules

- New `// url=` comments in `code-connect/*.figma.ts` must target the **work** file before publish.
- Personal file is not published to Code Connect (Pro plan / no org publish).
- After work handoff, switch `FIGMA_FILE_KEY` in `design-audit/.env` to the work file key.

## Work handoff checklist

1. Duplicate full personal file into work org.
2. Publish **IconText, Button, Header, Footer, Post** to a team library (SizeSelect if it is its own component set).
3. Fill work file key and node table above.
4. Replace `WORK_URL_TBD` in every `code-connect/*.figma.ts` `// url=` line.
5. Set `FIGMA_ACCESS_TOKEN` (work account, Code Connect Write + File Read) in gitignored `.env`.
6. Run `npm run code-connect:publish` and verify snippets in Dev Mode.

See [`code-connect.md`](code-connect.md) and [`figma-component-spec.md`](figma-component-spec.md).
