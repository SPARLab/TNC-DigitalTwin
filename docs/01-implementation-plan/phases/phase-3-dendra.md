# Phase 3: Dendra Right Sidebar

**Status:** ⚪ Not Started  
**Progress:** 0 / 6 tasks  
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
- **Bookmark Options:** "Bookmark Sensor" OR "Bookmark with Time Range"
- **Has Level 3:** Yes - time range + aggregation filter on datastream
- **NOT dual-level:** Unlike ANiML, Dendra doesn't have global time filtering at layer level (V1)

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 3.1 | Query Dendra service to understand attributes | ⚪ Not Started | | |
| 3.2 | Create Dendra right sidebar shell | ⚪ Not Started | | |
| 3.3 | Implement sensor filter UI | ⚪ Not Started | | |
| 3.4 | Implement sensor list with cards | ⚪ Not Started | | |
| 3.5 | Implement sensor detail with time series chart | ⚪ Not Started | | |
| 3.6 | Implement time range filter (Level 3) | ⚪ Not Started | | |

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
- [ ] Date range picker (from/to)
- [ ] Aggregation dropdown (hourly, daily, weekly)
- [ ] Filter updates chart display
- [ ] "Bookmark Sensor" saves sensor only
- [ ] "Bookmark with Time Range" saves sensor + time filter
- [ ] Count shows "X data points"

**Reference:** Mockup `02d-browse-dendra.html` "Filter Datastream" section

**State Shape (for Level 3 query):**
```typescript
bookmark: {
  featureId: "RS-042",
  relatedDataQuery: {
    startDate: "2023-01-01",
    endDate: "2023-03-31",
    aggregation: "daily"
  }
}
```

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

- [ ] Should we reuse any code from existing `DendraDetailsSidebar.tsx`? (ECharts setup likely reusable)
- [x] Which charting library to use? → ECharts (already a dependency, v0 uses it)
- [ ] Floating panel vs. in-sidebar for time series? (mockups show both; start with sidebar)
- [ ] How to handle sensors with very long data ranges? (Summary table has pre-computed stats; paginated Data table)
- [ ] When will sensor datasets be cross-categorized? (Currently all in category 36; junction table supports many-to-many)
- [ ] Should "Not Yet Implemented" toast include service description from catalog?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 12, 2026 | 3.1 | **Service analysis complete.** Discovered 10 per-type Dendra sensor services via Dan's Data Catalog FeatureServer. Documented schemas, URLs, and architectural decisions. Added Task 0.9 (Dynamic Layer Registry) to Phase 0 as blocking prerequisite. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |

