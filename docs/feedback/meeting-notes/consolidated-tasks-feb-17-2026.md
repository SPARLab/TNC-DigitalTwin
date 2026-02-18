# Consolidated Feedback Tasks — Feb 17, 2026

**Sources:** Amy Feedback (1:34 PM) · Dan Pt 1 (1:00 PM) · Dan Pt 2 (3:17 PM) · Trisalyn (10:33 AM)  
**Consolidated by:** Will  
**Last Updated:** Feb 18, 2026

> **How to use this document:**  
> The Quick Task Summary below lists all deduplicated tasks. Tasks marked 🔴 **CONFLICT** require your manual resolution before implementation — see the [Conflicts to Resolve](#conflicts-to-resolve) section. All other tasks are ready to hand to a new chat window.

---

## Quick Task Summary

| ID | Status | Last Updated | Task Description | Notes |
|----|--------|--------------|------------------|-------|
| **— Cross-Cutting / Map Layers —** | | | | |
| CON-GL-01 | 🔴 CONFLICT | Feb 18, 2026 | Implement spatial queries (custom polygon draw) across all layers | Priority conflict: Amy=Medium, Dan=Super High |
| CON-GL-02 | ⚪ Not Started | Feb 18, 2026 | Spatial filter UI: place controls in right sidebar under date range | Dan Pt1 DP1-10 |
| CON-GL-03 | ⚪ Not Started | Feb 18, 2026 | Spatial filter: select polygon from a pinned map layer (extra credit / V2) | Dan Pt1 DP1-04 |
| CON-GL-04 | ⚪ Not Started | Feb 18, 2026 | Allow multiple expanded layers in Map Layers widget (user-controlled) | Dan Pt1 DP1-09; High priority |
| CON-GL-05 | ⚪ Not Started | Feb 18, 2026 | Edit Filters: visual feedback linking left widget → right sidebar (flash, attention) | Merged: AF-04, DP1-02, DP1-08 |
| CON-GL-06 | ⚪ Not Started | Feb 18, 2026 | Add "Edit Filters" section header/label in right sidebar | Merged: AF-05, DP1-07 |
| CON-GL-07 | ⚪ Not Started | Feb 18, 2026 | Fix map ↔ sidebar filter sync (name/state doesn't always update) | Merged: AF-06, DP1-06; bug |
| CON-GL-08 | ⚪ Not Started | Feb 18, 2026 | Auto-open or guide user to filter panel when "New View" is clicked | Dan Pt1 DP1-01 |
| **— iNaturalist —** | | | | |
| CON-INAT-01 | ⚪ Not Started | Feb 18, 2026 | Add species-level filtering (currently taxa only) | Amy AF-01; High |
| CON-INAT-02 | ⚪ Not Started | Feb 18, 2026 | Species hierarchy flow: taxa → species list → observations per species | Amy AF-02; High |
| CON-INAT-03 | ⚪ Not Started | Feb 18, 2026 | Show result count in right sidebar (e.g., "92 observations") | Amy AF-03; High |
| CON-INAT-04 | ⚪ Not Started | Feb 18, 2026 | Investigate reptile observations appearing in ocean (scrambling vs. bug) | Amy AF-08; Medium |
| CON-INAT-05 | ⚪ Not Started | Feb 18, 2026 | Export Builder: invert to cart metaphor (everything exports unless removed) | Trisalyn T2; High |
| CON-INAT-06 | ⚪ Not Started | Feb 18, 2026 | Species/taxa ordering: common species higher; UI for editing sort order | Trisalyn T15; Medium |
| **— ANiML —** | | | | |
| CON-ANIML-01 | ⚪ Not Started | Feb 18, 2026 | Map click on camera trap → auto-select in sidebar, show images | Trisalyn T1; High |
| CON-ANIML-02 | ⚪ Not Started | Feb 18, 2026 | Rename "Mountain lion" to "Puma" | Amy AF-09; Medium |
| CON-ANIML-03 | ⚪ Not Started | Feb 18, 2026 | Sort cameras by result count (data-rich at top, zero-data at bottom) | Amy AF-10; Medium |
| **— Dendra —** | | | | |
| CON-DENDRA-01 | ⚪ Not Started | Feb 18, 2026 | Map click on station → sync to right sidebar, open station | Merged: AF-14, T3; High |
| CON-DENDRA-02 | ⚪ Not Started | Feb 18, 2026 | Multiple time series charts side-by-side, draggable + resizable | Merged: AF-11, T4; High |
| CON-DENDRA-03 | ⚪ Not Started | Feb 18, 2026 | Select multiple data streams across stations; filter by stream name; no reset needed | Merged: AF-12, AF-13, T5; High |
| CON-DENDRA-04 | ⚪ Not Started | Feb 18, 2026 | Map Layers widget auto-expand when user adds a child view | Amy AF-15; Medium |
| CON-DENDRA-05 | ⚪ Not Started | Feb 18, 2026 | Refine Export Builder UX | Amy AF-16; Medium |
| CON-DENDRA-06 | ⚪ Not Started | Feb 18, 2026 | Review "Update View" / "Save as New View" language and sync | Trisalyn T6; Low |
| CON-DENDRA-07 | ⚪ Not Started | Feb 18, 2026 | Icon diagram for station → data stream hierarchy (onboarding aid) | Amy AF-17; Low |
| CON-DENDRA-08 | ⚪ Not Started | Feb 18, 2026 | Get feedback from actual Dendra data users | Amy AF-18; Medium |
| **— DroneDeploy —** | | | | |
| CON-DRONE-01 | ⚪ Not Started | Feb 18, 2026 | Bug: fix drone imagery not changing when toggling between flights | Trisalyn T9; High |
| CON-DRONE-02 | ⚪ Not Started | Feb 18, 2026 | Simplify project flights UI: name + date default, expand for metadata | Trisalyn T8; Medium-High |
| **— TNC ArcGIS —** | | | | |
| CON-ARCGIS-01 | 🔴 CONFLICT | Feb 18, 2026 | Right sidebar: show feature service overview AND layer-specific info | Scope conflict: Dan wants service-level, Trisalyn wants layer-level |
| CON-ARCGIS-02 | ⚪ Not Started | Feb 18, 2026 | Clarify feature service vs category hierarchy in left sidebar | Dan Pt2 DP2-13; High |
| CON-ARCGIS-03 | ⚪ Not Started | Feb 18, 2026 | "See table" button: pop-up table view for layers/non-spatial tables | Dan Pt2 DP2-14; Medium |
| CON-ARCGIS-04 | ⚪ Not Started | Feb 18, 2026 | Bidirectional sync: right sidebar layer selection ↔ left sidebar | Dan Pt2 DP2-15; Medium |
| CON-ARCGIS-05 | ⚪ Not Started | Feb 18, 2026 | Fix iframe to show TNC user-friendly Hub page (not raw feature service) | Trisalyn T11; Medium |
| CON-ARCGIS-06 | ⚪ Not Started | Feb 18, 2026 | Bug: Fix Union Pacific Railroad layer (layer ID 0 not found) | Dan Pt1 DP1-05; Medium |
| CON-ARCGIS-07 | ⚪ Not Started | Feb 18, 2026 | Design multi-layer feature service UX (pin for follow-up with Dan) | Dan Pt2 DP2-16; Low |
| **— DataONE —** | | | | |
| CON-DONE-01 | ⚪ Not Started | Feb 18, 2026 | Map cluster click → populate right sidebar with datasets at that location | Merged: DP2-01, T12; High |
| CON-DONE-02 | 🔴 CONFLICT | Feb 18, 2026 | Auto-zoom/sync map when selecting dataset (sidebar click vs "View on Map") | Scope conflict: T13 (saved datasets only) vs T14 (all datasets); also overlaps DP1-11 |
| CON-DONE-03 | ⚪ Not Started | Feb 18, 2026 | Pop-up/tooltip on cluster for scrolling through individual datasets | Dan Pt2 DP2-02; Medium |
| CON-DONE-04 | ⚪ Not Started | Feb 18, 2026 | Improve point dispersion as user zooms into clusters | Dan Pt2 DP2-03; Medium |
| CON-DONE-05 | ⚪ Not Started | Feb 18, 2026 | Bug: investigate + fix map vs sidebar count discrepancy (dedupe versions) | Dan Pt2 DP2-04; High |
| CON-DONE-06 | ⚪ Not Started | Feb 18, 2026 | Save button: distinguish saved vs unsaved state visually | Dan Pt2 DP2-05; High |
| CON-DONE-07 | ⚪ Not Started | Feb 18, 2026 | Persist saved state: show "Saved" when returning to already-saved dataset | Dan Pt2 DP2-06; High |
| CON-DONE-08 | ⚪ Not Started | Feb 18, 2026 | Multi-select categories filter (checklist) | Dan Pt2 DP2-07; Medium |
| CON-DONE-09 | ⚪ Not Started | Feb 18, 2026 | Search by title AND abstract/keywords | Dan Pt2 DP2-08; High |
| CON-DONE-10 | ⚪ Not Started | Feb 18, 2026 | Filter by file type (CSV, TIF, imagery, etc.) | Dan Pt2 DP2-09; Medium |
| CON-DONE-11 | ⚪ Not Started | Feb 18, 2026 | Saved indicator on browse cards (icon + subtle highlight) | Dan Pt2 DP2-10; Medium |
| CON-DONE-12 | ⚪ Not Started | Feb 18, 2026 | Export: metadata CSV + link to download from DataONE source | Dan Pt1 DP1-12; Medium |
| CON-DONE-13 | ⚪ Not Started | Feb 18, 2026 | Get Amy & Trisalyn feedback on export behavior (small vs large files) | Dan Pt1 DP1-13; Medium |
| CON-DONE-14 | ⚪ Not Started | Feb 18, 2026 | Search result highlight: show matching keyword in abstract | Dan Pt2 DP2-11; Low / Nice-to-have |

---

## Conflicts to Resolve

These are tasks where two or more stakeholders touched the **same feature area** but with **different priorities, scopes, or approaches**. You need to pick a direction before assigning these to a chat window.

---

### CONFLICT 1 — CON-GL-01: Spatial Query Priority

| | Amy (AF-07) | Dan (DP1-03) |
|---|---|---|
| **Priority** | Medium | **Super High** |
| **Scope** | "Add spatial query for layers" | "Spatial queries — Super high. Originally in the plan." |
| **Approach** | Custom polygon drawing | Custom polygon drawing (ArcGIS tool) |
| **Other notes** | Mentioned alongside other enhancements | Dan rated this the highest-priority item in Pt 1 |

**What you need to decide:**  
These are the same feature — the only disagreement is priority. Amy listed it as medium; Dan called it Super High. Given Dan's explicit priority rating and the fact that this was originally in the plan, **lean toward Super High** unless there's a reason to deprioritize.

**Suggested resolution:** Accept Dan's Super High priority. Implement as CON-GL-01 (high priority) before lower-priority iNaturalist enhancements.

---

### CONFLICT 2 — CON-ARCGIS-01: TNC ArcGIS Right Sidebar — Service-Level vs Layer-Level Info

| | Dan (DP2-12) | Trisalyn (T10) |
|---|---|---|
| **What they want in the sidebar** | Feature service overview: service name, description, then list of all layers/tables with types | Layer-specific info per layer, plus an info (i) button beside "TNC ArcGIS service" |
| **Mental model** | "Show me the whole feature service first, then I pick a layer" — modeled after ArcGIS item page | "When I click a specific layer, tell me about that layer specifically" |
| **Conflict type** | Information hierarchy (top-down vs layer-first) | |

**What you need to decide:**  
These wants are potentially **complementary** but need a single unified UX design:  
- Option A: Show service overview by default; when a specific layer is selected, the description updates to show layer-specific info.  
- Option B: Service overview is always visible; add an (i) button per layer for layer-specific info.  
- Option C: Two-panel or tabs: one tab for "Service info" (Dan's ask), one tab for "Layer info" (Trisalyn's ask).

**Suggested resolution:** Option A feels most natural — service overview sets context, then layer click updates the info. Confirm with Dan and Trisalyn.

---

### CONFLICT 3 — CON-DONE-02: DataONE Auto-Zoom — Scope Disagreement

| | Dan (DP1-11) | Trisalyn T13 | Trisalyn T14 |
|---|---|---|---|
| **Trigger** | Clicking a dataset (in sidebar/browse) | Selecting a **saved** dataset from sidebar | Selecting **any** dataset — eliminate "View on Map" button entirely |
| **What happens** | Map auto-zooms to dataset location | Map zooms + ArcGIS tooltip appears | Map auto-syncs; no manual "View on Map" needed |
| **Scope** | Any dataset click | Saved datasets only | All datasets |

**What you need to decide:**  
- T13 and T14 are from the same person (Trisalyn) and likely describe the same intention from two angles — she probably means "clicking any dataset (including saved ones) should auto-sync the map."  
- Dan's DP1-11 is consistent with this.  
- **The real question:** Does clicking a dataset in the browse tab (before saving) also auto-zoom? Or only after saving?  

**Suggested resolution:** Implement auto-zoom for all dataset selections (browse + saved), eliminating the need for a separate "View on Map" button click. Reconcile T13 and T14 into one implementation. Confirm behavior for the browse tab specifically.

---

## Task Details by Phase / Data Source

---

### Cross-Cutting / Map Layers

#### CON-GL-01 — Spatial Queries: Custom Polygon Draw (🔴 CONFLICT on priority — see above)

**Sources:** AF-07 (Amy, Medium), DP1-03 (Dan, Super High)  
**Recommended Priority:** High  
**Data Source:** All layers

Add custom polygon spatial query across all data layers. ArcGIS SDK should provide the drawing tool. Users need to filter by drawn area, preserve boundaries, etc. This was originally in the plan but not yet implemented. Placement: right sidebar, under date range filter (see CON-GL-02).

---

#### CON-GL-02 — Spatial Filter UI in Right Sidebar

**Sources:** DP1-10 (Dan)  
**Priority:** Medium  
**Data Source:** Cross-cutting

Spatial filter controls belong in the right sidebar browse tab, positioned below the date range filter. Options to include: (1) Draw your own polygon, (2) Preserve boundaries, (3) Select from pinned map layer (V2, see CON-GL-03).

---

#### CON-GL-03 — Spatial Filter: Select from Pinned Layer (Extra Credit / V2)

**Sources:** DP1-04 (Dan)  
**Priority:** Low  
**Data Source:** Cross-cutting

Allow users to select a polygon from a layer already pinned on the map (e.g., "Palama Watershed outline") and use it as the spatial filter for any other layer. V2 / extra credit — implement after basic draw-polygon.

---

#### CON-GL-04 — Allow Multiple Expanded Layers in Map Layers Widget

**Sources:** DP1-09 (Dan)  
**Priority:** High  
**Data Source:** Map Layers widget

Currently only one layer can be expanded at a time; switching collapses the previous. Dan wants to keep multiple layers expanded simultaneously — especially useful when comparing filters across layers. UX suggestion: a pin/caret per layer so users can opt into keeping it expanded. "Most important thing" for Dan's workflow.

---

#### CON-GL-05 — Edit Filters: Visual Feedback Linking Widget → Sidebar

**Sources:** AF-04 (Amy), DP1-02 (Dan), DP1-08 (Dan)  
**Priority:** High  
**Data Source:** All layers

When user clicks "Edit filters" in the Map Layers widget (left), the right sidebar should visually respond (e.g., flash/pulse) to make the connection clear. On large monitors the two panels are far apart; without feedback, the relationship is invisible. Additionally: when the user is **already** in edit mode and clicks "Edit filters" again, something should happen (e.g., re-flash the sidebar or indicate "you're already here") — currently it does nothing, which is jarring.

---

#### CON-GL-06 — "Edit Filters" Section Header in Right Sidebar

**Sources:** AF-05 (Amy), DP1-07 (Dan)  
**Priority:** Medium  
**Data Source:** All layers

Add a visible green "Edit filters" title/section header in the right sidebar above the filter controls (above Observations, Date Range, etc.). Makes the link between the left widget's "Edit filters" button and the sidebar explicit. Dan: "It'd be nice to see the title of the filter I'm editing."

---

#### CON-GL-07 — Fix Map ↔ Sidebar Filter Sync Bug

**Sources:** AF-06 (Amy), DP1-06 (Dan)  
**Priority:** High  
**Data Source:** All layers (especially iNaturalist)

Sometimes when filters change in the right sidebar, the child view name in the Map Layers widget does not update. Conversely, map state and sidebar state can drift. Investigate and fix reproduction path — Dan noted it's intermittent and hard to repro. Also applies as a general principle: map and sidebar should always stay in sync.

---

#### CON-GL-08 — Auto-Open Filter Panel When "New View" Is Clicked

**Sources:** DP1-01 (Dan)  
**Priority:** Medium  
**Data Source:** All layers with filtered child views

When creating a "New view," guide the user immediately to the filter controls in the right sidebar instead of requiring additional clicks (Edit filters → navigate). Could be a visual flash pointing to the sidebar, or automatically opening the filter panel.

---

### iNaturalist

#### CON-INAT-01 — Add Species-Level Filtering

**Sources:** AF-01 (Amy)  
**Priority:** High  
**Data Source:** iNaturalist

Currently filtering only supports taxa level (e.g., Reptiles, Birds). Add species-level filtering. Amy: "People often want to study one species or figure out what's happening for one species." Ties directly into CON-INAT-02 (the species hierarchy flow).

---

#### CON-INAT-02 — Species Hierarchy Flow: Taxa → Species List → Observations

**Sources:** AF-02 (Amy)  
**Priority:** High  
**Data Source:** iNaturalist

Current flow jumps from taxa → observations, skipping the species-selection step. Amy's preferred flow: (1) Select taxa → (2) Right sidebar shows all species found in the search area → (3) Toggle individual species (select all / clear all) → (4) See observations per species. Observation counts per species (e.g., "13 two-stripe garter snake observations") help users assess data density before drilling in.

---

#### CON-INAT-03 — Show Result Count in Right Sidebar

**Sources:** AF-03 (Amy)  
**Priority:** High  
**Data Source:** iNaturalist

Right sidebar shows "10 pages of results" but not the total count. Map Layers widget shows the count (e.g., 92); the sidebar should show the same number. Amy wanted: "92 observations" visible in the sidebar header or near the results.

---

#### CON-INAT-04 — Investigate Reptile Observations in Ocean

**Sources:** AF-08 (Amy)  
**Priority:** Medium  
**Data Source:** iNaturalist

Reptile observations (e.g., Coastal fence lizard) appear in the ocean. Two hypotheses: (1) iNaturalist location scrambling/obscuring for sensitive species (randomizes within a bounding box), or (2) bug in how we place observations. Land-based placements look accurate; ocean placements are the anomaly. Investigate and document finding before fixing.

---

#### CON-INAT-05 — Export Builder: Invert to Cart Metaphor

**Sources:** T2 (Trisalyn)  
**Priority:** High  
**Data Source:** iNaturalist

Current behavior: blue = selected for export (opt-in). Trisalyn wants: **everything in cart exports by default**; users explicitly remove items they don't want. Requirements:
- Replace opt-in blue selection with a "Remove from export" action
- Removed items: gray out the row (don't delete); they stay on the map layers but are excluded from export
- Cart state persists when modal is closed and reopened; removed items stay removed

---

#### CON-INAT-06 — Species/Taxa Ordering: Common Species Higher

**Sources:** T15 (Trisalyn)  
**Priority:** Medium  
**Data Source:** iNaturalist / General species

Trisalyn: "I want the more general and commonly used ones to pop up higher." Dan has a feature service for the species catalog. Need a UI or admin tool to configure sort order so common species surface first.

---

### ANiML

#### CON-ANIML-01 — Map Click on Camera Trap → Auto-Select in Sidebar

**Sources:** T1 (Trisalyn)  
**Priority:** High  
**Data Source:** ANiML

Clicking a camera trap icon on the map should: (1) select that camera in the cameras dropdown in the right sidebar, (2) collapse species/date range section, (3) show images for that camera. Trisalyn's map-first design principle: the map drives the sidebar.

---

#### CON-ANIML-02 — Rename "Mountain Lion" to "Puma"

**Sources:** AF-09 (Amy)  
**Priority:** Medium  
**Data Source:** ANiML

Rename the "Mountain lion" label to "Puma" in the ANiML interface.

---

#### CON-ANIML-03 — Sort Cameras by Result Count

**Sources:** AF-10 (Amy)  
**Priority:** Medium  
**Data Source:** ANiML

In the camera list, move cameras with data to the top; cameras with zero data sink to the bottom. Sort by result count descending.

---

### Dendra

#### CON-DENDRA-01 — Map Click on Station → Sync to Right Sidebar

**Sources:** AF-14 (Amy), T3 (Trisalyn)  
**Priority:** High  
**Data Source:** Dendra

When user clicks a Dendra station point on the map, the right sidebar should auto-select and open that station, showing its data streams. Map-first interaction (Trisalyn's cross-cutting design principle).

---

#### CON-DENDRA-02 — Multiple Time Series Charts Side-by-Side (Draggable + Resizable)

**Sources:** AF-11 (Amy), T4 (Trisalyn)  
**Priority:** High  
**Data Source:** Dendra

Users need to compare multiple data streams visually at the same time. Requirements:
- Pin multiple data streams (one at a time, but multiple remain visible)
- Show multiple time series charts simultaneously (side-by-side or stacked)
- Charts should be draggable and resizable
- Amy use case: "Pull all data for air temp max across stations to interpolate an air temp map"
- Trisalyn use case: "Compare wind sensor profiles between two stations"

---

#### CON-DENDRA-03 — Multi-Stream Selection: Filter by Name + No Reset Required

**Sources:** AF-12 (Amy), AF-13 (Amy), T5 (Trisalyn)  
**Priority:** High  
**Data Source:** Dendra

Three interrelated asks:
1. **Filter by data stream name across stations** (AF-12): "I want all air temp average" → select relevant stations → see data. Useful for cross-station variable comparison.
2. **Select streams from different stations** (AF-13): "Max air temp from Army Camp AND from Tinta" — currently requires manual workaround.
3. **No reset required to pin multiple streams** (T5): Trisalyn: "I don't understand why I need to reset to pin multiple things."

These likely need to be implemented together as a cohesive multi-select / cross-station filter UX.

---

#### CON-DENDRA-04 — Map Layers Widget Auto-Expand When Child View Added

**Sources:** AF-15 (Amy)  
**Priority:** Medium  
**Data Source:** Dendra

When the user adds a new data stream / child view, the Map Layers widget should automatically expand to show it. Currently may not.

---

#### CON-DENDRA-05 — Refine Export Builder

**Sources:** AF-16 (Amy)  
**Priority:** Medium  
**Data Source:** Dendra

Export Builder exists and supports multi-stream selection, but the UI needs refinement. Will: "I'm not super stoked on it." Short-term: keep it functional; medium-term: improve UX. Coordinate with CON-DENDRA-02 (multi-chart layout) as they're related workflows.

---

#### CON-DENDRA-06 — Review "Update View" / "Save as New View" Language

**Sources:** T6 (Trisalyn)  
**Priority:** Low  
**Data Source:** Dendra

The "Update View" and "Save as New View" terminology caused confusion around how views sync with map layers. Mark for a design iteration. Will: "Needs some thought."

---

#### CON-DENDRA-07 — Icon Diagram for Station → Data Stream Hierarchy

**Sources:** AF-17 (Amy)  
**Priority:** Low  
**Data Source:** Dendra

A simple icon/diagram showing the relationship between stations and data streams could reduce onboarding friction. Amy understood after walking through it but noted the multiple-data-streams-per-station part was initially unclear.

---

#### CON-DENDRA-08 — Get Feedback from Actual Dendra Data Users

**Sources:** AF-18 (Amy)  
**Priority:** Medium  
**Data Source:** Dendra

Amy offered to connect with someone who actually uses Dendra data daily. They will have more specific and grounded feedback than people who reviewed it in passing. Focus should be on the interactive chart/time series side; map layer viewer may matter less to them.

---

### DroneDeploy

#### CON-DRONE-01 — Bug: Drone Imagery Not Changing When Toggling Flights

**Sources:** T9 (Trisalyn)  
**Priority:** High  
**Data Source:** DroneDeploy

When toggling between project flights in the sidebar, the map imagery appears identical across different flights. "It really genuinely looks like we are just looking at the same imagery." Log and fix as a bug.

---

#### CON-DRONE-02 — Simplify Project Flights UI (Name + Date Default, Expand for Metadata)

**Sources:** T8 (Trisalyn)  
**Priority:** Medium-High  
**Data Source:** DroneDeploy

Flight cards are visually noisy with too many buttons. Simplify to:
- Default view: flight name + date only
- Metadata (collection Tiff, WMTS, etc.) behind an expand/collapse
- Smaller card size
- Trisalyn's suggested primary info: "Flight number, then file type"

---

### TNC ArcGIS

#### CON-ARCGIS-01 — Right Sidebar: Feature Service Overview + Layer-Specific Info (🔴 CONFLICT — see above)

**Sources:** DP2-12 (Dan), T10 (Trisalyn)  
**Priority:** High  
**Data Source:** TNC ArcGIS

**Dan's ask (DP2-12):** Show the feature service name, description, and a list of all sub-layers/tables in the right sidebar — modeled after the ArcGIS item page.  
**Trisalyn's ask (T10):** When clicking individual layers (e.g., Bathymetric Contours), show layer-specific info. Add an info (i) button for more detail about the specific layer.  

**Conflict:** Dan wants service-level context first; Trisalyn wants layer-level detail on click. These may be complementary but need a single unified UX decision (see Conflicts section above).

---

#### CON-ARCGIS-02 — Clarify Feature Service vs Category in Left Sidebar

**Sources:** DP2-13 (Dan)  
**Priority:** High  
**Data Source:** TNC ArcGIS

"Coastal and Marine data" appears in the left sidebar looking like a category, but it's actually a feature service name. Sub-items (Shoreward 1, Shoreward 2, etc.) are its layers. Dan initially misread it as a category. The hierarchy (feature service → layers) needs to be visually clear.

---

#### CON-ARCGIS-03 — "See Table" Button: Pop-Up Table View

**Sources:** DP2-14 (Dan)  
**Priority:** Medium  
**Data Source:** TNC ArcGIS

Feature services include non-spatial tables and spatial layers with attributes. Add a "See table" button in the right sidebar that opens a pop-up showing the table as rows and columns. "Just to get a quick view of the table and see what the columns are."

---

#### CON-ARCGIS-04 — Bidirectional Sync: Right Sidebar Layer ↔ Left Sidebar

**Sources:** DP2-15 (Dan)  
**Priority:** Medium  
**Data Source:** TNC ArcGIS

When user selects a layer in the right sidebar (e.g., Kelp), the left sidebar should update to reflect that selection, and vice versa.

---

#### CON-ARCGIS-05 — Fix iframe: Show TNC Hub User-Friendly Page

**Sources:** T11 (Trisalyn)  
**Priority:** Medium  
**Data Source:** TNC ArcGIS

The iframe currently shows the raw ArcGIS feature service page — not user-friendly. Find and use the TNC Hub user-facing detail page URL instead.

---

#### CON-ARCGIS-06 — Bug: Fix Union Pacific Railroad Layer (Layer ID 0 Not Found)

**Sources:** DP1-05 (Dan)  
**Priority:** Medium  
**Data Source:** TNC ArcGIS

Error: "ArcGIS error. The requested layer, layer ID 0, was not found." Affects Union Pacific Railroad feature service and possibly a few others. Investigate and fix.

---

#### CON-ARCGIS-07 — Design Multi-Layer Feature Service UX (Pinned for Follow-Up)

**Sources:** DP2-16 (Dan)  
**Priority:** Low  
**Data Source:** TNC ArcGIS

Broader design question about how feature services with many layers should work in the UI. Dan: "I need to think about it." Defer until follow-up with Dan; may spawn new tasks.

---

### DataONE

#### CON-DONE-01 — Map Cluster Click → Populate Right Sidebar

**Sources:** DP2-01 (Dan), T12 (Trisalyn)  
**Priority:** High  
**Data Source:** DataONE

Clicking a clustered group on the map (e.g., "108" or "4") should populate the right sidebar with those specific datasets. Both Dan and Trisalyn requested this independently with consistent intent.

---

#### CON-DONE-02 — Auto-Zoom/Sync Map When Selecting Dataset (🔴 CONFLICT — see above)

**Sources:** DP1-11 (Dan), T13 (Trisalyn), T14 (Trisalyn)  
**Priority:** High  
**Data Source:** DataONE

Map should auto-zoom to a dataset's location when selected — no manual "View on Map" click required. Scope question: does this apply to browse-tab selections only, saved dataset selections only, or all dataset selections? See Conflicts section for full analysis.

---

#### CON-DONE-03 — Pop-Up on Cluster for Scrolling Individual Datasets

**Sources:** DP2-02 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

ArcGIS clustering can display a pop-up where the user scrolls through attributes of items in the cluster. Secondary to CON-DONE-01 (right sidebar approach), but complementary.

---

#### CON-DONE-04 — Improve Point Dispersion When Zooming In

**Sources:** DP2-03 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

Clustered points should disperse more as user zooms in. Investigate clustering/aggregation minimum level settings.

---

#### CON-DONE-05 — Bug: Map vs Sidebar Count Discrepancy (Deduplicate Versions)

**Sources:** DP2-04 (Dan)  
**Priority:** High  
**Data Source:** DataONE

Map shows 1000+ items; right sidebar shows 878. Hypothesis: DataONE has multiple versions of the same dataset, and the map counts each version as a separate dot. Verify deduplication — only the latest version of each dataset should be shown.

---

#### CON-DONE-06 — Save Button: Distinguish Saved vs Unsaved State

**Sources:** DP2-05 (Dan)  
**Priority:** High  
**Data Source:** DataONE

Yellow is used for both "active layer" in Map Layers widget and the "Save data set view" button — causing confusion. When a dataset is saved, the button should clearly indicate it (e.g., checkmark, "Saved under pinned layers," different color or label).

---

#### CON-DONE-07 — Persist Saved State Across Navigation

**Sources:** DP2-06 (Dan)  
**Priority:** High  
**Data Source:** DataONE

When user navigates away from a saved dataset and returns, the UI reverts to "Save data set view" — no memory that it was already saved. Implement persistent saved state so returning to a saved dataset shows the saved indicator.

---

#### CON-DONE-08 — Multi-Select Categories Filter (Checklist)

**Sources:** DP2-07 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

Categories filter currently allows single selection. Add checklist / multi-select so users can filter by multiple categories at once (e.g., Infrastructure + Water).

---

#### CON-DONE-09 — Search by Title AND Abstract/Keywords

**Sources:** DP2-08 (Dan)  
**Priority:** High  
**Data Source:** DataONE

Current search appears to be title-only. Extend to also search dataset abstracts and keywords. Update label to "Search by title or abstract." Dan: "Key term search outside of the title" is valuable for discovery.

---

#### CON-DONE-10 — Filter by File Type (CSV, TIF, Imagery, etc.)

**Sources:** DP2-09 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

Allow users to filter datasets by the types of files included (CSV, GeoTIFF, imagery, etc.). Useful for users who know upfront what format they need.

---

#### CON-DONE-11 — Saved Indicator on Browse Cards

**Sources:** DP2-10 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

While scrolling through browse cards, show a subtle visual indicator (icon + highlight) on datasets that have already been saved to Map Layers. Existing yellow = active convention could carry over.

---

#### CON-DONE-12 — Export: Metadata CSV + Link to Download Source

**Sources:** DP1-12 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

For V1 export: provide a CSV of metadata (title, description, etc.) with a link to the actual data on DataONE. We are not hosting data, just making it discoverable. Avoid proxying large downloads.

---

#### CON-DONE-13 — Get Amy & Trisalyn Feedback on DataONE Export Behavior

**Sources:** DP1-13 (Dan)  
**Priority:** Medium  
**Data Source:** DataONE

Dan agreed with the two-scenario export approach (small files via API, large files redirect to DataONE) but deferred to Amy and Trisalyn for final direction. Follow up with them.

---

#### CON-DONE-14 — Search Result Highlight: Keyword in Abstract

**Sources:** DP2-11 (Dan)  
**Priority:** Low / Nice-to-have  
**Data Source:** DataONE

When search returns results, highlight the matching keyword in the abstract (Google-style). Will flagged as not priority; defer.

---

## Deduplication Log

The following source task IDs were merged into consolidated tasks. Use this table to trace back to original source documents.

| Consolidated ID | Merged Source IDs | Merge Rationale |
|----------------|-------------------|-----------------|
| CON-GL-01 | AF-07, DP1-03 | Same task (spatial polygon query); only priority differed → CONFLICT flagged |
| CON-GL-05 | AF-04, DP1-02, DP1-08 | All request visual feedback on Edit Filters click; DP1-08 adds the "already in edit mode" edge case |
| CON-GL-06 | AF-05, DP1-07 | Same request: "Edit Filters" label/header in right sidebar |
| CON-GL-07 | AF-06, DP1-06 | Same bug: map ↔ sidebar sync |
| CON-ARCGIS-01 | DP2-12, T10 | Same area (right sidebar info for ArcGIS layers) but different focus levels → CONFLICT flagged |
| CON-DENDRA-01 | AF-14, T3 | Identical: map station click → sidebar sync |
| CON-DENDRA-02 | AF-11, T4 | Identical: multiple time series charts, draggable/resizable |
| CON-DENDRA-03 | AF-12, AF-13, T5 | All about multi-stream selection / removing friction from pinning multiple streams |
| CON-DONE-01 | DP2-01, T12 | Identical: map cluster click → right sidebar population |
| CON-DONE-02 | DP1-11, T13, T14 | Same intent (auto-zoom on dataset select); scope of T13 vs T14 creates ambiguity → CONFLICT flagged |

---

## Design Principle (Cross-Cutting, from Trisalyn)

> "Your design thinks about how people are going to interact with these things [right sidebar], but my mind thinks about how I'm going to interact with this thing [the map]. I will drive my queries through the map."

**Map-first interactions:** The map should be the primary driver of what shows in the right sidebar. Clicking any map feature (camera, station, cluster, point) should automatically update the sidebar with context about that feature. This principle applies across ANiML, Dendra, DataONE, and TNC ArcGIS — and should inform how CON-GL-08, CON-ANIML-01, CON-DENDRA-01, CON-DONE-01, and CON-DONE-02 are implemented.
