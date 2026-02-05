# HTML Mockup Generator

## Purpose

Generate and update self-contained HTML mockups for the v2.0 TNC Digital Catalog. Each mockup is a single `.html` file using Tailwind CSS CDN, rendering a complete UI state that the team can open in a browser and review.

## When to Use

- When generating new mockups (DFT-037)
- When updating existing mockups to reflect design changes
- When creating state variations (empty, loading, error)

## Before Generating Any Mockup

1. **Read the canonical docs** (in this order — stop if context window is filling up):
   - `docs/DESIGN-SYSTEM/design-system.md` — all styling decisions, patterns, theme tokens, Sidebar Template System
   - `docs/master-plan.md` — cross-phase decisions (UX Decisions table), phase dependencies
   - The **phase doc** for the data source you're mocking up (see Mockup File List below)
   - `docs/DESIGN-SYSTEM/mockup-components.md` — HTML/Tailwind snippets for every shared component

2. **Do NOT re-read** `docs/planning-task-tracker.md` for design decisions. All resolved DFT decisions should already be reflected in `design-system.md` and the phase docs. The tracker is for historical rationale only.

3. **Do NOT invent styling.** If a pattern isn't specified in `design-system.md` or `mockup-components.md`, flag it and ask. Don't guess colors, spacing, or behavior.

## Mockup File List

| File | Content | Phase Doc to Read |
|------|---------|-------------------|
| `mockups/02a-unified-layout.html` | **Master template** — defines ALL shared structure | `phase-0-foundation.md` |
| `mockups/02b-browse-inaturalist.html` | iNaturalist browse view | `phase-1-inaturalist.md` |
| `mockups/02c-browse-animl.html` | ANiML browse view (with landing cards exception) | `phase-2-animl.md` |
| `mockups/02d-browse-dendra.html` | Dendra browse view (with chart exception) | `phase-3-dendra.md` |
| `mockups/02e-browse-dataone.html` | DataOne browse view (search-first) | `phase-4-dataone.md` |
| `mockups/02f-export-builder.html` | Export Builder modal | `phase-5-export-builder.md` |

All phase docs are in `docs/IMPLEMENTATION/phases/`.

## Template Inheritance Rules

1. **02a is the master template.** It defines ALL shared structure: header, left sidebar, map area, right sidebar shell (TabBar, OverviewTab, FilterSection, ResultCard, Pagination), and floating widgets. Use iNaturalist as the default data source in 02a.

2. **02b–02e inherit from 02a.** They use the exact same layout, styling, and shared components. They ONLY change:
   - Which metadata fields appear in OverviewTab
   - Which filter controls appear in FilterSection (see per-data-source inventory in `design-system.md`)
   - Which slots are filled in ResultCard
   - Documented exceptions (see below)

3. **Any styling change to a shared component in one mockup MUST be applied to all mockups.** If you change TabBar styling, card padding, or accent colors — change it in every file. No per-data-source styling.

4. **Theme tokens** from `sidebarTheme` in `design-system.md` define the initial styling. These are translated to the Tailwind config block in the `<head>`. Change tokens once, apply to all mockups.

## Documented Exceptions

These are the ONLY places where a data-source mockup diverges structurally from the template:

| Exception | Mockup | Source |
|-----------|--------|--------|
| ANiML landing cards (Animal-First / Camera-First entry) | 02c | DFT-003c |
| ANiML/Dendra `FeatureDetailCard` at Level 3 | 02c, 02d | DFT-040 |
| Dendra pop-up time-series chart with slider | 02d | DFT-004 |

HTML patterns for these exceptions are in `mockup-components.md` under "Documented Exceptions."

## Page Layout Grid

```
┌────────────────────────────────────────────────────────────┐
│ Header (h-12, full-width, cart button top-right per DFT-002)│
├──────────┬─────────────────────────────┬───────────────────┤
│ Left     │                             │ Right             │
│ Sidebar  │     Map (ArcGIS WebMap)     │ Sidebar           │
│ (260px)  │     + Floating Widgets      │ (400px, DFT-033)  │
│          │                             │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

- Left sidebar: fixed 260px, scrollable, collapsible category tree
- Map: fills remaining space, ArcGIS JS API 4.28 WebMap
- Right sidebar: fixed 400px (not resizable, per DFT-033), scrollable
- Floating widgets: positioned over map area
  - Top-left: Pinned Layers widget
  - Top-right (offset from right sidebar): Bookmarked Features widget
- Minimum viewport: 1280px (per DFT-016)

## States to Demonstrate

Each mockup should show the **happy path default state** (data loaded, filters available, results visible). Optionally include commented-out HTML or toggle buttons for:

- **Empty states** — per `design-system.md` Empty State Patterns (DFT-015)
- **Loading states** — per `design-system.md` Loading State Patterns (DFT-018)
- **Error states** — per `design-system.md` Error State Patterns (DFT-030)

## Quality Checklist

Before considering a mockup complete, verify:

- [ ] Shared components match `mockup-components.md` patterns exactly
- [ ] Tailwind config block uses `sidebarTheme` token values from `design-system.md`
- [ ] Right sidebar is exactly 400px wide
- [ ] Left sidebar categories are organized per the layer categorization in phase docs
- [ ] Filter controls match the per-data-source inventory in `design-system.md` Filter Section Patterns
- [ ] OverviewTab metadata fields match the per-data-source content in `design-system.md` Sidebar Template System
- [ ] No emojis in UI elements — use inline SVG icons (Lucide-style) as placeholders
- [ ] All interactive elements have descriptive `id` attributes
- [ ] TabBar uses underline style with emerald-600 active indicator
- [ ] ResultCards use the shared card pattern (same structure everywhere)
- [ ] Pagination uses Previous/Next pattern (20 items per page)
- [ ] Floating widgets include undo buttons (always visible, grayed when inactive per DFT-031)
