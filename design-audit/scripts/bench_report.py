from __future__ import annotations

"""
bench_report.py — staging report for the bench Figma file.

The bench is a separate Figma file holding ready-to-build components. Once a
component is built and promoted, it lives in main. This report answers two
questions for each bench component:

  1. Is it ready to build? (in bench, not yet in main)
     → build it into the codebase + Storybook.
  2. Has it graduated? (in bench AND main)
     → it can be removed from bench.

Code presence is shown as a secondary signal so a "ready to build" item that is
already in code is flagged as ready to promote to main.

Usage:
  python bench_report.py \
    --bench output/figma-scan-bench.json \
    --main  output/figma-scan-main.json \
    --code  output/code-scan.md

Exit codes:
  0 — nothing actionable
  1 — actionable items found (ready to build, or removable from bench)
  2 — error (missing inputs)
"""

import argparse
import json
import sys
from pathlib import Path

from normalize import resolve


def load_figma(path: str, label: str) -> list[str]:
    p = Path(path)
    if not p.exists():
        sys.exit(f"Error: {label} scan not found at {path!r}. Run scan_figma.py first.")
    data = json.loads(p.read_text())
    return [c["name"] for c in data.get("components", [])]


def load_code(path: str) -> list[str]:
    from compare import _parse_code_scan_assets, _parse_code_scan_components

    p = Path(path)
    if not p.exists():
        sys.exit(f"Error: code scan not found at {path!r}. Run scan_code.py first.")
    text = p.read_text()
    # Components and icon assets both count as "built in code" for the bench.
    return _parse_code_scan_components(text) + _parse_code_scan_assets(text)


def in_list(name: str, candidates: list[str]) -> bool:
    hit, _ = resolve(name, candidates)
    return hit is not None


def build_report(bench: list[str], main: list[str], code: list[str]) -> tuple[str, int]:
    ready_to_build: list[str] = []   # in bench, not in main, not in code
    ready_to_promote: list[str] = [] # in bench, not in main, already in code
    removable: list[str] = []        # in bench and main

    for name in bench:
        if in_list(name, main):
            removable.append(name)
        elif in_list(name, code):
            ready_to_promote.append(name)
        else:
            ready_to_build.append(name)

    lines = ["# Bench Audit", ""]
    lines += [
        "Bench is the staging file of ready-to-build components. "
        "Build them into code, then promote to main and remove from bench.",
        "",
    ]

    lines += ["## Ready to build", ""]
    if ready_to_build:
        lines.append("Staged in bench, not in code or main. Build into codebase + Storybook.")
        lines.append("")
        lines += [f"- `{n}`" for n in ready_to_build]
    else:
        lines.append("_Nothing waiting to be built._")
    lines.append("")

    lines += ["## Ready to promote to main", ""]
    if ready_to_promote:
        lines.append("Built in code but still only in bench. Move bench → main, then remove from bench.")
        lines.append("")
        lines += [f"- `{n}`" for n in ready_to_promote]
    else:
        lines.append("_Nothing waiting to be promoted._")
    lines.append("")

    lines += ["## Remove from bench", ""]
    if removable:
        lines.append("Already present in main. Bench copy is redundant and can be deleted.")
        lines.append("")
        lines += [f"- `{n}`" for n in removable]
    else:
        lines.append("_Bench is clean — no graduated components left behind._")
    lines.append("")

    lines += [
        "## Summary",
        "",
        f"- Ready to build: {len(ready_to_build)}",
        f"- Ready to promote to main: {len(ready_to_promote)}",
        f"- Remove from bench: {len(removable)}",
        "",
    ]

    actionable = len(ready_to_build) + len(ready_to_promote) + len(removable)
    if actionable == 0:
        lines.append("**Bench is empty of action items.**")
    else:
        lines.append(f"**{actionable} action item(s).**")

    return "\n".join(lines) + "\n", actionable


def main() -> None:
    parser = argparse.ArgumentParser(description="Bench staging report (bench vs main vs code).")
    parser.add_argument("--bench", default="output/figma-scan-bench.json")
    parser.add_argument("--main", default="output/figma-scan-main.json")
    parser.add_argument("--code", default="output/code-scan.md")
    args = parser.parse_args()

    bench = load_figma(args.bench, "bench")
    main = load_figma(args.main, "main")
    code = load_code(args.code)

    report, actionable = build_report(bench, main, code)
    print(report)
    sys.exit(1 if actionable else 0)


if __name__ == "__main__":
    main()
