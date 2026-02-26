# Consolidated Feedback Tasks — Feb 25, 2026

**Source:** User feedback (transcript/verbal)  
**Consolidated by:** Will  
**Last Updated:** Feb 25, 2026  
**Status:** Active — Distribution to phase docs complete

> **How to use this document:**  
> The Quick Task Summary below lists all tasks. Each task is distributed to its corresponding phase doc in `docs/IMPLEMENTATION/phases/`. Hand a specific task to a new chat window by referencing its phase doc and task ID.

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| **— Cross-Cutting / Map Behavior —** | | | | |
| CON-FEB25-01 | 🟢 Complete | Feb 25, 2026 | Map marker click zoom behavior: when zoomed in, pan/center only; when zoomed out, pan and zoom in | Implemented across iNaturalist, ANiML, Dendra, DataONE, CalFlora, GBIF. DataONE zoom-out edge case fixed: `useDatasetDetailOrchestrator.ts` was overriding smart zoom with hardcoded `zoom: 16`; replaced with `goToMarkerWithSmartZoom`. |
| CON-FEB25-02 | ⚪ Not Started | Feb 25, 2026 | Add thin white outline around all map icons (including emoji map icons) | Some icons are hard to see against the map background. Improves visibility across all layers. |
| CON-FEB25-03 | ⚪ Not Started | Feb 25, 2026 | Collapsable Edit Filters component across all layers | Cam traps (ANiML) should have collapsible Edit Filters section like iNaturalist. Ensure Edit Filters can be collapsed in all data sources. |
| **— Dendra —** | | | | |
| CON-FEB25-04 | ⚪ Not Started | Feb 25, 2026 | Dendra layers load too slow — review query patterns | Dan will send a document. Review and ensure we're using the right query patterns for Dendra layer loading. |
| **— TNC ArcGIS / Left Sidebar —** | | | | |
| CON-FEB25-05 | ⚪ Not Started | Feb 25, 2026 | Visually differentiate category, subcategory, and feature service in left sidebar | Category dropdown styling is same as subcategory or feature service. Need distinct visual treatment for: (1) category, (2) subcategory, (3) feature service group. |
| **— Performance —** | | | | |
| CON-FEB25-06 | ⚪ Not Started | Feb 25, 2026 | Analyze code for performance bottlenecks — low FPS in 3D view with iNaturalist | Scan for performance degradation. User reports decreased frame rate when rendering iNaturalist observations; sometimes tolerable but could be quicker/smoother. |

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

---

### CON-FEB25-04 — Dendra Loads Too Slow (Query Pattern Review)

**Source:** User feedback (verbal); Dan to send document  
**Priority:** High  
**Data Source:** Dendra

**Problem:** Dendra layers take too long to load.

**Desired behavior:** Review the document Dan will send and ensure we're using the correct query patterns for Dendra layer loading. Optimize queries if needed.

**Blocked by:** Awaiting document from Dan.

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

## Phase Distribution

| Task ID | Phase Doc | Notes |
|---------|-----------|-------|
| CON-FEB25-01 | phase-7-polish.md | Cross-cutting map behavior; shared goTo logic |
| CON-FEB25-02 | phase-7-polish.md | Cross-cutting map icon styling |
| CON-FEB25-03 | phase-7-polish.md | Cross-cutting Edit Filters consistency |
| CON-FEB25-04 | phase-3-dendra.md | Dendra-specific query optimization |
| CON-FEB25-05 | phase-6-tnc-arcgis.md | Left sidebar hierarchy styling |
| CON-FEB25-06 | phase-7-polish.md | Performance audit (extends 7.6) |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 25, 2026 | Created consolidated feedback document with 6 tasks; distributed to phase docs; master-plan phase counts updated | Will |
| Feb 25, 2026 | CON-FEB25-01 marked complete. Root cause: useDatasetDetailOrchestrator hardcoded zoom: 16; fixed with goToMarkerWithSmartZoom | Will + Claude |
