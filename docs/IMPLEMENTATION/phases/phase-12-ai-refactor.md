# Phase 12: AI Refactor Readiness

**Status:** 🟡 In Progress  
**Progress:** 7 / 12 tasks complete  
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
| REF-06 | 🟢 Complete | Feb 25, 2026 | Refactor V2 DataONE right-sidebar browse/detail flow into orchestration + focused child components | Extracted `useDataOneBrowseOrchestrator` and `useDatasetDetailOrchestrator`; `DataOneBrowseTab` and `DatasetDetailView` now primarily render UI; map↔sidebar sync transitions centralized for easier debugging. |
| REF-07 | 🟢 Complete | Feb 25, 2026 | Create shared browse-tab primitives for repeated patterns (search/filter/pagination/detail handoff) | Subtasks REF-07A, REF-07B, REF-07C, and REF-07D are complete. QA is intentionally handled per task and not tracked as REF-07E here. |
| REF-08 | ⚪ Not Started | Feb 25, 2026 17:20 PT | Split large V2 detail sidebars into domain sections and supporting hooks | Target right-sidebar complexity hotspots under `src/v2/components/RightSidebar/` (not legacy `src/components/`). |
| REF-09 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Narrow large V2 contexts (`src/v2/context/MapContext.tsx`, `src/v2/context/DendraContext.tsx`) into focused hooks/modules | Preserve existing V2 context exports initially. |
| REF-10 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Extract shared V2 filter/default state factories used across contexts and browse views | Remove duplicated reset/default object literals in `src/v2/context` + `src/v2/components/RightSidebar`. |
| REF-11 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Add lightweight file-size guardrail script and thresholds for V2 AI-friendly maintenance | Start as warning-only; prioritize `src/v2/**/*` thresholds first. |
| REF-12 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Define and document V2 refactor completion criteria + QA checklist for extraction-only changes | Include smoke-test checklist for V2 map/sidebar/filter/view flows. |

---

## REF-05 Subtask Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| REF-05A | 🟢 Complete | Feb 25, 2026 10:09 PST | Extract TNC ArcGIS shared helpers into client/query/normalizer modules | Added `src/v2/services/tncArcgis/{client,queries,normalizers}.ts` and rewired `src/v2/services/tncArcgisService.ts` with stable exports. |
| REF-05B | 🟢 Complete | Feb 25, 2026 10:16 PST | Extract DataONE service query/filter/normalizer/client helpers into dedicated modules | Added `src/services/dataone/{client,queries,normalizers}.ts` and rewired `src/services/dataOneService.ts` without changing consumer API. |
| REF-05C | 🟢 Complete | Feb 25, 2026 10:16 PST | Extract ANiML retry/network client helpers into dedicated modules | Added `src/services/animl/client.ts` and rewired `src/services/animlService.ts` to use extracted retry client. |
| REF-05D | ⏸ Deferred | Feb 25, 2026 | Evaluate and extract remaining service paths only where coupling justifies split | Deferred; next-pass candidates: `inaturalist`, `dendra`, `motus`, `calflora`, `drone`, `gbif`; extraction-only and backward compatible. |

---

## REF-07 Subtask Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| REF-07A | 🟢 Complete | Feb 25, 2026 10:56 PST | Search primitive rollout completion | Adopted `useBrowseSearchInput` in browse flows where debounced text search duplication existed (DataONE, GBIF, CalFlora). |
| REF-07B | 🟢 Complete | Feb 25, 2026 10:56 PST | Pagination primitive rollout completion | Adopted `BrowsePaginationControls` across matching browse/paged list flows (DataONE, GBIF, CalFlora, iNaturalist, ANiML `ImageList`) including one-based pagination support. |
| REF-07C | 🟢 Complete | Feb 25, 2026 | Detail handoff primitive | Added shared list→detail activation/close helpers in `RightSidebar/shared/browseDetailHandoff.ts` and adopted in DataONE, GBIF, and CalFlora to keep map↔sidebar selection transitions sync-safe. |
| REF-07D | 🟢 Complete | Feb 25, 2026 11:31 PST | Saved-view/filter-sync primitive | Added `RightSidebar/shared/browseFilterSyncGuards.ts` and adopted hydrate/sync guard + pinned-view filter restore helpers in DataONE, GBIF, CalFlora, and iNaturalist browse flows. |

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
| REF-08 | Split large V2 detail sidebars | ⚪ Not Started | | Focus on right-sidebar files with mixed orchestration + rendering concerns, not line count alone. |
| REF-09 | Narrow large V2 context modules | ⚪ Not Started | | Preserve existing V2 consumer APIs in first pass. |
| REF-10 | Extract shared V2 filter/default factories | ⚪ Not Started | | Reduces duplicated reset logic in V2 contexts + browse views. |
| REF-11 | Add V2 file-size guardrail script | ⚪ Not Started | | Warning-only initially; calibrate to V2 reality (for example, warn at 800+ lines, review at 950+), no CI blocking. |
| REF-12 | Add V2 extraction QA checklist | ⚪ Not Started | | Required before phase completion; cover V2-specific flows. |

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
