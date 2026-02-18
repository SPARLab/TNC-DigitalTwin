# Phase 3: Dendra — Archived Completed Tasks

**Archived:** February 18, 2026  
**Purpose:** Archive of completed Phase 3 tasks (3.1–3.9). Full details preserved for reference. Add new tasks to `docs/IMPLEMENTATION/phases/phase-3-dendra.md`.

**Source:** `docs/IMPLEMENTATION/phases/phase-3-dendra.md`

---

## Quick Task Summary (Archived)

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 3.1 | 🟢 Complete | Feb 16, 2026 | Query Dendra service to understand attributes | Service schema documented; v2 per-type services + v0 bridge for time series |
| 3.2 | 🟢 Complete | Feb 16, 2026 | Create Dendra right sidebar shell | DendraBrowseTab, DendraOverviewTab, StationDetailView, StationCard; adapter + registry wired |
| 3.3 | 🟢 Complete | Feb 16, 2026 | Implement sensor filter UI | Region, status, sensor-type filters; showActiveOnly; Map Layers sync |
| 3.4 | 🟢 Complete | Feb 16, 2026 | Implement sensor list with cards | StationCard with name/ID, location, status, last reading; drill-down to detail |
| 3.5 | 🟢 Complete | Feb 16, 2026 | Implement sensor detail with time series chart | DendraTimeSeriesPanel (floating on map), ECharts, date/aggregation filters |
| 3.6 | 🟢 Complete | Feb 16, 2026 | Implement time range filter (Level 3) | Date range + aggregation; Save View / Save as New View; LayerContext sync |
| 3.5a | 🟢 Complete | Feb 13, 2026 | Fix: Subsequent datastream clicks don't update chart | Race condition + stale ECharts instance fixes |
| 3.5b | 🟢 Complete | Feb 13, 2026 | Fix: Some sensors show 0 data despite record counts | v0 bridge + null-heavy datapoint query fix |
| 3.5c | 🟢 Complete | Feb 13, 2026 | Fix: Glassmorphism background not visible | Visible panel, bottom-right, stronger contrast |
| 3.7 | 🟢 Complete | Feb 16, 2026 | Weather Stations layer investigation | Dataset 190 hidden via backend; dataset 183 working |
| 3.8 | 🟢 Complete | Feb 16, 2026 | Barometer datastream formatValue crash | Coerce min/max/avg to number; handle NaN |
| 3.9 | 🟢 Complete | Feb 16, 2026 | Save With Filters button behavior | "Update Current View" vs "Save as New View" distinct actions |

---

## Task Details (Archived)

### 3.1: Query Dendra Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the Dendra services.

**Acceptance Criteria:**
- [x] Document station/sensor feature service attributes
- [x] Document datastream API structure
- [x] Identify available sensor types (rain, temp, wind, etc.)
- [x] Note current query performance

**Output:** Findings in "Service Analysis" section in phase-3-dendra.md.

---

### 3.2: Create Dendra Right Sidebar Shell

**Goal:** Set up the component structure for the Dendra browse experience.

**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.

**Acceptance Criteria:**
- [x] Component renders when Dendra layer is selected
- [x] Tabs exist: Overview | Browse | Export
- [x] Overview tab is the default/active tab
- [x] Overview tab includes prominent "Browse Features →" button to navigate to Browse tab
- [x] Component can show sensor list OR sensor detail (drill-down pattern)

**Files Created:**
- `src/v2/components/RightSidebar/Dendra/DendraSidebar.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraBrowseTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraOverviewTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraExportTab.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorListView.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorDetailView.tsx`

---

### 3.3: Implement Sensor Filter UI (Layer-Level)

**Goal:** Create layer-level filters for the sensors. These filters determine **which sensors appear** on the map and in the browse list.

**Design Decision (Feb 2, 2026):** Resolved DFT-004 — This is **State A** (Layer View). Filters shown here are saved to the **pinned layer**.
**Design Decision (Feb 5, 2026):** Resolved DFT-039 — Auto-apply everywhere. No Apply button. Dropdowns fire immediately on change. Date range fields fire on calendar close/blur. `AbortController` cancels in-flight requests. Loading feedback per DFT-018. Result count updates continuously.

**Acceptance Criteria:**
- [x] Region dropdown (fires immediately on change)
- [x] Status dropdown (Active, Maintenance, Inactive) (fires immediately on change)
- [x] Sensor type filter (if multiple types in same layer) (fires immediately on change)
- [x] Time range filter: "Show sensors with data in:" + date pickers (start/end) (fires on calendar close/blur per field)
- [x] No Apply button — all filters auto-apply (DFT-039)
- [x] Filter updates sensor list below
- [x] Filter updates map markers
- [x] When layer is pinned, current filter state is saved to pinned layer
- [x] Section header clearly labels scope: "Filter Sensors" (per DFT-038 convention)
- [x] Result count footer: "Showing X of Y sensors" (updates continuously)

---

### 3.4: Implement Sensor List with Cards

**Goal:** Display sensors as browseable cards.

**Acceptance Criteria:**
- [x] Cards show: sensor name/ID, location, status
- [x] Cards show last reading (if available)
- [x] Status indicator (active = pulsing dot, maintenance = badge)
- [x] "View Sensor Details →" button navigates to detail view

---

### 3.5: Implement Sensor Detail with Time Series Chart

**Goal:** When user clicks a sensor, show its detail view with time series.

**Design Decision (Feb 2, 2026):** Resolved DFT-004 — This is **State B** (Feature View). The pop-up chart has **slider only** for exploration (direct manipulation). Parametric date pickers live in the sidebar (task 3.6).
**Design Decision (Feb 5, 2026):** Resolved DFT-040 — No collapsed layer filter summary bar. Back button is only Level 2 reference. Feature header merges with filter actions.
**Design Decision (Feb 6, 2026):** Resolved DFT-043 — Minimal sidebar at Level 3. Stats appear in pop-up footer (not sidebar).

**Acceptance Criteria:**
- [x] "← Back to Sensors" navigation (returns to State A)
- [x] No Level 2 summary bar — back button is only Level 2 reference (DFT-040)
- [x] Sensor info header (name, location, status, current reading) with [Clear] and [↩ Undo] actions
- [x] Time series chart component (in pop-up floating on map)
- [x] Chart is interactive (hover to see values)
- [x] Slider for time navigation — exploration only, NOT saved
- [x] Stats footer in pop-up — Min, Max, Avg, Total displayed below chart (DFT-043)
- [x] "View Full Chart" option for larger view
- [x] "Download CSV" for current time range (uses sidebar filter, not slider position)

**Implementation:** DendraTimeSeriesPanel (floating), ECharts.

---

### 3.5a: Fix — Subsequent Datastream Clicks Don't Update Chart

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:** Two bugs: (1) race condition — stale fetch could overwrite newer datastream's data (added request-counter guard in openChart); (2) stale ECharts instance — chart div remounts during loading transition but old instance pointed to removed DOM (added getDom() check before init).

---

### 3.5b: Fix — Some Sensors Show 0 Data Despite Record Counts

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:** v0 bridge IDs/counts validated; issue was null-heavy datapoint windows. Updated query to fetch most recent non-null points (`value IS NOT NULL`, DESC + reverse to ASC).

---

### 3.5c: Fix — Glassmorphism Background Not Visible

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:** Implemented visible glassmorphism, bottom-right placement, half-height panel, stronger contrast/readability, larger slider and tick labels, darker header.

---

### 3.6: Implement Time Range Filter (Feature-Level, in Sidebar)

**Goal:** Allow user to specify the time range for viewing a sensor's datastream. This is the **parametric control** (specification) that gets saved with bookmarks.

**Design Decision (Feb 2, 2026):** Resolved DFT-004 — This is **State B** (Feature View) in the sidebar. These date pickers are the canonical filter location. The pop-up slider is for exploration only.
**Design Decision (Feb 5, 2026):** Resolved DFT-039 — Auto-apply everywhere. No Apply button. Date range fields fire on calendar close/blur. Aggregation dropdown fires immediately. `AbortController` cancels in-flight requests. Result count updates continuously.
**Design Decision (Feb 5, 2026):** Resolved DFT-040 — Condensed `FeatureDetailCard` layout. No Level 2 summary bar. No separate "Filter Datapoints" header. Filter controls embedded in feature detail card.

**Acceptance Criteria:**
- [x] Sidebar shows feature filter section when sensor is selected
- [x] No Level 2 summary bar — back button is only Level 2 reference (DFT-040)
- [x] No separate "Filter Datapoints" header — sensor header provides scope (DFT-040)
- [x] Date range picker (from/to, full-width `col-span-2`) — fires on calendar close/blur per field
- [x] Aggregation dropdown (`col-span-1`) — fires immediately on change
- [x] Filter controls use DFT-038 grid layout (`1fr 1fr`, `gap: 8px`)
- [x] [Clear] and [↩ Undo] in sensor header row (per DFT-031)
- [x] No Apply button — all filters auto-apply (DFT-039)
- [x] Filter updates chart display (syncs with pop-up)
- [x] Inheritance: Default filter value inherited from layer filter at selection time
- [x] User can adjust filter independently (expand, narrow, or clear)
- [x] "Bookmark Sensor" saves sensor with current feature filter
- [x] Result count footer: "Showing X datapoints" (updates continuously)
- [x] Independence: After bookmark creation, feature filter is independent of layer filter

**Implementation:** DendraViewFilters type. syncDendraFilters() in LayerContext. "Update Current View" vs "Save as New View" distinct actions. createDendraFilteredView() in LayerContext.

---

### 3.7: Weather Stations Layer — Investigation

**Status:** ✅ Complete (Feb 16, 2026)

**Root Cause:** Two Weather Stations layers exist in the Data Catalog:
- **Dataset 183** — Dendra sensor service (working)
- **Dataset 190** — Legacy v0 service (showed "not implemented" toast)

**Resolution:** Backend fix — Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer.

---

### 3.8: Barometer Datastream formatValue Crash

**Status:** ✅ Complete (Feb 16, 2026)

**Implementation:** ArcGIS returned min/max/avg as strings; `formatValue` threw `value.toFixed is not a function`. Fixed: coerce to number, handle NaN. Files: dendraStationService.ts.

---

### 3.9: Save With Filters Button — Behavior

**Status:** ✅ Complete (Feb 16, 2026)

**Implementation:** Distinct behavior + clearer labels. "Update Current View" updates current row; "Save as New View" creates and activates a new filtered child view in Map Layers. Files: StationDetailView.tsx, LayerContext.tsx.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-3-dendra.md`
- **Extended notes:** `docs/archive/phase-3-dendra-completed-tasks.md` (older condensed version)
- **Master plan:** `docs/master-plan.md`
