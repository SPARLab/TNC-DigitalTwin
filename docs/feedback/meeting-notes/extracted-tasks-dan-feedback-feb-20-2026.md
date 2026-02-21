# Extracted Tasks: Dan Meeting — Feb 20, 2026

**Meeting Date:** Feb 20, 2026  
**Source Transcript:** Dan Meeting & Feedback Feb 20 at 11_02 AM.txt  
**Participants:** Dan (ArcGIS Enterprise backend), Will  
**Scope Reviewed:** GBIF clustering, DataOne deduplication, right sidebar UX, map layers widget, Dendra bugs, ArcGIS feature service descriptions, export builder, layer categories  
**Meeting Type:** Feedback / working session

**Distribution:** ✅ Tasks distributed to phase docs (Feb 20, 2026). See phase-0 (D20-01), phase-3, 4, 5, 6, 7, 9 in `docs/IMPLEMENTATION/phases/`.

---

## Quick Task Summary

| ID | Status | Last Updated | Task Description | Data Source | Notes |
|----|--------|--------------|------------------|-------------|-------|
| D20-01 | 🟢 Complete | Feb 20, 2026 | Add collapse button to right sidebar — default open, stays collapsed until user manually re-expands | App-wide | Implemented in Phase 0. Extruded tab, localStorage, 300ms. |
| D20-02 | 🟢 Complete | Feb 20, 2026 | Add back button in right sidebar for ArcGIS feature service inspect/browse view | TNC ArcGIS | Shared BrowseBackButton; layer context card; Open Table Overlay repositioned; full field list; Legend removed. |
| D20-03 | ⚪ Not Started | Feb 20, 2026 | Make Map Layers accordion header bar clickable to expand/collapse (not just the caret icon) | App-wide | Dan kept trying to click the heading to expand. Retain the caret but make the whole header row interactive. |
| D20-04 | ⚪ Not Started | Feb 20, 2026 | Replace +/- symbols in Map Layers accordion with chevron (V / >) symbols | App-wide | Plus/minus is not a clear expand/collapse affordance; chevron communicates directionality better. |
| D20-05 | ⚪ Not Started | Feb 20, 2026 | Investigate and fix Dendra browser popup asking for device access | Dendra | Observed live during session. We don't want to trigger any device-access permission dialogs. |
| D20-06 | ⚪ Not Started | Feb 20, 2026 | Verify and fix custom polygon draw tool for Dendra | Dendra | Will noted the tool needs to be properly implemented for Dendra. |
| D20-07 | ⚪ Not Started | Feb 20, 2026 | Verify custom polygon draw tool is working consistently across all data sources | All | iNaturalist and ANiML confirmed working; Dendra suspected broken; audit the rest. |
| D20-08 | ⚪ Not Started | Feb 20, 2026 | Fix GBIF "classes" filter — populate dropdown with valid options or remove it entirely | GBIF | Currently empty dropdown in the GBIF species occurrence filter section. |
| D20-09 | ⚪ Not Started | Feb 20, 2026 | Filter DataOne map to latest dataset version only (deduplicate by latest) | DataOne | Current flat table shows all versions; 878 deduplicated datasets but one dataset alone shows 700 rows due to versioning. |
| D20-10 | 🟢 Complete | Feb 20, 2026 | Replace static layer overview text with actual ArcGIS feature service description text | Dendra, TNC ArcGIS | Fetches from ArcGIS item metadata (serviceItemId → snippet + description); HTML normalized for line breaks; no per-layer descriptions in layer list. |
| D20-11 | ⚪ Not Started | Feb 20, 2026 | Fix legend-as-filter functionality for TNC ArcGIS feature service layers | TNC ArcGIS | Clicking legend items was supposed to filter polygons; Amy flagged it's broken. Apply to all layers that have distinct legend objects. |
| D20-12 | ⚪ Not Started | Feb 20, 2026 | Implement GBIF media display using `media_json` column | GBIF | Dan confirmed `media_json` column exists as a stringified JSON. Priority: medium. After DataOne work. iNaturalist already has media. |
| D20-13 | ⚪ Not Started | Feb 20, 2026 | Add collapse button to left sidebar (lower priority) | App-wide | Dan mentioned it as nice-to-have for full map exploration. Lower priority than right sidebar. |
| D20-14 | ⚪ Not Started | Feb 20, 2026 | Add Python API code generation to export builder — especially for real-time Dendra data | Export Builder / Dendra | In Export Builder, offer a "Get Python Code" option alongside download. Dendra = Python/API access. Static TNC services = shapefile download. |
| D20-B01 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Update GBIF pipeline so the hosted data store layer stays in sync with source updates | GBIF | Hosted layer is published and publicly available now; pipeline sync not yet wired up. GBIF is not live-updated so no huge rush. |
| D20-B02 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Create dedicated DataOne point layer in ArcGIS data store (deduplicated, latest version only) with native clustering enabled | DataOne | Mirrors what Dan did for GBIF. Will keep the underlying versioned data table; the new point layer is just latest spatial points. |
| D20-B03 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Investigate why `taxonomic_class` field is empty for many GBIF records | GBIF | Dan observed this in ArcGIS Enterprise. Backend data pipeline issue. |
| D20-B04 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Reorder ArcGIS Enterprise layer categories per Amy's survey feedback | TNC ArcGIS | Order: Boundaries → Infrastructure → Species → Land Cover → Sensor Equipment → rest. Dan handling in layer management app. |
| D20-B05 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Re-categorize layer sub-buckets per Amy's feedback — all layers in own bucket, no nested sub-buckets within categories | TNC ArcGIS | e.g., Fire has layers across nested sub-buckets; Amy wants them all in one flat bucket. Dan handling in layer management app. |

---

## Backlog (Future Consideration)

| ID | Status | Last Updated | Task Description | Data Source | Notes |
|----|--------|--------------|------------------|-------------|-------|
| D20-BL01 | 🔵 Backlog | Feb 20, 2026 | Plot multiple time series data streams on the same floating chart widget | Dendra | Needs UX design thought — e.g., wind speed avg + wind speed max overlaid. May cause visualization issues at current paradigm. |
| D20-BL02 | 🔵 Backlog | Feb 20, 2026 | Plot same data stream across multiple stations on the same chart for comparison | Dendra | e.g., wind speed at Oak State, Sutter, and Team data streams simultaneously. Complements BL01. |
| D20-BL03 | 🔵 Backlog | Feb 20, 2026 | Real-time weather-style sensor overlays on the map — wind direction arrows, rain gauge icons, temperature readings | Dendra | Dan's idea: show live sensor readings inline on map (thermometer icon showing current temp at each station, animated wind arrows, rain/dry icon for rain gauges). More "live dashboard" feel. |

---

## Task Detail Notes

### D20-01 — Right sidebar collapse button
Dan's primary UX feedback. On his laptop, the right sidebar covers most of the map when legend + description are both visible. He wants to be able to dismiss the sidebar entirely to maximize map/legend focus. Decision from meeting: **default open**, **no auto-reopen on layer click**, **user must manually re-expand if they've collapsed it**.

---

### D20-02 — Back button in right sidebar (ArcGIS feature service inspect view) ✅ Complete
Flow: Overview tab → user clicks "Inspect" → lands on Browse tab. **Resolution (Feb 20, 2026):** Implemented shared `BrowseBackButton` component (matches Dendra "Back to Stations" styling). TNC ArcGIS Browse now shows "Back to Layers" at top; layer context card (current layer + feature service, light gray bg); Open Table Overlay moved between context and table snapshot; full field list (no truncation); Legend section removed.

---

### D20-03 / D20-04 — Map Layers accordion header + chevron
During Dendra walkthrough, Dan repeatedly tried to click the "Map Layers" heading text to expand the section, but only the +/- icon is interactive. The + and - symbols were also flagged as unclear — chevrons (V pointing down when open, > pointing right when closed) communicate expansion state more intuitively. Fix both together.

---

### D20-05 — Dendra device access popup
While Dan navigated to Dendra (Stolen Groundwater Sensors section), he received a browser popup notification asking to "Access other apps and services on the device." Origin unclear. Could be a WebSocket, sensor polling request, or something in the map initialization. Investigate what triggers this and suppress it.

---

### D20-06 / D20-07 — Custom polygon draw tool
Will noted the custom polygon draw tool was added to iNaturalist and ANiML. Dan's Dendra session surfaced that it may not be correctly implemented for Dendra. Audit: iNaturalist ✅, ANiML ✅ (confirmed working per Will), Dendra ❓ (suspected broken), other sources ❓.

---

### D20-08 — GBIF "classes" filter
In the GBIF species occurrence filter panel, there is a "classes" dropdown that shows no options. Dan logged in to ArcGIS and confirmed the `taxonomic_class` field is empty for many records (see D20-B03 for backend investigation). Frontend fix: either wire the dropdown to populate from available non-null values, or remove the filter control if data is too sparse to be useful.

---

### D20-09 — DataOne deduplication
Current DataOne data is a flat table where each row is a version of a dataset. Deduplicating to latest only yields 878 datasets, but without deduplication a single dataset can produce hundreds of rows. The map currently shows all versions as separate points. Frontend fix: add a filter to only show `version = latest` (or equivalent) on the map. Dan will also create a dedicated latest-only point layer on the backend (D20-B02).

---

### D20-10 — Feature service description text ✅ Complete
Dan confirmed that the Dendra layers in ArcGIS Enterprise have proper descriptions written by Kelly (e.g., "Wind monitoring data from depleted danger, we observe sensors measure wind speed…"). The current UI renders static/hardcoded overview text with only the layer name dynamically inserted. The feature service metadata description should be pulled and rendered instead. Apply to all ArcGIS feature service layers where descriptions exist.

**Resolution (Feb 20, 2026):** Implemented `fetchServiceDescription()` in `tncArcgisService.ts`. Fetches ArcGIS item metadata via `serviceItemId` (snippet + description from Hub/portal), then falls back to service-level and layer-level description. HTML tags converted to newlines; `whitespace-pre-line` preserves paragraph breaks. Applied to TNC ArcGIS Overview and Dendra Overview tabs. Per-layer descriptions removed from layer list (no descriptions under individual layer rows). Source: Dan Meeting Feb 20.

---

### D20-11 — Legend as filter for TNC feature service layers
Amy flagged this in comments Dan will share. Clicking on a legend item (e.g., a specific fire polygon type, or a specific vegetation category) is supposed to filter the map to show only polygons matching that legend item. This was working at some point and is now broken. Needs investigation across all TNC feature service layers that have multi-type legends.

---

### D20-12 — GBIF media display
Dan confirmed a `media_json` column exists in the GBIF ArcGIS feature layer. It's stored as a stringified JSON string (ArcGIS can't store native JSON objects). The JSON contains image URL(s) and associated metadata for records that have media (e.g., records sourced from iNaturalist or eBird). Many records will have null media. Implementation should parse the string, extract the image URL, and render it in the GBIF right sidebar detail view — same pattern as iNaturalist's media display.

---

### D20-14 — Python API code generation in Export Builder
Dan and Will agreed: the right home for API access code is the Export Builder, not a separate Jupyter Notebook widget. For real-time data sources (e.g., Dendra), offer a "Get Python Code" tab/option that auto-generates a Python snippet showing how to query the API for the current filter state. For static TNC services, the existing shapefile/CSV download is sufficient. This is the first step toward a future LLM-assisted research query tool.

---

## Notes (No Task Extracted)

- **Dan confirmed GBIF hosted layer is published and publicly available.** Native clustering is enabled. The layer can be used as the GBIF map source right now. Pipeline sync still needs to happen (D20-B01) but frontend can switch to hosted layer today.
- **Amy has a doc with layer categorization + UI comments.** Dan will share. Will should review for any UI tasks directed at the frontend.
- **Legend-as-filter was supposedly working before and is now broken** — Amy and Dan both noted this. Needs regression investigation.
- **Dendra station overview text mismatch context:** The current UI shows generic static text like "This layer shows wind sensors with station locations and associated measurements." The feature service has richer descriptions. No need to write new descriptions — just pull from the existing metadata.
- **Right sidebar default state discussion conclusion:** Keep it default open. Once collapsed by user, do not auto-reopen. User must intentionally re-expand. This applies to both the right sidebar (D20-01) and the left sidebar (D20-13) if/when implemented.
