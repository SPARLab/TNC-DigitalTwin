# Extracted Tasks: Trisalyn Feedback — Feb 20, 2026

**Meeting Date:** Feb 20, 2026  
**Source Transcript:** Trisalyn Feedback Feb 20 at 8_52 AM.txt  
**Participants:** Trisalyn (QA reviewer), Will  
**Scope Reviewed:** iNaturalist, ANiML (Camera Traps), Dendra (Field Sensors), GBIF, DroneDeploy, TNC ArcGIS, DataOne  
**Meeting Type:** QA / walkthrough session

---

## Quick Task Summary

| ID | Status | Last Updated | Task Description | Data Source | Priority | Notes |
|----|--------|--------------|-----------------|-------------|----------|-------|
| TF-01 | 🟡 Partial | Feb 20, 2026 | Set minimum height for image results in Browse tab (~150px) so user doesn't need to collapse filters to scroll | iNaturalist, ANiML | High | ANiML complete (min-h 300px, overlay scrollbar). iNaturalist pending — see TF-01-INAT. |
| TF-01-INAT | ⚪ Not Started | Feb 20, 2026 | Apply TF-01 parity to iNaturalist Browse: min-h 300px for results, overlay scrollbar | iNaturalist | High | ANiML done; same fix for inat-browse-results-region / observation cards |
| TF-02 | ⚪ Not Started | Feb 20, 2026 | Replace emoji icons with SVGs for cross-browser/cross-OS visual consistency | All | High | Emojis render differently on PC vs Mac |
| TF-03 | ⚪ Not Started | Feb 20, 2026 | Don't gray out species options in Filter Species dropdown; gray = unavailable, but they're just unselected | iNaturalist | High | Communicates incorrect affordance to user |
| TF-04 | ⚪ Not Started | Feb 20, 2026 | Fix map/right-sidebar desync: selecting taxon in legend + filtering by species results in map not updating | iNaturalist | High | Discovered live in QA session |
| TF-05 | ⚪ Not Started | Feb 20, 2026 | Standardize filter control ordering across all data sources (date range first, then custom draw polygon) | All | High | Order differs between Camera Traps and iNaturalist |
| TF-06 | ⚪ Not Started | Feb 20, 2026 | Rename left sidebar group from "Sensor Equipment" to "Field Sensors" | Dendra | Low | Trisalyn verbally confirmed "Field Sensors" is preferred |
| TF-07 | ⚪ Not Started | Feb 20, 2026 | Remove "dangermond_" prefix from Dendra station tooltip titles (tooltip says "dangermond_Oaks", sidebar says "Oaks") | Dendra | Medium | Inconsistency; investigate source of prefix |
| TF-08 | ⚪ Not Started | Feb 20, 2026 | Add collapse/hide caret to Map Layers widget | Map Layers Widget | Medium | Trisalyn had to manually scroll; no clear affordance to collapse |
| TF-09 | ⚪ Not Started | Feb 20, 2026 | GBIF performance: implement grouping/clustering strategy for 328k data points | GBIF | Medium | Dan and Will already discussing; not a solo task |
| TF-10 | ⚪ Not Started | Feb 20, 2026 | Add gray background to DroneDeploy project cards | DroneDeploy | Low | Noted during walkthrough of project switcher |
| TF-11 | ⚪ Not Started | Feb 20, 2026 | Fix intermittent "layer zero not found" error for Coastal Marine Data in right sidebar/legend | TNC ArcGIS | High | Intermittent; needs repro + investigation |
| TF-12 | ⚪ Not Started | Feb 20, 2026 | Implement "Open Table Overlay" for all TNC ArcGIS feature service layers | TNC ArcGIS | Medium | Currently works on Oil Seeps; expand to all layers; Dan will like this |
| TF-13 | ⚪ Not Started | Feb 20, 2026 | Add loading indicator when DataOne layer is selected and map data is loading | DataOne | High | No visual feedback during load; user sees nothing and doesn't know if it's working |
| TF-14 | ⚪ Not Started | Feb 20, 2026 | Render a map marker for the specific dataset when "View on Map" is clicked | DataOne | High | Currently highlights the group but doesn't drop a specific dot/marker |
| TF-15 | ⚪ Not Started | Feb 20, 2026 | Create GIFs of current app state for presentation materials | App-wide | High | Phase 1 deliverable before monitoring work begins |
| TF-16 | ⚪ Not Started | Feb 20, 2026 | Design and build monitoring feature mockup (anomaly detection, normal-range charts, alert system) | Future Feature | High | Discussed as #1 next major feature; see detailed notes below |
| TF-17 | ⚪ Not Started | Feb 20, 2026 | Reach out to Kelly/Sophie to understand existing RanchBot monitoring capabilities before building | Future Feature | Medium | Avoid duplicating what RanchBot already provides |

---

## Task Descriptions

### TF-01 — Minimum image result height in Browse tab (~150px)

**Last Updated:** Feb 20, 2026  
**Data Source:** iNaturalist, ANiML  
**Priority:** High  
**Status:** 🟡 Partial — ANiML complete; iNaturalist pending (TF-01-INAT)

Trisalyn found that when the species filter is expanded, the results section was too short to scroll through images meaningfully. She had to collapse the filter to get enough vertical space. Will's note: "Make sure the height of the image results is at a minimum something like 150px so the user can scroll down and see a sizable window, and not be forced to collapse filter sections."

**Resolution (ANiML, Feb 20, 2026):**
- `#animl-image-list-scrollable` enforces `min-h-[300px]` to prevent zero-height collapse at browser zoom
- Non-collapsible `EditFiltersCard` uses `overflow-visible` so filter content grows without clipping
- Right-sidebar scrollbar: hover-only, no gutter reservation (avoids content shift)

---

### TF-02 — Replace emoji icons with SVGs

**Last Updated:** Feb 20, 2026  
**Data Source:** All  
**Priority:** High

On PC, emojis render visually different from Mac. Trisalyn observed this discrepancy during the walkthrough. Will's note: "We should probably move towards SVGs to make sure there's visual consistency across different browsers." Audit all emoji usage in the app and replace with SVG equivalents.

---

### TF-03 — Don't gray out species options in Filter Species dropdown

**Last Updated:** Feb 20, 2026  
**Data Source:** iNaturalist  
**Priority:** High

When Trisalyn clicked on iNaturalist > Mammals and went to the Filter Species dropdown, all species appeared grayed out. She interpreted this as the species being unavailable/disabled. They are not disabled — they are simply unselected. Grayed-out styling communicates the wrong affordance. Will's note: "We should not gray out options because that's communicating to Trisalyn that these are not available when they are available."

---

### TF-04 — Fix map/right-sidebar desync (iNaturalist taxon + species filter)

**Last Updated:** Feb 20, 2026  
**Data Source:** iNaturalist  
**Priority:** High

Trisalyn selected Mammals in the legend/map layers and then applied a species filter in the right sidebar. The map did not update to reflect the filtered state. Will's note: "There's some kind of desynchronization issue with the filter for iNaturalist." Needs investigation into the state management binding between the map layer and the filter controls.

---

### TF-05 — Standardize filter control ordering across all data sources

**Last Updated:** Feb 20, 2026  
**Data Source:** All  
**Priority:** High

The order of filter controls (e.g., date range, custom draw polygon) differs between Camera Traps and iNaturalist. Will's note: "We have to make sure that we have some sort of consistent cardinality — like an order with how we order ourselves." Define a canonical filter control ordering and apply consistently across all data source panels.

---

### TF-06 — Rename "Sensor Equipment" to "Field Sensors"

**Last Updated:** Feb 20, 2026  
**Data Source:** Dendra  
**Priority:** Low

During the walkthrough of Dendra, the left sidebar group was labeled "Sensor Equipment." Trisalyn verbally confirmed she prefers "Field Sensors." Will: "We can change it to Field Sensors." Simple label update.

---

### TF-07 — Remove "dangermond_" prefix from Dendra station tooltip titles

**Last Updated:** Feb 20, 2026  
**Data Source:** Dendra  
**Priority:** Medium

Map tooltip shows "dangermond_Oaks" while the right sidebar shows "Oaks." This is inconsistent. Trisalyn said she is not confused by it, but Will flagged: "We should find out why there's this prefix and then try to remove it." Investigate the source of the "dangermond_" prefix in the station data and strip it from display strings.

---

### TF-08 — Add collapse/hide caret to Map Layers widget

**Last Updated:** Feb 20, 2026  
**Data Source:** Map Layers Widget  
**Priority:** Medium

Will noted: "In the map layers widget, I should probably have some kind of a caret, like a collapse/hide button." Currently the widget has no visible collapse affordance. Adding a caret-style collapse control would improve space management, especially with multiple pinned layers visible.

---

### TF-09 — GBIF performance: grouping/clustering strategy

**Last Updated:** Feb 20, 2026  
**Data Source:** GBIF  
**Priority:** Medium

GBIF has 328,000 data points and renders slowly. Will noted: "Dan and I are already talking through some background strategies to basically group things in a way that makes it more performant." This is a known, in-progress collaboration item between Will and Dan. Track here for visibility.

---

### TF-10 — Add gray background to DroneDeploy project cards

**Last Updated:** Feb 20, 2026  
**Data Source:** DroneDeploy  
**Priority:** Low

Will noted during the DroneDeploy walkthrough: "I want to add the gray background to the project card." Visual polish — project cards in the Browse/projects view should have a gray background for contrast and readability.

---

### TF-11 — Fix intermittent "layer zero not found" error for Coastal Marine Data

**Last Updated:** Feb 20, 2026  
**Data Source:** TNC ArcGIS  
**Priority:** High

When loading the Coastal Marine Data feature service under Elevation & Bathymetry in the TNC ArcGIS category, an intermittent error appears in the right sidebar and legend: "layer zero not found." This prevents proper discovery of the feature service's multiple layers. Will noted: "I'm getting an error in the right sidebar and the legend that's saying layer zero was not found. We're not able to properly discover that as a feature service with multiple layers." Needs investigation and fix.

---

### TF-12 — Implement "Open Table Overlay" for all TNC ArcGIS feature service layers

**Last Updated:** Feb 20, 2026  
**Data Source:** TNC ArcGIS  
**Priority:** Medium

The "Inspect → Open Table Overlay" feature exists for Oil Seeps and works well. Trisalyn reacted positively: "This is totally how the GIS brain thinks, I love it." Will's plan: "I would implement this table layer feature for all the layers." Expand the inspect + table overlay capability to all applicable TNC ArcGIS feature service layers.

---

### TF-13 — Add loading indicator when DataOne layer is selected

**Last Updated:** Feb 20, 2026  
**Data Source:** DataOne  
**Priority:** High

When Trisalyn clicked on the DataOne datasets layer in the left sidebar, the map did not visibly load and there were no loading indicators. Will's note: "If there's nothing loading on the map, we need to make sure there's a loading indicator to communicate that we're not in a final done state — that we're still loading data." Add a visible loading state to the DataOne right sidebar and/or map overlay.

---

### TF-14 — Render specific map marker when "View on Map" is clicked

**Last Updated:** Feb 20, 2026  
**Data Source:** DataOne  
**Priority:** High

When a user clicks "View on Map" for a specific DataOne dataset (e.g., a preserved plant list), the map currently highlights the general group area but does not drop a specific marker at the dataset's location. Will's note: "We need to make sure that we're actually drawing a map marker when we click on View on Map because it looks like we are highlighting the group but we're not highlighting the specific dot location for this dataset." If the map marker does not exist, render a fallback icon at the dataset's coordinates.

---

### TF-15 — Create GIFs of current app for presentation

**Last Updated:** Feb 20, 2026  
**Data Source:** App-wide  
**Priority:** High

Identified as Phase 1 deliverable before starting monitoring work. Create animated GIFs demonstrating key interactions across the current app state. These will be used in the Jack Dangermond presentation. Trisalyn and Will agreed this should come before building new features.

---

### TF-16 — Design and build monitoring feature (anomaly detection)

**Last Updated:** Feb 20, 2026  
**Data Source:** Future Feature  
**Priority:** High

Identified as the #1 next major feature. Trisalyn described the core concept: compare current sensor/observation data against a historical baseline, automatically detect anomalies, and surface them to users. Scope discussed includes:

- **Line charts with normal-range bands:** Y-axis = measurement value; x-axis = time. Behind the current line, render a gray shaded band representing the historical normal range (min/max or confidence interval). When data goes outside the band, highlight it (e.g., color the line segment red/orange).
- **Configurable reference period:** User can choose to compare against last year, last 5 years, last decade, etc.
- **Alert system (bell icon):** Bell icon with count badge that lights up when anomalies exist. Clicking navigates to a dedicated Alerts page listing recent unusual events. Bell goes dormant when nothing is unusual.
- **Alert age decay:** Alerts older than a configurable time window should age out and not remain in the count indefinitely.
- **Email alerts (stretch):** For operations staff who monitor wells, water levels, etc. — automatic email notifications when an anomaly is detected.

Species-specific monitoring ideas discussed:
- iNaturalist: define a historical observation polygon for each species; flag observations outside that polygon as novel occurrences.
- ANiML: flag species that have never been observed at a camera trap before, or flag unusual frequency changes (e.g., bobcat % goes from 5% to 10% of detections).

Will's roadmap:
1. Finish current functionality
2. Create GIFs for presentation (TF-15)
3. Build monitoring mockup
4. Jupyter notebooks
5. (Optional) 3D visualization — "eye candy, throw it on at the end if there's time"

---

### TF-17 — Reach out to Kelly/Sophie re: existing RanchBot monitoring

**Last Updated:** Feb 20, 2026  
**Data Source:** Future Feature  
**Priority:** Medium

Before building a monitoring/alert system, verify what RanchBot already provides for the water wells at the Dangermond Preserve. Kelly may already be receiving phone/email alerts from RanchBot. Will: "It's a good idea to start figuring out what they already have, and if they have needs." Contact Kelly and/or Sophie to understand existing monitoring capabilities, avoid duplicating functionality, and identify unmet researcher needs.

---

## Notes from Transcript (No Task Extracted)

- **Spacing workaround noted:** Trisalyn found the collapse affordance on the species filter not intuitive at first — addressed by TF-01 (minimum result height) rather than relying on users to collapse panels.
- **Dendra multi-view feature well received:** Pinning a layer, opening a new view, and toggling between pinned data streams was the highlight of the session for Will ("currently my favorite thing").
- **Visibility toggle (eye icon) works well:** Toggling layer visibility via the eye icon in the Map Layers widget was clear to Trisalyn.
- **TNC ArcGIS Coastal Marine multi-layer design:** Trisalyn confirmed the current UI clearly communicates that Coastal Marine is a feature service with 20 layers, not a single drawable layer. No change needed to the design.
- **3D visualization — deferred:** Both agreed 3D is potentially captivating but not critical right now. "If the video game helps us do science, let's do the video game. If it doesn't, we're not going to do a video game." Decision: revisit with Amy before committing time to it.
- **MODIS radio telemetry:** Not yet implemented. Tracks bird movement. Could be a compelling future data source for demonstrating "things that move."
- **Anomaly dispatch:** Trisalyn's framing — "an early warning system for changes happening in the landscape by identifying weird things you wouldn't know you should be looking for."
