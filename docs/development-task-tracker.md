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
| 6 | **Fix Tree Connector Lines Between Parent and Child Rows** | ✅ | Medium | Completed: moved connectors to outer wrapper, consistent #d1d5db |
| 7 | **Remove Gray Divider in Left Sidebar** | 🟡 | Low | Simple CSS removal |
| 8 | **0.6** Map Feature Highlight — Bookmark hover | 🟡 | Low | Requires map integration first |

**Total Phase 0 Tasks Remaining:** 7  
**Recently Completed:** Multi-View Management (Create/Remove Views) ✅, Filter Panel Layout Reorganization ✅, Fix Tree Connector Lines ✅

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
  - Updated (Feb 9): Filter icon now expands row (no stopPropagation); "Edit Filters" button in expanded panel opens Browse tab.
  - Files: `PinnedLayerChildRow.tsx`, `PinnedLayerRow.tsx`, `PinnedLayersSection.tsx`, `MapLayersWidget.tsx`, `LayerContext.tsx`, `RightSidebar.tsx`, `types/index.ts`

- [x] **Multi-View Management for Pinned Layers** — Create and remove filtered views
  - Completed: Added "+ New View" button in flat expanded filter panel to convert flat→nested structure. Creates two views: current filters become "View 1" (or uses distinguisher name), new empty "View 2". Added "X" button to remove individual child views. Smart conversion: removing views to leave only 1 converts back to flat, preserving last view's state as distinguisher.
  - Implementation: `createNewView(pinnedId)` and `removeView(pinnedId, viewId)` in LayerContext. Wired through MapLayersWidget → PinnedLayersSection → PinnedLayerRow → PinnedLayerChildRow.
  - Files: `LayerContext.tsx`, `MapLayersWidget.tsx`, `PinnedLayersSection.tsx`, `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`

- [x] **Reorganize Filter Panel Layout** — Optimize spacing and button placement
  - Completed: Reorganized both flat and child filter panels for clarity. Top section: filter summary (left) + "Clear" button (top right). Bottom section: flat has "+ New View" (left) + "Edit Filters >" (right); child has "Edit Filters >" (right only). Removed unnecessary whitespace while maintaining readability.
  - Files: `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`

- [ ] **Prevent Map Layers Widget Scrollbar from Pushing Content** — Scrollbar should not reduce content width
  - Current: Expanding child filter panels triggers vertical scroll. Scrollbar renders inside the widget width, pushing content (e.g., "Edit Filters" button) inward.
  - Needed: Ensure scrollbar either overlays content (does not take layout space) or reserves stable gutter space so content width stays consistent whether scrollbar is visible or not. Options: `scrollbar-gutter: stable`, overlay scrollbar styling, or explicit padding reserved for scrollbar.
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx`, `map-layers-body` / scroll container structure
  - Related: Fix Map Layers Widget Horizontal Scrollbar (previous fix addressed horizontal; this addresses vertical)

- [x] **Fix Tree Connector Lines Between Parent and Child Rows** — Ensure continuous visual connection in nested layer hierarchy
  - Completed: Moved connector elements from inside `.nested-child` to outer wrapper so they span full height including expanded filter panels. Vertical continuation uses `bottom: -4px` for dynamic height. All connectors standardized to `1px solid #d1d5db`. Parent stub height increased from 8px to 12px for solid overlap.
  - Files: `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`

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
| Feb 9, 2026 | Phase 0 | ✅ Task 6 complete: Fix Tree Connector Lines Between Parent and Child Rows. Moved connectors to outer wrapper for full-height coverage including expanded filter panels; standardized 1px solid #d1d5db; parent stub 12px. | Claude |
| Feb 9, 2026 | Phase 0 | Added task: Prevent Map Layers Widget Scrollbar from Pushing Content — vertical scrollbar compresses content when child filter panels expand; fix so scrollbar overlays or reserves stable space. | Claude |
| Feb 9, 2026 | Phase 0 | ✅ Task 4 complete: Make Filter Icons Clickable for Child Views. Child row click expands filter clauses (split on comma). Edit Filters / filter icon opens Browse tab. One child expanded at a time. Added toggleChildVisibility, clearFilters, requestEditFilters to LayerContext. | Claude |
| Feb 9, 2026 | Phase 0 | ✅ Task 0.8 complete: Fixed tree connector gaps by extending lines into spacing gaps. Used CSS borders for seamless L-shape corners. | Claude |
| Feb 7, 2026 | Phase 0 | WIP: Multi-view nested structure, tree connectors (L-shaped), pin-to-top behavior, smooth animations. New components: PinnedLayerChildRow, NewViewButton. Card styling restored. Commit: 4fd430e | Claude |
| Feb 6, 2026 | Phase 0 | Built core shell: left sidebar, map layers widget, bookmarked items widget, right sidebar shell, state management. 27 files, 1,748 lines. Zero TypeScript/linter errors. | Opus |
| Feb 6, 2026 | Phase 0 | Added v1/v2 toggle via `?v2` URL param. "Try v2.0" button in legacy header. | Opus |

---

## Recent Work Summary (Feb 9, 2026 PM)

### Multi-View Management for Pinned Layers
- **Feature**: Create and remove filtered views for pinned layers
- **"+ New View" Button**: Converts flat (single view) → nested (multi-view) structure. Creates 2 views: current filters become View 1 (uses distinguisher name like "Mar 2024" if available), new empty View 2.
- **"X" Remove Button**: Removes individual child views. Smart conversion: when only 1 view remains, converts back to flat structure preserving last view's state.
- **Implementation**: Added `createNewView(pinnedId)` and `removeView(pinnedId, viewId)` to LayerContext. Wired through: MapLayersWidget → PinnedLayersSection → PinnedLayerRow → PinnedLayerChildRow.
- **Files**: LayerContext.tsx, MapLayersWidget.tsx, PinnedLayersSection.tsx, PinnedLayerRow.tsx, PinnedLayerChildRow.tsx

### Filter Panel Layout Reorganization
- **Layout Changes**:
  - Top: Filter summary (left) + "Clear" button (top right)
  - Bottom: "+ New View" (left, flat only) + "Edit Filters >" (right)
  - Child panels: Just "Edit Filters >" (right-aligned)
- **Optimization**: Removed unnecessary whitespace for more compact presentation
- **Files**: PinnedLayerRow.tsx, PinnedLayerChildRow.tsx

### Filter Icon Behavior Update
- **Change**: Clicking filter icon on child views now expands/collapses row (instead of triggering Edit Filters)
- **Rationale**: More intuitive - icon shows filter count, clicking shows filters; "Edit Filters" button in expanded panel opens Browse tab
- **Files**: PinnedLayerChildRow.tsx

