from __future__ import annotations

"""
scan_code.py — write output/code-scan.md from public/ templates and CSS.

Usage:
  python scan_code.py
"""

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
COMPONENTS_HTML = REPO / "public" / "js" / "components"
COMPONENTS_CSS = REPO / "public" / "css" / "components"
ASSETS_IMAGES = REPO / "public" / "assets" / "images"
OUTPUT = Path(__file__).resolve().parent.parent / "output" / "code-scan.md"

TOKEN_RE = re.compile(r"var\((--(?:theme|comp|text)-[\w-]+)\)")


def scan_components() -> list[str]:
    return sorted(p.stem for p in COMPONENTS_HTML.glob("*.html"))


def scan_tokens() -> list[str]:
    tokens: set[str] = set()
    for css in COMPONENTS_CSS.glob("*.css"):
        tokens.update(TOKEN_RE.findall(css.read_text()))
    return sorted(tokens)


def scan_assets() -> list[str]:
    """Icon/image assets — icons live here, not as component templates."""
    return sorted(p.stem for p in ASSETS_IMAGES.glob("*.svg"))


def render(components: list[str], tokens: list[str], assets: list[str]) -> str:
    lines = [
        "# Code scan",
        "",
        "Auto-generated from `public/js/components/*.html`, "
        "`public/css/components/*.css`, and `public/assets/images/*.svg`.",
        "",
        "## Components",
        "",
    ]
    lines.extend(f"- **{name}**" for name in components)
    lines += ["", "## Assets", ""]
    lines.extend(f"- `{name}`" for name in assets)
    lines += ["", "## Tokens", ""]
    lines.extend(f"- `{name}`" for name in tokens)
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    components = scan_components()
    tokens = scan_tokens()
    assets = scan_assets()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(components, tokens, assets))
    print(
        f"Wrote {len(components)} component(s), {len(assets)} asset(s), "
        f"{len(tokens)} token(s) → {OUTPUT}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
