# Phase 3: Dendra Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 1 active task remaining (+3 backlog; CON-FEB25-04 complete Feb 25)  
**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-3-dendra-completed.md`  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 26, 2026

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| D26-01 | 🟢 Complete | Feb 26, 2026 | Auto-adjust y-axis limits when time slider changes zoom range | Frontend complete: y-axis min/max recalculates from currently visible slider window, preventing anomaly-driven flattening in zoomed views. Backend anomaly removal tracked separately. |
| CON-DENDRA-08 | ⚪ Not Started | Feb 25, 2026 | Collect feedback from Dendra power users | Intake from consolidated feedback. |
| D20-BL01 | 🔵 Backlog | Feb 20, 2026 | Plot multiple time series data streams on the same floating chart widget | e.g., wind speed avg + wind speed max overlaid. Needs UX design thought. Source: Dan Meeting Feb 20 |
| D20-BL02 | 🔵 Backlog | Feb 20, 2026 | Plot same data stream across multiple stations on the same chart for comparison | e.g., wind speed at Oak State, Sutter, and Team data streams simultaneously. Source: Dan Meeting Feb 20 |
| D20-BL03 | 🔵 Backlog | Feb 20, 2026 | Real-time weather-style sensor overlays on the map — wind direction arrows, rain gauge icons, temperature readings | Dan's idea: show live sensor readings inline on map. More "live dashboard" feel. Source: Dan Meeting Feb 20 |
| CON-FEB25-04 | 🟢 Complete | Feb 26, 2026 | Dendra layers load too slow — review query patterns per Dan's document | Query alignment + on-demand per-station summaries + loading UI polish + progressive time-series loading. Source: consolidated-tasks-feb-25-2026.md |

**Archived completed tasks:** `D20-05`, `D20-06`, `TF-06`, `TF-07`, `CON-DENDRA-01`, `CON-DENDRA-02`, `CON-DENDRA-03`, `CON-DENDRA-04`, and `D24-01` moved to `docs/archive/phases/phase-3-dendra-completed.md` on Feb 25, 2026.

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
| D26-01 | Auto-adjust y-axis limits when time slider changes zoom range | 🟢 Complete | | Frontend complete in `DendraTimeSeriesPanel`: y-axis rescaled from visible data on dataZoom events |
| CON-DENDRA-08 | Collect feedback from Dendra power users | ⚪ Not Started | | Intake from consolidated feedback |
| CON-FEB25-04 | Dendra layers load too slow — review query patterns per Dan's document | 🟢 Complete | | Query alignment, on-demand per-station summaries, loading UI polish, progressive time-series loading. See CON-FEB25-04 Investigation Notes. |

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

### D26-01 Scope Notes (Feb 26, 2026)

**Problem framing:**
- When the user changes the start and end time using the time slider widget, the y-axis limits stay fixed to the full dataset range.
- Anomalous readings (e.g., electrical failure causing wind speed of -5,000) dominate the scale, so normal fluctuations in a zoomed section appear as a flat line.

**Two-part fix (backend tracked separately):**
1. **Backend:** Remove anomalous data at source (handled separately; ignore for this task).
2. **Frontend:** Automatically adjust y-axis min/max based on the *visible* data range when the time slider changes. When zooming to a section that excludes anomalies, the chart should recalculate y-axis limits from the visible datapoints so lines show proper variation instead of appearing flat.

**Acceptance criteria draft:**
- Change time slider start/end to zoom into a subsection of the chart.
- Y-axis limits update to fit the min/max of the visible data in that subsection.
- If the zoomed subsection excludes anomalous spikes (e.g., -5,000), normal fluctuations (e.g., 0–15 mph wind) are visible with appropriate scale, not flattened.

### D26-01 Implementation Notes (Feb 26, 2026)

**Implemented frontend y-axis rescaling:**
- Added visible-range y-axis bounds calculation in `src/v2/components/FloatingWidgets/DendraTimeSeriesPanel/DendraTimeSeriesPanel.tsx`.
- Hooked into ECharts `datazoom` events so each slider adjustment recomputes y-axis `min`/`max` from only the currently visible portion of the series.
- Preserved a small dynamic padding around the visible min/max for readability; includes a minimum fallback padding for flat-value windows.
- Result: zooming into normal periods no longer appears as a flat line when outlier anomalies exist elsewhere in the full dataset.

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

**Chart panel UX polish (Feb 24, 2026):**
- **Initial size:** Default panel dimensions increased (width 560–760, height 380–500) so charts open at a readable size; user can still shrink manually.
- **Initial placement:** `buildInitialPanelRect` uses separate `bottomMargin` (32px) so new panels open ~1–2rem above the map bottom edge; right inset unchanged.
- **Time slider:** ECharts `dataZoom` slider keeps `showDataShadow: true` for rise/fall preview; `grid.bottom` 18%, slider `bottom` 12, `height` 24 for clear visibility without clipping; x-axis label `margin` 6 for compact spacing.
- **Minimum resize height:** `MIN_PANEL_HEIGHT` 360 so resized panels remain usable.

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

### D20-06 Implementation Notes (Feb 20, 2026)

**What was observed:**
- Dendra has a layer-wide map click handler that performs station hit-testing and auto-activates station detail/popup/goTo. During custom polygon draw, those clicks interfered with the draw flow.
- Map markers were filtered by the custom polygon, but the sidebar station list was not — users saw all stations in the list even when the polygon enclosed only a subset.

**What was fixed:**
1. **Draw-mode guard:** `src/v2/dataSources/dendra/useMapBehavior.ts` — Dendra station click handler no-ops while `isSpatialQueryDrawing` is true so map clicks stay dedicated to Sketch polygon vertex placement/finish.
2. **Sidebar sync:** `src/v2/components/RightSidebar/Dendra/DendraBrowseTab.tsx` — Station cards now apply the same polygon containment filter used on map markers; stream-name filtering runs on top of the spatially filtered result. Counts (e.g., "1 of 3") reflect the polygon-filtered set.

### CON-FEB25-04 Investigation Notes (Feb 25, 2026)

**Task start:**
- Began query-pattern audit using coworker brief (`Backend Coworker Brief: Data Source Requirements`) and current V2 Dendra service code.

**Current implementation observed:**
- Initial layer warm-cache does two full-table ArcGIS queries per active Dendra service (`Layer 0` stations + `Table 2` summaries) using `where=1=1&outFields=*`.
- Datastream chart fetch uses legacy v0 bridge query (`Table 3` resolve by `dendra_ds_id`, then `Table 4` datapoints) and always requests the most recent 2000 points (`orderByFields=timestamp_utc DESC&resultRecordCount=2000`).
- Date range and aggregation selectors are applied client-side after fetch (raw/hourly/daily/weekly transforms), not pushed down into backend query parameters.

**Mismatch vs brief query patterns:**
- Brief calls for time-range-specific server queries (7 days, 30 days, 1 year, all time) and corresponding aggregation options; current implementation does not issue time-bounded server queries for chart load.
- Brief expects efficient "latest reading per sensor" retrieval for summary badges; current warm-cache relies on summary table payload and does not use a dedicated latest-reading query path.
- Full-row `outFields=*` on warm-cache is broader than required for initial browse rendering and likely contributes to layer load latency.

**What was implemented (same day follow-up):**
- Added server-side time-window query support for Dendra chart datapoints in `src/v2/services/dendraStationService.ts` using ArcGIS date predicates in `where` for `startDate` / `endDate`.
- Updated chart filter flow in `src/v2/context/dendraContext/internal/useDendraChartPanels.ts` so date range changes trigger backend re-query (instead of only client-side slicing), while aggregation remains client-side.
- Added request-version guarding per chart panel to avoid stale async responses overwriting newer filter results.
- Reduced warm-cache payload shape by replacing `outFields=*` with explicit field allow-lists for stations and summaries, with `returnGeometry=false` on those table/layer fetches.
- Updated date-input bounds in `src/v2/components/RightSidebar/Dendra/StationDetailView.tsx` to use summary-level first/last reading times so users can request broader ranges than the currently loaded chart payload.

**On-demand per-station summaries (third follow-up):**
- Eliminated bulk summary fetch entirely. Warm cache now loads stations only → map markers appear in <1s.
- Added `fetchSummariesForStation(serviceUrl, stationId)` to `dendraStationService.ts` — queries Table 2 with `WHERE station_id=X` (~18 rows per station vs ~1,350 bulk).
- Rewrote `useDendraServiceCache.ts` with per-station summary cache (Map<stationId, summaries>). Summaries fetched on demand when user drills into a station, cached so revisits are instant.
- `DendraBrowseTab` triggers `loadStationSummaries(stationId)` on station selection (click or map marker).
- Stream-name filter gracefully passes through stations whose summaries haven't been loaded yet (benefit of the doubt).
- Removed unused `fetchSummaries()`, `fetchServiceData()`, `getSummariesForStation()`, and `DendraServiceData` type.
- Station cards continue to use `station.datastream_count` as fallback for count display.

**Loading UI polish (completion):**
- Replaced conflicting "Datastreams (0)" + "Loading datastream details..." with in-section loading state.
- `DatastreamSummaryListSection` now accepts `isLoading`; shows "Datastreams (loading...)" + spinner + "Loading datastream summaries..." with blue spinner when summaries are in flight.
- Removed duplicate top-level loading row in `DendraBrowseTab`.

**Progressive time-series loading (Feb 26 follow-up):**
- Large datastreams (e.g., 244k points) no longer block chart render. Initial fetch loads last 30 days only; chart paints immediately.
- Background backfill fetches older chunks (120-day windows) and appends to `rawData`; chart re-renders as each chunk arrives.
- Added `progressiveLoading` panel state; top badge shows "Loading older data... currently showing X — Y" during backfill, then "Showing data range: X — Y" when complete.
- Removed redundant footer range text; footer now only shows minimize control.

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
| Feb 26, 2026 | D26-01 | **Complete.** Frontend y-axis autoscaling implemented in `DendraTimeSeriesPanel`: on `dataZoom` changes, chart recomputes y-axis min/max from only the visible slider window so outliers outside the zoomed range no longer flatten normal variability. Backend anomaly removal tracked separately. | Cursor |
| Feb 26, 2026 | CON-FEB25-04 | **Complete.** Progressive time-series loading: initial 30-day window for fast chart paint, background backfill in 120-day chunks; top badge shows loading/range status; removed redundant footer range text. | Cursor |
| Feb 25, 2026 | CON-FEB25-04 | **Complete.** Loading UI polish: in-section datastream loading state (blue spinner + "Loading datastream summaries...") instead of conflicting "0" message. | Cursor |
| Feb 25, 2026 | CON-FEB25-04 | **Continue.** On-demand per-station summaries: eliminated bulk summary fetch, warm cache loads stations only, summaries fetched per-station on drill-down (~18 rows vs ~1,350 bulk). Graceful stream-name filter for unloaded stations. | Cursor |
| Feb 25, 2026 | CON-FEB25-04 | **Continue.** Implemented query-alignment fixes: server-side date-window chart queries + paged range fetch, chart refetch on date-range edits, warm-cache `outFields` allow-lists, and summary-based date input bounds in station detail. | Cursor |
| Feb 25, 2026 | CON-FEB25-04 | **Started.** Query-pattern audit against coworker brief: identified current mismatches (time-windowed server queries missing, heavy `outFields=*` warm-cache usage, chart fetch fixed to latest 2000 points). Added implementation direction notes. | Cursor |
| Feb 24, 2026 | D24-01 | **Complete.** Dendra chart panel UX polish: larger initial size (560–760×380–500), separate bottom margin for initial placement (~1–2rem from map bottom), time slider data shadow restored, x-axis/slider spacing tuned, slider bottom margin to avoid clipping. See CON-DENDRA-02 Implementation Notes. | Cursor |
| Feb 20, 2026 | D20-06 | **Complete.** Custom polygon draw tool for Dendra: (1) station click handler suppressed during draw mode; (2) sidebar station list synced with polygon filter so map and list match. See D20-06 Implementation Notes. | Cursor |
| Feb 20, 2026 | D20-06 | **Continue.** Added sidebar spatial synchronization for Dendra station list: station cards now apply the same custom polygon filter used on map markers, then apply stream-name filtering on top. | Cursor |
| Feb 20, 2026 | D20-06 | **Started.** Guarded Dendra map click station-activation flow during spatial polygon draw mode (`isSpatialQueryDrawing`) to avoid draw interruption from hit-test/popup/goTo interactions. | Cursor |
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

