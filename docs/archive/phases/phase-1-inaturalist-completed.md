# Phase 1: iNaturalist — Archived Tasks (Full)

**Archived:** February 25, 2026  
**Purpose:** Complete archive of all Phase 1 iNaturalist tasks. Preserved to make room for new iNaturalist tasks in the phase document.

---

## Task Summary Table

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| TF-01 | ✅ | Feb 20, 2026 | Min height for image results in Browse tab (~150px) | min-h-[400px] on inat-observation-cards |
| TF-05 | ✅ | Feb 20, 2026 | iNaturalist taxa legend UX: caret right, header clickable, rounded corners | grid-template-rows animation |
| TF-03 | ✅ | Feb 20, 2026 | Don't gray out species options in Filter Species dropdown | Removed opacity-60; unselected use bg-white |
| TF-04 | ✅ | Feb 20, 2026 | Fix map/right-sidebar desync: taxon in legend + species filter | Removed global species reset from toggleTaxon |
| CON-INAT-01 | ✅ | Feb 19, 2026 | Add species-level filtering (taxa only → taxa + species) | Full scientific names, species search, count sort |
| CON-INAT-02 | ✅ | Feb 19, 2026 | Species hierarchy flow: taxa → species → observations | "Filter Taxa" label; redundant search removed |
| CON-INAT-03 | ✅ | Feb 19, 2026 | Show result count in right sidebar | "92 observations" live count |
| CON-INAT-04 | 🚫 Won't Do | Feb 19, 2026 | Reptile observations in ocean (scrambling vs bug) | iNaturalist coordinate obfuscation; not app bug |
| CON-INAT-06 | ✅ | Feb 19, 2026 | Species/taxa ordering: common higher, editable sort | Count sort default, A-Z toggle |
| CON-INAT-07 | ✅ | Feb 19, 2026 | Edit filters collapsible; results scrollable | EditFiltersCard collapsible; flex layout |
| TF-06 | ✅ | Feb 24, 2026 | Species filter bug: taxa + all species = no results | Removed requiresSpeciesSelection; Select All/Clear All styling |
| 1.1 | ✅ | Feb 11, 2026 | Query iNaturalist service to understand attributes | Completed during Task 13 |
| 1.2 | ✅ | Feb 13, 2026 | Create iNaturalist right sidebar shell | INaturalistBrowseTab, OverviewTab, DetailView |
| 1.3 | ✅ | Feb 13, 2026 | Implement filter UI (taxon, species, date, etc.) | Taxa filter, date range, search bar |
| 1.4 | ✅ | Feb 13, 2026 | Implement observation list with cards | Tasks 14-19 complete |
| 1.5 | ✅ | Feb 13, 2026 | Implement observation detail view | Task 14 complete |
| 13 | ✅ | Feb 11, 2026 | Fix iNaturalist Layer Icons & Loading | GraphicsLayer, local filtering |
| 14 | ✅ | Feb 12, 2026 | Observation Card Click → Map Highlight + Detail View | |
| 15 | ✅ | Feb 12, 2026 | Map Marker Click → Zoom + Detail View | |
| 16 | ✅ | Feb 13, 2026 | Remove Bookmark Button/Action | DFT-046 deferred |
| 17 | ✅ | Feb 13, 2026 | Compact Filter Section (Dropdown) | |
| 17b | ✅ | Feb 13, 2026 | Add Clear All to Legend Widget | Bidirectional sync |
| 18 | ✅ | Feb 13, 2026 | Rename Legend Widget Title | "iNaturalist Taxa" |
| 19 | ✅ | Feb 13, 2026 | Add Observation Search Bar | |
| 20 | ✅ | Feb 13, 2026 | Reduce Pagination to 10 per Page | |
| 21 | ✅ | Feb 13, 2026 | Add Date Range Filter | |
| 22 | ✅ | Feb 13, 2026 | Remember Last Active Tab | Per-layer tab memory |
| 25 | ✅ | Feb 13, 2026 | Sync Filters with Map Layers Widget | |
| 26 | ✅ | Feb 13, 2026 | Dynamic View Names from Filters | |
| 27 | ✅ | Feb 13, 2026 | User-Renamable Filtered Views | |
| 28 | ✅ | Feb 13, 2026 | Detail View Crash on Observation Click | Hook-order fix |
| Future | Deferred | - | Save Observation → Create Filtered View | Low value, high complexity |

---

## Original Phase Tasks (High-Level)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| 1.1 | Query iNaturalist service to understand attributes | 🟢 Complete | Completed during Task 13 implementation |
| 1.2 | Create iNaturalist right sidebar shell | 🟢 Complete | INaturalistBrowseTab, OverviewTab, DetailView created |
| 1.3 | Implement filter UI (taxon, species, date, etc.) | 🟢 Complete | Taxa filter (Task 17), date range (Task 21), search bar (Task 19) |
| 1.4 | Implement observation list with cards | 🟢 Complete | Tasks 14-19 complete |
| 1.5 | Implement observation detail view | 🟢 Complete | Task 14 complete |

---

## Task Details (1.1–1.5)

### 1.1: Query iNaturalist Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the iNaturalist feature service.

**Acceptance Criteria:** Document attributes, identify filtering/display fields, note data quality issues.

### 1.2: Create iNaturalist Right Sidebar Shell

**Goal:** Set up the component structure for the iNaturalist browse experience.

**Decisions:** DFT-006 (Overview tab first, "Browse Features →" button), DFT-027 (button design spec).

**Files:** INaturalistSidebar.tsx, INaturalistBrowseTab.tsx, INaturalistOverviewTab.tsx, INaturalistExportTab.tsx

### 1.3: Implement Filter UI

**Goal:** Create the filter controls for querying observations.

**Decision:** DFT-039 — Auto-apply everywhere, no Apply button, AbortController, loading feedback.

### 1.4: Implement Observation List with Cards

**Goal:** Display filtered observations as browseable cards. Cards show species, observer, date, location, photo; click opens detail + map highlight; Bookmark removed (DFT-046); search bar added (Task 19).

### 1.5: Implement Observation Detail View

**Goal:** When user clicks an observation, show expanded details. View on Map, Open in iNaturalist; Bookmark removed.

---

## Detailed Task Breakdown (13–28)

### Task 13: Fix iNaturalist Layer Icons & Loading

**Status:** ✅ Complete (Feb 11, 2026)

**Goal:** Fix wrong/fake icons before layer active; eliminate delay on layer click; improve slow taxa filtering in legend.

**Implementation:** Replaced FeatureLayer with GraphicsLayer; local filtering; legend counts computed locally; instant taxon filtering; layer starts hidden.

**Files:** INaturalistFilterContext.tsx, inaturalistLayer.ts, useMapLayers.ts, INaturalistLegendWidget.tsx, useINaturalistObservations.ts, LayerContext.tsx, MapContainer.tsx

---

### Task 14: Observation Card Click → Map Highlight + Detail View

**Status:** ✅ Complete (Feb 12, 2026)

**Goal:** Clicking observation card opens detail view, pans/zooms map, highlights marker, opens popup.

**Implementation:** `onViewDetail` calls `setSelectedObs` + `handleViewOnMap`; ArcGIS native highlight.

**Files:** INaturalistBrowseTab.tsx, ObservationCard.tsx, MapContext.tsx

---

### Task 15: Map Marker Click → Zoom + Detail View

**Status:** ✅ Complete (Feb 12, 2026)

**Goal:** Clicking map marker zooms to observation and opens detail view in right sidebar.

**Implementation:** Extended `ActiveLayer` with `featureId`; map click handler in `useINaturalistMapBehavior`; RightSidebar auto-switches to Browse when map observation clicked.

**Files:** types/index.ts, LayerContext.tsx, useMapBehavior.ts, INaturalistBrowseTab.tsx

---

### Task 16: Remove Bookmark Button/Action

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Clean up unused bookmark logic (DFT-046: Save as View deferred).

**Implementation:** Removed Bookmark button from ObservationCard and INaturalistDetailView.

**Files:** ObservationCard.tsx, INaturalistDetailView.tsx, INaturalistBrowseTab.tsx

---

### Task 17: Compact Filter Section (Dropdown)

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Convert tall checkbox list to dropdown with Select All.

**Implementation:** Collapsible dropdown; trigger shows "All Taxa" or "X Taxa Selected"; chevron rotates on expand.

**Files:** INaturalistBrowseTab.tsx

---

### Task 17b: Add Clear All to Legend Widget

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Add Clear All alongside Select All; bidirectional sync with Map Layers widget.

**Implementation:** Select All + Clear All in legend and Browse filters; emerald theme; `lastFiltersClearedTimestamp` in LayerContext.

**Files:** INaturalistLegendWidget.tsx, INaturalistFilterContext.tsx

---

### Task 18: Rename Legend Widget Title

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Change "Filter Observations" → "iNaturalist Taxa".

**Files:** INaturalistLegendWidget.tsx

---

### Task 19: Add Observation Search Bar

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Search by common/scientific name in Browse tab.

**Implementation:** 300ms debounce; case-insensitive substring match; clear button; no layout shift on focus.

**Files:** INaturalistBrowseTab.tsx, useINaturalistObservations.ts

---

### Task 20: Reduce Pagination to 10 per Page

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Change PAGE_SIZE from 20 → 10.

**Files:** useINaturalistObservations.ts

---

### Task 21: Add Date Range Filter

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Add start/end date pickers in Browse tab filter section.

**Implementation:** Native date inputs; filter by `observed_on`; `normalizeDate()` in INaturalistFilterContext.

**Files:** INaturalistBrowseTab.tsx, useINaturalistObservations.ts

---

### Task 22: Remember Last Active Tab

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Per-layer tab memory; restore Overview vs Browse when reactivating layer.

**Implementation:** RightSidebar persists `lastTabByLayerId`; restores on reactivation; Edit Filters still opens Browse.

**Files:** RightSidebar.tsx

---

### Task 25: Sync Filters with Map Layers Widget

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Date + taxon filters sync bidirectionally; Edit Filters opens Browse with pre-applied filters.

**Implementation:** LayerContext sync; map markers filter by date + taxa; fixed infinite loop (hydrate/sync oscillation).

**Files:** LayerContext.tsx, INaturalistBrowseTab.tsx, INaturalistFilterContext.tsx

---

### Task 26: Dynamic View Names from Filters

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Child view names auto-generate from active filters (e.g., "Birds, Mammals, Reptiles").

**Implementation:** Per-data-source auto-name builder; when `isNameCustom` is false, auto-name updates on filter sync.

---

### Task 27: User-Renamable Filtered Views

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Child views can be renamed inline in Map Layers widget; custom names persist.

**Implementation:** Inline rename in PinnedLayerChildRow; `isNameCustom` guard prevents auto-name overwrite.

---

### Task 28: Detail View Crash on Observation Click

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Fix crash when clicking observation card to open detail view.

**Root Cause:** Early return before hooks caused "Rendered fewer hooks than expected."

**Implementation:** Moved detail-view return after all hooks; hardened `handleViewOnMap` with try/catch and coordinate validation; RightSidebar auto-switches to Browse when map observation clicked.

**Files:** INaturalistBrowseTab.tsx, RightSidebar.tsx

---

### Future: Save Observation → Create Filtered View

**Status:** Deferred

**Goal:** "Save" on observation creates child view filtered to that observation.

**Priority:** Deferred — low user value, high complexity.

---

## Integration Note for Merge (Canonical)

- Canonical implementation details for Map Layers <-> right-sidebar query synchronization live in this archive.
- Child filtered-view naming: auto-name updates only when name is not custom; manual rename sets persistent custom-name override.
- Preserve `viewId`-based sync and manual rename logic in shared layer/widget state.
- Loading indicators follow Task 34 contract: Map Layers eye-slot spinner, map overlay, legend/sidebar loading via shared primitives in `src/v2/components/shared/loading/`.

### Shared Sync Contract

- **Source of truth:** Shared filtered-view state (Map Layers + `viewId`-based query state).
- **Bidirectional behavior:** Right sidebar edits update active child view; "Edit Filters" hydrates params into right sidebar.
- **Custom-name rule:** Once manually renamed, filter-sync must not overwrite.
- **Loop prevention:** Guard hydration/sync effects against ping-pong updates.
- **Navigation continuity:** `viewId` and active tab restoration survive layer reactivation.

### Cherry-Pick / Merge Checklist

- Merge shared sync changes before phase-specific sidebar UI wiring.
- Preserve `viewId` routing semantics.
- Keep rename persistence (`isCustomName` guard).
- Validate map rendering respects synced query params.
- Confirm no infinite loops on filter/tab/pin changes.
- Smoke test: Apply filters → widget reflects; Edit Filters → sidebar hydrates; Rename → custom name persists; Switch away/back → context restores.

---

## Change Log (Archived)

| Date | Task | Change |
|------|------|--------|
| Feb 18, 2026 | - | **Full archive.** All Phase 1 iNaturalist tasks moved here to make room for new tasks. |
| Feb 16, 2026 | Task 34 | Shared loading primitives complete. |
| Feb 13, 2026 | Task 28 | Detail view crash fixed (hook-order). |
| Feb 13, 2026 | Tasks 26–27 | Dynamic view names; user-renamable views. |
| Feb 13, 2026 | Task 25 | Sync Filters with Map Layers Widget. |
| Feb 13, 2026 | Task 22 | Remember last active tab per layer. |
| Feb 13, 2026 | Task 19 | Observation search bar. |
| Feb 13, 2026 | Task 18 | Legend widget title → "iNaturalist Taxa". |
| Feb 13, 2026 | Tasks 16–17 | Remove Bookmark; compact filter dropdown. |
| Feb 12, 2026 | Tasks 14–15 | Observation card click; map marker click. |
| Feb 11, 2026 | Task 13 | Fix layer icons & loading (GraphicsLayer). |

---

## Reference

- **Phase doc (new tasks):** `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`
- **Master plan:** `docs/master-plan.md`
