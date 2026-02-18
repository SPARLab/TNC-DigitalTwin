# Phase 1: iNaturalist — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 1 tasks. Add new completions here with timestamp.

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| Task 13 | ✅ | Feb 11, 2026 | Fix iNaturalist Layer Icons & Loading | GraphicsLayer, local filtering |
| Task 14 | ✅ | Feb 12, 2026 | Observation Card Click → Map Highlight + Detail View | |
| Task 15 | ✅ | Feb 12, 2026 | Map Marker Click → Zoom + Detail View | |
| Task 16 | ✅ | Feb 13, 2026 | Remove Bookmark Button/Action | Stubbed |
| Task 17 | ✅ | Feb 13, 2026 | Compact Filter Section (Dropdown) | |
| Task 18 | ✅ | Feb 13, 2026 | Rename Legend Widget Title | "iNaturalist Taxa" |
| Task 19 | ✅ | Feb 13, 2026 | Add Observation Search Bar | |
| Task 20 | ✅ | Feb 13, 2026 | Reduce Pagination to 10 per Page | |
| Task 21 | ✅ | Feb 13, 2026 | Add Date Range Filter | |
| Task 22 | ✅ | Feb 13, 2026 | Remember Last Active Tab | Per-layer tab memory |
| Task 25 | ✅ | Feb 13, 2026 | Sync Filters with Map Layers Widget | |
| Task 26 | ✅ | Feb 13, 2026 | Dynamic View Names from Filters | |
| Task 27 | ✅ | Feb 13, 2026 | User-Renamable Filtered Views | |
| Task 28 | ✅ | Feb 13, 2026 | Detail View Crash on Observation Click | Hook-order fix |

---

## Task Details

### Task 13: Fix iNaturalist Layer Icons & Loading

**Goal:** Wrong/fake icons before layer active; delay on layer click; slow taxa filter in legend.

**Implementation:** Replaced FeatureLayer with spatially-filtered GraphicsLayer. Local filtering. Removed dummy data. Instant filtering; starts hidden.

### Task 14: Observation Card Click → Map Highlight + Detail View

**Goal:** Clicking observation card in right sidebar should open detail view, pan/zoom map to observation, highlight marker, show popup.

**Implementation:** `onViewDetail` calls `setSelectedObs` + `handleViewOnMap`. `handleViewOnMap`: await `goTo()`, find graphic in GraphicsLayer, `view.openPopup()`. ArcGIS native highlight (no custom cyan circle).

### Task 15: Map Marker Click → Zoom + Detail View

**Goal:** Clicking observation marker on map should zoom to observation and open detail view in right sidebar.

**Implementation:** Extended `ActiveLayer` with `featureId`. Map click handler in `useINaturalistMapBehavior` via `view.hitTest()`. Auto-opens detail view when `activeLayer.featureId` set. RightSidebar auto-switches to Browse tab when map observation clicked.

### Task 16: Remove Bookmark Button/Action

**Goal:** Clean up unused bookmark logic from observation cards (DFT-046: bookmarks merged into Map Layers).

**Implementation:** Bookmark button stubbed as TODO "Save as View".

### Task 17: Compact Filter Section (Dropdown)

**Goal:** Filter Observations in Browse tab: tall list → dropdown; include Select All.

**Implementation:** Taxon filter as dropdown with Select All/Clear All. Fits DFT-038 Filter Section anatomy.

### Task 18: Rename Legend Widget Title

**Goal:** Change "Filter Observations" → "iNaturalist Taxa" in floating legend widget.

**Implementation:** Updated INaturalistLegendWidget header text.

### Task 19: Add Observation Search Bar

**Goal:** Search observations by common/scientific name in Browse tab.

**Implementation:** Search input above filter section. Case-insensitive substring match on both names. 300ms debounce. Clear button (X) when text entered. Resets to page 1 on search change.

### Task 20: Reduce Pagination to 10 per Page

**Goal:** Change PAGE_SIZE from 20 → 10.

**Implementation:** Updated `useINaturalistObservations.ts`.

### Task 21: Add Date Range Filter

**Goal:** Add start/end date pickers in Browse tab filter section.

**Implementation:** Native date inputs, Clear button, min/max constraints. ArcGIS returns `observed_on` as epoch-ms; added `normalizeDate()` in INaturalistFilterContext for YYYY-MM-DD comparisons.

### Task 22: Remember Last Active Tab

**Goal:** Per-layer tab memory. Restore Overview vs Browse when reactivating layer.

**Implementation:** RightSidebar persists tab per layer in state; restores on reactivation. First visit defaults to Overview (DFT-006). Edit Filters still opens Browse.

### Task 25: Sync Filters with Map Layers Widget

**Goal:** Date + taxon filters sync bidirectionally between Browse tab and Map Layers widget. Edit Filters opens Browse with pre-applied filters.

**Implementation:** LayerContext sync. Map markers filter by date + taxa. Fixed infinite loop (hydrate/sync oscillation) and pin-transition sync.

### Task 26: Dynamic View Names from Filters

**Goal:** Child view names auto-generate from active filters (e.g., "Birds, Mammals, Reptiles" or date range).

**Implementation:** Per-data-source auto-name builder. When `isNameCustom` is false, auto-name updates on filter sync.

### Task 27: User-Renamable Filtered Views

**Goal:** Child views can be renamed inline in Map Layers widget. Custom names persist.

**Implementation:** Inline rename in PinnedLayerChildRow. `isNameCustom` guard: if true, auto-name never overwrites.

### Task 28: Detail View Crash on Observation Click

**Goal:** Fix crash when clicking observation card to open detail view.

**Implementation:** Root cause: early return in INaturalistBrowseTab before hooks caused "Rendered fewer hooks than expected." Moved detail-view return after all hooks. Hardened `handleViewOnMap` with try/catch and coordinate validation.

---

## Manual Testing Checklist

- [ ] **Layer activation:** Click iNaturalist in left sidebar → right sidebar shows Overview/Browse tabs
- [ ] **Map markers:** Observations appear on map when layer active
- [ ] **Observation card click:** Click card → detail view opens, map zooms, marker highlighted
- [ ] **Map marker click:** Click marker on map → zooms to observation, detail view opens
- [ ] **Filters:** Taxon dropdown, date range, search bar work; results update
- [ ] **Filter sync:** Edit Filters from Map Layers opens Browse with filters applied
- [ ] **View names:** Child view names update from active filters; manual rename persists
- [ ] **Legend:** "iNaturalist Taxa" shows taxa with counts; filter icon toggles visibility

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`
- **Master plan:** `docs/master-plan.md`
