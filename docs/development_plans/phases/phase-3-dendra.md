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

- Master Plan: `docs/development_plans/master-development-plan.md`
- Design System: `docs/development_plans/design-system.md`
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

> Fill this out during Task 3.1

### Feature Service / API URLs
- Stations/Sensors: TBD
- Datastream API: TBD

### Sensor Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Datastream API
| Parameter | Values | Notes |
|-----------|--------|-------|
| start_time | ISO date | |
| end_time | ISO date | |
| aggregation | hourly, daily, etc. | |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| All sensors | | |
| Datastream for 1 sensor (1 month) | | |
| Datastream for 1 sensor (1 year) | | |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Should we reuse any code from existing `DendraDetailsSidebar.tsx`?
- [ ] Which charting library to use?
- [ ] Floating panel vs. in-sidebar for time series? (mockups show both options)
- [ ] How to handle sensors with very long data ranges?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |

