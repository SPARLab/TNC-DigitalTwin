# Extracted Tasks: Dan Pt 2 Feedback — Feb 17, 2026

**Meeting Date:** Feb 17, 2026, 3:17 PM  
**Source Transcript:** Dan Feedback Pt 2 Feb 17 at 3_17 PM.txt  
**Participants:** Dan (feedback), Will (demo), Trislin (assignee)  
**Scope Reviewed:** DataONE, TNC ArcGIS Feature Services (Coastal and Marine data)

---

## Quick Task Summary

| ID | Status | Task Name | Person | Last Updated | Data Source | Priority |
|----|--------|------------|--------|--------------|-------------|----------|
| DP2-01 | ⚪ Not Started | DataONE: clicking map cluster shows those datasets in right sidebar | Trislin | Feb 17, 2026 3:17 PM | DataONE | High |
| DP2-02 | ⚪ Not Started | DataONE: pop-up/tooltip to scroll through datasets in cluster (ArcGIS) | Trislin | Feb 17, 2026 3:17 PM | DataONE | Medium |
| DP2-03 | ⚪ Not Started | DataONE: improve point dispersion as user zooms in | Trislin | Feb 17, 2026 3:17 PM | DataONE | Medium |
| DP2-04 | ⚪ Not Started | DataONE: investigate and fix map vs sidebar count discrepancy (dedupe versions) | Trislin | Feb 17, 2026 3:17 PM | DataONE | High |
| DP2-05 | ⚪ Not Started | DataONE: Save button styling — clarify saved vs unsaved state | Trislin | Feb 17, 2026 3:17 PM | DataONE | High |
| DP2-06 | ⚪ Not Started | DataONE: persist saved state — show "Saved" when returning to saved dataset | Trislin | Feb 17, 2026 3:17 PM | DataONE | High |
| DP2-07 | ⚪ Not Started | DataONE: multi-select categories filter (checklist) | Trislin | Feb 17, 2026 3:17 PM | DataONE | Medium |
| DP2-08 | ⚪ Not Started | DataONE: search by title AND abstract/keywords | Trislin | Feb 17, 2026 3:17 PM | DataONE | High |
| DP2-09 | ⚪ Not Started | DataONE: filter by file type (CSV, TIF, imagery, etc.) | Trislin | Feb 17, 2026 3:17 PM | DataONE | Medium |
| DP2-10 | ⚪ Not Started | DataONE: saved indicator on browse cards (icon + subtle highlight) | Trislin | Feb 17, 2026 3:17 PM | DataONE | Medium |
| DP2-11 | ⚪ Not Started | DataONE: search result highlight (keyword in abstract) — nice to have | Trislin | Feb 17, 2026 3:17 PM | DataONE | Low |
| DP2-12 | ⚪ Not Started | TNC ArcGIS: feature service overview in right sidebar (name, description, layers) | Trislin | Feb 17, 2026 3:17 PM | TNC ArcGIS | High |
| DP2-13 | ⚪ Not Started | TNC ArcGIS: clarify feature service vs category in left sidebar | Trislin | Feb 17, 2026 3:17 PM | TNC ArcGIS | High |
| DP2-14 | ⚪ Not Started | TNC ArcGIS: "See table" button — pop-up table view for layers/tables | Trislin | Feb 17, 2026 3:17 PM | TNC ArcGIS | Medium |
| DP2-15 | ⚪ Not Started | TNC ArcGIS: right sidebar layer selection syncs with left sidebar | Trislin | Feb 17, 2026 3:17 PM | TNC ArcGIS | Medium |
| DP2-16 | ⚪ Not Started | TNC ArcGIS: design multi-layer feature service UX (pin for follow-up) | Trislin | Feb 17, 2026 3:17 PM | TNC ArcGIS | Low |

---

## Task Descriptions

### DP2-01 — DataONE: clicking map cluster shows those datasets in right sidebar

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** High

When the user clicks on a clustered group on the map (e.g., "108" implying 108 datasets), the right sidebar should show those specific 108 datasets grouped. Trislin's feedback: "For DataONE on the map area, if you click on one of the groups like, for example, this is a group that says 108, implying 108 data sets, you would see those specific 108 data sets showing grouped in the right sidebar." Dan: "Prioritize between the two, I think in the right sidebar is probably more important because that's like the interactive portion of it."

---

### DP2-02 — DataONE: pop-up/tooltip to scroll through datasets in cluster (ArcGIS)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Medium

ArcGIS clustering symbology can typically show a single pop-up where the user scrolls through different attributes/items in the group. Dan: "There's like a pop-up with these clusters that this is the arcgis package you can usually like get a single pop-up and just like scroll through the different attributes associated with each of the stuff in the group." Both DP2-01 (right sidebar) and this pop-up would be good; right sidebar is higher priority.

---

### DP2-03 — DataONE: improve point dispersion as user zooms in

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Medium

When zoomed in, clustered points should disperse more. Currently points may remain stacked. Dan: "For these 1000 data sets or whatever, like if there is a way to when you zoom in, get them to like disperse a little bit more. I'm not sure like what the aggregation minimum level is at? But if they all are stacked on top of each other, then that's totally fine. You don't, there's nothing you can really do about that." Will: "We need to disperse as we zoom in, and we are currently not doing that exactly." Investigate aggregation/clustering settings.

---

### DP2-04 — DataONE: investigate and fix map vs sidebar count discrepancy (dedupe versions)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** High

**Bug.** Map shows one group with 1000+ datasets; right sidebar says "showing 20 of 878 data sets." Discrepancy to investigate. Hypothesis: DataONE has multiple versions of the same dataset; if the map treats each version as a different dot, counts will be inflated. Will: "We need to investigate... Does the map treat each version as a different dot or a different data set, or is this deduplicating? ... Double check that the map area is deduplicating data sets because there are multiple versions of the same data set, and we only want to show the latest version of the data set on the map."

---

### DP2-05 — DataONE: Save button styling — clarify saved vs unsaved state

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** High

The "Save data set view" button uses yellow, which is also used for "active" in the map layers widget. Confusion: is yellow indicating "already saved" or just "this is the active dataset"? Dan: "Is that yellow color indicating that the data set is already saved and pinned under map layers? Or is that just the color of the data set? I'm wondering if there's a way that once you click save data set, it has like a saved check mark... yellow color is indicative that it's already saved." Request: different color when saved; label like "Saved under pinned layers" or "Data view saved."

---

### DP2-06 — DataONE: persist saved state — show "Saved" when returning to saved dataset

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** High

When the user navigates away from a saved dataset and returns, the UI still shows "Save data set view" even though it's already saved. The app does not remember which datasets are saved. Dan: "When you leave... does that data set view saved come back up? No, it doesn't... It's not like a memory in the app of which data sets are saved or not." Request: persist saved state so that when returning to a saved dataset, it shows "Saved" (or equivalent) instead of the save button.

---

### DP2-07 — DataONE: multi-select categories filter (checklist)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Medium

Categories filter currently allows single selection. Dan: "Is it possible to filter by multiple categories? ... I think that would be nice. Cuz sometimes things fall into more than one category, and you might not know if things are categorized multiple ways. So like say you wanted infrastructure and water and you were interested in getting research about dams or something like that." Request: checklist/multi-select for categories.

---

### DP2-08 — DataONE: search by title AND abstract/keywords

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** High

Search currently appears to search title only. Dan: "Does that also search by things in the description? ... I'm wondering if you type in earth observations... that might be cool to be able to do like a key term search outside of the title." Will: "Add key word search such that we search both the title of the data set and also the abstract of the data set." Label could be "Search data sets by title or abstract."

---

### DP2-09 — DataONE: filter by file type (CSV, TIF, imagery, etc.)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Medium

Allow users to filter by the types of data/files included in each dataset. Dan: "If we could filter by the types of data included within each data set, so being able to filter by like I want CSV files, or like I want a Tiff, like the different file types associated with each data set, because if I'm looking for imagery specifically, it'd be nice just to be like show me imagery."

---

### DP2-10 — DataONE: saved indicator on browse cards (icon + subtle highlight)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Medium

When scrolling through dataset cards in the browse tab, show a visual indicator for datasets already saved to the map layers widget. Dan: "If you've like saved something, it could be nice to have like a saved icon or something just to show that you've got it saved as you're scrolling through." Will: "Subtle yellow highlight, maybe... plus probably like some yellow save icon SVG for the top right corner." Uses existing yellow = active/saved convention.

---

### DP2-11 — DataONE: search result highlight (keyword in abstract) — nice to have

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** DataONE  
**Priority:** Low

When search returns results, highlight the matching keyword in the abstract (like Google search). Dan: "That could be kind of cool... show the first place in the abstract where that keyword shows up." Will: "I don't think it's priority right now" — defer.

---

### DP2-12 — TNC ArcGIS: feature service overview in right sidebar (name, description, layers)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** TNC ArcGIS  
**Priority:** High

When viewing a layer from a feature service (e.g., Coastal and Marine data), the right sidebar shows the layer name but not the feature service name/description. Will: "I keep talking about TNC ArcGIS service, but I don't actually use the name of the feature service... I tell you the name of the layer at the top header. I'm not telling you about the name of the feature service." Dan: Model after ArcGIS item page — show feature service description, then list of layers and tables with types. "You get the description, but then you also get to see the individual layers associated with the feature service. You can see that there's a point layer, you can see that there's a non-spatial table associated with it."

---

### DP2-13 — TNC ArcGIS: clarify feature service vs category in left sidebar

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** TNC ArcGIS  
**Priority:** High

"Coastal and Marine data" appears in the left sidebar — Dan initially thought it was a category, but it's the feature service name. Layers (Shoreward 1, Shoreward 2, etc.) are sub-items. Will: "That needs to be made more clear visually in the left sidebar. The fact that it took this long is a sign that the design is to be modified." Make the hierarchy (feature service → layers) visually obvious.

---

### DP2-14 — TNC ArcGIS: "See table" button — pop-up table view for layers/tables

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** TNC ArcGIS  
**Priority:** Medium

Feature services can have non-spatial tables and spatial layers with attributes. Dan wants to view table data: "Maybe you're able to click on it and see like a table pop up just to view it... that could be a good thing if you just want to get a quick view of the table and see what the columns are." Will: "Click like a table, see table button in the right sidebar, and then they can have a pop-up in the map area that is like a classic just rows and columns table."

---

### DP2-15 — TNC ArcGIS: right sidebar layer selection syncs with left sidebar

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** TNC ArcGIS  
**Priority:** Medium

When the user selects a layer in the right sidebar (e.g., Kelp), the left sidebar should update to show that layer as selected, and vice versa. Bidirectional sync between left sidebar layer list and right sidebar layer selection.

---

### DP2-16 — TNC ArcGIS: design multi-layer feature service UX (pin for follow-up)

**Last Updated:** Feb 17, 2026 3:17 PM  
**Data Source:** TNC ArcGIS  
**Priority:** Low

Broader design question for feature services with multiple layers. Dan: "I need to think about what exactly... I just need to think about it." Will: "Let's put a pin in this... and then think about it, and then we'll touch base tomorrow." Defer detailed design; may spawn additional tasks after follow-up.

---

## Notes from Transcript (No Task Extracted)

- **DataONE search validation:** Dan tested search with "multi-spectral" — confirm it works.
- **Save behavior when saving another dataset:** Already works as desired — clicking another dataset and "Save data set view" creates a new pinned view; doesn't swap out the current one.
- **iNaturalist Edit Filters feedback:** Referenced from Pt 1 — "for the map layers widget when I click on the edit filters button for a pinned layer, we need the right sidebar to respond visually... and if I'm already on the edit screen, there should be some kind of visual response." Applies to DataONE as well per Will.
- **Non-spatial tables visibility:** Some layers don't show eyeball until pinned; non-spatial tables need to be pinned to view. Clarified during demo.
