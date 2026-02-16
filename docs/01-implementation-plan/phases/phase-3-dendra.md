# Phase 3: Dendra Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 6 / 10 tasks (3.5 in progress, split into 5 sub-tasks)  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the Dendra sensor browse experience in the right sidebar. This data source has:
- **Pointer rows** (sensors point to time-series datastreams)
- **Level 3 related data** (datastream with time range, aggregation)
- **Time series visualization** (charts)

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/00-design-iteration/design-system/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02d-browse-dendra.html`
- Previous mockups: `mockups/03a-dendra-floating-panel.html`, `mockups/03b-dendra-sidebar-panel.html`

## Key Paradigm Notes

- **Row Type:** Pointer (sensor points to datastream)
- **Save Options:** "Save View" OR "Save With Filters"
- **Has Level 3:** Yes - time range + aggregation filter on datastream
- **NOT dual-level:** Unlike ANiML, Dendra doesn't have global time filtering at layer level (V1)

---

## Task Status

| ID | Status | Task | Assignee | Notes |
|----|--------|------|----------|-------|
| 3.1 | 🟢 Complete | Query Dendra service to understand attributes | | Feb 12: Service analysis in doc |
| 3.2 | 🟢 Complete | Create Dendra right sidebar shell | | Overview/Browse tabs, drill-down |
| 3.3 | 🟢 Complete | Implement sensor filter UI | | Active-only toggle |
| 3.4 | 🟢 Complete | Implement sensor list with cards | | StationCard, StationDetailView |
| 3.5 | 🟡 In Progress | Implement sensor detail with time series chart | | **V1 WORKS:** Floating ECharts panel loads and refreshes on datastream click. **REMAINING ISSUE:** Sidebar layout/styling polish (3.5d). **UPDATES:** 3.5a, 3.5b, and 3.5c complete. |
| 3.5a | 🟢 Complete | Fix: Subsequent datastream clicks don't update chart | | Feb 13: Two bugs — (1) race condition: stale fetch could overwrite newer datastream's data (added request-counter guard in openChart), (2) stale ECharts instance: chart div remounts during loading transition but old instance pointed to removed DOM (added getDom() check before init). |
| 3.5b | 🟢 Complete | Fix: Some sensors show 0 data despite record counts | | Feb 13: v0 bridge IDs/counts validated; issue was null-heavy datapoint windows. Updated query to fetch most recent non-null points (`value IS NOT NULL`, DESC + reverse to ASC). |
| 3.5c | 🟢 Complete | Fix: Glassmorphism background not visible | | Feb 13: Implemented visible glassmorphism, bottom-right placement, half-height panel, stronger contrast/readability, larger slider and tick labels, darker header. |
| 3.5d | ⚪ Not Started | Polish: Improve right sidebar layout/styling | | User feedback: "something feels off" about sidebar appearance |
| 3.6 | 🟢 Complete | Implement time range filter (Level 3) | | Feb 13: Added Level 3 datastream filter controls in Station Detail (from/to date + aggregation), auto-applied chart updates, live data-point count, and explicit save actions ("Save View" + "Save With Filters") synced to Map Layers state. |
| 3.7 | 🟢 Complete | Weather Stations layer — Investigation | | Feb 16: Issue was **dataset-190** (Dangermond Preserve Weather Stations, legacy v0 service in Freshwater category) showing "not implemented" toast. The proper Dendra Weather Stations layer (dataset-183, Research & Sensor Equipment) was working correctly. **Resolution:** Backend fix — Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer. Legacy layer no longer appears in sidebar. |
| 3.8 | 🟢 Complete | Barometer datastream formatValue crash | | Feb 16: ArcGIS returned min/max/avg as strings; `formatValue` threw `value.toFixed is not a function`. Fixed: coerce to number, handle NaN. Files: dendraStationService.ts. |
| 3.9 | ⚪ Not Started | Save With Filters button — behavior or removal | | User reports Save With Filters doesn't appear to do anything. Options: (1) implement distinct behavior vs Save View, (2) remove if redundant. |

**Follow-up:** Task 27 in `docs/development-task-tracker.md` — "Save View / Save With Filters" sync with Map Layers. Replace bookmark terminology; persist right-sidebar filter state into Map Layers. **Prerequisite met:** `v2/iNaturalist` has been merged into this branch lineage (`v2/iNaturalist` -> `v2/animl` -> `v2/dendra`). Dendra uses explicit save (not continuous auto-save) due to Level 3 complexity.

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 3.1: Query Dendra Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the Dendra services.

**Acceptance Criteria:**
- [ ] Document station/sensor feature service attributes
- [ ] Document datastream API structure
- [ ] Identify available sensor types (rain, temp, wind, etc.)
- [ ] Note current query performance

**Questions to Answer:**
- What attributes exist on sensors? (type, location, status, last reading)
- How do we fetch time series data? (API endpoint, parameters)
- What aggregation options exist? (hourly, daily, weekly)
- What's the data range available per sensor?

**Output:** Add findings to "Service Analysis" section below.

---

### 3.2: Create Dendra Right Sidebar Shell

**Goal:** Set up the component structure for the Dendra browse experience.

**Acceptance Criteria:**
- [ ] Component renders when Dendra layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] Browse tab is the default/active tab
- [ ] Component can show sensor list OR sensor detail (drill-down pattern)

**Files to Create:**
- `src/v2/components/RightSidebar/Dendra/DendraSidebar.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraBrowseTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraOverviewTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraExportTab.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorListView.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorDetailView.tsx`

---

### 3.3: Implement Sensor Filter UI

**Goal:** Create filters for the sensors.

**Acceptance Criteria:**
- [ ] Region dropdown
- [ ] Status dropdown (Active, Maintenance, Inactive)
- [ ] Sensor type filter (if multiple types in same layer)
- [ ] Filter updates sensor list below

**Reference:** Mockup `02d-browse-dendra.html` "Filter Sensors" section

---

### 3.4: Implement Sensor List with Cards

**Goal:** Display sensors as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: sensor name/ID, location, status
- [ ] Cards show last reading (if available)
- [ ] Status indicator (active = pulsing dot, maintenance = badge)
- [ ] "View Sensor Details →" button navigates to detail view

**Reference:** Mockup `02d-browse-dendra.html` sensor cards

---

### 3.5: Implement Sensor Detail with Time Series Chart

**Goal:** When user clicks a sensor, show its detail view with time series.

**Acceptance Criteria:**
- [ ] "← Back to Sensors" navigation
- [ ] Sensor info header (name, location, status, current reading)
- [ ] Time series chart component
- [ ] Chart is interactive (hover to see values)
- [ ] Stats sidebar or panel (min, max, avg, total)
- [ ] "View Full Chart" option for larger view
- [ ] "Download CSV" for current time range

**Reference:** Mockup `02d-browse-dendra.html` sensor detail section

**Chart Options:**
- Consider using existing chart library (Chart.js, Recharts, etc.)
- Or reuse from mockup's SVG approach

---

### 3.6: Implement Time Range Filter (Level 3)

**Goal:** Allow user to filter datastream by time range.

**Acceptance Criteria:**
- [x] Date range picker (from/to)
- [x] Aggregation dropdown (hourly, daily, weekly)
- [x] Filter updates chart display
- [x] "Save View" persists current right-sidebar state to Map Layers
- [x] "Save With Filters" persists sensor + datastream time filters to Map Layers
- [x] Count shows "X data points"

**Reference:** Mockup `02d-browse-dendra.html` "Filter Datastream" section

**State Shape (for Level 3 query):**
```typescript
savedView: {
  featureId: "RS-042",
  relatedDataQuery: {
    startDate: "2023-01-01",
    endDate: "2023-03-31",
    aggregation: "daily"
  }
}
```

---

### 3.7: Weather Stations Layer — Investigation

**Goal:** Determine why "Weather Stations" layer shows "layer not implemented yet" toast.

**Context:** Phase-3 Service Analysis lists Weather Stations as a Dendra service (`Dangermond_Weather_Stations_Sensor`, dataset ID 183). The Dendra adapter should handle all 10 per-type sensor services. Possible causes: catalog detection (path pattern), registration timing vs. `createMapLayer`, or a different catalog entry with similar name.

**Acceptance Criteria:**
- [x] Identify root cause (catalog, registration, or other)
- [x] Add fix task to this phase if code change needed
- [x] Document findings in Notes column

**Resolution (Feb 16, 2026):**

**Root Cause:** Two Weather Stations layers exist in the Data Catalog:

1. **Dataset 183** - `Dangermond_Weather_Stations_Sensor` (Dendra sensor service ✅)
   - Display title: "Weather Stations"
   - Category: Research and Sensor Equipment (36)
   - Service structure: Standard Dendra schema (Layer 0: Locations, Table 1: Data, Table 2: Summary)
   - Detection: Correctly identified as `dataSource: 'dendra'`
   - **Status: Working correctly**

2. **Dataset 190** - `Dangermond_Preserve_Weather_Stations` (Legacy v0 service ❌)
   - Display title: "Dangermond Preserve Weather Stations"
   - Category: Freshwater (32)
   - Service structure: v0 monolithic schema (Layer 0: Stations, Tables 1-3: Sensors/Datastreams/Datapoints)
   - Detection: Identified as `dataSource: 'tnc-arcgis'` (no adapter implemented)
   - **Status: Showing "not implemented yet" toast** ← This was the issue

**Fix Applied:**
- Backend fix: Dan set `is_visible: 0` for dataset-190 in the Data Catalog FeatureServer
- Dataset-190 no longer appears in the catalog query results
- Users will only see dataset-183 (proper Dendra Weather Stations) in "Research and Sensor Equipment" category
- No client-side filtering needed - handled at the source

**Files Changed:**
- None (backend-only fix via Data Catalog FeatureServer configuration)

---

### 3.9: Save With Filters Button — Behavior or Removal

**Goal:** Resolve confusion around Save With Filters. It currently does not appear to have distinct behavior from Save View.

**Options:**
1. **Implement distinct behavior:** Save With Filters should persist station + datastream + date range + aggregation to Map Layers as a child view; Save View persists current view state without filters. Clarify UX and wire correctly.
2. **Remove:** If Save View already covers the use case, remove Save With Filters to avoid dead UI.

**Acceptance Criteria:**
- [ ] Decide: implement distinct behavior or remove
- [ ] If implement: wire Save With Filters to sync Dendra filters to Map Layers child view
- [ ] If remove: remove button and clean up related code

---

## Service Analysis

> **Completed Feb 12, 2026** — Discovery via Dan's Data Catalog FeatureServer

### Data Catalog Service (Master Registry)
- **URL:** `https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer`
- **Table 0:** Categories (id, name, parent_id, display_order)
- **Table 1:** Datasets (id, service_name, display_title, server_base_url, service_path, has_feature/map/image_server, is_visible)
- **Table 2:** Dataset Categories (junction: dataset_id ↔ category_id, many-to-many)

### Dendra Sensor Feature Services (10 total, all category_id=36)

| Dataset ID | Service Path | Display Title | Base URL |
|------------|-------------|---------------|----------|
| 179 | `Dangermond_Dataloggers_Sensor` | Dataloggers | dangermondpreserve-spatial.com |
| 180 | `Dangermond_Barometers_Sensor` | Barometer Sensors | dangermondpreserve-spatial.com |
| 182 | `Dangermond_Wind_Monitors_Sensor` | Wind Sensors | dangermondpreserve-spatial.com |
| 183 | `Dangermond_Weather_Stations_Sensor` | Weather Stations | dangermondpreserve-spatial.com |
| 184 | `Dangermond_Water_Level_Meters_Sensor` | Handheld Water Level Sensors | dangermondpreserve-spatial.com |
| 185 | `Dangermond_Solinst_Leveloggers_Sensor` | Solinst Groundwater Sensors | dangermondpreserve-spatial.com |
| 186 | `Dangermond_RanchBot_Water_Monitors_Sensor` | RanchBot Water Monitors | dangermondpreserve-spatial.com |
| 187 | `Dangermond_RanchBot_Rain_Gauges_Sensor` | RanchBot Rain Gauge Sensors | dangermondpreserve-spatial.com |
| 188 | `Dangermond_Rain_Gages_Sensor` | Rain Gage Sensors | dangermondpreserve-spatial.com |
| 189 | `Dangermond_Pressure_Level_Sensors` | Water Pressure Level Sensors | dangermondpreserve-spatial.com |

### Per-Service Schema (All 10 follow same pattern)

**Layer 0 — Sensor Locations** (Point Feature Layer):
| Attribute | Type | Notes |
|-----------|------|-------|
| station_id | OID | Primary key |
| dendra_st_id | String | Dendra platform ID |
| station_name | String | e.g., "Dangermond_Army Camp" |
| station_description | String | |
| latitude / longitude | Double | |
| elevation | Double | Meters |
| time_zone | String | e.g., "PST" |
| is_active | SmallInt | 1 = active |
| sensor_id | Int | FK to sensor type |
| sensor_name | String | e.g., "All-in-one Weather Station" |
| sensor_thing_type_id | String | Dendra thing type |
| datastream_count | BigInt | Number of datastreams |

**Table 1 — Sensor Data** (Time Series):
- Fields: station_id, station_name, lat/lon, elevation, timestamp_utc
- **Variable columns differ per sensor type** (e.g., Weather Stations: air_temp_avg, rainfall, wind_speed_avg, relative_humidity_max, etc.)
- maxRecordCount: 2000 per query

**Table 2 — Sensor Summary** (Per-Datastream Stats):
| Attribute | Type | Notes |
|-----------|------|-------|
| datastream_id | OID | |
| dendra_ds_id | String | Dendra platform ID |
| datastream_name | String | e.g., "Air Temp Avg" |
| variable | String | e.g., "DegreeCelsius" |
| unit | String | |
| station_id / station_name | Int / String | FK to station |
| total_records | BigInt | e.g., 197,271 |
| first_reading_time | Date | |
| last_reading_time | Date | |
| min_value / max_value / avg_value | Double | Pre-computed stats |

### Legacy Service (v0 — may deprecate)
- **URL:** `https://dangermondpreserve-spatial.com/server/rest/services/Dendra_Stations/FeatureServer`
- Layer 0: Stations, Table 3: Datastreams, Table 4: Datapoints (generic `value` column)
- Monolithic — all sensor types in one service
- New per-type services have named measurement columns and pre-computed summaries

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| All stations (Weather, 10 stations) | ~200ms | Layer 0 query |
| Summary table (all datastreams) | ~300ms | Pre-computed, no time series load needed |
| Time series data (2000 records) | TBD | Table 1, paginated |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Use new per-type feature services (not v0 monolithic) | Feb 12 | Dan already split Dendra into 10 per-sensor-type services with standardized schema. Better than filtering v0 monolithic service. Each has Locations/Data/Summary tables. |
| Dynamic layer registry from Data Catalog FeatureServer | Feb 12 | Dan's catalog has ~90+ datasets with categories, service URLs. Replaces static layerRegistry.ts. Added as foundational Task 0.9 — blocks all parallel branches. |
| Shared Dendra adapter across all sensor types | Feb 12 | All 10 services follow identical schema. One adapter handles all; per-type config maps layerId → service URL + measurement columns. |
| Use ECharts for time series (consistent with v0) | Feb 12 | Already a project dependency; v0 DendraDetailsSidebar.tsx uses it. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Should we reuse any code from existing `DendraDetailsSidebar.tsx`? (ECharts setup likely reusable) -> Yes but try to use similar style to the HTML mockup
- [x] Which charting library to use? → ECharts (already a dependency, v0 uses it)
- [ ] Floating panel vs. in-sidebar for time series? (mockups show both; **floating chart chosen for next task 3.5**)
- [ ] How to handle sensors with very long data ranges? (Summary table has pre-computed stats; paginated Data table)
- [ ] When will sensor datasets be cross-categorized? (Currently all in category 36; junction table supports many-to-many)
- [ ] Should "Not Yet Implemented" toast include service description from catalog?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 3.7 | ✅ **Task 3.7 complete.** Investigated "Weather Stations layer not implemented yet" toast. Root cause: Two Weather Stations layers exist in catalog — dataset-183 (Dendra sensor service, working) and dataset-190 (legacy v0 service in Freshwater category, not implemented). Backend fix: Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer. | Claude |
| Feb 16, 2026 | 3.7, 3.8, 3.9 | **Added tasks 3.7 (Weather Stations investigation), 3.8 (barometer formatValue fix — complete), 3.9 (Save With Filters behavior or removal).** Reordered Task Status table (ID, Status, Task) for quick scanning. | Claude |
| Feb 13, 2026 | Task 27 follow-up | ✅ Replaced Dendra bookmark terminology with explicit save actions (`Save View`, `Save With Filters`) and synced Dendra right-sidebar state to Map Layers (`LayerContext.syncDendraFilters`). Added one-shot Dendra filter hydration when switching child views or triggering **Edit Filters** from Map Layers. | Claude |
| Feb 13, 2026 | 3.6 | ✅ **Task 3.6 complete.** Added Level 3 datastream filtering controls in `StationDetailView` (from/to date + hourly/daily/weekly aggregation) with auto-apply behavior. Extended `DendraContext` chart state to store raw points + active filter and compute filtered/aggregated chart data reactively. Added live "X data points" count and explicit save actions for Dendra views. | Claude |
| Feb 13, 2026 | 3.5b | ✅ **Sub-task 3.5b complete.** Investigated v0 bridge mismatch hypothesis by sampling across all 10 Dendra sensor services and confirming `dendra_ds_id -> v0 datastream_id` resolves correctly with matching record counts. Root cause was query windowing with null-heavy datapoint segments; chart request updated to fetch latest non-null values (`value IS NOT NULL`, `ORDER BY timestamp_utc DESC`) and reverse client-side for chronological rendering. | Claude |
| Feb 13, 2026 | 3.5a | ✅ **Sub-task 3.5a complete.** Fixed subsequent datastream clicks not updating chart. Two bugs: (1) race condition in openChart — stale fetch could overwrite newer datastream's data (added request-counter guard); (2) stale ECharts instance — chart div remounts during loading transition but old instance pointed to removed DOM (added getDom() check before init). | Claude |
| Feb 13, 2026 | 3.5c | ✅ **Sub-task 3.5c complete.** Floating chart glassmorphism now visibly renders (including Safari/WebKit-safe backdrop styles), panel moved to bottom-right, expanded panel set to ~50% map height, chart/readability pass applied (higher contrast surfaces/text, larger axis tick labels, larger/higher range slider), and header hierarchy updated to prioritize measurement title with darker header background. **Remaining blockers for 3.5:** 3.5b (0-data inconsistency). | Claude |
| Feb 13, 2026 | 3.5 | **Task 3.5 V1 partial complete.** Built floating time series panel with ECharts: DendraTimeSeriesPanel component (glassmorphism styling, teal theme, stats sidebar, CSV export, minimize/close), bridged v2 dendra_ds_id → v0 legacy service for time series data (Table 1 on per-type services is empty), clickable DatastreamSummaryCards (entire card is button with inline stats), pan/zoom + highlight station when chart opens. **Known issues:** (1) Subsequent datastream clicks don't refresh chart, (2) Some sensors show 0 data despite record counts in summary, (3) Glassmorphism background not visible to user, (4) Sidebar layout needs polish. Sub-tasks created: 3.5a-d. | Claude |
| Feb 12, 2026 | 3.1-3.4 | **Tasks complete.** Full Dendra station browse adapter. Service layer (`dendraStationService.ts`), DendraContext (per-service cache), adapter + useMapBehavior, dendraLayer.ts (green/gray station markers), Overview/Browse tabs, StationCard, StationDetailView with datastream summaries. Fixes: buildServiceUrl (no double path), elevation null/NaN, layer-switch graphics clearing (only active layer populated). **Next: 3.5 floating time series chart.** | Claude |
| Feb 12, 2026 | 3.1 | **Service analysis complete.** Discovered 10 per-type Dendra sensor services via Dan's Data Catalog FeatureServer. Documented schemas, URLs, and architectural decisions. Added Task 0.9 (Dynamic Layer Registry) to Phase 0 as blocking prerequisite. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |

