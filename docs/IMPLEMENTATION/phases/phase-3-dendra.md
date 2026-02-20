# Phase 3: Dendra Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 4 / 5 tasks (completed tasks 3.1–3.9 archived Feb 18, 2026)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-3-dendra-completed.md`  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 20, 2026

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| D20-05 | 🟢 Complete | Feb 20, 2026 | Investigate and fix Dendra browser popup asking for device access | Removed stray localhost ingest debug `fetch()` calls from Dendra service/context code; V2-wide scan found no camera/mic/geolocation permission API usage in app code. Source: Dan Meeting Feb 20 |
| D20-06 | ⚪ Not Started | Feb 20, 2026 | Verify and fix custom polygon draw tool for Dendra | Will noted the tool needs to be properly implemented for Dendra. Source: Dan Meeting Feb 20 |
| D20-BL01 | 🔵 Backlog | Feb 20, 2026 | Plot multiple time series data streams on the same floating chart widget | e.g., wind speed avg + wind speed max overlaid. Needs UX design thought. Source: Dan Meeting Feb 20 |
| D20-BL02 | 🔵 Backlog | Feb 20, 2026 | Plot same data stream across multiple stations on the same chart for comparison | e.g., wind speed at Oak State, Sutter, and Team data streams simultaneously. Source: Dan Meeting Feb 20 |
| D20-BL03 | 🔵 Backlog | Feb 20, 2026 | Real-time weather-style sensor overlays on the map — wind direction arrows, rain gauge icons, temperature readings | Dan's idea: show live sensor readings inline on map. More "live dashboard" feel. Source: Dan Meeting Feb 20 |
| TF-06 | 🟢 Complete | Feb 20, 2026 | Rename left sidebar group from "Sensor Equipment" to "Field Sensors" | Implemented via CATEGORY_DISPLAY_NAME_OVERRIDE in layerRegistry; left sidebar now shows "Field Sensors". Trisalyn QA Feb 20 |
| TF-07 | 🟢 Complete | Feb 20, 2026 12:30 PM | Remove "dangermond_" prefix from Dendra station tooltip titles (tooltip says "dangermond_Oaks", sidebar says "Oaks") | Fixed by normalizing station display names (`formatStationDisplayName`) and using sanitized value in map popup title + Dendra UI surfaces. Source: Trisalyn QA Feb 20 |
| CON-DENDRA-01 | 🟢 Complete | Feb 19, 2026 | Map click on station syncs to right sidebar and opens station | High priority; map-first |
| CON-DENDRA-02 | 🟢 Complete | Feb 19, 2026 | Multiple time series charts side-by-side; draggable/resizable/minimizable within map area bounds | High priority |
| CON-DENDRA-03 | 🟢 Complete | Feb 19, 2026 | Multi-stream selection across stations with stream-name filtering and no reset requirement | High priority |
| CON-DENDRA-04 | 🟢 Complete | Feb 19, 2026 | Surface pinned-stream counts/icons across Map Layers, stream rows, and station cards | Dynamic labels, chart close fix, sync across views |

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
| CON-DENDRA-03 | Multi-stream cross-station selection UX | 🟢 Complete | | Stream-name filtering, in-detail station switcher, no reset requirement |
| CON-DENDRA-04 | Pinned-stream visibility and count cues across map/sidebar | 🟢 Complete | | See Task Details |
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

### CON-DENDRA-03 Implementation Notes (Feb 19, 2026)

**Implemented:**
- Stream-name filter input in Browse tab narrows station results by datastream name match.
- Stream-name filter carried into Station Detail view so users keep comparison context while drilling in.
- In-detail station switcher (`Switch Station`) lets users move between matching stations without backing out or resetting.
- Datastream cards respect stream-name filter and show filtered counts.
- No reset requirement: users can compare streams across stations without losing filter context.

### CON-DENDRA-04 Scope Notes (Feb 19, 2026)

**Problem framing:**
- In Dendra, users are thinking primarily in terms of selecting/pinning datastreams (often across stations), not "editing filters" as a mental model.
- Current UI does not make pinned state obvious enough in key navigation surfaces.

**Core behavior (required):**
- **Map Layers widget:** For each filtered child view label, show pinned datastream count (numeric) with pin icon so users can quickly see which views have charted/pinned content.
- **Right sidebar datastream rows/cards:** Add a prominent blue pin affordance per datastream so pinning is explicit and scannable.
- **Station cards (browse list):** In the top-right metadata area, place a compact pin-count indicator to the left of the existing `Active` badge, using number + blue pin icon (e.g., `1 [pin]`, `4 [pin]`).

**Interaction expectations:**
- Pin indicators update immediately when users pin/unpin datastreams.
- Counts remain consistent between Map Layers child views and station-level summaries.
- Iconography should reuse the existing pin glyph used in map pinned-layers context, with a blue treatment for emphasis.

**Acceptance criteria draft:**
- Pin one datastream from Station A: station card shows `1 [pin]`; corresponding child view in Map Layers shows matching pinned count.
- Pin additional datastreams from same station: station card increments correctly (e.g., `4 [pin]`).
- Pin datastreams across multiple stations: each station card shows its own correct count; Map Layers child views show correct per-view counts.
- Unpin operations decrement counts immediately in all affected surfaces.
- Layout check: station card pin-count indicator appears left of `Active` badge and does not cause clipping/wrapping regressions at common sidebar widths.

**Open implementation decision (before build starts):**
- ✅ Resolved (Feb 19): station-card pin count represents only datastreams pinned within the **currently active child view**.

### CON-DENDRA-04 Implementation Notes (Feb 19, 2026)

**Map Layers widget:**
- `pinnedStreamStatsBySource` computed per Dendra layer: stream count, station count, station names.
- Child views show pin count badge (number + blue pin icon, no "pins" text).
- Dynamic labels: collapsed = `N data streams, M stations`; expanded = `N data streams from <Station Name>` (single) or `N data streams from M stations` (multiple).

**Right sidebar:**
- Station cards: `pinnedStreamCount` badge left of `Active`, scoped to effective active child view.
- Datastream rows: blue Pin button per card; `handleToggleDatastreamPin` uses `effectiveActiveViewId` for attribution.

**Chart panel sync:**
- `openChart` uses effective view id (`activeLayer.viewId` or visible child view) for `sourceViewId`.
- Panels without `sourceViewId` attributed to first child view for counts/visibility.
- Chart close/minimize/expand buttons: `onPointerDown` stopPropagation so map click handlers don't steal focus.

**Files touched:** DendraContext.tsx, DendraTimeSeriesPanel.tsx, MapLayersWidget.tsx, PinnedLayersSection.tsx, PinnedLayerRow.tsx, PinnedLayerChildRow.tsx, DendraBrowseTab.tsx, StationCard.tsx, StationDetailView.tsx.

### D20-05 Implementation Notes (Feb 20, 2026)

**What was observed:**
- Browser device-access style popups were reported during live Dendra sessions.

**What was fixed:**
- Removed accidental debug telemetry `fetch()` calls to `http://127.0.0.1:7243/ingest/...` from:
  - `src/v2/services/dendraStationService.ts`
  - `src/v2/context/DendraContext.tsx`

**V2-wide permission scan result:**
- Searched V2 codebase for direct browser permission/device APIs (`getUserMedia`, `mediaDevices`, `geolocation`, `Notification.requestPermission`, `requestMIDIAccess`, `bluetooth/usb/serial/hid` request calls, ArcGIS Locate/Track widgets).
- No direct permission-triggering API usage found in current app code.

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
| Feb 20, 2026 | TF-07 | **Complete.** Removed `dangermond_` station-name prefix from Dendra tooltip titles by introducing shared station display-name formatter and using it in map popup + Dendra display surfaces for consistent naming. | Cursor |
| Feb 19, 2026 | CON-DENDRA-03 | **Complete.** Multi-stream selection across stations: stream-name filtering, in-detail station switcher, no reset requirement. See Task Details. | Cursor |
| Feb 19, 2026 | CON-DENDRA-04 | **Complete.** Pinned-stream visibility across Map Layers, right sidebar, and station cards. Dynamic child-view labels; chart close fix; effective active view for sync. See Task Details. | Cursor |
| Feb 19, 2026 | CON-DENDRA-04 | **Started implementation.** Added active-child-view pin count indicators on station cards, datastream pin/unpin affordance in station detail, and child-view pin counts in Map Layers widget. | Cursor |
| Feb 19, 2026 | CON-DENDRA-04 | **Re-scoped.** Replaced "auto-expand Map Layers widget" with pinned-stream visibility/count UX: count+pin indicators in Map Layers child views, datastream rows, and station cards (pin indicator placed left of `Active`). Added acceptance criteria + one count-scope decision question. | Cursor |
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

