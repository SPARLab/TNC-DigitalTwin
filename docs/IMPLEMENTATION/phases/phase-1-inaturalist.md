# Phase 1: iNaturalist Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 0 / 5 tasks  
**Branch:** `v2/inaturalist`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 18, 2026

---

> **Archived tasks:** All previous iNaturalist tasks (1.1–1.5, 13–28) have been archived to `docs/archive/phases/phase-1-inaturalist-completed.md` (Feb 18, 2026). This document is cleared for new tasks.

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-INAT-01 | 🟡 In Progress | Feb 19, 2026 9:56 AM | Add species-level filtering (currently taxa only) | In progress: full scientific names, common/Latin toggle, species search, count/alphabetical sort, map/pinned-view sync |
| CON-INAT-02 | ⚪ Not Started | Feb 18, 2026 | Species hierarchy flow: taxa -> species list -> observations per species | High priority; source: AF-02 |
| CON-INAT-03 | ⚪ Not Started | Feb 18, 2026 | Show result count in right sidebar (for example, "92 observations") | High priority; source: AF-03 |
| CON-INAT-04 | ⚪ Not Started | Feb 18, 2026 | Investigate reptile observations appearing in ocean (scrambling vs bug) | Medium priority; source: AF-08 |
| CON-INAT-06 | ⚪ Not Started | Feb 18, 2026 | Species/taxa ordering: common species higher, with editable sort order | Medium priority; source: T15 |

**Phase-5 handoff:** `CON-INAT-05` (Export Builder cart inversion) is tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md` to avoid cross-branch conflicts.

**Active tasks remaining:** 5  
**Recently completed:** Archived to `docs/archive/phases/phase-1-inaturalist-completed.md`

---

## Phase Goal

Implement the iNaturalist observations browse experience in the right sidebar. This is the **simplest** data source because observations are **self-contained rows** (no Level 3 related data).

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02b-browse-inaturalist.html`
- **Archived tasks:** `docs/archive/phases/phase-1-inaturalist-completed.md`

## Key Paradigm Notes

- **Row Type:** Self-contained (the observation IS the data)
- **Bookmark Options:** Only "Bookmark" (no "Bookmark with Filter")
- **No Level 3:** There's nothing to query beyond the observation itself

---

## Service Analysis

> Fill this out when exploring the iNaturalist feature service.

### Feature Service URL
TBD

### Available Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| | | |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| | | | |

---

## Open Questions

- [ ] 
- [ ] 
- [ ] 

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 18, 2026 | - | **Archived all Phase 1 iNaturalist tasks** to `docs/archive/phases/phase-1-inaturalist-completed.md`. Cleared phase doc for new tasks. | — |
