# Phase 4: DataOne Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 16 / 17 tasks complete  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-4-dataone-completed.md`  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| D20-09 | 🟢 Complete | Feb 23, 2026 | Filter DataOne map to latest dataset version only (deduplicate by latest) | Implemented: Lite layer + dedupeDatasetsByDataoneId in getDatasetsForMapLayer/queryDatasets; prefers isLatestVersion and newest date. Verified visually. |
| TF-13 | 🟢 Complete | Feb 23, 2026 | Add loading indicator when DataOne layer is selected and map data is loading | Implemented: map-loading scope in DataOneFilterContext; browse-tab RefreshLoadingRow ("Updating map markers..."); Map Layers eye-slot spinner via shared cache-status. Consistent with iNaturalist pattern. Source: Trisalyn QA Feb 20 |
| TF-14 | 🟢 Complete | Feb 23, 2026 | Render a specific map marker when "View on Map" is clicked on a dataset | ArcGIS native popup highlight: query feature by dataoneId, open popup on it for light-blue selection. Detail open + Recenter both trigger. Map Layers saved-dataset click also focuses + popup. Source: Trisalyn QA Feb 20 |
| CON-DONE-01 | 🟢 Complete | Feb 20, 2026 | Cluster click on map populates right sidebar with datasets at that location | Race condition fix applied; counts verified |
| CON-DONE-16 | 🟢 Complete | Feb 20, 2026 | Switch from circular clustering to grid binning (FeatureReductionBinning) | Live scale watcher; in-place fixedBinLevel mutation; maxScale:0 keeps bins visible; "Where to Fine-Tune" doc'd |
| CON-DONE-02 | 🟢 Complete | Feb 20, 2026 | Auto-pan/zoom when opening dataset detail; repurpose View on Map as Recenter | High priority; resolution applied |
| CON-DONE-05 | 🟢 Complete | Feb 23, 2026 | Fix map vs sidebar count discrepancy (dedupe dataset versions) | Resolved via D20-09 (dedupeDatasetsByDataoneId) + CON-DONE-01 race-condition fix |
| CON-DONE-06 | 🟢 Complete | Feb 23, 2026 | Save button: clearly distinguish saved vs unsaved state | DatasetDetailView: "Save Dataset View" (amber) vs "Unsave Dataset View" (rose); driven by isDatasetSaved prop |
| CON-DONE-07 | 🟢 Complete | Feb 23, 2026 | Persist saved state when returning to already-saved dataset | Save overwrites unassigned view; creates new child when assigned; unsave clears pin; first save pins to baseline (no extra "All Datasets" child) |
| CON-DONE-08 | 🟢 Complete | Feb 23, 2026 | Multi-select categories filter checklist | Replaced single-select dropdown with checkbox checklist; Select all / Clear all; tncCategories wired through browse, query, map, and saved views |
| CON-DONE-09 | 🟢 Complete | Feb 23, 2026 | Search by title and abstract/keywords | Layer 1 used when searchText present; title OR abstract OR keywords predicate; browse + map + count paths updated |
| CON-DONE-10 | 🟢 Complete | Feb 23, 2026 | Filter by file type (CSV, TIF, imagery, and others) | File-type checklist (CSV/TIF/Imagery/Other) with Select all/Clear all; client-side filtering from files_summary.by_ext; wired through browse, map, saved views |
| CON-DONE-11 | 🟢 Complete | Feb 23, 2026 | Saved indicator on browse cards (icon plus subtle highlight) | DatasetListView: BookmarkCheck icon + "Saved" badge; amber border/bg on card |
| CON-DONE-15 | 🟢 Complete | Feb 23, 2026 | Spatial query: ensure draw/query tools filter DataONE datasets by extent | Verified working with SpatialQuerySection |
| CON-DONE-14 | 🟢 Complete | Feb 23, 2026 | Search highlight: show matching keyword inside abstract snippet | DatasetListView: abstract snippet with case-insensitive phrase highlight; optional abstract on DataOneDataset; Layer 1 carries abstract when search active |
| D20-B02 | ⚪ Not Started (Dan) | Feb 20, 2026 | Create dedicated DataOne point layer in ArcGIS data store (deduplicated, latest version only) with native clustering enabled | Backend task from Dan meeting. Frontend now dedupes latest version client-side; backend layer remains follow-up. |
| CON-DONE-17 | 🟢 Complete | Feb 24, 2026 | Synchronize DataONE map-click behavior between 2D and 3D, and restore preferred dataset dot rendering style | Completed: 3D now uses companion GraphicsLayer overlay (Dendra pattern) for rendering + clicks. FeatureLayer hidden in 3D. 2D behavior unchanged. |

**Phase-5 handoff:** `CON-DONE-12` and `CON-DONE-13` (export behavior tasks) are tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`.

*Completed tasks 4.1–4.12 have been archived. See `docs/archive/phases/phase-4-dataone-completed.md`.*

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the DataOne dataset browse experience in the right sidebar. This data source has:
- **Pointer rows** (datasets point to files)
- **No Level 3 filtering** (datasets are saved as whole views, not filtered)
- **Cross-category nature** (datasets span all TNC categories)
- **No bookmarking workflow** moving forward (use save/view language and behavior)

## Feature Service (Inspect DataONE Layer)

The DataONE datasets are served from an ArcGIS Feature Service. Use these URLs to inspect metadata and layer schemas:

| Resource | URL |
|----------|-----|
| **Service metadata** (list layers) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer?f=json` |
| **Layer 0 (Lite)** — lightweight fields, fast list load (~12k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/0?f=json` |
| **Layer 1 (Latest)** — full metadata including abstracts | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/1?f=json` |
| **Layer 2 (AllVersions)** — all versions for history lookup (~22k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/2?f=json` |

Append `?f=json` to any URL to get ArcGIS REST metadata (layers, fields, types). Used by `src/services/dataOneService.ts` and `src/types/dataone.ts`.

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 10 - Cross-Category)
- Mockup: `mockups/02e-browse-dataone.html`

## Key Paradigm Notes

- **Row Type:** Pointer (dataset points to files)
- **Save/View Options:** Only "Save Dataset View" (no filter-specific save path)
- **No Level 3:** Datasets are saved as whole views, not filtered by individual files
- **Cross-Category:** DataOne appears under "Research Datasets (All Categories)" with category filter in right sidebar
- **Left Sidebar Shortcuts (DFT-045):** Special shortcut rows appear in domain categories (Species, Fire, etc.) labeled "DataOne Datasets (count)". Clicking activates DataOne with that domain pre-filtered. Improves discoverability for domain-first users.

---

## Task Details

*(Add new task details below. Completed tasks 4.1–4.12 are in the archive.)*

---

### D20-09: Filter DataOne Map to Latest Dataset Version Only ✅

**Goal:** Show only the latest version of each dataset on the map (deduplicate by latest). Previously, the flat table showed all versions — 878 deduplicated datasets but one dataset alone could show 700 rows due to versioning.

**Resolution (Feb 23, 2026):** Implementation was already in place. `getDatasetsForMapLayer` and `queryDatasets` both use the Lite layer (Layer 0, documented as latest-only) and apply `dedupeDatasetsByDataoneId`, which keeps one record per `dataone_id` and prefers `isLatestVersion` and newest `dateUploaded`. Map and browse list both show deduplicated datasets. Verified visually.

**Files:** `src/services/dataOneService.ts` (dedupeDatasetsByDataoneId, getDatasetsForMapLayer, queryDatasets), `src/v2/dataSources/dataone/useMapBehavior.ts` (calls getDatasetsForMapLayer).

---

### CON-DONE-17: Synchronize 2D/3D Marker Click Behavior + Restore Preferred Dot Rendering

**Goal:** Ensure DataONE marker clicks behave identically in 2D and 3D: clicking a marker must open the matching dataset detail view in the right sidebar. Also restore the previously preferred dataset dot rendering style.

**Final Outcome (Feb 24, 2026):**
- 2D (`MapView`) marker click behavior remains unchanged.
- 3D (`SceneView`) marker click now consistently opens the matching DataONE detail view.
- 3D dot rendering now matches the preferred circular style by using a companion `GraphicsLayer` pattern aligned with Dendra.

**What Was Attempted In This Chat (for handoff):**
- Updated DataONE map click handling in `src/v2/dataSources/dataone/useMapBehavior.ts`:
  - Added `mapReady` to click/focus effects so handlers rebind after 2D/3D toggle view recreation.
  - Preserved active DataONE `viewId` on point and single-member aggregate clicks.
  - Added SceneView-oriented hit matching fallback (`dataoneId` attribute check).
  - Added 3D guard logic for feature reduction (set `featureReduction = null` in 3D).
- Updated active-layer sync in `src/v2/context/LayerContext.tsx`:
  - Preserved explicit map-click `featureId` during DataONE view realignment to avoid losing detail intent.
- Updated DataONE layer/map config:
  - `src/v2/components/Map/layers/dataoneLayer.ts`: added `elevationInfo: { mode: 'on-the-ground' }`.
  - `src/v2/components/Map/MapContainer.tsx`: set `view.popup.autoOpenEnabled = false`.

**Observed Outcome (Window 1):**
- 3D marker clicks still did not open DataONE detail.
- User requested reverting the new dot rendering style while continuing 3D interaction debugging.

**Window 2 Investigation & Fix (Feb 24, 2026):**

*Root cause analysis:* Compared DataONE (client-side FeatureLayer via `source: []` + `applyEdits`) with all other data sources. Every other layer that supports clicks uses either **server-hosted FeatureLayers** (CalFlora, GBIF) or **GraphicsLayers** (iNaturalist, Dendra). DataONE is the only **client-side FeatureLayer**. SceneView's hitTest pipeline does not reliably detect features in client-side FeatureLayers — even with `hitTest({ include: [layer] })`. Additionally, SceneView auto-converts 2D `SimpleMarkerSymbol` to 3D billboards which produced "weird" dot rendering.

*Attempt 1 (`hitTest({ include })` only):* User confirmed 2D still works, but 3D click still broken and dots rendered oddly.

*Attempt 2 (coordinate fallback + PointSymbol3D):* User reported: sidebar syncs correctly in 3D, but dots render weirdly and no visual feedback on map click. Coordinate fallback worked but bypassed ArcGIS rendering/popup.

*Attempt 3 (current — GraphicsLayer overlay, Dendra pattern):*
1. **3D rendering + click: companion GraphicsLayer** — In SceneView, a `GraphicsLayer` overlay (same pattern as Dendra sensor layers) is created with per-graphic `SimpleMarkerSymbol` dots. The FeatureLayer is hidden (`visible = false`). The overlay handles all rendering and click detection natively — `hitTest` on a `GraphicsLayer` works reliably in SceneView. Popup highlight also works natively via `view.openPopup({ features: [hit.graphic] })`.
2. **2D completely unchanged** — FeatureLayer + clustering/binning + hitTest works as before.
3. **Overlay lifecycle** — Created/destroyed by the aggregation-mode effect based on `view.type`. Populate effect keeps overlay in sync when data refreshes.
4. **Removed per-graphic symbol from FeatureLayer** — FeatureLayer renderer handles symbology; per-graphic symbol was dead code.
5. **Files:** `dataoneLayer.ts` (added `createDataOneOverlay`, `populateDataOneOverlay`), `useMapBehavior.ts` (overlay lifecycle + 3D hit target swap).

*Retained from Window 1 (correct changes):*
- `elevationInfo: { mode: 'on-the-ground' }` — explicit ground-clamping for 3D
- `featureReduction = null` in SceneView — clustering/binning not supported in 3D
- `isDataOneGraphicHit` attribute fallback — safety net for hitTest in case it works
- `mapReady` in effect deps — ensures click handler re-registers after 2D↔3D toggle
- `view.popup.autoOpenEnabled = false` — prevents auto-popup interference
- viewId preservation on `activateLayer` calls
- featureId preservation in LayerContext view realignment

**Acceptance Criteria:**
- [x] Clicking a DataONE marker in 3D opens the matching detail view in right sidebar every time.
- [x] Clicking a DataONE marker in 2D behavior remains unchanged.
- [x] DataONE dataset dot rendering matches user-preferred prior style.
- [x] No regression in cluster/bin click behavior, saved-view behavior, or Recenter/popup highlight behavior.

**Estimated Time:** 2–4 hours (complete)

---

### CON-DONE-01: Cluster Click Populates Sidebar with Local Datasets

**Goal:** When a user clicks a clustered DataONE marker on the map, the right sidebar should immediately show the datasets represented by that cluster/location.

**Context:** Previously, cluster clicks only zoomed the map. Users had no direct way to inspect which datasets were in the clicked cluster without repeated zoom interactions.

**Implementation Notes (Feb 20, 2026):**
- Added map-selection flow for cluster clicks (`mapSelectionDataoneIds`) so cluster clicks drive sidebar filtering
- Preserved single-point click behavior: clicking a non-cluster marker opens dataset detail directly
- Moved large-cluster sidebar filtering to client-side cache matching (to avoid 414 URI Too Large when cluster selections are very large)

**Refinements (Feb 23, 2026):**
- Removed custom cluster highlight ring; rely on ArcGIS native highlight only
- Cluster click auto-zoom: only zoom when cluster can stay visible (scale guard vs cluster maxScale); otherwise center without zoom

**Cluster + Saved Dataset View Fix (Feb 23, 2026):**
- When in a filtered child view with saved dataset, clicking back to datasets list then zooming out and clicking a cluster used to snap to saved dataset detail. Fixed: cluster click preserves current DataOne viewId, pan-only (no zoom), and filters sidebar list without restoring saved dataset detail.

**Cluster↔Dataset Navigation Fix (Feb 20, 2026):**
- Fixed bug where cluster → dataset → cluster → dataset left second dataset click not opening detail
- Root causes: (1) `selectedDataset` not cleared when `featureId` went null on cluster click; (2) `lastHandledFeatureIdRef` set before async fetch, blocking re-issue after cancellation; (3) count=1 aggregates (cluster/bin with one item) fell through to single-point path but lack `dataoneId` → silent no-op; (4) no tab switch when cluster clicked from Overview
- Fixes: new effect clears `selectedDataset` when `featureId` null; ref update deferred to post-fetch; `aggregateCount >= 1` routes count=1 through cache resolution (single-member opens detail directly); `requestBrowseTab` signal switches to Browse from Overview; `clearHighlight()` at start of every DataONE click prevents stale blue rings

**Investigation Findings (Feb 20, 2026):**
- Verified with live service checks: `FeatureServer/0` currently returns latest-only records (`is_latest_version = 0` count is 0)
- Verified preserve-bounds subset used by app has 878 records, all latest-only, with no version duplication
- Remaining issue is **cluster count desynchronization**: in some views, visible map cluster labels (e.g., 506 and 722) imply a larger universe than sidebar total (878)
- Current hypothesis: map cluster aggregation scope is not perfectly aligned with sidebar filter scope in all states/zooms

**Root Cause Found (Feb 20, 2026):**
- Cluster count desynchronization was caused by a **race condition in `populateDataOneLayer`**.
- When `browseFilters` changed rapidly (new object reference every update), the `useEffect` fired multiple concurrent runs.
- The `abortController` only guarded the fetch; after fetch completion, concurrent `populateDataOneLayer` calls would both read `source.toArray()` as empty (before either's `applyEdits` finished), causing both to `addFeatures` without deleting — **doubling the feature count** in the layer.
- ArcGIS clustering then counted ~1756 features instead of 878, inflating cluster labels.

**Fix Applied:**
1. `dataoneLayer.ts` — `populateDataOneLayer` now uses `queryFeatures({ where: '1=1' })` to detect existing features before deleting, instead of `source.toArray()` which is unreliable under concurrent edits.
2. `useMapBehavior.ts` — Added a `populateVersionRef` counter. Each effect run captures a version synchronously; after the async fetch returns, it checks whether the version is still current before proceeding. Stale runs bail out instead of racing.

**Acceptance Criteria:**
- [x] Clicking a DataONE cluster populates the right sidebar list with datasets for that clicked location/cluster
- [x] Sidebar clearly indicates that a map-location filter is active and allows clearing it
- [x] Clicking a single (non-cluster) point continues to open dataset detail as before
- [x] Large cluster clicks no longer fail with `414 Request-URI Too Large`
- [x] Cluster label counts and sidebar total are fully synchronized across zoom levels and map states (race condition fix applied)
- [x] QA pass confirms behavior across multiple zoom levels and dense cluster areas

**Estimated Time:** 2–4 hours (implementation + QA)

---

### CON-DONE-16: Switch from Circular Clustering to Grid Binning

**Goal:** Replace the current circular cluster visualization with ArcGIS **FeatureReductionBinning** (grid cell aggregation). Grid bins use zoom-dependent geohash cells, which can improve count explainability and reduce cluster ambiguity.

**Context:** The DataONE map layer uses `featureReduction: { type: 'cluster' }` by default. ArcGIS also supports `FeatureReductionBinning`. See [ArcGIS Binning docs](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-FeatureReductionBinning.html).

**What Was Implemented (Feb 20, 2026):**
- User-facing toggle in DataONE Browse: **Clusters** vs **Grid bins** (DataOneFilterContext `aggregationMode`)
- ArcGIS `FeatureReductionBinning` with `fixedBinLevel` driven by map scale (dynamic refinement on zoom)
- Bin click → sidebar population (geometry-aware member resolution: polygon bins, extent bins, point fallback)
- Color visual variables on `aggregateCount` for density; `maxScale: 0` keeps bins visible at all zoom levels (no drop-out during navigation)
- Point marker size increased for readability when bins dissolve

**Resolved UX Issues:**
- ~~**Zoomed out:** Rectangles too small~~ → Fixed: shifted scale→level mapping ~1 level coarser
- ~~**Zoom transition / blink:** Bins flicker or disappear during wheel zoom~~ → Fixed: continuous `view.watch('scale', ...)` with level-change guard; in-place `fixedBinLevel` mutation avoids full reduction rebuild; `maxScale: 0` keeps bins visible at all zoom levels

**Remaining (known limitation):**
- **Bin → points cliff:** A bin showing "252" can disappear into just a few visible dots when zooming in (many datasets share same/similar coordinates)

**Where to Fine-Tune:**

| What to adjust | File | Location |
|---------------|------|----------|
| Scale → bin level mapping (coarser = fewer, bigger bins at zoom-out) | `src/v2/components/Map/layers/dataoneLayer.ts` | `getBinningLevelForScale()` — scale thresholds and returned levels 1–9 |
| When bins turn off and show individual points | `src/v2/components/Map/layers/dataoneLayer.ts` | `maxScale` in `buildDataOneFeatureReductionForScale()` (0 = always bins) |
| Individual point size when bins are off | `src/v2/components/Map/layers/dataoneLayer.ts` | `DEFAULT_MARKER_SYMBOL` (size, outline) |
| When bin level updates on zoom | `src/v2/dataSources/dataone/useMapBehavior.ts` | Effect that calls `view.watch('scale', ...)` — bins update live when crossing scale thresholds; in-place `fixedBinLevel` mutation avoids flicker |

ArcGIS `fixedBinLevel` reference: level 1 = largest bins, level 9 = smallest. Lower numbers = fewer, bigger rectangles. See [API fixedBinLevel table](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-support-FeatureReductionBinning.html#fixedBinLevel).

**Acceptance Criteria:**
- [x] DataONE map layer supports grid binning (toggle with clusters)
- [x] Bin labels show dataset counts; bin click populates sidebar
- [x] Single-point behavior preserved when zoomed in past maxScale
- [x] Bin scale thresholds fine-tuned for desired zoom progression (few large bins → more smaller bins)
- [x] No bin blink/flicker during wheel zoom (live scale watcher + in-place fixedBinLevel mutation)

**Estimated Time:** 3–5 hours (complete)

---

### TF-13: Loading Indicator While DataONE Map Data Is Loading ✅

**Goal:** Provide immediate visual feedback when DataONE is selected and map markers are being refreshed so users know the app is working.

**Context:** QA feedback (Trisalyn, Feb 20, 2026) reported uncertainty during DataONE map loads because no loading state appears while marker data is being fetched and applied to the map layer.

**Resolution (Feb 23, 2026):**
- Added dedicated map-loading tracking in `DataOneFilterContext` (`mapLoading`, `createMapLoadingScope`)
- Wired map loading scope into `useDataOneMapBehavior` around DataONE map refresh (`getDatasetsForMapLayer` + `populateDataOneLayer`)
- Added browse-tab loading UI indicator using existing shared loading primitive:
  - `RefreshLoadingRow` with message: "Updating map markers..."
- Added Map Layers widget loading indicator support (eye-slot spinner) for DataONE map refreshes via shared cache-status loading path — consistent with iNaturalist and other data sources

**Files:** `src/v2/context/DataOneFilterContext.tsx`, `src/v2/dataSources/dataone/useMapBehavior.ts`, `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx`, `src/v2/dataSources/dataone/adapter.tsx`, `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx`

**Acceptance Criteria:**
- [x] Selecting DataONE and triggering map refresh shows a visible loading indicator in sidebar while map markers are loading
- [x] Indicator clears when map loading completes or request is cancelled
- [x] Map Layers widget row for DataONE shows loading spinner while map markers are refreshing
- [x] QA verified: indicator appears on initial DataONE activation, filter changes, and map-query-driven refreshes

**Estimated Time:** 1–2 hours (complete)

---

### TF-14: Render Specific Map Marker When Recenter Is Clicked ✅

**Goal:** When the user clicks "Recenter" (formerly "View on Map") for a DataONE dataset, the map renders a specific marker at the dataset's exact location — not just a group/cluster highlight.

**Context:** Per Trisalyn QA (Feb 20, 2026), the map was highlighting the general group area but not dropping a specific dot at the dataset location. Will's note: "We need to make sure that we're actually drawing a map marker when we click on View on Map because it looks like we are highlighting the group but we're not highlighting the specific dot location for this dataset."

**Resolution (Feb 23, 2026):**
- `DatasetDetailView` `handleRecenter` and auto-pan effect both trigger ArcGIS native highlight via `openPopupForDataoneFeature`
- Helper queries the DataONE FeatureLayer for the matching graphic by `dataoneId`, then calls `view.openPopup({ features: [feature] })` so ArcGIS applies its light-blue selection highlight
- Zoom level 16 (center case) breaks cluster grouping so the individual DataONE point is visible; extent case uses bounds
- Map Layers widget: clicking a saved dataset child view pans/zooms to the marker and opens popup (effect in `useMapBehavior.ts`)

**Files:** `src/v2/components/RightSidebar/DataOne/DatasetDetailView.tsx`, `src/v2/dataSources/dataone/useMapBehavior.ts`

**Acceptance Criteria:**
- [x] Clicking Recenter renders a visible marker at the dataset's exact coordinates
- [x] Marker is identifiable even when the underlying feature is aggregated in a cluster/bin
- [x] Auto-pan on detail open also shows the marker
- [x] Native ArcGIS light-blue highlight appears on detail view entry and Recenter (no custom overlay ring)

**Estimated Time:** 1–2 hours

---

### CON-DONE-06: Save Button — Clearly Distinguish Saved vs Unsaved State ✅

**Goal:** The sidebar Save button should clearly indicate whether the current filtered child view has a saved dataset. When viewing an already-saved dataset, show "Unsave Dataset View" instead of "Save Dataset View."

**Resolution (Feb 23, 2026):**
- `DatasetDetailView` receives `isDatasetSaved` and `onUnsaveDatasetView` props from `DataOneBrowseTab`
- Button shows "Save Dataset View" (amber) when unassigned; "Unsave Dataset View" (rose) when the current child view has this dataset pinned
- `currentViewSavedDatasetId` memo in DataOneBrowseTab derives saved state from pinned layer view's `dataoneFilters.selectedDatasetId`
- Sync effect no longer writes `selectedDatasetId`/`selectedDatasetTitle` — only explicit Save/Unsave handlers do

**Files:** `DatasetDetailView.tsx`, `DataOneBrowseTab.tsx`

**Acceptance Criteria:**
- [x] Clicking a saved child view in Map Layers shows "Unsave Dataset View" in sidebar
- [x] Clicking Unsave clears the pin; button reverts to "Save Dataset View"
- [x] Child view name reverts to filter-based label (e.g., result count) after unsave

**Estimated Time:** 2–3 hours

---

### CON-DONE-07: Persist Saved State When Returning to Already-Saved Dataset ✅

**Goal:** When the user returns to a filtered child view that has a saved dataset, the sidebar should reflect that state. Save should overwrite the current view when unassigned; create a new child view when the current view is already assigned.

**Resolution (Feb 23, 2026):**
- **Save on unassigned view:** Reuses current child view (passes `targetViewId` to `createOrUpdateDataOneFilteredView`)
- **Save on assigned view:** Creates new child view (no `targetViewId`)
- **First save from baseline:** Creates a single saved child view (no extra "All Datasets" sibling) — LayerContext no-views branch now initializes with `[newView]` only
- **Unsave:** Clears `selectedDatasetId` from current view; next save overwrites that view
- Sync effect does not write dataset assignment fields; only Save/Unsave handlers do

**Refinements (Feb 23, 2026):**
- Save Dataset View now auto-pins DataONE layer when unpinned (ensures Map Layers sync works)
- Save persists current browse filters (search, categories, file types, dates, author) plus selected dataset
- Map Layers child-view click: MapLayersWidget passes `selectedDatasetId` as featureId; sync effect resolves DataONE featureId only when view actually changes (preserves Back-to-list)
- Fix: avoid resolving featureId in activateLayer for DataONE (broke Back-to-list); explicit pass from widget + guarded sync effect

**Files:** `DataOneBrowseTab.tsx`, `LayerContext.tsx`, `MapLayersWidget.tsx`, `useMapBehavior.ts`

**Acceptance Criteria:**
- [x] Save on unassigned view overwrites current view
- [x] Save on assigned view creates new child view and navigates to it
- [x] First save pins to baseline without creating duplicate "All Datasets" child
- [x] Unsave → browse other datasets → Save overwrites the unsaved view

**Estimated Time:** 2–3 hours

---

### CON-DONE-08: Multi-Select Categories Filter Checklist ✅

**Goal:** Replace the single-category dropdown with a multi-select checklist so users can filter DataONE datasets by one or more TNC categories.

**Resolution (Feb 23, 2026):**
- Replaced single-select dropdown with a scrollable checkbox checklist in `DataOneBrowseTab`
- Added "Select all" and "Clear all" buttons on the same line as the status text ("No category filter applied" / "N selected")
- Extended `DataOneBrowseFilters` and `DataOneViewFilters` to use `tncCategories: string[]` (with legacy `tncCategory` fallback for saved views)
- Updated `dataOneService.buildWhereClause` to support OR-based category matching across multiple selections
- Wired multi-category filters through browse query, map layer refresh, and LayerContext sync (filter summary, view naming, equality checks)
- Empty selection = no category filter applied (shows all datasets)

**Files:** `DataOneBrowseTab.tsx`, `DataOneFilterContext.tsx`, `dataOneService.ts`, `useMapBehavior.ts`, `LayerContext.tsx`, `src/v2/types/index.ts`, `src/types/dataone.ts`

**Acceptance Criteria:**
- [x] Categories shown as checkbox checklist with scrollable list
- [x] Multi-select filters datasets by OR of selected categories (tnc_category or tnc_categories)
- [x] Select all / Clear all buttons; status text on same row
- [x] Map markers and browse list both respect multi-category filter
- [x] Saved views and Map Layers sync correctly with category arrays

**Estimated Time:** 2–3 hours

---

### CON-DONE-02: Auto-Pan/Zoom When Opening Dataset Detail; Repurpose View on Map as Recenter

**Goal:** When the user opens a DataONE dataset detail view (from browse card or map click), the map automatically pans and zooms to the dataset location. The former "View on Map" button is repurposed as "Recenter" for recoverability when the user has panned away.

**Context:** Per consolidated feedback (Feb 18, 2026), auto-pan/zoom should happen on click when opening the detail view; "View on Map" becomes a conditional Recenter action.

**Implementation Notes (Feb 20, 2026):**
- `DatasetDetailView`: Added `useEffect` that auto-pans/zooms when `dataset` or `details` change (on open, version switch, or when bounds load from details)
- Uses `lastPannedDatasetIdRef` to avoid duplicate pans when details load after center-based pan
- Supports both center point (`centerLon`/`centerLat`) and spatial extent bounds from detail metadata
- Zoom level 16 for center case (breaks cluster grouping so individual dataset dot is visible); extent case uses `Extent.expand(1.2)` for padding
- `dataoneLayer.ts`: Cluster `maxScale: 12_000` so clustering turns off at close zoom; selected dataset resolves to a visible dot
- Renamed "View on Map" button to "Recenter"; handler `handleRecenter` shows toast on manual recenter
- Card click in browse list now calls `activateLayer` with dataset ID for map/sidebar sync

**Refinements (Feb 23, 2026):**
- After camera settles, `openPopupForDataoneFeature` queries the DataONE layer for the selected dataset's graphic and opens ArcGIS popup so native light-blue highlight appears on detail open and Recenter.

**Acceptance Criteria:**
- [x] Opening dataset detail (card click or map point click) auto-pans/zooms map to dataset location
- [x] "View on Map" repurposed as "Recenter" for when user has panned away
- [x] Version switch within detail view triggers auto-pan to new version's location
- [x] Datasets with bounds-only (no center) pan when detail metadata loads

**Estimated Time:** 1–2 hours

---

### CON-DONE-09: Search by Title and Abstract/Keywords ✅

**Goal:** DataONE browse search should match datasets by `title`, `abstract`, and `keywords` (not title-only).

**Context:** Existing search used Layer 0 (Lite) and only applied `title LIKE ...`. Layer 0 does not include `abstract`/`keywords`, so users could not find datasets when the term existed only in those metadata fields.

**Resolution (Feb 23, 2026):**
- Added dynamic search-layer selection in `dataOneService`: when `searchText` is present, browse and map queries use Layer 1 (Latest); otherwise they continue using Layer 0 (Lite)
- Expanded text predicate for search-enabled queries to:
  - `title LIKE ... OR abstract LIKE ... OR keywords LIKE ...`
- Kept non-search paths on Lite layer for performance and existing behavior parity
- Updated DataONE browse search input placeholder text to communicate supported fields ("Search title, abstract, or keywords...")

**Acceptance Criteria:**
- [x] Entering a term found only in `abstract` returns matching datasets
- [x] Entering a term found only in `keywords` returns matching datasets
- [x] Existing title search behavior remains intact
- [x] Map-layer query path respects the same search semantics when search text is applied
- [x] QA pass confirmed

**Files:** `src/services/dataOneService.ts`, `src/types/dataone.ts`, `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx`

**Estimated Time:** 2–4 hours

---

### CON-DONE-10: Filter by File Type (CSV, TIF, Imagery, Other) ✅

**Goal:** Allow users to filter DataONE datasets by file-type buckets (`CSV`, `TIF`, `Imagery`, `Other`) using the `files_summary.by_ext` metadata.

**Resolution (Feb 23, 2026):**
- File-type checklist in `DataOneBrowseTab` with Select all / Clear all (mirrors category filter pattern)
- `fileTypes` wired through `DataOneFilterContext`, `DataOneViewFilters`, LayerContext sync, view naming, filter summary, and filter count
- Browse queries, map refresh, and saved views all respect file-type filters
- Service-level matching in `dataOneService`: parses `files_summary.by_ext`, buckets extensions (csv, tif/tiff/geotiff, imagery types, other), applies client-side filtering and pagination when file-type filters are active

**Files:** `DataOneBrowseTab.tsx`, `DataOneFilterContext.tsx`, `dataOneService.ts`, `useMapBehavior.ts`, `LayerContext.tsx`, `src/types/dataone.ts`, `src/v2/types/index.ts`

**Acceptance Criteria:**
- [x] User can select one or more file-type buckets (CSV, TIF, Imagery, Other)
- [x] Browse list updates to include datasets matching any selected bucket
- [x] Result count and pagination reflect file-type-filtered results
- [x] Map markers respect selected file-type buckets
- [x] Saved views persist and restore file-type filter selections
- [x] Metadata-only datasets (no files_summary) excluded when file-type filter active

**Estimated Time:** 2–4 hours

---

### CON-DONE-14: Search Highlight — Show Matching Keyword Inside Abstract Snippet ✅

**Goal:** When search returns results, highlight the matching keyword in the abstract snippet on browse cards (Google-style). Improves scanability and feedback (visibility of system status).

**Resolution (Feb 23, 2026):**
- Added optional `abstract` field to `DataOneDataset`; `liteRecordToDataset` carries abstract when Layer 1 (Latest) returns it during search
- `DatasetListView` receives `searchTerm` from `DataOneBrowseTab`; when abstract exists, renders contextual snippet (~180 chars) with case-insensitive phrase match highlighted via `<mark>` (Tailwind `bg-amber-100`)
- `buildHighlightedSnippet` extracts window around first match; leading/trailing ellipses when clipped
- Fallback to generic description text when no abstract; no highlight marks when search term empty

**Files:** `src/types/dataone.ts`, `src/services/dataOneService.ts`, `src/v2/components/RightSidebar/DataOne/DatasetListView.tsx`, `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx`, `DatasetListView.test.tsx`

**Acceptance Criteria:**
- [x] Search results show abstract snippet when available
- [x] Matching phrase highlighted in snippet (case-insensitive)
- [x] Fallback text when no abstract; no highlight when search empty

**Estimated Time:** 1–2 hours

---

### CON-DONE-15: Spatial Query for DataONE Datasets ✅

**Goal:** Ensure the spatial query (draw polygon/rectangle, query by extent) correctly filters DataONE datasets. When the user draws a query area on the map, DataONE browse results should be constrained to datasets whose spatial extent intersects the drawn area.

**Resolution (Feb 23, 2026):** Verified working. Draw/query tools filter DataONE datasets by extent; integrates with SpatialQuerySection.

**Context:** The app has a `SpatialQuerySection` component used for spatial filtering. DataONE datasets have `center_lat`/`center_lon` and/or `north_bound`/`south_bound`/`east_bound`/`west_bound` fields. The spatial query must apply to DataONE when that data source is active.

**Acceptance Criteria:**
- [x] Drawing a polygon/rectangle on map filters DataONE datasets to those intersecting the extent
- [x] Browse list and cluster map both reflect the spatial filter
- [x] Clearing the spatial query restores full dataset list
- [x] Works with DataONE Layer 0 (Lite) and Layer 1 (Latest) as appropriate

**Estimated Time:** 4–6 hours

---

## Service Analysis

> Completed during archived Task 4.1. See archive for full details.

### Feature Service URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer` — see "Feature Service (Inspect DataONE Layer)" above for layer URLs.

### Dataset Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `dataone_id` | string | Unique ID, display, links | DOI-like identifier used as canonical dataset identity (example: `doi:10...`). |
| `title` | string | Card + detail display, text search | Primary search/display field in layer 0/1/2. |
| `authors` | semicolon-delimited string | Card + detail display, optional filter | Needs parsing to array in UI (`;` delimiter). |
| `abstract` | string | Detail display, text search (optional) | Available in layers 1/2 only (not layer 0). |
| `keywords` | delimiter-separated string | Detail display, optional search expansion | Available in layers 1/2 only; can be long. |
| `tnc_category` | string | Primary category filter | AI-enriched primary category. |
| `tnc_categories` | semicolon-delimited string | Multi-category chips/filter matching | Supports cross-category tagging; includes secondary categories. |
| `tnc_confidence` | number | QA/debug info | AI category confidence score (0-1). |
| `date_uploaded` | epoch ms | Sort, recency display | Good default sort: `date_uploaded DESC`. |
| `begin_date`, `end_date` | epoch ms | Year/temporal filters | Supports temporal range filtering. |
| `files_summary` | JSON string | Card file counts/types | Contains `total`, `by_ext`, `size_bytes`; parse in client. |
| `dataset_url` | string | "Open in DataONE" action | DataONE landing page URL. |
| `data_url` | string | Advanced/download action | Data resolver URL (layers 1/2). |
| `external_url` | string nullable | External source link fallback | Used for metadata-only datasets. |
| `center_lat`, `center_lon` | number | Map point geometry | Reliable map plotting fallback if feature geometry omitted. |
| `north_bound`, `south_bound`, `east_bound`, `west_bound` | number | Spatial coverage in detail | Bounding box fields available in layers 1/2. |
| `series_id`, `version_count`, `is_latest_version` | string/int/bool-ish | Version history UX | Supports "latest vs all versions" views. |

### Layer Usage Recommendation

- **Layer 0 (`Lite`) for browse list + count queries (no text search):** fastest payload, includes core fields needed for cards/filtering.
- **Layer 1 (`Latest`) for text search and detail view:** when `searchText` is present, browse/count/map queries use Layer 1 to match title + abstract + keywords; also used for detail view (abstract, keywords, authors, bbox fields, `data_url`).
- **Layer 2 (`AllVersions`) for version history only:** use when user explicitly requests historical versions.

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, follow the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 4:** DataOne query/search filters can plug into existing child-view synchronization patterns rather than inventing a new widget-sidebar contract.
- **Phase 4 verification:** Confirm DataOne filter/search state hydrates from "Edit Filters," child query params update from sidebar edits, and custom child names remain stable after query changes.
- DataOne branch should adopt shared Map Layers child-view rename semantics: manual rename persists as custom and is not overwritten by sync.
- Provide DataOne-specific auto naming for non-custom views (query/category/year driven labels), while preserving shared child `viewId` navigation/edit flows.

---

## Open Questions

- [ ] Should we reuse code from existing `DataONEDetailsSidebar.tsx`?
- [ ] How to handle datasets with many files?
- [ ] Keyword click behavior - filter by that keyword?
- [ ] Preview capability vs. link to DataOne?
- [ ] ~~Should we switch from point clustering to grid/bin aggregation?~~ → Tracked in CON-DONE-16

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 24, 2026 | CON-DONE-17 marked complete. QA confirmed: 3D icon rendering and marker click behavior now work as expected; 2D behavior unchanged. Phase progress updated to 16/17. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v3: GraphicsLayer overlay for 3D (Dendra pattern). FeatureLayer hidden in SceneView; overlay handles rendering + hitTest + popup. Click handler swaps `include` target between FeatureLayer (2D) and overlay (3D). Removed coordinate fallback and PointSymbol3D (no longer needed). QA pending. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v2: screen-distance coordinate fallback + PointSymbol3D renderer. User reported: sidebar syncs but dots render weirdly, no map visual feedback on click. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v1: `hitTest({ include: [layer] })` for SceneView click detection; removed per-graphic `symbol` from `populateDataOneLayer`. User reported: 2D works, 3D still broken, dots look weird. | Assistant |
| Feb 24, 2026 | Added CON-DONE-17 for 2D/3D DataONE marker-click synchronization + dot-rendering revert request. Documented attempted fixes and next-window handoff steps after unresolved 3D detail-open regression. Updated progress to 15/17. | Assistant |
| Feb 23, 2026 | **DataONE native ArcGIS highlight + cluster/saved-view fix.** Replaced custom cyan ring with ArcGIS popup highlight: `openPopupForDataoneFeature` in DatasetDetailView (detail open, Recenter) and useMapBehavior (Map Layers saved-dataset click). Cluster click: preserve viewId when coming from saved dataset view; pan-only (no zoom) so sidebar filters without snapping to saved detail. | Assistant |
| Feb 23, 2026 | **DataONE Save View + Map Layers sync refinements.** Save Dataset View: auto-pin when unpinned; persist current browse filters + selected dataset. Map Layers child-view click: explicit featureId pass from MapLayersWidget; sync effect resolves DataONE featureId only when view changes (preserves Back-to-list). Cluster click: removed custom highlight ring; safe auto-zoom (only when cluster stays visible). | Assistant |
| Feb 23, 2026 | Quick Task Summary sync: added D20-B02 (Dan backend follow-up) so phase progress reflects 15/16 accurately; CON-DONE-12/13 remain tracked in Phase 5 handoff. | Assistant |
| Feb 23, 2026 | CON-DONE-15 marked complete. Spatial query (draw/query tools) filters DataONE datasets by extent; verified working with SpatialQuerySection. | User |
| Feb 23, 2026 | CON-DONE-10 marked complete. File-type filter (CSV/TIF/Imagery/Other) checklist, client-side filtering from files_summary.by_ext, wired through browse/map/saved views. | Assistant |
| Feb 23, 2026 | CON-DONE-09 marked complete. Search by title + abstract + keywords; Layer 1 used when searchText present; browse, map, count paths updated. | Assistant |
| Feb 23, 2026 | CON-DONE-08 marked complete. Multi-select categories checklist; Select all / Clear all; tncCategories wired through browse, query, map, and saved views. | Assistant |
| Feb 23, 2026 | CON-DONE-06 and CON-DONE-07 marked complete. Save/Unsave button state; overwrite vs new-child logic; first save pins to baseline; sync no longer writes selectedDatasetId. | Assistant |
| Feb 23, 2026 | CON-DONE-05 marked complete. Map vs sidebar count discrepancy resolved via D20-09 dedupe + CON-DONE-01 race-condition fix. | User |
| Feb 23, 2026 | Removed CON-DONE-04 (improve point dispersion on zoom). | User |
| Feb 23, 2026 | Removed CON-DONE-03 (cluster popup for scrolling datasets). Sidebar already shows datasets at cluster location. | User |
| Feb 23, 2026 | TF-13 marked complete. DataONE map-loading indicator in browse tab + Map Layers eye-slot spinner; consistent with iNaturalist pattern. | Assistant |
| Feb 23, 2026 | TF-13 update: wired DataONE map-loading into Map Layers widget eye-slot spinner using shared cache-status loading flow (consistent with existing row-level loading pattern). | Assistant |
| Feb 23, 2026 | TF-13 started: added DataONE map-loading state (`mapLoading`) and browse-tab loading indicator ("Updating map markers...") wired to map marker refresh lifecycle. QA pending before complete. | Assistant |
| Feb 23, 2026 | TF-14 marked complete. Recenter/View on Map now renders a specific marker (highlightPoint cyan ring) at dataset coordinates; zoom 16 breaks clusters for visibility. | Assistant |
| Feb 23, 2026 | D20-09 marked complete. Map and browse already use Lite layer + dedupeDatasetsByDataoneId; one point per dataone_id, prefers isLatestVersion. Verified visually. | Assistant |
| Feb 20, 2026 | CON-DONE-01 refinement: Fixed cluster↔dataset click navigation. Cluster click now always shows filtered list; dataset click always shows detail. Fixed selectedDataset not clearing, lastHandledFeatureIdRef race, count=1 aggregate silent no-op, tab switch from Overview, stale highlight rings. | Assistant |
| Feb 20, 2026 | CON-DONE-02: marked complete. Auto-pan/zoom on dataset detail open; "View on Map" repurposed as "Recenter". Zoom 16 + cluster maxScale 12_000 so selected dataset breaks out of cluster and shows as dot. | Assistant |
| Feb 20, 2026 | CON-DONE-16: final UX fix. Switched to continuous `view.watch('scale', ...)` with level-change guard; in-place `fixedBinLevel` mutation avoids full reduction rebuild flicker; `maxScale: 0` keeps bins visible during zoom. Bins now resize live when crossing thresholds without blink-out. | Assistant |
| Feb 20, 2026 | CON-DONE-16: marked complete. Switched to `view.watch('stationary', ...)` to eliminate bin blink during wheel zoom; scale thresholds tuned. | Assistant |
| Feb 20, 2026 | CON-DONE-16: fine-tuned bin scale thresholds (shifted ~1 level coarser); added debounced scale watcher with level-change guard to eliminate flicker on zoom. | Assistant |
| Feb 20, 2026 | CON-DONE-16: marked in progress; documented implemented features, remaining UX issues (zoomed-out bins too small, abrupt bin→points transition), and "Where to fine-tune" code pointers for future tuning. | Assistant |
| Feb 20, 2026 | CON-DONE-16 update: added DataONE Browse toggle for map aggregation mode (`Clusters`/`Grid bins`) and made cluster default while validating bin rendering. | Assistant |
| Feb 20, 2026 | CON-DONE-16 started: switched DataONE map layer to `FeatureReductionBinning`; updated aggregate label/popup fields and map click handling for bin-aware aggregate resolution. QA pending. | Assistant |
| Feb 20, 2026 | CON-DONE-01 marked complete; added CON-DONE-16 (switch to grid binning) as next task. | Assistant |
| Feb 20, 2026 | CON-DONE-01: Fixed cluster count desynchronization — root cause was race condition in populateDataOneLayer (concurrent applyEdits doubling features). Applied queryFeatures-based deletion + populate-version guard. | Assistant |
| Feb 20, 2026 | Updated CON-DONE-01 findings: latest-only records confirmed; added unresolved cluster count desynchronization investigation notes; documented large-cluster 414 fix. | Assistant |
| Feb 20, 2026 | Started CON-DONE-01 implementation: map cluster click now drives DataONE sidebar list via cluster-member ID filtering; pending QA. | Assistant |
| Feb 19, 2026 | Added CON-DONE-15: Spatial query for DataONE datasets — ensure draw/query tools filter by extent. | — |
| Feb 18, 2026 | Archived tasks 4.1–4.12 to `docs/archive/phases/phase-4-dataone-completed.md`. Phase doc reset for new tasks. | User |
