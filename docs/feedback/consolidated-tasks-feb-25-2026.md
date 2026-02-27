# Consolidated Feedback Tasks — Feb 25, 2026

**Source:** User feedback (transcript/verbal)  
**Consolidated by:** Will  
**Last Updated:** Feb 26, 2026  
**Status:** Active — Distribution to phase docs complete

> **How to use this document:**  
> The Quick Task Summary below lists all tasks. Each task is distributed to its corresponding phase doc in `docs/IMPLEMENTATION/phases/`. Hand a specific task to a new chat window by referencing its phase doc and task ID.

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| **— Cross-Cutting / Map Behavior —** | | | | |
| CON-FEB25-01 | 🟢 Complete | Feb 25, 2026 | Map marker click zoom behavior: when zoomed in, pan/center only; when zoomed out, pan and zoom in | Implemented across iNaturalist, ANiML, Dendra, DataONE, CalFlora, GBIF. DataONE zoom-out edge case fixed: `useDatasetDetailOrchestrator.ts` was overriding smart zoom with hardcoded `zoom: 16`; replaced with `goToMarkerWithSmartZoom`. |
| CON-FEB25-02 | 🟢 Complete | Feb 25, 2026 | Add thin white outline around all map icons (including emoji map icons) | Implemented as a 3D-only toggle (iNaturalist emoji + ANiML camera symbols). Currently disabled by default; 2D unchanged. |
| CON-FEB25-03 | ⚪ Not Started | Feb 25, 2026 | Collapsable Edit Filters component across all layers | Cam traps (ANiML) should have collapsible Edit Filters section like iNaturalist. Ensure Edit Filters can be collapsed in all data sources. |
| **— Dendra —** | | | | |
| CON-FEB25-04 | 🟢 Complete | Feb 26, 2026 | Dendra layers load too slow — review query patterns | Query alignment, on-demand per-station summaries, loading UI polish, progressive time-series loading. See phase-3-dendra.md. |
| **— TNC ArcGIS / Left Sidebar —** | | | | |
| CON-FEB25-05 | 🟢 Complete | Feb 27, 2026 | Visually differentiate category, subcategory, and feature service in left sidebar | Tiered backgrounds, Service→Group rename, header-only hover, layer row hover border. Polish: right-edge divider as structural layer; only hovered rows overlay divider (z-index stacking). |
| **— ANiML —** | | | | |
| CON-FEB25-07 | 🟢 Complete | Feb 27, 2026 | ANiML camera trap coordinates misaligned on 3D map | ArcGIS MapServer returns NAD27 (EPSG:4267); client treated as WGS84. Added outSR=4326 to deployment query for server-side reprojection. Fixes ~89m eastward displacement. Remaining per-camera offsets from low-precision GPS in source data (8/47 cameras). |
| **— Performance —** | | | | |
| CON-FEB25-06 | ⚪ Not Started | Feb 25, 2026 | Analyze code for performance bottlenecks — low FPS in 3D view with iNaturalist | Scan for performance degradation. User reports decreased frame rate when rendering iNaturalist observations; sometimes tolerable but could be quicker/smoother. |
| CON-FEB25-08 | 🟢 Complete | Feb 27, 2026 | Restore right padding for left sidebar layer cards | Regression fix: layer cards had pr-0 and touched sidebar edge; restored pr-1 in CategoryGroup, ServiceGroup so cards sit a few pixels from edge. |

---

## Task Details

### CON-FEB25-01 — Map Marker Click: Zoom vs Pan Based on Current Zoom Level

**Source:** User feedback (verbal)  
**Priority:** Medium–High  
**Data Source:** All map markers (iNaturalist, ANiML, Dendra, DataONE, TNC ArcGIS, etc.)

**Problem:** When clicking an observation/marker while already zoomed in, the camera zooms the user out. This is disorienting.

**Desired behavior:**
- **Zoomed out** (e.g., level 2): Clicking a marker → pan and zoom in to the marker (current behavior is correct).
- **Zoomed in** (past default, e.g., past level 5): Clicking a marker → pan and center the marker only; do NOT zoom in further.

**Implementation notes:**
- Define a "default zoom on select" level (e.g., 5). If current zoom is already at or past that level, only pan/center. Otherwise, zoom in to that level.
- Apply consistently across all data sources that have map marker click → goTo behavior.

---

### CON-FEB25-02 — White Outline on Map Icons

**Source:** User feedback (verbal)  
**Priority:** Medium  
**Data Source:** All map icons (including emoji map icons)

**Problem:** Some map icons are hard to see against the map background.

**Desired behavior:** Add a thin white outline (stroke) around all map icons to improve visibility across varying map backgrounds.

---

### CON-FEB25-03 — Collapsable Edit Filters Across All Layers

**Source:** User feedback (verbal)  
**Priority:** Medium  
**Data Source:** All layers with Edit Filters (ANiML/Cam Traps, Dendra, DataONE, etc.)

**Problem:** iNaturalist has a collapsible Edit Filters section; cam traps (ANiML) and other layers do not. User should be able to collapse the entire Edit Filters section in all layers.

**Desired behavior:** Edit Filters component should be collapsible in all data sources, matching the iNaturalist pattern (CON-INAT-07).

**Completed (Feb 26, 2026):** Applied `collapsible defaultExpanded` to EditFiltersCard in ANiML, Dendra, DataONE, GBIF, CalFlora browse tabs. iNaturalist already had it. See `docs/IMPLEMENTATION/phases/phase-7-polish.md` CON-FEB25-03.

---

### CON-FEB25-04 — Dendra Loads Too Slow (Query Pattern Review)

**Source:** User feedback (verbal); Dan to send document  
**Priority:** High  
**Data Source:** Dendra

**Problem:** Dendra layers take too long to load.

**Desired behavior:** Review the document Dan will send and ensure we're using the correct query patterns for Dendra layer loading. Optimize queries if needed.

**Completed (Feb 26, 2026):** Aligned with coworker brief. Implemented: query alignment (server-side date windows, lean outFields), on-demand per-station summaries, loading UI polish, progressive time-series loading (30-day initial + 120-day backfill chunks). See `docs/IMPLEMENTATION/phases/phase-3-dendra.md` CON-FEB25-04 Investigation Notes.

---

### CON-FEB25-05 — Visually Differentiate Category, Subcategory, Feature Service in Left Sidebar

**Source:** User feedback (verbal)  
**Priority:** Medium–High  
**Data Source:** Left sidebar (TNC ArcGIS, Data Catalog)

**Problem:** The styling for a category dropdown is the same as subcategory or feature service. Users cannot quickly distinguish between:
1. **Category** (top-level grouping)
2. **Subcategory** (nested grouping)
3. **Feature service** (group of layers)

**Desired behavior:** Apply distinct visual treatment (typography, indentation, badges, icons, or color) so users can scan and understand the hierarchy at a glance.

---

### CON-FEB25-06 — Performance Bottleneck Analysis (Low FPS in 3D View)

**Source:** User feedback (verbal)  
**Priority:** Medium  
**Data Source:** Cross-cutting (3D view, iNaturalist observations)

**Problem:** User notices decreased frame rate when rendering iNaturalist observations in the 3D view. Usually tolerable but sometimes could be quicker or smoother.

**Desired behavior:** Scan the codebase for performance bottlenecks. Identify and document potential causes (e.g., excessive re-renders, heavy graphics, inefficient queries, lack of virtualization). Recommend or implement fixes where feasible.

---

### CON-FEB25-07 — ANiML Camera Trap Coordinate Desynchronization

**Source:** User feedback (verbal)  
**Priority:** High  
**Data Source:** ANiML camera traps (3D map)

**Problem:** Camera trap markers appeared mispositioned on the 3D terrain—e.g., a beach camera drawn in the ocean or on a hillside when the trap photo showed a beach scene.

**Root cause:** ArcGIS MapServer at `dangermondpreserve-spatial.com` stores deployment geometries in **NAD27 (EPSG:4267)**. The client code treated returned `x`/`y` as WGS84 (EPSG:4326), causing a ~89m systematic eastward displacement of all camera markers.

**Fix:** Added `outSR: '4326'` to the deployment query in `animlService.ts` so the server reprojects coordinates to WGS84 before returning them.

**Discovery:** 8 of 47 cameras have low-precision GPS coordinates in the source data (4 or fewer decimal places = ~11m+ accuracy). Remaining per-camera offsets are data-quality limitations, not code bugs.

**Completed (Feb 27, 2026):** See `docs/IMPLEMENTATION/phases/phase-2-animl.md` ANIML-DEV-02.

---

## Phase Distribution

| Task ID | Phase Doc | Notes |
|---------|-----------|-------|
| CON-FEB25-01 | phase-7-polish.md | Cross-cutting map behavior; shared goTo logic |
| CON-FEB25-07 | phase-2-animl.md | ANiML deployment query outSR fix |
| CON-FEB25-02 | phase-7-polish.md | Cross-cutting map icon styling |
| CON-FEB25-03 | phase-7-polish.md | Cross-cutting Edit Filters consistency |
| CON-FEB25-04 | phase-3-dendra.md | Dendra-specific query optimization |
| CON-FEB25-05 | phase-6-tnc-arcgis.md | Left sidebar hierarchy styling |
| CON-FEB25-06 | phase-7-polish.md | Performance audit (extends 7.6) |
| CON-FEB25-07 | phase-2-animl.md | ANiML deployment query outSR=4326 |
| CON-FEB25-08 | phase-7-polish.md | Left sidebar layer card right padding |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 27, 2026 | CON-FEB25-08 complete. Restored right padding (pr-1) for left sidebar layer cards. Regression fix: CategoryGroup and ServiceGroup wrappers had pr-0; cards now sit a few pixels from sidebar edge. | Cursor |
| Feb 27, 2026 | CON-FEB25-07 complete. ANiML camera trap coordinate fix: outSR=4326 in deployment query reprojects NAD27→WGS84, correcting ~89m eastward displacement. | Cursor |
| Feb 26, 2026 | CON-FEB25-03 complete. Collapsable Edit Filters applied to ANiML, Dendra, DataONE, GBIF, CalFlora. | Cursor |
| Feb 27, 2026 | CON-FEB25-05 polish: Right-edge divider as absolute layer (z-10); only hovered category/subcategory/group rows overlay it (hover:z-[20]). LeftSidebar, CategoryGroup, ServiceGroup. | Cursor |
| Feb 26, 2026 | CON-FEB25-05: Left sidebar hierarchy styling complete. Tiered backgrounds, Service→Group rename, header-only hover (bg+border), layer row hover border. | Cursor |
| Feb 26, 2026 | CON-FEB25-04: progressive time-series loading (30-day initial, 120-day backfill); top badge shows loading/range status; footer simplified. | Cursor |
| Feb 25, 2026 | CON-FEB25-04 marked complete. Query alignment, on-demand per-station summaries, loading UI polish. | Cursor |
| Feb 25, 2026 | Created consolidated feedback document with 6 tasks; distributed to phase docs; master-plan phase counts updated | Will |
| Feb 25, 2026 | CON-FEB25-01 marked complete. Root cause: useDatasetDetailOrchestrator hardcoded zoom: 16; fixed with goToMarkerWithSmartZoom | Will + Claude |
| Feb 25, 2026 | CON-FEB25-02 marked complete. 3D-only thin white halo added to iNaturalist emoji markers and ANiML camera symbols; 2D unchanged | Codex |
| Feb 25, 2026 | CON-FEB25-02 default changed: halo now disabled by default and retained behind a single toggle for quick re-enable | Codex |
