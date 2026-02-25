# Phase 12: AI Refactor Readiness

**Status:** 🟡 In Progress  
**Progress:** 2 / 12 tasks complete  
**Branch:** `v2/refactor-ai-readiness`  
**Depends On:** Existing V2 implementation stability (Phases 0-11)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| REF-01 | 🟢 Complete | Feb 25, 2026 | Extract `LayerContext` filter helper builders/counts/equality logic into dedicated utility modules | Extracted to `utils/layerFilterBuilders.ts` and `utils/layerFilterEquality.ts`; public API unchanged. |
| REF-02 | 🟢 Complete | Feb 25, 2026 | Split `LayerContext` into focused internal modules (core state/actions, per-source sync actions, view lifecycle actions) | Extracted source-sync, filtered-view, core-state/actions, and view-lifecycle internal hooks; `useLayers()` contract unchanged. |
| REF-03 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Split `src/App.tsx` into app shell, route composition, and provider composition files | Zero UI behavior changes; readability-first decomposition. |
| REF-04 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Split `src/components/MapView.tsx` by responsibility (view lifecycle, interactions, overlays/tools) | Minimize merge risk via extraction-first approach. |
| REF-05 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Decompose high-complexity services (`animlService`, `dataOneService`, `tncArcGISService`) into client/query/normalizer modules | Focus on testable pure helpers and smaller call paths. |
| REF-06 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Refactor DataOne right-sidebar browse/detail flow into orchestration + focused child components | Start with `DataOneBrowseTab` and `DatasetDetailView`. |
| REF-07 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Create shared browse-tab primitives for repeated patterns (search/filter/pagination/detail handoff) | Apply incrementally to avoid cross-source regressions. |
| REF-08 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Split large details sidebars into domain sections and supporting hooks | Target older large sidebars in `src/components/`. |
| REF-09 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Narrow large contexts (`MapContext`, `DendraContext`) into smaller focused hooks/modules | Preserve existing context exports initially. |
| REF-10 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Extract shared filter/default state factories used across contexts and browse views | Remove duplicated reset/default object literals. |
| REF-11 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Add lightweight file-size guardrail script and thresholds for AI-friendly maintenance | Start as warning-only; do not block CI initially. |
| REF-12 | ⚪ Not Started | Feb 24, 2026 16:30 PT | Define and document refactor completion criteria + QA checklist for extraction-only changes | Include smoke-test checklist for map/sidebar/filter/view flows. |

---

## Phase Goal

Reduce large, mixed-responsibility files so AI assistants can make safer, more precise code changes with lower context overload and lower regression risk.

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

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| REF-01 | Extract LayerContext helper utilities | 🟢 Complete | | Foundation task for REF-02. |
| REF-02 | Split LayerContext internal modules | 🟢 Complete | | Core provider now orchestrates extracted source-sync, filtered-view, core-state/actions, and view lifecycle modules with stable `useLayers()` API. |
| REF-03 | Split App shell/routes/providers | ⚪ Not Started | | Keep routing behavior unchanged. |
| REF-04 | Split MapView by responsibility | ⚪ Not Started | | Keep map interactions behavior stable. |
| REF-05 | Decompose large services into modules | ⚪ Not Started | | Improves debugging and test isolation. |
| REF-06 | Refactor DataOne browse/detail components | ⚪ Not Started | | Use orchestration + presentational split. |
| REF-07 | Build shared browse primitives | ⚪ Not Started | | Apply across data sources gradually. |
| REF-08 | Split legacy large detail sidebars | ⚪ Not Started | | Focus on biggest line-count offenders first. |
| REF-09 | Narrow large context modules | ⚪ Not Started | | Preserve consumer APIs in first pass. |
| REF-10 | Extract shared filter/default factories | ⚪ Not Started | | Reduces duplicated reset logic. |
| REF-11 | Add file-size guardrail script | ⚪ Not Started | | Warning thresholds only at first. |
| REF-12 | Add extraction QA checklist | ⚪ Not Started | | Required before phase completion. |

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
7. REF-07
8. REF-10
9. REF-09
10. REF-08
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
