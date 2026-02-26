# Phase 12: AI Refactor Readiness

**Status:** 🟡 In Progress  
**Progress:** 4 deferred (completed tasks archived)  
**Branch:** `v2/refactor-ai-readiness`  
**Depends On:** Existing V2 implementation stability (Phases 0-11)  
**Owner:** TBD

**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-12-ai-refactor-completed.md`

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| REF-05D | ⏸ Deferred | Feb 25, 2026 | Evaluate and extract remaining service paths only where coupling justifies split | Deferred; next-pass candidates: `inaturalist`, `dendra`, `motus`, `calflora`, `drone`, `gbif`; extraction-only and backward compatible. |
| REF-12 | ⏸ Deferred | Feb 25, 2026 17:05 PT | Define and document V2 refactor completion criteria + QA checklist for extraction-only changes | Deferred; focus on high-impact work first; revisit when solidifying smoke criteria. |
| REF-14C | ⏸ Deferred | Feb 25, 2026 | Add manual smoke matrix for repeated 2D↔3D toggles across representative layer types | Cover polygons, imagery, service layers, and graphics overlays in active and pinned+visible states. |
| REF-14D | ⏸ Deferred | Feb 25, 2026 | Final hardening + cleanup for any discovered toggle regressions | Resolve residual stale-layer edge cases and update REF-14 notes before marking complete. |

**Archived completed tasks:** REF-01 through REF-16 (excluding deferred REF-05D, REF-12, REF-14C, REF-14D) moved to `docs/archive/phases/phase-12-ai-refactor-completed.md` on Feb 25, 2026.

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
| REF-05D | Evaluate and extract remaining service paths only where coupling justifies split | ⏸ Deferred | | Deferred; next-pass candidates: `inaturalist`, `dendra`, `motus`, `calflora`, `drone`, `gbif`; extraction-only and backward compatible. |
| REF-12 | Define and document V2 refactor completion criteria + QA checklist for extraction-only changes | ⏸ Deferred | | Deferred; revisit when ready to solidify smoke criteria. |
| REF-14C | Add manual smoke matrix for repeated 2D↔3D toggles across representative layer types | ⏸ Deferred | | Cover polygons, imagery, service layers, and graphics overlays in active and pinned+visible states. |
| REF-14D | Final hardening + cleanup for any discovered toggle regressions | ⏸ Deferred | | Address remaining regressions from REF-14B/REF-14C and finalize documentation to close REF-14. |

*Completed task details (REF-01 through REF-16, excluding deferred above) archived. See `docs/archive/phases/phase-12-ai-refactor-completed.md`.*

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- ⏸ Deferred
- 🔴 Blocked

---

## Suggested Execution Order (Deferred Tasks)

1. REF-12 — Define QA checklist (when ready to solidify smoke criteria)
2. REF-05D — Extract remaining service paths (lower priority)
3. REF-14C — Add 2D↔3D smoke matrix
4. REF-14D — Final hardening for REF-14

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
| Feb 25, 2026 | — | **Archived** completed tasks (REF-01 through REF-16, excluding deferred REF-05D, REF-12, REF-14C, REF-14D) to `docs/archive/phases/phase-12-ai-refactor-completed.md`. Phase doc trimmed to deferred tasks only. | — |
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
