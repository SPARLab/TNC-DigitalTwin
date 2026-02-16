# Phase 3 Dendra — Archived Completed Task Details

**Archived:** February 16, 2026  
**Purpose:** Reduce phase-3-dendra.md size. Full details preserved here for reference.

**Source:** `docs/01-implementation-plan/phases/phase-3-dendra.md`

---

## 3.1: Query Dendra Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the Dendra services.

**Acceptance Criteria:**
- [x] Document station/sensor feature service attributes
- [x] Document datastream API structure
- [x] Identify available sensor types (rain, temp, wind, etc.)
- [x] Note current query performance

**Output:** Findings in "Service Analysis" section in phase-3-dendra.md.

---

## 3.2: Create Dendra Right Sidebar Shell

**Goal:** Set up the component structure for the Dendra browse experience.

**Acceptance Criteria:**
- [x] Component renders when Dendra layer is selected
- [x] Tabs exist: Overview | Browse | Export
- [x] Browse tab is the default/active tab
- [x] Component can show sensor list OR sensor detail (drill-down pattern)

**Files Created:**
- `src/v2/components/RightSidebar/Dendra/DendraSidebar.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraBrowseTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraOverviewTab.tsx`
- `src/v2/components/RightSidebar/Dendra/DendraExportTab.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorListView.tsx`
- `src/v2/components/RightSidebar/Dendra/SensorDetailView.tsx`

---

## 3.3: Implement Sensor Filter UI

**Goal:** Create filters for the sensors.

**Acceptance Criteria:**
- [x] Region dropdown
- [x] Status dropdown (Active, Maintenance, Inactive)
- [x] Sensor type filter (if multiple types in same layer)
- [x] Filter updates sensor list below

**Reference:** Mockup `02d-browse-dendra.html` "Filter Sensors" section

---

## 3.4: Implement Sensor List with Cards

**Goal:** Display sensors as browseable cards.

**Acceptance Criteria:**
- [x] Cards show: sensor name/ID, location, status
- [x] Cards show last reading (if available)
- [x] Status indicator (active = pulsing dot, maintenance = badge)
- [x] "View Sensor Details →" button navigates to detail view

**Reference:** Mockup `02d-browse-dendra.html` sensor cards

---

## 3.5a: Fix — Subsequent Datastream Clicks Don't Update Chart

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:**
- Two bugs: (1) race condition — stale fetch could overwrite newer datastream's data (added request-counter guard in openChart); (2) stale ECharts instance — chart div remounts during loading transition but old instance pointed to removed DOM (added getDom() check before init).

---

## 3.5b: Fix — Some Sensors Show 0 Data Despite Record Counts

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:**
- v0 bridge IDs/counts validated; issue was null-heavy datapoint windows. Updated query to fetch most recent non-null points (`value IS NOT NULL`, DESC + reverse to ASC).

---

## 3.5c: Fix — Glassmorphism Background Not Visible

**Status:** ✅ Complete (Feb 13, 2026)

**Implementation:**
- Implemented visible glassmorphism, bottom-right placement, half-height panel, stronger contrast/readability, larger slider and tick labels, darker header.

---

## 3.6: Implement Time Range Filter (Level 3)

**Goal:** Allow user to filter datastream by time range.

**Acceptance Criteria:**
- [x] Date range picker (from/to)
- [x] Aggregation dropdown (hourly, daily, weekly)
- [x] Filter updates chart display
- [x] "Save View" persists current right-sidebar state to Map Layers
- [x] "Save With Filters" persists sensor + datastream time filters to Map Layers
- [x] Count shows "X data points"

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

## 3.7: Weather Stations Layer — Investigation

**Status:** ✅ Complete (Feb 16, 2026)

**Root Cause:** Two Weather Stations layers exist in the Data Catalog:
- **Dataset 183** — Dendra sensor service (working)
- **Dataset 190** — Legacy v0 service (showed "not implemented" toast)

**Resolution:** Backend fix — Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer.

---

## 3.8: Barometer Datastream formatValue Crash

**Status:** ✅ Complete (Feb 16, 2026)

**Implementation:** ArcGIS returned min/max/avg as strings; `formatValue` threw `value.toFixed is not a function`. Fixed: coerce to number, handle NaN. Files: dendraStationService.ts.

---

## 3.9: Save With Filters Button — Behavior or Removal

**Status:** ✅ Complete (Feb 16, 2026)

**Implementation:** Distinct behavior + clearer labels. "Update Current View" updates current row; "Save as New View" creates and activates a new filtered child view in Map Layers. Files: StationDetailView.tsx, LayerContext.tsx.
