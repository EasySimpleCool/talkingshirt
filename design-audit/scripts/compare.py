from __future__ import annotations

"""
compare.py — directional drift report: Figma (source of truth) → code.

Usage:
  python compare.py \
    --figma output/figma-scan-main.json \
    --code  output/code-scan.md \
    [--embeddings] \
    [--llm-review]

Reads the two scan outputs and produces a Markdown drift report on stdout.
  --embeddings  Use sentence-transformers for semantic token matching
                (falls back to fuzzy if the package isn't installed).
  --llm-review  POST matched/unmatched pairs to the Claude API for a
                prose commentary on each drift (requires ANTHROPIC_API_KEY).

Exit codes:
  0 — no drift detected
  1 — drift found (use in CI to gate merges)
  2 — error (missing inputs, bad config, etc.)
"""

import argparse
import json
import re
import sys
from pathlib import Path

from normalize import resolve

# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def load_figma_scan(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        sys.exit(f"Error: figma scan not found at {path!r}. Run scan_figma.py first.")
    with p.open() as f:
        return json.load(f)


def _parse_code_scan_components(text: str) -> list[str]:
    """Extract component names from the ## Components section of code-scan.md."""
    in_section = False
    names: list[str] = []
    for line in text.splitlines():
        if re.match(r"^##\s+Components", line, re.IGNORECASE):
            in_section = True
            continue
        if in_section and re.match(r"^##\s+", line):
            break
        if in_section:
            # Accept lines like "- **name**", "- `name`", or "### name"
            m = re.match(r"^[-*]\s+\*\*(.+?)\*\*\s*$", line)
            if m:
                names.append(m.group(1).strip())
                continue
            m = re.match(r"^[-*]\s+`([^`]+)`\s*$", line)
            if m:
                names.append(m.group(1).strip())
                continue
            m2 = re.match(r"^###\s+`?(\S[^`]*)`?", line)
            if m2:
                names.append(m2.group(1).strip())
    return names


def _parse_code_scan_assets(text: str) -> list[str]:
    """Extract asset names from the ## Assets section of code-scan.md."""
    in_section = False
    names: list[str] = []
    for line in text.splitlines():
        if re.match(r"^##\s+Assets", line, re.IGNORECASE):
            in_section = True
            continue
        if in_section and re.match(r"^##\s+", line):
            break
        if in_section:
            m = re.match(r"^[-*]\s+`([^`]+)`\s*$", line)
            if m:
                names.append(m.group(1).strip())
                continue
            m = re.match(r"^[-*]\s+\*\*(.+?)\*\*\s*$", line)
            if m:
                names.append(m.group(1).strip())
    return names


def _parse_code_scan_tokens(text: str) -> list[str]:
    """Extract token names from the ## Tokens section of code-scan.md."""
    in_section = False
    tokens: list[str] = []
    for line in text.splitlines():
        if re.match(r"^##\s+Tokens", line, re.IGNORECASE):
            in_section = True
            continue
        if in_section and re.match(r"^##\s+", line):
            break
        if in_section:
            # Match "`--token-name`" or "- --token-name" patterns
            m = re.search(r"`(--[\w-]+)`", line)
            if m:
                tokens.append(m.group(1))
            else:
                m2 = re.match(r"^[-*]\s+(--[\w-]+)", line)
                if m2:
                    tokens.append(m2.group(1))
    return tokens


def load_code_scan(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        sys.exit(f"Error: code scan not found at {path!r}. Author output/code-scan.md first.")
    text = p.read_text()
    return {
        "components": _parse_code_scan_components(text),
        "assets": _parse_code_scan_assets(text),
        "tokens": _parse_code_scan_tokens(text),
    }


# ---------------------------------------------------------------------------
# Semantic embeddings (optional)
# ---------------------------------------------------------------------------

def _try_embeddings_match(
    figma_name: str, candidates: list[str], threshold: float = 0.75
) -> str | None:
    try:
        from sentence_transformers import SentenceTransformer, util  # type: ignore
    except ImportError:
        return None

    model = SentenceTransformer("all-MiniLM-L6-v2")
    emb_query = model.encode(figma_name, convert_to_tensor=True)
    emb_cands = model.encode(candidates, convert_to_tensor=True)
    scores = util.cos_sim(emb_query, emb_cands)[0]
    best_idx = int(scores.argmax())
    if float(scores[best_idx]) >= threshold:
        return candidates[best_idx]
    return None


# ---------------------------------------------------------------------------
# LLM review (optional)
# ---------------------------------------------------------------------------

def _llm_review(pairs: list[dict]) -> str:
    import os
    import anthropic  # type: ignore

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return "_LLM review skipped: ANTHROPIC_API_KEY not set._\n"

    client = anthropic.Anthropic(api_key=api_key)
    pairs_text = json.dumps(pairs, indent=2)
    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": (
                    "You are reviewing drift between a Figma design system and its code "
                    "implementation.  Below is a JSON list of matched and unmatched pairs.  "
                    "For each item write a single concise sentence describing the drift risk "
                    "(or confirming alignment).  Output plain Markdown, one bullet per item.\n\n"
                    f"```json\n{pairs_text}\n```"
                ),
            }
        ],
    )
    return message.content[0].text


# ---------------------------------------------------------------------------
# Core comparison
# ---------------------------------------------------------------------------

def compare(figma: dict, code: dict, use_embeddings: bool) -> dict:
    """
    Returns a result dict:
      matched   — list of {figma, code, layer}
      missing   — figma items not found in code
      extra     — code items not in figma
      token_matched / token_missing / token_extra — same for tokens
    """
    figma_components = [c["name"] for c in figma.get("components", [])]
    code_components = code.get("components", [])
    code_assets = code.get("assets", [])

    matched, asset_matched, missing = [], [], []
    used_code: set[str] = set()
    used_asset: set[str] = set()

    for fc in figma_components:
        if use_embeddings:
            hit = _try_embeddings_match(fc, code_components)
            if hit:
                matched.append({"figma": fc, "code": hit, "layer": "embeddings"})
                used_code.add(hit)
            else:
                missing.append(fc)
            continue

        # Solid matches first (exact/map) against components, then assets —
        # so icons resolve to their SVG asset before any fuzzy component noise.
        comp_hit, comp_layer = resolve(fc, code_components)
        if comp_hit and comp_layer in ("exact", "map"):
            matched.append({"figma": fc, "code": comp_hit, "layer": comp_layer})
            used_code.add(comp_hit)
            continue

        asset_hit, asset_layer = resolve(fc, code_assets)
        if asset_hit and asset_layer in ("exact", "map"):
            asset_matched.append({"figma": fc, "code": asset_hit, "layer": asset_layer})
            used_asset.add(asset_hit)
            continue

        # Fall back to fuzzy: component first, then asset.
        if comp_hit:
            matched.append({"figma": fc, "code": comp_hit, "layer": comp_layer})
            used_code.add(comp_hit)
        elif asset_hit:
            asset_matched.append({"figma": fc, "code": asset_hit, "layer": asset_layer})
            used_asset.add(asset_hit)
        else:
            missing.append(fc)

    extra = [c for c in code_components if c not in used_code]

    # Tokens
    figma_tokens = [
        f"{v['collection']}/{v['name']}" for v in figma.get("variables", [])
    ]
    code_tokens = code.get("tokens", [])

    tok_matched, tok_missing = [], []
    used_tok: set[str] = set()

    for ft in figma_tokens:
        hit, layer = resolve(ft, code_tokens)
        if hit:
            tok_matched.append({"figma": ft, "code": hit, "layer": layer})
            used_tok.add(hit)
        else:
            tok_missing.append(ft)

    tok_extra = [t for t in code_tokens if t not in used_tok]

    return {
        "matched": matched,
        "asset_matched": asset_matched,
        "missing": missing,
        "extra": extra,
        "token_matched": tok_matched,
        "token_missing": tok_missing,
        "token_extra": tok_extra,
    }


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

def render_report(result: dict, llm_commentary: str = "") -> str:
    lines = ["# Design → Code Drift Report", ""]

    def _table(rows: list[dict], cols: list[str]) -> list[str]:
        out = ["| " + " | ".join(cols) + " |", "| " + " | ".join("---" for _ in cols) + " |"]
        for row in rows:
            out.append("| " + " | ".join(str(row.get(c, "")) for c in cols) + " |")
        return out

    # Components
    lines += ["## Components", ""]
    if result["matched"]:
        lines += ["### Matched", ""]
        lines += _table(result["matched"], ["figma", "code", "layer"])
        lines.append("")
    if result["missing"]:
        lines += ["### Missing from code", ""]
        for name in result["missing"]:
            lines.append(f"- `{name}`")
        lines.append("")
    if result["extra"]:
        lines += ["### Extra in code (not in Figma)", ""]
        for name in result["extra"]:
            lines.append(f"- `{name}`")
        lines.append("")

    # Icons / assets (icons live as SVGs, not component templates)
    if result.get("asset_matched"):
        lines += ["## Icons / assets", "", "### Matched", ""]
        lines += _table(result["asset_matched"], ["figma", "code", "layer"])
        lines.append("")

    # Tokens
    lines += ["## Tokens", ""]
    if result["token_matched"]:
        lines += ["### Matched", ""]
        lines += _table(result["token_matched"], ["figma", "code", "layer"])
        lines.append("")
    if result["token_missing"]:
        lines += ["### Missing from code", ""]
        for name in result["token_missing"]:
            lines.append(f"- `{name}`")
        lines.append("")
    if result["token_extra"]:
        lines += ["### Extra in code (not in Figma)", ""]
        for name in result["token_extra"]:
            lines.append(f"- `{name}`")
        lines.append("")

    # Summary
    n_missing = len(result["missing"]) + len(result["token_missing"])
    n_extra = len(result["extra"]) + len(result["token_extra"])
    lines += [
        "## Summary",
        "",
        f"- Components matched: {len(result['matched'])}  |  "
        f"missing: {len(result['missing'])}  |  "
        f"extra: {len(result['extra'])}",
        f"- Icons/assets matched: {len(result.get('asset_matched', []))}",
        f"- Tokens matched: {len(result['token_matched'])}  |  "
        f"missing: {len(result['token_missing'])}  |  "
        f"extra: {len(result['token_extra'])}",
        "",
    ]

    if llm_commentary:
        lines += ["## LLM Commentary", "", llm_commentary, ""]

    if n_missing + n_extra == 0:
        lines.append("**No drift detected.** ✓")
    else:
        lines.append(f"**Drift detected** — {n_missing} missing, {n_extra} extra.")

    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Compare Figma scan to code scan.")
    parser.add_argument("--figma", default="output/figma-scan-main.json")
    parser.add_argument("--code", default="output/code-scan.md")
    parser.add_argument(
        "--embeddings",
        action="store_true",
        help="Use sentence-transformers for semantic matching.",
    )
    parser.add_argument(
        "--llm-review",
        action="store_true",
        help="Request Claude commentary on the drift pairs.",
    )
    args = parser.parse_args()

    figma = load_figma_scan(args.figma)
    code = load_code_scan(args.code)
    result = compare(figma, code, use_embeddings=args.embeddings)

    llm_text = ""
    if args.llm_review:
        all_pairs = result["matched"] + [{"figma": n, "code": None, "layer": "missing"} for n in result["missing"]]
        llm_text = _llm_review(all_pairs)

    report = render_report(result, llm_text)
    print(report)

    n_drift = len(result["missing"]) + len(result["extra"]) + len(result["token_missing"]) + len(result["token_extra"])
    sys.exit(1 if n_drift else 0)


if __name__ == "__main__":
    main()
