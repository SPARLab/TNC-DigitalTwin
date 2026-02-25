# Phase 12: AI Refactor Readiness

**Status:** 🟡 In Progress  
**Progress:** 3 / 12 tasks complete  
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
| REF-04 | ⚪ Not Started | Feb 25, 2026 17:20 PT | Split V2 map container modules by responsibility (`src/v2/components/Map/MapContainer.tsx` + `useMapLayers.ts`) | Medium-size files; focus on effect ownership and map lifecycle readability over aggressive file-count expansion. |
| REF-05 | ⚪ Not Started | Feb 25, 2026 17:20 PT | Decompose V2-critical data/service paths (V2 call sites for ANiML/DataONE/TNC ArcGIS) into client/query/normalizer modules | Prioritize high-coupling paths (`src/v2/services/tncArcgisService.ts`, DataONE/ANiML call sites); extraction-only, preserve API surface. |
| REF-06 | ⚪ Not Started | Feb 25, 2026 17:20 PT | Refactor V2 DataONE right-sidebar browse/detail flow into orchestration + focused child components | Target complexity hotspots (`DataOneBrowseTab`, `DatasetDetailView`) rather than line count alone. |
| REF-07 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Create shared browse-tab primitives for repeated patterns (search/filter/pagination/detail handoff) | Apply incrementally to avoid cross-source regressions. |
| REF-08 | ⚪ Not Started | Feb 25, 2026 17:20 PT | Split large V2 detail sidebars into domain sections and supporting hooks | Target right-sidebar complexity hotspots under `src/v2/components/RightSidebar/` (not legacy `src/components/`). |
| REF-09 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Narrow large V2 contexts (`src/v2/context/MapContext.tsx`, `src/v2/context/DendraContext.tsx`) into focused hooks/modules | Preserve existing V2 context exports initially. |
| REF-10 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Extract shared V2 filter/default state factories used across contexts and browse views | Remove duplicated reset/default object literals in `src/v2/context` + `src/v2/components/RightSidebar`. |
| REF-11 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Add lightweight file-size guardrail script and thresholds for V2 AI-friendly maintenance | Start as warning-only; prioritize `src/v2/**/*` thresholds first. |
| REF-12 | ⚪ Not Started | Feb 25, 2026 17:05 PT | Define and document V2 refactor completion criteria + QA checklist for extraction-only changes | Include smoke-test checklist for V2 map/sidebar/filter/view flows. |

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
| REF-04 | Split V2 map container modules by responsibility | ⚪ Not Started | | Target `MapContainer` + `useMapLayers`; keep V2 map interactions behavior stable. |
| REF-05 | Decompose V2-critical service/data paths into modules | ⚪ Not Started | | Prioritize `src/v2/services/tncArcgisService.ts` and V2 adapters/contexts that consume shared services; optimize for lower AI context load at call sites. |
| REF-06 | Refactor V2 DataONE browse/detail components | ⚪ Not Started | | Use orchestration + presentational split in `src/v2/components/RightSidebar/DataOne/`. |
| REF-07 | Build shared browse primitives | ⚪ Not Started | | Apply across data sources gradually. |
| REF-08 | Split large V2 detail sidebars | ⚪ Not Started | | Focus on right-sidebar files with mixed orchestration + rendering concerns, not line count alone. |
| REF-09 | Narrow large V2 context modules | ⚪ Not Started | | Preserve existing V2 consumer APIs in first pass. |
| REF-10 | Extract shared V2 filter/default factories | ⚪ Not Started | | Reduces duplicated reset logic in V2 contexts + browse views. |
| REF-11 | Add V2 file-size guardrail script | ⚪ Not Started | | Warning-only initially; calibrate to V2 reality (for example, warn at 800+ lines, review at 950+), no CI blocking. |
| REF-12 | Add V2 extraction QA checklist | ⚪ Not Started | | Required before phase completion; cover V2-specific flows. |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
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
