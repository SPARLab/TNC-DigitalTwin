# Phase 4: DataOne Right Sidebar

**Status:** 🟡 Ready for New Tasks  
**Progress:** 0 / 12 tasks  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-4-dataone-completed.md`  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-DONE-01 | 🟡 In Progress | Feb 20, 2026 | Cluster click on map populates right sidebar with datasets at that location | High priority; major progress, unresolved cluster count desynchronization |
| CON-DONE-02 | ⚪ Not Started | Feb 18, 2026 | Auto-pan/zoom when opening dataset detail; repurpose View on Map as Recenter | High priority; resolution applied |
| CON-DONE-03 | ⚪ Not Started | Feb 18, 2026 | Cluster popup for scrolling individual datasets | Medium priority |
| CON-DONE-04 | ⚪ Not Started | Feb 18, 2026 | Improve point dispersion as user zooms into clusters | Medium priority |
| CON-DONE-05 | ⚪ Not Started | Feb 18, 2026 | Fix map vs sidebar count discrepancy (dedupe dataset versions) | High priority bug |
| CON-DONE-06 | ⚪ Not Started | Feb 18, 2026 | Save button: clearly distinguish saved vs unsaved state | High priority |
| CON-DONE-07 | ⚪ Not Started | Feb 18, 2026 | Persist saved state when returning to already-saved dataset | High priority |
| CON-DONE-08 | ⚪ Not Started | Feb 18, 2026 | Multi-select categories filter checklist | Medium priority |
| CON-DONE-09 | ⚪ Not Started | Feb 18, 2026 | Search by title and abstract/keywords | High priority |
| CON-DONE-10 | ⚪ Not Started | Feb 18, 2026 | Filter by file type (CSV, TIF, imagery, and others) | Medium priority |
| CON-DONE-11 | ⚪ Not Started | Feb 18, 2026 | Saved indicator on browse cards (icon plus subtle highlight) | Medium priority |
| CON-DONE-15 | ⚪ Not Started | Feb 19, 2026 | Spatial query: ensure draw/query tools filter DataONE datasets by extent | High priority; must work with SpatialQuerySection |
| CON-DONE-14 | ⚪ Not Started | Feb 18, 2026 | Search highlight: show matching keyword inside abstract snippet | Low / nice-to-have |

**Phase-5 handoff:** `CON-DONE-12` and `CON-DONE-13` (export behavior tasks) are tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`.

*Completed tasks 4.1–4.12 have been archived. See `docs/archive/phases/phase-4-dataone-completed.md`.*

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the DataOne dataset browse experience in the right sidebar. This data source has:
- **Pointer rows** (datasets point to files)
- **No Level 3 filtering** (datasets are saved as whole views, not filtered)
- **Cross-category nature** (datasets span all TNC categories)
- **No bookmarking workflow** moving forward (use save/view language and behavior)

## Feature Service (Inspect DataONE Layer)

The DataONE datasets are served from an ArcGIS Feature Service. Use these URLs to inspect metadata and layer schemas:

| Resource | URL |
|----------|-----|
| **Service metadata** (list layers) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer?f=json` |
| **Layer 0 (Lite)** — lightweight fields, fast list load (~12k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/0?f=json` |
| **Layer 1 (Latest)** — full metadata including abstracts | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/1?f=json` |
| **Layer 2 (AllVersions)** — all versions for history lookup (~22k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/2?f=json` |

Append `?f=json` to any URL to get ArcGIS REST metadata (layers, fields, types). Used by `src/services/dataOneService.ts` and `src/types/dataone.ts`.

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 10 - Cross-Category)
- Mockup: `mockups/02e-browse-dataone.html`

## Key Paradigm Notes

- **Row Type:** Pointer (dataset points to files)
- **Save/View Options:** Only "Save Dataset View" (no filter-specific save path)
- **No Level 3:** Datasets are saved as whole views, not filtered by individual files
- **Cross-Category:** DataOne appears under "Research Datasets (All Categories)" with category filter in right sidebar
- **Left Sidebar Shortcuts (DFT-045):** Special shortcut rows appear in domain categories (Species, Fire, etc.) labeled "DataOne Datasets (count)". Clicking activates DataOne with that domain pre-filtered. Improves discoverability for domain-first users.

---

## Task Details

*(Add new task details below. Completed tasks 4.1–4.12 are in the archive.)*

---

### CON-DONE-01: Cluster Click Populates Sidebar with Local Datasets

**Goal:** When a user clicks a clustered DataONE marker on the map, the right sidebar should immediately show the datasets represented by that cluster/location.

**Context:** Previously, cluster clicks only zoomed the map. Users had no direct way to inspect which datasets were in the clicked cluster without repeated zoom interactions.

**Implementation Notes (Feb 20, 2026):**
- Added map-selection flow for cluster clicks (`mapSelectionDataoneIds`) so cluster clicks drive sidebar filtering
- Added visual synchronization aid: blue highlight ring on selected cluster
- Preserved single-point click behavior: clicking a non-cluster marker opens dataset detail directly
- Moved large-cluster sidebar filtering to client-side cache matching (to avoid 414 URI Too Large when cluster selections are very large)

**Investigation Findings (Feb 20, 2026):**
- Verified with live service checks: `FeatureServer/0` currently returns latest-only records (`is_latest_version = 0` count is 0)
- Verified preserve-bounds subset used by app has 878 records, all latest-only, with no version duplication
- Remaining issue is **cluster count desynchronization**: in some views, visible map cluster labels (e.g., 506 and 722) imply a larger universe than sidebar total (878)
- Current hypothesis: map cluster aggregation scope is not perfectly aligned with sidebar filter scope in all states/zooms

**Acceptance Criteria:**
- [x] Clicking a DataONE cluster populates the right sidebar list with datasets for that clicked location/cluster
- [x] Sidebar clearly indicates that a map-location filter is active and allows clearing it
- [x] Clicking a single (non-cluster) point continues to open dataset detail as before
- [x] Large cluster clicks no longer fail with `414 Request-URI Too Large`
- [ ] Cluster label counts and sidebar total are fully synchronized across zoom levels and map states
- [ ] QA pass confirms behavior across multiple zoom levels and dense cluster areas

**Estimated Time:** 2–4 hours (implementation + QA)

---

### CON-DONE-15: Spatial Query for DataONE Datasets

**Goal:** Ensure the spatial query (draw polygon/rectangle, query by extent) correctly filters DataONE datasets. When the user draws a query area on the map, DataONE browse results should be constrained to datasets whose spatial extent intersects the drawn area.

**Context:** The app has a `SpatialQuerySection` component used for spatial filtering. DataONE datasets have `center_lat`/`center_lon` and/or `north_bound`/`south_bound`/`east_bound`/`west_bound` fields. The spatial query must apply to DataONE when that data source is active.

**Implementation Notes:**
- Integrate with existing `SpatialQuerySection` / spatial query context
- Use DataONE Feature Service `query` with `geometry` and `geometryType` params to filter by drawn extent
- Ensure cluster map and browse list both respect the spatial filter
- Clear spatial filter when user clears the draw or switches data sources

**Acceptance Criteria:**
- [ ] Drawing a polygon/rectangle on map filters DataONE datasets to those intersecting the extent
- [ ] Browse list and cluster map both reflect the spatial filter
- [ ] Clearing the spatial query restores full dataset list
- [ ] Works with DataONE Layer 0 (Lite) and Layer 1 (Latest) as appropriate

**Estimated Time:** 4–6 hours

---

## Service Analysis

> Completed during archived Task 4.1. See archive for full details.

### Feature Service URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer` — see "Feature Service (Inspect DataONE Layer)" above for layer URLs.

### Dataset Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `dataone_id` | string | Unique ID, display, links | DOI-like identifier used as canonical dataset identity (example: `doi:10...`). |
| `title` | string | Card + detail display, text search | Primary search/display field in layer 0/1/2. |
| `authors` | semicolon-delimited string | Card + detail display, optional filter | Needs parsing to array in UI (`;` delimiter). |
| `abstract` | string | Detail display, text search (optional) | Available in layers 1/2 only (not layer 0). |
| `keywords` | delimiter-separated string | Detail display, optional search expansion | Available in layers 1/2 only; can be long. |
| `tnc_category` | string | Primary category filter | AI-enriched primary category. |
| `tnc_categories` | semicolon-delimited string | Multi-category chips/filter matching | Supports cross-category tagging; includes secondary categories. |
| `tnc_confidence` | number | QA/debug info | AI category confidence score (0-1). |
| `date_uploaded` | epoch ms | Sort, recency display | Good default sort: `date_uploaded DESC`. |
| `begin_date`, `end_date` | epoch ms | Year/temporal filters | Supports temporal range filtering. |
| `files_summary` | JSON string | Card file counts/types | Contains `total`, `by_ext`, `size_bytes`; parse in client. |
| `dataset_url` | string | "Open in DataONE" action | DataONE landing page URL. |
| `data_url` | string | Advanced/download action | Data resolver URL (layers 1/2). |
| `external_url` | string nullable | External source link fallback | Used for metadata-only datasets. |
| `center_lat`, `center_lon` | number | Map point geometry | Reliable map plotting fallback if feature geometry omitted. |
| `north_bound`, `south_bound`, `east_bound`, `west_bound` | number | Spatial coverage in detail | Bounding box fields available in layers 1/2. |
| `series_id`, `version_count`, `is_latest_version` | string/int/bool-ish | Version history UX | Supports "latest vs all versions" views. |

### Layer Usage Recommendation

- **Layer 0 (`Lite`) for browse list + count queries:** fastest payload, includes core fields needed for cards/filtering.
- **Layer 1 (`Latest`) for detail view:** includes abstract, keywords, authors, bbox fields, `data_url`, and richer metadata.
- **Layer 2 (`AllVersions`) for version history only:** use when user explicitly requests historical versions.

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, follow the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 4:** DataOne query/search filters can plug into existing child-view synchronization patterns rather than inventing a new widget-sidebar contract.
- **Phase 4 verification:** Confirm DataOne filter/search state hydrates from "Edit Filters," child query params update from sidebar edits, and custom child names remain stable after query changes.
- DataOne branch should adopt shared Map Layers child-view rename semantics: manual rename persists as custom and is not overwritten by sync.
- Provide DataOne-specific auto naming for non-custom views (query/category/year driven labels), while preserving shared child `viewId` navigation/edit flows.

---

## Open Questions

- [ ] Should we reuse code from existing `DataONEDetailsSidebar.tsx`?
- [ ] How to handle datasets with many files?
- [ ] Keyword click behavior - filter by that keyword?
- [ ] Preview capability vs. link to DataOne?
- [ ] Should we switch from point clustering to grid/bin aggregation (zoom-dependent cells with counts) to improve count explainability and reduce cluster ambiguity?

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 20, 2026 | Updated CON-DONE-01 findings: latest-only records confirmed; added unresolved cluster count desynchronization investigation notes; documented large-cluster 414 fix. | Assistant |
| Feb 20, 2026 | Started CON-DONE-01 implementation: map cluster click now drives DataONE sidebar list via cluster-member ID filtering; pending QA. | Assistant |
| Feb 19, 2026 | Added CON-DONE-15: Spatial query for DataONE datasets — ensure draw/query tools filter by extent. | — |
| Feb 18, 2026 | Archived tasks 4.1–4.12 to `docs/archive/phases/phase-4-dataone-completed.md`. Phase doc reset for new tasks. | User |
