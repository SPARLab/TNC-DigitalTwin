# Phase 5: Export Builder

**Status:** 🟡 In Progress  
**Progress:** 0 / 4 tasks (completed tasks 5.1–5.10 archived)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-5-export-builder-completed.md`  
**Branch:** `v2/export-builder`  
**Depends On:** Phases 1-4 (all data sources)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the Export Builder that brings together all pinned layers and their active filter state into a unified export workflow.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 6 - Export Builder)
- Mockup: `mockups/02f-export-builder.html`

## Key Paradigm Notes

- Export Builder shows ALL pinned layers with their active queries
- Each layer exports filtered results only (no bookmark export mode)
- Per-layer section shows active filter summary, matching result count, and format options
- Export summary aggregates all selections with estimated size
- Two export actions: "Export ZIP" and "Generate Links"

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-EXP-01 | ⚪ Not Started | Feb 18, 2026 | iNaturalist export behavior: invert to cart metaphor (everything exports unless removed) | Source: CON-INAT-05; high priority |
| CON-EXP-02 | ⚪ Not Started | Feb 18, 2026 | Dendra export builder UX refinement | Source: CON-DENDRA-05; medium priority |
| CON-EXP-03 | ⚪ Not Started | Feb 18, 2026 | DataONE export: metadata CSV plus source download link (no data proxy) | Source: CON-DONE-12; medium priority |
| CON-EXP-04 | ⚪ Not Started | Feb 18, 2026 | Confirm DataONE export behavior with Amy and Trisalyn (small vs large file flow) | Source: CON-DONE-13; medium priority |

*Completed tasks 5.1–5.10 have been archived. See `docs/archive/phases/phase-5-export-builder-completed.md`.*

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| CON-EXP-01 | Invert iNaturalist export to cart-removal model | ⚪ Not Started | | Imported from consolidated task CON-INAT-05 |
| CON-EXP-02 | Refine Dendra export builder UX | ⚪ Not Started | | Imported from consolidated task CON-DENDRA-05 |
| CON-EXP-03 | DataONE metadata CSV + source links export | ⚪ Not Started | | Imported from consolidated task CON-DONE-12 |
| CON-EXP-04 | Collect Amy/Trisalyn input on export behavior | ⚪ Not Started | | Imported from consolidated task CON-DONE-13 |

*Completed tasks 5.1–5.10 have been archived. See `docs/archive/phases/phase-5-export-builder-completed.md`.*

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

*(Add new task details below as you define them.)*

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

### Shared Sync Dependency (from iNaturalist)

- **Reference:** After merging iNaturalist Task 25/26/27, treat `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)") as source of truth for widget-sidebar query synchronization.
- **What this enables in Phase 5:** Export payload assembly can rely on stable active-child query params and persistent custom view naming for user-facing export labels.
- **Phase 5 verification:** Confirm export summary reflects the currently active child view filters and displays manual child view names without auto-rename regressions.

---

## Open Questions

- [ ] Should header helper text collapse to a compact info row once user has at least one pinned layer?
- [ ] How should we cap multi-view selection per layer before warning or hard limits apply?
- [ ] Do we estimate image payload size from sampled file metadata, configured heuristics, or service-side hints?
- [ ] What query definition schema is stable enough for downstream reproducibility workflows?
- [ ] Should generated links include per-view query payloads directly or reference a manifest resource?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 18, 2026 | - | Archived completed tasks 5.1–5.10 to `docs/archive/phases/phase-5-export-builder-completed.md`; phase doc cleared for new tasks | Claude |
