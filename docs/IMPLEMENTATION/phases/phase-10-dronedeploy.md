# Phase 10: DroneDeploy Imagery

**Status:** 🟡 In Progress  
**Progress:** 10 / 11 tasks  
**Branch:** `v2/dronedeploy`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 10.1 | 🟢 Complete | Feb 16, 2026 16:26 PST | Audit DroneDeploy metadata service for v2 | Completed against `DroneDeploy_Metadata_v2`; schema drift documented; WMTS access pattern validated |
| 10.2 | 🟢 Complete | Feb 16, 2026 20:12 PST | Create DroneDeploy right sidebar shell | Added DroneDeploy adapter + Overview/Browse tab shell with project-grouped browse/detail drill-down in v2 right sidebar |
| 10.3 | 🟢 Complete | Feb 16, 2026 16:41 PST | Detect and expand DroneDeploy orthomosaic child layers | Implemented in left sidebar for `dataset-193`: parent expansion, live project/flight counts, per-project expand/collapse, selectable flights, and explicit loading/error/empty states. Refined: row click auto-expands projects panel; 300ms CSS transition for expand/collapse. **Feb 16 fix:** Left-sidebar project click now loads WMTS imagery (setFlightLoaded + requestFlyToFlight) so map shows tiles immediately, matching right-sidebar behavior. |
| 10.4 | 🟢 Complete | Feb 16, 2026 23:18 PST | Implement project browse UI (compact project cards) | Browse projects now render as compact card-only list (project name, flight count, date range, WMTS summary) with click-through into project detail for all flight-level data/actions |
| 10.5 | 🟢 Complete | Feb 16, 2026 20:12 PST | Implement flight detail view | Added full metadata panel, load/remove and fly-to actions, image collection + portal links, TIF link, and opacity slider for loaded layers |
| 10.6 | 🟢 Complete | Feb 16, 2026 20:12 PST | Load WMTS imagery layers on map | Added WMTS loading via `wmts_item_id` into DroneDeploy group layer with multi-flight support, default 80% opacity, fly-to handling, and registry wiring |
| 10.7 | ⚪ Not Started | — | Render flight footprints as map polygons | Show `plan_geometry` / `project_bounds` as clickable map polygons |
| 10.8 | 🟢 Complete | Feb 16, 2026 19:05 PST | Implement layer opacity and visibility controls | Added per-flight visibility toggles, draw-order up/down controls for overlapping WMTS imagery, and compact one-row action buttons in project detail card |
| 10.9 | 🟢 Complete | Feb 16, 2026 22:15 PST | Implement temporal comparison UI | Implemented on-map temporal carousel visibility via active-layer adapter override (`dataset-193`), reused v1 DroneDeploy carousel button/dot styling, synced carousel selection to right-sidebar flight detail, and preserved auto fly-to on selection |
| 10.10 | 🟢 Complete | Feb 16, 2026 23:40 PST | Sync loading indicators | Drone loading now covers metadata + WMTS tile lifecycle with shared loading primitives and Map Layers eye-slot spinners |
| 10.11 | 🟢 Complete | Feb 16, 2026 23:40 PST | Wire Save View flow | Save View now creates/reuses DroneDeploy child views in Map Layers and child activation rehydrates the correct WMTS flight |

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

### 10.1: Audit DroneDeploy Metadata Service for v2

**Goal:** Confirm v2 field availability, test WMTS loading patterns, and document any changes from v1.

**Acceptance Criteria:**
- [x] Query FeatureServer `?f=json` and verify all fields match v1 types
- [x] Test WMTS item loading via `wmts_item_id` (authentication requirements?)
- [x] Test `plan_geometry` and `project_bounds` WKT parsing
- [x] Test `azure_blob_url` accessibility
- [x] Document record count (should be ~11)
- [x] Note any new fields or schema changes since v1

**Output:** Update "Service Analysis" section below.

---

### 10.2: Create DroneDeploy Right Sidebar Shell

**Goal:** Set up the component structure. Note that DroneDeploy follows a different pattern than point-observation data sources — it's project-grouped and raster-oriented.

**Acceptance Criteria:**
- [x] DroneDeploy adapter registered in v2 data source registry
- [x] Component renders when DroneDeploy layer is selected
- [x] Tabs: Overview | Browse (no Export tab — export is download links per flight)
- [x] Overview tab: project summary, total flights, date range, "Browse Imagery →" button
- [x] Component can show project list OR flight detail (drill-down pattern)

**Files to Create:**
- `src/v2/dataSources/dronedeploy/adapter.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneDeploySidebar.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneBrowseTab.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneOverviewTab.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/ProjectListView.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/FlightDetailView.tsx`

---

### 10.3: Detect Orthomosaics and Enable Project Expansion

**Goal:** For the catalog-discovered `DroneDeploy Orthomosaics` parent layer, detect associated orthomosaic flights/projects and present an expandable selection pattern.

**Acceptance Criteria:**
- [x] Detect that active layer `dataset-193` (`DroneDeploy Orthomosaics`) should use DroneDeploy project/flight expansion behavior
- [x] Query DroneDeploy metadata service and compute orthomosaic counts by project
- [x] Show expandable project rows with per-project orthomosaic counts
- [x] Expanding a project reveals selectable flight rows (plan/date)
- [x] Selecting a flight sets active detail context for WMTS load actions (used by Tasks 10.5/10.6)
- [x] Empty/error states are explicit (no projects, failed metadata fetch)

**Notes:**
- This task formalizes the "one parent catalog layer → many orthomosaic children" behavior for v2 dynamic catalog discovery.
- Keep this detection/expansion logic readable and colocated with DroneDeploy adapter/sidebar files.

---

### 10.4: Implement Compact Project Browse UI

**Goal:** Keep Browse tab at the project level only: compact project cards with minimal metadata and click-through to project details.

**Acceptance Criteria:**
- [ ] Projects displayed as compact cards with only: project name, flight count, and date range
- [ ] Date and WMTS summary displayed on a single metadata row where possible (avoid vertical stacking)
- [ ] No per-flight rows in the projects list view
- [ ] No "View Details" / "Pin Flight" style secondary actions in the projects list view
- [ ] Clicking a project card opens the project details view
- [ ] Project details view contains the flight list and all flight-level actions/metadata

**Reference:** Integration guide "Grouping Options" section, v1 `DroneImageryView.tsx`

---

### 10.5: Implement Project Detail + Flight Detail View

**Goal:** After selecting a project card, show project-specific flights; selecting a flight shows full flight metadata/actions.

**Acceptance Criteria:**
- [x] "← Back to Projects" navigation
- [x] Project detail context includes flights for the selected project
- [x] Project name and plan name
- [x] Capture date (formatted)
- [x] WMTS layer status (loaded / not loaded on map)
- [x] "Load on Map" / "Remove from Map" toggle button
- [x] "Fly to Extent" button (uses `plan_geometry` or `project_bounds`)
- [x] Image Collection info (if available) with portal link
- [x] Azure Blob download link (if `azure_blob_url` available)
- [x] "Open in Portal" external link (`wmts_link`)
- [x] Layer opacity slider (if currently loaded on map)

---

### 10.6: Load WMTS Imagery Layers on Map

**Goal:** Load drone orthomosaics as WMTS overlay layers on the ArcGIS map.

**Acceptance Criteria:**
- [x] Create `droneDeployLayer.ts` that loads WMTSLayer from `wmts_item_id`
- [x] Handle portal authentication if required
- [x] Support loading multiple drone layers simultaneously (different flights)
- [x] "Fly to" centers map on imagery extent when loaded
- [x] Layer renders as semi-transparent overlay on basemap
- [x] Default opacity: 80% (adjustable via slider)
- [x] Add to `IMPLEMENTED_LAYERS` registry

**Technical Notes:**
- Use `@arcgis/core/layers/WMTSLayer` with `portalItem.id`
- Portal URL: `https://dangermondpreserve-spatial.com/portal`
- May need authentication token handling

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

### 10.8: Implement Layer Opacity and Visibility Controls

**Goal:** Since multiple drone imagery layers can overlap, provide fine-grained control over visibility and opacity.

**Acceptance Criteria:**
- [x] Opacity slider per loaded drone layer (0%–100%)
- [x] Toggle visibility per loaded layer
- [x] Layer ordering control (which layer renders on top) — drag reorder or up/down buttons
- [x] Visibility/order controls remain available in Map Layers widget; detail view now exposes the same controls in-context for DroneDeploy flights
- [x] Opacity state persists during session

---

### 10.9: Implement Temporal Comparison UI

**Goal:** For projects with multiple flights (e.g., Ramajal Field with 4 dates), enable rapid temporal comparison by toggling one active flight at a time, with optional pinning to keep specific flights visible.

**Acceptance Criteria:**
- [x] Temporal comparison available when a project has 2+ flights
- [x] On-map temporal carousel rendered for active DroneDeploy projects with multiple flights
- [x] Apple-style carousel: left/right navigation buttons + dot indicators (like v1 `DroneImageryCarousel.tsx`)
- [x] Right-sidebar flight selection stays synchronized with carousel selection
- [x] Switching flights de-renders the prior unpinned flight (single-active-flight default)
- [x] Pinned flights remain visible while carousel toggles the active comparison flight
- [x] Right sidebar shows flight details when flights are selected
- [x] Auto fly-to extent when selecting a flight

**Implementation Notes:** Temporal comparison now uses the on-map carousel for multi-flight projects with v1-style navigation controls; selecting flights from carousel drives active flight detail in the right sidebar and fly-to extent behavior.

**Reference:** v1 `DroneImageryCarousel.tsx`, ArcGIS Swipe widget

**Note:** This is a high-value feature for researchers tracking restoration progress, prescribed burn recovery, and infrastructure construction. Ramajal Field (Feb 2024 → Dec 2024) is the ideal demo scenario.

---

### 10.10: Sync Loading Indicators

**Goal:** Loading indicators for WMTS layer loading (which can be slow for large tile sets).

**Acceptance Criteria:**
- [x] DroneDeploy adapter exposes `loading` via registry
- [x] Map Layers widget shows spinner while WMTS tiles are loading
- [x] Right sidebar shows loading state during metadata fetch
- [x] WMTS layer "loaded" event clears loading state
- [x] Uses shared loading primitives

---

### 10.11: Wire Save View Flow

**Goal:** Save drone imagery configurations to Map Layers widget.

**Acceptance Criteria:**
- [x] Pin creates a DroneDeploy parent layer in Map Layers
- [x] Individual loaded flights appear as child views
- [x] Selecting a saved child view re-loads that specific WMTS layer
- [x] Comparison mode state optionally saveable
- [x] Follows shared child-view conventions from `LayerContext`

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
