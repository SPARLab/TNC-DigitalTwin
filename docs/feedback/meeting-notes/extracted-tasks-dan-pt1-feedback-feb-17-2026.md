# Extracted Tasks: Dan Pt 1 Feedback — Feb 17, 2026

**Meeting Date:** Feb 17, 2026, 1:00 PM  
**Source Transcript:** Dan Pt 1 Feedback Feb 17 at 1_00 PM.txt  
**Participants:** Dan (feedback), Will (demo), Trislin (assignee)  
**Scope Reviewed:** iNaturalist, DataONE, TNC ArcGIS (Union Pacific Railroad), Map Layers widget

---

## Quick Task Summary

| ID | Status | Task Name | Person | Last Updated | Data Source | Priority |
|----|--------|------------|--------|--------------|-------------|----------|
| DP1-01 | ⚪ Not Started | New view: auto-open filter panel / guide eye to right sidebar | Trislin | Feb 17, 2026 1:00 PM | iNaturalist / Map Layers | Medium |
| DP1-02 | ⚪ Not Started | Edit Filters: visual feedback to draw eye to right sidebar | Trislin | Feb 17, 2026 1:00 PM | iNaturalist / Map Layers | High |
| DP1-03 | ⚪ Not Started | Implement spatial queries (custom polygon) for all layers | Trislin | Feb 17, 2026 1:00 PM | Cross-cutting | Super High |
| DP1-04 | ⚪ Not Started | Spatial filter: select from pinned map layer (polygon) | Trislin | Feb 17, 2026 1:00 PM | Cross-cutting | Low |
| DP1-05 | 🟢 Complete | Fix Union Pacific Railroad TNC ArcGIS layer (layer ID 0 not found) | Trislin | Feb 20, 2026 | TNC ArcGIS | Medium |
| DP1-06 | ⚪ Not Started | Bug: Map layers widget filter sync with right sidebar | Trislin | Feb 17, 2026 1:00 PM | iNaturalist / Map Layers | High |
| DP1-07 | ⚪ Not Started | Right sidebar: add "Edit Filters" section header with filter title | Trislin | Feb 17, 2026 1:00 PM | iNaturalist / Map Layers | Medium |
| DP1-08 | ⚪ Not Started | Edit Filters button: provide feedback when already in edit mode | Trislin | Feb 17, 2026 1:00 PM | iNaturalist / Map Layers | High |
| DP1-09 | ⚪ Not Started | Map layers: allow multiple expanded layers (user-controlled) | Trislin | Feb 17, 2026 1:00 PM | Map Layers | High |
| DP1-10 | ⚪ Not Started | Place spatial filter UI under date range in right sidebar | Trislin | Feb 17, 2026 1:00 PM | Cross-cutting | Medium |
| DP1-11 | ⚪ Not Started | DataONE: auto-zoom to dataset when clicked (Trislin request) | Trislin | Feb 17, 2026 1:00 PM | DataONE | Medium |
| DP1-12 | ⚪ Not Started | DataONE export: implement metadata + download instructions | Trislin | Feb 17, 2026 1:00 PM | DataONE | Medium |
| DP1-13 | ⚪ Not Started | Get Amy & Trislin feedback on DataONE export behavior | Trislin | Feb 17, 2026 1:00 PM | DataONE | Medium |

---

## Task Descriptions

### DP1-01 — New view: auto-open filter panel / guide eye to right sidebar

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** iNaturalist / Map Layers  
**Priority:** Medium

When the user clicks "New view" under iNaturalist observations, the flow currently requires click → edit filters → navigate. Dan requested: when clicking "New view," automatically open or guide the user to the filter view. "Would there be a way to make it so when you click new view it just automatically opens up like the filter view or something like that? Instead of like doing click click and then edit filters." Some kind of visual guidance (e.g., flash) that points the user to the right sidebar where filters are edited. Applies broadly to filtered child views in the map layers widget.

---

### DP1-02 — Edit Filters: visual feedback to draw eye to right sidebar

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** iNaturalist / Map Layers  
**Priority:** High

The map layers widget is on the left; the place to change filters is in the right sidebar. On a large monitor they are far apart, so the connection between actions in the right sidebar and the map layers widget is not clear. Dan agreed that visual feedback would help: when the user clicks "Edit filters," something (e.g., a flash) should draw their eye to the right sidebar. Vice versa: when the user changes something in the right sidebar, a flash in the map layers widget would show that the change affected the filtered view. "I think that would make sense to me."

---

### DP1-03 — Implement spatial queries (custom polygon) for all layers

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** Cross-cutting  
**Priority:** Super High

Spatial queries were originally in the plan but not yet implemented. Dan was asked for priority: "Super high." Add support for spatial queries across all layers, including a custom polygon drawing tool (ArcGIS should provide this). Users need to filter by geographic area (e.g., preserve boundaries, custom drawn area).

---

### DP1-04 — Spatial filter: select from pinned map layer (polygon)

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** Cross-cutting  
**Priority:** Low

**Extra credit / next version.** In addition to drawing a custom polygon, allow users to select an area from a pinned layer on the map. Example: pin "Palama Watershed outline," then in iNaturalist filters choose "select from pinned layer" and use that polygon as the spatial query. "One of the reasons we're thinking having all the layers on the map would be awesome." Options for spatial filter: (1) draw your own, (2) preserved boundaries, (3) select from pinned map layer.

---

### DP1-05 — Fix Union Pacific Railroad TNC ArcGIS layer (layer ID 0 not found)

**Last Updated:** Feb 20, 2026  
**Data Source:** TNC ArcGIS  
**Priority:** Medium  
**Status:** 🟢 Complete (resolved via CON-ARCGIS-06 / TF-11)

**Bug.** Union Pacific Railroad (TNC ArcGIS Hub feature service) is not working. Error observed: "ArcGIS error. The requested layer, layer ID 0, was not found." Will noted this error appears in a couple of different feature services; needs investigation. **Resolved:** TF-11 added runtime fallback for single-row FeatureServer services that don't expose layer 0.

---

### DP1-06 — Bug: Map layers widget filter sync with right sidebar

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** iNaturalist / Map Layers  
**Priority:** High

**Bug.** Sometimes when the user changes filters on the right sidebar, the filtered child view name in the map layers widget does not sync/update. Reproduction unclear: "I'm not sure how to reproduce this." Example: user selects birds, mammals, etc., but the view name doesn't fill in. "Sometimes they're not syncing up with the filtered child view." Investigate, replicate, and resolve.

---

### DP1-07 — Right sidebar: add "Edit Filters" section header with filter title

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** iNaturalist / Map Layers  
**Priority:** Medium

Dan requested a visible title in the right sidebar indicating which filter is being edited. "It'd be nice to see the title of the filter I'm editing." Suggestion: section header (e.g., "Edit Filters" in green) above the filters, between "Search by species name" and the filter controls. Helps clarify "what am I editing in here versus what's over here" and creates a link between the map layers widget and the sidebar.

---

### DP1-08 — Edit Filters button: provide feedback when already in edit mode

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** iNaturalist / Map Layers  
**Priority:** High

When the user is already in the edit filters view and clicks "Edit filters" again, nothing happens—"it doesn't do anything." Referenced as a "narcissistic injury" (Gabe Newell): interacting with the world and getting no response is frustrating. The button should provide visual feedback (e.g., guide attention to the right sidebar, or indicate "you're already here") so the user understands the system state.

---

### DP1-09 — Map layers: allow multiple expanded layers (user-controlled)

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** Map Layers  
**Priority:** High

Currently only one layer can be expanded at a time. When the user switches to another layer (e.g., from iNaturalist to Palama Watershed), the first layer collapses. Dan wants to keep multiple layers expanded so he can bounce between filtered views without repeated clicking. "Having some way to be able to have expanded views of multiple map layers at once, especially if you're interested in multiple filters—I'd say that's the most important thing." Suggested UX: dropdown/caret to "pin" a layer as expanded; default could auto-collapse when switching, but user can choose to keep it expanded. "Users can control what they want, expand it or collapsed."

---

### DP1-10 — Place spatial filter UI under date range in right sidebar

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** Cross-cutting  
**Priority:** Medium

Spatial filter controls should live in the right sidebar, in the browse tab. Dan: "Under date range... in the right sidebar." Add an additional filter panel for spatial filter with options: draw your own polygon, select preserved boundaries, or select from pinned map layer. Applies broadly to all layers.

---

### DP1-11 — DataONE: auto-zoom to dataset when clicked (Trislin request)

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** DataONE  
**Priority:** Medium

Trislin requested: when the user clicks on a DataONE dataset, automatically zoom the map to where that dataset is located. Currently there is a "View on map" button; the request is to make this automatic on click. Will noted this as Trislin's feedback during the demo.

---

### DP1-12 — DataONE export: implement metadata + download instructions

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** DataONE  
**Priority:** Medium

When exporting DataONE datasets, provide a spreadsheet (CSV) of metadata (title, description, etc.) with a link to where the user can download the actual data from DataONE. "We're not hosting data... making it discoverable. We're not actually hosting." Avoid proxying large downloads through our server. Dan: "I think it would totally be fine to just... when you're exporting Data One data set, you get a spreadsheet of the metadata, the title, the descriptions, and then a link where you can download it from the source." For V1, metadata + download instructions are considered sufficient.

---

### DP1-13 — Get Amy & Trislin feedback on DataONE export behavior

**Last Updated:** Feb 17, 2026 1:00 PM  
**Data Source:** DataONE  
**Priority:** Medium

Open question: how to handle small vs. large files when exporting? Small files might be handled via API; large files (e.g., 1 TB imagery) should redirect users to DataONE. Will: "Get feedback from Amy and Trislin regarding exactly what we do when we export DataONE." Dan agreed with the two-scenario approach but deferred to Amy and Trislin for final direction.

---

## Notes from Transcript (No Task Extracted)

- **iNaturalist layer categorization:** Confirmed using Dan's iNaturalist layer/category mappings (API, not manual). Dan changed "research and since earthquake" to "sensor equipment" because it was too long.
- **Open in DataONE / in-app iframe buttons:** Dan liked them. No change requested.
- **Meeting ended early:** Will had to leave for a chat with Amy.
