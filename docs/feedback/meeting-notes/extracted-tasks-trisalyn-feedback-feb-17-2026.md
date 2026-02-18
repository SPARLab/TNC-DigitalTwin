# Extracted Tasks: Trisalyn Feedback — Feb 17, 2026

**Meeting Date:** Feb 17, 2026, 10:33 AM  
**Source Transcript:** Trisalyn Feedback Feb 17 at 10_33 AM.txt  
**Participants:** Trisalyn, Will, others  
**Scope Reviewed:** ANIML (camera traps), iNaturalist, Dendra, DroneDeploy, TNC ArcGIS, DataONE

---

## Quick Task Summary

| ID | Status | Task Name | Person | Last Updated | Data Source | Priority |
|----|--------|------------|--------|--------------|-------------|----------|
| T1 | ⚪ Not Started | Map click on camera trap → sync to right sidebar (select camera, show images) | Trisalyn | Feb 17, 2026 10:33 AM | ANIML | High |
| T2 | ⚪ Not Started | Export Builder: invert to cart metaphor (everything exports unless removed) | Trisalyn | Feb 17, 2026 10:33 AM | iNaturalist | High |
| T3 | ⚪ Not Started | Map click on Dendra station → sync to right sidebar, open station | Trisalyn | Feb 17, 2026 10:33 AM | Dendra | High |
| T4 | ⚪ Not Started | Pin multiple Dendra data streams, show time series charts side-by-side (draggable, resizable) | Trisalyn | Feb 17, 2026 10:33 AM | Dendra | Medium-High |
| T5 | ⚪ Not Started | Remove reset requirement for pinning multiple Dendra sensors | Trisalyn | Feb 17, 2026 10:33 AM | Dendra | Medium |
| T6 | ⚪ Not Started | Review "Update View" and "Save as New View" language for clarity | Trisalyn | Feb 17, 2026 10:33 AM | Dendra | Low |
| T7 | ⚪ Not Started | Prioritize DroneDeploy (Trisalyn: "I do think the Drone imagery is important") | Trisalyn | Feb 17, 2026 10:33 AM | DroneDeploy | High |
| T8 | ⚪ Not Started | Simplify project flights UI: flight name + date only, expand for metadata, smaller cards | Trisalyn | Feb 17, 2026 10:33 AM | DroneDeploy | Medium-High |
| T9 | ⚪ Not Started | Bug: Fix drone imagery not loading different images when toggling flights | Trisalyn | Feb 17, 2026 10:33 AM | DroneDeploy | High |
| T10 | ⚪ Not Started | TNC ArcGIS: Show layer-specific info in right sidebar, add info (i) button | Trisalyn | Feb 17, 2026 10:33 AM | TNC ArcGIS | Medium |
| T11 | ⚪ Not Started | TNC ArcGIS Hub: Fix iframe to show user-friendly page instead of feature service | Trisalyn | Feb 17, 2026 10:33 AM | TNC ArcGIS | Medium |
| T12 | ⚪ Not Started | DataONE: Map click on cluster → populate right sidebar with datasets at that location | Trisalyn | Feb 17, 2026 10:33 AM | DataONE | High |
| T13 | ⚪ Not Started | DataONE: Auto-zoom + tooltip when selecting saved dataset in sidebar | Trisalyn | Feb 17, 2026 10:33 AM | DataONE | High |
| T14 | ⚪ Not Started | DataONE: Auto-sync "View on Map" (no manual click required) | Trisalyn | Feb 17, 2026 10:33 AM | DataONE | High |
| T15 | ⚪ Not Started | Species ordering: general/common ones higher; UI for editing sort order | Trisalyn | Feb 17, 2026 10:33 AM | General / Species | Medium |

---

## Design Principle (Cross-Cutting)

**Map-first interactions:** Trisalyn stated: "Your design thinks about how people are going to interact with these things [right sidebar], but my mind thinks about how I'm going to interact with this thing [the map]. I will drive my queries through the map." The map should drive what happens in the right sidebar. This principle applies across ANIML, Dendra, DataONE, and TNC ArcGIS.

---

## Task Descriptions

### T1 — Map click on camera trap → sync to right sidebar (select camera, show images)

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** ANIML  
**Priority:** High

When the user clicks on a camera trap icon on the map (e.g., one showing "18" counts), the right sidebar should:
1. Collapse the species and date range section
2. Select that camera in the cameras dropdown
3. Show only images for that particular camera
4. Make images big enough to see

Trisalyn: "When I click on this, I want it to automatically pick up the camera in the camera list."

---

### T2 — Export Builder: invert to cart metaphor (everything exports unless removed)

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** iNaturalist  
**Priority:** High

Current behavior: blue = selected for export (opt-in). Trisalyn wants the opposite: **everything in the cart is exported by default** unless the user explicitly removes it. Shopping-cart metaphor: "When I go to a shopping cart in Amazon, if I decide I don't want those sneakers, I click the thing and the stickers go out."

**Requirements:**
- Replace blue "selected" with "Remove from cart" / "Remove from export"
- When removed: gray out the row (don't delete it) so it's clear it was removed and could be re-added
- Removed items stay on the map layers (pinned); they're just excluded from export
- When modal is closed and reopened, cart state should sync with map layers (removed items stay removed from cart)

---

### T3 — Map click on Dendra station → sync to right sidebar, open station

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** Dendra  
**Priority:** High

When the user clicks on a Dendra station point on the map, the right sidebar should open that station and show its data streams. Trisalyn: "What if I click on one of the points instead?" — she wants the map click to drive the sidebar, not the other way around.

---

### T4 — Pin multiple Dendra data streams, show time series charts side-by-side (draggable, resizable)

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** Dendra  
**Priority:** Medium-High

Trisalyn wants to pin multiple data streams (e.g., two wind sensors) and **compare them visually** — both time series charts visible simultaneously. "I'm interested in looking at what is the difference between the profile for Oaks for intenta3... I want both of these pinned. And now I want to pull up those two profiles and just visually compare the differences between them."

**Requirements:**
- Allow pinning multiple data streams (one at a time, but multiple visible)
- Show multiple time series charts at once (side by side or stacked)
- Charts should be draggable and resizable

---

### T5 — Remove reset requirement for pinning multiple Dendra sensors

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** Dendra  
**Priority:** Medium

Trisalyn: "I don't understand why I need to reset it in order to pin multiple things here." Allow pinning multiple sensors without requiring a reset step.

---

### T6 — Review "Update View" and "Save as New View" language for clarity

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** Dendra  
**Priority:** Low

The "Update View" and "Save as New View" language and its synchronization with map layers caused confusion. Mark for design iteration. Trisalyn asked for a walkthrough; Will noted it "needs some thought."

---

### T7 — Prioritize DroneDeploy (Trisalyn: "I do think the Drone imagery is important")

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DroneDeploy  
**Priority:** High

Trisalyn explicitly stated that drone imagery is important. Use this as input for prioritization when planning work.

---

### T8 — Simplify project flights UI: flight name + date only, expand for metadata, smaller cards

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DroneDeploy  
**Priority:** Medium-High

Project flights UI is visually noisy. Trisalyn: "Does this feel noisy? There's a lot of like buttons and stuff. I almost wonder if the only thing you really care about is the name of the flight and the date."

**Requirements:**
- Default view: flight name and date only
- Extra metadata (collection Tiff, WMTS, etc.) behind an expand/collapse — user must choose to expand
- Smaller cards
- Trisalyn suggested: "Flight number eight, and then maybe file type" as the primary visible info

---

### T9 — Bug: Fix drone imagery not loading different images when toggling flights

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DroneDeploy  
**Priority:** High

When toggling between project flights, the right sidebar indicates different flights are selected, but the imagery on the map appears identical. "It really genuinely looks like we are just looking at the same imagery." Log as bug for DroneDeploy.

---

### T10 — TNC ArcGIS: Show layer-specific info in right sidebar, add info (i) button

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** TNC ArcGIS  
**Priority:** Medium

When clicking different layers (e.g., Bathymetric Contours) within a feature service, the right sidebar only changes the title. The TNC ArcGIS service description never changes — it shows feature-service-level info, not layer-specific info.

**Requirements:**
- Add an info (i) button beside "TNC ArcGIS service"
- When clicked, show information about that particular layer
- Over time (lower priority): add metadata/description for the layer (e.g., "This data is from blah, blah, blah")

Trisalyn: "I want there to be an I button besides TNC arcgis service. When you click on the I button, I want that information there."

---

### T11 — TNC ArcGIS Hub: Fix iframe to show user-friendly page instead of feature service

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** TNC ArcGIS  
**Priority:** Medium

Will noted: "I need to fix this... I need to find the TNC user friendly page so that I can show people that detail page because this is showing the like ArcGIS feature service. That's like, not user friendly." The iframe currently shows the raw ArcGIS feature service; it should show the TNC user-friendly page.

---

### T12 — DataONE: Map click on cluster → populate right sidebar with datasets at that location

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DataONE  
**Priority:** High

When the user clicks on a cluster on the map (e.g., "4" indicating 4 datasets at that location), the right sidebar should populate with those 4 datasets. Trisalyn: "I'm studying this area just north of halama Road, and I want to know everything that's there." The four things are all at that location — no need to break them down further on the map — but clicking should populate the sidebar so she can explore each dataset.

---

### T13 — DataONE: Auto-zoom + tooltip when selecting saved dataset in sidebar

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DataONE  
**Priority:** High

When the user selects one of the saved/filtered DataONE dataset views in the sidebar, the map should:
1. Automatically zoom to that dataset's location
2. Show a tooltip (ArcGIS-style) with the dataset name and any other relevant info

Currently the user must scroll and click "View on Map" — Trisalyn wants automatic synchronization.

---

### T14 — DataONE: Auto-sync "View on Map" (no manual click required)

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** DataONE  
**Priority:** High

"View on Map" should not require a manual click. When the user selects a dataset in the right sidebar, the map should automatically sync (zoom, highlight) — no separate "View on Map" action needed.

---

### T15 — Species ordering: general/common ones higher; UI for editing sort order

**Last Updated:** Feb 17, 2026 10:33 AM  
**Data Source:** General / Species  
**Priority:** Medium

Trisalyn: "I want the more general and commonly used ones to pop up higher on the list." Example: why is peregrine falcon observation first? Dan has created a feature service for the catalog; need a "Download a UI which makes it easy to edit this stuff" so the ordering can be configured (e.g., put common species higher).

---

## Notes from Transcript (No Task Extracted)

- **iNaturalist mammals:** Demo worked; Trisalyn saw mammals, clicked for point data and associated image, saw observations list. "That's great."
- **Pinned layers:** Trisalyn liked that pinned layers persist in the map layers widget.
- **Dendra sensor types:** Will noted people think in terms of sensor type (e.g., wind sensors) rather than data source — design should reflect that.
- **TNC ArcGIS multi-layer pinning:** Trisalyn said pinning multiple layers from a single feature service "makes sense."
