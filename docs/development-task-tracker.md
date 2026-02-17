# Development Task Tracker — V2 Digital Catalog

**Last Updated:** February 16, 2026  
**Current Phase:** Phase 0 (Foundation) — 🟡 In Progress  
**Target Deadline:** February 20, 2026 (8 days remaining)

**📁 Completed tasks archived:** See [docs/archive/completed-tasks-phase-0-3.md](archive/completed-tasks-phase-0-3.md) for full list + manual testing checklist.

---

## Quick Tasks Summary

**Active development tasks (ordered by priority).** Details live in phase docs; this is a quick reference.

| # | Phase | Task | Status | Priority |
|---|-------|------|--------|----------|
| 24 | 0 | 0.9 Dynamic Layer Registry from Data Catalog Service | 🟡 | Critical |
| 3.5 | 3 | Dendra: Floating time series (3.5d remaining) | 🟡 | High |
| 3.7 | 3 | Dendra: Weather Stations layer investigation | 🟢 | Medium |
| 3.9 | 3 | Dendra: Save With Filters button — behavior or removal | 🟢 | Medium |
| 9 | 0 | 0.6 Map Feature Highlight | 🟡 | Low |
| 33 | 2 | 2.16 ANiML Camera Badges | 🟢 | Medium |
| 34 | 2 | 2.17 ANiML Loading Indicators | 🟢 | Medium |

**Phase 3 details:** [phase-3-dendra.md](01-implementation-plan/phases/phase-3-dendra.md)

**Active tasks remaining:** 5  
**🔴 Next (critical):** Task 24 — Dynamic Layer Registry from Data Catalog Service
**Recently completed:** Task 2.17 (ANiML Loading Indicators) ✅ (Feb 16), Task 34 (Unified Loading Indicator Strategy) ✅, Task 3.9 ✅, Task 3.8 ✅, Task 3.7 ✅

---

## Cross-Branch Merge Checklist (Filtered View Naming)

- [ ] Keep shared Map Layers manual rename behavior in `LayerContext` (or equivalent shared state): custom name persists once user renames.
- [ ] Preserve custom-name guard on sync: auto filter sync must not overwrite names when view is marked custom.
- [ ] Implement per-data-source auto-name builder (iNaturalist/ANiML/Dendra/DataOne) so non-custom names update from each layer's filter model.
- [ ] Verify Edit Filters navigation + filter sync still targets correct child view IDs after merge.
- [ ] Integration QA for each data source: create view, auto-name updates from filters, manual rename sticks, clear custom name returns to auto naming.

---

## Cross-Branch Merge Checklist (Loading Indicators)

**Task 34: Unified Loading Indicator Strategy.** Affects v2/inaturalist, v2/dendra, v2/animl and future branches. Other branches may have different loading implementations and documentation — use this checklist when implementing and merging.

**Prerequisites (start only after):**
- [x] Finish current layer work in iNaturalist, Dendra, ANiML branches (per user) ✅ Feb 16
- [x] Decide merge order: v2/iNaturalist has Task 34; propagate via merge into v2/animl and v2/dendra ✅ Feb 16

**Propagation (for future merge requests):**
- **Source branch:** `v2/iNaturalist` (commits: 722151b, 4d29673, 99a6343 = Task 34 + design spec + checklist)
- **Target branches:** `v2/animl`, `v2/dendra` — both are 5 commits behind v2/iNaturalist as of Feb 16
- **How:** `git checkout v2/animl && git merge v2/iNaturalist` (repeat for v2/dendra)
- **Expected files:** `src/v2/components/shared/loading/*`, MapLayersWidget, MapContainer, PinnedLayerRow, ActiveLayerSection, legend widgets, sidebar Browse tabs, design-system.md
- **On conflict:** Prefer v2/iNaturalist's shared loading primitives; remove any bespoke per-layer spinners in target branch

**Merge strategy (branches have different docs):**
- [x] **Design doc as source of truth:** Add loading strategy spec to `docs/DESIGN-SYSTEM/design-system.md` (DFT-018 section) as the default canonical source; only add a new planning doc if explicitly approved ✅ Feb 16
- [x] **Implementation order:** Shared components implemented (MapLayersWidget, MapContainer, PinnedLayerRow, ActiveLayerSection) ✅
- [x] **Per-branch changes:** Legend widgets and sidebars use shared `LoadingPrimitives`; no bespoke per-layer spinners ✅

**Implementation checklist:**
- [x] Map Layers: blue spinner (w-4 h-4) in eye slot when layer’s data source is loading; Active + Pinned sections (**complete**)
- [x] Map center overlay: shown when active data source is loading (**complete**)
- [x] Legend: loading when `!dataLoaded`; optional header spinner during refresh (**iNaturalist + ANiML complete**)
- [x] Right sidebar: region-specific loading via shared `InlineLoadingRow` / `RefreshLoadingRow` (**iNaturalist, Dendra, ANiML complete**)
- [x] **Shared loading primitives:** `src/v2/components/shared/loading/` — `loadingTheme.ts`, `LoadingPrimitives.tsx`. Change tokens once to propagate styling app-wide.

**Design reference:** See design discussion in phase-1-inaturalist.md (or this tracker’s task 34 notes). Design principles: Nielsen #1, #4; Norman Feedback; DFT-018 region-specific; Gestalt proximity/similarity.

---

## Status by Phase

**High-level status across all phases.** Use this to see which phases are in progress, blocked, or not started.

| Phase | Status | Progress | Branch | Blocking? |
|-------|--------|----------|--------|-----------|
| **0. Foundation** | 🟡 In Progress | ~98% | `v2/foundation` | YES — blocks all |
| 1. iNaturalist | 🟢 Complete | 5 / 5 tasks | `v2/inaturalist` | No — Task 0.6 optional polish |
| 2. ANiML | 🟡 In Progress | ~40% | `v2/animl` | No — Browse tab MVP done |
| 3. Dendra | 🟡 In Progress | 6 / 6 tasks | `v2/dendra` | No |
| 4. DataOne | ⚪ Not Started | 0% | `v2/dataone` | 🔴 Paused — waiting for Task 0.9 |
| 5. Export Builder | ⚪ Not Started | 0% | `v2/export` | No |
| 6. TNC ArcGIS Services | 🟡 In Progress | 11 / 20 tasks | `v2/tnc-arcgis` | No |
| 7. Polish & Consistency | ⚪ Not Started | 0% | `v2/polish` | No |

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

- **Phase 2:** ANiML data source

  - [x] **Tasks 2.3–2.6: Multi-dimensional filter system** ✅
    - **Completed (Feb 13):** FilterSection.tsx (expandable, multi-select, Select All/Clear All). AnimlFilterContext: selectedCameras, toggleCamera, clearCameras, selectAllAnimals, selectAllCameras, filteredImageCount, getFilteredCountForSpecies. AnimlBrowseTab: Species + Cameras FilterSections, live result count, debounced image fetch, ImageList. Researchers can select multiple species AND cameras.
    - **Files:** `FilterSection.tsx`, `AnimlFilterContext.tsx`, `AnimlBrowseTab.tsx`

  - [x] **Task 2.10: Right Sidebar Scrollbar — Prevent content shift** ✅
    - **Completed (Feb 13):** scrollbar-gutter: stable on right sidebar scroll area.
    - **Files:** `RightSidebar.tsx`, `index.css`

  - [x] **Task 2.11: Date/Time Frame Filter — Above Species and Cameras** ✅
    - **Completed (Feb 13):** DateFilterSection component with collapsible date range picker + quick-select presets (Last 30 days, Last 6 months, This Year, Last Year). AnimlFilterContext: startDate/endDate state, setDateRange, clearDateRange, hasDateFilter. AnimlBrowseTab passes dates to queryImageLabelsCached. Auto-apply per DFT-039. Count fix: use actual `images.length` when fetched (not countLookups) so date-filtered counts match displayed results.
    - **Files:** `DateFilterSection.tsx` (new), `AnimlFilterContext.tsx`, `AnimlBrowseTab.tsx`

  - [x] **Task 2.12: ANiML Image List — Pagination (Prev/Next Page)** ✅
    - **Completed (Feb 13):** Replaced "Load More" with page-based navigation. Scrollable image list with Prev/Next controls underneath, page indicator (`Page X of Y`), range text (`1-20 of N`).
    - **Refinement:** Image results area expands to fill remaining sidebar space; always-visible scrollbar (`.scroll-area-animl-images`) so users can detect scrollability.
    - **Implementation:** `currentPage` state + fixed `PAGE_SIZE` pagination in ANiML views; `ImageList` with `expandToFill` prop; flex layout in `AnimlBrowseTab` for dynamic height.
    - **Files:** `AnimlBrowseTab.tsx`, `ImageList.tsx`, `CameraDetailView.tsx`, `AnimalDetailView.tsx`, `index.css`

  - [x] **Task 2.13: ANiML Image — Expanded View on Click** ✅
    - **Completed (Feb 13):** Click thumbnail → larger view in sidebar. ImageExpandedView.tsx: medium_url, metadata (species, date, camera), Back to list, overlay + bottom nav buttons. Auto-pagination: arrow keys cross page boundaries (20→21, 40→41) without closing expanded view.
    - **Files:** `ImageExpandedView.tsx` (new), `ImageList.tsx` (modified)

  - [x] **Task 2.14: ANiML Expanded View — Arrow Key Navigation** ✅
    - **Completed (Feb 13):** Left/right arrow keys navigate; Prev/Next buttons; Esc to close. Auto-pagination across pages (no back-to-list required when crossing page boundaries).
    - **Files:** `ImageExpandedView.tsx`, `ImageList.tsx`

  - [x] **Task 31 (2.7): ANiML Caching Strategy Investigation** ✅
    - **Marked done for now (Feb 13):** Service/context caching in place; formal investigation deferred.

  - [x] **Task 32 (2.15): ANiML Image Click → Highlight Camera on Map** ✅
    - **Completed (Feb 13):** AnimlFilterContext: focusedDeploymentId, focusDeployment(), clearFocusedDeployment(). ImageList: onImageFocus(image) callback on click and when navigating in expanded view. useAnimlMapBehavior: ArcGIS layerView.highlight(targetGraphic) for focused deployment; cleanup on layer remove. animlLayer: getAnimlCameraGraphicByDeploymentId() helper (2.16-ready).
    - **Files:** `AnimlFilterContext.tsx`, `ImageList.tsx`, `AnimlBrowseTab.tsx`, `animlLayer.ts`, `useMapBehavior.ts`

  - [x] **Task 33 (2.16): ANiML Camera Badges — Numbered Icons for Query Results** ✅
    - **Completed (Feb 16 doc sync):** Dynamic map badge symbols are active while filters are applied; no-filter state returns to plain camera icon; 0-result cameras render muted/no badge.
    - **Implementation:** Uses count lookups via `updateAnimlCameraBadges()` in map behavior lifecycle.
    - **Files:** `animlLayer.ts`, `useMapBehavior.ts`, `AnimlFilterContext.tsx`

  - [x] **Task 35 (2.8): ANiML SVG Icons for Map Markers + Tag Rows** ✅
    - **Completed (Feb 16):** Replaced emoji camera symbols with SVG camera glyphs in map layer rendering (base, badge, muted states). Added icon rows in ANiML legend and browse filter lists for species/camera scanability.
    - **Files:** `animlLayer.ts`, `AnimlLegendWidget.tsx`, `FilterSection.tsx`, `AnimlBrowseTab.tsx`, `phase-2-animl.md`

  - [x] **Task 2.17: iNaturalist-style loading indicators for ANiML** ✅
    - **Completed (Feb 16):** MapCenterLoadingOverlay with "Loading camera trap data..." when ANiML is active; Map Layers (ActiveLayerSection, PinnedLayerRow) and AnimlLegendWidget use shared LoadingPrimitives.
    - **Files:** `MapContainer.tsx`, `AnimlLegendWidget.tsx`

  - [ ] **Future/Low Priority: Save Observation → Create Filtered View**
    - **Goal:** Clicking "Save" on an observation creates a new child view in Map Layers widget filtered to that specific observation (by ID or name).
    - **Implementation:** Wire "Save" action to `createNewView(pinnedId)` in LayerContext. Set filter to `observation_id = {id}`. Complex — requires linking browse actions to Map Layers state.
    - **Priority:** Deferred — low user value, high complexity.
    - **Files:** `INaturalistBrowseTab.tsx`, `LayerContext.tsx`, `inaturalistLayer.ts`
- **Phase 3:** Dendra data source (6 tasks)
  - [x] **Tasks 3.1-3.4 complete:** Dendra station browse adapter ✅ (Feb 12)
    - **Completed:** Full adapter for 10 per-type sensor services (Weather Stations, Barometers, Rain Gauges, etc.). Service layer, DendraContext, map behavior, sidebar (Overview/Browse), StationCard, StationDetailView with datastream summaries. Map markers now correctly show only active layer's stations. Fixed: buildServiceUrl (no double path), elevation null/NaN handling, layer-switch graphics clearing.
    - **Files:** `src/v2/services/dendraStationService.ts`, `src/v2/context/DendraContext.tsx`, `src/v2/dataSources/dendra/`, `src/v2/components/RightSidebar/Dendra/`, `src/v2/components/Map/layers/dendraLayer.ts`
  - [ ] **Task 3.5 (NEXT):** Floating time series chart — sensor detail view with ECharts, interactive hover, stats panel. 3.5a ✅ 3.5b ✅ 3.5c ✅. Remaining: 3.5d sidebar polish.
  - [x] **Task 3.6:** Time range filter (Level 3) — date picker, aggregation dropdown ✅ (Feb 13)

- [x] **Task 27: Save View / Save With Filters — sync with Map Layers** (Cross-phase: 0, 1, 3) ✅ (Feb 13)
  - **Goal:** Replace bookmark terminology with "Save View" or "Save With Filters." Persist right-sidebar filter state into Map Layers widget (pinned layer + child filtered views). Eventually supports multiple saved filtered views per layer.
  - **Completed:** Dendra uses explicit "Save View" and "Save With Filters" actions in StationDetailView. Added `DendraViewFilters` type, `syncDendraFilters()` in LayerContext, one-shot hydration in DendraBrowseTab when switching child views or Edit Filters. iNaturalist already had auto-save; Dendra uses explicit save per Level 3 complexity.
  - **Acceptance criteria:**
    - [x] Bookmark terminology removed; replaced with "Save View" or "Save With Filters" where applicable
    - [x] Right sidebar filter state syncs to Map Layers pinned layer / child views
    - [x] iNaturalist-style persistence works for iNaturalist layer (pre-existing)
    - [x] Dendra: explicit save implemented; syncs to Map Layers on Save View / Save With Filters
  - **Files:** `LayerContext.tsx`, `DendraContext.tsx`, `types/index.ts`, `DendraBrowseTab.tsx`, `StationDetailView.tsx`, `phase-3-dendra.md`

- **Task 34: Unified Loading Indicator Strategy** (Cross-phase: 0, 1, 2, 3, 6)
  - **Goal:** Consistent loading indicators across all data sources (iNaturalist, Dendra, ANiML, future). No bespoke per-layer spinners.
  - **Prerequisite — START ONLY AFTER:**
    - [ ] Finish current layer work in iNaturalist, Dendra, ANiML branches (user to confirm)
    - [ ] Decide merge order; loading strategy implemented in branch that lands first
  - **Strategy (from design discussion):**
    1. **Map Layers widget:** Spinner (w-4 h-4) in eye slot when layer’s data source is loading; same for all layers
    2. **Map center overlay:** Only when `!dataLoaded` (initial load); not during refresh
    3. **Legend widget:** Loading when `!dataLoaded`; optional header spinner during refresh
    4. **Right sidebar:** Keep region-specific loading; same spinner + text pattern across data sources
  - **Design decision (UI/UX):** Use "local-first loading" by default and reserve global overlays for first-load only.
    - **Why:** Supports Nielsen #1 (Visibility of system status) without violating #3 (User control and freedom). Users keep interacting with other regions during refreshes.
    - **Core tension:** A single global spinner is consistent, but it hides where work is happening and increases cognitive load during background refresh.
    - **Resolution:** Keep loading indicators near the affected region (Map Layers row, legend body, sidebar body), with map-level overlay only for empty/first paint.
  - **Edge cases to standardize:**
    - If first load exceeds 3s: keep region skeleton/spinner + show utilitarian loading text.
    - If first load exceeds 15s: show "Taking longer than usual" + cancel/retry action per DFT-018.
    - During refresh with stale data present: do not blank content; use subtle in-place spinner state.
    - If one source fails while others load: isolate error to that region; do not block unrelated sources.
  - **Principle fit (recommended strategy):**
    - ✅ = strong fit, 🟡 = partial fit/tradeoff, ❌ = weak fit
    - | Principle | Fit | How the strategy addresses it |
      |---|---|---|
      | Nielsen #1: Visibility of system status | ✅ | Spinner/skeleton appears exactly where load occurs; first-load overlay clarifies "map not ready yet." |
      | Nielsen #4: Consistency and standards | ✅ | Same loading anatomy across iNaturalist, Dendra, ANiML, and future adapters. |
      | Norman: Feedback | ✅ | Immediate, context-local feedback reduces ambiguity after user actions (pin, activate, filter). |
      | Gestalt: Proximity/Similarity | ✅ | Indicator is colocated with affected component and uses repeatable visual pattern. |
      | Hick's Law (cognitive load) | ✅ | Avoids multiple competing global indicators; users read one local status at a time. |
      | Shneiderman: User control | 🟡 | Strong in sidebars/legends, but first-load map overlay remains temporarily blocking by design. |
      | WCAG/Accessibility | 🟡 | Pattern is compatible, but requires explicit ARIA status text + contrast checks during implementation. |
      | Peak-End Rule | 🟡 | Better continuity during refresh, but completion moments still need explicit "loaded" state polish. |
      | Behavioral trust (predictability) | ✅ | Same semantics per region increases confidence across data sources and branches. |
  - **Merge strategy:** Other branches have different documentation. Create canonical spec in `design-system.md` (DFT-018) or `docs/PLANNING/resolved-decisions/loading-indicator-strategy.md`. Implement in shared components; each branch’s legend/sidebar adopts same pattern.
    - **Default documentation path:** `docs/DESIGN-SYSTEM/design-system.md` (DFT-018). Only add new planning docs with explicit approval.
  - **Files:** `PinnedLayerRow.tsx`, `PinnedLayerChildRow.tsx`, `MapLayersWidget.tsx`, `PinnedLayersSection.tsx`, `MapContainer.tsx`, `registry.ts` (loadingByDataSource), legend widgets, sidebar Browse tabs
  - **See:** Cross-Branch Merge Checklist (Loading Indicators) above

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
| Feb 16, 2026 | Phase 6 | ✅ **Task 6.15 complete: TNC ArcGIS Legend Iconography Parity + Symbol-Aware Filtering.** esriPMS picture-marker symbols render via imageData/contentType extraction. UX refinements: Select All/Clear All in header next to Legend; layer name above items; stable selection box (no layout shift); removed redundant "Selected" text. | Claude |
| Feb 16, 2026 | Phase 2 | ✅ **Task 2.17 complete: iNaturalist-style loading indicators for ANiML.** MapContainer shows "Loading camera trap data..." overlay when animl active; Map Layers and AnimlLegendWidget use shared LoadingPrimitives; loadingTheme.inlineSpinner for legend. | Claude |
| Feb 16, 2026 | All | **Phase restructure:** Inserted new Phase 6 (TNC ArcGIS Feature Services) with 10 tasks. Renumbered old Phase 6 (Polish) to Phase 7. Service-level activation pattern for multi-layer TNC services with layer switcher in right sidebar. Generic filter UI (field/operator/value) for MVP. See `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md` | Claude |
| Feb 16, 2026 | Phase 2 | ✅ **Task 35 (2.8) complete: ANiML SVG icons for map markers + tag rows.** Replaced emoji map markers with SVG camera symbols in `animlLayer.ts` (base, badge, muted). Added icon rows in ANiML legend and browse filter lists. Updated phase-2 task status + acceptance criteria. | Claude |
| Feb 16, 2026 | Phase 3 | ✅ **Task 3.9 complete: Dendra Save With Filters — distinct behavior.** Renamed to "Update Current View" (station-level sync) and "Save as New View" (creates filtered child view, activates it). Added `createDendraFilteredView()` in LayerContext. Files: StationDetailView.tsx, LayerContext.tsx. | Claude |
| Feb 16, 2026 | Phase 3 | ✅ **Task 3.7 complete: Weather Stations layer investigation.** Root cause: Two Weather Stations layers in catalog — dataset-183 (Dendra sensor, working) and dataset-190 (legacy v0, not implemented). Backend fix: Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer. No frontend changes. | Claude |
| Feb 16, 2026 | Phase 3 | 🐛 **Task 3.8 complete: Barometer datastream crash.** `formatValue` in dendraStationService.ts threw `value.toFixed is not a function` when ArcGIS returned min/max/avg as strings. Now coerces to number and handles NaN. | Claude |
| Feb 16, 2026 | Docs | **Archive + phase consolidation.** Moved completed tasks to `docs/archive/completed-tasks-phase-0-3.md` with manual testing checklist. Dendra tasks moved to phase-3-dendra.md (3.7 Weather Stations, 3.8 barometer fix, 3.9 Save With Filters). Development-task-tracker slimmed to quick reference only. | Claude |
| Feb 13, 2026 | Phase 0/1/3 | ✅ **Task 27 complete: Save View / Save With Filters — sync with Map Layers.** Replaced Dendra bookmark terminology with explicit "Save View" and "Save With Filters" actions. Added `DendraViewFilters` type, `syncDendraFilters()` in LayerContext, one-shot filter hydration in DendraBrowseTab. Right-sidebar filter state (showActiveOnly, station, datastream, date range, aggregation) persists to Map Layers pinned layer/child views. Edit Filters and child-view switching rehydrate Dendra Browse. Files: LayerContext.tsx, DendraContext.tsx, types/index.ts, DendraBrowseTab.tsx, StationDetailView.tsx, phase-3-dendra.md. | Claude |
| Feb 16, 2026 | 0/1/2/3/6 | ✅ **Task 34 complete: Unified Loading Indicator Strategy.** Shared loading primitives (`loadingTheme.ts`, `LoadingPrimitives.tsx`), eye-slot spinner (Active + Pinned), map overlay, legend/sidebar loading wired for iNaturalist, Dendra, ANiML. Styling centralized for single-point propagation. | Claude |
| Feb 16, 2026 | 0/1/2/3/6 | **Task 34 design spec complete.** Canonical loading strategy documented in design-system.md (DFT-018): eye-slot spinner, first-load-only map overlay, legend/sidebar region-specific. Design doc checklist item done. Implementation pending per prereqs. | Claude |
| Feb 13, 2026 | Phase 3 | ✅ **Task 26 sub-task 3.5b complete.** Fixed sensors showing 0 data despite record counts. Root cause: null-heavy datapoint windows when querying oldest-first. Updated v0 bridge query to fetch latest non-null points (`value IS NOT NULL`, `ORDER BY timestamp_utc DESC`), reverse client-side for chronological chart. **Remaining:** 3.5d (sidebar polish). | Claude |
| Feb 13, 2026 | Phase 3 | ✅ **Task 26 sub-task 3.5a complete.** Fixed subsequent datastream clicks not updating chart. Two bugs: (1) race condition — stale fetch could overwrite newer datastream's data (request-counter guard in openChart); (2) stale ECharts instance — chart div remounts during loading but old instance pointed to removed DOM (getDom() check before init). **Remaining:** 3.5b (0-data inconsistency), 3.5d (sidebar polish). | Claude |
| Feb 13, 2026 | Phase 3 | 🟡 **Task 26 (Dendra 3.5) in progress; sub-task 3.5c complete.** Floating chart UI polish shipped: visible glassmorphism, bottom-right placement, half-height panel sizing, stronger contrast/readability, larger axis labels, larger/higher range slider, darker header, and measurement-first header text hierarchy. **Still open:** 3.5a (chart not refreshing on subsequent datastream clicks), 3.5b (0-data inconsistency). | Claude |
| Feb 12, 2026 | Phase 3 | ✅ **Dendra Tasks 3.1-3.4 complete.** Full station browse adapter for 10 per-type sensor services. Service layer, DendraContext (per-service cache), map behavior (active-layer-only populate), Overview/Browse tabs, StationCard, StationDetailView with datastream summaries. Fixes: buildServiceUrl (no double path), elevation null/NaN, layer-switch graphics clearing. **Next: Task 3.5 floating time series chart.** | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Task 32 (2.15) complete: ANiML image click → highlight camera on map.** AnimlFilterContext: focusedDeploymentId, focusDeployment(), clearFocusedDeployment(). ImageList: onImageFocus on click + expanded navigation. useAnimlMapBehavior: ArcGIS layerView.highlight(). animlLayer: getAnimlCameraGraphicByDeploymentId() (2.16-ready). | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Task 31 (2.7) marked complete.** Caching strategy investigation deferred; service/context caching in place. Added **Tasks 32–33 (2.15, 2.16):** Image click → highlight camera on map; Camera badges (numbered icons for query results, no badge for 0). | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Tasks 29–30 (2.13, 2.14) complete.** ANiML expanded image view on click + arrow key navigation. ImageExpandedView.tsx: lightbox in sidebar, medium_url, metadata, Back to list, overlay + bottom nav. Arrow keys + Prev/Next navigate; Esc closes. **Auto-pagination:** crossing page boundary (e.g. image 20→21) advances page and stays in expanded view. Fix: synchronous safe-index during render to prevent crash on page transition. | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Task 28 (2.12) refinement.** ANiML image results expand to fill remaining sidebar space; always-visible scrollbar (`.scroll-area-animl-images`) for scrollability affordance. Flex layout in AnimlBrowseTab + `expandToFill` in ImageList. **Next:** Tasks 2.13 (expanded image view on click), 2.14 (arrow key navigation). | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Task 28 (2.12) complete.** Replaced "Load More" with page-based pagination for ANiML images: scrollable list, Prev/Next controls underneath, page indicator (`Page X of Y`), range indicator (`1-20 of N`). Applied across Browse, Camera Detail, and Animal Detail image lists. | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Task 27 (2.11) complete + count fix.** DateFilterSection, date filter state, pass dates to queryImageLabelsCached. Fix: use actual images.length when fetched (not countLookups) so date-filtered counts match. Added Tasks 2.12 (image list pagination Prev/Next), 2.13 (expanded image view on click), 2.14 (arrow key nav in expanded view). | Claude |
| Feb 13, 2026 | Phase 2 | ✅ **Tasks 2.3–2.6 complete: ANiML Browse tab multi-dimensional filter system.** FilterSection.tsx (expandable, multi-select, Select All/Clear All). AnimlFilterContext: selectedCameras, toggleCamera, clearCameras, selectAllAnimals, selectAllCameras, filteredImageCount. AnimlBrowseTab: Species + Cameras FilterSections, live result count, debounced image fetch, ImageList. Researchers can select multiple species AND cameras. Added Tasks 2.10 (right sidebar scrollbar — prevent content shift) and 2.11 (date/time frame filter above Species and Cameras). | Claude |
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

