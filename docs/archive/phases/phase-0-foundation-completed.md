# Phase 0: Foundation — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 0 tasks. Add new completions here with timestamp.

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 0.1–0.7 | ✅ | Feb 6, 2026 | App shell, router, sidebars, Map Layers widget, state management | Core shell |
| 0.4 | ✅ | Feb 12, 2026 | Map Container — ArcGIS WebMap integration | Real ArcGIS map + GraphicsLayer |
| 0.5 | ✅ | Feb 10, 2026 | Drag-and-Drop Reorder — Pinned layers | Within Map Layers widget |
| 0.8 | ✅ | Feb 9, 2026 | Refine Tree Connectors | L-shaped connectors, gaps fixed |
| Task 1 | ✅ | Feb 12, 2026 | Map Container — ArcGIS WebMap integration | Same as 0.4 |
| Task 2, 3 | ✅ | Feb 10, 2026 | Enable Map Layers Drag Reordering | Consolidated with 0.5 |
| Task 4 | ✅ | Feb 9, 2026 | Unify Map Layers Expansion Affordances | Filter icon primary; accordion |
| Task 5 | ✅ | Feb 9, 2026 | Prevent Map Layers Widget Scrollbar from Pushing Content | |
| Task 6 | ✅ | Feb 9, 2026 | Fix Tree Connector Lines Between Parent and Child Rows | |
| Task 7 | ✅ | Feb 10, 2026 | Remove Gray Divider in Left Sidebar | |
| Task 8 | ✅ | Feb 10, 2026 | Refine Active Layer → Pinned Layer Transition | |
| Task 10 | ✅ | Feb 10, 2026 | Left Sidebar: Visual Distinction Between Categories and Layers | |
| Task 11 | ✅ | Feb 10, 2026 | Right Sidebar: Active Layer Color Coordination & Flash | |
| Task 12 | ✅ | Feb 10, 2026 | Fix DataOne Datasets Card Width in Left Sidebar | |
| Task 14 | ✅ | Feb 10, 2026 | Fix Map Layers Widget Drag Animation | @dnd-kit animateLayoutChanges |
| Task 23 | ✅ | Feb 12, 2026 | Data Source Adapter Pattern Refactor | Plugin architecture |
| DFT-046 | ✅ | Feb 11, 2026 | Saved Items widget dropped, unified into Map Layers | |

---

## Task Details

### 0.1–0.7: Core Shell

**Goal:** Set up v2 app shell, routing, left/right sidebars, Map Layers widget, and state management so v2 can be developed alongside legacy.

**What was built:** `src/v2/` folder structure, V2App.tsx, v1/v2 toggle via `?v2` URL param. Left sidebar with 14 categories, layer rows, search, pin/eye interactions. Right sidebar shell with empty state, TabBar (Overview | Browse). Map Layers widget with Active (amber) + Pinned (blue) sections. LayerContext with undo support. 27 files, ~1,748 lines.

### 0.4 / Task 1: Map Container — ArcGIS WebMap Integration

**Goal:** Replace placeholder map with real ArcGIS WebMap. Layers added when pinned OR active. GraphicsLayer for highlights.

**Implementation:** ArcGIS JS API 4.28 WebMap, GraphicsLayers per data source, z-order control. Data source adapter pattern — layers added when pinned or active.

### 0.5 / Task 2, 3: Drag-and-Drop Reorder

**Goal:** Make pinned layers draggable to change order in Map Layers widget.

**Implementation:** `@dnd-kit/core` integration with visual feedback. Drag handles on pinned layer rows. Map z-order syncs with widget order.

### 0.8: Refine Tree Connectors

**Goal:** Fix gaps in L-shaped connectors between parent and child rows in nested layer hierarchy.

**Implementation:** Moved connectors to outer wrapper so they span full height including expanded filter panels. CSS borders for seamless L-shape corners. Standardized `1px solid #d1d5db`.

### Task 4: Unify Map Layers Expansion Affordances

**Goal:** Single primary expansion control; child accordion pattern; auto-expand on sidebar activation.

**Implementation:** Filter icon is primary expansion control (replaced chevrons). Parent shows visible child's filter count. Child rows use accordion (one expanded at a time). Auto-activate + auto-expand visible child when pinned layer clicked from sidebar.

### Task 5: Prevent Map Layers Widget Scrollbar from Pushing Content

**Goal:** Scrollbar should not reduce content width when child filter panels expand.

**Implementation:** Scrollbar overlays or reserves space; content width stays stable within Map Layers widget.

### Task 6: Fix Tree Connector Lines Between Parent and Child Rows

**Goal:** Continuous visual connection in nested layer hierarchy.

**Implementation:** Connectors span full height including expanded filter panels. Vertical continuation with `bottom: -4px` for dynamic height. Parent stub 12px for solid overlap.

### Task 7: Remove Gray Divider in Left Sidebar

**Goal:** Remove separator between normal layers and DataOne datasets.

**Implementation:** Removed `border-t border-gray-200`. Preserved italics for DataOne row.

### Task 8: Refine Active Layer → Pinned Layer Transition

**Goal:** Smooth transition when pinning; no flash; newly pinned row slides down from under header.

**Implementation:** Newly pinned row slides down from under Pinned Layers header; section expands. 400ms ease-out; reduced-motion respected. Snapshot state pattern for exit animation.

### Task 10: Left Sidebar — Visual Distinction Between Categories and Layers

**Goal:** Clearly differentiate categories from child layers. Category banners, layer cards with distinct highlight treatments.

**Implementation:** Category banners (slate-100), Research Datasets at bottom with darker gray (gray-200). Layer cards with amber active state, blue pins.

### Task 11: Right Sidebar — Active Layer Color Coordination & Flash

**Goal:** Unify active semantics. Yellow header; flash when active layer changes so eyes register "right sidebar changed."

**Implementation:** Yellow header (amber-50). Flash animation on layer change: white→amber-100→amber-50, 600ms. Coordinated with left sidebar and Map Layers widget.

### Task 12: Fix DataOne Datasets Card Width

**Goal:** Match DataOne shortcut row width with regular layer cards.

**Implementation:** `w-full` on DataOne shortcut and LayerRow; `mr-3` for right padding; removed redundant left border.

### Task 14: Fix Map Layers Widget Drag Animation

**Goal:** Restore smooth drag animations. Non-dragged items were performing jarring transforms.

**Implementation:** Disabled `@dnd-kit/sortable` auto layout animations via `animateLayoutChanges: () => false` in PinnedLayerRow. Only dragged item transforms; others stay stable.

### Task 23: Data Source Adapter Pattern Refactor

**Goal:** Extract data-source logic into plugin architecture to enable parallel branch development.

**Implementation:** `DataSourceAdapter` interface. Registry pattern. Each source implements adapter, context, map behavior. Core files (MapContainer, RightSidebar, useMapLayers) data-source-agnostic. Lazy caching via `warmCache()`. Merge conflict surface: ~4 one-liners per new source in registry.ts. Files: `src/v2/dataSources/{types.ts, registry.ts, inaturalist/}`.

### DFT-046: Saved Items Widget Dropped

**Goal:** Unify bookmark/saved-items into Map Layers. Remove separate Bookmarked Items widget.

**Implementation:** Saved Items widget disabled (code preserved). "Mapped Item Layers" renamed to "Map Layers". Bookmark actions in iNaturalist stubbed as "Save as View". All documentation updated.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-0-foundation.md`
- **Master plan:** `docs/master-plan.md`
