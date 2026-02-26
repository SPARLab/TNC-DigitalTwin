# Phase 12: AI Refactor Readiness — Archived Completed Tasks

**Archived:** Feb 25, 2026  
**Purpose:** Archive of completed Phase 12 AI refactor tasks moved out of the active phase tracker.  
**Source:** `docs/IMPLEMENTATION/phases/phase-12-ai-refactor.md`

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| REF-01 | 🟢 Complete | Feb 25, 2026 | Extract `LayerContext` filter helper builders/counts/equality logic into dedicated utility modules | Extracted to `utils/layerFilterBuilders.ts` and `utils/layerFilterEquality.ts`; public API unchanged. |
| REF-02 | 🟢 Complete | Feb 25, 2026 | Split `LayerContext` into focused internal modules (core state/actions, per-source sync actions, view lifecycle actions) | Extracted source-sync, filtered-view, core-state/actions, and view-lifecycle internal hooks; `useLayers()` contract unchanged. |
| REF-03 | 🟢 Complete | Feb 25, 2026 | Split `src/v2/V2App.tsx` into app shell, route composition, and provider composition files | Extracted to `app/V2AppProviders.tsx`, `app/V2AppRoutes.tsx`, and `app/V2AppShell.tsx`; zero UI behavior changes. |
| REF-04 | 🟢 Complete | Feb 25, 2026 | Split V2 map container modules by responsibility (`src/v2/components/Map/MapContainer.tsx` + `useMapLayers.ts`) | Extracted map view lifecycle + DataONE preview-state hooks and split map-layer sync into membership/presentation internal hooks; behavior preserved. |
| REF-05 | 🟢 Complete | Feb 25, 2026 | Decompose V2-critical data/service paths (V2 call sites for ANiML/DataONE/TNC ArcGIS) into client/query/normalizer modules | Subtasks A–C complete (TNC ArcGIS, DataONE, ANiML); REF-05D deferred for lower-priority sources; API surface preserved. |
| REF-05A | 🟢 Complete | Feb 25, 2026 10:09 PST | Extract TNC ArcGIS shared helpers into client/query/normalizer modules | Added `src/v2/services/tncArcgis/{client,queries,normalizers}.ts` and rewired `src/v2/services/tncArcgisService.ts` with stable exports. |
| REF-05B | 🟢 Complete | Feb 25, 2026 10:16 PST | Extract DataONE service query/filter/normalizer/client helpers into dedicated modules | Added `src/services/dataone/{client,queries,normalizers}.ts` and rewired `src/services/dataOneService.ts` without changing consumer API. |
| REF-05C | 🟢 Complete | Feb 25, 2026 10:16 PST | Extract ANiML retry/network client helpers into dedicated modules | Added `src/services/animl/client.ts` and rewired `src/services/animlService.ts` to use extracted retry client. |
| REF-06 | 🟢 Complete | Feb 25, 2026 | Refactor V2 DataONE right-sidebar browse/detail flow into orchestration + focused child components | Extracted `useDataOneBrowseOrchestrator` and `useDatasetDetailOrchestrator`; `DataOneBrowseTab` and `DatasetDetailView` now primarily render UI; map↔sidebar sync transitions centralized for easier debugging. |
| REF-07 | 🟢 Complete | Feb 25, 2026 | Create shared browse-tab primitives for repeated patterns (search/filter/pagination/detail handoff) | Subtasks REF-07A, REF-07B, REF-07C, and REF-07D are complete. QA is intentionally handled per task and not tracked as REF-07E here. |
| REF-07A | 🟢 Complete | Feb 25, 2026 10:56 PST | Search primitive rollout completion | Adopted `useBrowseSearchInput` in browse flows where debounced text search duplication existed (DataONE, GBIF, CalFlora). |
| REF-07B | 🟢 Complete | Feb 25, 2026 10:56 PST | Pagination primitive rollout completion | Adopted `BrowsePaginationControls` across matching browse/paged list flows (DataONE, GBIF, CalFlora, iNaturalist, ANiML `ImageList`) including one-based pagination support. |
| REF-07C | 🟢 Complete | Feb 25, 2026 | Detail handoff primitive | Added shared list→detail activation/close helpers in `RightSidebar/shared/browseDetailHandoff.ts` and adopted in DataONE, GBIF, and CalFlora to keep map↔sidebar selection transitions sync-safe. |
| REF-07D | 🟢 Complete | Feb 25, 2026 11:31 PST | Saved-view/filter-sync primitive | Added `RightSidebar/shared/browseFilterSyncGuards.ts` and adopted hydrate/sync guard + pinned-view filter restore helpers in DataONE, GBIF, CalFlora, and iNaturalist browse flows. |
| REF-08 | 🟢 Complete | Feb 25, 2026 | Split large V2 detail sidebars into domain sections and supporting hooks | REF-08A..REF-08D complete; smoke checks passed. |
| REF-08A | 🟢 Complete | Feb 25, 2026 18:00 PT | Extract Dendra station detail view into focused sections + supporting state hook | Split `StationDetailView` into `useStationDetailState` and focused section components (`StationCrossStationToolsSection`, `StationHeaderCard`, `DatastreamSummaryListSection`, `DatastreamFilterSection`, `StationChartHintCard`) without behavior changes. |
| REF-08B | 🟢 Complete | Feb 25, 2026 | Extract DataONE dataset detail view into domain sections and presentational modules | Extracted to `DatasetDetailSections.tsx` and `datasetDetailFormatting.ts`; `useDatasetDetailOrchestrator` remains orchestration boundary; behavior preserved. |
| REF-08C | 🟢 Complete | Feb 25, 2026 | Apply the same detail-view split pattern to remaining right-sidebar hotspots | Extracted `TNCArcGISOverviewTab` render sections into `TNCArcGISOverviewSections.tsx` (context, description, layer list, metadata, opacity, inspect action, source card, overlay); behavior and DOM ids preserved. |
| REF-08D | 🟢 Complete | Feb 25, 2026 | Run targeted smoke checks for map↔sidebar detail flows after each extraction | Manual checklist executed; back nav, recenter, save/pin, selection retention validated for DataONE, Dendra, TNC ArcGIS. |
| REF-09 | 🟢 Complete | Feb 25, 2026 18:35 PT | Narrow large V2 contexts (`src/v2/context/MapContext.tsx`, `src/v2/context/DendraContext.tsx`) into focused hooks/modules | Extracted internal hooks under `mapContext/internal` and `dendraContext/internal`; preserved `MapProvider`/`useMap` and `DendraProvider`/`useDendra` APIs. |
| REF-10 | 🟢 Complete | Feb 25, 2026 | Extract shared V2 filter/default state factories used across contexts and browse views | Extracted `layerFilterDefaults.ts` and `browseFilterDefaults.ts`; adopted across LayerContext internals, filter contexts, and browse reset flows; behavior preserved. |
| REF-11 | 🟢 Complete | Feb 25, 2026 | Add lightweight file-size guardrail script and thresholds for V2 AI-friendly maintenance | Added `scripts/v2/check-file-size-guardrail.mjs`; `npm run guard:v2-file-size`; WARN ≥800, REVIEW ≥950; warning-only, exits 0. |
| REF-13 | 🟢 Complete | Feb 25, 2026 | Resolve V2 MOTUS 3D journey playback regression (stations render, inferred flight legs do not) | Fixed: recreate MOTUS overlay GraphicsLayer on 2D↔3D map swap (SceneView cannot create layerview for stale 2D-origin layer); view-mode redraw trigger + 3D-safe direction marker fallback. User-verified. |
| REF-14 | 🟢 Complete | Feb 25, 2026 | Ensure all layers (active or pinned+visible) render reliably across 2D↔3D toggles | REF-14A + REF-14B done. REF-14C/D deferred for future sessions. |
| REF-14A | 🟢 Complete | Feb 25, 2026 | Fix DroneDeploy imagery persistence across 2D↔3D map replacement | Detect parent `GroupLayer` replacement and recreate/rebind cached WMTS layers instead of reusing stale map-bound instances. |
| REF-14B | 🟢 Complete | Feb 25, 2026 | Audit all per-source map behaviors for stale layer refs across map swaps | iNaturalist + ANiML GraphicsLayer repopulation on map swap; Dendra/GBIF/CalFlora/iNaturalist/ANiML map handlers rebind on `mapReady`. User-verified. |
| REF-15 | 🟢 Complete | Feb 25, 2026 | Preserve camera (zoom, position, angle) across 2D↔3D view-mode switches | Capture center+scale from outgoing view; 2D→3D: latitude scale conversion; 3D→2D: raw scale; lifecycle fix to persist from local view before destroy. User-verified. |
| REF-16 | 🟢 Complete | Feb 25, 2026 | Add floating toggle button to show/hide LiDAR (PointCloudLayer) in 3D mode | Unified `MapControlRail`: 2D/3D text toggle, LiDAR icon, zoom +/−, compass. All buttons 32×32. Future: support multiple LiDAR layers. |

---

## REF-15: Camera Preservation Across 2D↔3D — Context (Complete)

**User requirement:** When switching between 2D and 3D, the camera should behave as follows:

- **2D → 3D:** Preserve zoom level, camera position, and camera angle. The user should see the same view, just in 3D.
- **3D → 2D:** Preserve zoom level and camera position; set camera angle straight down (nadir). 2D only supports a top-down view, so the angle must be normalized.

**Implementation:** `useArcgisViewLifecycle.ts` — capture center+scale from outgoing view; 2D→3D latitude scale conversion; 3D→2D raw scale; lifecycle fix to persist from local view before destroy.

---

## REF-14: 2D↔3D Layer Render Reliability — Context (REF-14A/B Complete; REF-14C/D Deferred)

**User requirement:** For any layer that is active or pinned with visibility on, polygons and imagery must render on the map regardless of how many times the user toggles between 2D and 3D.

**Discovery from REF-13 (MOTUS fix):**

1. **Map/view replacement:** `useArcgisViewLifecycle` creates a **new Map instance** when `viewMode` changes. The previous Map and View are destroyed. Layers on the old map are orphaned.

2. **Re-attach vs recreate:** Re-adding the *same* layer instance to the new map can fail. For MOTUS, SceneView reported `Failed to create layerview for layer ... of type 'graphics'` when we tried to `map.add(overlayRef.current)` with a GraphicsLayer that had been created and used in the prior MapView. ArcGIS appears to bind layer instances to the map/view context in which they were created.

3. **Working fix for MOTUS:** Destroy the old overlay, create a **new** GraphicsLayer, add it to the new map, then redraw graphics. Key trigger: `!map.findLayerById(overlayRef.current.id)` — overlay is not on the current map, so we recreate instead of reattach.

4. **Other layer types:** The central layer flow (`createMapLayer`, `useMapLayers`) may behave differently—layers could be re-created by the factory each render, or there could be caching. Data sources that add their own overlays (GraphicsLayers, etc.) are the most likely to need the recreate-on-map-swap pattern.

5. **Relevant files:**
   - `src/v2/components/Map/internal/useArcgisViewLifecycle.ts` — creates/destroys Map+View on `viewMode` change
   - `src/v2/dataSources/motus/useMapBehavior.ts` — REF-13 fix: overlay recreate pattern
   - `src/v2/components/Map/MapContainer.tsx` + `useMapLayers` — central layer add/remove
   - Per-data-source map behavior hooks under `src/v2/dataSources/*/`

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-12-ai-refactor.md`
- **Master plan:** `docs/master-plan.md`
