# Phase 10: DroneDeploy Imagery

**Status:** ⚪ Not Started  
**Progress:** 0 / 10 tasks  
**Branch:** `v2/dronedeploy`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 10.1 | ⚪ Not Started | — | Audit DroneDeploy metadata service for v2 | v1 service + types exist; confirm v2 field availability and WMTS access patterns |
| 10.2 | ⚪ Not Started | — | Create DroneDeploy right sidebar shell | Adapter, Overview/Browse tabs; project-grouped layout |
| 10.3 | ⚪ Not Started | — | Implement project/flight browse UI | Group by project, filter by date range, show flight cards |
| 10.4 | ⚪ Not Started | — | Implement flight detail view | Full metadata, WMTS preview, Image Collection info, download links |
| 10.5 | ⚪ Not Started | — | Load WMTS imagery layers on map | Load drone orthomosaics as WMTS overlay layers from `wmts_item_id` |
| 10.6 | ⚪ Not Started | — | Render flight footprints as map polygons | Show `plan_geometry` / `project_bounds` as clickable map polygons |
| 10.7 | ⚪ Not Started | — | Implement layer opacity and visibility controls | Slider opacity, toggle visibility, layer ordering for overlapping imagery |
| 10.8 | ⚪ Not Started | — | Implement temporal comparison UI | Swipe/slider for projects with multiple dates (e.g., Ramajal Field) |
| 10.9 | ⚪ Not Started | — | Sync loading indicators | Same shared loading pattern as other data sources |
| 10.10 | ⚪ Not Started | — | Wire Save View flow | Pin imagery layers, save project/flight views to Map Layers |

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
| **DroneDeploy Metadata Table** | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0` |

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
- **Different Browse Pattern:** Browse by project → expand flights → load imagery, not search by keyword

---

## Task Details

### 10.1: Audit DroneDeploy Metadata Service for v2

**Goal:** Confirm v2 field availability, test WMTS loading patterns, and document any changes from v1.

**Acceptance Criteria:**
- [ ] Query FeatureServer `?f=json` and verify all fields match v1 types
- [ ] Test WMTS item loading via `wmts_item_id` (authentication requirements?)
- [ ] Test `plan_geometry` and `project_bounds` WKT parsing
- [ ] Test `azure_blob_url` accessibility
- [ ] Document record count (should be ~11)
- [ ] Note any new fields or schema changes since v1

**Output:** Update "Service Analysis" section below.

---

### 10.2: Create DroneDeploy Right Sidebar Shell

**Goal:** Set up the component structure. Note that DroneDeploy follows a different pattern than point-observation data sources — it's project-grouped and raster-oriented.

**Acceptance Criteria:**
- [ ] DroneDeploy adapter registered in v2 data source registry
- [ ] Component renders when DroneDeploy layer is selected
- [ ] Tabs: Overview | Browse (no Export tab — export is download links per flight)
- [ ] Overview tab: project summary, total flights, date range, "Browse Imagery →" button
- [ ] Component can show project list OR flight detail (drill-down pattern)

**Files to Create:**
- `src/v2/dataSources/dronedeploy/adapter.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneDeploySidebar.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneBrowseTab.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/DroneOverviewTab.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/ProjectListView.tsx`
- `src/v2/components/RightSidebar/DroneDeploy/FlightDetailView.tsx`

---

### 10.3: Implement Project/Flight Browse UI

**Goal:** Browse drone imagery organized by project with expandable flight lists.

**Acceptance Criteria:**
- [ ] Projects displayed as collapsible cards (project name, flight count, date range)
- [ ] Expand project → see individual flights (date, plan name, image collection badge)
- [ ] Date range filter across all projects
- [ ] Sort: by date (newest first) or by project name
- [ ] Flight cards show: capture date, plan name, WMTS availability, Image Collection badge
- [ ] Click flight card → open flight detail view
- [ ] Click "Load on Map" button → load WMTS overlay directly from browse

**Reference:** Integration guide "Grouping Options" section, v1 `DroneImageryView.tsx`

---

### 10.4: Implement Flight Detail View

**Goal:** Show full metadata and actions for a specific drone flight.

**Acceptance Criteria:**
- [ ] "← Back to Projects" navigation
- [ ] Project name and plan name
- [ ] Capture date (formatted)
- [ ] WMTS layer status (loaded / not loaded on map)
- [ ] "Load on Map" / "Remove from Map" toggle button
- [ ] "Fly to Extent" button (uses `plan_geometry` or `project_bounds`)
- [ ] Image Collection info (if available) with portal link
- [ ] Azure Blob download link (if `azure_blob_url` available)
- [ ] "Open in Portal" external link (`wmts_link`)
- [ ] Layer opacity slider (if currently loaded on map)

---

### 10.5: Load WMTS Imagery Layers on Map

**Goal:** Load drone orthomosaics as WMTS overlay layers on the ArcGIS map.

**Acceptance Criteria:**
- [ ] Create `droneDeployLayer.ts` that loads WMTSLayer from `wmts_item_id`
- [ ] Handle portal authentication if required
- [ ] Support loading multiple drone layers simultaneously (different flights)
- [ ] "Fly to" centers map on imagery extent when loaded
- [ ] Layer renders as semi-transparent overlay on basemap
- [ ] Default opacity: 80% (adjustable via slider)
- [ ] Add to `IMPLEMENTED_LAYERS` registry

**Technical Notes:**
- Use `@arcgis/core/layers/WMTSLayer` with `portalItem.id`
- Portal URL: `https://dangermondpreserve-spatial.com/portal`
- May need authentication token handling

---

### 10.6: Render Flight Footprints as Map Polygons

**Goal:** Show drone flight coverage areas on the map as clickable polygon outlines, separate from the actual imagery layers.

**Acceptance Criteria:**
- [ ] Parse `plan_geometry` WKT POLYGON into ArcGIS geometry
- [ ] Render flight footprints as semi-transparent polygon outlines on map
- [ ] Color-code by project or by recency
- [ ] Map click on footprint polygon → activate DroneDeploy + open flight detail
- [ ] Footprints visible when DroneDeploy is active, even before imagery is loaded
- [ ] Create `useDroneDeployMapBehavior` hook

---

### 10.7: Implement Layer Opacity and Visibility Controls

**Goal:** Since multiple drone imagery layers can overlap, provide fine-grained control over visibility and opacity.

**Acceptance Criteria:**
- [ ] Opacity slider per loaded drone layer (0%–100%)
- [ ] Toggle visibility per loaded layer
- [ ] Layer ordering control (which layer renders on top) — drag reorder or up/down buttons
- [ ] Controls accessible from both flight detail view and Map Layers widget
- [ ] Opacity state persists during session

---

### 10.8: Implement Temporal Comparison UI

**Goal:** For projects with multiple flights (e.g., Ramajal Field with 4 dates), enable before/after comparison.

**Acceptance Criteria:**
- [ ] Temporal comparison available when a project has 2+ flights
- [ ] Mode 1: **Swipe** — split-screen slider dividing two layers (left = earlier, right = later)
- [ ] Mode 2: **Toggle** — rapid switch between two dates with animation
- [ ] Date selector shows all available dates for the project
- [ ] Clear entry/exit from comparison mode
- [ ] Works with opacity controls (comparison layers at 100%)

**Reference:** v1 `DroneImageryCarousel.tsx`, ArcGIS Swipe widget

**Note:** This is a high-value feature for researchers tracking restoration progress, prescribed burn recovery, and infrastructure construction. Ramajal Field (Feb 2024 → Dec 2024) is the ideal demo scenario.

---

### 10.9: Sync Loading Indicators

**Goal:** Loading indicators for WMTS layer loading (which can be slow for large tile sets).

**Acceptance Criteria:**
- [ ] DroneDeploy adapter exposes `loading` via registry
- [ ] Map Layers widget shows spinner while WMTS tiles are loading
- [ ] Right sidebar shows loading state during metadata fetch
- [ ] WMTS layer "loaded" event clears loading state
- [ ] Uses shared loading primitives

---

### 10.10: Wire Save View Flow

**Goal:** Save drone imagery configurations to Map Layers widget.

**Acceptance Criteria:**
- [ ] Pin creates a DroneDeploy parent layer in Map Layers
- [ ] Individual loaded flights appear as child views
- [ ] Selecting a saved child view re-loads that specific WMTS layer
- [ ] Comparison mode state optionally saveable
- [ ] Follows shared child-view conventions from `LayerContext`

---

## Service Analysis

> Update during Task 10.1

### Metadata Table URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0`

### WMTS Loading Pattern
> Document during 10.1: authentication requirements, tile loading performance, portal item access

### Field Verification
| Field | v1 Type | v2 Status | Notes |
|-------|---------|-----------|-------|
| (verify all fields during 10.1) | | | |

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
| (none yet) | | | |

---

## Open Questions

- [ ] Does loading WMTS from the portal require authentication tokens?
- [ ] Should we show thumbnail previews of imagery in the browse list?
- [ ] How to handle the swipe/comparison widget — ArcGIS Swipe widget or custom?
- [ ] Should flight footprint polygons be visible at all zoom levels or only when zoomed in?
- [ ] Is the `azure_blob_url` field reliably populated and accessible for TIF downloads?
- [ ] Should DroneDeploy have an Export tab for bulk download, or are per-flight download links sufficient?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | — | Created phase document | Will + Claude |
