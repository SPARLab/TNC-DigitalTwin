# Phase 1: iNaturalist Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 4 / 6 tasks complete (1 won't do)  
**Branch:** `v2/inaturalist`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 19, 2026

---

> **Archived tasks:** All previous iNaturalist tasks (1.1–1.5, 13–28) have been archived to `docs/archive/phases/phase-1-inaturalist-completed.md` (Feb 18, 2026). This document is cleared for new tasks.

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-INAT-01 | 🟢 Complete | Feb 19, 2026 | Add species-level filtering (currently taxa only) | Done: full scientific names, species search, count/alphabetical sort, map/pinned-view sync. Common/Latin toggle dropped (decided against). |
| CON-INAT-02 | 🟢 Complete | Feb 19, 2026 | Species hierarchy flow: taxa -> species list -> observations per species | Done: taxa→species→observations flow enforced; redundant top species search removed; "Filter Taxa" label. |
| CON-INAT-03 | 🟢 Complete | Feb 19, 2026 | Show result count in right sidebar (for example, "92 observations") | Done: Browse tab now shows live result-count row (e.g., "92 observations") using filtered total count. |
| CON-INAT-04 | 🚫 Won't Do | Feb 19, 2026 | Investigate reptile observations appearing in ocean (scrambling vs bug) | Not a product bug; iNaturalist intentionally obfuscates coordinates for sensitive/endangered species. Source: AF-08. |
| CON-INAT-06 | 🟢 Complete | Feb 19, 2026 | Species/taxa ordering: common species higher, with editable sort order | Done: species list defaults to count sort (common higher), toggle to A-Z; implemented in CON-INAT-01. Source: T15. |
| CON-INAT-07 | ⚪ Not Started | Feb 19, 2026 | Edit filters widget collapsible; results in scrollable section filling remaining viewport height | Edit filters: collapse/expand. Results: scrollable container, height limited to viewport, expands to fill remaining vertical space in right sidebar. |

**Phase-5 handoff:** `CON-INAT-05` (Export Builder cart inversion) is tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md` to avoid cross-branch conflicts.

**Active tasks remaining:** 1  
**Recently completed:** CON-INAT-06 (species/taxa ordering), CON-INAT-03 (result count in sidebar), CON-INAT-02 (species hierarchy flow), CON-INAT-01 (species-level filtering). Archived tasks: `docs/archive/phases/phase-1-inaturalist-completed.md`

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
| Common/Latin toggle dropped | Feb 19, 2026 | Decided against explicit toggle; species list shows common name primary + scientific secondary (dual-line). | No |
| Top species search removed; "Filter Taxa" label | Feb 19, 2026 | Redundant with species search inside Filter Species dropdown. Section renamed from "Filter Observations" to "Filter Taxa" for hierarchy clarity. | No |

---

## Open Questions

- [ ] 
- [ ] 
- [ ] 

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 19, 2026 | CON-INAT-04 | **Won't Do.** Reptile observations appearing in ocean are due to iNaturalist coordinate obfuscation for sensitive/endangered species, not an app bug. | — |
| Feb 19, 2026 | CON-INAT-06 | **Complete.** Species/taxa ordering already implemented in CON-INAT-01: count sort (common higher) default, A-Z toggle. | — |
| Feb 19, 2026 | CON-INAT-07 | **Added.** Edit filters widget collapsible; results in scrollable section filling remaining viewport height. | — |
| Feb 19, 2026 | CON-INAT-03 | **Complete.** Added result-count row to iNaturalist Browse tab showing filtered total (e.g., "92 observations"), including singular/plural handling. | — |
| Feb 19, 2026 | CON-INAT-02 | **Complete.** Species hierarchy flow (taxa→species→observations) enforced. Removed redundant top species search bar; renamed "Filter Observations" to "Filter Taxa"; species search remains inside Filter Species dropdown. | — |
| Feb 19, 2026 | CON-INAT-01 | **Complete.** Species-level filtering: full scientific names, species search, count/alphabetical sort, map/pinned-view sync. Common/Latin toggle dropped (decided against). | — |
| Feb 18, 2026 | - | **Archived all Phase 1 iNaturalist tasks** to `docs/archive/phases/phase-1-inaturalist-completed.md`. Cleared phase doc for new tasks. | — |
