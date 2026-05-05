"""
normalize.py — shared name-matching utilities for the design-audit pipeline.

Three-layer resolution (applied in order, first match wins):
  Layer 1 — normalise: lowercase, strip punctuation, collapse whitespace.
  Layer 2 — name-map lookup: consult name-map.yaml aliases.
  Layer 3 — fuzzy match: rapidfuzz WRatio against the known code name list.
"""

import re
import yaml
from pathlib import Path
from rapidfuzz import process, fuzz

_NAME_MAP_PATH = Path(__file__).parent.parent / "name-map.yaml"

# ---------------------------------------------------------------------------
# Layer 1 — text normalisation
# ---------------------------------------------------------------------------

def normalise(name: str) -> str:
    """Lowercase, strip punctuation/slashes, collapse whitespace."""
    name = name.lower()
    name = re.sub(r"[/\\\-_]", " ", name)
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


# ---------------------------------------------------------------------------
# Layer 2 — name-map lookup
# ---------------------------------------------------------------------------

def _load_aliases() -> dict[str, str]:
    if not _NAME_MAP_PATH.exists():
        return {}
    with _NAME_MAP_PATH.open() as f:
        data = yaml.safe_load(f) or {}
    raw = data.get("aliases", {})
    # Index by normalised key for case-insensitive lookup
    return {normalise(k): v for k, v in raw.items()}


_ALIASES: dict[str, str] | None = None


def _aliases() -> dict[str, str]:
    global _ALIASES
    if _ALIASES is None:
        _ALIASES = _load_aliases()
    return _ALIASES


def map_lookup(name: str) -> str | None:
    """Return the canonical code name from name-map.yaml, or None."""
    return _aliases().get(normalise(name))


# ---------------------------------------------------------------------------
# Layer 3 — fuzzy match
# ---------------------------------------------------------------------------

def fuzzy_match(name: str, candidates: list[str], threshold: int = 80) -> str | None:
    """
    Return the best fuzzy match from `candidates`, or None if the best score
    is below `threshold` (0–100).
    """
    if not candidates:
        return None
    result = process.extractOne(
        normalise(name),
        [normalise(c) for c in candidates],
        scorer=fuzz.WRatio,
    )
    if result is None or result[1] < threshold:
        return None
    # Map back to the original (un-normalised) candidate
    return candidates[result[2]]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def resolve(name: str, candidates: list[str], threshold: int = 80) -> tuple[str | None, str]:
    """
    Resolve a Figma name to a code name using the three-layer pipeline.

    Returns (resolved_name, layer) where layer is one of:
      "exact"   — Layer 1 direct match (normalised equality)
      "map"     — Layer 2 name-map hit
      "fuzzy"   — Layer 3 fuzzy hit
      "none"    — no match found
    """
    norm = normalise(name)

    # Layer 1 — exact normalised match
    for c in candidates:
        if normalise(c) == norm:
            return c, "exact"

    # Layer 2 — name-map
    mapped = map_lookup(name)
    if mapped is not None:
        return mapped, "map"

    # Layer 3 — fuzzy
    fuzzy = fuzzy_match(name, candidates, threshold)
    if fuzzy is not None:
        return fuzzy, "fuzzy"

    return None, "none"
