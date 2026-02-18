# Phase 3: Dendra Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 0 / 0 tasks (completed tasks 3.1–3.9 archived Feb 18, 2026)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-3-dendra-completed.md`  
**Branch:** `v2/dendra`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 18, 2026

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| *Add new tasks below* | | | | |

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
| *Add new tasks below* | | | | |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

*Completed tasks 3.1–3.9 archived. See `docs/archive/phases/phase-3-dendra-completed.md` for full acceptance criteria and implementation notes.*

*Add new task details below as you define them.*

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
| Feb 18, 2026 | All | **Archived completed tasks:** Moved tasks 3.1–3.9 (including 3.5a–3.9 fixes) to `docs/archive/phases/phase-3-dendra-completed.md`. Phase doc cleared for new tasks. Status → In Progress. | Claude |
| Feb 17, 2026 | All | **Phase status corrected:** Dendra was implemented but phase doc showed "Not Started". Updated to 🟢 Complete (9/9 core + 3.5a–3.9 fixes). Added Quick Task Summary; task table now reflects completion. See `docs/archive/phases/phase-3-dendra-completed.md` for archived details. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 3.3, 3.5, 3.6 | Resolved DFT-004: Progressive disclosure + direct/parametric separation. Sidebar edits filters (context-aware State A/B), pop-up has slider only (exploration). Layer and feature filters are independent after bookmark creation. | Will + Claude |
| Feb 4, 2026 | 3.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 5, 2026 | 3.3, 3.6 | Resolved DFT-039: Auto-apply everywhere — removed `[Apply]` buttons from both Layer View (Task 3.3) and Feature View (Task 3.6) ASCII diagrams. All filters fire immediately (dropdowns on change, date fields on calendar close/blur). `AbortController` cancels in-flight requests. Updated section headers and result count footers to match DFT-038 convention | Will + Claude |

