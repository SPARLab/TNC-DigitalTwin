# Development Task Tracker — V2 Digital Catalog

**Last Updated:** February 9, 2026  
**Current Phase:** Phase 0 (Foundation) — 🟡 In Progress  
**Target Deadline:** February 20, 2026 (13 days remaining)

---

## Quick Status

| Phase | Status | Progress | Branch | Blocking? |
|-------|--------|----------|--------|-----------|
| **0. Foundation** | 🟡 In Progress | ~85% | `v2/foundation` | YES — blocks all |
| 1. iNaturalist | ⚪ Not Started | 0% | `v2/inaturalist` | No |
| 2. ANiML | ⚪ Not Started | 0% | `v2/animl` | No |
| 3. Dendra | ⚪ Not Started | 0% | `v2/dendra` | No |
| 4. DataOne | ⚪ Not Started | 0% | `v2/dataone` | No |
| 5. Export Builder | ⚪ Not Started | 0% | `v2/export` | No |
| 6. Polish & Consistency | ⚪ Not Started | 0% | `v2/polish` | No |

**Status Legend:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## Quick Tasks Summary — Phase 0

**All Active Phase 0 Development Tasks (ordered by priority):**

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 1 | **0.4** Map Container — ArcGIS WebMap integration | 🟡 | High | Blocks Phase 0 completion |
| 2 | **0.5** Drag-and-Drop Reorder — Pinned layers | 🟡 | Medium | Drag handles visible but non-functional |
| 3 | **Enable Map Layers Drag Reordering** | ✅ | Medium | Related to Task 0.5, may consolidate |
| 4 | **Make Filter Icons Clickable for Child Views** | 🟢 | Medium | Child row click expands filter clauses; Edit Filters opens Browse tab |
| 5 | **Prevent Map Layers Widget Scrollbar from Pushing Content** | 🟡 | Medium | Scrollbar overlays or reserves space; content width stays stable |
| 6 | **Fix Tree Connector Lines Between Parent and Child Rows** | 🔴 | Medium | Visual gaps in nested layer hierarchy; needs fresh context |
| 7 | **Remove Gray Divider in Left Sidebar** | 🟡 | Low | Simple CSS removal |
| 8 | **0.6** Map Feature Highlight — Bookmark hover | 🟡 | Low | Requires map integration first |

**Total Phase 0 Tasks Remaining:** 8  
**Recently Completed:** Fix Map Layers Widget Horizontal Scrollbar ✅, Fix Nested Layer Expand/Collapse ✅, Add Rounded Bottom Corners to Collapsed Widgets ✅

---

## Phase 0: Foundation — Current Status

### ✅ Completed (Feb 6, 2026)

- [x] **0.1** App Shell & Router — v1/v2 toggle via `?v2` URL param
- [x] **0.2** Left Sidebar — 14 categories, layer rows, search, pin/eye interactions
- [x] **0.3** Pinned Layers State Management — `LayerContext` with undo support
- [x] **0.4** Bookmarks State Management — `BookmarkContext` with grouping
- [x] **0.5** Map Layers Widget — Active (amber) + Pinned (blue) sections, expandable panels
- [x] **0.6** Bookmarked Items Widget — Grouped rows, 3 bookmark variants
- [x] **0.7** Right Sidebar Shell — Empty state, TabBar (Overview | Browse), header

**Files Created:** 27 files, 1,748 lines total  
**Architecture:** Clean component separation, all files <200 lines for Cursor context windows

### 🟡 Remaining (Phase 0)

- [ ] **0.4** Map Container — Replace placeholder with ArcGIS WebMap integration
  - Reference: `docs/IMPLEMENTATION/phases/phase-0-foundation.md` Task 0.4
  - Current: Placeholder div with "ArcGIS Map" text
  - Needed: Real ArcGIS JS API 4.28 WebMap, GraphicsLayers per data source, z-order control

- [ ] **0.5** Drag-and-Drop Reorder — Implement drag handles for pinned layers
  - Reference: `docs/PLANNING/component-specs/map-layers-widget.md` DFT-034
  - Current: Drag handles render but don't function
  - Needed: `@dnd-kit/core` integration, visual feedback (60% opacity, 2deg rotation), keyboard support

- [ ] **0.6** Map Feature Highlight — Hover bookmark row → highlight on map
  - Reference: `docs/PLANNING/component-specs/bookmarked-items-widget.md` DFT-036
  - Current: Placeholder (no map integration yet)
  - Needed: Cyan ring highlight, off-screen indicator, keyboard support

- [x] **0.8** Refine Tree Connectors — Polish L-shaped connectors for nested child views
  - Reference: `docs/PLANNING/component-specs/map-layers-widget.md` (Connecting Line section)
  - Completed: Fixed gaps in tree connectors by extending lines into `space-y-1` gaps (4px) between child rows
  - Implementation: Used CSS borders for seamless L-shape corners, extended vertical lines with `calc(50% + 4px)` to bridge gaps
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerChildRow.tsx`

### 🔧 Ad-Hoc Tasks (Phase 0)

- [x] **Fix Map Layers Widget Horizontal Scrollbar** — Ensure widget width accommodates all content
  - Completed: User fixed horizontal scrollbar issue by removing `overflow-y-auto` from map-layers-body div
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx`

- [x] **Fix Nested Layer Expand/Collapse** — Make Camera Traps child views collapsible
  - Completed: Added `isExpanded` check to nested child views rendering
  - Added: Smooth bidirectional animations using CSS Grid technique (grid-template-rows: 0fr → 1fr)
  - Implementation: Elements stay in DOM with grid + opacity transitions for smooth expand/collapse in both directions
  - Timing: 300ms ease-in-out for all expand/collapse, 200ms for chevron rotation and hover states
  - Fixed: React type imports (MouseEvent → ReactMouseEvent, KeyboardEvent → ReactKeyboardEvent)
  - Files: `PinnedLayerRow.tsx`, `MapLayersWidget.tsx`, `ActiveLayerSection.tsx`, `PinnedLayerChildRow.tsx`, `FilterIndicator.tsx`, `LayerRow.tsx`, `LucideIcon.tsx`
  - Behavior: Click Camera Traps row or widget collapse button to see smooth height/opacity animations

- [x] **Add Rounded Bottom Corners to Collapsed Widgets** — Polish widget header appearance when collapsed
  - Completed: Header now conditionally applies `rounded-xl` (all corners) when collapsed, `rounded-t-xl + border-b` when expanded
  - Files: `src/v2/components/FloatingWidgets/shared/WidgetHeader.tsx`
  - Applies to: Both Map Layers and Bookmarked Items widgets

- [ ] **Enable Map Layers Drag Reordering** — Make pinned layers draggable to change order
  - Current: Drag handles visible but non-functional
  - Needed: Implement drag-and-drop functionality for reordering pinned layers
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerRow.tsx`, `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayersSection.tsx`
  - Related: Task 0.5 (may consolidate)

- [x] **Make Filter Icons Clickable for Child Views** — Show filter queries when clicking filter indicator
  - Completed: Child row click expands to show filter clauses (split on comma). Filter icon or "Edit Filters" navigates to right sidebar Browse tab. One child expanded at a time. LayerContext: toggleChildVisibility, clearFilters, requestEditFilters. Flat rows also use multi-clause display.
  - Files: `PinnedLayerChildRow.tsx`, `PinnedLayerRow.tsx`, `PinnedLayersSection.tsx`, `MapLayersWidget.tsx`, `LayerContext.tsx`, `RightSidebar.tsx`, `types/index.ts`

- [ ] **Prevent Map Layers Widget Scrollbar from Pushing Content** — Scrollbar should not reduce content width
  - Current: Expanding child filter panels triggers vertical scroll. Scrollbar renders inside the widget width, pushing content (e.g., "Edit Filters" button) inward.
  - Needed: Ensure scrollbar either overlays content (does not take layout space) or reserves stable gutter space so content width stays consistent whether scrollbar is visible or not. Options: `scrollbar-gutter: stable`, overlay scrollbar styling, or explicit padding reserved for scrollbar.
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx`, `map-layers-body` / scroll container structure
  - Related: Fix Map Layers Widget Horizontal Scrollbar (previous fix addressed horizontal; this addresses vertical)

- [ ] **Fix Tree Connector Lines Between Parent and Child Rows** — Ensure continuous visual connection in nested layer hierarchy
  - **Issue:** Tree connector lines (L-shaped) from parent "Camera Traps (ANiML)" to child rows ("mountain lion", "deer") have visual gaps and inconsistent appearance. Lines should be continuous gray-300 regardless of child state (active/selected/pinned).
  - **What's Been Tried:**
    1. **First attempt:** Added vertical line inside children container with `height: calc(50% + 4px)` — FAILED: Used 50% of entire container height, creating massive overlapping line that doubled up with existing connectors.
    2. **Second attempt:** Added tree stub below parent row (`left: 12px`, `top: 100%`, `height: 8px`) wrapped in relative div — FAILED: Still shows gaps and inconsistent connection.
  - **Current State:** Tree connectors exist in `PinnedLayerChildRow.tsx` (L-shape with `left: -12px`, `top: -4px`, `height: calc(50% + 4px)`). Parent row has stub at `left: 12px`. Gap between parent bottom and first child's connector start is not properly bridged.
  - **Files:** `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerRow.tsx`, `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerChildRow.tsx`
  - **Note:** Recommend fresh chat context (Opus 4.6) to approach this with clean analysis. Consider: positioning context (overflow-hidden clipping), alignment of stub vs child connectors, consistent gray-300 color regardless of child state, proper height calculations for gap bridging.
  - **Reference:** Task 0.8 previously fixed gaps between siblings, but parent-to-first-child connection remains broken.

- [ ] **Remove Gray Divider in Left Sidebar** — Remove separator between normal layers and DataOne datasets
  - Current: Gray horizontal divider (`border-t border-gray-200`) separates DataOne shortcut from regular layers
  - Needed: Remove divider while keeping italics styling for DataOne row
  - Files: `src/v2/components/LeftSidebar/CategoryGroup.tsx` (line ~70)
  - Note: Italics styling is acceptable, only the divider needs removal

### 📋 Phase 0 Acceptance Criteria

- [x] Clean component architecture with TypeScript
- [x] All 7 Phase 0 tasks complete with dummy data
- [x] Core interactions working (pin/unpin, eye toggle, tab switching)
- [x] Visual polish matching design system (Tailwind, no custom CSS)
- [x] Zero linter errors
- [ ] Real ArcGIS map integration (blocked by Task 0.4)
- [ ] Drag-and-drop reorder (nice-to-have for Phase 0, can defer)

---

## Next Steps

### Immediate (Complete Phase 0)

1. **ArcGIS Map Integration** (Task 0.4)
   - Install `@arcgis/core` (already in package.json)
   - Create `MapContainer` with WebMap
   - Wire up GraphicsLayers for pinned layers
   - Sync z-order with widget drag-reorder

2. **Test Core Interactions**
   - Verify pin/unpin syncs between sidebar ↔ widget
   - Verify eye toggle syncs bidirectionally
   - Verify undo stack works (max 5 actions)
   - Verify search filters correctly

### After Phase 0 (Phase 1-4)

- **Phase 1:** iNaturalist data source (5 tasks)
- **Phase 2:** ANiML data source (7 tasks)
- **Phase 3:** Dendra data source (6 tasks)
- **Phase 4:** DataOne data source (5 tasks)

See `docs/master-plan.md` for full phase breakdown.

---

## Key Files Reference

- **Master Plan:** `docs/master-plan.md` — Overall project structure, cross-phase decisions
- **Phase 0 Spec:** `docs/IMPLEMENTATION/phases/phase-0-foundation.md` — Detailed task breakdown
- **Component Specs:**
  - `docs/PLANNING/component-specs/left-sidebar.md`
  - `docs/PLANNING/component-specs/map-layers-widget.md`
  - `docs/PLANNING/component-specs/bookmarked-items-widget.md`
  - `docs/PLANNING/component-specs/right-sidebar-template.md`
- **Design System:** `docs/DESIGN-SYSTEM/design-system.md` — Styling tokens, patterns
- **Planning Decisions:** `docs/planning-task-tracker.md` — DFT-001 through DFT-045 resolutions

---

## Development Notes

- **Code Location:** All v2 code in `src/v2/`
- **Access:** V2 app at `http://localhost:5173/?v2`
- **State Management:** React Context API (`LayerContext`, `BookmarkContext`)
- **Styling:** Tailwind CSS only (no custom CSS files)
- **Icons:** Lucide React (no emojis per DFT-026)
- **File Size Target:** Keep files <200 lines for Cursor context efficiency

---

## Blocking Issues

| Issue | Blocking | Status | Owner | Notes |
|-------|----------|--------|-------|-------|
| ArcGIS map integration | Phase 0 completion | 🟡 In Progress | - | Need to replace placeholder with real WebMap |

---

## Change Log

| Date | Phase | Change | By |
|------|-------|--------|-----|
| Feb 9, 2026 | Phase 0 | Added task: Fix Tree Connector Lines Between Parent and Child Rows — visual gaps in nested layer hierarchy, multiple attempts failed (see task notes for details). Recommend fresh chat context. | Claude |
| Feb 9, 2026 | Phase 0 | Added task: Prevent Map Layers Widget Scrollbar from Pushing Content — vertical scrollbar compresses content when child filter panels expand; fix so scrollbar overlays or reserves stable space. | Claude |
| Feb 9, 2026 | Phase 0 | ✅ Task 4 complete: Make Filter Icons Clickable for Child Views. Child row click expands filter clauses (split on comma). Edit Filters / filter icon opens Browse tab. One child expanded at a time. Added toggleChildVisibility, clearFilters, requestEditFilters to LayerContext. | Claude |
| Feb 9, 2026 | Phase 0 | ✅ Task 0.8 complete: Fixed tree connector gaps by extending lines into spacing gaps. Used CSS borders for seamless L-shape corners. | Claude |
| Feb 7, 2026 | Phase 0 | WIP: Multi-view nested structure, tree connectors (L-shaped), pin-to-top behavior, smooth animations. New components: PinnedLayerChildRow, NewViewButton. Card styling restored. Commit: 4fd430e | Claude |
| Feb 6, 2026 | Phase 0 | Built core shell: left sidebar, map layers widget, bookmarked items widget, right sidebar shell, state management. 27 files, 1,748 lines. Zero TypeScript/linter errors. | Opus |
| Feb 6, 2026 | Phase 0 | Added v1/v2 toggle via `?v2` URL param. "Try v2.0" button in legacy header. | Opus |
