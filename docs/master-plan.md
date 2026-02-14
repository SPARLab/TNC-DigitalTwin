# Master Development Plan - V2 Digital Catalog

**Created:** January 23, 2026  
**Last Updated:** February 13, 2026  
**Target Deadline:** February 20, 2026  
**Status:** 🟡 Planning

---

## Overview

This document is the single source of truth for the V2 Digital Catalog paradigm shift. It tracks phase status, cross-phase decisions, and blocking issues.

**The Paradigm Shift:**
- **Left sidebar:** Persistent layer browser (find and pin layers)
- **Right sidebar:** Layer workspace (browse, query, bookmark, export)
- **Floating widgets:** Pinned Layers (top-left) + Bookmarked Features (top-right)
- **Map:** Shows all pinned layers simultaneously

**Key Reference Documents:**
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockups: `mockups/02a-02f` (unified layout, data source browse views, export builder)
- Previous mockup plan: `docs/01-implementation-plan/archive/v2-pin-bookmark-export-mockup-plan.md`
- Future enhancements: `docs/PLANNING/future-enhancements.md` (v2.1+ feature backlog)

---

## Phase Status

| Phase | Name | Status | Progress | Branch | Blocking? |
|-------|------|--------|----------|--------|-----------|
| 0 | Foundation | 🟡 In Progress | ~98% | `v2/foundation` | YES - blocks all |
| 1 | iNaturalist | 🟢 Complete | 5 / 5 tasks | `v2/inaturalist` | No |
| 2 | ANiML | 🟡 In Progress | 9 / 14 tasks | `v2/animl` | No |
| 3 | Dendra | ⚪ Not Started | 0 / 6 tasks | `v2/dendra` | No |
| 4 | DataOne | ⚪ Not Started | 0 / 5 tasks | `v2/dataone` | No |
| 5 | Export Builder | ⚪ Not Started | 0 / 4 tasks | `v2/export` | No |
| 6 | Polish & Consistency | ⚪ Not Started | 0 / 7+ tasks | `v2/polish` | No |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Ready to Start (adapter pattern complete, no blockers)
- 🟢 Complete
- 🔴 Blocked

---

## Phase Dependencies

```
Phase 0: Foundation
    │
    ├──► Phase 1: iNaturalist ──────────────────────────┐
    │                                                    │
    ├──► Phase 2: ANiML ────────────────────────────────┤
    │                                                    │
    ├──► Phase 3: Dendra ───────────────────────────────┼──► Phase 5: Export Builder ──► Phase 6: Polish
    │                                                    │
    └──► Phase 4: DataOne ──────────────────────────────┘
```

**Parallelization:**
- Phases 1-4 can be worked on simultaneously (different Cursor windows, different branches) — **PAUSED until Task 0.9 complete**
- Task 0.9 (Dynamic Layer Registry from Data Catalog Service) is foundational; must merge to main before parallel branches continue
- Each phase has its own branch, merged to `v2/main` when complete
- Phase 5 requires all data sources to be functional
- Phase 6 is the final consistency pass

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
| Dynamic layer registry from Data Catalog Service | ✅ Decided | User + Claude | Feb 12 | Replace static `layerRegistry.ts` with dynamic fetch from Dan's Data Catalog FeatureServer (`Dangermond_Preserve_Data_Catalog`). ~90+ real datasets across 14 categories. Left sidebar populated from catalog. Layers without adapters show "Not Yet Implemented" toast. **Blocks all parallel branches until Task 0.9 complete.** See `docs/development-task-tracker.md` Task 24. |
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
│   │   │   └── DataOne/
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
   - Update the phase progress in this master plan
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
- **Phase 6:** `docs/IMPLEMENTATION/phases/phase-6-polish.md`

---

## Change Log

| Date | Phase | Change | By |
|------|-------|--------|-----|
| Feb 13, 2026 | Phase 1 | **Task 28 complete: iNaturalist detail view crash fixed.** Hook-order mismatch (early return before hooks) caused "Rendered fewer hooks than expected." Moved detail-view return after all hooks; hardened handleViewOnMap with try/catch and coordinate validation. RightSidebar auto-switches to Browse when map observation clicked. Phase 1 all tasks complete. | Claude |
| Feb 13, 2026 | Phase 1 | **Phase 1 iNaturalist complete.** All 13 granular tasks done including Tasks 26–27 (dynamic view names, user-renamable filtered views). Cross-branch merge contract documented. | User + Claude |
| Feb 13, 2026 | All | Added cross-layer filtered-view naming decision: universal manual rename in shared Map Layers logic with per-data-source auto-naming algorithms. Documented as an incremental branch rollout contract to avoid regressions during parallel merges. | User + Claude |
| Feb 12, 2026 | Phase 0 | **Data Source Adapter Pattern** — Refactored architecture to enable parallel branch development. Created plugin system: each data source implements `DataSourceAdapter` interface. Core files (MapContainer, RightSidebar, useMapLayers) now data-source-agnostic — read from registry instead of hardcoding imports. **Lazy caching:** `warmCache()` pattern replaces eager on-mount fetch (iNaturalist: 2.18s initial, instant on revisit). Active-but-not-pinned layers now visible on map. Merge conflict surface reduced to ~4 one-liners in registry.ts per new source. Files: `src/v2/dataSources/{types.ts, registry.ts, inaturalist/{adapter.tsx, useMapBehavior.ts}}`. Ready for parallelization. | Will + Claude |
| Feb 5, 2026 | All | Added Sidebar Template System — shared structural templates for all data sources (TabBar, OverviewTab, ResultCard, Pagination, LeftSidebar categories). Theme tokens centralized in `sidebarTheme`. Change once, changes everywhere. Resolved stale entries: bookmark widget (DFT-007), filter representation (DFT-024). Resolved styling TBDs: sidebar header, card component. See design-system.md | Will + Claude |
| Feb 5, 2026 | All | Resolved DFT-038: Filter section anatomy — shared `FilterSection` component enforces consistent Browse tab filter UI across all 4 data sources. Structural skeleton: header with "Clear All", 2-col CSS grid, result count footer. Flat `slate-50` container (no gradients). Header convention: "Filter [Plural Noun]". Per-data-source control inventory. "Optional:" labels dropped. Analyzed via Gestalt, Norman, Nielsen, Hick, Miller, IA, Fitts, WCAG. See design-system.md | Will + Claude |
| Feb 5, 2026 | Phase 4 | Resolved DFT-035: DataOne search behavior — debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Enter key bypass. Initial state loads all datasets, eliminating "pre-search" state. `AbortController` cancels in-flight requests. Analyzed via Norman, Nielsen, Shneiderman, Hick, Fitts, Mental Models, Wayfinding, Accessibility | Will + Claude |
| Feb 5, 2026 | Phase 0 | Resolved DFT-034: Drag-and-drop reorder feedback — enhanced visual treatment (60% opacity, 95% scale, 2deg rotation, dashed border), 4px drop line, 400ms settle animation, toast for map z-order updates, keyboard support (arrow keys, Shift+Home/End), ARIA announcements. Keyboard support essential for v2.0 WCAG compliance (not deferred) | Will + Claude |
| Feb 5, 2026 | - | Resolved DFT-033: Right sidebar width — fixed 400px (not resizable). Analyzed through 9 UI/UX frameworks. Simplicity serves task, matches GIS conventions, reduces cognitive load | Will + Claude |
| Feb 4, 2026 | - | Resolved DFT-031: Confirmation dialog strategy — hybrid approach (undo for single-item, confirmation for bulk). Documented in design-system.md Undo Button Pattern section | Will + Claude |
| Jan 23, 2026 | - | Created master plan and phase documents | Will + Claude |
| Jan 27, 2026 | Phase 0 | Resolved DFT-001: Pin vs visibility behavior (Model C adopted) | Will + Claude |
| Jan 27, 2026 | Phase 0 | Added A/B testing for filter representation (text vs funnel emoji) | Will + Claude |
| Jan 29, 2026 | Phase 0, 5 | Resolved DFT-002: Export button placement (global header with shopping cart) | Will + Claude |
| Jan 29, 2026 | Phase 0 | Resolved DFT-005: Auto-collapse widgets when viewing time-series data | Will + Claude |
| Feb 2, 2026 | Phase 0 | Resolved DFT-003b: "Create New View" lives in expanded panel when layer is active | Will + Claude |
| Feb 2, 2026 | Phase 0 | Removed swatch from widget row spec; active state indicated by expansion + visual treatment | Will + Claude |
| Feb 2, 2026 | Phase 0, 3 | Resolved DFT-004: Progressive disclosure in sidebar + pop-up slider for exploration only. Sidebar edits filters, widget shows status | Will + Claude |
| Feb 2, 2026 | Phase 0 | Resolved DFT-007: Bookmarked Features widget groups features by parent layer; layer headers are non-interactive context labels | Will + Claude |
| Feb 3, 2026 | Phase 2 | Resolved DFT-012: Camera trap clustering with numbered badges on camera icons showing filtered image counts. Layer-level filter drives badge display | Will + Claude |
| Feb 3, 2026 | Phase 0 | Resolved DFT-013: Multiple filtered views — "Multiple Saved, Single Visible" model with nested widget structure. Mutual exclusivity prevents map badge stacking complexity | Will + Claude |
| Feb 3, 2026 | - | Created future-enhancements.md backlog for v2.1+ features. Moved DFT-014 (biodiversity aggregation) to backlog | Will + Claude |
| Feb 3, 2026 | Phase 6 | Resolved DFT-008, DFT-009: TNC brand integration via theme variants approach. Add fonts + create swappable theme options for experimentation | Will + Claude |
| Feb 3, 2026 | Phase 2 | Resolved DFT-003: Context-dependent button visibility. "Pin Layer" only shows when not pinned; "Bookmark" only shows when feature selected | Will + Claude |
| Feb 3, 2026 | - | Documentation sync: Added missing UX Decisions (DFT-003, DFT-003c, DFT-011) to master plan; updated phase changelogs | Will + Claude |
| Feb 3, 2026 | - | Established No Emojis Policy: Use SVG icons instead of emojis for consistent cross-browser rendering. Resolved DFT-026. Created design-system.md and Cursor rule | Will + Claude |
| Feb 3, 2026 | Phase 0 | Resolved DFT-015: Empty state design — show with placeholder, differentiate first-visit (educational) vs returning (laconic). Configurable terminology via config file ("Feature" vs "Item"). Drone/LiDAR are pin-only | Will + Claude |
| Feb 3, 2026 | - | Resolved DFT-016: Desktop-only scope — minimum 1280px viewport width. Mobile/tablet responsiveness deferred to v2.1+. Mockups designed at 1440px. Based on Nielsen, Gestalt, Norman analysis | Will + Claude |
| Feb 3, 2026 | Phase 6 | Resolved DFT-017: Keyboard navigation & accessibility — baseline accessibility principles established. Natural DOM order for tab navigation, Escape closes most recent element, focus moves to first interactive element on expand. Full WCAG audit deferred to Phase 6 | Will + Claude |

| Feb 4, 2026 | Phase 0 | Resolved DFT-020: Pointer-row bookmark UI — single "Bookmark" button pattern. Auto-captures filter if active. Multiple bookmarks = multiple views of same feature. "Edit Filter" action on bookmark widget for post-save correction | Will + Claude |
| Feb 4, 2026 | All | Resolved DFT-021: Terminology consistency — Use "Active" (not "Selected") for layer working state. Active ≠ Visible: layer can be active (right sidebar) but hidden (eye OFF). Clicking layer makes it active AND visible. Expanded eye icon hit targets (40px) to prevent accidental activation | Will + Claude |
| Feb 4, 2026 | Phase 0 | Resolved DFT-024: Filter indicator design — icon-based approach adopted (Lucide Filter icon + count). Single-line rows improve scannability; tooltip bridges learnability gap. Removed A/B testing toggle from implementation plans | Will + Claude |
| Feb 4, 2026 | Phase 0 | Resolved DFT-025: Create New View transition animation — inline transformation with sequential staging (250-300ms). Row expands → children appear → new child highlights. Respects `prefers-reduced-motion`. Focus moves to new child. Establishes animation timing standard for structural widget changes | Will + Claude |
| Feb 4, 2026 | Phase 2 | Resolved DFT-028: Zero-result camera behavior — cameras with 0 matching images are grayed out (not hidden). 40-50% opacity, desaturated, no badge. Remain clickable/keyboard-accessible. 300ms ease-out transition. Preserves spatial context for negative evidence discovery. Analyzed via 9 Pillars framework | Will + Claude |
| Feb 4, 2026 | Phase 2 | Resolved DFT-029: Unfiltered layer badge behavior — no badges when layer has no filter. Badges only appear when layer-level filter is applied, making them semantic indicators. Optional hover tooltip shows total counts. Follows Gestalt figure/ground and Shneiderman's overview-first principles | Will + Claude |
| Feb 4, 2026 | All | Resolved DFT-030: Error state design — severity-based hierarchy (critical modal, regional inline, partial banner, action toast). Toast placement at top of right sidebar avoids map legend conflict. Utilitarian tone, always actionable (Retry/Go Back/Dismiss). Analyzed via Nielsen #9, Norman feedback, Gestalt proximity, WCAG accessibility | Will + Claude |

| Feb 4, 2026 | All | Resolved DFT-031: Confirmation dialogs pattern — no confirmation dialogs. Context-specific undo buttons instead. Each widget/region has persistent undo button in header (always visible, grayed when inactive). Stack size: 5 actions per region (single-level for v2.0). Cmd+Z / Ctrl+Z support in Phase 6. Analyzed via Norman, Nielsen, Gestalt, behavioral science | Will + Claude |
| Feb 5, 2026 | All | Resolved DFT-033: Right sidebar width — fixed at 400px (not resizable). No drag handles. Affects all right sidebar implementations (Phases 1-4). Rationale: simplicity serves task, matches GIS conventions, reduces cognitive load, enables optimized content layout, accessibility-friendly. Edge cases handled via modal/popout. Analyzed through 9 UI/UX frameworks | Will + Claude |
| Feb 5, 2026 | Phase 0 | Resolved DFT-036: Feature highlight on bookmark hover — hover-to-highlight for in-viewport features. Cyan ring (4px, 8px offset), subtle pulse. Off-screen features show text indicator. Keyboard support, ARIA announcements. Strong cross-framework convergence. Matches GIS conventions. Deferred: edge indicators, bidirectional highlighting | Will + Claude |
|| Feb 5, 2026 | Phase 2, 3 | Resolved DFT-040: Dual-level filter visual distinction — condensed `FeatureDetailCard` at Level 3. Dropped Level 2 summary bar (irrelevant). Merged feature header + filter controls. Back button is only Level 2 reference. Updated Phase 2 Task 2.4 and Phase 3 Tasks 3.5/3.6 ASCII diagrams. Added Dual-Level Filter Pattern to design-system.md | Will + Claude |
|| Feb 6, 2026 | All | Resolved DFT-041: Right sidebar Export tab — removed Export tab entirely. TabBar reduced from 3 tabs to 2 (Overview \| Browse). Export status promoted to Overview tab with actionable shortcuts ("Pin Now" button / "Open Export Builder" link). Rationale: Export tab was dead-end signpost to modal; shopping cart badge provides always-visible export awareness; 2-tab layout reduces cognitive load. Analyzed via 12 design principles (Nielsen #8, Hick's Law, Norman, IA Redundancy, Fitts's Law). Updated right-sidebar-template.md, right-sidebar-inaturalist.md, master-plan.md. Created resolution summary | Will + Claude |
|| Feb 6, 2026 | Phase 1, 4 | Resolved DFT-044: Self-contained row detail view component — no shared detail view component. Extract shared sub-components (`DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`) + design tokens for consistency. Purpose-built detail views for iNaturalist (hero image + flat grid) and DataOne (multi-section hierarchical). Architectural principle: consistent structural template (tabs, scaffolding) with flexibility for custom content. Rationale: observations (atomic events) vs datasets (structured resources) are conceptually different types; forcing into shared component creates leaky abstraction. Analyzed via 11 design principles (Nielsen #4/#8, Norman Conceptual Model, Hick's Law, IA Mental Models). Updated right-sidebar-template.md with sub-component specs, design-system.md with Detail View Components section, master-plan.md Cross-Phase Decisions. See DFT-044 resolution | Will + Claude |
|| Feb 6, 2026 | Phase 3 | Resolved DFT-043: Dendra sidebar body at Level 3 — minimal sidebar (filter controls + bookmark only). Stats appear in pop-up footer with chart (not sidebar). Rationale: separation of concerns (sidebar = parametric control, pop-up = visualization + metadata), spatial/cognitive proximity (stats belong with chart), minimalism (Nielsen #8), reduced cognitive load (Miller's Law), reduced split attention, accessibility (logical Tab order), industry conventions (chart metadata lives with chart). Scored 17 green / 0 yellow / 0 red across 9 UI/UX frameworks. Updated Phase 3 Task 3.5, right-sidebar-template.md, master-plan.md UX Decisions | Will + Claude |
|| Feb 6, 2026 | Phase 0, 4 | Resolved DFT-045: Left sidebar DataOne taxonomy — hybrid model (standalone category + explicit shortcut rows). DataOne lives under "Research Datasets" category as canonical location. Special shortcut rows appear in expanded domain categories (Species, Fire, etc.) labeled "DataOne Datasets (count)" with books icon. Clicking shortcut activates DataOne with domain pre-filtered. Improves discoverability for domain-first users. Explicit "DataOne" label (not generic) supports future multi-repo expansion (Dryad, Zenodo). Analyzed via 9 design frameworks (Findability, Mental Models, Consistency, Recognition, Conceptual Model, Progressive Disclosure, Wayfinding, Implementation Complexity, Cognitive Load). Updated left-sidebar.md (State 9), phase-4-dataone.md (Task 4.2), master-plan.md. Created resolution summary | Will + Claude |
| Feb 13, 2026 | Phase 2 | **Phase 2 Task 2.15 complete: ANiML image click → highlight camera on map.** AnimlFilterContext: focusedDeploymentId, focusDeployment(), clearFocusedDeployment(). ImageList: onImageFocus callback on click and arrow-key navigation. useAnimlMapBehavior: ArcGIS layerView.highlight() for focused camera. animlLayer: getAnimlCameraGraphicByDeploymentId() helper (2.16-ready). | Will + Claude |
| Feb 13, 2026 | Phase 2 | **Phase 2 Tasks 2.13, 2.14 complete: ANiML expanded image view + arrow key navigation.** ImageExpandedView.tsx: click thumbnail → larger view in sidebar, metadata (species, date, camera), Back to list, overlay + bottom nav. Arrow keys (←/→) and Prev/Next navigate; Esc closes. Auto-pagination: crossing page boundary (e.g. image 20→21) advances page and stays in expanded view (DFT-049). | Will + Claude |
| Feb 13, 2026 | Phase 2 | **Phase 2 Tasks 2.3–2.6 complete: ANiML Browse tab multi-dimensional filter system.** FilterSection (expandable, multi-select, Select All/Clear All), AnimlFilterContext (selectedCameras, filteredImageCount), live result count, ImageList. Researchers can select multiple species AND cameras. Added Tasks 2.10 (right sidebar scrollbar — prevent content shift) and 2.11 (date/time frame filter above Species and Cameras). | Will + Claude |
| Feb 12, 2026 | Phase 2 | **Phase 2 (ANiML) marked Ready to Start.** Data Source Adapter Pattern (Phase 0 Task 23) complete. Merge conflict surface: ~11 lines across 3 shared files. Added comprehensive implementation guide to phase-2-animl.md with 8-step instructions, testing checklist, and common pitfalls. Reference implementations documented (iNaturalist adapter, context, map layer, legend). | Will + Claude |
