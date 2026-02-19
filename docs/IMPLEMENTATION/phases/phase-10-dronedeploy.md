# Phase 10: DroneDeploy Imagery

**Status:** 🟡 In Progress  
**Progress:** 1 / 3 tasks (completed tasks 10.1–10.6, 10.8–10.11 archived; CON-DRONE-01 complete)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-10-dronedeploy-completed.md`  
**Branch:** `v2/dronedeploy`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-DRONE-01 | 🟢 Complete | Feb 19, 2026 | Bug: drone imagery does not change when toggling between flights | Fixed: single-flight replacement, auto-load default, WMTS 404 fallback |
| CON-DRONE-02 | ⚪ Not Started | Feb 18, 2026 | Simplify project flights UI: default name/date, expand for metadata | Medium-high priority |
| 10.7 | ⚪ Not Started | — | Render flight footprints as map polygons | Show `plan_geometry` / `project_bounds` as clickable map polygons |

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

Implement the DroneDeploy drone imagery browse experience in the right sidebar. This data source is fundamentally different from point-observation data sources (iNaturalist, CalFlora, GBIF, DataONE):

- **Raster imagery** — orthomosaics loaded as WMTS tile layers, not point features
- **Project-grouped** — imagery organized by project (Ramajal Field, JA-2 Bridge, etc.), not individual observations
- **Temporal series** — multiple flights over the same area at different dates enable change detection
- **Pin-only model** — drone imagery layers are pinnable but have no "bookmarkable items" (per DFT-015)
- **No text search** — discovery is by project, date, and map location, not keyword

### v1 Assets Available

| v1 File | Purpose | v2 Relevance |
|---------|---------|--------------|
| `src/services/droneImageryService.ts` | Metadata table queries, WMTS loading, project grouping | Service patterns, endpoints, grouping logic |
| `src/types/droneImagery.ts` | TypeScript types for records, metadata, projects, carousel | Type definitions, field names |
| `src/components/dataviews/DroneImageryView.tsx` | Browse UI, project list, flight cards | Layout patterns, card anatomy |
| `src/components/DroneImageryDetails.tsx` | Detail panel for individual flights | Detail layout reference |
| `src/components/DroneImageryPreview.tsx` | WMTS preview rendering | Map overlay patterns |
| `src/components/DroneImageryCarousel.tsx` | Temporal comparison carousel | Swipe/slider UX reference |
| `src/components/icons/DroneIcon.tsx` | SVG drone icon | Icon reuse |

### Existing Documentation

| Document | Content |
|----------|---------|
| `docs/data_sources/DRONE_IMAGERY_INTEGRATION_GUIDE.md` | Full integration guide with service endpoints, field descriptions, UI recommendations |
| `docs/data_sources/drone_imagery_metadata_summary.md` | Detailed metadata analysis, field types, project list |
| `docs/data_sources/drone_imagery_sample_data.json` | Sample records |
| `scripts/drone-imagery-eda/` | Exploration scripts |

## Feature Service

| Resource | URL |
|----------|-----|
| **DroneDeploy Metadata Table** | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata_v2/FeatureServer/0` |

### Known Metadata Fields (from v1 `DroneImageryRecord`)

| Field | Type | Notes |
|-------|------|-------|
| `objectid` | number | Unique ID |
| `project_name` | string | Project name (grouping key) |
| `plan_id` | string | DroneDeploy plan ID |
| `plan_name` | string | Plan name within project |
| `date_captured` | string | Unix timestamp (ms) |
| `wmts_link` | string | Portal link to WMTS item |
| `wmts_item_id` | string | ArcGIS item ID for WMTS service |
| `collection_link` | string (nullable) | Portal link to Image Collection |
| `collection_item_id` | string (nullable) | Item ID for Image Collection |
| `last_updated` | string | Unix timestamp (ms) |
| `record_type` | string | "plan" |
| `project_bounds` | string (nullable) | WKT POLYGON — master bounding box |
| `plan_geometry` | string (nullable) | WKT POLYGON — individual layer extent |
| `azure_blob_url` | string (nullable) | Azure Blob URL for raw TIF download |

### Current Dataset (11 records, 6 projects)

| Project | Layers | Date Range | Has Collections |
|---------|--------|------------|-----------------|
| Ramajal Field | 4 | Feb 2024 – Dec 2024 | Yes |
| JA-2 Bucket Bridge Fish Passage | 3 | Aug 2024 – May 2025 | No |
| JA1 | 1 | Apr 2024 | Yes |
| Fish Barrier JA-1 | 1 | May 2025 | No |
| TREX_ArmyCampBurnUnits_2022 | 1 | Dec 2024 | Yes |
| Archaeology Sites | 1 | Oct 2019 | Yes |

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Integration Guide: `docs/data_sources/DRONE_IMAGERY_INTEGRATION_GUIDE.md`
- v1 Drone Service: `src/services/droneImageryService.ts`
- v1 Types: `src/types/droneImagery.ts`
- DFT-015 (pin-only model): Drone/LiDAR are pin-only, no bookmarkable items

## Key Paradigm Notes

- **Row Type:** Imagery layer (raster, not point features)
- **Pin-Only:** No bookmarkable individual items — pinning loads a WMTS overlay
- **Save/View Options:** Save project/flight configuration as view
- **Category Placement:** Earth Observations (primary)
- **Temporal Comparison:** Key differentiator — Ramajal Field has 4 dates, enabling before/after comparison
- **Different Browse Pattern:** Browse by compact project cards first, then click into project details for flight-level actions

---

## Task Details

### CON-DRONE-01: Fix Flight Toggle Imagery Switching

**Goal:** Ensure map imagery reliably updates when users toggle between flights in DroneDeploy project detail.

**Acceptance Criteria:**
- [x] Toggling a flight to visible also activates that flight (`activeLayer.featureId`) and updates selected flight context
- [x] Toggling a different flight visibly changes map imagery to the newly selected flight
- [x] Toggling off the currently selected flight cleanly falls back to another visible flight (or clears selection if none)
- [x] Pinned child view visibility and loaded WMTS state stay in sync
- [x] Manual validation completed for project detail flight list + temporal carousel interaction

**Implementation Notes (Feb 19, 2026):**
- Started fix in `DroneDeploySidebar`: flight visibility toggle now routes through map activation/view sync flow instead of only flipping loaded IDs.
- Updated project open + flight select handlers to use `createOrUpdateDroneView(...)` so active view selection is deterministic.
- Updated default flight selection to prefer the first valid flight (oldest-first list order) to align with expected first-dot carousel behavior.
- Updated map behavior to auto-load the default flight when DroneDeploy Orthomosaics is activated, so imagery appears without an extra click.
- Updated selection semantics to single-flight replacement (new selection unloads old flight), matching v1 behavior.
- Runtime finding: some DroneDeploy WMTS plans are returning repeated tile `404` responses (`public-tiles.dronedeploy.com`), which can still prevent imagery draw even when client selection logic is correct.
- Added map-level activation guardrails: when a flight becomes active (including carousel-driven activation), force-load only that flight and unload previous flights; if selected flight WMTS fails with `404`, auto-fallback to another valid flight in the same project when available.

**Resolution (Feb 19, 2026):** Task complete. Flight toggle, project switch, and carousel selection now enforce single-flight loaded state; old imagery is unloaded before new imagery loads. WMTS 404 failures trigger same-project fallback with user toast.

---

### 10.7: Render Flight Footprints as Map Polygons

**Goal:** Show drone flight coverage areas on the map as clickable polygon outlines, separate from the actual imagery layers.

**Acceptance Criteria:**
- [ ] Parse `plan_geometry` WKT POLYGON into ArcGIS geometry
- [ ] Render flight footprints as semi-transparent polygon outlines on map
- [ ] Color-code by project or by recency
- [ ] Map click on footprint polygon → activate DroneDeploy + open flight detail
- [ ] Footprints visible when DroneDeploy is active, even before imagery is loaded
- [ ] Create `useDroneDeployMapBehavior` hook

---

## Service Analysis

> Update during Task 10.1

### Metadata Table URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata_v2/FeatureServer/0`

### WMTS Loading Pattern
Validated with sample `wmts_item_id` values from live records.

- Portal item metadata endpoint (`/portal/sharing/rest/content/items/{id}?f=pjson`) is accessible and reports `type: WMTS`, `access: public`.
- Item data endpoint (`/portal/sharing/rest/content/items/{id}/data?f=pjson`) returns WMTS config (`wmtsInfo`, `templateUrl`, `tileInfo`, `fullExtent`).
- Direct WMTS `GetCapabilities` at `wmtsInfo.url` returns `403` without parameters.
- `GetCapabilities` succeeds when appending `api_key` from `wmtsInfo.customParameters`.
- v2 loading should prefer ArcGIS `WMTSLayer` via `portalItem.id` (`wmts_item_id`) so ArcGIS consumes item data config (including custom parameters) automatically.
- No additional ArcGIS portal auth token was required for tested public items.

### Field Verification
| Field | v1 Type | v2 Status | Notes |
|-------|---------|-----------|-------|
| `objectid` | number | ✅ Match | `esriFieldTypeOID` |
| `project_name` | string | ✅ Match | Grouping key |
| `plan_id` | string | ✅ Match | Plan identifier |
| `plan_name` | string | ✅ Match | Human-readable plan name |
| `date_captured` | string (unix ms) | ✅ Match | String timestamp in ms |
| `wmts_link` | string | ✅ Match | Portal item URL (contains double slash before `home`) |
| `wmts_item_id` | string | ✅ Match | Primary key for map loading |
| `collection_link` | string/null | ✅ Match | Nullable |
| `collection_item_id` | string/null | ✅ Match | Nullable |
| `last_updated` | string (unix ms) | ✅ Match | String timestamp in ms |
| `record_type` | string | ✅ Match | Observed value: `plan` |
| `project_bounds` | string/null (WKT) | ✅ Match | Present on all 16 records in current dataset |
| `plan_geometry` | string/null (WKT) | ✅ Match | Present on all 16 records in current dataset |
| `azure_blob_url` | string/null | ⚠️ Behavior changed | Populated, but tested URLs returned HTTP 404 (likely prefix/list-style paths, not direct blobs) |
| `summary` | N/A in v1 type | ➕ New in v2 | Present in schema, currently empty in sampled records |
| `description` | N/A in v1 type | ➕ New in v2 | Present in schema, currently empty in sampled records |
| `project_lat` | N/A in v1 type | ➕ New in v2 | Present in schema |
| `project_lon` | N/A in v1 type | ➕ New in v2 | Present in schema |
| `plan_lat` | N/A in v1 type | ➕ New in v2 | Present in schema |
| `plan_lon` | N/A in v1 type | ➕ New in v2 | Present in schema |

### 10.1 Audit Notes

- Confirmed live service URL for v2 is:
  `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata_v2/FeatureServer/0`
- The URL currently listed near the top of this doc (`DroneDeploy_Metadata` without `_v2`) returned `404 Service not found` at audit time.
- Current record count is **16** (not 11), across **7 projects** (`CMT` appears as a new project compared to earlier snapshot).
- WKT parse validation succeeded for all records:
  - `plan_geometry`: 16/16 valid polygons
  - `project_bounds`: 16/16 valid polygons

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Pin-only model (no bookmarkable items) | Feb 3, 2026 | DFT-015: Drone imagery is raster; no individual features to bookmark |
| (more TBD) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| Projects browse uses compact card-only layout (project name + date range + flight count) and defers all flight details/actions to project detail view | Feb 16, 2026 | Reduces cognitive load, improves scanability, and aligns with progressive disclosure mental model | No |

---

## Open Questions

- [x] Does loading WMTS from the portal require authentication tokens?  
  Answer: Not for tested public items when loading by `portalItem.id`; direct WMTS capabilities request needs `api_key` from item data.
- [ ] Should we show thumbnail previews of imagery in the browse list?
- [ ] How to handle the swipe/comparison widget — ArcGIS Swipe widget or custom?
- [ ] Should flight footprint polygons be visible at all zoom levels or only when zoomed in?
- [ ] Is the `azure_blob_url` field reliably populated and accessible for TIF downloads?  
  Current finding: populated for all tested records, but sample HEAD requests returned HTTP 404; likely needs a different download flow than direct-link open.
- [ ] Should DroneDeploy have an Export tab for bulk download, or are per-flight download links sufficient?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 10.3 | **Left-sidebar project click loads imagery:** LayerRow project select now calls DroneDeploy context (setFlightLoaded, setSelectedFlightId, requestFlyToFlight) so WMTS tiles load on map when selecting a project from left sidebar; previously only right-sidebar project/flight clicks triggered load. Also: Browse tab gating uses adapter.id; default flight prefers valid WMTS; merge conflicts resolved. Files: LayerRow.tsx, RightSidebar.tsx, DroneDeploySidebar.tsx, useMapBehavior.ts | Claude |
| Feb 16, 2026 | 10.3 | DroneDeploy left sidebar UX refinements: row click anywhere on DroneDeploy layer auto-expands projects panel (no chevron-only click); 300ms CSS transition for smooth expand/collapse animation (max-height + opacity). Files: LayerRow.tsx | Claude |
| Feb 16, 2026 | — | Created phase document | Will + Claude |
| Feb 16, 2026 | 10.8 | Completed right-sidebar project detail imagery controls: per-flight visibility toggles now drive loaded WMTS state, overlapping imagery can be reordered with up/down controls (mapped to ArcGIS group-layer z-order), and project action buttons (Pin Flight/Fly to Extent/Save View) were compacted into a single row to reduce vertical space. Updated phase progress to 10/11. | Codex |
| Feb 16, 2026 | 10.10, 10.11 | Completed DroneDeploy loading/save-view integration: merged metadata + WMTS loading into adapter-exposed state, added right-sidebar metadata loading row, set WMTS loading lifecycle from `WMTSLayer.when()` events, and wired Save View to create/reuse DroneDeploy child views in Map Layers (`droneView.flightId`) so child activation restores the correct flight layer. Updated phase progress to 9/11. | Codex |
| Feb 16, 2026 | 10.1 | Completed live metadata service audit for `DroneDeploy_Metadata_v2`; documented schema drift (new fields), record count update (16), WMTS loading/auth pattern, WKT parse validation, and `azure_blob_url` accessibility caveat. Updated phase status to In Progress (1/11). | Codex |
| Feb 16, 2026 | 10.3 | Renumbered orthomosaic detection task from 10.11 to 10.3; shifted 10.3→10.4 through 10.10→10.11 for logical flow (detect/expand before browse/detail/WMTS). | Codex |
| Feb 16, 2026 | 10.3 | Implemented left-sidebar DroneDeploy orthomosaic expansion behavior for `dataset-193`: fetch project groups, show parent/project counts, expand project flight rows, set selected flight as active `featureId` context, and render explicit loading/error/empty states. Updated phase progress to 2/11. | Codex |
| Feb 16, 2026 | 10.2, 10.4, 10.5, 10.6 | Implemented v2 DroneDeploy adapter and right-sidebar shell (Overview/Browse), project/flight browse with date filters and sort, flight detail drill-down with metadata/actions, and WMTS map loading from `wmts_item_id` with multi-flight overlays, fly-to extent, and per-flight opacity control via a DroneDeploy group layer. Updated phase progress to 6/11. | Codex |
| Feb 16, 2026 | 10.9 | Completed temporal comparison UI: fixed on-map carousel rendering path by using layer-aware adapter lookup for floating panels (`dataset-193`), aligned carousel left/right button and dot styling to v1 `DroneImageryCarousel.tsx`, auto-opened right-sidebar flight detail when a flight is map-selected, and verified fly-to request flow on selection. Updated phase progress to 7/11. | Codex |
| Feb 16, 2026 | 10.4, 10.5 | Incorporated UX feedback for Browse tab information density: reopened Task 10.4 to require compact project-only cards, removed project-list-level flight actions, and clarified that flight data/actions belong in project detail drill-down. Updated phase progress to 6/11. | Codex |
| Feb 16, 2026 | 10.4 | Implemented compact Browse projects UX in right sidebar: removed per-flight rows/actions from project list, added compact project metadata cards (name, flight count, date range, WMTS summary), and wired project-card click to open project detail with flight-level actions. Updated phase progress to 7/11. | Codex |
| Feb 19, 2026 | CON-DRONE-01 | **Completed flight toggle imagery bug fix:** Single-flight replacement semantics (new selection unloads old imagery), default to first valid flight for carousel alignment, auto-load default flight when Orthomosaics activates, map-level activation guardrails, WMTS 404 fallback to alternate flight in same project. Files: DroneDeploySidebar.tsx, LayerRow.tsx, useMapBehavior.ts | Claude |
