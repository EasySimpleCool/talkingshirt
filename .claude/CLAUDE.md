# TalkingShirt Design System

## Token Architecture

A strict three-tier chain: **Input → Modify → Output**. Every token flows through all three tiers, never skipping.

- **Input** — primitives only: raw colours and numbers.
- **Modify** — the multidimensional middle layer holding all switchable sets (e.g. screen/display mode). Dark mode is planned to live here alongside them.
- **Output** — semantic tokens that reference Input and Modify via `var()` chains.

**Rules:**
- Components consume **Output tokens only**.
- Never reach into Input directly.
- Never hardcode raw values.

## Layout System

`section`, `container`, `box`, and `stack` are **layout primitives** governing arrangement only.

- Content components (e.g. `IconText`) **compose** these primitives but carry meaning — they never reimplement layout.
- Within the components group, layout primitives live in a dedicated **layout subgroup**, separate from content components.

## Exception: Custom Canvas Interaction

The t-shirt mockup, the scroll-to-shirt interaction, and the type-on-shirt behaviour are a **bespoke custom canvas interaction**. They rely on absolute positioning and hit-detection that the layout system was never designed to handle.

This is a **deliberate, documented exception — not a violation.** Do not refactor it to follow the layout system.