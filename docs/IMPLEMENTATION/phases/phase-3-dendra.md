# Phase 3: Dendra Right Sidebar

**Status:** 🟢 Complete  
**Progress:** 9 / 9 tasks (including fixes 3.5a–3.9)  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 16, 2026

---

## Quick Task Summary

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

**Archived task details:** `docs/archive/phase-3-dendra-completed-tasks.md`

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
| 3.1 | Query Dendra service to understand attributes | 🟢 Complete | | dendraStationService.ts; v2 per-type + v0 bridge |
| 3.2 | Create Dendra right sidebar shell | 🟢 Complete | | DendraBrowseTab, DendraOverviewTab, StationDetailView, StationCard |
| 3.3 | Implement sensor filter UI | 🟢 Complete | | Region, status, showActiveOnly; Map Layers sync |
| 3.4 | Implement sensor list with cards | 🟢 Complete | | StationCard; drill-down to StationDetailView |
| 3.5 | Implement sensor detail with time series chart | 🟢 Complete | | DendraTimeSeriesPanel (floating), ECharts |
| 3.6 | Implement time range filter (Level 3) | 🟢 Complete | | Date range + aggregation; Save View / Save as New View |
| 3.5a | Fix: Datastream clicks don't update chart | 🟢 Complete | | Race condition + ECharts DOM guard |
| 3.5b | Fix: Some sensors show 0 data | 🟢 Complete | | v0 bridge + non-null query |
| 3.5c | Fix: Glassmorphism not visible | 🟢 Complete | | Panel styling |
| 3.7 | Weather Stations layer investigation | 🟢 Complete | | Dataset 190 hidden |
| 3.8 | Barometer formatValue crash | 🟢 Complete | | Coerce to number |
| 3.9 | Save With Filters behavior | 🟢 Complete | | Update vs Save as New View |

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

**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.

**Acceptance Criteria:**
- [ ] Component renders when Dendra layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] **Overview tab is the default/active tab**
- [ ] Overview tab includes prominent "Browse Features →" button to navigate to Browse tab
  - [ ] Button is full-width within sidebar content area
  - [ ] Button uses primary styling: TNC green background (`#2e7d32`), white text
  - [ ] Button minimum height: 44px (accessibility/Fitts's Law)
  - [ ] Button label: "Browse Features →" (arrow inline with text, Unicode U+2192 or SVG)
  - [ ] Placement: bottom of Overview tab content (or top if Overview is minimal < 3 sentences)
  - [ ] Hover state: slight color shift + subtle scale (1.02x)
  - [ ] Focus state: 2px outline for keyboard navigation
  - [ ] Click behavior: navigates to Browse tab with 150-200ms ease-out crossfade transition
- [ ] Component can show sensor list OR sensor detail (drill-down pattern)

**Files to Create:**
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
- [ ] Region dropdown (fires immediately on change)
- [ ] Status dropdown (Active, Maintenance, Inactive) (fires immediately on change)
- [ ] Sensor type filter (if multiple types in same layer) (fires immediately on change)
- [ ] **Time range filter:** "Show sensors with data in:" + date pickers (start/end) (fires on calendar close/blur per field)
- [ ] **No Apply button** — all filters auto-apply (DFT-039)
- [ ] `AbortController` cancels in-flight requests when new filter state arrives
- [ ] Loading feedback per DFT-018 thresholds (stale results with opacity overlay, not blanked)
- [ ] Filter updates sensor list below
- [ ] Filter updates map markers
- [ ] When layer is pinned, current filter state is saved to pinned layer
- [ ] Section header clearly labels scope: "Filter Sensors" (per DFT-038 convention)
- [ ] Result count footer: "Showing X of Y sensors" (updates continuously)

**Sidebar Layout (State A — Layer View):**
```
┌─────────────────────────────────────────────────────┐
│ Dendra Sensors                                     │
│ ─────────────────────────────────────────────────── │
│ Filter Sensors                          [Clear All]│
│ Start: [           ]  End: [           ]           │
│ Region: [All ▼]  Status: [Active ▼]                │
│ ─────────────────────────────────────────────────── │
│ Showing 12 of 38 sensors                           │
│ [📌 Pin Layer]                                     │
└─────────────────────────────────────────────────────┘
```

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

**Design Decision (Feb 2, 2026):** Resolved DFT-004 — This is **State B** (Feature View). The pop-up chart has **slider only** for exploration (direct manipulation). Parametric date pickers live in the sidebar (task 3.6).

**Design Decision (Feb 5, 2026):** Resolved DFT-040 — No collapsed layer filter summary bar. Back button is only Level 2 reference. Feature header merges with filter actions. See design-system.md Dual-Level Filter Pattern.

**Design Decision (Feb 6, 2026):** Resolved DFT-043 — Minimal sidebar at Level 3. Stats appear in pop-up footer (not sidebar). Sidebar contains only: back button, sensor header + actions, filter controls, result count, bookmark button. Rationale: separation of concerns (sidebar = control, pop-up = visualization + metadata), spatial proximity (stats with chart), minimalism, reduced cognitive load. See planning-task-tracker.md DFT-043.

**Acceptance Criteria:**
- [ ] "← Back to Sensors" navigation (returns to State A)
- [ ] **No Level 2 summary bar** — back button is only Level 2 reference (DFT-040)
- [ ] Sensor info header (name, location, status, current reading) with [Clear] and [↩ Undo] actions
- [ ] Time series chart component (in pop-up floating on map)
- [ ] Chart is interactive (hover to see values)
- [ ] **Slider for time navigation** — exploration only, NOT saved
- [ ] Slider state is **ephemeral** — resets when navigating away
- [ ] **NO date pickers in pop-up** — avoids redundant affordances (date pickers are in sidebar)
- [ ] **Stats footer in pop-up** — Min, Max, Avg, Total displayed below chart (DFT-043)
- [ ] "View Full Chart" option for larger view
- [ ] "Download CSV" for current time range (uses sidebar filter, not slider position)

**Pop-up Chart Design (Direct Manipulation for Exploration):**
```
┌─────────────────────────────────────────────────────┐
│ Sensor ABC-123                              [✕]    │
│ ═══════════════════════════════════════════════════│
│ [time-series chart visualization]                  │
│                                                    │
│ ───────────●━━━━━━━━━━━●─────────────────────────── │
│  Mar 1    Mar 10     Mar 20                 Mar 31 │
│                                                    │
│ Currently viewing: Mar 10 – Mar 20                 │
│ (Slider for exploration — not saved)               │
│                                                    │
│ Stats: Min: 12.3° | Max: 28.7° | Avg: 19.2°        │
│ [View Full Chart] [Download CSV]                   │
└─────────────────────────────────────────────────────┘
```

**Key Behavior:**
- Slider changes what's **displayed** in the chart (viewport)
- Slider does NOT change the **saved filter** (that's in sidebar)
- Download CSV uses the sidebar filter range, not the slider position
- This separation follows the **direct manipulation vs. parametric control** principle

**Reference:** Mockup `02d-browse-dendra.html` sensor detail section

**Chart Options:**
- Consider using existing chart library (Chart.js, Recharts, etc.)
- Or reuse from mockup's SVG approach

---

### 3.6: Implement Time Range Filter (Feature-Level, in Sidebar)

**Goal:** Allow user to specify the time range for viewing a sensor's datastream. This is the **parametric control** (specification) that gets saved with bookmarks.

**Design Decision (Feb 2, 2026):** Resolved DFT-004 — This is **State B** (Feature View) in the sidebar. These date pickers are the canonical filter location. The pop-up slider is for exploration only.
**Design Decision (Feb 5, 2026):** Resolved DFT-039 — Auto-apply everywhere. No Apply button. Date range fields fire on calendar close/blur. Aggregation dropdown fires immediately. `AbortController` cancels in-flight requests. Result count updates continuously.
**Design Decision (Feb 5, 2026):** Resolved DFT-040 — Condensed `FeatureDetailCard` layout. No Level 2 summary bar. No separate "Filter Datapoints" header. Filter controls embedded in feature detail card. Back button is only Level 2 reference. See design-system.md Dual-Level Filter Pattern.

**Acceptance Criteria:**
- [ ] Sidebar shows feature filter section when sensor is selected
- [ ] **No Level 2 summary bar** — back button is only Level 2 reference (DFT-040)
- [ ] **No separate "Filter Datapoints" header** — sensor header provides scope (DFT-040)
- [ ] Date range picker (from/to, full-width `col-span-2`) — fires on calendar close/blur per field
- [ ] Aggregation dropdown (`col-span-1`) — fires immediately on change
- [ ] Filter controls use DFT-038 grid layout (`1fr 1fr`, `gap: 8px`)
- [ ] [Clear] and [↩ Undo] in sensor header row (per DFT-031)
- [ ] **No Apply button** — all filters auto-apply (DFT-039)
- [ ] `AbortController` cancels in-flight requests when new filter state arrives
- [ ] Loading feedback per DFT-018 thresholds (stale results with opacity overlay, not blanked)
- [ ] Filter updates chart display (syncs with pop-up)
- [ ] **Inheritance:** Default filter value inherited from layer filter at selection time
- [ ] User can adjust filter independently (expand, narrow, or clear)
- [ ] "Bookmark Sensor" saves sensor with current feature filter
- [ ] Result count footer: "Showing X datapoints" (updates continuously)
- [ ] **Independence:** After bookmark creation, feature filter is independent of layer filter

**Sidebar Layout (State B — Feature View):**
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Sensors                                  │  1. Navigation breadcrumb
├─────────────────────────────────────────────────────┤
│ 🌧️ RS-042 — North Ridge                           │
│ Active • Rain Gauge • 0.2mm        [Clear] [↩]    │  2. Feature identity + actions
│─────────────────────────────────────────────────────│
│ Start: [Mar 1, 2024    ]  End: [Mar 31, 2024  ]   │
│ Aggregation: [Daily ▼]                             │  3. Filter controls
│─────────────────────────────────────────────────────│
│ Showing 31 datapoints                              │  4. Result count
├─────────────────────────────────────────────────────┤
│ [Chart / data view]                                │  5. Results
├─────────────────────────────────────────────────────┤
│ [🔖 Bookmark Sensor]                               │  6. Actions
└─────────────────────────────────────────────────────┘
```

**Interaction Flow:**
1. User selects sensor from list (or clicks on map)
2. Sidebar transitions from State A to State B (progressive disclosure)
3. Feature filter inherits layer filter value (e.g., "2024" → defaults to same range)
4. User can adjust to a specific month (e.g., March 2024)
5. Pop-up chart updates to show March 2024 data
6. User can use pop-up slider to explore within March
7. User clicks "Bookmark Sensor" → saves sensor with "March 2024" filter
8. Bookmark appears in Bookmarked Features widget

**Reference:** Mockup `02d-browse-dendra.html` "Filter Datastream" section

**State Shape (for Level 3 query):**
```typescript
bookmark: {
  featureId: "RS-042",
  featureLabel: "Sensor ABC-123",
  sourceLayer: "dendra-sensors",
  relatedDataQuery: {
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    aggregation: "daily"
  }
}
```

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
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

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
| Feb 17, 2026 | All | **Phase status corrected:** Dendra was implemented but phase doc showed "Not Started". Updated to 🟢 Complete (9/9 core + 3.5a–3.9 fixes). Added Quick Task Summary; task table now reflects completion. See `docs/archive/phase-3-dendra-completed-tasks.md` for archived details. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 3.3, 3.5, 3.6 | Resolved DFT-004: Progressive disclosure + direct/parametric separation. Sidebar edits filters (context-aware State A/B), pop-up has slider only (exploration). Layer and feature filters are independent after bookmark creation. | Will + Claude |
| Feb 4, 2026 | 3.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 5, 2026 | 3.3, 3.6 | Resolved DFT-039: Auto-apply everywhere — removed `[Apply]` buttons from both Layer View (Task 3.3) and Feature View (Task 3.6) ASCII diagrams. All filters fire immediately (dropdowns on change, date fields on calendar close/blur). `AbortController` cancels in-flight requests. Updated section headers and result count footers to match DFT-038 convention | Will + Claude |

