# Extracted Tasks: Amy Feedback — Feb 17, 2026

**Meeting Date:** Feb 17, 2026, 1:34 PM  
**Source Transcript:** Amy Feedback Feb 17 at 1_34 PM.txt  
**Participants:** Amy, Will (and Trislin referenced)  
**Scope Reviewed:** iNaturalist, ANiML, Dendra

---

## Quick Task Summary

| ID | Status | Task Name | Person | Data Source | Priority | Last Updated |
|----|--------|------------|--------|-------------|----------|--------------|
| AF-01 | ⚪ Not Started | Add species-level filtering (currently taxa only) | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-02 | ⚪ Not Started | Species hierarchy: taxa → species list → observations per species | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-03 | ⚪ Not Started | Show result count in right sidebar (e.g., "92 observations") | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-04 | ⚪ Not Started | Edit filters: visual feedback when clicked (right sidebar flash) | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-05 | ⚪ Not Started | Edit filters: add green "Edit filters" label above Observations/Date range | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-06 | ⚪ Not Started | Synchronization between map and right sidebar | Trislin | iNaturalist | High | Feb 17, 2026 1:34 PM |
| AF-07 | ⚪ Not Started | Add spatial query (custom polygons) for layers | Trislin | All layers | Medium | Feb 17, 2026 1:34 PM |
| AF-08 | ⚪ Not Started | Investigate reptiles in ocean (iNaturalist location scrambling vs bug) | Trislin | iNaturalist | Medium | Feb 17, 2026 1:34 PM |
| AF-09 | ⚪ Not Started | Rename "Mountain lion" to "Puma" in ANiML | Trislin | ANiML | Medium | Feb 17, 2026 1:34 PM |
| AF-10 | ⚪ Not Started | Sort cameras by results (data-rich at top, zero-data at bottom) | Trislin | ANiML | Medium | Feb 17, 2026 1:34 PM |
| AF-11 | ⚪ Not Started | Dendra: multiple time series charts side-by-side (Trislin request) | Trislin | Dendra | High | Feb 17, 2026 1:34 PM |
| AF-12 | ⚪ Not Started | Dendra: filter by data stream name across stations | Trislin | Dendra | High | Feb 17, 2026 1:34 PM |
| AF-13 | ⚪ Not Started | Dendra: select multiple data streams from different stations | Trislin | Dendra | High | Feb 17, 2026 1:34 PM |
| AF-14 | ⚪ Not Started | Dendra: station click → auto-highlight in right sidebar | Trislin | Dendra | High | Feb 17, 2026 1:34 PM |
| AF-15 | ⚪ Not Started | Dendra: map layers widget auto-expand when adding child view | Trislin | Dendra | Medium | Feb 17, 2026 1:34 PM |
| AF-16 | ⚪ Not Started | Dendra: refine Export Builder | Trislin | Dendra | Medium | Feb 17, 2026 1:34 PM |
| AF-17 | ⚪ Not Started | Dendra: icon diagram for station vs data stream hierarchy | Trislin | Dendra | Low | Feb 17, 2026 1:34 PM |
| AF-18 | ⚪ Not Started | Get feedback from actual Dendra data users | Trislin | Dendra | Medium | Feb 17, 2026 1:34 PM |

---

## Task Descriptions

### AF-01 — Add species-level filtering (currently taxa only)

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

Currently iNaturalist supports taxa-level filtering only (e.g., reptiles, birds). Amy: "People often want to study like one species or figure out what's happening for one species." She confirmed species-level is probably high priority. Will: "If that's a high priority, we can add it."

---

### AF-02 — Species hierarchy: taxa → species list → observations per species

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

Amy's preferred flow: (1) Click taxa → (2) Right sidebar shows all species found in search area → (3) Toggle species (select all / clear all) → (4) See observations per species. "We skipped a step—we went from taxa to observations and skipped the middle, which is species." At species level, count like "13 two stripe garter snake observations" helps users know they have enough data before drilling in.

---

### AF-03 — Show result count in right sidebar (e.g., "92 observations")

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

Right sidebar shows "10 pages of results" but not total count. Amy wanted to see the number of observations (e.g., "92 observations"). Map Layers widget shows 92; right sidebar should match. Will: "The right sidebar needs to tell you how many results there are."

---

### AF-04 — Edit filters: visual feedback when clicked (right sidebar flash)

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

When user clicks "Edit filters" in Map Layers widget, the right sidebar should respond visually (e.g., flash or change) so the user realizes there's a relationship between the widget and the sidebar. Identified with Dan; applies to all layers.

---

### AF-05 — Edit filters: add green "Edit filters" label above Observations/Date range

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

Add a green title/label "Edit filters" above Observations and Date range in the right sidebar for all layers. Clarifies the connection between Map Layers widget "Edit filters" button and the filter section in the sidebar.

---

### AF-06 — Synchronization between map and right sidebar

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** High

Ensure map and right sidebar stay in sync. Trislin has raised this; Amy agreed. General principle applies across data sources.

---

### AF-07 — Add spatial query (custom polygons) for layers

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** All layers  
**Priority:** Medium

Custom polygon spatial query is not currently present for any of the layers. Dan has requested this multiple times.

---

### AF-08 — Investigate reptiles in ocean (iNaturalist location scrambling vs bug)

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** iNaturalist  
**Priority:** Medium

Reptiles (e.g., Coastal fence lizard) appear in the ocean on the map. Need to verify: (1) iNaturalist obscures locations for endangered/sensitive species (randomizes within a box), or (2) bug in how we place observations. Amy noted the ones on land look accurate; ocean placements are the issue.

---

### AF-09 — Rename "Mountain lion" to "Puma" in ANiML

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** ANiML  
**Priority:** Medium

"Mountain lion" may need to be renamed to "Puma" for clarity. Will noted during demo.

---

### AF-10 — Sort cameras by results (data-rich at top, zero-data at bottom)

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** ANiML  
**Priority:** Medium

In the camera section for ANiML, move cameras that have data to the top and cameras with zero data to the bottom. Sort by results count. Amy nodded in agreement.

---

### AF-11 — Dendra: multiple time series charts side-by-side (Trislin request)

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** High

Trislin requested the ability to see multiple time series charts, drag them around, and resize them. Amy: "People are going to want to add more than one variable and export it all at once."

---

### AF-12 — Dendra: filter by data stream name across stations

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** High

Filter that is aware of every data stream name. Example: "I want all of the air temp average" → then select stations. Amy: "Yes, if that's a thing that can happen." Use case: pull down all data for a variable (e.g., air temp max) across stations to interpolate an air temperature map for the preserve.

---

### AF-13 — Dendra: select multiple data streams from different stations

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** High

Amy: "What if I want Max air temp from Army Camp and from Tinta? How do I do that?" Currently the only way would be manual. Need UI or filter to select multiple data streams from different stations. Will: "Would it be beneficial to have a filter that is aware of every data stream name?"

---

### AF-14 — Dendra: station click → auto-highlight in right sidebar

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** High

When user clicks on a station on the map, it should automatically highlight/select that station in the right sidebar. Synchronization between map and sidebar. Trislin raised; Amy agreed.

---

### AF-15 — Dendra: map layers widget auto-expand when adding child view

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** Medium

When selecting a different data stream and creating a new child view, the Map Layers widget on the left should automatically expand. Currently may not.

---

### AF-16 — Dendra: refine Export Builder

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** Medium

Export Builder exists and supports selecting multiple data streams, but Will: "I'm not super stoked on it. It needs refinement." Short answer: yes, multi-variable export is possible, but the UI needs refinement.

---

### AF-17 — Dendra: icon diagram for station vs data stream hierarchy

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** Low

Will asked if a simple icon diagram (station object + data stream object) might help communicate the station → data stream relationship more quickly. Amy: "The only part that's unclear to me is because there are multiple data streams under each item." Iconography could help; flagged as lower priority.

---

### AF-18 — Get feedback from actual Dendra data users

**Last Updated:** Feb 17, 2026 1:34 PM  
**Data Source:** Dendra  
**Priority:** Medium

Amy: "These are not data that I use in my day-to-day. I can imagine that the people that do use them have specific ideas about what works and what doesn't." She offered to find someone who actually uses Dendra data. Focus efforts on the interactive data/chart side; map layer viewer may be less important to them.

---

## Notes from Transcript (No Task Extracted)

- **ANiML save view location:** Amy said pin/save view location "is good where it is" (Map Layers widget). No change needed.
- **Dendra station vs data stream:** Amy took a moment to understand but "not in a bad way." Hierarchy (stations → data streams) feels fine.
- **Meeting cut short:** Amy had to leave for another meeting. Follow-up scheduled for Feb 18, 1:30 PM. Other layers (TNC feature services, DroneDeploy) not reviewed.
- **Transcript tail:** End of file contains unrelated segment about wildfire resilience index dashboard (different meeting/session).
