# Phase 10: DroneDeploy — Archived Completed Tasks (Partial)

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 10 tasks. Phase has 1 remaining (10.7). Add new completions here with timestamp.

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 10.1–10.6 | ✅ | Feb 16, 2026 | Metadata audit, sidebar shell, orthomosaic detection, project browse, flight detail, WMTS loading | |
| 10.8–10.11 | ✅ | Feb 16, 2026 | Opacity/visibility, temporal comparison, loading sync, Save View flow | |
| Task 38 | ✅ | Feb 16, 2026 | Left Sidebar Project Click → Load Imagery on Map | setFlightLoaded, requestFlyToFlight |

---

## Task Details

### 10.1–10.6: Foundation Pipeline

**10.1:** Metadata service audit. Validated DroneDeploy_Metadata_v2 endpoint. Documented schema drift (summary, description, project_lat, etc.). Validated WMTS loading via wmts_item_id.

**10.2:** Right sidebar shell. DroneDeploy adapter + Overview/Browse tabs. Project-grouped browse/detail drill-down.

**10.3:** Orthomosaic detection. Left sidebar for dataset-193: parent expansion, project/flight counts, per-project expand/collapse. Row click auto-expands. 300ms CSS transition.

**10.4:** Project browse UI. Compact project cards (name, flight count, date range, WMTS summary). Click-through to project detail.

**10.5:** Flight detail view. Full metadata panel. Load/remove, fly-to actions. Image collection + portal links. TIF link. Opacity slider.

**10.6:** WMTS imagery on map. WMTS loading via wmts_item_id. Multi-flight support. Default 80% opacity. Fly-to handling.

### 10.8–10.11: Controls and Sync

**10.8:** Per-flight visibility toggles. Draw-order up/down for overlapping WMTS. Compact one-row action buttons.

**10.9:** Temporal comparison UI. On-map carousel visibility. Active-layer adapter override for dataset-193. Carousel selection synced to right-sidebar flight detail. Auto fly-to on selection.

**10.10:** Loading indicators. Metadata + WMTS tile lifecycle (WMTSLayer.when()) in loading state. Shared LoadingPrimitives. Eye-slot spinner in Map Layers.

**10.11:** Save View flow. Creates/reuses DroneDeploy child views in Map Layers (droneView.flightId). Child activation rehydrates correct WMTS flight.

### Task 38: Left Sidebar Project Click → Load Imagery

**Goal:** Left-sidebar project select should load WMTS imagery on map (previously only right-sidebar triggered load).

**Implementation:** Left-sidebar project click now calls setFlightLoaded, setSelectedFlightId, requestFlyToFlight. Browse tab gating uses adapter.id. Default flight prefers valid WMTS.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-10-dronedeploy.md`
- **Master plan:** `docs/master-plan.md`
