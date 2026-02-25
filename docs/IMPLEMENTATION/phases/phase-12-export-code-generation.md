# Phase 12: Export Code Generation (Python + R)

**Status:** 🟡 In Progress  
**Progress:** 0 / 3 tasks  
**Branch:** `v2/export-code-generation`  
**Depends On:** Phase 5 (Export Builder modal/actions)  
**Owner:** TBD

---

## Phase Goal

Demonstrate the forward direction of Export Builder by generating copy/paste-ready Python and R import code for selected exports, starting with iNaturalist and Dendra only.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Export Builder phase: `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`
- Archived Export Builder implementation details: `docs/archive/phases/phase-5-export-builder-completed.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 6 - Export Builder)

## Scope (MVP for Demo)

- In scope:
  - iNaturalist code generation (Python + R)
  - Dendra code generation (Python + R)
  - Export Builder UI actions to copy/download generated code
- Out of scope (follow-up):
  - DataOne, TNC ArcGIS, Calflora, GBIF, MOTUS, DroneDeploy, and ANiML code generation
  - Fully generalized code templates across all adapters
  - Advanced SDK-specific optimizations

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 12.1 | ⚪ Not Started | Feb 25, 2026 | Define export code-generation contract for Export Builder | Add template input/output types, per-layer payload mapping, and guardrails for unsupported sources |
| 12.2 | ⚪ Not Started | Feb 25, 2026 | Implement iNaturalist + Dendra Python/R snippet generation | Add generator utilities and wire "Get Python Code" / "Get R Code" actions |
| 12.3 | ⚪ Not Started | Feb 25, 2026 | Validate UX and quality for demo readiness | Ensure copy/download flows work, snippets are readable, and add targeted tests |

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 12.1 | Define code-generation contract and template architecture | ⚪ Not Started | | Keep contract narrow to iNaturalist + Dendra for MVP |
| 12.2 | Build Python/R generators for iNaturalist and Dendra | ⚪ Not Started | | Prefer pandas/readr-first snippets; no SDK lock-in for MVP |
| 12.3 | Integrate UI actions + testing + demo verification | ⚪ Not Started | | Include fallback behavior for unsupported formats/data sources |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Acceptance Criteria (MVP)

- Export Builder exposes clear actions to generate Python and R code.
- Generated snippets are copy/paste-ready and include:
  - Required imports
  - Data loading steps
  - Minimal transformation notes
- iNaturalist and Dendra layer/view selections produce deterministic code from current selection state.
- Unsupported data sources are either hidden or clearly labeled "coming soon."
- Basic tests cover generator output for iNaturalist and Dendra.

---

## Open Questions

- [ ] Should generated code default to loading downloaded files, direct URLs, or both?
- [ ] Should snippets be per-layer only, or include a bundled multi-layer script option in MVP?
- [ ] Should we include explicit package install comments (`pip install`, `install.packages`) in MVP output?

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 25, 2026 | - | Created Phase 12 document for Export Code Generation MVP (iNaturalist + Dendra, Python + R) | Codex |
