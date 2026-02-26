# Phase 4: DataOne Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 16 / 17 tasks complete  
**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-4-dataone-completed.md`  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| D20-B02 | ⚪ Not Started (Dan) | Feb 20, 2026 | Create dedicated DataOne point layer in ArcGIS data store (deduplicated, latest version only) with native clustering enabled | Backend task from Dan meeting. Frontend now dedupes latest version client-side; backend layer remains follow-up. |

**Archived completed tasks:** `D20-09`, `TF-13`, `TF-14`, `CON-DONE-01`, `CON-DONE-16`, `CON-DONE-02`, `CON-DONE-05`, `CON-DONE-06`, `CON-DONE-07`, `CON-DONE-08`, `CON-DONE-09`, `CON-DONE-10`, `CON-DONE-11`, `CON-DONE-15`, `CON-DONE-14`, and `CON-DONE-17` moved to `docs/archive/phases/phase-4-dataone-completed.md` on Feb 25, 2026.

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

*Completed task details (D20-09, CON-DONE-01 through CON-DONE-17, TF-13, TF-14) archived. See `docs/archive/phases/phase-4-dataone-completed.md`.*

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

- **Layer 0 (`Lite`) for browse list + count queries (no text search):** fastest payload, includes core fields needed for cards/filtering.
- **Layer 1 (`Latest`) for text search and detail view:** when `searchText` is present, browse/count/map queries use Layer 1 to match title + abstract + keywords; also used for detail view (abstract, keywords, authors, bbox fields, `data_url`).
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
- [ ] ~~Should we switch from point clustering to grid/bin aggregation?~~ → Tracked in CON-DONE-16

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 25, 2026 | **DataONE 3D marker highlight refinement.** Removed custom dark-blue selection ring outline; rely on ArcGIS native popup highlight (light blue circle) only. User feedback: keep the billboarded light-blue circle, remove the darker outline. | Assistant |
| Feb 25, 2026 | **Archived** Task Details (D20-09, CON-DONE-01–17, TF-13, TF-14) to `docs/archive/phases/phase-4-dataone-completed.md`. Phase doc trimmed. | — |
| Feb 24, 2026 | CON-DONE-17 marked complete. QA confirmed: 3D icon rendering and marker click behavior now work as expected; 2D behavior unchanged. Phase progress updated to 16/17. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v3: GraphicsLayer overlay for 3D (Dendra pattern). FeatureLayer hidden in SceneView; overlay handles rendering + hitTest + popup. Click handler swaps `include` target between FeatureLayer (2D) and overlay (3D). Removed coordinate fallback and PointSymbol3D (no longer needed). QA pending. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v2: screen-distance coordinate fallback + PointSymbol3D renderer. User reported: sidebar syncs but dots render weirdly, no map visual feedback on click. | Assistant |
| Feb 24, 2026 | CON-DONE-17 fix v1: `hitTest({ include: [layer] })` for SceneView click detection; removed per-graphic `symbol` from `populateDataOneLayer`. User reported: 2D works, 3D still broken, dots look weird. | Assistant |
| Feb 24, 2026 | Added CON-DONE-17 for 2D/3D DataONE marker-click synchronization + dot-rendering revert request. Documented attempted fixes and next-window handoff steps after unresolved 3D detail-open regression. Updated progress to 15/17. | Assistant |
| Feb 23, 2026 | **DataONE native ArcGIS highlight + cluster/saved-view fix.** Replaced custom cyan ring with ArcGIS popup highlight: `openPopupForDataoneFeature` in DatasetDetailView (detail open, Recenter) and useMapBehavior (Map Layers saved-dataset click). Cluster click: preserve viewId when coming from saved dataset view; pan-only (no zoom) so sidebar filters without snapping to saved detail. | Assistant |
| Feb 23, 2026 | **DataONE Save View + Map Layers sync refinements.** Save Dataset View: auto-pin when unpinned; persist current browse filters + selected dataset. Map Layers child-view click: explicit featureId pass from MapLayersWidget; sync effect resolves DataONE featureId only when view changes (preserves Back-to-list). Cluster click: removed custom highlight ring; safe auto-zoom (only when cluster stays visible). | Assistant |
| Feb 23, 2026 | Quick Task Summary sync: added D20-B02 (Dan backend follow-up) so phase progress reflects 15/16 accurately; CON-DONE-12/13 remain tracked in Phase 5 handoff. | Assistant |
| Feb 23, 2026 | CON-DONE-15 marked complete. Spatial query (draw/query tools) filters DataONE datasets by extent; verified working with SpatialQuerySection. | User |
| Feb 23, 2026 | CON-DONE-10 marked complete. File-type filter (CSV/TIF/Imagery/Other) checklist, client-side filtering from files_summary.by_ext, wired through browse/map/saved views. | Assistant |
| Feb 23, 2026 | CON-DONE-09 marked complete. Search by title + abstract + keywords; Layer 1 used when searchText present; browse, map, count paths updated. | Assistant |
| Feb 23, 2026 | CON-DONE-08 marked complete. Multi-select categories checklist; Select all / Clear all; tncCategories wired through browse, query, map, and saved views. | Assistant |
| Feb 23, 2026 | CON-DONE-06 and CON-DONE-07 marked complete. Save/Unsave button state; overwrite vs new-child logic; first save pins to baseline; sync no longer writes selectedDatasetId. | Assistant |
| Feb 23, 2026 | CON-DONE-05 marked complete. Map vs sidebar count discrepancy resolved via D20-09 dedupe + CON-DONE-01 race-condition fix. | User |
| Feb 23, 2026 | Removed CON-DONE-04 (improve point dispersion on zoom). | User |
| Feb 23, 2026 | Removed CON-DONE-03 (cluster popup for scrolling datasets). Sidebar already shows datasets at cluster location. | User |
| Feb 23, 2026 | TF-13 marked complete. DataONE map-loading indicator in browse tab + Map Layers eye-slot spinner; consistent with iNaturalist pattern. | Assistant |
| Feb 23, 2026 | TF-13 update: wired DataONE map-loading into Map Layers widget eye-slot spinner using shared cache-status loading flow (consistent with existing row-level loading pattern). | Assistant |
| Feb 23, 2026 | TF-13 started: added DataONE map-loading state (`mapLoading`) and browse-tab loading indicator ("Updating map markers...") wired to map marker refresh lifecycle. QA pending before complete. | Assistant |
| Feb 23, 2026 | TF-14 marked complete. Recenter/View on Map now renders a specific marker (highlightPoint cyan ring) at dataset coordinates; zoom 16 breaks clusters for visibility. | Assistant |
| Feb 23, 2026 | D20-09 marked complete. Map and browse already use Lite layer + dedupeDatasetsByDataoneId; one point per dataone_id, prefers isLatestVersion. Verified visually. | Assistant |
| Feb 20, 2026 | CON-DONE-01 refinement: Fixed cluster↔dataset click navigation. Cluster click now always shows filtered list; dataset click always shows detail. Fixed selectedDataset not clearing, lastHandledFeatureIdRef race, count=1 aggregate silent no-op, tab switch from Overview, stale highlight rings. | Assistant |
| Feb 20, 2026 | CON-DONE-02: marked complete. Auto-pan/zoom on dataset detail open; "View on Map" repurposed as "Recenter". Zoom 16 + cluster maxScale 12_000 so selected dataset breaks out of cluster and shows as dot. | Assistant |
| Feb 20, 2026 | CON-DONE-16: final UX fix. Switched to continuous `view.watch('scale', ...)` with level-change guard; in-place `fixedBinLevel` mutation avoids full reduction rebuild flicker; `maxScale: 0` keeps bins visible during zoom. Bins now resize live when crossing thresholds without blink-out. | Assistant |
| Feb 20, 2026 | CON-DONE-16: marked complete. Switched to `view.watch('stationary', ...)` to eliminate bin blink during wheel zoom; scale thresholds tuned. | Assistant |
| Feb 20, 2026 | CON-DONE-16: fine-tuned bin scale thresholds (shifted ~1 level coarser); added debounced scale watcher with level-change guard to eliminate flicker on zoom. | Assistant |
| Feb 20, 2026 | CON-DONE-16: marked in progress; documented implemented features, remaining UX issues (zoomed-out bins too small, abrupt bin→points transition), and "Where to fine-tune" code pointers for future tuning. | Assistant |
| Feb 20, 2026 | CON-DONE-16 update: added DataONE Browse toggle for map aggregation mode (`Clusters`/`Grid bins`) and made cluster default while validating bin rendering. | Assistant |
| Feb 20, 2026 | CON-DONE-16 started: switched DataONE map layer to `FeatureReductionBinning`; updated aggregate label/popup fields and map click handling for bin-aware aggregate resolution. QA pending. | Assistant |
| Feb 20, 2026 | CON-DONE-01 marked complete; added CON-DONE-16 (switch to grid binning) as next task. | Assistant |
| Feb 20, 2026 | CON-DONE-01: Fixed cluster count desynchronization — root cause was race condition in populateDataOneLayer (concurrent applyEdits doubling features). Applied queryFeatures-based deletion + populate-version guard. | Assistant |
| Feb 20, 2026 | Updated CON-DONE-01 findings: latest-only records confirmed; added unresolved cluster count desynchronization investigation notes; documented large-cluster 414 fix. | Assistant |
| Feb 20, 2026 | Started CON-DONE-01 implementation: map cluster click now drives DataONE sidebar list via cluster-member ID filtering; pending QA. | Assistant |
| Feb 19, 2026 | Added CON-DONE-15: Spatial query for DataONE datasets — ensure draw/query tools filter by extent. | — |
| Feb 18, 2026 | Archived tasks 4.1–4.12 to `docs/archive/phases/phase-4-dataone-completed.md`. Phase doc reset for new tasks. | User |
