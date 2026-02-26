# Phase 11: MOTUS Wildlife Telemetry

**Status:** 🟢 Complete  
**Progress:** 9 / 9 tasks (completed tasks archived)  
**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-11-motus-completed.md`  
**Branch:** `v2/motus`  
**Depends On:** Phase 0 (Foundation); Phase 10 (DroneDeploy) recommended first — shares time-series interaction patterns  
**Owner:** TBD

---

## Quick Task Summary

*Completed tasks (11.1–11.9) archived. See `docs/archive/phases/phase-11-motus-completed.md`.*

**Archived completed tasks:** `11.1`, `11.2`, `11.3`, `11.4`, `11.5`, `11.6`, `11.7`, `11.8`, and `11.9` moved to `docs/archive/phases/phase-11-motus-completed.md` on Feb 25, 2026.

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

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
- Archived MOTUS task details: `docs/archive/phases/phase-11-motus-completed.md`
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

*Completed task details (11.1–11.9) archived. See `docs/archive/phases/phase-11-motus-completed.md`.*

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
| Feb 25, 2026 | — | **Archived** completed tasks (11.1–11.9) to `docs/archive/phases/phase-11-motus-completed.md`. Phase doc trimmed. | — |
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
