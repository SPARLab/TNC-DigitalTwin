# Master Development Plan — V2 Digital Catalog

**Created:** January 23, 2026  
**Last Updated:** February 20, 2026  
**Target Deadline:** February 20, 2026  
**Status:** 🟡 In Progress

**📁 Completed tasks archived:** Per-phase archives in [docs/archive/phases/](archive/phases/) — one file per phase with task descriptions + completion timestamps.

---

## Overview

This document is the single source of truth for the V2 Digital Catalog paradigm shift. It tracks phase status (remaining task counts), cross-phase decisions, and blocking issues. **Individual task details live in phase docs** — each branch focuses on its phase doc; each new chat window gets a task from that phase. Task descriptions should be self-contained so a chat can get relevant context without reading unnecessary tokens.

**The Paradigm Shift:**
- **Left sidebar:** Persistent layer browser (find and pin layers)
- **Right sidebar:** Layer workspace (browse, query, bookmark, export)
- **Floating widgets:** Pinned Layers (top-left) + Bookmarked Features (top-right)
- **Map:** Shows all pinned layers simultaneously

**Key Reference Documents:**
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockups: `mockups/02a-02f` (unified layout, data source browse views, export builder)
- Previous mockup plan: `docs/IMPLEMENTATION/archive/v2-pin-bookmark-export-mockup-plan-jan-22-2026.md`
- Future enhancements: `docs/PLANNING/future-enhancements.md` (v2.1+ feature backlog)

---

## Phase Status

| Phase | Name | Status | Remaining | Branch | Blocking? |
|-------|------|--------|-----------|--------|-----------|
| 0 | Foundation | 🟢 Complete | 0 blocking | `v2/foundation` | No — parallel branches ready |
| 1 | iNaturalist | 🟢 Complete | 0 | `v2/inaturalist` | No |
| 2 | ANiML | 🟢 Complete | 0 | `v2/animl` | No |
| 3 | Dendra | 🟡 In Progress | 0 blocking | `v2/dendra` | No |
| 4 | DataOne | 🟡 In Progress | 15 tasks | `v2/dataone` | No |
| 5 | Export Builder | 🟡 In Progress | 1 task | `v2/export-builder` | No |
| 6 | TNC ArcGIS Services | 🟡 In Progress | 7 tasks | `v2/tnc-arcgis` | No |
| 7 | Polish & Consistency | ⚪ Not Started | 12+ tasks | `v2/polish` | No |
| 8 | Calflora | ⚪ Not Started | 9 tasks | `v2/calflora` | No |
| 9 | GBIF | 🟡 In Progress | 5 tasks (D20-08 ✅, GBIF-HOSTED ✅; D20-12 🟡 in progress; P9-GRIDBIN high priority; 9.8/9.9 deferred; 9.12 deferred to v2.1+) | `v2/gbif` | No |
| 10 | DroneDeploy | 🟢 Complete | 0 tasks | `v2/dronedeploy` | No |
| 11 | MODIS | ⚪ Not Started | 9 tasks | `v2/modis` | No |

**Status Legend:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

**Remaining tasks by phase:** See phase docs for task details. This tracker shows counts only to minimize context load.

| Phase | Doc | Remaining |
|-------|-----|-----------|
| 0 | [phase-0-foundation.md](IMPLEMENTATION/phases/phase-0-foundation.md) | 0.6 Map Feature Highlight (if pending); 0.9 ✅ complete |
| 1 | [phase-1-inaturalist.md](IMPLEMENTATION/phases/phase-1-inaturalist.md) | 0 |
| 2 | [phase-2-animl.md](IMPLEMENTATION/phases/phase-2-animl.md) | ~4 tasks |
| 3 | [phase-3-dendra.md](IMPLEMENTATION/phases/phase-3-dendra.md) | D20-06 ✅; D20-BL01–03 backlog; CON-DENDRA-08 |
| 4 | [phase-4-dataone.md](IMPLEMENTATION/phases/phase-4-dataone.md) | CON-DONE-01/02/16 ✅; remaining: CON-DONE-03–11, CON-DONE-14, CON-DONE-15, D20-09, D20-B02, TF-13, TF-14 |
| 5 | [phase-5-export-builder.md](IMPLEMENTATION/phases/phase-5-export-builder.md) | + D20-14 (Dan meeting Feb 20) |
| 6 | [phase-6-tnc-arcgis.md](IMPLEMENTATION/phases/phase-6-tnc-arcgis.md) | 8 tasks (+ D20-02 ✅, D20-02a ✅, D20-10 ✅, D20-11 ✅, TF-11 ✅, TF-13 ✅; D20-B04, D20-B05 from Dan meeting Feb 20) |
| 7 | [phase-7-polish.md](IMPLEMENTATION/phases/phase-7-polish.md) | 12+ tasks (+ D20-03, D20-04, D20-07, D20-13 from Dan meeting Feb 20; D20-01 ✅ done in Phase 0) |
| 9 | [phase-9-gbif.md](IMPLEMENTATION/phases/phase-9-gbif.md) | 5 tasks (D20-08 ✅, GBIF-HOSTED ✅; D20-12 🟡 in progress; P9-GRIDBIN high priority; + D20-B01, D20-B03, D20-12-FOLLOW optional) |
| 10 | [phase-10-dronedeploy.md](IMPLEMENTATION/phases/phase-10-dronedeploy.md) | 0 |

---

## Phase Dependencies

```
Phase 0: Foundation
    │
    ├──► Phase 1: iNaturalist ──────────────────────────┐
    │                                                    │
    ├──► Phase 2: ANiML ────────────────────────────────┤
    │                                                    │
    ├──► Phase 3: Dendra ───────────────────────────────┤
    │                                                    │
    ├──► Phase 4: DataOne ──────────────────────────────┼──► Phase 5: Export Builder ──┐
    │                                                    │                              │
    ├──► Phase 6: TNC ArcGIS ───────────────────────────┤                              │
    │                                                    │                              │
    ├──► Phase 8: Calflora ─────────────────────────────┤                              │
    │                                                    │                              │
    ├──► Phase 9: GBIF ─────────────────────────────────┤                              │
    │                                                    │                              │
    ├──► Phase 10: DroneDeploy ─────────────────────────┤                              │
    │                                                    │                              │
    └──► Phase 11: MODIS (after Phase 10 recommended) ──┘                              │
                                                                                        │
                                                                                        └──► Phase 7: Polish
```

**Future Phase (not yet scoped):**
- **LiDAR** — deferred to last; may require 3D world projection for all 2D layers

**Parallelization:**
- Phases 1-6, 8-9 can be worked on simultaneously (different Cursor windows, different branches) — **ACTIVE; Task 0.9 complete**
- Phase 10 (DroneDeploy) and Phase 11 (MODIS) share raster imagery patterns; DroneDeploy first is recommended so shared components can be reused
- Task 0.9 (Dynamic Layer Registry) ✅ complete — `useCatalogRegistry` fetches from Data Catalog FeatureServer; left sidebar populated dynamically
- Each phase has its own branch, merged to `v2/main` when complete
- Phase 5 requires all data sources to be functional
- Phase 7 is the final consistency pass

---

## Cross-Branch Merge Checklists

Use these when merging branches that touch shared components.

### Filtered View Naming

- [ ] Keep shared Map Layers manual rename behavior in `LayerContext`: custom name persists once user renames.
- [ ] Preserve custom-name guard on sync: auto filter sync must not overwrite names when view is marked custom.
- [ ] Implement per-data-source auto-name builder (iNaturalist/ANiML/Dendra/DataOne) so non-custom names update from each layer's filter model.
- [ ] Verify Edit Filters navigation + filter sync still targets correct child view IDs after merge.
- [ ] Integration QA for each data source: create view, auto-name updates from filters, manual rename sticks, clear custom name returns to auto naming.

### Loading Indicators (Task 34)

**Source branch:** `v2/iNaturalist`. **Target branches:** `v2/animl`, `v2/dendra`.

- [x] Design doc in `design-system.md` DFT-018 ✅
- [x] Shared components: MapLayersWidget, MapContainer, PinnedLayerRow, ActiveLayerSection ✅
- [x] Per-branch: Legend widgets and sidebars use shared `LoadingPrimitives` ✅
- **On conflict:** Prefer v2/iNaturalist's shared loading primitives; remove bespoke per-layer spinners.

---

## Cross-Phase Decisions

> **IMPORTANT:** When any Cursor agent makes a styling or architectural decision that affects other phases, they MUST document it here AND in `design-system.md`.

### Architectural Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| Code structure (v2/ folder approach) | ✅ Decided | Will | Jan 23 | See "Code Structure" section below |
| State management for pinned layers | ✅ Decided | Will | Feb 12 | React Context API (`LayerContext`) with undo stack. See `src/v2/context/LayerContext.tsx` |
| State management for bookmarks | ✅ Decided | Will | Feb 11 | DFT-046: Saved Items widget merged into Map Layers. `BookmarkContext` disabled. |
| Data source adapter pattern | ✅ Decided | Will + Claude | Feb 12 | Plugin architecture for data sources. Each source implements `DataSourceAdapter` interface. Enables parallel branch development with minimal merge conflicts. See `src/v2/dataSources/` |
| Caching strategy | ✅ Decided | Will + Claude | Feb 12 | Lazy per-source caching. Each data source context has `warmCache()` method (idempotent). Cache warms on first pin or activation. Data persists while provider mounted. Eliminates eager page-load fetches. |
| Dynamic layer registry from Data Catalog Service | ✅ Implemented | User + Claude | Feb 12 | `useCatalogRegistry.ts` fetches from Dan's Data Catalog FeatureServer (`Dangermond_Preserve_Data_Catalog`). ~90+ real datasets across 14 categories. Left sidebar populated from catalog. Layers without adapters show generic placeholder in right sidebar. **Task 0.9 complete — parallel branches unblocked.** See phase-0-foundation.md. |
| Cross-layer filtered-view naming contract | ✅ Decided | User + Claude | Feb 13 | Manual rename behavior must persist across all layer types and custom right-sidebar views. Auto-naming is adapter-specific per data source. Shared widget/context rule: if `isNameCustom` is false, auto-name can update on filter sync; if true, never overwrite. Rollout can happen incrementally by branch (not required to block current merge). |

### Styling Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| No emojis policy (use SVG icons) | ✅ Decided | Will | Feb 3 | Emojis render inconsistently across browsers. Use SVG icons from `src/components/icons/` or Lucide React. See `design-system.md` |
| Sidebar Template System | ✅ Decided | Will | Feb 5 | All data sources share structural templates (TabBar, OverviewTab, ResultCard, Pagination). Theme tokens in `sidebarTheme` — change once, changes everywhere. Exceptions documented. See `design-system.md` Sidebar Template System |
| Overall color palette | 🟡 Defined in mockups | Will | Feb 5 | Initial tokens set in `sidebarTheme` (gray/emerald). Team adjusts via token file during review |
| Right sidebar header styling | ✅ Decided | Will | Feb 5 | Part of Sidebar Template System — shared `SidebarShell` + `TabBar` components. Underline tabs, emerald accent. See `design-system.md` |
| Card component styling | ✅ Decided | Will | Feb 5 | Shared `ResultCard` component with icon/title/subtitle/actions slots. Same card everywhere, data sources provide content. See `design-system.md` |
| Data source accent colors | 🟡 Defined in mockups | Will | Feb 5 | Default: emerald-600 for all. Per-data-source overrides possible but not required for v2.0 |

### UX Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| Pin/Bookmark paradigm | ✅ Decided | Team | Jan 21 | See paradigm doc |
| Left sidebar always visible | ✅ Decided | Team | Jan 20 | Confirmed in feedback |
| Bookmark widget (right-aligned) | ✅ Decided | Will | Feb 2 | Resolved via DFT-007: grouped by parent layer, non-interactive headers. Position: top-right |
| Pin vs visibility behavior (DFT-001) | ✅ Decided | Will | Jan 27 | Model C: Selection = active, pin separate. See DFT-001 resolution |
| Filter representation in widgets | ✅ Decided | Will | Feb 4 | Resolved via DFT-024: Lucide Filter icon + count. A/B testing removed |
| Export button placement (DFT-002) | ✅ Decided | Will | Jan 29 | Global header (top-right) with shopping cart icon, badge indicator showing total pinned + bookmarked count. Opens unified Export Builder modal |
| Auto-collapse widgets for time-series | ✅ Decided | Will | Jan 29 | Widgets auto-collapse when viewing time-series data (e.g., Dendra pop-ups) to reduce screen crowding. See DFT-005 resolution |
| "Create New View" placement (DFT-003b) | ✅ Decided | Will | Feb 2 | Lives in expanded panel when pinned layer is clicked/active. Expanded panel shows filter summary + action buttons (Edit Filters, Clear, + Create New View). Row spec: [drag] [👁] [Layer Name] [🌪️N] [✕] (no swatch). Active state indicated by expansion + visual treatment. See DFT-003b resolution |
| Filter location clarity (DFT-004) | ✅ Decided | Will | Feb 2 | **Progressive disclosure + direct/parametric separation.** Sidebar is canonical filter editor (context-aware: layer filters when no feature selected, feature filters when drilled in). Pop-up charts have slider only (exploration, ephemeral). Widget shows filter status but does NOT edit. Layer and feature filters are independent after bookmark creation. See DFT-004 resolution |
| Right sidebar default tab (DFT-006) | ✅ Decided | Will | Feb 2 | **Overview tab opens first** when layer is selected. Overview includes prominent "Browse Features →" button for one-click navigation to Browse tab. Consistent behavior across all layers (not context-dependent). Rationale: researchers need layer context (extent, source, methodology, citations) before exploring data. Progressive disclosure pattern. See DFT-006 resolution |
| "Browse Features →" button design (DFT-027) | ✅ Decided | Will | Feb 4 | **Full-width primary button with arrow.** Label: "Browse Features →" (arrow inline with text). Navigates to Browse tab (not modal). Style: TNC green (`#2e7d32`), white text, min 44px height. Placement: bottom of Overview content (top if Overview minimal). Hover: color shift + subtle scale (1.02x). Focus: 2px outline. Transition: 150-200ms ease-out tab switch. Reaffirms always-Overview-first pattern (consistency > context-dependent behavior). Arrow provides redundant signification (Norman), directional cueing (Gestalt), aligns with navigation conventions (Nielsen). Full-width maximizes Fitts's Law. See DFT-027 resolution |
| Bookmark widget structure (DFT-007) | ✅ Decided | Will | Feb 2 | **Bookmarks grouped by parent layer** within widget. Layer headers are non-interactive context labels (muted styling: gray text ~60% opacity, no hover, no buttons/icons). Feature rows remain fully interactive. Addresses UX principles: Conceptual Model, Proximity, Recognition over Recall, Signifiers, Visual Hierarchy. Widget positioned top-right (near right sidebar where feature-level work happens). See DFT-007 resolution |
| Camera trap clustering (DFT-012) | ✅ Decided | Will | Feb 3 | **Count badges on camera icons** showing filtered image counts. Badge appears when layer-level filter is applied in sidebar (Layer View). Click camera icon → sidebar navigates to filtered images. Integrates with progressive disclosure (layer-level query drives badges; feature-level query does not). Applies Norman, Gestalt, Nielsen, Shneiderman, and Tufte design principles. See DFT-012 resolution |
| Multiple filtered views (DFT-013) | ✅ Decided | Will, Amy | Feb 3 | **"Multiple Saved, Single Visible" model.** Users can save multiple filtered views of same layer (e.g., mountain lion AND deer views of Camera Traps), but only ONE view visible at a time (mutual exclusivity). Nested widget structure: single-view layers stay flat; 2+ views promote to parent/child nesting. Parent eye toggle: ON if any child visible, OFF if all hidden. Clicking child row toggles that view's visibility, auto-hides previously visible view. Memory-preserving: parent toggle restores last-selected child. Avoids map badge stacking complexity. 80/20 rule: quick toggling sufficient for MVP; future enhancement could allow limited simultaneous views. See DFT-013 resolution |
| Context-dependent button visibility (DFT-003) | ✅ Decided | Will | Feb 3 | **Button visibility depends on pin/selection state.** "📌 Pin Layer" only appears when layer is NOT pinned; once pinned, filter changes auto-apply (no button needed). "🔖 Bookmark" only appears when a feature is selected. Eliminates side-by-side button confusion. Widget animates when filter changes to provide visual feedback. See DFT-003 resolution |
| ANiML Browse entry point (DFT-003c) | ✅ Decided | Will | Feb 2 | **Landing cards** for Animal-First vs Camera-First choice instead of sub-tabs. Each card includes icon, title, and brief tagline explaining the mental model. User preference remembered for return visits. Mode-switch mechanism (DFT-042): text link above filter section ("Switch to [other mode]"), always visible, confirmation dialog if filters active. Rationale: these represent different user intents, not just different views. See DFT-003c and DFT-042 resolutions |
| Target audience (DFT-011) | ✅ Decided | Trisalyn | Jan 26 | **Primary audience is researchers** (academic, TNC staff), with particular attention to GIS-minded users. NOT targeting broad public. Implication: can use GIS terminology (features, layers, queries) without over-simplification; export workflows can assume technical literacy. See DFT-011 resolution |
| Empty state design (DFT-015) | ✅ Decided | Will | Feb 3 | **Show with placeholder, differentiate first-visit vs returning.** Widgets show educational empty state on first visit (expanded), laconic message after user has used feature. Terminology is configurable via `src/config/terminology.ts` (`childNoun`: "Feature" or "Item"). Widget titles: "Pinned {childNoun} Layers" / "Bookmarked {childNoun}s". Utilitarian tone, simple SVG icons (no emoji). Drone/LiDAR are pin-only (no bookmarkable items). See DFT-015 resolution |
| Desktop-only scope (DFT-016) | ✅ Decided | Will | Feb 3 | **Desktop-only for v2.0, minimum 1280px viewport width.** Below 1280px shows `DesktopOnlyGate` component with explicit messaging. Mockups designed at 1440px. Mobile/tablet responsiveness deferred to v2.1+. Rationale: paradigm requires simultaneous visibility of 6 interaction zones (left sidebar, right sidebar, 2 widgets, map, header); mobile sequential disclosure violates recognition-over-recall principle; target audience is researchers at workstations. Analyzed via Nielsen, Gestalt, Norman principles. See DFT-016 resolution |
| Keyboard navigation & accessibility (DFT-017) | ✅ Decided | Will | Feb 3 | **Baseline accessibility: natural DOM order, standard conventions.** Tab order follows left-to-right, top-to-bottom layout (Left sidebar → Map → Floating widgets → Right sidebar). Escape closes most recently opened element. Focus moves to first interactive element when containers expand. Screen reader announces significant actions only ("Filter applied", "Layer pinned", errors). Comprehensive WCAG audit deferred to Phase 6. Establishes mental model for keyboard workflows. See DFT-017 resolution |
| Edit Filters navigation behavior (DFT-019) | ✅ Decided | Will | Feb 4 | **"Edit Filters →" is a navigation affordance, not in-place editing.** Button labeled with arrow (→), right-aligned in expanded widget panel. Widget panel remains expanded so user can reference filter state. Separation of concerns: Widget manages visibility/stacking order; right sidebar manages deep editing. **Global animation pattern:** All right sidebar tab transitions use crossfade (~150-200ms). Conditional highlight (~200-300ms) on filter section if already on Browse tab. See DFT-019 resolution |
| Pointer-row bookmark button (DFT-020) | ✅ Decided | Will | Feb 4 | **Single "Bookmark" button, auto-captures filter.** Single button for all pointer-row features (ANiML cameras, Dendra sensors, DataOne datasets). Auto-captures current Level 3 filter if active; saves feature-only if no filter. Multiple bookmarks of same feature allowed (each = different "view"). "Edit Filter" action on bookmark widget allows post-save correction. Eliminates Hick's Law friction, aligns with paradigm doc Part 8 ("Want different filter? Bookmark again"), minimizes right sidebar UI complexity. "Save what I see" mental model. See DFT-020 resolution |
| Layer terminology consistency (DFT-021) | ✅ Decided | Will | Feb 4 | **Use "Active" terminology, not "Selected".** Active = layer being inspected (right sidebar), distinct from Visible (on map). A layer can be active but not visible (eye OFF while inspecting data). Clicking layer makes it active AND visible (auto-restores visibility if hidden). Four states: Active (ONE at a time), Visible (multiple), Pinned (multiple), Expanded (ONE at a time). Code: rename `.selected` → `.active`, `selectLayer()` → `activateLayer()`. Eye icon hit targets expanded to 40px column to prevent accidental activation during quick visibility toggling. See DFT-021 resolution |
| Dendra sidebar content at Level 3 (DFT-043) | ✅ Decided | Will | Feb 6 | **Minimal sidebar (filter controls + bookmark only).** Stats appear in pop-up footer with chart, not in sidebar. Sidebar at Level 3 contains: back button, sensor header + actions, filter controls, result count, bookmark button. Pop-up contains: time-series chart, slider, stats footer (Min/Max/Avg/Total), action buttons. Rationale: separation of concerns (sidebar = parametric control, pop-up = visualization + metadata), spatial/cognitive proximity (stats belong with chart), minimalism (Nielsen #8), reduced cognitive load (Miller's Law: sidebar stays at 7 chunks vs 11), reduced split attention, accessibility (logical Tab order), industry conventions (chart metadata lives with chart per Excel/Tableau). Scored 17 green / 0 yellow / 0 red across 9 UI/UX frameworks (Gestalt, Norman, Nielsen, Shneiderman, Cognitive Science, Visual, Accessibility, Behavioral, IA, Motion). See DFT-043 resolution |
| Create New View transition animation (DFT-025) | ✅ Decided | Will | Feb 4 | **Inline transformation with sequential staging (250-300ms).** When "Create New View" is clicked on single-view layer, animation sequence: button press → row expands (0-150ms, `ease-out`) → children appear (150-250ms) → new child highlights (300-500ms, `bg-green-100` fade). Parent styling: subtle background/border, bold text, chevron (▼). Children indented 24px with connecting line. Focus moves to new child row. Screen reader announces state change. Respects `prefers-reduced-motion` (instant change + highlight only). Establishes animation timing standard for structural widget changes. See DFT-025 resolution |
| Zero-result camera behavior (DFT-028) | ✅ Decided | Will | Feb 4 | **Gray out cameras with 0 matching images.** When species filter applied, cameras with zero results show at 40-50% opacity, desaturated color, no badge. Remain clickable and keyboard-accessible. Click shows camera metadata + "No [species] images at this location" message. Animation: 300ms ease-out transition, staggered 30ms per camera. Rationale: preserves spatial context (Gestalt), enables negative evidence discovery (scientific workflow), maintains accessibility (WCAG), reduces cognitive confusion (Nielsen). Alternative options (hiding, "0" badge) rejected for violating continuity, accessibility, and data-ink principles. See DFT-028 resolution |
| Unfiltered layer badge behavior (DFT-029) | ✅ Decided | Will | Feb 4 | **No badges when layer has no filter.** Badges only appear when layer-level filter is applied, making them semantic indicators of filtered query results. Optional fallback: hover tooltip shows total count ("CAM-042: 1,247 images"). Rationale: badges carry information ("filtered results exist here"), clean default for first-time users, consistent with DFT-012 resolution (badges = filtered state), follows Gestalt figure/ground principles (badges stand out when meaningful), aligns with Shneiderman's mantra (overview first, details on demand). See DFT-029 resolution |
| Map tooltip design (DFT-032) | ✅ Decided | Will | Feb 4 | **Minimal MVP approach: ID + Type only.** Use native browser tooltips (`title` attribute) for zero overhead. Format: "CAM-042 • Camera" or "WL-08 • Water Level Sensor". Defer filter-aware content (e.g., "23 mountain lion images") to post-v2.0 after teammate feedback. Rationale: timeline constraints favor shipping simple MVP, better to iterate based on actual usage patterns, native tooltips provide baseline wayfinding with zero implementation cost, extensible for future enhancement. See DFT-032 resolution |
| Right sidebar width (DFT-033) | ✅ Decided | Will | Feb 5 | **Fixed width at 400px (not resizable).** No drag handles or user adjustment. Wide enough for 4-column image grids (ANiML), time-series charts (Dendra), and metadata (iNaturalist) while leaving 60%+ screen for map. Rationale: simplicity serves task (users analyze data, not configure UI), matches GIS conventions (ArcGIS Online), reduces cognitive load (no resize decisions), enables optimized content layout, accessibility-friendly (no drag handles). Edge cases handled via modal/popout (e.g., "Expand Chart"). Optional collapse toggle (binary open/closed) may be added later. Analyzed through 9 UI/UX frameworks. See DFT-033 resolution |
| Drag-and-drop reorder feedback (DFT-034) | ✅ Decided | Will | Feb 5 | **Enhanced lifted row + drop line + settle animation.** Dragged row: 60% opacity, 95% scale, 2deg rotation, dashed border. Drop target: 4px blue line + subtle background highlight. On drop: 400ms settle animation with green highlight. Map z-order feedback: toast notification ("Map layer order updated"). Keyboard support: Arrow keys (up/down), Shift+Home/End (top/bottom), ARIA announcements for screen readers. Rationale: clear visual feedback (Gestalt, Norman), WCAG 2.1.1 keyboard compliance (essential for v2.0), aligns with animation timing standards (400ms = DFT-025, DFT-031), educates users about widget order = map rendering order. Tradeoffs: rejected ghost placeholder, swap animation, live z-order preview as over-engineered for researcher efficiency needs. Analyzed through 9 UI/UX frameworks. See DFT-034 resolution |
| DataOne search behavior (DFT-035) | ✅ Decided | Will | Feb 5 | **Debounced instant search + immediate dropdown filters.** Text search: 500ms debounce, 2+ chars minimum, Enter key bypass. Dropdowns (category, year, author): immediate on change. Initial state loads all datasets (most recent first), eliminating v1 "pre-search" dead state. Pagination: Previous/Next (20 per page). `AbortController` cancels in-flight requests. Loading feedback per DFT-018 thresholds. Empty results: "No datasets match" + "Clear all filters" link. ARIA live region announces count changes. Rationale: continuous feedback (Norman, Nielsen #1), reduced cognitive load (Hick's Law), full-width search input (Fitts's Law), matches ArcGIS Hub conventions (Mental Models). Tradeoff: slight control feeling sacrifice vs. eliminated friction + continuous feedback. 500ms chosen over 300ms due to two-request overhead (count + query). See Phase 4 task 4.3 |
| Feature highlight on bookmark hover (DFT-036) | ✅ Decided | Will | Feb 5 | **Hover-to-highlight for in-viewport features (no auto-pan).** Hovering bookmark row highlights corresponding map feature with cyan ring (4px width, 8px offset), subtle pulse (2 cycles, 800ms). Off-screen features show "📍 Off-screen" text indicator; click [View] button to pan (deliberate action). Keyboard support: highlight follows Tab focus, ARIA announcements for screen readers. Rationale: strong cross-framework convergence (Gestalt, Norman, Nielsen, Cognitive Science, WCAG), matches GIS conventions (ArcGIS Pro, QGIS attribute table ↔ map coordination), instant feedback (<100ms), respects user control (no forced pan). Rejected pan-on-hover (violates exploration principle, disorienting for keyboard users). Deferred enhancements to Phase 6: edge indicators (directional arrows at screen edge), bidirectional highlighting (map → widget). See Phase 0 task 0.6, DFT-036 resolution |
| Filter section anatomy (DFT-038) | ✅ Decided | Will | Feb 5 | **Shared `FilterSection` component** enforces consistent Browse tab filter anatomy across all 4 data sources. Structural skeleton: header row with "Clear All", 2-col CSS grid for controls, result count footer. Container: flat `slate-50` background (no gradients). Header convention: "Filter [Plural Noun]". Controls use `col-span-1` (paired dropdowns) or `col-span-2` (search, dates, multi-selects). Per-data-source control inventory documented. "Optional:" labels dropped (Nielsen #8). Analyzed via Gestalt, Norman, Nielsen, Hick, Miller, IA, Fitts, WCAG. See `design-system.md` Filter Section Patterns |
| Filter apply behavior (DFT-039) | ✅ Decided | Will | Feb 5 | **Auto-apply everywhere — no Apply button in any data source.** Dropdowns fire immediately on change. Text search debounced (500ms, 2+ chars). Date range fields fire on calendar close/blur per field. Toggles/checkboxes fire immediately. `AbortController` cancels in-flight requests. Loading feedback per DFT-018 thresholds. Stale results visible with opacity overlay (not blanked). Result count updates continuously. Dendra `[Apply]` buttons removed from Phase 3. iNaturalist auto-apply explicitly specified in Phase 1. Consistent with DFT-035 (DataOne) and DFT-003 (ANiML). Analyzed via Nielsen #4, Norman Feedback, Hick's Law, Shneiderman, Fitts, WCAG. See `design-system.md` Filter Apply Behavior |
| Dual-level filter visual distinction (DFT-040) | ✅ Decided | Will | Feb 5 | **Condensed `FeatureDetailCard` at Level 3 — no Level 2 summary bar, no separate "Filter [Noun]" header.** Feature header merges with filter actions; controls use DFT-038 grid. Back button is only Level 2 reference. Applies to ANiML (Phase 2) and Dendra (Phase 3). Single-level data sources still use `FilterSection`. See `design-system.md` Dual-Level Filter Pattern |
| Right sidebar Export tab (DFT-041) | ✅ Decided | Will | Feb 6 | **Removed Export tab entirely.** TabBar reduced from 3 tabs to 2 (Overview \| Browse). Export status promoted to Overview tab with actionable shortcuts: "Pin Now" button (unpinned) or "Open Export Builder" link (pinned). Rationale: Export tab was dead-end signpost to modal (Nielsen #8 Minimalism, Fitts's Law), shopping cart badge in header is always visible (better discoverability), 2 tabs reduce cognitive load (Hick's Law), Overview export section visible on default landing screen (DFT-006). Export paradigm is global (modal), not per-layer — tab removal reinforces correct mental model. Analyzed via 12 design principles. See DFT-041 resolution |
| Detail view architecture (DFT-044) | ✅ Decided | Will | Feb 6 | **No shared detail view component. Use shared sub-components + design tokens for consistency.** Purpose-built views: iNaturalist (`ObservationDetailView` — hero image + flat grid), DataOne (`DatasetDetailView` — multi-section hierarchical). Shared scaffolding: `DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`. Architectural principle: consistent structural template (tabs, back button, action row) with flexibility for custom content (hero images, progressive disclosure). Rationale: observations (atomic events) vs datasets (structured resources) are conceptually different types; forcing into shared component creates leaky abstraction (Nielsen #8, Hick's Law); sub-components enforce consistency without sacrificing conceptual clarity (Norman Conceptual Model, IA Mental Models). Analyzed via 11 design principles. See DFT-044 resolution, `design-system.md` Detail View Components |
| Confirmation dialog strategy (DFT-031) | ✅ Decided | Will | Feb 4 | **Hybrid approach: undo for single-item, confirmation for bulk.** Single-item actions (unpin layer, remove bookmark, clear filters, remove cart item) execute immediately with 5-10s undo toast. Bulk actions (clear cart, clear all filters) require custom modal confirmation. Visual hierarchy: small × icons (gray → red hover) for single items, bordered buttons with warning colors for bulk actions. Rationale: frequent actions should be friction-free (Hick's Law, Peak-End Rule), undo superior to confirmation (Norman), bulk operations warrant explicit consent (Loss Aversion), confirmation fatigue avoided. Pattern documented in design-system.md Undo Button section. Replace `window.confirm()` with custom modal component. See DFT-031 resolution |
| Unified loading indicator strategy (Task 34) | ✅ Decided | Will + Claude | Feb 16 | **Local-first loading:** Map Layers eye-slot spinner (w-4 h-4), map overlay only on first load (`!dataLoaded`), legend/sidebar region-specific. Same anatomy across iNaturalist, Dendra, ANiML, future adapters. Canonical spec in `design-system.md` DFT-018. See Cross-Branch Merge Checklist (Loading Indicators) below. |

---

## Code Structure

**Decided:** January 23, 2026

```
src/
├── App.tsx                        ← Router: v2 vs legacy
├── legacy/                        ← Current app (keep for reference)
│   └── LegacyApp.tsx
├── v2/                            ← New paradigm
│   ├── V2App.tsx                  ← New entry point
│   ├── components/
│   │   ├── LeftSidebar/
│   │   ├── RightSidebar/
│   │   │   ├── iNaturalist/
│   │   │   ├── ANiML/
│   │   │   ├── Dendra/
│   │   │   ├── DataOne/
│   │   │   ├── CalFlora/
│   │   │   ├── GBIF/
│   │   │   ├── DroneDeploy/
│   │   │   └── MODIS/
│   │   ├── FloatingWidgets/
│   │   │   ├── PinnedLayersWidget/
│   │   │   └── BookmarkedItemsWidget/
│   │   └── Map/
│   ├── hooks/
│   │   ├── usePinnedLayers.ts
│   │   └── useBookmarks.ts
│   └── store/                     ← If using state management
├── shared/                        ← Reusable across v1/v2
│   ├── services/                  ← animlService, dendraService, etc.
│   ├── types/
│   └── utils/
└── components/                    ← Legacy components
```

---

## Blocking Issues

> List anything preventing progress on any phase.

| Issue | Blocking | Status | Owner | Notes |
|-------|----------|--------|-------|-------|
| Awaiting team feedback on bookmark widget | Phase 0 finalization | ⏳ Waiting | Will | Feedback expected Monday |
| ANiML performance (8-12s load time) | Phase 2 | ⚪ Needs investigation | Dan | See Phase 2 task 2.7 |

---

## Team Responsibilities

| Person | Primary Role | Phases |
|--------|--------------|--------|
| Will | Frontend lead, Cursor orchestration | All phases |
| Dan | Backend, performance, ArcGIS services | Phase 0 (services), Phase 2 (caching) |
| (Others) | Feedback, review | All phases |

---

## Cursor Agent Instructions

When working on any phase:

1. **Before starting a task:**
   - Read the phase document for context
   - Check this master plan for cross-phase decisions
   - Check `design-system.md` for styling decisions

2. **After completing a task:**
   - Update the task status in the phase document
   - Update the remaining task count in this master plan (Phase Status table)
   - If you made a decision that affects other phases, document it in both:
     - The "Cross-Phase Decisions" section above
     - The `design-system.md` file

3. **If you encounter a blocking issue:**
   - Add it to the "Blocking Issues" section above
   - Note it in the phase document

4. **If you make a styling decision:**
   - Document it in `design-system.md` with the rationale
   - Reference the file path where it's implemented

---

## Phase Documents

- **Phase 0:** `docs/IMPLEMENTATION/phases/phase-0-foundation.md`
- **Phase 1:** `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`
- **Phase 2:** `docs/IMPLEMENTATION/phases/phase-2-animl.md`
- **Phase 3:** `docs/IMPLEMENTATION/phases/phase-3-dendra.md`
- **Phase 4:** `docs/IMPLEMENTATION/phases/phase-4-dataone.md`
- **Phase 5:** `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`
- **Phase 6:** `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md`
- **Phase 7:** `docs/IMPLEMENTATION/phases/phase-7-polish.md`
- **Phase 8:** `docs/IMPLEMENTATION/phases/phase-8-calflora.md`
- **Phase 9:** `docs/IMPLEMENTATION/phases/phase-9-gbif.md`
- **Phase 10:** `docs/IMPLEMENTATION/phases/phase-10-dronedeploy.md`
- **Phase 11:** `docs/IMPLEMENTATION/phases/phase-11-modis.md`

---

## Change Log

*Recent entries only. Older entries archived in `docs/archive/phases/` (per-phase) and phase docs.*

| Date | Phase | Change | By |
|------|-------|--------|-----|
| Feb 20, 2026 | Phase 6 | **TF-13 complete.** Multi-layer service detection: removed top-12 discovery cap in `useCatalogRegistry`; all eligible single-row FeatureServer candidates now discovered; dev-mode classification logging added. Coastal and Marine, DP_COASTAL, and all 12+ multi-layer services get service-container UX. Phase 6: 19/23 tasks, 7 remaining. | — |
| Feb 20, 2026 | Phase 6 | **CON-ARCGIS-06, CON-ARCGIS-13 complete.** CON-ARCGIS-06 (Union Pacific Railroad layer ID 0) resolved by TF-11 runtime fallback. CON-ARCGIS-13: left sidebar feature service + child layer right-edge alignment (mr-1, scrollbar overlay). Phase 6: 17/22 tasks. | — |
| Feb 20, 2026 | Phase 6 | **TF-11 complete.** Fix "layer zero not found" for TNC ArcGIS FeatureServer layers (Shrub, Tree, Sensitive Vegetation, Coastal Marine, etc.). Runtime fallback discovers valid layer IDs when initial URL fails. QA passed. | Claude |
| Feb 20, 2026 | Phase 9 | **D20-12 in progress.** media_json parsing, card/detail wiring, overlay scrollbar, dev debug panel. ~2.8k/323k rows have media; coworker may populate more. Optional follow-up: D20-12-FOLLOW "Has media only" filter. | Cursor |
| Feb 20, 2026 | Phase 3 | **D20-06 complete.** Custom polygon draw tool for Dendra: suppressed station click during draw mode; synced sidebar station list with polygon filter so map markers and station cards match. Phase 3: 0 blocking tasks. | Cursor |
| Feb 20, 2026 | Phase 3 | **TF-06 complete.** Renamed left sidebar group "Research and Sensor Equipment" → "Field Sensors" via `CATEGORY_DISPLAY_NAME_OVERRIDE`. Trisalyn QA. | Claude |
| Feb 20, 2026 | Phase 3 | **TF-07 complete.** Removed `dangermond_` prefix from Dendra station tooltip titles; shared `formatStationDisplayName()` normalizes names across map popup, sidebar, chart panels, Map Layers. Trisalyn QA. | Claude |
| Feb 20, 2026 | Phase 0 | **D20-01 complete.** Right sidebar collapse: extruded tab on left edge (PanelRightClose/Open), single margin-right animation, localStorage persistence, 300ms transition. Header X close and Collapse button removed. Implemented in V2App + RightSidebar. | Codex |
| Feb 20, 2026 | Phase 10 | **TF-10 complete.** DroneDeploy browse project cards now use subtle gray default background (`bg-gray-50`) with darker gray hover (`bg-gray-100`) for project switcher visual polish. Phase 10 remaining updated to 0 (complete). | Codex |
| Feb 20, 2026 | Docs | **Dan meeting tasks distributed to phase docs.** Extracted tasks from `extracted-tasks-dan-feedback-feb-20-2026.md` spread across Phase 3 (Dendra), 4 (DataOne), 5 (Export Builder), 6 (TNC ArcGIS), 7 (Polish), 9 (GBIF) by data source. D20-01 through D20-14, D20-B01–B05, D20-BL01–BL03 now tracked in respective phase Quick Task Summary tables. | Claude |
| Feb 20, 2026 | Phase 4 | **CON-DONE-02 complete.** Auto-pan/zoom on dataset detail open; "View on Map" repurposed as "Recenter". Zoom 16 + cluster maxScale 12_000 so selected dataset breaks out of cluster and shows as dot. Card click calls activateLayer for map sync. Next: CON-DONE-03. | Assistant |
| Feb 20, 2026 | Phase 4 | **CON-DONE-16 complete.** Grid binning (FeatureReductionBinning): scale thresholds tuned (~1 level coarser); `view.watch('stationary', ...)` eliminates bin blink during wheel zoom; "Where to Fine-Tune" documented. Next: CON-DONE-02. | Assistant |
| Feb 20, 2026 | Phase 4 | **CON-DONE-01 complete.** Cluster click populates sidebar; race condition fix (queryFeatures + populate-version guard) resolved count desync. **CON-DONE-16 added:** Switch from circular clustering to grid binning (FeatureReductionBinning) — next task. | Assistant |
| Feb 19, 2026 | Phase 10 | **CON-DRONE-02 complete.** Simplify project flights UI: compact name/date cards, card click syncs map + toggles metadata, caret-only disclosure, animated expand/collapse, removed Selected/Visible/reorder controls. | Claude |
| Feb 19, 2026 | Phase 10 | **CON-DRONE-01 complete.** Drone imagery flight toggle bug fix: single-flight replacement, auto-load default, WMTS 404 fallback. | Claude |
| Feb 19, 2026 | Phase 6 | **CON-ARCGIS-14 complete:** Unified Service Workspace — service/layer click auto-selects sublayer; map + Map Layers widget sync; right-sidebar layer list with amber active highlight, pin/eye icons, inline pin/unpin; "Inspect Current Layer" CTA. | — |
| Feb 19, 2026 | Phase 6 | **CON-ARCGIS-10, 11, 12 complete:** Right sidebar hierarchy relabel (Feature Service, Current Layer), section rename to "Feature Service Overview", single scrollable layer list. | — |
| Feb 19, 2026 | Phase 6 | **CON-ARCGIS-09 complete:** Left sidebar layer row clipping fixed. ServiceGroup row wrapper changed from `w-full ml-1 mr-1` to `mx-1 min-w-0` for consistent right margin and no overflow. | — |
| Feb 19, 2026 | Phase 6 | **CON-ARCGIS-08 complete:** Left sidebar overlay scrollbar (no gutter, custom thumb on scroll/hover). **CON-ARCGIS-13 added:** Align feature service + child layer right edges to match other layers. | — |
| Feb 19, 2026 | Phase 9 | **Tasks 9.11 complete + 9.12 added + GBIF media fallback.** Map: viewport SQL + zoom sampling; fixed webMercatorUtils import. Detail: GBIF API media fallback when ArcGIS lacks primary_image_url. Task 9.12 (backend aggregation) deferred to v2.1+. Phase 9: 10/12 tasks done. | Cursor |
| Feb 19, 2026 | Phase 9 | **Task 9.10 complete.** Fixed GBIF map rendering (explicit `gbifLayer.ts` + `dataset-178` in `createMapLayer`); added card thumbnails from `primary_image_url`. Phase 9: 8/10 tasks done. Remaining: 9.8 (Save View), 9.9 (extent expansion) — deferred. | Cursor |
| Feb 19, 2026 | Phase 9 | **Tasks 9.1-9.7 complete.** GBIF ArcGIS service discovery complete (`dataset-178`), right-sidebar overview/browse/detail shipped, server-side filter + pagination, map click-to-detail wired. Remaining: 9.8-9.9. | Cursor |
| Feb 19, 2026 | Phase 3 | **CON-DENDRA-03 complete.** Multi-stream selection across stations: stream-name filtering, in-detail station switcher, no reset requirement. | Cursor |
| Feb 19, 2026 | Phase 3 | **CON-DENDRA-02 complete.** Multi-panel Dendra time series charts: draggable/resizable/minimizable, map-constrained, bottom-right placement, persistence across layer/pin transitions, visibility tied to pinned layer/view. | Cursor |
| Feb 19, 2026 | Phase 3 | **CON-DENDRA-01 complete.** Map↔sidebar two-way station sync, station header flash, Edit Filters fix, Stations header, parallel sidebar activation on map click. | Cursor |
| Feb 19, 2026 | Phase 1 | **CON-INAT-06 complete:** Species/taxa ordering (count default, A-Z toggle) already implemented in CON-INAT-01. CON-INAT-04 won't do (iNaturalist coordinate obfuscation). Remaining: 1 task (CON-INAT-07). | — |
| Feb 19, 2026 | Phase 1 | **CON-INAT-03 complete:** Added browse result-count row in iNaturalist right sidebar (e.g., "92 observations"). | — |
| Feb 19, 2026 | Phase 1 | **CON-INAT-02 complete:** Species hierarchy flow (taxa→species→observations). Removed redundant top species search; renamed "Filter Observations" to "Filter Taxa". | — |
| Feb 19, 2026 | Phase 1 | **CON-INAT-01 complete:** Species-level filtering (full scientific names, species search, count/alphabetical sort, map/pinned-view sync). Common/Latin toggle dropped. | — |
| Feb 20, 2026 | Phase 2 | **TF-01 complete (ANiML):** Min height 300px for `#animl-image-list-scrollable` (prevents zoom collapse); EditFiltersCard overflow-visible; right-sidebar hover-only overlay scrollbar. Trisalyn QA. | Claude |
| Feb 19, 2026 | Phase 2 | **Task 2.18 complete: Synchronize matching images with map/layer counts.** Server-side image pagination; shared filteredImageCount for map, layer badge, and browse totals; QA passed. Phase 2 ANiML complete. | Claude |
| Feb 19, 2026 | Phase 2 | **CON-ANIML-06 complete: Retry for image labels API errors.** Auto-retry (429/502/503/504) with backoff; manual Retry button when exhausted; no full reload. | Claude |
| Feb 19, 2026 | Phase 2 | **CON-ANIML-05 complete: Map badge UI for large counts.** Dynamic pill badge with white outline; extra padding for 999+; no clipping; QA passed. | Claude |
| Feb 19, 2026 | Phase 2 | **CON-ANIML-04 complete + SpatialQuerySection refinements.** Explicit Remove Polygon CTA; removed redundant copy; matched filter-section card styling (border, bg-slate-50 header). Added CON-ANIML-06: Retry button for image labels API errors. | Will + Claude |
| Feb 18, 2026 | Docs | **Archive + consolidation.** Merged development-task-tracker into master-plan. Master-plan now high-level only (phase counts, no task lists). Completed tasks archived. development-task-tracker.md removed. | Claude |
| Feb 17, 2026 | Phase 3 | **Phase 3 Dendra status corrected.** Phase doc showed "Not Started" but Dendra was fully implemented. Updated to 🟢 Complete. | Claude |
| Feb 16, 2026 | Phase 10 | **DroneDeploy left-sidebar project click loads imagery.** Left-sidebar project select now calls DroneDeploy context so WMTS tiles load on map. | Claude |
| Feb 16, 2026 | Phase 6 | **Task 6.15 complete: TNC ArcGIS Legend Iconography Parity + Symbol-Aware Filtering.** | Claude |
| Feb 13, 2026 | Phase 2 | **Phase 2 Tasks 2.3–2.6, 2.13–2.15 complete: ANiML multi-dimensional filter, expanded image view, arrow key nav, image→map highlight.** | Will + Claude |
| Feb 12, 2026 | Phase 0 | **Data Source Adapter Pattern** — Plugin architecture for parallel branch development. | Will + Claude |
