# Phase 12: AI Refactor Readiness

**Status:** 🟡 In Progress  
**Progress:** 17 / 20 tracked items complete (REF-12 deferred; REF-14B complete; REF-14C/D deferred; REF-16 complete)  
**Branch:** `v2/refactor-ai-readiness`  
**Depends On:** Existing V2 implementation stability (Phases 0-11)  
**Owner:** TBD

---

## Quick Task Summary

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
| REF-05D | ⏸ Deferred | Feb 25, 2026 | Evaluate and extract remaining service paths only where coupling justifies split | Deferred; next-pass candidates: `inaturalist`, `dendra`, `motus`, `calflora`, `drone`, `gbif`; extraction-only and backward compatible. |
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
| REF-12 | ⏸ Deferred | Feb 25, 2026 17:05 PT | Define and document V2 refactor completion criteria + QA checklist for extraction-only changes | Deferred; focus on high-impact work first; revisit when solidifying smoke criteria. |
| REF-13 | 🟢 Complete | Feb 25, 2026 | Resolve V2 MOTUS 3D journey playback regression (stations render, inferred flight legs do not) | Fixed: recreate MOTUS overlay GraphicsLayer on 2D↔3D map swap (SceneView cannot create layerview for stale 2D-origin layer); view-mode redraw trigger + 3D-safe direction marker fallback. User-verified. |
| REF-14 | 🟢 Complete | Feb 25, 2026 | Ensure all layers (active or pinned+visible) render reliably across 2D↔3D toggles | REF-14A + REF-14B done. REF-14C/D deferred for future sessions. |
| REF-14A | 🟢 Complete | Feb 25, 2026 | Fix DroneDeploy imagery persistence across 2D↔3D map replacement | Detect parent `GroupLayer` replacement and recreate/rebind cached WMTS layers instead of reusing stale map-bound instances. |
| REF-14B | 🟢 Complete | Feb 25, 2026 | Audit all per-source map behaviors for stale layer refs across map swaps | iNaturalist + ANiML GraphicsLayer repopulation on map swap; Dendra/GBIF/CalFlora/iNaturalist/ANiML map handlers rebind on `mapReady`. User-verified. |
| REF-14C | ⏸ Deferred | Feb 25, 2026 | Add manual smoke matrix for repeated 2D↔3D toggles across representative layer types | Cover polygons, imagery, service layers, and graphics overlays in active and pinned+visible states. |
| REF-14D | ⏸ Deferred | Feb 25, 2026 | Final hardening + cleanup for any discovered toggle regressions | Resolve residual stale-layer edge cases and update REF-14 notes before marking complete. |
| REF-15 | 🟢 Complete | Feb 25, 2026 | Preserve camera (zoom, position, angle) across 2D↔3D view-mode switches | Capture center+scale from outgoing view; 2D→3D: latitude scale conversion; 3D→2D: raw scale; lifecycle fix to persist from local view before destroy. User-verified. |
| REF-16 | 🟢 Complete | Feb 25, 2026 | Add floating toggle button to show/hide LiDAR (PointCloudLayer) in 3D mode | Unified `MapControlRail`: 2D/3D text toggle, LiDAR icon, zoom +/−, compass. All buttons 32×32. Future: support multiple LiDAR layers. |

---


**Out of Scope for REF-07 tracking:** QA + stabilization (`REF-07E`) is intentionally not tracked here because QA is handled per task.

---

## Phase Goal

Reduce large, mixed-responsibility files so AI assistants can make safer, more precise code changes with lower context overload and lower regression risk.

**Scope Guardrail:** Phase 12 tasks are **V2-only** unless a shared module is required by V2 call paths; in those cases, changes must be extraction-only and backward compatible for existing consumers.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Core target file: `src/v2/context/LayerContext.tsx`

## Refactor Principles

- Prefer extraction and composition over rewrites.
- Preserve public APIs first; change internals in small slices.
- No behavior changes unless explicitly scoped.
- Prioritize readability over micro-optimizations.
- Keep tasks small enough for a single focused chat window.
- Use complexity/coupling as the primary trigger; line count is secondary.

## V2 Sizing Baseline (Feb 25 Snapshot)

- V2 currently has **no 1k-2k line files**; most hotspots are in the ~550-950 range.
- This phase is not emergency "break giant files" work; it is precision cleanup for AI editability.
- Refactor candidates should satisfy at least one of:
  - high coupling across map/context/sidebar concerns,
  - many effects/watchers or orchestration branches,
  - frequent merge conflict surface across parallel branches.
- Avoid splitting medium files that are cohesive and stable; prefer targeted extraction where edit-risk is high.

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| REF-01 | Extract LayerContext helper utilities | 🟢 Complete | | Foundation task for REF-02. |
| REF-02 | Split LayerContext internal modules | 🟢 Complete | | Core provider now orchestrates extracted source-sync, filtered-view, core-state/actions, and view lifecycle modules with stable `useLayers()` API. |
| REF-03 | Split V2App shell/routes/providers | 🟢 Complete | | Extracted to `app/V2AppProviders.tsx`, `app/V2AppRoutes.tsx`, `app/V2AppShell.tsx`; V2App now orchestrates state + composition only. |
| REF-04 | Split V2 map container modules by responsibility | 🟢 Complete | | Extracted map lifecycle/preview logic into internal hooks and split layer sync effects into membership + presentation hooks with stable behavior. |
| REF-05 | Decompose V2-critical data/service paths (V2 call sites for ANiML/DataONE/TNC ArcGIS) into client/query/normalizer modules | 🟢 Complete | | Subtasks A–C complete (TNC ArcGIS, DataONE, ANiML). REF-05D deferred for lower-priority sources; extraction-only, API surface preserved. |
| REF-06 | Refactor V2 DataONE browse/detail components | 🟢 Complete | | Extracted `useDataOneBrowseOrchestrator.ts` and `useDatasetDetailOrchestrator.ts`; browse and detail components now delegate map↔sidebar sync to centralized handlers; behavior preserved, DataOne validated working. |
| REF-07 | Build shared browse primitives | 🟢 Complete | | Work is split into REF-07A..REF-07D; REF-07A, REF-07B, REF-07C, and REF-07D are complete. |
| REF-08 | Split large V2 detail sidebars | 🟢 Complete | | REF-08A..REF-08D complete; smoke checks passed. |
| REF-08A | Extract Dendra station detail view into focused sections + supporting state hook | 🟢 Complete | | Completed extraction-only split of `StationDetailView` into a state hook plus focused section components; behavior preserved. |
| REF-08B | Extract DataONE dataset detail view into domain sections and presentational modules | 🟢 Complete | | Extracted to `DatasetDetailSections.tsx` and `datasetDetailFormatting.ts`; orchestrator unchanged; behavior preserved. |
| REF-08C | Apply detail-view split pattern to remaining right-sidebar hotspots | 🟢 Complete | | Extracted `TNCArcGISOverviewTab` into `TNCArcGISOverviewSections.tsx`; behavior preserved. |
| REF-08D | Run targeted smoke checks for map↔sidebar detail flows after each extraction | 🟢 Complete | | Manual checklist executed; back nav, recenter, save/pin, selection retention validated for DataONE, Dendra, TNC ArcGIS. |
| REF-09 | Narrow large V2 context modules | 🟢 Complete | | Extracted map toast/preview/spatial-query and Dendra cache/filter/chart internal hooks; consumer APIs preserved. |
| REF-10 | Extract shared V2 filter/default factories | 🟢 Complete | | Extracted `context/utils/{layerFilterDefaults,browseFilterDefaults}.ts`; replaced duplicated literals in LayerContext internals and adopted in DataONE/GBIF/CalFlora/MOTUS + Dendra; APIs unchanged. |
| REF-11 | Add V2 file-size guardrail script | 🟢 Complete | | Added `scripts/v2/check-file-size-guardrail.mjs`; `npm run guard:v2-file-size`; WARN ≥800, REVIEW ≥950; warning-only, exits 0. |
| REF-12 | Add V2 extraction QA checklist | ⏸ Deferred | | Deferred; revisit when ready to solidify smoke criteria. |
| REF-13 | Resolve V2 MOTUS 3D journey playback regression | 🟢 Complete | | Fixed by recreating overlay layer on map/view replacement (2D↔3D); view-mode redraw trigger; 3D-safe direction marker (triangle fallback). User-verified. |
| REF-14 | Ensure all layers render across 2D↔3D toggles | 🟢 Complete | | REF-14A + REF-14B done. REF-14C/D deferred for future sessions. |
| REF-14A | Fix DroneDeploy imagery persistence across map swaps | 🟢 Complete | | Implemented parent GroupLayer swap detection and WMTS rebind/recreate path to avoid stale imagery layer refs after 2D↔3D toggles. |
| REF-14B | Audit per-source map behaviors for stale layer refs | 🟢 Complete | | iNaturalist + ANiML GraphicsLayer repopulation on map swap; Dendra/GBIF/CalFlora/iNaturalist/ANiML click/watch effects rebind on `mapReady`. User-verified. |
| REF-14C | Add repeated-toggle smoke matrix | ⏸ Deferred | | Define manual matrix that verifies active + pinned-visible rendering across polygons, imagery, service layers, and graphics overlays. |
| REF-14D | Final hardening and closeout | ⏸ Deferred | | Address remaining regressions from REF-14B/REF-14C and finalize documentation to close REF-14. |
| REF-15 | Preserve camera across 2D↔3D view-mode switches | 🟢 Complete | | Implemented in `useArcgisViewLifecycle.ts`: capture center+scale from outgoing view; 2D→3D latitude scale conversion; 3D→2D raw scale; lifecycle fix to persist from local view before destroy. User-verified. |
| REF-16 | Add floating LiDAR toggle button | 🟢 Complete | | Unified `MapControlRail` replaces ArcGIS built-in controls; LiDAR toggle + view mode + zoom + compass in one stack; all buttons 32×32. Future: support multiple LiDAR layers. |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- ⏸ Deferred
- 🔴 Blocked

---

## Suggested Execution Order

1. REF-01
2. REF-02
3. REF-03
4. REF-04
5. REF-05
6. REF-06
7. REF-08
8. REF-09
9. REF-10
10. REF-07
11. REF-11
12. REF-12
13. REF-14A
14. REF-14B
15. REF-14C
16. REF-14D
17. REF-15
18. REF-16

---

## REF-15: Camera Preservation Across 2D↔3D — ✅ Complete

**User requirement:** When switching between 2D and 3D, the camera should behave as follows:

- **2D → 3D:** Preserve zoom level, camera position, and camera angle. The user should see the same view, just in 3D.
- **3D → 2D:** Preserve zoom level and camera position; set camera angle straight down (nadir). 2D only supports a top-down view, so the angle must be normalized.

**Relevant files (likely):**
- `src/v2/components/Map/internal/useArcgisViewLifecycle.ts` — creates/destroys Map+View on `viewMode` change; may need to capture/restore camera state at swap
- MapContext or view lifecycle hooks — may expose or need camera state for persistence

**Suggested approach:** Before destroying the old view on `viewMode` change, capture `view.center`, `view.zoom`, and (for 3D) `view.camera` (position, heading, tilt). When creating the new view, apply the captured state. For 3D→2D, use center + zoom and set tilt to 0 (nadir).

---

## REF-14: 2D↔3D Layer Render Reliability — Context for Next Chat

**User requirement:** For any layer that is active or pinned with visibility on, polygons and imagery must render on the map regardless of how many times the user toggles between 2D and 3D.

**Discovery from REF-13 (MOTUS fix):**

1. **Map/view replacement:** `useArcgisViewLifecycle` creates a **new Map instance** when `viewMode` changes. The previous Map and View are destroyed. Layers on the old map are orphaned.

2. **Re-attach vs recreate:** Re-adding the *same* layer instance to the new map can fail. For MOTUS, SceneView reported `Failed to create layerview for layer ... of type 'graphics'` when we tried to `map.add(overlayRef.current)` with a GraphicsLayer that had been created and used in the prior MapView. ArcGIS appears to bind layer instances to the map/view context in which they were created.

3. **Working fix for MOTUS:** Destroy the old overlay, create a **new** GraphicsLayer, add it to the new map, then redraw graphics. Key trigger: `!map.findLayerById(overlayRef.current.id)` — overlay is not on the current map, so we recreate instead of reattach.

4. **Other layer types:** The central layer flow (`createMapLayer`, `useMapLayers`) may behave differently—layers could be re-created by the factory each render, or there could be caching. Data sources that add their own overlays (GraphicsLayers, etc.) are the most likely to need the recreate-on-map-swap pattern. FeatureLayers, ImageryLayers, and other ArcGIS service layers may need auditing.

5. **Relevant files:**
   - `src/v2/components/Map/internal/useArcgisViewLifecycle.ts` — creates/destroys Map+View on `viewMode` change
   - `src/v2/dataSources/motus/useMapBehavior.ts` — REF-13 fix: overlay recreate pattern
   - `src/v2/components/Map/MapContainer.tsx` + `useMapLayers` — central layer add/remove
   - Per-data-source map behavior hooks under `src/v2/dataSources/*/`

**Suggested approach:** Audit all paths that add layers to the map; identify any that hold layer refs across view-mode changes; apply recreate-not-reattach where layers are reused across map swaps.

---

## REF-08D Smoke Checklist (Manual)

Use this checklist for post-extraction validation of map↔sidebar detail flows:

| # | Check | DataONE | Dendra | TNC ArcGIS |
|---|-------|---------|--------|------------|
| 1 | Back nav: detail → list returns, map selection clears | ✓ | ✓ | ✓ |
| 2 | Map click → sidebar opens detail; back returns to list | ✓ | ✓ | — |
| 3 | Recenter / View on Map: map pans, popup/highlight appears | ✓ | ✓ | — |
| 4 | Save/pin: Map Layers view created; feedback shown | ✓ | ✓ | — |
| 5 | Selection retention: saved view restores detail/filters | ✓ | ✓ | — |
| 6 | Cross-layer: switching layers does not carry stale detail | ✓ | ✓ | ✓ |

---

## REF-06 Stability Focus

- Historical pain point: map interaction and right-sidebar synchronization required repeated iterations and was difficult to debug.
- Refactor objective: isolate orchestration state transitions (selection, preview, detail handoff, reset/close, layer-driven updates) from presentational rendering so bugs have a single ownership boundary.
- Immediate target components: `DataOneBrowseTab` and `DatasetDetailView`.
- Pattern to carry into adjacent hotspots: map area + map layers widget + right-sidebar interaction flows should follow the same orchestrator-first split.
- Validation expectation: add/execute smoke checks for map click/hover, dataset focus changes, sidebar open/close, and layer visibility toggles to confirm synchronization remains stable.

---

## Open Questions

- [ ] Should file-size thresholds differ for code vs docs vs test helpers?
- [ ] Do we want warning thresholds only, or warning + blocker thresholds in CI later?
- [ ] Should each refactor task require a mandatory smoke checklist run before merge?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 24, 2026 | Phase setup | Created phase document and initial 12-task AI refactor backlog | Codex |
| Feb 25, 2026 | REF-01 | Extracted LayerContext filter builders/counts/equality into `utils/layerFilterBuilders.ts` and `utils/layerFilterEquality.ts`; preserved public API | Cursor |
| Feb 25, 2026 | REF-02 | Started internal module split for `LayerContext`: extracted `useLayerSourceSyncActions` and `useLayerViewLifecycleActions`, rewired provider to compose internal hooks while keeping `useLayers()` stable | Cursor |
| Feb 25, 2026 | REF-02 | Continued split by extracting filtered view creation/update actions into `useLayerFilteredViewActions`; provider now composes three internal action hooks while preserving public API | Cursor |
| Feb 25, 2026 | REF-02 | Finalized split by extracting remaining core state/actions into `useLayerCoreActions`; `LayerContext` now acts as an orchestrator with stable consumer contract | Cursor |
| Feb 25, 2026 | REF-03 | Started extraction-first decomposition by splitting `src/v2/V2App.tsx` into focused app modules: `app/V2AppProviders.tsx`, `app/V2AppRoutes.tsx`, and `app/V2AppShell.tsx`; behavior preserved | Cursor |
| Feb 25, 2026 | REF-03 | Complete. Split V2App into providers, routes, and shell; scope clarified to V2-only (legacy App.tsx not in scope). Phase 12: 3/12 tasks complete. | Cursor |
| Feb 25, 2026 | Phase scope alignment | Updated REF-04..REF-12 wording to V2-only targets; removed legacy `src/components/*` scope from Phase 12 and added explicit V2 scope guardrail | Cursor |
| Feb 25, 2026 | V2 sizing calibration | Added V2 sizing baseline (no 1k-2k files), shifted emphasis from raw line count to complexity/coupling hotspots, adjusted REF-11 guardrail notes, and reordered post-REF-06 execution priority | Cursor |
| Feb 25, 2026 | REF-04 | Complete. Split `MapContainer` lifecycle/state concerns into internal hooks (`useArcgisViewLifecycle`, `useDataOnePreviewStatus`) and decomposed `useMapLayers` effect ownership into membership/presentation internal hooks while preserving external behavior. | Cursor |
| Feb 25, 2026 | REF-05 | Started extraction-only decomposition of `src/v2/services/tncArcgisService.ts` by moving shared ArcGIS HTTP/error parsing, fallback query resolution, and description/html normalization into `src/v2/services/tncArcgis/{client,queries,normalizers}.ts` while preserving existing exports/call sites. | Cursor |
| Feb 25, 2026 | REF-05 | Continued extraction-only service decomposition by moving DataONE query/filter/network helpers into `src/services/dataone/{client,queries,normalizers}.ts` and extracting ANiML retry fetch logic into `src/services/animl/client.ts`; updated existing services to consume new modules without changing external APIs. | Cursor |
| Feb 25, 2026 | REF-05 | Broke REF-05 into subtasks REF-05A..REF-05D and marked completion state: A-C complete (TNC ArcGIS/DataONE/ANiML), D pending for remaining lower-priority service paths. | Cursor |
| Feb 25, 2026 | REF-05 | Complete. Subtasks A–C done (tncArcgis, dataone, animl client/query/normalizer extraction); REF-05D deferred. Phase 12: 5/12 tasks complete. | Cursor |
| Feb 25, 2026 | REF-06 planning clarity | Elevated REF-06 notes to explicitly prioritize map↔right-sidebar synchronization stability, added orchestrator-first scope and validation expectations, and documented portability of this pattern to map area/layers/sidebar interaction hotspots. | Cursor |
| Feb 25, 2026 | REF-06 | Started implementation by extracting browse/detail orchestration and map-layer synchronization logic from `DataOneBrowseTab` into `useDataOneBrowseOrchestrator.ts`; rewired tab rendering to orchestrator handlers while preserving UI structure and behavior intent. | Cursor |
| Feb 25, 2026 | REF-06 | Continued implementation by extracting `DatasetDetailView` orchestration (details/file-info loading, version-history, map focus/recenter, save/copy/open actions) into `useDatasetDetailOrchestrator.ts`; detail component now primarily renders UI from orchestrator state. | Cursor |
| Feb 25, 2026 | REF-06 | Complete. DataOne browse/detail flow refactored into orchestration hooks; user validated DataOne working. Phase 12: 6/12 tasks complete. | Cursor |
| Feb 25, 2026 | REF-07 | Started incremental shared browse primitives: added reusable debounce-search hook and pagination control under `RightSidebar/shared`, and adopted them in DataONE + GBIF browse tabs without changing browse/detail contracts. | Cursor |
| Feb 25, 2026 | REF-07 | Continued incremental rollout by adopting the same shared browse primitives in `CalFloraBrowseTab` (debounced search + pagination controls) while preserving existing filter and detail behaviors. | Cursor |
| Feb 25, 2026 | REF-07 | Extended shared pagination adoption to one-based browse UIs by adding optional indexing/style props in `BrowsePaginationControls`, then applying it to `INaturalistBrowseTab` and `ANiML/ImageList` without changing paging behavior. | Cursor |
| Feb 25, 2026 | REF-07 planning | Split REF-07 into explicit subtasks REF-07A..REF-07D and documented that QA/stabilization is intentionally handled per task (not tracked as REF-07E in this phase doc). | Cursor |
| Feb 25, 2026 | REF-07 planning | Clarified completion split: REF-07A (search rollout) and REF-07B (pagination rollout) marked complete; REF-07C/REF-07D remain for shared detail-handoff and saved-view/filter-sync guard primitives. | Cursor |
| Feb 25, 2026 | REF-07C | Complete. Extracted shared detail-handoff primitives (`openBrowseDetail` / `closeBrowseDetail`) under `RightSidebar/shared` and adopted them in DataONE, GBIF, and CalFlora browse flows with map↔sidebar sync-safe defaults. | Cursor |
| Feb 25, 2026 | REF-07D | Complete. Added shared saved-view/filter-sync guard helpers in `RightSidebar/shared/browseFilterSyncGuards.ts` and adopted them in DataONE, GBIF, CalFlora, and iNaturalist browse flows to centralize hydrate triggers + pinned-view filter restore logic without behavior changes. | Cursor |
| Feb 25, 2026 | REF-07D | Fixed invalid optional-chain assignment in `browseDetailHandoff.ts` (`lastHandledFeatureIdRef?.current = ...` → explicit null check) that caused Vite/esbuild compile failure. | Cursor |
| Feb 25, 2026 | REF-08 planning | Broke REF-08 into explicit subtasks REF-08A..REF-08D directly in Quick Task Summary and Task Status tables (no separate subsection), and set REF-08 to In Progress. | Cursor |
| Feb 25, 2026 | REF-08A | Complete. Extracted `StationDetailView` into `useStationDetailState` and focused section components (`StationCrossStationToolsSection`, `StationHeaderCard`, `DatastreamSummaryListSection`, `DatastreamFilterSection`, `StationChartHintCard`); behavior preserved, DOM ids unchanged. | Cursor |
| Feb 25, 2026 | REF-08B | Complete. Extracted `DatasetDetailView` rendering into focused section components (`DatasetDetailPrimaryActionsSection`, `DatasetDetailVersionHistorySection`, `DatasetDetailMetadataSection`, `DatasetDetailSpatialCoverageSection`, `DatasetDetailFilesSection`) and shared formatting helpers (`datasetDetailFormatting.ts`); `useDatasetDetailOrchestrator` remains orchestration boundary; behavior preserved. Phase 12: 8/12 tasks complete. | Cursor |
| Feb 25, 2026 | REF-08C | Started. Extracted `TNCArcGISOverviewTab` render-heavy sections into `TNCArcGISOverviewSections.tsx` (context, description, service layer list, metadata, opacity control, inspect action, source card, source overlay) while preserving behavior and existing DOM ids. | Cursor |
| Feb 25, 2026 | REF-08C | Complete. TNC ArcGIS overview tab now delegates to focused section components; behavior and DOM ids preserved. Phase 12: 9/12 tasks complete. | Cursor |
| Feb 25, 2026 | REF-08D | Complete. Manual smoke checks executed for DataONE, Dendra, TNC ArcGIS: back nav, map focus/recenter, save/pin, selection retention validated. REF-08 complete; Phase 12: 10/12 tasks complete. Added REF-08D smoke checklist subsection for future runs. | Cursor |
| Feb 25, 2026 | REF-04 follow-up | Fixed MOTUS 3D journey playback regression by re-triggering overlay redraw on map view re-initialization and movement-context updates in `src/v2/dataSources/motus/useMapBehavior.ts`; keeps station + journey legs synchronized after 2D↔3D toggles. | Cursor |
| Feb 25, 2026 | REF-04 follow-up | Added MOTUS journey debug logging and 3D line visibility hardening (`polyline` `spatialReference` + `relative-to-ground` elevation offsets) in `src/v2/dataSources/motus/useMapBehavior.ts` to diagnose/mitigate SceneView line rendering gaps while preserving behavior in 2D. | Cursor |
| Feb 25, 2026 | REF-13 | Added in-progress dedicated regression task for MOTUS 3D journey playback and expanded debug probes in `src/v2/dataSources/motus/useMapBehavior.ts` to explicitly log `legCount`, `polylineCount`, `overlayGraphicCount`, overlay-on-map status, and SceneView `layerView` state (`suspended`/`visible`/`updating`) to confirm/disprove rendering-visibility vs draw-pipeline hypotheses. | Cursor |
| Feb 25, 2026 | REF-10 prep | Documented REF-10 smoke checklist (reset fidelity, no stale carryover, view hydration, save correctness) for use when filter/default factory extraction is implemented. | Cursor |
| Feb 25, 2026 | REF-10 | Started extraction of shared filter/default factories: added `context/utils/{layerFilterDefaults,browseFilterDefaults}.ts`, replaced duplicated reset/default literals in LayerContext internals, and adopted browse defaults in DataONE/GBIF/CalFlora/MOTUS + Dendra save flow without API changes. | Cursor |
| Feb 25, 2026 | REF-10 | Complete. Extracted shared filter/default factories; adopted across LayerContext internals, filter contexts, and browse reset flows. Phase 12: 11/12 tasks complete. | Cursor |
| Feb 25, 2026 | REF-09 | Complete. Split `MapContext` into internal toast/preview/spatial-query hooks (`mapContext/internal/`) and `DendraContext` into internal cache/filter/chart hooks + chart transforms/types (`dendraContext/internal/`); preserved `MapProvider`/`useMap` and `DendraProvider`/`useDendra` consumer APIs. Phase 12: 12/13 tasks complete. | Cursor |
| Feb 25, 2026 | REF-11 | Complete. Added `scripts/v2/check-file-size-guardrail.mjs` and `npm run guard:v2-file-size`; scans `src/v2/**/*`, WARN ≥800 lines, REVIEW ≥950; warning-only, always exits 0. Phase 12: 12/13 tasks complete; REF-12 remains. | Cursor |
| Feb 25, 2026 | REF-12 | Deferred. Completion criteria + smoke-test checklist task deferred to focus on high-impact work; revisit when ready to solidify smoke criteria. Phase 12 active scope complete (12/12). | Cursor |
| Feb 25, 2026 | REF-13 | Reopened after user reported MOTUS 3D journey-leg playback regression recurrence. Updated phase status/progress and reset REF-13 to In Progress pending root-cause fix hardening. | Cursor |
| Feb 25, 2026 | REF-13 | Complete. Root cause: SceneView fails to create layerview for GraphicsLayer instance created in 2D when map/view is replaced on 2D→3D toggle. Fix: destroy and recreate overlay layer on map swap; add view-mode redraw trigger; use 3D-safe direction marker (triangle) in SceneView. User-verified. Phase 12: 12/13 tasks complete. | Cursor |
| Feb 25, 2026 | REF-14 | Added. User requirement: all layers (active or pinned+visible) must render reliably across 2D↔3D toggles regardless of toggle count. Documented REF-13 discovery (recreate-not-reattach pattern, map/view replacement lifecycle) in REF-14 context subsection for next chat. | Cursor |
| Feb 25, 2026 | REF-14 | Started implementation. Fixed DroneDeploy imagery reliability regression across 2D↔3D toggles by detecting managed GroupLayer replacement and recreating/rebinding cached WMTS layers instead of reusing stale layer instances from the previous map. | Cursor |
| Feb 25, 2026 | REF-14 planning | Split REF-14 into explicit subtasks REF-14A..REF-14D to support parallel chat execution (implementation slice, full audit, smoke matrix, hardening/closeout). Marked REF-14A complete and REF-14B in progress. | Cursor |
| Feb 25, 2026 | REF-14 | Complete. REF-14A (DroneDeploy WMTS rebind on map swap) implemented and user-validated. REF-14B/C/D deferred for future sessions. Phase 12: 14/18 tracked items complete. | Cursor |
| Feb 25, 2026 | REF-14B | Started per-source stale-layer audit. Fixed iNaturalist GraphicsLayer stale population across 2D↔3D swaps by repopulating when the managed layer instance changes after map replacement. | Cursor |
| Feb 25, 2026 | REF-14B | Continued audit hardening. Added `mapReady` effect dependencies so Dendra/GBIF/CalFlora/iNaturalist map click/watch handlers rebind to the newly created view after 2D↔3D swaps (prevents stale handlers tied to destroyed views). | Cursor |
| Feb 25, 2026 | REF-14B | Addressed ANiML camera traps 2D↔3D regression: repopulate GraphicsLayer when map swap replaces the managed layer instance and rebind click handler on `mapReady` so marker interactions stay active after repeated toggles. | Cursor |
| Feb 25, 2026 | REF-14B | Complete. Per-source stale-layer audit done; iNaturalist + ANiML repopulation on map swap; Dendra/GBIF/CalFlora/iNaturalist/ANiML handler rebinding on `mapReady`. User-verified. Phase 12: 16/19 tracked items complete. | Cursor |
| Feb 25, 2026 | REF-15 | Added. User requirement: preserve camera across 2D↔3D switches. 2D→3D: keep zoom, position, angle. 3D→2D: keep zoom and position; set camera straight down (nadir). | Cursor |
| Feb 25, 2026 | REF-15 | Started implementation. Updated `useArcgisViewLifecycle.ts` to capture center/zoom/heading/tilt from outgoing view, remove fixed SceneView camera z/tilt defaults, restore center/zoom on 2D↔3D swaps, and normalize 2D→3D tilt to top-down. Pending manual toggle validation. | Cursor |
| Feb 25, 2026 | REF-15 | Applied ArcGIS sample guidance for zoom parity: preserve `scale` across modes with latitude conversion factor (`2d→3d: scale * cos(lat)`, `3d→2d: scale / cos(lat)`) to better align perceived zoom between MapView and SceneView. | Cursor |
| Feb 25, 2026 | REF-15 | Tuned parity after manual feedback: keep `2d→3d` latitude scale conversion, but preserve raw scale for `3d→2d` (no inverse conversion) to prevent slight zoom-out drift at higher extents. | Cursor |
| Feb 25, 2026 | REF-15 | Complete. Camera preservation across 2D↔3D: capture center+scale from outgoing view; 2D→3D latitude scale conversion; 3D→2D raw scale; lifecycle fix to persist from local view before destroy. User-verified. Phase 12: 15/19 tracked items complete. | Cursor |
| Feb 25, 2026 | REF-16 | Added. Add floating toggle button to show/hide LiDAR (PointCloudLayer) in 3D mode. Future: support multiple LiDAR layers. | Cursor |
| Feb 25, 2026 | REF-16 | Complete. Replaced ArcGIS built-in zoom/compass/nav controls with unified `MapControlRail`; 2D/3D text toggle, LiDAR icon (3D only), zoom +/−, compass; all buttons 32×32. User-verified. Phase 12: 17/20 tracked items complete. | Cursor |
