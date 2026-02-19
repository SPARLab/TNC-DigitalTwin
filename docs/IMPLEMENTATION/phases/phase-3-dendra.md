# Phase 3: Dendra Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 2 / 7 tasks (completed tasks 3.1–3.9 archived Feb 18, 2026)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-3-dendra-completed.md`  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 19, 2026

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-DENDRA-01 | 🟢 Complete | Feb 19, 2026 | Map click on station syncs to right sidebar and opens station | High priority; map-first |
| CON-DENDRA-02 | 🟢 Complete | Feb 19, 2026 | Multiple time series charts side-by-side; draggable/resizable/minimizable within map area bounds | High priority |
| CON-DENDRA-03 | 🟡 In Progress | Feb 19, 2026 | Multi-stream selection across stations with stream-name filtering and no reset requirement | High priority |
| CON-DENDRA-04 | ⚪ Not Started | Feb 18, 2026 | Auto-expand Map Layers widget when a child view is added | Medium priority |
| CON-DENDRA-06 | ⚪ Not Started | Feb 18, 2026 | Review "Update View" versus "Save as New View" language and sync behavior | Low priority |
| CON-DENDRA-07 | ⚪ Not Started | Feb 18, 2026 | Add icon diagram for station to data stream hierarchy onboarding | Low priority |

**Phase-5 handoff:** `CON-DENDRA-05` (Export Builder UX refinement) is tracked in `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`.

---

## Phase Goal

Implement the Dendra sensor browse experience in the right sidebar. This data source has:
- **Pointer rows** (sensors point to time-series datastreams)
- **Level 3 related data** (datastream with time range, aggregation)
- **Time series visualization** (charts)

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02d-browse-dendra.html`
- Previous mockups: `mockups/03a-dendra-floating-panel.html`, `mockups/03b-dendra-sidebar-panel.html`

## Key Paradigm Notes

- **Row Type:** Pointer (sensor points to datastream)
- **Bookmark Options:** "Bookmark Sensor" (with inherited or explicit time range)
- **Has Level 3:** Yes - time range + aggregation filter on datastream
- **Dual-level filtering:** Layer-level time filter (which sensors to show) + Feature-level time filter (what data to view for a specific sensor)

**Decision (Feb 2, 2026):** Resolved DFT-004 — Progressive disclosure + direct/parametric separation:
- **Sidebar** is the canonical location for filter editing (date pickers, aggregation dropdowns)
- **Pop-up chart** has slider only for exploration (ephemeral, not saved)
- **State A (Layer View):** Show layer-level filters in sidebar ("Show sensors with data in: [date range]")
- **State B (Feature View):** Collapse layer filter to summary, show feature-level filters ("View data from: [date range]")
- **Inheritance:** When bookmarking without explicit feature filter, inherit from layer filter
- **Independence:** Layer and feature filters are independent after bookmark creation

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| CON-DENDRA-01 | Map click station -> sidebar station sync | 🟢 Complete | | Two-way sync, flash, Edit Filters fix, Stations header |
| CON-DENDRA-02 | Multi-chart compare (draggable/resizable/minimizable, map-constrained) | 🟢 Complete | | See Task Details |
| CON-DENDRA-03 | Multi-stream cross-station selection UX | 🟡 In Progress | | Stream-name filtering + in-detail station switcher implementation started |
| CON-DENDRA-04 | Auto-expand Map Layers widget on child add | ⚪ Not Started | | Intake from consolidated feedback |
| CON-DENDRA-06 | Review update/save language | ⚪ Not Started | | Intake from consolidated feedback |
| CON-DENDRA-07 | Station->stream hierarchy onboarding diagram | ⚪ Not Started | | Intake from consolidated feedback |
| CON-DENDRA-08 | Collect feedback from Dendra power users | ⚪ Not Started | | Intake from consolidated feedback |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

*Completed tasks 3.1–3.9 archived. See `docs/archive/phases/phase-3-dendra-completed.md` for full acceptance criteria and implementation notes.*

### CON-DENDRA-01 Implementation Notes (Feb 19, 2026)

**Map ↔ Sidebar two-way station sync:**
- Map click: hitTest Dendra graphics → `activateLayer(layerId, undefined, stationId)` immediately (no await on goTo); sidebar switches to Browse + station detail in parallel with pan/zoom.
- Sidebar click: station card selection triggers `focusStationOnMap()` — blue highlight, goTo (zoom 15, 800ms), ArcGIS popup open on matching graphic.
- RightSidebar: Dendra layers with `featureId` auto-open Browse tab (same pattern as iNaturalist/DataONE).
- DendraBrowseTab: hydrates `selectedStation` from `activeLayer.featureId`; `handleSelectStation` / `handleBackToStations` keep featureId in sync.

**Station metadata flash:**
- Dark-gray background pulse on station header card when map marker opens station detail (60ms delay + 220ms pulse, same cadence as EditFiltersCard; border stays stable).

**Edit Filters behavior:**
- When `lastEditFiltersRequest` fires, Dendra Browse exits station detail and clears `featureId` so Edit Filters reliably returns to filter controls.

**Stations section header:**
- Explicit "Stations" header with count above station cards to clarify result set vs filter section.

*Add new task details below as you define them.*

### CON-DENDRA-02 Scope Notes (Feb 19, 2026)

**Core behavior (required):**
- Support multiple time series chart panels visible side-by-side on the map area for comparison.
- Each chart panel is draggable, but must remain constrained to the map container bounds (no dragging outside map area).
- Each chart panel is resizable by the user (maintain minimum readable size).
- Each chart panel supports minimize/collapse so users can temporarily reduce visual clutter without closing the panel.

**Interaction expectations:**
- Dragging and resizing should feel direct and predictable (no jump on drag start, no loss of panel while interacting).
- If a resize action would exceed map bounds, clamp panel size/position so the panel stays inside the map container.
- Minimized panels remain associated with their chart context and can be restored in place.

**Acceptance criteria draft:**
- Open 2+ chart panels and place them side-by-side inside map area.
- Drag each panel to all map edges; panel never exits map bounds.
- Resize from supported handles; panel remains visible and usable.
- Minimize and restore any panel; chart state persists through minimize/restore.

### CON-DENDRA-02 Implementation Notes (Feb 19, 2026)

**Multi-panel architecture:**
- DendraContext refactored from single `chart` to `chartPanels[]` with per-panel state (id, x, y, width, height, zIndex, sourceLayerId, sourceViewId, sourceLayerName).
- Each panel is draggable (header drag handle), resizable (bottom-right grip), and minimizable; all constrained to `#map-container` bounds.
- First chart opens bottom-right; subsequent charts stack leftward/upward in a grid to support side-by-side comparison.

**Persistence and visibility:**
- Chart panels persist across layer switches and pin transitions. DendraTimeSeriesPanel is rendered globally in MapContainer (not adapter-scoped) so it stays mounted.
- Visibility tied to pinned layer/view: charts show only when their source Dendra layer is pinned and visible, and (if nested) when their source child view is visible.
- Orphaned unpinned charts are cleared when their source layer is no longer the active Dendra layer.

**Chart labeling:**
- Header shows datastream name; subtitle shows Station + Category (source layer name) for multi-chart disambiguation.

**Files touched:** DendraContext.tsx, DendraTimeSeriesPanel.tsx, StationDetailView.tsx, MapContainer.tsx, dendra adapter (FloatingPanel removed from adapter).

### CON-DENDRA-03 Implementation Notes (In Progress — Feb 19, 2026)

**Implemented so far:**
- Added stream-name filter input in Browse tab to narrow station results by datastream name match.
- Carried stream-name filter into Station Detail view so users keep comparison context while drilling in.
- Added in-detail station switcher (`Switch Station`) so users can move between matching stations without backing out/resetting.
- Datastream cards now respect stream-name filter and show filtered counts.

**Next checks before completion:**
- Verify expected workflow with real use case ("air temp avg across stations") and tune matching behavior if needed.
- Confirm whether auto-opening same-named stream on station switch is desired or should remain manual.

---

## Service Analysis

> Completed during Task 3.1. Implementation in `src/v2/services/dendraStationService.ts`.

### Feature Service / API URLs
- **v2 per-type services:** Data Catalog exposes 10 Dendra sensor services (e.g., Rain Gauges, Weather Stations). Each has Layer 0 (stations), Layer 2 (datastream summaries).
- **v0 legacy bridge:** Time series data fetched via `Dendra_Stations` FeatureServer Table 3/4; `dendra_ds_id` from v2 Summary maps to v0 datastream id.

### Sensor Attributes (DendraStation)
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `station_id` | number | Unique ID | |
| `dendra_st_id` | string | Dendra identifier | |
| `station_name` | string | Display | |
| `geometry` | point | Map marker | |
| (see dendraStationService.ts) | | | |

### Datastream API
| Parameter | Values | Notes |
|-----------|--------|-------|
| start_time / end_time | Epoch ms | Via v0 Table 4 query |
| aggregation | hourly, daily, weekly | Client-side from raw points |
| value IS NOT NULL | — | Required for valid datapoints |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| Stations + summaries (v2) | ~200–500 ms | Per service |
| Time series (v0 bridge) | ~500 ms–2 s | Depends on date range |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Dendra chart panels rendered globally in MapContainer | Feb 19, 2026 | Charts must persist across layer switches; adapter-scoped FloatingPanel unmounted when active layer changed. Global render + visibility filtering by pinned layer/view achieves persistence. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| Dendra chart panel header typography | Feb 19, 2026 | Stream name bold; labels (Station:, Category:) regular; values (station name, category) semi-bold. Pipe separator between Station and Category. Directs eye to important content. | Yes |

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, use the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 3:** Dendra layer/feature filter flows can reuse shared view-sync semantics while focusing phase work on sensor/time-range specifics.
- **Phase 3 verification:** Confirm widget "Edit Filters" preloads Dendra controls, sidebar updates propagate to the active child view, and manual child renames persist through sync cycles.
- Dendra branch should keep shared filtered-view rename behavior in Map Layers: custom names persist and block auto-overwrite during filter updates.
- Add Dendra-specific auto-naming for non-custom views (sensor/date-window oriented labels) using the same shared sync contract.

---

## Open Questions

- [ ] Should we reuse any code from existing `DendraDetailsSidebar.tsx`?
- [ ] Which charting library to use?
- [x] ~~Floating panel vs. in-sidebar for time series?~~ **Resolved (Feb 2):** Pop-up chart for visualization + slider (exploration), sidebar for filter controls (specification)
- [ ] How to handle sensors with very long data ranges?
- [ ] Should "Download CSV" use the sidebar filter range or offer a choice?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 19, 2026 | Dendra chart panel | **Polish.** Chart header typography: stream name bold; labels regular; values semi-bold. Pipe separator. Documented in phase + design-system. | Cursor |
| Feb 19, 2026 | CON-DENDRA-03 | **Started.** Added stream-name filtering and cross-station switcher foundation in Dendra Browse/Station Detail to support multi-stream comparison without reset workflow. | Cursor |
| Feb 19, 2026 | CON-DENDRA-02 | **Complete.** Multi-panel time series charts: draggable/resizable/minimizable, map-constrained, bottom-right initial placement, persistence across layer/pin transitions, visibility tied to pinned layer/view. See Task Details. | Cursor |
| Feb 19, 2026 | CON-DENDRA-01 | **Complete.** Two-way map↔sidebar station sync, dark-gray station header flash, Edit Filters exits station detail, Stations section header, sidebar→map highlight/popup/zoom, map click activates sidebar immediately (parallel with goTo). See Task Details. | Cursor |
| Feb 18, 2026 | All | **Archived completed tasks:** Moved tasks 3.1–3.9 (including 3.5a–3.9 fixes) to `docs/archive/phases/phase-3-dendra-completed.md`. Phase doc cleared for new tasks. Status → In Progress. | Claude |
| Feb 17, 2026 | All | **Phase status corrected:** Dendra was implemented but phase doc showed "Not Started". Updated to 🟢 Complete (9/9 core + 3.5a–3.9 fixes). Added Quick Task Summary; task table now reflects completion. See `docs/archive/phases/phase-3-dendra-completed.md` for archived details. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 3.3, 3.5, 3.6 | Resolved DFT-004: Progressive disclosure + direct/parametric separation. Sidebar edits filters (context-aware State A/B), pop-up has slider only (exploration). Layer and feature filters are independent after bookmark creation. | Will + Claude |
| Feb 4, 2026 | 3.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 5, 2026 | 3.3, 3.6 | Resolved DFT-039: Auto-apply everywhere — removed `[Apply]` buttons from both Layer View (Task 3.3) and Feature View (Task 3.6) ASCII diagrams. All filters fire immediately (dropdowns on change, date fields on calendar close/blur). `AbortController` cancels in-flight requests. Updated section headers and result count footers to match DFT-038 convention | Will + Claude |

