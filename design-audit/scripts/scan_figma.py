"""
scan_figma.py — pull component and variable data from a Figma file.

Usage:
  python scan_figma.py --target main    > output/figma-scan-main.json
  python scan_figma.py --target bench   > output/figma-scan-bench.json

Reads FIGMA_TOKEN, FIGMA_FILE_KEY, FIGMA_NODE_MAIN, FIGMA_NODE_BENCH from
.env (or the environment).  Outputs a JSON object with two top-level keys:
  "components"  — list of {name, node_id, description}
  "variables"   — list of {collection, name, type, value}
"""

import argparse
import json
import os
import sys
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

def _load_env() -> None:
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())


_load_env()

FIGMA_TOKEN = os.environ.get("FIGMA_TOKEN", "")
FILE_KEY = os.environ.get("FIGMA_FILE_KEY", "")
NODE_MAIN = os.environ.get("FIGMA_NODE_MAIN", "")
NODE_BENCH = os.environ.get("FIGMA_NODE_BENCH", "")

FIGMA_API = "https://api.figma.com/v1"


def _headers() -> dict:
    if not FIGMA_TOKEN:
        sys.exit("Error: FIGMA_TOKEN not set. Copy .env.example → .env and fill it in.")
    return {"X-Figma-Token": FIGMA_TOKEN}


# ---------------------------------------------------------------------------
# Figma API helpers
# ---------------------------------------------------------------------------

def get_file(file_key: str) -> dict:
    url = f"{FIGMA_API}/files/{file_key}"
    r = requests.get(url, headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.json()


def get_variables(file_key: str) -> dict:
    """Requires a Figma Enterprise or paid team plan for the variables endpoint."""
    url = f"{FIGMA_API}/files/{file_key}/variables/local"
    r = requests.get(url, headers=_headers(), timeout=30)
    if r.status_code == 403:
        print(
            "Warning: variables endpoint returned 403. "
            "Variables require a paid Figma plan. Skipping.",
            file=sys.stderr,
        )
        return {}
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------------------
# Extraction helpers
# ---------------------------------------------------------------------------

def _walk_components(node: dict, results: list) -> None:
    """Recursively collect COMPONENT and COMPONENT_SET nodes."""
    kind = node.get("type", "")
    if kind in ("COMPONENT", "COMPONENT_SET"):
        results.append({
            "name": node.get("name", ""),
            "node_id": node.get("id", ""),
            "description": node.get("description", ""),
        })
    for child in node.get("children", []):
        _walk_components(child, results)


def extract_components(file_data: dict, root_node_id: str | None = None) -> list[dict]:
    document = file_data.get("document", {})
    if root_node_id:
        # Find the requested node and scope the walk to it
        target = _find_node(document, root_node_id)
        if target is None:
            print(
                f"Warning: node {root_node_id!r} not found in file; scanning whole document.",
                file=sys.stderr,
            )
            target = document
    else:
        target = document

    results: list[dict] = []
    _walk_components(target, results)
    return results


def _find_node(node: dict, node_id: str) -> dict | None:
    if node.get("id") == node_id:
        return node
    for child in node.get("children", []):
        found = _find_node(child, node_id)
        if found:
            return found
    return None


def extract_variables(variables_data: dict) -> list[dict]:
    results: list[dict] = []
    meta = variables_data.get("meta", {})
    collections = meta.get("variableCollections", {})
    variables = meta.get("variables", {})

    # Build collection id → name lookup
    coll_names = {cid: c.get("name", cid) for cid, c in collections.items()}

    for var in variables.values():
        coll_id = var.get("variableCollectionId", "")
        # Pull the default mode value (first mode in the collection)
        coll = collections.get(coll_id, {})
        modes = coll.get("modes", [])
        default_mode_id = modes[0]["modeId"] if modes else None
        value_by_mode = var.get("valuesByMode", {})
        value = value_by_mode.get(default_mode_id, "") if default_mode_id else ""

        results.append({
            "collection": coll_names.get(coll_id, coll_id),
            "name": var.get("name", ""),
            "type": var.get("resolvedType", ""),
            "value": value,
        })
    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Scan Figma file for components and variables.")
    parser.add_argument(
        "--target",
        choices=["main", "bench"],
        default="main",
        help="Which artboard node to scan (default: main).",
    )
    parser.add_argument(
        "--no-variables",
        action="store_true",
        help="Skip variable extraction (useful if your plan doesn't support it).",
    )
    args = parser.parse_args()

    if not FILE_KEY:
        sys.exit("Error: FIGMA_FILE_KEY not set.")

    node_id = NODE_MAIN if args.target == "main" else NODE_BENCH
    if not node_id:
        env_var = "FIGMA_NODE_MAIN" if args.target == "main" else "FIGMA_NODE_BENCH"
        sys.exit(f"Error: {env_var} not set.")

    print(f"Fetching file {FILE_KEY} …", file=sys.stderr)
    file_data = get_file(FILE_KEY)

    components = extract_components(file_data, node_id)
    print(f"Found {len(components)} component(s).", file=sys.stderr)

    variables: list[dict] = []
    if not args.no_variables:
        print("Fetching variables …", file=sys.stderr)
        var_data = get_variables(FILE_KEY)
        if var_data:
            variables = extract_variables(var_data)
            print(f"Found {len(variables)} variable(s).", file=sys.stderr)

    output = {
        "target": args.target,
        "file_key": FILE_KEY,
        "node_id": node_id,
        "components": components,
        "variables": variables,
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
