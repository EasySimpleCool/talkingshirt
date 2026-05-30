from __future__ import annotations

"""
run_audit.py — scan code + Figma, write drift report.

Usage:
  python run_audit.py [--target main|bench] [--embeddings] [--llm-review]
"""

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
OUTPUT = SCRIPTS.parent / "output"


def run(cmd: list[str], *, stdout=None) -> None:
    print("→", " ".join(cmd), file=sys.stderr)
    result = subprocess.run(cmd, stdout=stdout)
    if result.returncode != 0:
        sys.exit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the full design → code audit.")
    parser.add_argument(
        "--target",
        choices=["main", "bench"],
        default="main",
        help="Figma artboard target (default: main).",
    )
    parser.add_argument(
        "--embeddings",
        action="store_true",
        help="Use sentence-transformers in compare.py.",
    )
    parser.add_argument(
        "--llm-review",
        action="store_true",
        help="Request Claude commentary (needs ANTHROPIC_API_KEY).",
    )
    parser.add_argument(
        "--no-figma",
        action="store_true",
        help="Skip Figma API; compare against existing figma-scan JSON.",
    )
    args = parser.parse_args()

    py = sys.executable
    OUTPUT.mkdir(parents=True, exist_ok=True)
    code_scan = OUTPUT / "code-scan.md"

    run([py, str(SCRIPTS / "scan_code.py")])

    def scan_figma(target: str) -> Path:
        out = OUTPUT / f"figma-scan-{target}.json"
        if args.no_figma:
            if not out.exists():
                sys.exit(f"Error: {out} not found. Run without --no-figma first.")
            return out
        with out.open("w", encoding="utf-8") as handle:
            run([py, str(SCRIPTS / "scan_figma.py"), "--target", target], stdout=handle)
        return out

    if args.target == "bench":
        # Bench is staging: compare bench → main → code.
        bench_json = scan_figma("bench")
        main_json = scan_figma("main")
        report = OUTPUT / "bench-report.md"
        cmd = [
            py,
            str(SCRIPTS / "bench_report.py"),
            "--bench",
            str(bench_json),
            "--main",
            str(main_json),
            "--code",
            str(code_scan),
        ]
    else:
        # Main is shipped: drift between Figma (source of truth) and code.
        figma_json = scan_figma("main")
        report = OUTPUT / "drift-report.md"
        cmd = [
            py,
            str(SCRIPTS / "compare.py"),
            "--figma",
            str(figma_json),
            "--code",
            str(code_scan),
        ]
        if args.embeddings:
            cmd.append("--embeddings")
        if args.llm_review:
            cmd.append("--llm-review")

    result = subprocess.run(cmd, capture_output=True, text=True)
    report.write_text(result.stdout, encoding="utf-8")
    print(result.stdout, end="")
    print(f"Report → {report}", file=sys.stderr)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
