# Phase 1: iNaturalist Right Sidebar

**Status:** 🟢 Complete  
**Progress:** 5 / 6 tasks complete (1 won't do)  
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
| TF-01 | 🟢 Complete | Feb 20, 2026 | Set minimum height for image results in Browse tab (~150px) so user doesn't need to collapse filters to scroll | Done: min-h-[400px] on inat-observation-cards. Right sidebar scrollable under Overview/Browse tabs is acceptable. |
| TF-03 | 🟢 Complete | Feb 20, 2026 | Don't gray out species options in Filter Species dropdown; gray communicates "unavailable" but they're just unselected | Done: removed `opacity-60` and `text-gray-500` from unselected rows in both Filter Taxa and Filter Species dropdowns. Unselected rows now use `bg-white hover:bg-gray-50` + `text-gray-700`; checkbox alone conveys selection state. Same pattern fixed in Taxa for consistency. |
| TF-04 | ⚪ Not Started | Feb 20, 2026 | Fix map/right-sidebar desync: selecting taxon in legend + filtering by species results in map not updating | High priority; discovered live in QA. Source: Trisalyn QA Feb 20 |
| CON-INAT-01 | 🟢 Complete | Feb 19, 2026 | Add species-level filtering (currently taxa only) | Done: full scientific names, species search, count/alphabetical sort, map/pinned-view sync. Common/Latin toggle dropped (decided against). |
| CON-INAT-02 | 🟢 Complete | Feb 19, 2026 | Species hierarchy flow: taxa -> species list -> observations per species | Done: taxa→species→observations flow enforced; redundant top species search removed; "Filter Taxa" label. |
| CON-INAT-03 | 🟢 Complete | Feb 19, 2026 | Show result count in right sidebar (for example, "92 observations") | Done: Browse tab now shows live result-count row (e.g., "92 observations") using filtered total count. |
| CON-INAT-04 | 🚫 Won't Do | Feb 19, 2026 | Investigate reptile observations appearing in ocean (scrambling vs bug) | Not a product bug; iNaturalist intentionally obfuscates coordinates for sensitive/endangered species. Source: AF-08. |
| CON-INAT-06 | 🟢 Complete | Feb 19, 2026 | Species/taxa ordering: common species higher, with editable sort order | Done: species list defaults to count sort (common higher), toggle to A-Z; implemented in CON-INAT-01. Source: T15. |
| CON-INAT-07 | 🟢 Complete | Feb 19, 2026 | Edit filters widget collapsible; results in scrollable section filling remaining viewport height | Done: EditFiltersCard now collapsible with chevron toggle; results region uses flex layout with scrollable observation cards container filling remaining viewport height. |

**Phase-5 handoff:** `CON-INAT-05` (Export Builder cart inversion) is tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md` to avoid cross-branch conflicts.

**Active tasks remaining:** 1 (TF-04)  
**Recently completed:** TF-03 (remove gray/opacity from unselected filter rows), TF-01 (min height for image results), CON-INAT-07 (collapsible filters + scrollable results). Archived tasks: `docs/archive/phases/phase-1-inaturalist-completed.md`

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
| EditFiltersCard collapsible; results header matches ANIML | Feb 19, 2026 | CON-INAT-07: Added `collapsible` prop to `EditFiltersCard` (grid-template-rows animation). Results header uses plain gray "Observations / x–y of N" pattern (identical to ANIML ImageList header). Pagination uses `bg-gray-100 hover:bg-gray-200 rounded-md` pill buttons. Removed "Tip: filter via legend widget" text from filter section. | No |

---

## Open Questions

- [ ] 
- [ ] 
- [ ] 

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 20, 2026 | TF-03 | **Complete.** Removed `opacity-60` and `text-gray-500` from unselected filter rows in both Filter Taxa and Filter Species dropdowns. Unselected items now use `bg-white hover:bg-gray-50` + `text-gray-700`; the checkbox alone conveys selection state. Same fix applied to Taxa dropdown for parity. | — |
| Feb 20, 2026 | TF-01 | **Complete.** Added min-h-[400px] to observation cards container so image results area has minimum height; users no longer need to collapse filters to scroll. Right sidebar scrollable under Overview/Browse tabs is acceptable. | — |
| Feb 19, 2026 | CON-INAT-04 | **Won't Do.** Reptile observations appearing in ocean are due to iNaturalist coordinate obfuscation for sensitive/endangered species, not an app bug. | — |
| Feb 19, 2026 | CON-INAT-06 | **Complete.** Species/taxa ordering already implemented in CON-INAT-01: count sort (common higher) default, A-Z toggle. | — |
| Feb 19, 2026 | CON-INAT-07 | **Complete.** EditFiltersCard collapsible via `collapsible` prop (grid-row animation). Results section: flex layout fills remaining viewport height; results header styled to match ANIML ("Observations / x–y of N"); pagination uses pill buttons; "Tip" text removed. | — |
| Feb 19, 2026 | CON-INAT-03 | **Complete.** Added result-count row to iNaturalist Browse tab showing filtered total (e.g., "92 observations"), including singular/plural handling. | — |
| Feb 19, 2026 | CON-INAT-02 | **Complete.** Species hierarchy flow (taxa→species→observations) enforced. Removed redundant top species search bar; renamed "Filter Observations" to "Filter Taxa"; species search remains inside Filter Species dropdown. | — |
| Feb 19, 2026 | CON-INAT-01 | **Complete.** Species-level filtering: full scientific names, species search, count/alphabetical sort, map/pinned-view sync. Common/Latin toggle dropped (decided against). | — |
| Feb 18, 2026 | - | **Archived all Phase 1 iNaturalist tasks** to `docs/archive/phases/phase-1-inaturalist-completed.md`. Cleared phase doc for new tasks. | — |
