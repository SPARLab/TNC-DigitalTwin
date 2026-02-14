# Development Task Tracker — V2 Digital Catalog

**Last Updated:** February 13, 2026  
**Current Phase:** Phase 0 (Foundation) — 🟡 In Progress  
**Target Deadline:** February 20, 2026 (8 days remaining)

---

## Quick Tasks Summary

**Active development tasks (ordered by priority).** Phase column indicates which phase the task belongs to; tasks may be deferred to a later phase.

| # | Phase | Task | Status | Priority | Notes |
|---|-------|------|--------|----------|-------|
| **28** | **1** | **🐛 iNaturalist: Detail View Crash on Observation Click** | **✅** | **Critical** | **Fixed: hook-order mismatch + ArcGIS goTo hardening; map click auto-opens Browse tab for detail view** |
| 1 | 0 | **0.4** Map Container — ArcGIS WebMap integration | ✅ | High | Completed: real ArcGIS map + GraphicsLayer for highlights |
| 2 | 0 | **0.5** Drag-and-Drop Reorder — Pinned layers | ✅ | Medium | Completed within Map Layers widget |
| 3 | 0 | **Enable Map Layers Drag Reordering** | ✅ | Medium | Related to Task 0.5, may consolidate |
| 4 | 0 | **Unify Map Layers Expansion Affordances** | ✅ | Medium | Filter icon as primary control; child accordion pattern; auto-expand on sidebar activation |
| 5 | 0 | **Prevent Map Layers Widget Scrollbar from Pushing Content** | ✅ | Medium | Scrollbar overlays or reserves space; content width stays stable |
| 6 | 0 | **Fix Tree Connector Lines Between Parent and Child Rows** | ✅ | Medium | Completed: moved connectors to outer wrapper, consistent #d1d5db |
| 7 | 0 | **Remove Gray Divider in Left Sidebar** | ✅ | Low | Simple CSS removal |
| 8 | 0 | **Refine Active Layer → Pinned Layer Transition** | ✅ | Low | Newly pinned row slides down from under header; section expands; no flash |
| 9 | 0 | **0.6** Map Feature Highlight — View-on-map hover | 🟡 | Low | Requires map integration first |
| 10 | 0 | **Left Sidebar: Visual Distinction Between Categories and Layers** | ✅ | Medium | Category banners (slate-100), Research Datasets at bottom with darker gray bg, no bottom border; layer cards with amber active state, blue pins |
| 11 | 0 | **Right Sidebar: Active Layer Color Coordination & Flash** | ✅ | Medium | Yellow header (amber-50); flash animation on layer change (white→amber-100→amber-50, 600ms); coordinated with left sidebar and Map Layers widget |
| 12 | 0 | **Fix DataOne Datasets Card Width in Left Sidebar** | ✅ | Low | DataOne shortcut row width matching; right padding; removed redundant left border |
| 13 | 1 | **Fix iNaturalist Layer Icons & Loading** | ✅ | High | Replaced FeatureLayer with spatially-filtered GraphicsLayer; local filtering; removed dummy data |
| 23 | 0 | **Data Source Adapter Pattern Refactor** | ✅ | Critical | Extract data-source logic into plugin architecture; enable parallel branch development |
| 14 | 1 | **iNaturalist: Observation Card Click → Map Highlight + Detail View** | ✅ | High | Click obs card: highlight map marker, show tooltip, navigate to detail page |
| 15 | 1 | **iNaturalist: Map Marker Click → Zoom + Detail View** | ✅ | High | Click map marker: zoom to observation, open detail view in right sidebar |
| 16 | 1 | **iNaturalist: Remove Bookmark Button/Action** | ✅ | Low | Already stubbed; clean up unused bookmark logic from observation cards |
| 17 | 1 | **iNaturalist: Compact Filter Section (Dropdown)** | ✅ | Medium | Filter Observations in Browse tab: tall list → dropdown; include Select All |
| 18 | 1 | **iNaturalist: Rename Legend Widget Title** | ✅ | Low | Change "Filter Observations" → "iNaturalist Taxa" in floating legend widget |
| 19 | 1 | **iNaturalist: Add Observation Search Bar** | ✅ | Medium | Search observations by common/scientific name in Browse tab |
| 20 | 1 | **iNaturalist: Reduce Pagination to 10 per Page** | ✅ | Low | Change PAGE_SIZE from 20 → 10 in useINaturalistObservations |
| 21 | 1 | **iNaturalist: Add Date Range Filter** | ✅ | Medium | Add start/end date pickers in Browse tab filter section |
| 22 | 1 | **iNaturalist: Remember Last Active Tab** | ✅ | Low | Completed: per-layer tab memory in RightSidebar; restores Overview/Browse on layer reactivation |
| 25 | 1 | **iNaturalist: Sync Filters with Map Layers Widget** | ✅ | Medium | Completed: date + taxon filters sync to Map Layers widget; Edit Filters opens Browse with pre-applied filters; fixed infinite loop + pin-transition sync |
| 26 | 1 | **iNaturalist: Dynamic View Names from Filters** | ✅ | Low | Completed: child view names now auto-generate from active filters (taxa/date) |
| 27 | 1 | **iNaturalist: User-Renamable Filtered Views** | ✅ | Low | Completed: child views can be renamed inline in Map Layers widget; custom names persist |
| 14 | 0 | **Fix Map Layers Widget Drag Animation** | ✅ | Medium | Fixed: disabled @dnd-kit auto layout animations to prevent jarring transforms |
| 24 | 0 | **0.9 Dynamic Layer Registry from Data Catalog Service** | 🟡 | **Critical** | Replace static layerRegistry with dynamic fetch from Data Catalog FeatureServer (~90+ real datasets, 14 categories); "Not Yet Implemented" toast for layers without adapters. **BLOCKS all parallel branches.** |

**Active tasks remaining:** 2  
**🔴 Next (critical):** Task 24 — Dynamic Layer Registry from Data Catalog Service  
**Recently completed:** Task 28 (iNaturalist Detail View Crash) ✅ (Feb 13), Task 27 (User-Renamable Filtered Views) ✅ (Feb 13), Task 26 (Dynamic View Names from Filters) ✅ (Feb 13), Task 25 (Sync Filters with Map Layers Widget) ✅ (Feb 13), Task 22 (Remember Last Active Tab) ✅ (Feb 13), Task 21 (Add Date Range Filter) ✅ (Feb 13), Task 20 (Reduce Pagination to 10 per Page) ✅ (Feb 13), Task 19 (Add Observation Search Bar) ✅ (Feb 13), Task 18 (Rename Legend Widget Title) ✅ (Feb 13), Task 16 (Remove Bookmark Button) ✅ (Feb 13), Task 17 (Compact Filter Section) ✅ (Feb 13), iNaturalist label fix (iNat → iNaturalist) ✅ (Feb 13), Task 14 (Observation Card Click → Map Highlight + Detail View) ✅ (Feb 12), Task 15 (Map Marker Click → Zoom + Detail View) ✅ (Feb 12), Task 24 (Dynamic Layer Registry) 🟡 (Feb 12), **Data Source Adapter Pattern** ✅ (Feb 12), Task 1 (ArcGIS Map Integration) ✅, Task 13 (iNaturalist Layer Icons & Loading) ✅, DFT-046 (Saved Items widget dropped, unified into Map Layers) ✅, "Mapped Item Layers" renamed to "Map Layers" ✅, Task 10 (Left Sidebar Visual Distinction) ✅, Task 11 (Right Sidebar Color & Flash) ✅, Task 12 (DataOne Card Width) ✅, Tree Connectors (Saved Items) ✅, Refine Active Layer → Pinned Layer Transition ✅, Remove Gray Divider ✅, Drag-and-Drop Reorder ✅, Scrollbar Fix ✅, Unify Expansion Affordances ✅, Multi-View Management ✅, Filter Panel Layout ✅, Tree Connectors (Map Layers) ✅

---

## Cross-Branch Merge Checklist (Filtered View Naming)

- [ ] Keep shared Map Layers manual rename behavior in `LayerContext` (or equivalent shared state): custom name persists once user renames.
- [ ] Preserve custom-name guard on sync: auto filter sync must not overwrite names when view is marked custom.
- [ ] Implement per-data-source auto-name builder (iNaturalist/ANiML/Dendra/DataOne) so non-custom names update from each layer's filter model.
- [ ] Verify Edit Filters navigation + filter sync still targets correct child view IDs after merge.
- [ ] Integration QA for each data source: create view, auto-name updates from filters, manual rename sticks, clear custom name returns to auto naming.

---

## Status by Phase

**High-level status across all phases.** Use this to see which phases are in progress, blocked, or not started.

| Phase | Status | Progress | Branch | Blocking? |
|-------|--------|----------|--------|-----------|
| **0. Foundation** | 🟡 In Progress | ~95% | `v2/foundation` | YES — blocks all |
| 1. iNaturalist | ⚪ Not Started | 0% | `v2/inaturalist` | 🔴 Paused — waiting for Task 0.9 |
| 2. ANiML | ⚪ Not Started | 0% | `v2/animl` | 🔴 Paused — waiting for Task 0.9 |
| 3. Dendra | ⚪ Not Started | 0% | `v2/dendra` | 🔴 Paused — waiting for Task 0.9 |
| 4. DataOne | ⚪ Not Started | 0% | `v2/dataone` | 🔴 Paused — waiting for Task 0.9 |
| 5. Export Builder | ⚪ Not Started | 0% | `v2/export` | No |
| 6. Polish & Consistency | ⚪ Not Started | 0% | `v2/polish` | No |

**Legend:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## Phase 0: Foundation — Current Status

### ✅ Completed (Feb 6, 2026)

- [x] **0.1** App Shell & Router — v1/v2 toggle via `?v2` URL param
- [x] **0.2** Left Sidebar — 14 categories, layer rows, search, pin/eye interactions
- [x] **0.3** Pinned Layers State Management — `LayerContext` with undo support
- [x] ~~**0.4** Bookmarks State Management — `BookmarkContext` with grouping~~ **(DROPPED: DFT-046 — Saved Items widget merged into Map Layers, Feb 11)**
- [x] **0.5** Map Layers Widget — Active (amber) + Pinned (blue) sections, expandable panels
- [x] ~~**0.6** Bookmarked Items Widget — Grouped rows, 3 bookmark variants~~ **(DROPPED: DFT-046 — code preserved but disabled, Feb 11)**
- [x] **0.7** Right Sidebar Shell — Empty state, TabBar (Overview | Browse), header

**Files Created:** 27 files, 1,748 lines total  
**Architecture:** Clean component separation, all files <200 lines for Cursor context windows

### 🟡 Remaining (Phase 0)

- [x] **0.4** Map Container — Replace placeholder with ArcGIS WebMap integration
  - Reference: `docs/IMPLEMENTATION/phases/phase-0-foundation.md` Task 0.4
  - ~~Current: Placeholder div with "ArcGIS Map" text~~
  - **Completed (Feb 12):** Real ArcGIS JS API 4.28 WebMap, GraphicsLayers per data source, z-order control
  - **Architecture:** Data source adapter pattern — layers added when pinned OR active

- [x] **Data Source Adapter Pattern Refactor** (Task 23)
  - **Completed (Feb 12):** Extract all data-source-specific logic into plugin system
  - **Files Created:** `src/v2/dataSources/{types.ts, registry.ts, inaturalist/{adapter.tsx, useMapBehavior.ts}}`
  - **Files Modified:** `INaturalistFilterContext.tsx` (lazy cache), `useMapLayers.ts` (generic), `MapContainer.tsx` (generic), `RightSidebar.tsx` (generic), `LayerContext.tsx` (removed iNat from initial pinned)
  - **Lazy Caching:** `warmCache()` idempotent method — fetch on first pin/activation (~2s), instant on revisit
  - **Active Layer Visibility:** Active-but-not-pinned layers now visible on map (DFT-021)
  - **Merge Conflict Surface:** ~4 one-liners per new data source (registry.ts)
  - **Enables:** Safe parallel branch development for Phases 1-4

- [x] **0.5** Drag-and-Drop Reorder — Implement drag handles for pinned layers
  - Reference: `docs/PLANNING/component-specs/map-layers-widget.md` DFT-034
  - Completed: Drag-and-drop reordering implemented within Map Layers widget
  - Implementation: `@dnd-kit/core` integration with visual feedback

- [ ] **0.6** Map Feature Highlight — Hover/view-on-map → highlight on map
  - Reference: DFT-036 (adapted — no longer tied to Saved Items widget)
  - Current: Basic highlight implemented for iNaturalist view-on-map
  - Needed: Cyan ring highlight for all data sources, off-screen indicator, keyboard support

- [ ] **0.9** Dynamic Layer Registry from Data Catalog Service **(CRITICAL — BLOCKS ALL PARALLEL BRANCHES)**
  - **Discovery (Feb 12):** Dan's Data Catalog FeatureServer contains metadata for ~90+ real datasets with hierarchical categories, service URLs, and display titles. This replaces the static `layerRegistry.ts` (27 hardcoded placeholders) with the real catalog.
  - **Service URL:** `https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer`
  - **Service Structure:**
    - Table 0: Categories (id, name, parent_id for hierarchy, display_order)
    - Table 1: Datasets (id, service_name, display_title, server_base_url, service_path, has_feature_server/map_server/image_server, is_visible)
    - Table 2: Dataset Categories (junction table: dataset_id ↔ category_id, supports many-to-many)
  - **Dendra Sensors: 10 per-type feature services discovered:**
    - Dataloggers, Barometers, Wind Monitors, Weather Stations (all-in-one), Water Level Meters, Solinst Leveloggers, RanchBot Water Monitors, RanchBot Rain Gauges, Rain Gages, Pressure Level Sensors
    - Each follows identical 3-part schema: Layer 0 (Locations), Table 1 (Data), Table 2 (Summary)
    - All on `dangermondpreserve-spatial.com/server/rest/services/`
  - **Other notable datasets:** Camera Trap Data, CalFlora Plant Obs, GBIF Species Occurrences, MOTUS Wildlife Telemetry
  - **Implementation:**
    1. Create `useCatalogRegistry` hook — fetches Categories + Datasets + junction from Data Catalog on app load
    2. Replace static `CATEGORIES` / `LAYERS` arrays with fetched data, mapped to `CatalogLayer[]` / `Category[]`
    3. Map `dataSource` field based on service pattern detection (Dendra sensor → `'dendra'`, iNaturalist → `'inaturalist'`, etc.)
    4. Add "Not Yet Implemented" toast when user activates a layer without an adapter
    5. Preserve existing `LAYER_MAP` / `getAdapter()` lookup pattern — adapters still registered statically
  - **Acceptance Criteria:**
    - [ ] Left sidebar shows all ~90+ datasets from Data Catalog, grouped by real categories
    - [ ] Category counts reflect real dataset counts
    - [ ] Categories with subcategories show nested hierarchy
    - [ ] Layers with adapters (iNaturalist) work as before (sidebar, map, legend)
    - [ ] Layers without adapters show informational toast: "This layer is coming soon"
    - [ ] Loading state while catalog fetches
  - **Must merge to main before any parallel branch continues**
  - Files: `src/v2/data/layerRegistry.ts` (refactor), `src/v2/hooks/useCatalogRegistry.ts` (new), `src/v2/components/MapArea/` (toast)

- [x] **0.8** Refine Tree Connectors — Polish L-shaped connectors for nested child views
  - Reference: `docs/PLANNING/component-specs/map-layers-widget.md` (Connecting Line section)
  - Completed: Fixed gaps in tree connectors by extending lines into `space-y-1` gaps (4px) between child rows
  - Implementation: Used CSS borders for seamless L-shape corners, extended vertical lines with `calc(50% + 4px)` to bridge gaps
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerChildRow.tsx`

- [x] ~~**Add Hierarchical Tree Connectors to Saved Items Widget**~~ **(DROPPED: DFT-046 — Saved Items widget disabled, Feb 11)**
  - Was completed but widget is now disabled. CSS animations preserved for future reuse.
  - Files: `BookmarkRow.tsx`, `LayerGroupHeader.tsx`, `BookmarkedItemsWidget.tsx` (preserved, not deleted)

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

- [x] **Enable Map Layers Drag Reordering** — Make pinned layers draggable to change order
  - Completed: Drag-and-drop reordering implemented within Map Layers widget
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerRow.tsx`, `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayersSection.tsx`
  - Consolidated with Task 0.5

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

- [x] **Consolidate Filter Details in Layer Containers** — Move filter details inside expandable layer boxes (Feb 10)
  - Completed: Filter details (species, date, confidence, Clear, Edit Filters) now live inside the same yellow/amber container as the layer row. Added light gray divider between collapsed row and expanded details. Eliminates visual disconnect of separate gray boxes. "+ New View" remains inside expanded parent container.
  - Files: `PinnedLayerChildRow.tsx`, `PinnedLayerRow.tsx`

- [x] **Meaningful Default View Names** — Replace "View 1/2/3" with action-oriented labels (Feb 10)
  - Completed: New empty views named "Add Filters". Initial view uses distinguisher, "Filtered View", or "Default View" as appropriate. Improves recognition over recall (Nielsen).
  - Files: `LayerContext.tsx`

- [x] **Differentiate "Add Filters" Placeholder Views** — Visual signifier for empty views (Feb 10)
  - Completed: "Add Filters" views display dashed border to indicate empty/placeholder state. Removed container opacity for non-visible views; text now consistently `text-gray-800` for readability across all states.
  - Files: `PinnedLayerChildRow.tsx`

- [x] **Smooth CSS Transitions for Map Layers Widget** — Polish Active Layer and Pinned Layer animations (Feb 10)
  - Completed: Added smooth slide-up/fade-out when Active Layer section disappears (pinned). Added slide-down entrance animation for newly pinned layers (no opacity change, pure vertical motion). Both animations 300-400ms ease-out with reduced-motion support.
  - Implementation: Snapshot state pattern in MapLayersWidget preserves Active Layer data during 300ms exit transition. PinnedLayersSection detects new layer additions and triggers 400ms slide-down from -8px above final position.
  - Files: `MapLayersWidget.tsx`, `ActiveLayerSection.tsx`, `PinnedLayersSection.tsx`, `PinnedLayerRow.tsx`, `index.css`
  - Result: Smooth coordinated animations as layers transition from Active → Pinned state

- [x] **Refine Active Layer → Pinned Layer Transition** — Further polish for the transition when pinning
  - Done: Removed flash; newly pinned row now slides down from under the Pinned Layers header while the section expands (wrapper animates max-height 0→280px, row animates translateY(-100%)→0). Single 400ms ease-out; reduced-motion respected.
  - Implementation: `pin-row-expand` + `slide-down-from-above` in `index.css`; `PinnedLayersSection` wraps justPinned row in expanding wrapper; `PinnedLayerRow` uses `animate-slide-down-from-above`.
  - Optional later: Even tighter choreography with Active Layer exit (e.g. shared easing or position handoff).
  - Files: `MapLayersWidget.tsx`, `PinnedLayersSection.tsx`, `PinnedLayerRow.tsx`, `index.css`

- [x] **Prevent Map Layers Widget Scrollbar from Pushing Content** — Scrollbar should not reduce content width
  - Completed: Scrollbar overlays or reserves space; content width stays stable within Map Layers widget
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx`, `map-layers-body` / scroll container structure

- [x] **Fix Tree Connector Lines Between Parent and Child Rows** — Ensure continuous visual connection in nested layer hierarchy
  - Completed: Moved connector elements from inside `.nested-child` to outer wrapper so they span full height including expanded filter panels. Vertical continuation uses `bottom: -4px` for dynamic height. All connectors standardized to `1px solid #d1d5db`. Parent stub height increased from 8px to 12px for solid overlap.
  - Files: `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`

- [x] **Remove Gray Divider in Left Sidebar** — Remove separator between normal layers and DataOne datasets
  - Completed: Removed gray horizontal divider (`border-t border-gray-200`) between DataOne shortcut and regular layers
  - Preserved: Italics styling for DataOne row
  - Files: `src/v2/components/LeftSidebar/CategoryGroup.tsx`

- [x] **Fix Map Layers Widget Drag Animation** — Restore smooth drag-and-drop animations
  - Problem: When dragging a layer down, the layer underneath performed an upward transform, then disappeared. Animations were previously smooth but broke after updates.
  - Root Cause: `@dnd-kit/sortable` by default animates layout changes for all items during drag operations, causing non-dragged items to perform jarring transforms.
  - Solution: Disabled automatic layout animations by passing `animateLayoutChanges: () => false` to the `useSortable` hook in `PinnedLayerRow`.
  - Result: Smooth drag animations restored. Only the dragged item transforms; other items remain stable during drag.
  - Files: `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerRow.tsx`

- [x] **Fix DataOne Datasets Card Width in Left Sidebar** — Match DataOne shortcut row width with regular layer cards
  - Completed: Added `w-full` to DataOne shortcut button and LayerRow for consistent full-width behavior; increased parent right margin (`mr-2` → `mr-3`) for proper edge spacing; removed redundant left vertical border (`border-l-2 border-gray-200`) that added visual noise (background color + indentation already establish hierarchy)
  - Files: `src/v2/components/LeftSidebar/CategoryGroup.tsx`, `src/v2/components/LeftSidebar/LayerRow.tsx`

- [x] **Active Layer Click Interactions** — Clicking layers activates them and shows in right sidebar
  - Completed: Clicking pinned layer activates it, expands panel, and collapses others (accordion pattern)
  - Clicking child view activates it and makes it visible (mutual exclusivity maintained)
  - Clicking non-pinned layer collapses all pinned panels
  - Active state changed from emerald to amber highlighting (parent + active child both amber)
  - Eye icons changed to gray scheme (dark gray visible, light gray hidden)
  - Parent eye toggle controls all children (hide all when off, restore when on)
  - Auto-collapse via useEffect ensures only one panel open at a time
  - Files: `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`, `PinnedLayersSection.tsx`, `LayerContext.tsx`, `MapLayersWidget.tsx`
  - Result: Clear interaction model where "active = inspecting = expanded = amber"

- [x] **Left Sidebar: Visual Distinction Between Categories and Layers** — Improve hierarchy perception
  - Goal: Clearly differentiate categories from their child layers in the left sidebar
  - Add backgrounds around category groups so dropdown content feels nested
  - Use indentation + distinct highlight treatments for layers vs categories
  - Layers should read as conceptually subordinate to categories (parent-child hierarchy)
  - Addresses: Low visual distinction between category and layer rows when expanded
  - Completed: Category banners (slate-100), Research Datasets moved to bottom with darker gray bg (gray-200), no bottom border; layer cards with amber active state, blue pins
  - Files: `src/v2/components/LeftSidebar/` (CategoryGroup, LayerRow, etc.), `src/v2/data/layerRegistry.ts`

- [ ] **Right Sidebar: Active Layer Color Coordination & Flash** — Unify active semantics and feedback
  - Header: Add yellow background to right sidebar header (match mapped item layers active indicator)
  - Left sidebar: Change active layer highlight from green to yellow to sync with Map Layers widget
  - Rationale: Green (left) vs yellow (mapped items) creates confusion; unify on yellow
  - Flash/animation: When active layer changes, right sidebar header flashes (white → yellow) so eyes quickly register "right sidebar changed"
  - Mapped item layers widget: Consider animation when layers change (e.g. subtle transition) to reinforce "inspecting different layer"
  - Goal: User immediately perceives that clicking a different item layer = inspecting different content
  - Files: `src/v2/components/RightSidebar/`, `LeftSidebar/`, `MapLayersWidget/`

### 📋 Phase 0 Acceptance Criteria

- [x] Clean component architecture with TypeScript
- [x] All 7 Phase 0 tasks complete with dummy data
- [x] Core interactions working (pin/unpin, eye toggle, tab switching)
- [x] Visual polish matching design system (Tailwind, no custom CSS)
- [x] Zero linter errors
- [ ] Real ArcGIS map integration (blocked by Task 0.4)
- [x] Drag-and-drop reorder (completed within Map Layers widget)

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

- **Phase 1:** iNaturalist data source — **🟢 Complete**
  - **See detailed task breakdown:** `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`
  - **Quick Summary:**
    - 13 / 13 tasks complete
    - Recently completed: Dynamic View Names (Task 26), User-Renamable Views (Task 27), Sync Filters with Map Layers (Task 25), Search Bar (Task 19), Date Range Filter (Task 21), Tab Memory (Task 22)

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
- **State Management:** React Context API (`LayerContext`) — `BookmarkContext` disabled (DFT-046)
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
| Feb 13, 2026 | Phase 1 | ✅ **Task 28 complete: iNaturalist detail view crash fixed.** Root cause: early return in INaturalistBrowseTab caused "Rendered fewer hooks than expected." Moved detail-view return after all hooks. Hardened handleViewOnMap with try/catch and coordinate validation. RightSidebar now auto-switches to Browse tab when map observation clicked (featureId set). Files: INaturalistBrowseTab.tsx, RightSidebar.tsx. | Claude |
| Feb 13, 2026 | Phase 1 | 🐛 **Task 28 added: iNaturalist detail view crash.** Page crashes when clicking observation card to open detail view. Filters sync correctly; crash occurs on detail view open. Marked as Critical, absolute next priority. | User |
| Feb 13, 2026 | Phase 1 | ✅ **Tasks 26 + 27 complete: Dynamic View Names + User-Renamable Filtered Views.** Child views auto-name from active taxa/date filters; users can rename inline in Map Layers; custom names persist. Added cross-branch merge contract in master-plan.md and integration notes in phase docs (0–4). Cross-Branch Merge Checklist added to this tracker. Phase 1 complete. Files: LayerContext.tsx, PinnedLayerChildRow.tsx, types/index.ts, MapLayersWidget, PinnedLayersSection, PinnedLayerRow. | Claude |
| Feb 13, 2026 | Phase 1 | ✅ **Task 25 complete: Sync Filters with Map Layers Widget.** Date + taxon filters sync bidirectionally between Browse tab and Map Layers widget. Edit Filters opens Browse with pre-applied filters. Map markers filter by date + taxa. Fixed infinite loop (hydrate/sync oscillation) and pin-transition sync. Added Tasks 26 (Dynamic View Names) and 27 (User-Renamable Views) for future refinement. Files: INaturalistBrowseTab.tsx, INaturalistFilterContext.tsx, LayerContext.tsx, inaturalistLayer.ts, useMapBehavior.ts, types/index.ts. | Claude |
| Feb 13, 2026 | Phase 1 | ✅ **Task 22 complete: Remember Last Active Tab.** RightSidebar now persists Overview vs Browse tab per layer; restores on reactivation. First visit defaults to Overview (DFT-006). Edit Filters still opens Browse. Files: RightSidebar.tsx. | Claude |
| Feb 13, 2026 | Phase 1 | ✅ **Tasks 20 & 21 complete: Pagination 10/page + Date Range Filter.** Task 20: Changed PAGE_SIZE from 20 → 10 in useINaturalistObservations. Task 21: Added start/end date pickers in Browse tab filter section (native date inputs, Clear button, min/max constraints). **Bug fix:** ArcGIS returns `observed_on` as epoch-ms; added `normalizeDate()` in INaturalistFilterContext to convert to YYYY-MM-DD so date comparisons work. Files: useINaturalistObservations.ts, INaturalistBrowseTab.tsx, INaturalistFilterContext.tsx, tncINaturalistService.ts. | Claude |
| Feb 13, 2026 | Phase 1 | ✅ **Task 19 complete: Add Observation Search Bar.** Added search input above filter section in Browse tab. Searches both common name and scientific name (case-insensitive substring match). 300ms debounce for smooth typing. Clear button (X icon) appears when text entered. Resets to page 1 on search change. Focus state uses box-shadow (no layout shift). Contextual helper text shows which taxa are being searched. Files: INaturalistBrowseTab.tsx, useINaturalistObservations.ts. | Claude |
| Feb 13, 2026 | Phase 1 | ✅ **Task 18 complete: Rename Legend Widget Title.** Changed floating legend header from "Filter Observations" to "iNaturalist Taxa". Files: INaturalistLegendWidget.tsx. | Claude |
| Feb 12, 2026 | Phase 1 | **Task 14 refinement: Remove duplicate map highlight.** Removed custom cyan circle from highlightPoint; use only ArcGIS native highlight (from view.openPopup). Dropped highlightPoint/clearHighlight calls from handleViewOnMap. Files: INaturalistBrowseTab.tsx. | Claude |
| Feb 12, 2026 | Phase 1 | ✅ **Task 14 complete: iNaturalist Observation Card Click → Map Highlight + Detail View.** Clicking an observation card in the right sidebar now: (1) opens detail view in sidebar, (2) pans + zooms map to the observation, (3) highlights the marker (ArcGIS native), (4) opens popup on map. Wired onViewDetail to call both setSelectedObs and handleViewOnMap. handleViewOnMap: await goTo(), find graphic in GraphicsLayer, view.openPopup(). Files: INaturalistBrowseTab.tsx. | Claude |
| Feb 12, 2026 | Phase 0 | 🟡 **Task 24 (0.9): Dynamic Layer Registry from Data Catalog Service.** Discovered Dan's Data Catalog FeatureServer with ~90+ real datasets, 14 categories (with subcategories), and 10 per-type Dendra sensor services. All sensor services follow identical 3-part schema (Locations/Data/Summary). Replaces static layerRegistry.ts. **All parallel branches paused until complete.** | Claude |
| Feb 12, 2026 | Phase 0 | ✅ **Task 23 complete: Data Source Adapter Pattern refactor.** Created plugin architecture: each data source implements `DataSourceAdapter` interface. Core files (MapContainer, RightSidebar, useMapLayers) made data-source-agnostic — read from registry. Lazy caching: `warmCache()` pattern (iNat: 2.18s initial, instant revisit). Active-but-not-pinned layers visible on map. Files: `dataSources/{types.ts, registry.ts, inaturalist/{adapter.tsx, useMapBehavior.ts}}`. Modified: INaturalistFilterContext (lazy), useMapLayers (generic), MapContainer/RightSidebar (generic), LayerContext (removed iNat from initial). Merge conflicts: ~4 lines/source. **Enables parallel branch development.** | Claude |
| Feb 12, 2026 | Phase 1 | ✅ **Task 15 complete: iNaturalist Map Marker Click → Zoom + Detail View.** Clicking observation markers on the map now zooms to the observation and opens its detail view in right sidebar. Extended ActiveLayer type with featureId field. Added map click handler in useINaturalistMapBehavior using view.hitTest(). Auto-opens detail view when activeLayer.featureId is set. Files: types/index.ts, LayerContext.tsx, useMapBehavior.ts, INaturalistBrowseTab.tsx. | Claude |
| Feb 12, 2026 | Phase 0 | ✅ **Task 1 complete: ArcGIS Map Integration (0.4).** Replaced placeholder with real ArcGIS WebMap. Layers added when pinned OR active. GraphicsLayer for highlights. | Claude |
| Feb 11, 2026 | Phase 1 | Added **Tasks 14-22** for iNaturalist UX improvements: map marker interactions, compact filter dropdown, search bar, date filter, pagination (10/page), tab memory, legend rename. Future: save observation → filtered view (low priority). | Claude |
| Feb 11, 2026 | Phase 1 | ✅ **Task 13 complete: Fix iNaturalist Layer Icons & Loading.** Replaced FeatureLayer with spatially-filtered GraphicsLayer; local counts; instant filtering; starts hidden. | Claude |
| Feb 11, 2026 | Phase 1 | Added **Task 13: Fix iNaturalist Layer Icons & Loading** — Wrong/fake icons before active; delay on layer click; slow taxa filter in legend. WIP commit. | User |
| Feb 11, 2026 | Phase 0 | ✅ **DFT-046: Saved Items widget dropped.** Unified into Map Layers. "Mapped Item Layers" renamed to "Map Layers". BookmarkProvider/BookmarkedItemsWidget disabled (code preserved). Bookmark actions in iNaturalist stubbed as TODO ("Save as View"). All documentation updated. | Claude |
| Feb 10, 2026 | Phase 0 | ✅ Task 12 complete: Fix DataOne Datasets Card Width. Added w-full to DataOne shortcut and LayerRow; mr-3 for right padding; removed redundant left border from category content (background + indentation sufficient for hierarchy). | Claude |
| Feb 10, 2026 | Phase 0 | ✅ Saved Items hierarchical tree connectors complete: Added L-shaped tree lines, emerald left border accent, full-width boxed headers, dynamic height (50vh cap), stub connector from headers. Distinguishes saved items (left border) from Map Layers child views (full boxes). | Claude |
| Feb 10, 2026 | Phase 0 | Added tasks 10 & 11: Left Sidebar visual distinction (categories vs layers); Right Sidebar color coordination (yellow header, active layer sync, flash on change). | User |
| Feb 10, 2026 | Phase 0 | ✅ Task 8 complete: Refine Active Layer → Pinned Layer Transition. Newly pinned row slides down from under header; section expands; no flash. | User |
| Feb 10, 2026 | Phase 0 | ✅ Task 7 complete: Remove Gray Divider in Left Sidebar. Removed border-t between DataOne shortcut and regular layers; italics preserved. | User |
| Feb 10, 2026 | Phase 0 | ✅ Task 2 & 5 complete: Drag-and-Drop Reorder for pinned layers (Map Layers widget); Prevent Map Layers Widget Scrollbar from Pushing Content. Both done within Map Layers widget. | User |
| Feb 10, 2026 | Phase 0 | ✅ Smooth CSS Transitions for Map Layers Widget: Active Layer section slides up/fades out on pin (300ms). New pinned layers slide down from above (400ms, no opacity). Snapshot state pattern for exit animation. Reduced-motion support. | Claude |
| Feb 10, 2026 | Phase 0 | ✅ Map Layers UX polish: Consolidated filter details inside layer containers (no separate gray boxes); added "Add Filters" naming for new views; dashed border for placeholder views; removed opacity so non-selected text stays readable (text-gray-800). | Composer |
| Feb 9, 2026 (eve) | Phase 0 | ✅ Task 4 complete: Unify Map Layers Expansion Affordances. Removed chevrons; filter icon is now primary expansion control. Parent shows visible child's filter count. Child rows use accordion pattern (one expanded at a time). Auto-activate + auto-expand visible child when pinned layer clicked from sidebar. User can manually collapse active layers without forced re-expansion. | Claude |
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

### Active Layer Interaction System (Feb 9, 2026 PM)
- **Feature**: Comprehensive click interaction overhaul for active layer management
- **Clicking Layers**:
  - Click parent layer → activates visible child + expands panel + collapses all others (accordion)
  - Click child view → activates it + makes visible + hides siblings (mutual exclusivity)
  - Click non-pinned layer → collapses all pinned panels
  - Active layer section hides when pinned layer is active (no duplication)
- **Visual Changes**:
  - Active state changed from emerald to amber highlighting
  - Parent and active child both get amber background/border
  - Eye icons changed to gray (dark gray visible, light gray hidden)
  - Removed all emerald backgrounds
- **Interaction Improvements**:
  - Parent eye toggle controls all children (hide all when off, restore first visible when on)
  - Clicking child view makes it visible and active simultaneously
  - Auto-collapse ensures only one panel open at a time (focused UX)
  - useEffect syncs expansion state with active layer changes
- **Result**: Clear mental model where "active = inspecting = expanded = amber"
- **Files**: PinnedLayerRow.tsx, PinnedLayerChildRow.tsx, PinnedLayersSection.tsx, LayerContext.tsx, MapLayersWidget.tsx

### Unified Expansion Affordances (Feb 9, 2026 Evening)
- **Feature**: Consolidated expansion controls and improved child view interactions
- **Chevron Removal**: Replaced chevron (>) with filter icon as primary expansion affordance
  - Filter icon semantically matches action (expand to see filters)
  - Simpler visual pattern — one icon, one purpose
- **Parent Filter Count Sync**: Parent row filter count now matches visible child's count
  - Dynamic: changes when switching between child views
  - Provides at-a-glance info about active filters
- **Child Row Accordion**: Only one child expanded at a time within same parent
  - Prevents cognitive overload from multiple expanded panels
  - Helps user track focus
  - State managed by parent component (PinnedLayerRow)
- **Auto-Expand from Sidebar**:
  - Clicking pinned layer from left sidebar → parent expands
  - Visible child view auto-activates (amber highlight)
  - Active child's filter panel auto-expands showing filter details
- **User Control**: Users can manually collapse active layers
  - Prevents forced re-expansion on re-click
  - Tracks `lastActiveLayerId` to only auto-expand on first activation
  - Respects user intent to keep things collapsed
- **Files**: FilterIndicator.tsx, PinnedLayerRow.tsx, PinnedLayerChildRow.tsx, PinnedLayersSection.tsx
- **Status**: Map Layers widget considered complete for Phase 0

### Map Layers UX Polish (Feb 10, 2026)
- **Filter Panel Consolidation**: Filter details (species, date, confidence, Clear, Edit Filters) now live inside the same yellow/amber container as the layer row. Added light gray divider between collapsed row and expanded details. Eliminates visual disconnect of separate gray boxes; improves Gestalt proximity.
- **Default View Names**: New empty views named "Add Filters" (action-oriented). Initial view uses distinguisher, "Filtered View", or "Default View". Replaces generic "View 1/2/3".
- **Placeholder Differentiation**: "Add Filters" views display dashed border to signal empty/actionable state.
- **Text Readability**: Removed container opacity for non-visible views; text consistently `text-gray-800` for all states. Visibility communicated via eye icon only.
- **Files**: PinnedLayerChildRow.tsx, PinnedLayerRow.tsx, LayerContext.tsx

