# Phase 4: DataOne Right Sidebar

**Status:** 🟡 Ready for New Tasks  
**Progress:** 0 / 0 tasks  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-4-dataone-completed.md`  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| *(add new tasks below)* | | | | |

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

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 18, 2026 | Archived tasks 4.1–4.12 to `docs/archive/phases/phase-4-dataone-completed.md`. Phase doc reset for new tasks. | User |
