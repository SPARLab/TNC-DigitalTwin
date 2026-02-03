# DFT-007 Resolution Summary: Bookmarked Features Widget Structure

**Date:** February 2, 2026  
**Status:** ✅ Resolved  
**Decision:** Group bookmarks by parent layer with non-interactive layer headers

---

## The Problem

Sophia's feedback identified a conceptual clarity issue: the Bookmarked Features widget title didn't clarify that bookmarks are features *within* layers, not separate independent items.

The core tension:
- **Pinned Layers** widget (top-left) and **Bookmarked Features** widget (top-right) appear as visual *siblings* (same widget type, same hierarchy level)
- But conceptually, they have a **parent-child** relationship (layers contain features)
- Without communicating this relationship, users might form an incorrect mental model where bookmarks are a separate "collection" rather than references to specific features plucked from layers

---

## Design Principles at Risk

### Norman's Conceptual Model
GIS users understand layers → features as a containment hierarchy (layer = table, feature = row). If the two widgets appear as independent peers, users form an incorrect model.

### Gestalt: Proximity & Common Region
Two separate floating widgets at different screen positions suggests they are *independent concepts* at the same hierarchy level. Spatial separation works against communicating containment.

### Nielsen #6: Recognition Rather Than Recall
Without showing the source layer, users must recall which layer a bookmark came from. With multiple layers, this becomes burdensome.

### Norman's Signifiers
Without visual signifiers showing that bookmarks "belong to" layers, users may not understand the data model.

---

## The Solution: Grouped Structure with Non-Interactive Headers

### Widget Structure

```
┌──────────────────────────────────────────────────┐
│ 🔖 BOOKMARKED FEATURES                           │
├──────────────────────────────────────────────────┤
│ ┄┄ Camera Traps ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │  ← Non-interactive layer label
│    CAM-042 (mt. lion)                 [👁] ✕    │  ← Interactive feature row
│    CAM-118                            [👁] ✕    │
│ ┄┄ Dendra Sensors ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│    Sensor ABC-123 (Mar 2024)          [👁] ✕    │
└──────────────────────────────────────────────────┘
```

### Layer Header (Non-Interactive Context Label)

**Visual Treatment:**
- **Muted color:** Gray text (~60% opacity)
- **No hover state:** Cursor stays default, no background change on hover
- **No buttons/icons:** No visibility toggle, no remove button, no chevron
- **Different typography:** Smaller size, uppercase, or lighter weight than feature rows
- **Full-width span:** Acts as section divider, not a clickable card row
- **Optional styling:** Subtle dotted line or different background tint

**Purpose:** These are **signifiers** (Norman) that communicate "this is context, not a control." The styling tells users "this isn't for clicking."

### Feature Rows (Fully Interactive)

**Visual Treatment:**
- Standard hover states and clickable styling
- Normal text color and weight
- Visibility toggle [👁] and remove button [✕]
- Background change on hover

**Purpose:** Clear contrast with layer headers signals what's actionable vs. contextual.

---

## Key Behaviors

### Bookmark Creation
- When user bookmarks a feature, its parent layer auto-inserts as a group header (if not already present)
- Layer header is inserted above the first bookmark from that layer
- Bookmarks automatically group under their source layer

### Layer Header Insertion
- Layer headers only appear when bookmarks from that layer exist
- If all bookmarks from a layer are removed, the layer header disappears
- Multiple features from the same layer share a single layer header

### Ungrouped Bookmarks (Edge Case)
- If user bookmarks features from a layer they later unpin, bookmarked features remain with layer header as context
- Bookmarks are independent of pin state (unpinning a layer doesn't orphan its bookmarks)

---

## Design Rationale

### UX Principles Applied

| Principle | How It's Addressed |
|-----------|-------------------|
| **Norman's Conceptual Model** | Layer appears as parent → user sees hierarchy matching GIS mental model (layers contain features) |
| **Gestalt Proximity** | Features positioned near layer label → perceived as related/grouped |
| **Recognition over Recall** | Layer name visible inline → no memory burden to recall which layer a bookmark came from |
| **Norman's Signifiers** | Non-interactive styling signals "this is context, not a control" |
| **Visual Hierarchy** | Layer = muted group header, Features = prominent actionable rows |
| **Information Scent** | Layer context visible → users can predict relationships without exploring |
| **Gestalt Similarity** | Different visual treatment → users perceive layer headers and feature rows as distinct types |

### Widget Positioning (Macro-Level Proximity)

**Bookmarked Features widget:** Top-right (near right sidebar)  
**Pinned Layers widget:** Top-left (near left sidebar / layer catalog)

This positioning reinforces the conceptual distinction:
- **Pinned Layers** ↔ **Left Sidebar** (layer-level exploration and selection)
- **Bookmarked Features** ↔ **Right Sidebar** (feature-level exploration and bookmarking)

Even with similar card styling, the position + content structure prevents the "sibling" misinterpretation.

---

## Why Title-Only Solutions Failed

### Options Considered (Rejected)

| Option | Why It Doesn't Work |
|--------|-------------------|
| "Bookmarked Features (from Layers)" | Verbose; parenthetical feels like afterthought |
| "Saved Layer Features" | Awkward phrasing; doesn't clarify containment |
| "Bookmarks" + subtitle | Takes vertical space; subtitle often ignored |

**Core issue:** Titles are meant to be concise, but the concept "features that live inside layers" is inherently two-part. Overloading the title trades clarity for brevity without solving the conceptual model problem.

**Better approach:** Use **structure** (how bookmarks are displayed) to communicate the relationship, not just **labeling** (what the widget is called).

---

## Implementation Notes

### Component Files

- `src/v2/components/FloatingWidgets/BookmarkedFeaturesWidget.tsx` — Main widget component
- `src/v2/components/FloatingWidgets/BookmarkCard.tsx` — Interactive feature row
- `src/v2/components/FloatingWidgets/BookmarkLayerHeader.tsx` — Non-interactive group header

### State Management

Bookmarks store reference to parent layer:
```typescript
interface Bookmark {
  id: string;
  layerId: string;          // Parent layer reference
  layerName: string;        // For display in group header
  featureId: string;
  featureLabel: string;
  filterContext?: object;   // Feature-level filter (if any)
}
```

Widget groups bookmarks by `layerId` and renders layer headers dynamically.

---

## Related Decisions

- **DFT-001:** Pinned Layers widget design (parent concept)
- **DFT-002:** Export button placement (shopping cart in header, not in widget)
- **DFT-005:** Auto-collapse widgets when viewing time-series data
- **DFT-010:** Terminology change (items → features)

---

## Verification Checklist

- [x] Decision documented in `planning-task-tracker.md` (DFT-007 section)
- [x] Phase 0 task 0.6 updated with grouped widget structure and non-interactive layer header design
- [x] Master plan updated with cross-phase UX decision
- [x] Resolution summary created in `PLANNING/resolved-decisions/dft-007-resolution-summary.md`
- [x] Quick Reference table in tracker updated with resolved status

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 2, 2026 | Created resolution summary | Will + Claude |
