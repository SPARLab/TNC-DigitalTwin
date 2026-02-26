# Phase 11: MOTUS Wildlife Telemetry — Archived Completed Tasks

**Archived:** Feb 25, 2026  
**Purpose:** Archive of completed Phase 11 MOTUS tasks (11.1–11.9). Full details preserved for reference.  
**Source:** `docs/IMPLEMENTATION/phases/phase-11-motus.md`

---

## Quick Task Summary (Archived)

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 11.1 | 🟢 Complete | Feb 20, 2026 | Research MOTUS data availability and service endpoints | Confirmed active ArcGIS FeatureServer (`Dangermond_Preserve_Wildlife_Telemetry`) and documented schema/limits for path rendering |
| 11.2 | 🟢 Complete | Feb 20, 2026 | Create MOTUS right sidebar shell | Added MOTUS adapter + sidebar shell components (Overview/Browse, list/detail shell) and registry wiring |
| 11.3 | 🟢 Complete | Feb 23, 2026 | Implement species/tag browse + date window UI | Added live species/tag browse with date window, quality controls (`motus_filter`, `hit_count`), latest-window action, seasonal presets, direct load-on-map flow; **selected species card state** (gray bg + stronger border) for wayfinding |
| 11.4 | 🟢 Complete | Feb 20, 2026 | Implement tagged animal detail view | Added tag detail metadata, deployment + detection windows, quality summary, attribution, methodology links, and load/remove map action |
| 11.5 | 🟢 Complete | Feb 23, 2026 | Render MOTUS movement context on map | Added explicit MOTUS map layer + graphics overlay for receiver stations and inferred legs; **device_id linkage** (Feb 23) enables time-ordered station-to-station paths for detections matching known deployments; v2 now uses **Dangermond preserve-linked (`device_id`) detections only** for movement rendering; **context-only fallback lines removed** so no movement lines render unless preserve-linked station inference exists |
| 11.6 | 🟢 Complete | Feb 23, 2026 | Implement Journey playback widget (temporal navigation / playback) | Floating map playback widget (scrubber, play/pause, step, speed, start/latest); progressive leg drawing between stations; **Arrow/Bird direction marker toggle** — Arrow mode: rotating triangle (atan2 bearing); Bird mode: fixed Lucide bird SVG (black stroke); toggle in header to keep widget compact; **playback auto-framing** — map zooms/pans to journey station extent when Play is pressed |
| 11.7 | 🟢 Complete | Feb 23, 2026 | Implement legend and symbology controls | First-pass in-sidebar legend for tagged animal marker, receiver station marker, and inferred movement legs; moved to floating map widget (adapter legend slot). Deferred: confidence split, detections-specific legend, dynamic updates |
| 11.8 | 🟢 Complete | Feb 23, 2026 | Sync loading indicators | MOTUS loading now flows through shared adapter status: Map Layers eye-slot spinner tracks telemetry/path fetches and Browse uses shared loading primitives (`InlineLoadingRow`, `RefreshLoadingRow`) for species/tag/detail queries |
| 11.9 | 🟢 Complete | Feb 23, 2026 | Wire Save View flow | MOTUS views now persist in Map Layers as child views with auto-name format `{Species} — {Tag or Group} — {Date Window}`; saved views restore species/tag/date + quality filters and pin MOTUS layer when needed |

---

## Data Blocker — Resolved (Feb 23, 2026)

**Journey reconstruction unblocked via `device_id` linkage.**

The original blocker (0% join coverage between Tag Detections `node_num` and Receiver Stations) was resolved by using **Tag Detections `device_id`** to join to Station Deployments. All detections have `device_id`; detections whose `device_id` matches a known deployment can now be mapped to station coordinates for time-ordered inferred legs. Coverage depends on deployment data (e.g. ~33% of all detections match Dangermond deployments; tags with detections at those stations render full inferred paths). Tasks 11.6 and 11.7 are unblocked.

---

## Task Details

### 11.1: Research MOTUS Data Availability and Service Endpoints

**Goal:** This is the critical path task. Determine how MOTUS data is or will be served for the digital catalog.

**Acceptance Criteria:**
- [x] Check `dangermondpreserve-spatial.com` for any existing MOTUS layers/services
- [x] Document active ArcGIS service URL, layers/tables, record counts, and key fields
- [x] Validate data-model assumptions against Motus official docs (processing + filters + path caveats)
- [x] Identify whether direct path geometry exists (it currently does not)
- [x] Recommend v2 service approach for movement rendering
- [x] Record risks/blockers and required enrichment for high-confidence paths

**Questions Answered:**
- Yes, MOTUS telemetry is already hosted in ArcGIS (`Dangermond_Preserve_Wildlife_Telemetry`)
- Time-series is served as timestamped detection runs in a table (`ts_begin`, `ts_end`)
- Volume is substantial but manageable with scoped queries (546k detections; max record count 2000/page)
- Current schema does not support exact inter-station path drawing without inference/enrichment
- ArcGIS-hosted Dangermond service should be source-of-truth for v2 UI

**Output:** Add findings to "Service Analysis" section below.

---

### 11.2: Create MOTUS Right Sidebar Shell

**Goal:** Set up the component structure for MOTUS browse experience.

**Acceptance Criteria:**
- [x] MOTUS adapter registered in v2 data source registry
- [x] Component renders when MOTUS layer is selected
- [x] Tabs: Overview | Browse (no Export tab initially)
- [x] Overview tab: available products summary, temporal range, "Browse Species & Tags →" button
- [x] Component can show product list OR product detail (drill-down)

**Implementation (Feb 20, 2026):** Adapter + registry wiring; `motus` data source detection for Wildlife_Telemetry in catalog; Overview/Browse tabs with static species list and detail drill-down. Map behavior registers MOTUS catalog layers via TNC ArcGIS layer factory.

**Files Created:**
- `src/v2/dataSources/motus/adapter.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSSidebar.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSBrowseTab.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSOverviewTab.tsx`
- `src/v2/components/RightSidebar/MOTUS/ProductListView.tsx`
- `src/v2/components/RightSidebar/MOTUS/ProductDetailView.tsx`

---

### 11.3: Implement Species/Tag Browse + Date Window UI

**Goal:** Browse MOTUS telemetry by species and tag with temporal controls.

**Acceptance Criteria:**
- [x] Species cards/list: species name, tracked tag count, detection count summary
- [x] Species selection → reveal tagged animals for that species
- [x] Date range picker for detection window (`ts_begin` / `ts_end`)
- [x] Quality filter controls (`motus_filter`, minimum `hit_count`)
- [x] "Latest available" quick action
- [x] Seasonal presets (optional): migration windows by month range
- [x] "Load on Map" button from browse (no drill-down required)

---

### 11.4: Implement Tagged Animal Detail View

**Goal:** Show detailed information about a specific tagged animal and its detections.

**Acceptance Criteria:**
- [x] "← Back to Species" navigation
- [x] Species name + scientific name + tag ID / deploy ID
- [x] Deployment location and deployment window (`ts_start` → `ts_end`)
- [x] Detection window summary (`ts_begin` min/max in selected range)
- [x] Detection quality summary (`motus_filter` mix, `hit_count` distribution)
- [x] Currently selected date window and "Change Window" action
- [x] "Load on Map" / "Remove from Map" toggle
- [x] Confidence messaging shown when rendering inferred paths
- [x] Data source attribution (Motus Wildlife Tracking System / Birds Canada / TNC)
- [x] External links to Motus methodology docs

---

### 11.5: Render MOTUS Movement Context on Map

**Goal:** Render station context + inferred movement lines for selected species/tags.

**Acceptance Criteria:**
- [x] Create `motusLayer.ts` using ArcGIS `FeatureLayer` + optional client `GraphicsLayer` for inferred paths
- [x] Load station and tagged-animal context for selected filters
- [x] Build inferred path legs only when source/destination inference is valid from current schema
- [x] Display clear "inferred path" disclaimer in map/UI
- [x] Handle large detection table via paged querying and scoped date filters
- [x] Add to `IMPLEMENTED_LAYERS` registry

---

### 11.6: Implement Temporal Navigation / Playback

**Goal:** Navigate through telemetry detections over time. This is the core value proposition for MOTUS.

**Journey Playback Widget (MVP):**
- Place a floating "Journey playback" widget over the map (similar interaction footprint to other map widgets)
- Controls:
  - Play/Pause
  - Step Back / Step Forward
  - Speed (0.5x, 1x, 2x, 4x)
  - Timeline scrubber with current timestamp label
  - "Jump to start" / "Jump to latest"
- Scope to currently active MOTUS selection (species + tag + date window + quality filters)
- Preserve-focused defaults: only animate preserve-linked detections already validated by `device_id` join logic

**Acceptance Criteria:**
- [x] Floating "Journey playback" widget is visible when a MOTUS view is active on map
- [x] Time slider/scrubber navigates available detection windows in chronological order
- [x] Play/Pause animates the detection sequence and updates the map in-place
- [x] Speed control supports at least 4 speeds (0.5x, 1x, 2x, 4x)
- [x] Current timestamp label remains visible during scrub and playback
- [x] Step controls (previous/next detection window) support manual frame-by-frame analysis
- [x] Playback state is synchronized with selected species/tag/date/quality filters
- [x] Clear empty-state copy shown when selected filters produce no playable sequence
- [ ] Optional: "Compare two windows" split-view (reuse shared temporal components if built)

**Reference:** ArcGIS TimeSlider widget, shared temporal patterns from DroneDeploy

**Note:** This is where shared temporal interaction components from DroneDeploy (Phase 10) can be reused without sharing raster-specific rendering code.

---

### 11.7: Implement Legend and Symbology Controls

**Goal:** MOTUS movement views need clear symbology so inferred paths and confidence are interpretable.

**Acceptance Criteria:**
- [x] Legend for station points, deployment points, detections, and inferred path legs
- [ ] Confidence legend (high-confidence vs inferred/low-confidence segments) — deferred
- [ ] Legend auto-updates when species/tag filters change — deferred
- [ ] Optional: color by species or by recency — deferred
- [x] Legend position: floating widget or within right sidebar (floating map widget via adapter legend slot)
- [x] Accessible: values labeled, contrast sufficient

**Implementation (Feb 23, 2026):** First-pass legend shows tagged animal marker, receiver station marker, and inferred movement legs. Legend moved from tagged animal detail panel into floating map widget so symbology stays visible over the map while exploring journeys. Confidence split, detections-specific legend, and dynamic filter-driven updates deferred to future iteration.

---

### 11.8: Sync Loading Indicators

**Goal:** Loading indicators for telemetry query + path rendering.

**Acceptance Criteria:**
- [x] MOTUS adapter exposes `loading` via registry
- [x] Map Layers widget shows spinner while detections/paths load
- [x] Right sidebar shows loading state during species/tag queries
- [x] Uses shared loading primitives

---

### 11.9: Wire Save View Flow

**Goal:** Save MOTUS species/tag/date configurations to Map Layers.

**Acceptance Criteria:**
- [x] Pin creates a MOTUS parent layer in Map Layers
- [x] Saved views encode species/tag + date window + quality filters
- [x] Selecting a saved view restores species/tag and time window
- [x] Auto-naming: "{Species} — {Tag or Group} — {Date Window}"
- [x] Follows shared child-view conventions from `LayerContext`

---

## Service Analysis

> Completed during Task 11.1

### Data Source (Confirmed)
- ArcGIS service URL: `https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Wildlife_Telemetry/FeatureServer`
- Service item id: `2ebff467411b4810887d6a6261ed44ef`
- Geometry model: all map layers are points; detections are in a non-spatial table
- External Motus reference: `https://docs.motus.org/en/about-motus/how-data-are-processed`

### Available Layers/Tables
| Entity | Service Type | Temporal Range | Geometry | Notes |
|--------|--------------|----------------|----------|-------|
| Tagged Animals (id=0) | Feature Layer | `ts_start` / `ts_end` per tag | Point | 228 records; species and deployment metadata |
| Station Deployments (id=1) | Feature Layer | `ts_start` / `ts_end` per deployment | Point | 17 records; includes status and receiver/device fields |
| Receiver Stations (id=2) | Feature Layer | Station lifecycle | Point | 12 records; station identity/location |
| Tag Detections (id=3) | Table | `ts_begin` / `ts_end` per run | None | 546,499 records; includes `tag_id`, `device_id`, `run_id`, `hit_count`, `motus_filter`, `antenna` — **device_id** used for station linkage (Feb 23) |

### Query/Loading Performance
| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Service metadata (`FeatureServer?f=pjson`) | < 1s | Includes counts and schema entry points |
| Sample tag query (layer 0, 5 rows) | < 1s | Returned quickly with `exceededTransferLimit=true` |
| Sample detections query (table 3, 5 rows) | < 1s | Fast but paged; high-cardinality table |
| Detections count query | < 1s | 546,499 total rows |

### Flight Path Rendering Strategy (Recommended)

1. **v2 baseline (now): inferred movement legs from available fields**
   - Render station points and tagged-animal deployment points first.
   - For each selected tag/species, query detections in date window and aggregate by `tag_id` and time buckets.
   - Draw **inferred geodesic legs** only when source/destination can be justified from available metadata (label as inferred, not true path).

2. **Quality-first filtering**
   - Default to detections with higher-confidence criteria (exclude or visually de-emphasize `motus_filter == 0` runs).
   - Use `hit_count` thresholds to reduce noisy one-hit runs in map view.

3. **Required enrichment for robust per-animal path lines**
   - Add explicit station/deployment join fields in detections output (e.g., `station_id` or `recv_deploy_id`).
   - Optionally precompute path segments server-side so frontend can consume ready-to-draw polylines.

4. **UX copy requirement**
   - Include a visible caveat matching Motus guidance: displayed tracks are shortest-path estimates, not exact flight routes.
