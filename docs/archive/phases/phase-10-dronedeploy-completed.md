# Phase 10: DroneDeploy — Archived Completed Tasks

**Last Updated:** February 25, 2026  
**Purpose:** Archive of completed Phase 10 tasks (10.1–10.11, CON-DRONE-01, CON-DRONE-02, TF-10). Full phase doc: `docs/IMPLEMENTATION/phases/phase-10-dronedeploy.md`

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 10.1 | ✅ | Feb 16, 2026 16:26 PST | Audit DroneDeploy metadata service for v2 | Completed against `DroneDeploy_Metadata_v2`; schema drift documented; WMTS access pattern validated |
| 10.2 | ✅ | Feb 16, 2026 20:12 PST | Create DroneDeploy right sidebar shell | Added DroneDeploy adapter + Overview/Browse tab shell with project-grouped browse/detail drill-down in v2 right sidebar |
| 10.3 | ✅ | Feb 16, 2026 16:41 PST | Detect and expand DroneDeploy orthomosaic child layers | Left sidebar for `dataset-193`: parent expansion, live project/flight counts, per-project expand/collapse, selectable flights, loading/error/empty states. Row click auto-expands; 300ms CSS transition. Left-sidebar project click loads WMTS imagery. |
| 10.4 | ✅ | Feb 16, 2026 23:18 PST | Implement project browse UI (compact project cards) | Browse projects as compact card-only list (project name, flight count, date range, WMTS summary) with click-through into project detail |
| 10.5 | ✅ | Feb 16, 2026 20:12 PST | Implement flight detail view | Full metadata panel, load/remove and fly-to actions, image collection + portal links, TIF link, opacity slider for loaded layers |
| 10.6 | ✅ | Feb 16, 2026 20:12 PST | Load WMTS imagery layers on map | WMTS loading via `wmts_item_id` into DroneDeploy group layer with multi-flight support, default 80% opacity, fly-to handling, registry wiring |
| 10.7 | ✅ | Feb 19, 2026 | Render flight footprints as map polygons | Skipped / not implementing per user decision — flight footprint polygons will not be built |
| 10.8 | ✅ | Feb 16, 2026 19:05 PST | Implement layer opacity and visibility controls | Per-flight visibility toggles, draw-order up/down for overlapping WMTS, compact one-row action buttons in project detail card |
| 10.9 | ✅ | Feb 16, 2026 22:15 PST | Implement temporal comparison UI | On-map temporal carousel via active-layer adapter override (`dataset-193`), v1-style carousel button/dot styling, carousel selection synced to right-sidebar flight detail, auto fly-to on selection |
| 10.10 | ✅ | Feb 16, 2026 23:40 PST | Sync loading indicators | Drone loading covers metadata + WMTS tile lifecycle with shared loading primitives and Map Layers eye-slot spinners |
| 10.11 | ✅ | Feb 16, 2026 23:40 PST | Wire Save View flow | Save View creates/reuses DroneDeploy child views in Map Layers; child activation rehydrates correct WMTS flight |
| CON-DRONE-01 | ✅ | Feb 19, 2026 | Bug: drone imagery does not change when toggling between flights | Fixed: single-flight replacement, auto-load default, WMTS 404 fallback |
| CON-DRONE-02 | ✅ | Feb 19, 2026 | Simplify project flights UI: default name/date, expand for metadata | Card click syncs map + toggles metadata; caret-only disclosure; animated expand/collapse |
| TF-10 | ✅ | Feb 20, 2026 | Add gray background to DroneDeploy project cards | Project cards use `bg-gray-50` default, `bg-gray-100` hover in project switcher view |

---

## Task Details

### 10.1: Audit DroneDeploy Metadata Service for v2

**Goal:** Confirm v2 field availability, test WMTS loading patterns, and document any changes from v1.

**Implementation:** Completed against `DroneDeploy_Metadata_v2`. Schema drift documented (new fields: summary, description, project_lat, project_lon, plan_lat, plan_lon). WMTS access pattern validated (portalItem.id loading, no auth for public items). Record count: 16 across 7 projects. WKT parse validation: 16/16 for plan_geometry and project_bounds. azure_blob_url caveat: populated but sample URLs returned 404.

### 10.2: Create DroneDeploy Right Sidebar Shell

**Goal:** Set up the component structure for project-grouped, raster-oriented DroneDeploy.

**Implementation:** DroneDeploy adapter registered in v2 data source registry. Overview | Browse tabs (no Export). Overview: project summary, total flights, date range, "Browse Imagery →" button. Component shows project list OR flight detail (drill-down pattern). Files: adapter.tsx, DroneDeploySidebar.tsx, DroneBrowseTab.tsx, DroneOverviewTab.tsx, ProjectListView.tsx, FlightDetailView.tsx.

### 10.3: Detect Orthomosaic Child Layers and Enable Project Expansion

**Goal:** For catalog-discovered `DroneDeploy Orthomosaics` parent layer (`dataset-193`), detect associated orthomosaic flights/projects and present expandable selection pattern.

**Implementation:** Left sidebar detects dataset-193 for DroneDeploy expansion. Query metadata service, compute orthomosaic counts by project. Expandable project rows with per-project counts. Expanding project reveals selectable flight rows. Selecting flight sets active detail context for WMTS load actions. Empty/error states explicit. Row click auto-expands projects panel; 300ms CSS transition. **Feb 16 fix:** Left-sidebar project click now loads WMTS imagery (setFlightLoaded + requestFlyToFlight) so map shows tiles immediately.

### 10.4: Implement Compact Project Browse UI

**Goal:** Keep Browse tab at project level only: compact project cards with minimal metadata and click-through to project details.

**Implementation:** Projects displayed as compact cards: project name, flight count, date range, WMTS summary. Single metadata row where possible. No per-flight rows in projects list. Clicking project card opens project details view with flight list and all flight-level actions/metadata.

### 10.5: Implement Project Detail + Flight Detail View

**Goal:** After selecting a project card, show project-specific flights; selecting a flight shows full flight metadata/actions.

**Implementation:** "← Back to Projects" navigation. Project detail context includes flights. Project name, plan name, capture date (formatted). WMTS layer status (loaded/not loaded). "Load on Map" / "Remove from Map" toggle. "Fly to Extent" button. Image Collection info + portal link. Azure Blob download link. "Open in Portal" external link. Layer opacity slider when loaded.

### 10.6: Load WMTS Imagery Layers on Map

**Goal:** Load drone orthomosaics as WMTS overlay layers on the ArcGIS map.

**Implementation:** WMTSLayer from `wmts_item_id` via portalItem.id. Multi-flight support. "Fly to" centers map on imagery extent. Semi-transparent overlay, default 80% opacity. Added to IMPLEMENTED_LAYERS registry.

### 10.8: Implement Layer Opacity and Visibility Controls

**Goal:** Fine-grained control over visibility and opacity for overlapping drone imagery layers.

**Implementation:** Per-flight visibility toggles. Draw-order up/down controls for overlapping WMTS. Compact one-row action buttons in project detail card. Visibility/order controls in Map Layers widget and in-context for DroneDeploy flights. Opacity state persists during session.

### 10.9: Implement Temporal Comparison UI

**Goal:** For projects with multiple flights (e.g., Ramajal Field with 4 dates), enable rapid temporal comparison by toggling one active flight at a time.

**Implementation:** On-map temporal carousel for active DroneDeploy projects with 2+ flights. Apple-style carousel: left/right navigation + dot indicators (v1 DroneImageryCarousel styling). Right-sidebar flight selection synced with carousel. Switching flights de-renders prior unpinned flight. Pinned flights remain visible. Auto fly-to extent on selection. Uses active-layer adapter override for dataset-193.

### 10.10: Sync Loading Indicators

**Goal:** Loading indicators for WMTS layer loading (which can be slow for large tile sets).

**Implementation:** DroneDeploy adapter exposes `loading` via registry. Map Layers widget shows spinner while WMTS tiles loading. Right sidebar shows loading during metadata fetch. WMTS layer "loaded" event clears loading state. Uses shared loading primitives.

### 10.11: Wire Save View Flow

**Goal:** Save drone imagery configurations to Map Layers widget.

**Implementation:** Pin creates DroneDeploy parent layer in Map Layers. Individual loaded flights appear as child views. Selecting saved child view re-loads that specific WMTS layer. Comparison mode state optionally saveable. Follows shared child-view conventions from LayerContext (droneView.flightId).

### 10.7: Render Flight Footprints as Map Polygons

**Goal:** Show drone flight coverage areas on the map as clickable polygon outlines.

**Implementation:** Skipped per user decision. Flight footprint polygons will not be built.

### CON-DRONE-01: Fix Flight Toggle Imagery Switching

**Goal:** Ensure map imagery reliably updates when users toggle between flights in DroneDeploy project detail.

**Implementation:** Single-flight replacement semantics (new selection unloads old imagery); default to first valid flight for carousel alignment; auto-load default flight when Orthomosaics activates; map-level activation guardrails; WMTS 404 fallback to alternate flight in same project with user toast. Files: DroneDeploySidebar.tsx, LayerRow.tsx, useMapBehavior.ts.

### CON-DRONE-02: Simplify Project Flights UI

**Goal:** Reduce visual clutter in project detail flight lists via progressive disclosure.

**Implementation:** Collapsed default: flight name + capture date only. Expanded: secondary metadata (WMTS/plan IDs, links, geometry). Card click syncs map imagery selection and toggles metadata panel. Top-right caret indicates expand/collapse. Removed Selected label, Visible/Hidden button, up/down reorder controls. 200ms ease-out expand/collapse transition. Files: FlightDetailView.tsx, DroneDeploySidebar.tsx.

### TF-10: Project Card Background Polish

**Goal:** Improve visual separation in DroneDeploy project switcher view.

**Implementation:** Project cards use `bg-gray-50` default with `bg-gray-100` hover. File: ProjectListView.tsx. Source: Trisalyn QA Feb 20.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-10-dronedeploy.md`
- **Master plan:** `docs/master-plan.md`
