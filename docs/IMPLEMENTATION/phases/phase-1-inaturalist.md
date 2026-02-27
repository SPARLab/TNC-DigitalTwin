# Phase 1: iNaturalist Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 12 / 16 tasks complete (1 won't do, 3 remaining)  
**Branch:** `v2/inaturalist`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 27, 2026

---

> **Archived tasks:** All previous iNaturalist tasks (1.1–1.5, 13–28) have been archived to `docs/archive/phases/phase-1-inaturalist-completed.md` (Feb 18, 2026). This document is cleared for new tasks.

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-INAT-08 | ✅ Complete | Feb 26, 2026 | Track threatened/sensitive iNaturalist taxa and flag coordinate obfuscation risk | Taxon API lookup, EN-style badge, severity mapping, obscured-coordinate warning, metadata spacing |
| CON-INAT-09 | ✅ Complete | Feb 27, 2026 | Add scrolling to Edit Filters widget — Filter Species options inaccessible when Filter Taxa expanded | max-h-[52vh] scroll region; auto-hiding overlay scrollbar (scroll-area-right-sidebar pattern) so Filter Species reachable when Filter Taxa expanded. |
| CON-INAT-10 | ⚪ Not Started | Feb 27, 2026 | Move iNaturalist Observations, Camera Traps (ANiML) from Species to Observations category | Left sidebar: change categoryId in layerRegistry. CalFlora excluded (removed per CON-INAT-11). |
| CON-INAT-11 | ⚪ Not Started | Feb 27, 2026 | Remove CalFlora layer from catalog for now | Licensing ambiguity re: displaying raw data and making it downloadable. CalFlora ToS review suggests hosting data is compliant; some images may not be public domain — add follow-up task to filter those out later. |
| CON-INAT-12 | ⚪ Not Started | Feb 27, 2026 | Add Land Cover "Other" subcategory for three floaters | Clean up Land Cover category by grouping uncategorized/floaters into an "Other" subcategory. |

*All completed tasks (TF-01, TF-05, TF-03, TF-04, CON-INAT-01 through CON-INAT-07, TF-06; CON-INAT-04 Won't Do) archived. See `docs/archive/phases/phase-1-inaturalist-completed.md`.*

**Phase-5 handoff:** `CON-INAT-05` (Export Builder cart inversion) is tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md` to avoid cross-branch conflicts.

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
| CON-INAT-08: Taxon-level threatened status + conservation badge in detail view | Feb 26, 2026 | ArcGIS iNaturalist view does not expose geoprivacy/endangered fields. Added iNaturalist taxon API (`/v1/taxa/:id?place_id=14`), severity-based badge (EN/VU/NT) beside species name, geoprivacy `obscured`/`private` → approximate-location warning, and metadata label-value spacing. |
| TF-04: Taxon toggle no longer resets species | Feb 20, 2026 | Shared `toggleTaxon` previously set `excludeAllSpecies=true` and cleared `selectedSpecies`, causing map to blank when filtering by taxa (legend or sidebar). Removed side-effect so taxa filter applies immediately; species filter remains independent. Legend and sidebar now behave consistently. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| Common/Latin toggle dropped | Feb 19, 2026 | Decided against explicit toggle; species list shows common name primary + scientific secondary (dual-line). | No |
| Top species search removed; "Filter Taxa" label | Feb 19, 2026 | Redundant with species search inside Filter Species dropdown. Section renamed from "Filter Observations" to "Filter Taxa" for hierarchy clarity. | No |
| EditFiltersCard collapsible; results header matches ANIML | Feb 19, 2026 | CON-INAT-07: Added `collapsible` prop to `EditFiltersCard` (grid-template-rows animation). Results header uses plain gray "Observations / x–y of N" pattern (identical to ANIML ImageList header). Pagination uses `bg-gray-100 hover:bg-gray-200 rounded-md` pill buttons. Removed "Tip: filter via legend widget" text from filter section. | No |
| Select All / Clear All text-only; gray when inactive; styled separator | Feb 24, 2026 | TF-06: Bulk actions in Filter Taxa, Filter Species, and legend use colored text (emerald when actionable, gray when inactive). Gray `|` separator between Select All and Clear All in all three locations. No pill/button backgrounds. | No |
| Conservation badge (EN/VU/NT) + metadata label-value spacing | Feb 26, 2026 | CON-INAT-08: Red badge for CR/EN, amber for VU/NT beside species name; severity-based status mapping from mixed iNaturalist schemes; MetaRow label column w-24, gap-3 for readability. | No |
| Edit Filters scroll region + overlay scrollbar | Feb 27, 2026 | CON-INAT-09: Edit Filters content wrapped in max-h-[52vh] scroll region; custom overlay thumb (scroll-area-right-sidebar pattern) so Filter Species remains accessible when Filter Taxa expanded; thumb auto-hides when idle, reappears on hover/scroll. | No |

---

## Open Questions

- [ ] 
- [ ] 
- [ ] 

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 27, 2026 | CON-INAT-09 | **Complete.** Edit Filters scroll region: max-h-[52vh] overflow-y-auto; custom overlay scrollbar (scroll-area-right-sidebar pattern) so Filter Species remains accessible when Filter Taxa expanded; thumb auto-hides when idle, reappears on hover/scroll. | — |
| Feb 27, 2026 | — | **New tasks added.** CON-INAT-09: Edit Filters widget scrolling (Filter Species inaccessible when Filter Taxa expanded). CON-INAT-10: Move iNaturalist, ANiML, CalFlora layers from Species to Observations. CON-INAT-11: Remove CalFlora for now (licensing ambiguity; follow-up: filter non–public-domain images). CON-INAT-12: Land Cover "Other" subcategory for three floaters. | — |
| Feb 26, 2026 | CON-INAT-08 | **Complete.** Threatened/sensitive tracking: `taxon_id` in ArcGIS fetch; iNaturalist taxon API (`/v1/taxa/:id` with `place_id=14`); severity-based badge (EN/VU/NT) beside species name; geoprivacy `obscured`/`private` → approximate-location warning; metadata label-value spacing (w-24, gap-3). | — |
| Feb 25, 2026 | — | **Archived** all completed tasks (TF-01, TF-05, TF-03, TF-04, CON-INAT-01–07, TF-06; CON-INAT-04 Won't Do) to `docs/archive/phases/phase-1-inaturalist-completed.md`. | — |
| Feb 24, 2026 | TF-06 | **Complete.** Species filter bug: selecting taxa with all species checked showed no results until individual species toggled. Removed `requiresSpeciesSelection` gating so empty species selection = all selected (matches map layer and useINaturalistObservations). Select All/Clear All reverted to text-only styling; Select All gray when already active, Clear All emerald when actionable. Added styled `|` separator between Select All and Clear All in Filter Taxa, Filter Species, and legend widget. | — |
| Feb 20, 2026 | TF-05 | **Complete.** Added `grid-template-rows` CSS transition (200ms ease-in-out) to taxa legend expand/collapse. Content wrapper animates between `grid-rows-[1fr]` and `grid-rows-[0fr]`; inner div uses `overflow-hidden` to clip during animation. `border-b` on header is now conditional on `isExpanded` to avoid phantom bottom border when collapsed. | — |
| Feb 20, 2026 | TF-04 | **Complete.** Fixed map/right-sidebar desync: removed global species reset from shared `toggleTaxon`; legend and sidebar taxon clicks now both apply taxa filter immediately without blanking map. Species filter remains independent; combined taxa + species filtering syncs correctly. | — |
 | Feb 20, 2026 | TF-03 | **Complete.** Removed `opacity-60` and `text-gray-500` from unselected filter rows in both Filter Taxa and Filter Species dropdowns. Unselected items now use `bg-white hover:bg-gray-50` + `text-gray-700`; the checkbox alone conveys selection state. Same fix applied to Taxa dropdown for parity. | — |
| Feb 20, 2026 | TF-01 | **Complete.** Added min-h-[400px] to observation cards container so image results area has minimum height; users no longer need to collapse filters to scroll. Right sidebar scrollable under Overview/Browse tabs is acceptable. | — |
| Feb 19, 2026 | CON-INAT-04 | **Won't Do.** Reptile observations appearing in ocean are due to iNaturalist coordinate obfuscation for sensitive/endangered species, not an app bug. | — |
| Feb 19, 2026 | CON-INAT-06 | **Complete.** Species/taxa ordering already implemented in CON-INAT-01: count sort (common higher) default, A-Z toggle. | — |
| Feb 19, 2026 | CON-INAT-07 | **Complete.** EditFiltersCard collapsible via `collapsible` prop (grid-row animation). Results section: flex layout fills remaining viewport height; results header styled to match ANIML ("Observations / x–y of N"); pagination uses pill buttons; "Tip" text removed. | — |
| Feb 19, 2026 | CON-INAT-03 | **Complete.** Added result-count row to iNaturalist Browse tab showing filtered total (e.g., "92 observations"), including singular/plural handling. | — |
| Feb 19, 2026 | CON-INAT-02 | **Complete.** Species hierarchy flow (taxa→species→observations) enforced. Removed redundant top species search bar; renamed "Filter Observations" to "Filter Taxa"; species search remains inside Filter Species dropdown. | — |
| Feb 19, 2026 | CON-INAT-01 | **Complete.** Species-level filtering: full scientific names, species search, count/alphabetical sort, map/pinned-view sync. Common/Latin toggle dropped (decided against). | — |
| Feb 18, 2026 | - | **Archived all Phase 1 iNaturalist tasks** to `docs/archive/phases/phase-1-inaturalist-completed.md`. Cleared phase doc for new tasks. | — |
