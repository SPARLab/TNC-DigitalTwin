# Phase 11: MOTUS Wildlife Telemetry

**Status:** 🟢 Complete  
**Progress:** 9 / 9 tasks  
**Branch:** `v2/motus`  
**Depends On:** Phase 0 (Foundation); Phase 10 (DroneDeploy) recommended first — shares time-series interaction patterns  
**Owner:** TBD

---

## Task Status

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

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

### Data Blocker — Resolved (Feb 23, 2026)

**Journey reconstruction unblocked via `device_id` linkage.**

The original blocker (0% join coverage between Tag Detections `node_num` and Receiver Stations) was resolved by using **Tag Detections `device_id`** to join to Station Deployments. All detections have `device_id`; detections whose `device_id` matches a known deployment can now be mapped to station coordinates for time-ordered inferred legs. Coverage depends on deployment data (e.g. ~33% of all detections match Dangermond deployments; tags with detections at those stations render full inferred paths). Tasks 11.6 and 11.7 are unblocked.

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the MOTUS wildlife telemetry browse experience in the right sidebar. MOTUS here is automated radio telemetry for tagged animals (birds, bats, and insects), not satellite raster imagery. For Dangermond, this data supports movement analysis, migration timing, and connectivity narratives by species and tagged individual.

### Data Source Status

**Completed in Task 11.1 (Feb 20, 2026):**
- Active ArcGIS service exists at `https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Wildlife_Telemetry/FeatureServer`
- Service contains 3 point layers (`Tagged Animals`, `Station Deployments`, `Receiver Stations`) and 1 table (`Tag Detections`)
- Current volumes: 228 tagged animals, 17 station deployments, 12 receiver stations, 546,499 detection rows
- Key implementation implication: detections table has no geometry; **device_id** (100% populated) joins to Station Deployments for station coordinates — used for time-ordered inferred path legs (Feb 23, 2026)

### Key Characteristics

- **Data Type:** Telemetry observations + metadata (points + detection table), not raster
- **Entities:** Tagged animals, receiver stations, station deployments, detection runs
- **Time Series:** Per-run detection timestamps (`ts_begin`, `ts_end`), UTC
- **Data Quality Signals:** `motus_filter`, `hit_count`, and run-length behavior matter for false-positive handling
- **Path Caveat:** Official Motus docs note web tracks are shortest-path estimates between stations and are not true flight paths
- **Key Value:** Movement timing/connectivity by species and individual tags

### Common MOTUS Data Entities for Conservation

| Entity | ArcGIS Layer/Table | Temporal Coverage | Spatial Coverage | Use Case |
|--------|---------------------|-------------------|------------------|----------|
| Tagged Animals | Layer 0 (`Tagged Animals`) | Per-tag deployment window (`ts_start`, `ts_end`) | Point at deployment location | Species/tag browse, filtering, and deployment context |
| Receiver Stations | Layer 2 (`Receiver Stations`) | Station lifecycle | Point station locations | Network context and station map |
| Station Deployments | Layer 1 (`Station Deployments`) | Deployment start/end | Point (station-level) | Active/terminated periods for receiver configurations |
| Tag Detections | Table 3 (`Tag Detections`) | Run timestamps (`ts_begin`, `ts_end`) | No geometry | Time-series detections and event intensity (`hit_count`) |

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- DFT-015 (pin-only model): MOTUS, like Drone/LiDAR, is pin-only
- Phase 10 (DroneDeploy): shares temporal interaction patterns, playback controls, and map-layer state sync concepts
- Meeting feedback: `docs/PLANNING/feedback/ai-derived-tasks-from-transcripts/digital-catalog-feedback-meeting-jan-15-2026.md` (MOTUS mentioned as "planned" / "coming soon")

## Key Paradigm Notes

- **Row Type:** Tagged animal (or species aggregate) with related detections
- **Pin Model:** Pin species/tag movement views (not single detection points)
- **Save/View Options:** Save species/tag + date-window + quality filter configuration
- **Category Placement:** Species and Animal Movement (cross-list in Monitoring)
- **Browse Pattern:** Select species/tag → select date window + quality settings → render inferred movement lines
- **Shared Patterns with DroneDeploy:** Time-window controls and playback interactions (not raster overlay code paths)

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
- [ ] Floating "Journey playback" widget is visible when a MOTUS view is active on map
- [ ] Time slider/scrubber navigates available detection windows in chronological order
- [ ] Play/Pause animates the detection sequence and updates the map in-place
- [ ] Speed control supports at least 4 speeds (0.5x, 1x, 2x, 4x)
- [ ] Current timestamp label remains visible during scrub and playback
- [ ] Step controls (previous/next detection window) support manual frame-by-frame analysis
- [ ] Playback state is synchronized with selected species/tag/date/quality filters
- [ ] Clear empty-state copy shown when selected filters produce no playable sequence
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

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Treat Phase 11 as telemetry, not satellite raster | Feb 20, 2026 | Live service + official Motus docs confirm this is animal tracking data, not MODIS imagery |
| Use ArcGIS Wildlife Telemetry service as v2 source of truth | Feb 20, 2026 | Existing FeatureServer already hosts relevant layers/tables and volumes are manageable |
| Mark path lines as inferred unless schema is enriched | Feb 20, 2026 | Motus docs explicitly warn tracks are shortest-path estimates; current table lacks explicit station geometry join key |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| Add explicit selected state for species cards in MOTUS Browse (subtle neutral/gray background + stronger border) | Feb 23, 2026 | Improves figure-ground separation and wayfinding between "species list" and "tagged animals results", so users can immediately see which species is active | No (phase-local for now) |
| Arrow/Bird direction marker toggle for Journey playback | Feb 23, 2026 | Arrow: rotating triangle (atan2 bearing); Bird: fixed Lucide bird SVG (black stroke). Bird never rotates; arrow always points in direction of travel. Toggle placed in playback widget header to avoid adding height | No (phase-local) |

---

## Open Questions

- [x] **Do we want to enrich `Tag Detections` with explicit station/deployment join fields for deterministic path rendering?** — **Resolved.** Using existing `device_id` (100% populated) to join detections to Station Deployments; time-ordered inferred legs now render for matching detections (Feb 23, 2026).
- [ ] Should first release prioritize species-level path density, per-tag timelines, or both?
- [x] What default quality thresholds should we enforce (`motus_filter`, minimum `hit_count`)? — **Resolved (Feb 23, 2026):** Default minHitCount=1, minMotusFilter=1 to surface more preserve-linked detections (e.g. single-hit Dangermond detections).
- [x] Should we include off-preserve stations by default, or focus on Dangermond-centric movement context first? — **Resolved (Feb 23, 2026):** v2 defaults to Dangermond-centric interpretation only; do not render movement lines unless preserve-linked station inference exists.
- [x] Do we want animation playback by detection time in v2, or static paths first then animation in v2.1? — **Resolved (Feb 23, 2026):** v2 includes animated journey playback with progressive leg drawing and directional arrowhead.

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 23, 2026 | 11.6 | Added Arrow/Bird direction marker toggle for Journey playback: Arrow mode uses rotating triangle (atan2 bearing); Bird mode uses fixed Lucide bird SVG (black stroke). Toggle placed in playback widget header to keep widget compact | Cursor |
| Feb 23, 2026 | 11.9 | Wired MOTUS Save View flow end-to-end: added `motusFilters` support in `LayerContext`/`PinnedLayer` view models, auto-named MOTUS child views (`{Species} — {Tag or Group} — {Date Window}`), browse-tab hydration from selected Map Layers child view, and detail-panel "Save View to Map Layers" action that pins layer if needed and restores species/tag/date+quality filter state on reselect | Cursor |
| Feb 23, 2026 | 11.8 | Synced MOTUS loading with shared patterns: context loading scopes now cover species/tag/detail + movement/station fetches, Browse switched to shared loading primitives, and Map Layers MOTUS row now shows eye-slot spinner while telemetry/path requests are in flight | Cursor |
| Feb 23, 2026 | 11.7 | Marked complete: first-pass legend (tagged animal, receiver station, inferred legs) in floating map widget; confidence split, detections legend, dynamic updates deferred | Cursor |
| Feb 23, 2026 | 11.3 | Implemented selected species card state: ProductListView now accepts `selectedItemId`; active species card uses `bg-gray-100` + `border-gray-400`; `aria-pressed` for accessibility | Cursor |
| Feb 23, 2026 | 11.6 | Playback auto-framing: when user presses Play, map zooms/pans to frame all journey leg stations (Extent with padding); single-point fallback centers at zoom 10; animated goTo with 900ms ease-in-out | Cursor |
| Feb 23, 2026 | 11.3 (UX polish note) | Documented right-sidebar selected state requirement for species cards: active species should use a subtle gray background (plus stronger border) so current context is visually obvious while browsing tagged animals | Cursor |
| Feb 23, 2026 | 11.3, 11.5 | Preserve eligibility made lifetime-based (all-time Dangermond detection); preserve detections always included in journey rendering regardless of quality filters so journey line connects to Dangermond dot; default minHitCount lowered from 2 to 1 | Cursor |
| Feb 23, 2026 | 11.6 | Journey Playback refinements: progressive leg drawing between stations; single leading-edge arrow (no residual triangles at dots); correct arrow bearing via atan2(dx,dy) for ArcGIS marker rotation | Cursor |
| Feb 23, 2026 | 11.6 | Implemented MOTUS Journey Playback widget as floating map controls (play/pause, step back/forward, speed presets, scrubber, current timestamp, start/latest), and wired map rendering to timeline step state so inferred movement legs animate progressively | Cursor |
| Feb 23, 2026 | 11.5, 11.7 | Updated MOTUS map behavior so green receiver-station dots render persistently whenever MOTUS is active on the map; selecting a preserve-linked tag now adds inferred journey legs on top of this always-visible station context | Cursor |
| Feb 23, 2026 | 11.7 | Moved MOTUS map legend from tagged animal detail panel into a floating map widget (adapter legend slot) so symbology guidance stays visible over the map while exploring journeys | Cursor |
| Feb 23, 2026 | 11.3, 11.5 | Updated MOTUS journey model to "preserve-touch eligibility + full journey rendering": tags/species are eligible only if they have at least one Dangermond preserve detection in the current filter window, but once eligible, map rendering uses all mapped receiver detections for that tag to show full inferred movement context | Cursor |
| Feb 23, 2026 | 11.3, 11.5 | Added strict preserve-interaction gating: Dangermond device IDs now derived from deployments that fall inside the Dangermond preserve boundary polygon; species and tag browse lists now show only tags with preserve-linked detections (>0), preventing non-interacting tags from appearing | Cursor |
| Feb 23, 2026 | 11.5 | Tightened movement inference to preserve-linked `device_id` detections only (removed node-based fallback for map movement), and aligned species/tag detection counts to preserve-linked detections for browse/detail consistency | Cursor |
| Feb 23, 2026 | 11.5, 11.7 | Removed context-only fallback movement lines that could imply flights without preserve-linked detections; updated movement disclaimer copy to preserve-linked language; added first-pass MOTUS map legend in tagged animal detail view (tag marker, receiver station marker, inferred movement leg) | Cursor |
| Feb 23, 2026 | 11.5 | Implemented device_id-based station linkage for MOTUS movement paths; detections join to Station Deployments via device_id (100% populated); time-ordered inferred legs render with medium confidence when both endpoints device-linked; node_num fallback retained. Data blocker resolved; 11.6, 11.7 unblocked | Cursor |
| Feb 20, 2026 | 11.5–11.7 | Documented data blocker: 0% detection-to-station join coverage; journey reconstruction on hold until Dan fixes linkage. Tasks 11.6, 11.7 marked in-progress/on-hold | Codex |
| Feb 20, 2026 | 11.3, 11.4, 11.5 | Implemented MOTUS species/tag browse filters (date + quality), tagged-animal detail panel, and map movement context (receiver station overlay + inferred leg rendering with confidence/disclaimer messaging) | Codex |
| Feb 20, 2026 | 11.2 | Implemented MOTUS sidebar shell + adapter wiring (`motus` data source, registry integration, overview/browse list-detail scaffold, map behavior registration for MOTUS catalog layers) | Codex |
| Feb 20, 2026 | 11.1 | Completed research: confirmed ArcGIS Wildlife Telemetry service, documented schema/counts, and added recommended inferred-path strategy with data-quality caveats | Codex |
| Feb 16, 2026 | — | Created phase document | Will + Claude |
| Feb 16, 2026 | — | Renamed from MODIS to MOTUS | — |
