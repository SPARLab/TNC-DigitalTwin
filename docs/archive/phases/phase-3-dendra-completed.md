# Phase 3: Dendra — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 3 tasks. Add new completions here with timestamp.

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 3.1–3.4 | ✅ | Feb 12, 2026 | Station browse adapter (10 sensor types) | Service, context, map layer, sidebar |
| 3.5a–3.5c | ✅ | Feb 13, 2026 | Floating time series chart (fixes + polish) | Race condition, 0-data, glassmorphism |
| 3.6 | ✅ | Feb 13, 2026 | Time range filter (Level 3) | Date picker, aggregation |
| 3.7 | ✅ | Feb 16, 2026 | Weather Stations layer — Investigation | Backend: is_visible=0 for dataset-190 |
| 3.8 | ✅ | Feb 16, 2026 | Barometer datastream formatValue crash | Coerce to number, handle NaN |
| 3.9 | ✅ | Feb 16, 2026 | Save With Filters — distinct behavior | Update Current View / Save as New View |
| Task 27 | ✅ | Feb 13, 2026 | Save View / Save With Filters — sync with Map Layers | |

---

## Task Details

### 3.1–3.4: Station Browse Adapter

**Goal:** Full adapter for 10 per-type Dendra sensor services (Weather Stations, Barometers, Rain Gauges, etc.). Service layer, context, map behavior, sidebar (Overview/Browse), StationCard list, StationDetailView with datastream summaries.

**Implementation:** dendraStationService.ts, DendraContext (per-service cache), dendraLayer.ts, useMapBehavior. Map markers show only active layer's stations. Fixes: buildServiceUrl (no double path), elevation null/NaN handling, layer-switch graphics clearing.

### 3.5a–3.5c: Floating Time Series Chart (Fixes + Polish)

**3.5a:** Race condition — stale fetch overwrote newer datastream's data. Fix: request-counter guard in openChart. Stale ECharts instance — chart div remounts but old instance pointed to removed DOM. Fix: getDom() check before init.

**3.5b:** Some sensors showed 0 data despite record counts. Root cause: null-heavy datapoint windows. Fix: query fetches most recent non-null points (`value IS NOT NULL`, DESC + reverse to ASC).

**3.5c:** Glassmorphism background not visible. Fix: visible glassmorphism, bottom-right placement, half-height panel, stronger contrast, larger axis labels/slider, darker header.

### 3.6: Time Range Filter (Level 3)

**Goal:** Date range picker, aggregation dropdown. Filter updates chart. "Save View" / "Save With Filters" persist to Map Layers.

**Implementation:** Date picker (from/to), aggregation (hourly, daily, weekly). DendraViewFilters type. syncDendraFilters() in LayerContext. One-shot hydration in DendraBrowseTab when switching child views or Edit Filters.

### 3.7: Weather Stations Layer — Investigation

**Goal:** Resolve "not implemented" or wrong layer behavior for Weather Stations.

**Implementation:** Two Weather Stations layers in catalog — dataset-183 (Dendra, working) and dataset-190 (legacy v0). Backend fix: Dan set `is_visible: 0` for dataset-190 in Data Catalog FeatureServer.

### 3.8: Barometer Datastream formatValue Crash

**Goal:** Fix crash when viewing barometer datastream stats.

**Implementation:** ArcGIS returned min/max/avg as strings; `formatValue` threw `value.toFixed is not a function`. Fix: coerce to number, handle NaN in dendraStationService.ts.

### 3.9: Save With Filters — Distinct Behavior

**Goal:** Clearer labels and distinct actions for station-level sync vs. creating new filtered view.

**Implementation:** "Update Current View" (station-level sync). "Save as New View" (creates filtered child view in Map Layers, activates it). createDendraFilteredView() in LayerContext. Files: StationDetailView.tsx, LayerContext.tsx.

### Task 27: Save View / Save With Filters — Sync with Map Layers

**Goal:** Replace bookmark terminology. Right-sidebar filter state persists to Map Layers pinned layer/child views. Dendra uses explicit save (not auto-save) per Level 3 complexity.

**Implementation:** DendraViewFilters type. syncDendraFilters(). One-shot hydration when switching child views or Edit Filters. iNaturalist already had auto-save.

---

## Manual Testing Checklist

- [ ] **Layer activation:** Click any Dendra layer → right sidebar shows Overview/Browse
- [ ] **Map markers:** Station points appear on map for active layer only
- [ ] **Station list:** StationCard list in Browse tab; Show active only toggle
- [ ] **Station detail:** Click station → StationDetailView with datastream summaries
- [ ] **Datastream click:** Click datastream card → floating time series chart opens
- [ ] **Chart:** ECharts loads, stats (min/avg/max), date range, aggregation dropdown
- [ ] **Save View / Save With Filters:** Persists to Map Layers; Edit Filters rehydrates

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-3-dendra.md`
- **Detailed task notes:** `docs/archive/phase-3-dendra-completed-tasks.md` (extended descriptions)
- **Master plan:** `docs/master-plan.md`
