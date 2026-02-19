# Phase 2: ANiML Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 5 / 7 tasks (completed tasks 2.1–2.17 archived)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-2-animl-completed.md`  
**Branch:** `v2/animl`  
**Depends On:** Phase 0 (Foundation) — Data Source Adapter Pattern ✅ Complete  
**Owner:** TBD

---

## ✅ Readiness Assessment (Feb 12, 2026)

**The adapter pattern is ready for parallel development.** All core architecture is in place:

### What's Already Complete
- ✅ `DataSourceAdapter` interface defined (`src/v2/dataSources/types.ts`)
- ✅ Registry with commented placeholders for Animl (`src/v2/dataSources/registry.ts`)
- ✅ Layer catalog entry (`animl-camera-traps` in `layerRegistry.ts`)
- ✅ Type system includes `'animl'` data source
- ✅ iNaturalist reference implementation (complete working example)
- ✅ Existing v1 service layer (`src/services/animlService.ts` — 1,512 lines, fully functional)

### Merge Conflict Surface
**Only ~11 lines across 3 shared files:**
- `src/v2/dataSources/registry.ts` — uncomment 6 lines (imports + map + hooks)
- `src/v2/components/Map/layers/index.ts` — add `animl-camera-traps` case (~3 lines)
- `src/v2/V2App.tsx` — wrap with `<AnimlFilterProvider>` (~2 lines)

### Files to Create (No Shared File Conflicts)
All work is isolated in new directories:
- `src/v2/context/AnimlFilterContext.tsx` (cache + filter state)
- `src/v2/dataSources/animl/adapter.tsx`
- `src/v2/dataSources/animl/useMapBehavior.ts`
- `src/v2/components/Map/layers/animlLayer.ts`
- `src/v2/components/RightSidebar/ANiML/*.tsx` (6 files)
- `src/v2/components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget.tsx`

### Recommended Build Order
1. **AnimlFilterContext** — Data fetching, caching, filter state (foundation)
2. **Animl Adapter + Registry wiring** — Uncomment registry entries
3. **Animl Map Layer** — Camera trap icons with badges
4. **Animl Overview Tab** — Simple metadata display
5. **Animl Browse Tab (shell)** — Landing cards (Animal-First vs Camera-First)
6. **Animl Legend Widget** — Species filter floating widget
7. **Camera List + Detail views** — Full browse experience

Items 3-6 can be done in parallel once items 1-2 are complete.

### Reference Implementations
- iNaturalist adapter: `src/v2/dataSources/inaturalist/adapter.tsx`
- iNaturalist context: `src/v2/context/INaturalistFilterContext.tsx`
- iNaturalist map layer: `src/v2/components/Map/layers/inaturalistLayer.ts`
- iNaturalist legend: `src/v2/components/FloatingWidgets/INaturalistLegendWidget/`

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction. Task 2.7 (caching investigation) is particularly important to validate.

---

## Phase Goal

Implement the ANiML camera trap browse experience in the right sidebar. This is the **most complex** data source because it has:
- **Pointer rows** (cameras point to image archives)
- **Dual-level filtering** (camera filters + global image filters at layer level)
- **Level 3 related data** (images with species tags, dates)

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 5b - ANiML Special Case)
- Mockup: `mockups/02c-browse-animl.html`

## Key Paradigm Notes

- **Row Type:** Pointer (camera points to image archive)
- **Bookmark Options:** "Bookmark Camera" OR "Bookmark with Filter"
- **Has Level 3:** Yes - images with species, date, time of day
- **Special:** Dual-level filtering at layer browse level (unique to ANiML)

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-ANIML-01 | 🟢 Complete | Feb 19, 2026 | Map click on camera trap auto-selects sidebar camera and shows images | Map click + sidebar sync; spatial-query camera auto-select/prioritization; QA passed |
| CON-ANIML-02 | ⚫ Won't Do | Feb 19, 2026 | Rename "Mountain lion" to "Puma" | Deferred: current label comes from ANiML source data; taxonomy decision needed |
| CON-ANIML-03 | 🟢 Complete | Feb 19, 2026 | Sort cameras by result count (data-rich first, zero-data last) | Comparator in AnimlBrowseTab; zero-result cameras sink to bottom |
| CON-ANIML-04 | 🟢 Complete | Feb 19, 2026 | Add explicit "Remove Polygon" CTA in spatial query panel | Replaced tiny header Clear action with explicit button-style Remove Polygon CTA |
| CON-ANIML-05 | 🟢 Complete | Feb 19, 2026 | Improve map badge UI for large counts (e.g., 999+) | Dynamic pill badge, white outline, extra padding for 999+; no clipping; QA passed |
| CON-ANIML-06 | 🟢 Complete | Feb 19, 2026 | Add Retry button when image labels API error occurs (e.g. 503) | Auto-retry (429/502/503/504 backoff) + manual Retry button; QA passed |
| 2.18 | ⚪ Not Started | Feb 18, 2026 | Synchronize matching images results with map/layer counts | Existing open ANiML bug |

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| CON-ANIML-01 | Map click camera -> sidebar sync + images | 🟢 Complete | | Map click handler + browse camera auto-select + spatial polygon camera auto-selection; QA passed |
| CON-ANIML-02 | Rename Mountain lion label to Puma | ⚫ Won't Do | | Deferred to backlog: requires taxonomy/product decision (ANiML source label governance) |
| CON-ANIML-03 | Sort cameras by result count descending | 🟢 Complete | | Data-rich first, zero-data last; preserves spatial-polygon priority |
| CON-ANIML-04 | Add explicit "Remove Polygon" CTA in spatial query panel | 🟢 Complete | | Replaced tiny "Clear" text action with explicit Remove Polygon button in SpatialQuerySection |
| CON-ANIML-05 | Improve map camera badge legibility for high counts (999+) | 🟢 Complete | | Dynamic pill badge with white outline; extra padding for 999+; no clipping; QA passed |
| CON-ANIML-06 | Add Retry button when image labels API error occurs | 🟢 Complete | | Auto retry (429/502/503/504) + manual Retry button in `AnimlBrowseTab`; QA passed |
| 2.18 | Synchronize matching images results with map/layer counts | ⚪ Not Started | | Map shows 605, matching images/layer show 200 — counts out of sync for species+camera filter |

*Completed tasks 2.1–2.17 have been archived. See `docs/archive/phases/phase-2-animl-completed.md`.*

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked
- ⚫ Won't Do

---

## Backlog (Needs Product/Taxonomy Decision)

| ID | Last Updated (Timestamp) | Backlog Item | Notes |
|----|---------------------------|--------------|-------|
| ANIML-BACKLOG-01 | Feb 19, 2026 | Resolve species label policy for Puma vs Mountain Lion terminology | Current frontend uses ANiML labels as-is. "Puma" may be semantically weaker for some users than "Mountain Lion." Requires stakeholder decision on display taxonomy and whether normalization belongs upstream, in a shared mapping layer, or only in UX copy/help text. |

## Task Details

### CON-ANIML-06: Add Retry Button When Image Labels API Error Occurs

**Goal:** When the image labels API fails (e.g. 503 "User couldn't access this resource 'animl.mapserver'"), show a Retry button so users can re-attempt the request without reloading the page.

**Problem:** AnimlBrowseTab displays an error message when `queryImageLabelsCached` fails, but the only recovery path is a full page reload.

**Acceptance Criteria:**
- [x] When image fetch fails, error UI includes a visible "Retry" button
- [x] Clicking Retry re-runs the same query (same filters: species, cameras, date range)
- [x] No full page reload required

**Implementation Notes (Feb 19, 2026):**
- Added automatic retry for retryable HTTP failures (`429`, `502`, `503`, `504`) with short backoff delays before surfacing error state.
- Added explicit Retry CTA in image error state to re-run the same `queryImageLabelsCached` request without reloading the app.

**Notes:** Error originates from `AnimlBrowseTab.tsx` useEffect that calls `animlService.queryImageLabelsCached`. Add `imgError` state handling and a Retry CTA that clears error and re-triggers the fetch (e.g. via a retry counter in deps or explicit refetch callback).

---

### 2.18: Synchronize Matching Images Results with Map/Layer Counts

**Goal:** Ensure the map, map layer badge, and matching images section all display the same result count for a given filter selection.

**Problem:** When selecting species (e.g. Coyote) and camera (e.g. Big Kojo), the map may show 605 results while the matching images section and map layer badge show only 200. These three sources of truth are out of sync.

**Acceptance Criteria:**
- [ ] Map result count matches matching images count
- [ ] Map layer badge count matches matching images count
- [ ] All three use the same underlying query/aggregation logic (or explicitly document why counts may differ, e.g. pagination cap)

**Notes:** Likely root cause: different code paths for count aggregation vs. image fetch (e.g. count from one query, images from another with different limits or filters). Fix by unifying the data source or ensuring count and image fetch share the same query parameters and result set.

---

## Service Analysis

> Completed via existing `animlService.ts` (1,512 lines, Dec 2025)

### Feature Service URLs
- Deployments (cameras): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/0`
- Image Labels (flattened): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/4`
- Image Labels (deduplicated): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/3`

### Camera Service Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Image/Tag Service Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Query Performance Baseline
| Query Type | Avg Response Time | Data Volume | Notes |
|------------|-------------------|-------------|-------|
| All cameras (no images) | | | |
| All images for 1 camera | | | |
| Images filtered by species | | | |
| Current "load everything" | 8-12s | | This is the problem |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| DFT-043: Convergent progressive disclosure — species filter position depends on mode | Feb 12, 2026 | Animal-first shows species filter at top (primary), camera-first shows it inside CameraDetailView (secondary). Matches mental model: "Where is X?" starts from species; "What's at Y?" starts from camera. |
| DFT-044: countLookups as 2-phase cache warming | Feb 12, 2026 | Phase 1 loads deployments + animalTags (fast, makes UI usable). Phase 2 loads grouped counts + builds countLookups (background, enables filtered counts). UI works without countLookups and upgrades when available. |
| DFT-045: Shared AnimalFilterSection component | Feb 12, 2026 | Same checkbox filter used in both modes and synced with legend widget via AnimlFilterContext. Camera-first shows camera-specific counts via `deploymentId` prop. |
| DFT-046: 3-column ImageGrid with Load More | Feb 12, 2026 | Grid layout for photo scanning (3 cols). Client-side "Load More" pagination (21 per batch = 3×7). Less jarring than page numbers; explicit user control. |
| DFT-047: Map Layers widget filter summary format | Feb 12, 2026 | Animal-first: "Mountain Lion, Coyote • 8 cameras". Camera-first: "CAM-042 • Mountain Lion, Coyote". No filter: "No filter applied". |
| DFT-048: ANiML image pagination uses Prev/Next pages | Feb 13, 2026 | Replaced "Load More" with explicit page navigation to improve wayfinding and positional awareness in large image result sets. Uses scrollable list + controls beneath (`Page X of Y`, `A-B of N`). |
| DFT-049: Expanded image view auto-paginates across pages | Feb 13, 2026 | When navigating images in expanded view, arrow keys and Prev/Next cross page boundaries (e.g. image 20→21 advances to next page, stays in expanded view). No need to close and manually change page. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

### Caching Decision

| Decision | Date | Rationale |
|----------|------|-----------|
| (pending investigation) | | |

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, reference the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 2:** ANiML filters can participate in the same Map Layers child-view lifecycle (create/edit/rename/reactivate) without redefining sync behavior.
- **Phase 2 verification:** Confirm "Edit Filters" hydrates ANiML filter controls, sidebar edits update active child query params, and custom child names are preserved after filter changes.
- ANiML branch should adopt shared child-view rename semantics from Map Layers: manual rename persists and is never overwritten by filter sync.
- Implement ANiML-specific auto-name generation for non-custom views (camera/species/date context), while keeping shared `viewId` sync behavior intact.

---

## Open Questions

- [x] ~~Should we reuse any code from existing `AnimlDetailsSidebar.tsx`?~~ → Yes, reference v1 patterns; v2 reimplements with adapter pattern
- [ ] How to handle image thumbnails vs full images? (service provides `small_url` and `medium_url`)
- [x] ~~What's the relationship structure between cameras and images in the service?~~ → deployment_id links deployments (layer 0) to image_labels (layer 4)
- [ ] Backend work needed from Dan for caching?
- [ ] **NEW:** Browse tab UX flow — how to lay out the progressive filter steps (Task 2.3)
- [ ] **NEW:** Map Layers widget filter summary format — what text to show (Task 2.9)

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 2.2 | Added landing cards entry point (DFT-003c) and Overview tab as default (DFT-006) | Will + Claude |
| Feb 3, 2026 | 2.5 | Added numbered badge map visualization (DFT-012) with progressive disclosure integration | Will + Claude |
| Feb 3, 2026 | 2.3, 2.4, 2.6 | Resolved DFT-003: Context-dependent button visibility. "Pin Layer" only shows when layer not pinned; filter changes auto-apply to pinned layers. "Bookmark" only shows when camera is selected. | Will + Claude |
| Feb 4, 2026 | 2.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 4, 2026 | 2.5 | Resolved DFT-028: Zero-result cameras grayed out (not hidden). 40-50% opacity, desaturated, no badge. Remain clickable/keyboard-accessible. Preserves spatial context for negative evidence discovery. Animation: 300ms ease-out, staggered 30ms. | Will + Claude |
| Feb 4, 2026 | 2.5 | Resolved DFT-029: No badges when layer has no filter. Badges only appear when layer-level filter is applied (semantic indicator). Optional hover tooltip shows total count. Follows Gestalt figure/ground and Shneiderman's overview-first principles. | Will + Claude |

| Feb 12, 2026 | All | Added Readiness Assessment and Implementation Guide. Data Source Adapter Pattern complete (Phase 0 Task 23). Ready for parallel development on v2/animl branch. | Will + Claude |
| Feb 12, 2026 | 2.1, 2.2 | WIP: Created AnimlFilterContext, adapter, map layer, map behavior hook, sidebar shell (Overview + Browse tabs), legend widget. Wired into registry, V2App, layer factory. 8 new files, 4 modified files. | Will + Claude |
| Feb 12, 2026 | 2.3, 2.4, 2.8, 2.9 | Added new tasks: Browse tab interaction flow design decision (2.3), implementation (2.4), v1 SVG icons (2.8), Map Layers widget sync (2.9). Replaced old 2.3/2.4 (camera/image filter UI) with interaction-flow-first approach. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Convergent progressive disclosure design + implementation.** Animal-first: species filter at top → camera list → detail. Camera-first: camera list → detail with species filter inside. New: AnimalFilterSection (shared), ImageGrid (3-col + Load More), countLookups (2-phase cache warming). DFT-043 through DFT-047. 2 new files, 4 refactored files. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Iteration 1**: User feedback — lists too verbose, images need date visibility. Refactored to compact single-line lists, replaced ImageGrid with ImageList (vertical, date+time metadata). Created AnimalListView, AnimalDetailView. Sequential drill-down implementation. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Iteration 2 (WIP)**: User feedback — sequential drill-down too restrictive for research queries (need "mountain lions AND coyotes at cameras A,B,C in summer 2023"). Pivoting to multi-dimensional filter system. Design review via ui-ux-reviewer recommends **Option 2: Expandable filter sections** (Species/Cameras/Date/Spatial, all multi-select, collapsible). Next: implement expandable sections with multi-select checkboxes. | Will + Claude |
| Feb 13, 2026 | 2.3–2.6 | **Iteration 2 Phase 1 MVP complete.** FilterSection.tsx (expandable, multi-select, Select All/Clear All). AnimlFilterContext: selectedCameras, toggleCamera, clearCameras, selectAllAnimals, selectAllCameras, filteredImageCount, getFilteredCountForSpecies. AnimlBrowseTab: Species + Cameras FilterSections, live result count, debounced image fetch, ImageList. Researchers can select multiple species AND cameras for complex queries. | Will + Claude |
| Feb 13, 2026 | 2.10, 2.11 | **New tasks added.** 2.10: Right sidebar scrollbar — prevent content shift when scrollbar appears (e.g., selecting species + camera). 2.11: Add date/time frame filter above Species and Cameras in Browse tab. | Will + Claude |
| Feb 13, 2026 | 2.10 | **Complete.** Added `scrollbar-gutter: stable` to right sidebar scroll area in `RightSidebar.tsx` + `.scroll-area-right-sidebar` CSS class in `index.css`. Prevents horizontal content shift when overflow scrollbar appears (e.g., expanding filter sections). Thin hover-reveal scrollbar for visual consistency. | Will + Claude |
| Feb 13, 2026 | 2.11 | **Complete.** DateFilterSection component: collapsible date range picker with start/end date inputs + quick-select presets (Last 30 days, Last 6 months, This Year, Last Year). AnimlFilterContext: added startDate/endDate state, setDateRange, clearDateRange, hasDateFilter. AnimlBrowseTab: DateFilterSection placed above Species, passes dates to queryImageLabelsCached. Auto-apply per DFT-039. **Count fix:** use actual images.length when fetched (not countLookups) so date-filtered counts match displayed results. Added Tasks 2.12 (image list pagination), 2.13 (expanded image view), 2.14 (arrow key nav). | Will + Claude |
| Feb 13, 2026 | 2.12 | **Complete.** Replaced "Load More" with page-based pagination across ANiML image views. Added scrollable image list containers, Prev/Next controls under list, page indicator (`Page X of Y`), and range indicator (`A-B of N`). Implemented in `AnimlBrowseTab`, `CameraDetailView`, `AnimalDetailView`, and shared `ImageList`. | Will + Claude |
| Feb 13, 2026 | 2.12 | **Refinement.** Image results expand to fill remaining sidebar space; always-visible scrollbar (`.scroll-area-animl-images`) for scrollability affordance. Flex layout + `expandToFill` in ImageList. **Next:** 2.13 (expanded view on click), 2.14 (arrow key nav). | Will + Claude |
| Feb 13, 2026 | 2.13, 2.14 | **Complete.** Expanded image view + arrow key navigation. Created `ImageExpandedView.tsx`: in-sidebar lightbox with `medium_url`, overlay nav chevrons, metadata panel, keyboard nav (←/→/Esc). Modified `ImageList.tsx`: image rows now `<button>` elements with focus ring; internal `expandedIndex` state renders expanded view in place of list. Backward-compatible — all consumers gain feature with zero changes. | Will + Claude |
| Feb 13, 2026 | 2.13, 2.14 | **Refinement: Auto-pagination.** Arrow keys and Prev/Next cross page boundaries (e.g. image 20→21 advances to next page, stays in expanded view). DFT-049. Fix: synchronous `safeIndex` during render + null guard in ImageExpandedView to prevent crash when `images` array changes mid-transition. | Will + Claude |
| Feb 13, 2026 | 2.7 | **Marked complete for now.** Caching strategy investigation deferred; service/context caching in place. | Will + Claude |
| Feb 13, 2026 | 2.15, 2.16 | **New tasks added.** 2.15: Image click → highlight camera on map (blue ArcGIS native highlight). 2.16: Camera badges — numbered icons above cameras with matching images when filter active; cameras with 0 results get no badge. | Will + Claude |
| Feb 13, 2026 | 2.16 | **Complete.** Implemented dynamic camera badge rendering in `animlLayer.ts` using SVG data-URI symbols (camera + numeric count). Added `updateAnimlCameraBadges()` and wired it in `useAnimlMapBehavior.ts` so badges update whenever ANiML filter state changes. No-filter state shows plain camera icons; 0-result cameras show no badge. | Will + Claude |
| Feb 16, 2026 | All | **Archived completed tasks.** Moved 2.1–2.7, 2.10–2.16 to Archived Task Details section; active tasks (2.8, 2.9, 2.17) now at top. Added Task 2.17: iNaturalist-style loading indicators for ANiML (map, Map Layers widget, legend) using shared LoadingPrimitives. | Will + Claude |
| Feb 16, 2026 | 2.17 | **Complete.** ANiML loading indicators aligned with iNaturalist: MapContainer shows "Loading camera trap data..." overlay when animl active; Map Layers (ActiveLayerSection, PinnedLayerRow) and AnimlLegendWidget already used shared primitives; standardized legend spinner to loadingTheme.inlineSpinner. | Will + Claude |
| Feb 13, 2026 | 2.9 | **Complete.** Added ANiML filter sync contract with Map Layers widget (mirrors iNaturalist): `AnimlBrowseTab` now hydrates filters from pinned layer/view on "Edit Filters" and syncs active species/cameras/date + result count back to Map Layers metadata. Added `syncAnimlFilters` in `LayerContext` with child-view support and custom-name preservation; added ANiML filter payload to pinned layer/view state. | Will + Claude |
| Feb 13, 2026 | 2.17 | **New task added.** Species/camera counts in filter sections and legend show all-time totals; when date filter is applied, image results correctly show 0 but counts remain high — misleading UX. Task 2.17: sync counts with date filter or add clear qualifier. | Will + Claude |
| Feb 13, 2026 | 2.17 | **Complete.** Implemented Option D (lazy date-filtered counts). AnimlFilterContext fetches `getObservationCountsGroupedCached({ startDate, endDate })` when date filter active, builds `dateScopedCountLookups`, routes all count helpers through `activeCountLookups`. Species/Cameras filter sections and AnimlLegendWidget now show date-scoped counts; no all-time fallback during load. Files: AnimlFilterContext.tsx, AnimlBrowseTab.tsx, AnimlLegendWidget.tsx. | Will + Claude |
| Feb 16, 2026 | 2.8 | **Complete.** Replaced emoji camera map markers with SVG camera symbols in `animlLayer.ts` for base, badged, and muted states. Added row-level icons in ANiML legend and browse filters (`AnimlLegendWidget`, `FilterSection`, `AnimlBrowseTab`). Final refinement removed circular marker backplates based on visual QA feedback. | Will + Claude |
| Feb 19, 2026 | CON-ANIML-01 | **Complete.** Map click on camera trap auto-selects sidebar camera and shows images. Includes map click handler, browse camera auto-select, and spatial polygon camera auto-selection/prioritization. QA passed. | Will + Claude |
| Feb 19, 2026 | CON-ANIML-03 | **Complete.** Sort cameras by result count (data-rich first, zero-data last). Comparator in AnimlBrowseTab sinks zero-result cameras to bottom; preserves spatial-polygon priority. | Will + Claude |
| Feb 19, 2026 | CON-ANIML-04 | **Complete.** Added explicit button-style "Remove Polygon" CTA in spatial query panel; replaced low-visibility header "Clear" text action for better discoverability. | Will + Claude |
| Feb 19, 2026 | UX | **Species/Camera count loading indicators.** FilterSection shows "Loading counts..." with blue spinner (EyeSlotLoadingSpinner) when countLookups not ready. AnimlFilterContext exposes `countsLoading`; both Species and Cameras sections use it. Styling matches Map Layers widget. | Will + Claude |
| Feb 19, 2026 | SpatialQuerySection | **Refinements.** Removed redundant "Polygon applied..." and "Clearing removes..." copy. Matched filter-section card styling: border/rounded-lg/overflow-hidden, bg-slate-50 header row, body with Draw/Redraw + Remove Polygon buttons. Added CON-ANIML-06: Retry button for image labels API errors (e.g. 503). | Will + Claude |

---

## Implementation Guide for Next Session

### Step-by-Step Instructions

This section provides detailed guidance for implementing the Animl adapter following the proven iNaturalist pattern.

#### STEP 1: Create AnimlFilterContext (Foundation)

**File:** `src/v2/context/AnimlFilterContext.tsx`

**Purpose:** Central cache and filter state for Animl camera trap data. Similar to `INaturalistFilterContext.tsx`.

**Key Features:**
- Lazy loading: Data NOT fetched on mount, only when `warmCache()` is called
- Camera deployments: Fetch from `animlService.queryDeploymentsCached()`
- Image labels: Fetch from `animlService.queryImageLabelsCached()`
- Animal category counts: Use `animlService.getAnimalCategoryCountsCached()`
- Filter state: `selectedAnimals` Set, `dateRange`, `deploymentFilter`, `regionFilter`
- Methods: `toggleAnimal()`, `setDateRange()`, `selectAll()`, `clearFilters()`

**State Shape:**
```typescript
{
  // Cache
  deployments: AnimlDeployment[],
  imageLabels: AnimlImageLabel[],
  animalTags: AnimlAnimalTag[],
  loading: boolean,
  error: string | null,
  dataLoaded: boolean,
  
  // Filters
  selectedAnimals: Set<string>,  // Animal category names
  dateRange: { start: Date | null, end: Date | null },
  deploymentFilter: string | null,  // "All" | specific deployment ID
  regionFilter: string | null,  // "All" | "North" | "South" etc.
  
  // Methods
  warmCache: () => void,
  toggleAnimal: (animalName: string) => void,
  setDateRange: (start: Date | null, end: Date | null) => void,
  setDeploymentFilter: (deployment: string | null) => void,
  setRegionFilter: (region: string | null) => void,
  selectAll: () => void,
  clearFilters: () => void,
}
```

**Import Existing Service:**
```typescript
import {
  queryDeploymentsCached,
  queryImageLabelsCached,
  getAnimalCategoryCountsCached,
  type AnimlDeployment,
  type AnimlImageLabel,
  type AnimlAnimalTag,
} from '../../services/animlService';
```

**Provider Mounting:** Will be added to `V2App.tsx` in Step 6.

---

#### STEP 2: Create Animl Adapter

**File:** `src/v2/dataSources/animl/adapter.tsx`

**Pattern:** Follow `src/v2/dataSources/inaturalist/adapter.tsx`

**Content:**
```typescript
import type { DataSourceAdapter, OverviewTabProps, CacheStatus } from '../types';
import { AnimlOverviewTab } from '../../components/RightSidebar/ANiML/AnimlOverviewTab';
import { AnimlBrowseTab } from '../../components/RightSidebar/ANiML/AnimlBrowseTab';
import { AnimlLegendWidget } from '../../components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget';
import { AnimlFilterProvider, useAnimlFilter } from '../../context/AnimlFilterContext';

// Wrapper that warms cache when Overview tab mounts
function AnimlOverviewTabWithCache(props: OverviewTabProps) {
  const { warmCache } = useAnimlFilter();
  
  React.useEffect(() => {
    warmCache();
  }, [warmCache]);
  
  return <AnimlOverviewTab {...props} />;
}

export const animlAdapter: DataSourceAdapter = {
  id: 'animl',
  layerIds: ['animl-camera-traps'],
  OverviewTab: AnimlOverviewTabWithCache,
  BrowseTab: AnimlBrowseTab,
  LegendWidget: AnimlLegendWidget,
  CacheProvider: AnimlFilterProvider,
};

export function useAnimlCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useAnimlFilter();
  return { loading, dataLoaded, warmCache };
}
```

---

#### STEP 3: Create Map Behavior Hook

**File:** `src/v2/dataSources/animl/useMapBehavior.ts`

**Pattern:** Follow `src/v2/dataSources/inaturalist/useMapBehavior.ts`

**Key Logic:**
- Warm cache when layer first appears (pinned OR activated)
- Populate GraphicsLayer when data loads (one-time)
- Update badge counts when filters change
- Reset populated flag when layer is removed

**Dependencies:**
- `useAnimlFilter()` for data and filter state
- `populateAnimlLayer()` from `layers/animlLayer.ts` (create in Step 4)
- `updateAnimlBadges()` from `layers/animlLayer.ts`

---

#### STEP 4: Create Animl Map Layer

**File:** `src/v2/components/Map/layers/animlLayer.ts`

**Pattern:** Follow `src/v2/components/Map/layers/inaturalistLayer.ts`

**Functions:**
```typescript
export function createAnimlLayer(options): GraphicsLayer
export function populateAnimlLayer(layer, deployments): void
export function updateAnimlBadges(layer, deployments, imageLabels, filters): void
```

**Camera Icon Design:**
- Use PictureMarkerSymbol with camera emoji or SVG icon
- Badge overlay showing filtered image count (TextSymbol)
- Badge only appears when filters are active (DFT-029)
- Zero-result cameras: grayed out (40-50% opacity, DFT-028)

**Update Layer Factory:** Add case to `src/v2/components/Map/layers/index.ts`:
```typescript
case 'animl-camera-traps':
  return createAnimlLayer({ id: `v2-${layerId}`, ...options });
```

---

#### STEP 5: Update Registry

**File:** `src/v2/dataSources/registry.ts`

**Changes:** Uncomment all Animl lines (marked with `// ← v2/animl`):
```typescript
// Line 21-22: Uncomment imports
import { animlAdapter, useAnimlCacheStatus } from './animl/adapter';
import { useAnimlMapBehavior } from './animl/useMapBehavior';

// Line 32: Uncomment map entry
animl: animlAdapter,

// Line 57: Uncomment hook call
useAnimlMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);

// Line 69, 75: Uncomment cache status
const animl = useAnimlCacheStatus();
case 'animl': return animl;
```

---

#### STEP 6: Mount Provider in V2App

**File:** `src/v2/V2App.tsx`

**Change:** Add `AnimlFilterProvider` wrapper:
```typescript
import { AnimlFilterProvider } from './context/AnimlFilterContext';

// Wrap existing providers:
<LayerProvider>
  <MapProvider>
    <INaturalistFilterProvider>
      <AnimlFilterProvider>
        {/* existing content */}
      </AnimlFilterProvider>
    </INaturalistFilterProvider>
  </MapProvider>
</LayerProvider>
```

---

#### STEP 7: Create Right Sidebar Components

**Files to Create:**
1. `src/v2/components/RightSidebar/ANiML/AnimlSidebar.tsx` (may not need — adapter handles routing)
2. `src/v2/components/RightSidebar/ANiML/AnimlOverviewTab.tsx`
3. `src/v2/components/RightSidebar/ANiML/AnimlBrowseTab.tsx`
4. `src/v2/components/RightSidebar/ANiML/CameraListView.tsx`
5. `src/v2/components/RightSidebar/ANiML/CameraDetailView.tsx`
6. `src/v2/components/RightSidebar/ANiML/CameraCard.tsx`

**AnimlOverviewTab Pattern:**
- Read from `useAnimlFilter()` for total counts
- Display dataset description
- "Browse Features →" button (per DFT-027)

**AnimlBrowseTab Pattern:**
- Landing cards on first visit: "Browse by Animal" vs "Browse by Camera" (DFT-003c)
- Mode-switch link (DFT-042)
- Dual-level filtering (camera filters + image filters, Task 2.3/2.4)
- Camera list with badges (Task 2.5)
- Drill-down to camera detail (Task 2.6)

---

#### STEP 8: Create Legend Widget

**File:** `src/v2/components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget.tsx`

**Pattern:** Follow `INaturalistLegendWidget.tsx`

**Features:**
- Positioned `bottom-6 right-6` (floating over map)
- Collapsible with expand/collapse button
- Animal category list (sorted by count descending)
- Each row: color dot, icon, label, count
- Click toggles filter (syncs with Browse tab)
- Loading state with spinner

**Data Source:** `useAnimlFilter()` for `animalTags`, `selectedAnimals`, `toggleAnimal()`

---

### Testing Checklist

After implementation:

- [ ] Activate "Camera Traps (ANiML)" layer → Overview tab loads
- [ ] Data warms cache on first activation (~2-3s load time)
- [ ] Revisiting layer shows instant data (cache hit)
- [ ] "Browse Features →" button switches to Browse tab
- [ ] Landing cards appear: "Browse by Animal" vs "Browse by Camera"
- [ ] Legend widget appears at bottom-right
- [ ] Camera icons appear on map
- [ ] Clicking animal in legend filters cameras (badges update)
- [ ] Clicking camera navigates to detail view
- [ ] Filter changes sync between Browse tab, legend, and map

---

### Common Pitfalls

1. **Forgetting to warm cache** — AnimlFilterContext must call `warmCache()` when Overview tab mounts
2. **Not using idempotent cache warming** — Check `loading` or `dataLoaded` flags before fetching
3. **GraphicsLayer not refreshing** — Call `layer.graphics.removeAll()` before re-populating
4. **Badge visibility** — Only show badges when filters are active (DFT-029)
5. **React hooks order** — All hooks in `useAllMapBehaviors` must be called unconditionally

---

