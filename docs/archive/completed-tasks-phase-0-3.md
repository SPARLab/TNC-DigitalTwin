# Archived Completed Tasks — Phase 0–3

**Archived:** February 16, 2026  
**Purpose:** Reduce clutter in the main task tracker. Use this doc to verify completed work and run manual QA.

---

## Completed Tasks Summary

Tasks below are **done**. Use the Manual Testing Checklist to verify behavior before releases.

### Phase 0: Foundation

| Task | Description |
|------|-------------|
| 0.1–0.7 | App shell, router, sidebars, Map Layers widget, state management |
| 0.4 | Map Container — ArcGIS WebMap integration |
| 0.5 | Drag-and-Drop Reorder — Pinned layers |
| 0.8 | Refine Tree Connectors |
| Task 1 | Map Container — ArcGIS WebMap integration |
| Task 2, 3 | Enable Map Layers Drag Reordering |
| Task 4 | Unify Map Layers Expansion Affordances |
| Task 5 | Prevent Map Layers Widget Scrollbar from Pushing Content |
| Task 6 | Fix Tree Connector Lines Between Parent and Child Rows |
| Task 7 | Remove Gray Divider in Left Sidebar |
| Task 8 | Refine Active Layer → Pinned Layer Transition |
| Task 10 | Left Sidebar: Visual Distinction Between Categories and Layers |
| Task 11 | Right Sidebar: Active Layer Color Coordination & Flash |
| Task 12 | Fix DataOne Datasets Card Width in Left Sidebar |
| Task 14 | Fix Map Layers Widget Drag Animation |
| Task 23 | Data Source Adapter Pattern Refactor |
| DFT-046 | Saved Items widget dropped, unified into Map Layers |

### Phase 1: iNaturalist

| Task | Description |
|------|-------------|
| Task 13 | Fix iNaturalist Layer Icons & Loading |
| Task 14 | Observation Card Click → Map Highlight + Detail View |
| Task 15 | Map Marker Click → Zoom + Detail View |
| Task 16 | Remove Bookmark Button/Action |
| Task 17 | Compact Filter Section (Dropdown) |
| Task 18 | Rename Legend Widget Title |
| Task 19 | Add Observation Search Bar |
| Task 20 | Reduce Pagination to 10 per Page |
| Task 21 | Add Date Range Filter |
| Task 22 | Remember Last Active Tab |
| Task 25 | Sync Filters with Map Layers Widget |
| Task 26 | Dynamic View Names from Filters |
| Task 27 | User-Renamable Filtered Views |
| Task 28 | iNaturalist: Detail View Crash on Observation Click (fixed) |

### Phase 2: ANiML

| Task | Description |
|------|-------------|
| 2.3–2.6 | Multi-dimensional filter system (Species, Cameras) |
| 2.10 | Right Sidebar Scrollbar — Prevent content shift |
| 2.11 | Date/Time Frame Filter |
| 2.12 | Image List — Pagination (Prev/Next Page) |
| 2.13 | Image — Expanded View on Click |
| 2.14 | Expanded View — Arrow Key Navigation |
| 2.7 | Caching Strategy Investigation (marked done) |
| 2.15 | Image Click → Highlight Camera on Map |

### Phase 3: Dendra

| Task | Description |
|------|-------------|
| 3.1–3.4 | Station browse adapter (10 sensor types) |
| 3.5a | Fix: Subsequent datastream clicks don't update chart |
| 3.5b | Fix: Some sensors show 0 data despite record counts |
| 3.5c | Fix: Glassmorphism background not visible |
| 3.6 | Time range filter (Level 3) |
| Task 27 | Save View / Save With Filters — sync with Map Layers |

---

## Manual Testing Checklist

Run these checks before releases or when verifying a layer after changes.

### iNaturalist

- [ ] **Layer activation:** Click iNaturalist in left sidebar → right sidebar shows Overview/Browse tabs
- [ ] **Map markers:** Observations appear on map when layer active
- [ ] **Observation card click:** Click card → detail view opens, map zooms to observation, marker highlighted
- [ ] **Map marker click:** Click marker on map → zooms to observation, detail view opens in sidebar
- [ ] **Filters:** Taxon dropdown, date range, search bar work; results update
- [ ] **Filter sync:** Edit Filters from Map Layers opens Browse with filters applied
- [ ] **View names:** Child view names update from active filters; manual rename persists
- [ ] **Legend:** "iNaturalist Taxa" shows taxa with counts; filter icon toggles visibility

### ANiML (Camera Traps)

- [ ] **Layer activation:** Click Camera Traps → right sidebar shows Overview/Browse
- [ ] **Map markers:** Camera deployments appear on map
- [ ] **Filters:** Species + Cameras FilterSections; Select All/Clear All; date presets
- [ ] **Image list:** Pagination (Prev/Next), page indicator, scrollable list
- [ ] **Image click:** Thumbnail → expanded view with metadata, Back to list
- [ ] **Arrow keys:** Left/right in expanded view; auto-pagination across pages
- [ ] **Image → map highlight:** Click image → camera highlighted on map

### Dendra (Sensor Layers)

- [ ] **Layer activation:** Click any Dendra layer (Barometers, Weather Stations, etc.) → right sidebar shows Overview/Browse
- [ ] **Map markers:** Station points appear on map for active layer only
- [ ] **Station list:** StationCard list in Browse tab; Show active only toggle
- [ ] **Station detail:** Click station → StationDetailView with datastream summaries
- [ ] **Datastream click:** Click datastream card → floating time series chart opens
- [ ] **Chart:** ECharts loads, stats (min/avg/max), date range, aggregation dropdown
- [ ] **Save View / Save With Filters:** Persists to Map Layers; Edit Filters rehydrates

---

## Reference

- **Main tracker:** `docs/development-task-tracker.md`
- **Phase specs:** `docs/01-implementation-plan/phases/`
