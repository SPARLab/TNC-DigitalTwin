# DFT-041 Resolution Summary: Right Sidebar Export Tab

**Date Resolved:** February 6, 2026  
**Decision Maker:** Will + Claude (via UI/UX design principles analysis)  
**Related DFTs:** DFT-002 (Export Builder in modal), DFT-006 (Overview tab default)

---

## The Problem

The right sidebar template specified three tabs: Overview, Browse, Export. But DFT-002 (resolved Jan 29) established that the Export Builder lives in a global modal opened from a shopping cart button in the header. This created uncertainty: what should the per-layer Export tab show?

Four options were considered:
1. Read-only per-layer summary (pin status, filter count, bookmarks)
2. Remove the Export tab entirely (reduce to 2 tabs)
3. Per-layer export configuration (duplicates modal functionality)
4. "Add to Export" action tab

---

## The Decision

**Remove the Export tab entirely. Promote export status to the Overview tab.**

### What Changed

**TabBar:** Reduced from 3 tabs to 2 tabs (Overview | Browse)

**Overview tab:** Gained an export status section at the bottom with two states:

**When layer is pinned:**
```
Export Status
┌─────────────────────────────────────┐
│ ✓ Pinned · 3 filters · 2 bookmarks  │
│   Open Export Builder [cart-icon]   │
└─────────────────────────────────────┘
```

**When layer is NOT pinned:**
```
Export
  Pin this layer to include in your
  export package.
  [Pin Now]
```

### Component Changes

- `TabBar` component: Drop from 3 tabs to 2
- `OverviewTab` component: Add export status section at bottom
- `OverviewTabProps` interface: Add `isPinned`, `activeFilterCount`, `bookmarkCount`, `onPinClick`, `onOpenExportBuilder` props
- Removed States 7 & 8 from template (Export tab states)

---

## Design Rationale

Analyzed through 12 UI/UX design principles with strong cross-framework convergence:

### Core Insight

The Export tab was a **dead-end signpost** — users would click the tab, read content directing them to use the shopping cart button in the header, then have to click elsewhere. This pattern violates Nielsen #8 (Minimalism) and Fitts's Law (extra click for no functional gain).

### Principle Analysis

| Principle | How Solution Addresses It |
|---|---|
| **Nielsen #8: Minimalism** | Removes a tab whose content is either empty or a redirect |
| **Hick's Law** | 2 tabs < 3 tabs — faster tab selection per session |
| **Norman: Conceptual Model** | Export is global (modal), not per-layer. Tab removal reinforces correct mental model |
| **IA: Redundancy** | Eliminates 4th surface showing pin/bookmark status (left sidebar, widget, shopping cart badge, export tab) |
| **Nielsen #6: Discoverability** | Export status section in Overview tab + shopping cart badge maintain awareness |
| **Fitts's Law** | Eliminates dead-end click (tab → read → redirect). "Pin Now" and "Open Export Builder" are direct actions |
| **Norman: Feedback** | Shopping cart badge updates in real time (better than tab requiring navigation) |
| **Nielsen #4: Consistency** | Export Builder modal becomes single export configuration surface (no competing UIs) |
| **Norman: Affordances** | "Pin Now" button provides actionable shortcut from Overview |
| **IA: Wayfinding** | "Open Export Builder" link provides direct path to canonical export surface |
| **Gestalt: Proximity** | Export status near layer metadata = related context grouped |
| **Serial Position Effect** | Browse CTA (most important) stays first; export status (secondary) at bottom |

### Why Not Keep the Export Tab?

**Information redundancy:** Everything the Export tab proposed to show already exists elsewhere:
- Pin status → left sidebar pin icon + Map Layers widget
- Active filter count → Browse tab's FilterSection + Map Layers widget funnel indicator
- Bookmarked items → Bookmarked Items floating widget
- Export actions → Export Builder modal (the canonical surface)

The Export tab would be the *fourth* place showing pin/bookmark information.

**Conceptual model mismatch:** The export paradigm is fundamentally **global** — the shopping cart aggregates across all pinned layers and bookmarks. A per-layer Export tab implies per-layer export action, which contradicts the global modal paradigm.

**Shopping cart badge is better:** The badge in the global header is *always visible* (unlike the Export tab, which requires clicking to a specific layer's sidebar). And the shopping cart icon follows a universal e-commerce convention that users already understand.

---

## Tradeoffs

**What we sacrifice:**
- Export tab as visible word in tab bar (reduces surface area for export awareness)
- A dedicated screen for per-layer export preview
- Visual symmetry of three equally-weighted tabs

**Why acceptable:**
- Shopping cart badge in header is always visible (better than a tab you navigate to)
- Per-layer export preview lives in Export Builder modal (Phase 5, Task 5.2) where it's actionable
- Two-tab layouts are common in GIS apps (ArcGIS Online uses Overview + Data, not three tabs)
- Overview tab's export status section is more useful because it's visible on default landing screen (DFT-006)

---

## Files Updated

1. **`docs/planning-task-tracker.md`**
   - Updated DFT-041 status to 🟢 Resolved
   - Added full resolution with design decision, rationale, principle table, tradeoffs

2. **`docs/PLANNING/component-specs/right-sidebar-template.md`**
   - Updated TabBar anatomy from 3 tabs to 2 tabs
   - Removed Export tab states (States 7 & 8)
   - Added export status section to OverviewTab component
   - Updated `OverviewTabProps` interface with export status props
   - Updated Design Decision Summary
   - Updated Interactions table
   - Updated Open Questions (removed Export tab question)
   - Updated all ASCII diagrams (replaced 3-tab headers with 2-tab headers)

3. **`docs/PLANNING/component-specs/right-sidebar-inaturalist.md`**
   - Updated TabBar references from 3 tabs to 2 tabs
   - Removed Export tab from ASCII diagrams

4. **`docs/master-plan.md`**
   - Added to Cross-Phase Decisions → UX Decisions table

5. **`docs/PLANNING/resolved-decisions/dft-041-resolution-summary.md`**
   - Created this resolution summary

---

## Verification Checklist

- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (12 principles analyzed)
- [x] ASCII diagrams provided for new export status section
- [x] Component interface updates specified (`OverviewTabProps`)
- [x] Tradeoffs analyzed
- [x] Component specs updated (right-sidebar-template.md, right-sidebar-inaturalist.md)
- [x] Cross-references added to master plan
- [x] Resolution summary created

---

## Impact on Implementation

### Phase 0 (Foundation)
- No impact — sidebar shell implementation unaffected

### Phases 1-4 (Data Sources)
- Each data source's OverviewTab implementation must include export status section
- Export status section receives props: `isPinned`, `activeFilterCount`, `bookmarkCount`
- Export status section conditionally renders pinned vs unpinned state

### Phase 5 (Export Builder)
- No impact — Export Builder modal unchanged (still opened from shopping cart in header)

### Phase 6 (Polish)
- No impact

---

## Related Decisions

- **DFT-002 (Jan 29, 2026):** Export Builder lives in modal opened from global header shopping cart button
- **DFT-006 (Feb 2, 2026):** Overview tab opens first when layer selected
- **DFT-027 (Feb 4, 2026):** "Browse Items -->" CTA button on Overview tab

---

## Open Questions (None)

All questions resolved. Implementation ready.
