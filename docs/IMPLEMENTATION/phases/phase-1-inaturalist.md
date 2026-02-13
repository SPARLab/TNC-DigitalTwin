# Phase 1: iNaturalist Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 9 / 11 tasks complete  
**Branch:** `v2/inaturalist`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD  
**Last Updated:** February 13, 2026

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Quick Task Summary

**Active iNaturalist development tasks (ordered by priority).**

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 13 | **Fix iNaturalist Layer Icons & Loading** | ✅ | High | Replaced FeatureLayer with spatially-filtered GraphicsLayer; local filtering; removed dummy data |
| 14 | **iNaturalist: Observation Card Click → Map Highlight + Detail View** | ✅ | High | Click obs card: highlight map marker, show tooltip, navigate to detail page |
| 15 | **iNaturalist: Map Marker Click → Zoom + Detail View** | ✅ | High | Click map marker: zoom to observation, open detail view in right sidebar |
| 16 | **iNaturalist: Remove Bookmark Button/Action** | ✅ | Low | Already stubbed; clean up unused bookmark logic from observation cards |
| 17 | **iNaturalist: Compact Filter Section (Dropdown)** | ✅ | Medium | Filter Observations in Browse tab: tall list → dropdown; include Select All |
| 18 | **iNaturalist: Rename Legend Widget Title** | ✅ | Low | Change "Filter Observations" → "iNaturalist Taxa" in floating legend widget |
| 19 | **iNaturalist: Add Observation Search Bar** | ✅ | Medium | Search observations by common/scientific name in Browse tab |
| 20 | **iNaturalist: Reduce Pagination to 10 per Page** | ✅ | Low | Change PAGE_SIZE from 20 → 10 in useINaturalistObservations |
| 21 | **iNaturalist: Add Date Range Filter** | ✅ | Medium | Add start/end date pickers in Browse tab filter section |
| 22 | **iNaturalist: Remember Last Active Tab** | ⚪ | Low | Persist Overview vs Browse tab per layer; restore on reactivation |
| 25 | **iNaturalist: Sync Filters with Map Layers Widget** | ⚪ | Medium | Apply date + taxon filters to Map Layers widget; show current filters per view; Edit Filters opens Browse with those filters pre-applied |

**Active tasks remaining:** 2  
**Recently completed:** Task 21 (Add Date Range Filter) ✅ (Feb 13), Task 20 (Reduce Pagination to 10 per Page) ✅ (Feb 13), Task 19 (Add Observation Search Bar) ✅ (Feb 13), Task 18 (Rename Legend Widget Title) ✅ (Feb 13), Task 16 (Remove Bookmark Button) ✅ (Feb 13), Task 17 (Compact Filter Section) ✅ (Feb 13), Task 14 (Observation Card Click → Map Highlight + Detail View) ✅ (Feb 12), Task 15 (Map Marker Click → Zoom + Detail View) ✅ (Feb 12), Task 13 (iNaturalist Layer Icons & Loading) ✅ (Feb 11)

---

## Phase Goal

Implement the iNaturalist observations browse experience in the right sidebar. This is the **simplest** data source because observations are **self-contained rows** (no Level 3 related data).

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02b-browse-inaturalist.html`

## Key Paradigm Notes

- **Row Type:** Self-contained (the observation IS the data)
- **Bookmark Options:** Only "Bookmark" (no "Bookmark with Filter")
- **No Level 3:** There's nothing to query beyond the observation itself

---

## Original Phase Tasks (High-Level)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1.1 | Query iNaturalist service to understand attributes | 🟢 Complete | | Completed during Task 13 implementation |
| 1.2 | Create iNaturalist right sidebar shell | 🟢 Complete | | INaturalistBrowseTab, OverviewTab, DetailView created |
| 1.3 | Implement filter UI (taxon, species, date, etc.) | 🟢 Complete | | Taxa filter (Task 17), date range (Task 21), search bar (Task 19) |
| 1.4 | Implement observation list with cards | 🟢 Complete | | Tasks 14-19 complete |
| 1.5 | Implement observation detail view | 🟢 Complete | | Task 14 complete |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 1.1: Query iNaturalist Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the iNaturalist feature service.

**Acceptance Criteria:**
- [ ] Document all available attributes on the feature service
- [ ] Identify which attributes are useful for filtering
- [ ] Identify which attributes should display in observation cards
- [ ] Note any data quality issues or gaps

**Questions to Answer:**
- What taxon/species fields are available?
- What date fields are available?
- What observer info is available?
- Are photo URLs included?
- What's the typical response time for queries?

**Output:** Add findings to this document under "Service Analysis" section below.

---

### 1.2: Create iNaturalist Right Sidebar Shell

**Goal:** Set up the component structure for the iNaturalist browse experience.

**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.

**Acceptance Criteria:**
- [ ] Component renders when iNaturalist layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] **Overview tab is the default/active tab**
- [ ] Overview tab includes prominent "Browse Features →" button to navigate to Browse tab
  - [ ] Button is full-width within sidebar content area
  - [ ] Button uses primary styling: TNC green background (`#2e7d32`), white text
  - [ ] Button minimum height: 44px (accessibility/Fitts's Law)
  - [ ] Button label: "Browse Features →" (arrow inline with text, Unicode U+2192 or SVG)
  - [ ] Placement: bottom of Overview tab content (or top if Overview is minimal < 3 sentences)
  - [ ] Hover state: slight color shift + subtle scale (1.02x)
  - [ ] Focus state: 2px outline for keyboard navigation
  - [ ] Click behavior: navigates to Browse tab with 150-200ms ease-out crossfade transition
- [ ] Component receives active layer info from parent

**Files to Create:**
- `src/v2/components/RightSidebar/iNaturalist/INaturalistSidebar.tsx`
- `src/v2/components/RightSidebar/iNaturalist/INaturalistBrowseTab.tsx`
- `src/v2/components/RightSidebar/iNaturalist/INaturalistOverviewTab.tsx`
- `src/v2/components/RightSidebar/iNaturalist/INaturalistExportTab.tsx`

---

### 1.3: Implement Filter UI

**Goal:** Create the filter controls for querying observations.

**Design Decision (Feb 5, 2026):** Resolved DFT-039 — Auto-apply everywhere. No Apply button. Dropdowns fire immediately on change. Text search debounced at 500ms (2+ chars). Date range fields fire on calendar close/blur. `AbortController` cancels in-flight requests. Loading feedback per DFT-018. Result count updates continuously.

**Acceptance Criteria:**
- [ ] Taxon dropdown/search (fires immediately on change)
- [ ] Species dropdown/search (filtered by taxon, fires immediately on change)
- [ ] Date range picker (fires on calendar close/blur per field)
- [ ] Research grade checkbox (fires immediately on change)
- [ ] **No Apply button** — all filters auto-apply (DFT-039)
- [ ] `AbortController` cancels in-flight requests when new filter state arrives
- [ ] Loading feedback per DFT-018 thresholds (stale results with opacity overlay, not blanked)
- [ ] Result count footer: "Showing X of Y observations" (updates continuously)
- [ ] Filters update the pinned layer's activeQuery
- [ ] Uses shared `FilterSection` component (DFT-038)

**Reference:** Mockup `02b-browse-inaturalist.html` filter section

---

### 1.4: Implement Observation List with Cards

**Goal:** Display filtered observations as browseable cards.

**Acceptance Criteria:**
- [x] Cards show: species name, observer, date, location
- [x] Cards show photo thumbnail (if available)
- [x] Clicking card opens detail view AND triggers map: pan + zoom to observation, highlight marker, open popup (Task 14, Feb 12)
- [x] "View on Map" button also pans + zooms + highlights + opens popup
- [x] ~~"Bookmark" button~~ — **Removed (Task 16, Feb 13)** per DFT-046 design decision (Save as View deferred)
- [x] "iNaturalist" button links to iNaturalist.org (label changed from "iNat" for clarity, Feb 13)
- [x] List is paginated or virtualized for performance
- [x] **Search bar added (Task 19, Feb 13):** Text input searches common/scientific names with 300ms debounce, clear button, no layout shift on focus

**Reference:** Mockup `02b-browse-inaturalist.html` results section

---

### 1.5: Implement Observation Detail View

**Goal:** When user clicks an observation, show expanded details.

**Acceptance Criteria:**
- [ ] Detail view shows full observation data
- [ ] Larger photo display
- [ ] All metadata visible
- [ ] "Back to list" navigation
- [ ] Same actions available (View on Map, Open in iNaturalist) — Bookmark removed per Task 16

---

## Detailed Task Breakdown

### Task 13: Fix iNaturalist Layer Icons & Loading

**Status:** ✅ Complete (Feb 11, 2026)

**Goal:** Fix wrong/fake icons before layer is active, eliminate delay on layer click, and improve slow taxa filtering in legend widget.

**Implementation:**
- Replaced FeatureLayer (no spatial filter, loaded all US data) with GraphicsLayer populated from locally-cached observations (expanded preserve bounding box)
- Legend counts computed locally (eliminated 11 API calls)
- Instant taxon filtering
- Layer starts hidden

**Files:**
- `INaturalistFilterContext.tsx`
- `inaturalistLayer.ts`
- `useMapLayers.ts`
- `INaturalistLegendWidget.tsx`
- `useINaturalistObservations.ts`
- `LayerContext.tsx`
- `MapContainer.tsx`

---

### Task 14: Observation Card Click → Map Highlight + Detail View

**Status:** ✅ Complete (Feb 12, 2026)

**Goal:** Clicking an observation card in Browse tab should:
1. Open detail view in right sidebar
2. Pan + zoom map to observation
3. Highlight the map marker (ArcGIS native)
4. Open popup on map

**Implementation:**
- Wired `onViewDetail` callback to call both `setSelectedObs(obs)` and `handleViewOnMap(obs)`
- `handleViewOnMap` awaits `view.goTo()`, finds graphic in GraphicsLayer, calls `view.openPopup()`
- ArcGIS natively highlights the selected feature
- Removed custom cyan circle highlight (Feb 12 refinement) — use only ArcGIS native highlight

**Files:**
- `INaturalistBrowseTab.tsx`
- `ObservationCard.tsx`
- `MapContext.tsx`

---

### Task 15: Map Marker Click → Zoom + Detail View

**Status:** ✅ Complete (Feb 12, 2026)

**Goal:** Clicking an iNaturalist map marker (emoji icon) should zoom to the observation and open its detail view in the right sidebar.

**Implementation:**
- Extended `ActiveLayer` type with optional `featureId` field
- Updated `LayerContext.activateLayer()` to accept `featureId` parameter
- Added map click handler in `useINaturalistMapBehavior` using ArcGIS `view.hitTest()`
- When iNaturalist graphic clicked: activates layer with observation ID + zooms to point (800ms duration)
- `INaturalistBrowseTab` listens for `activeLayer.featureId` and auto-opens detail view

**Files:**
- `types/index.ts`
- `LayerContext.tsx`
- `useMapBehavior.ts`
- `INaturalistBrowseTab.tsx`

**UX:** Seamless map → sidebar navigation with smooth zoom animation

---

### Task 16: Remove Bookmark Button/Action

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Clean up unused bookmark logic from observation cards and detail view (already stubbed as TODO).

**Implementation:**
- Removed "Bookmark" button from `ObservationCard` and `INaturalistDetailView`
- Removed `handleBookmark` stub and all `onBookmark` props
- Per DFT-046 design decision (Save as View deferred)

**Files:**
- `ObservationCard.tsx`
- `INaturalistDetailView.tsx`
- `INaturalistBrowseTab.tsx`

---

### Task 17: Compact Filter Section (Dropdown)

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Filter Observations section in Browse tab is too tall (12 checkboxes). Convert to a dropdown menu with multi-select checkboxes inside. Include "Select All" option.

**Implementation:**
- Replaced always-visible checkbox list with collapsible dropdown
- Trigger shows "All Taxa" or "X Taxa Selected"
- "Select All" button when filters active
- Chevron rotates on expand

**Files:**
- `INaturalistBrowseTab.tsx`

---

### Task 18: Rename Legend Widget Title

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Change floating legend header from "Filter Observations" to "iNaturalist Taxa" (more descriptive, avoids confusion with Browse tab filter section).

**Implementation:**
- Updated `<h3>` text in `INaturalistLegendWidget.tsx`

**Files:**
- `INaturalistLegendWidget.tsx`

---

### Task 19: Add Observation Search Bar

**Status:** ✅ Complete (Feb 13, 2026)

**Goal:** Add search input to Browse tab to search observations by common name or scientific name.

**Implementation:**
- Added search input above filter section in Browse tab
- Searches both common name and scientific name (case-insensitive substring match)
- 300ms debounce for performance
- Instant client-side filtering
- Resets to page 1 on search change
- Clear button (X icon) when text present
- Contextual helper text
- Focus state uses box-shadow (no layout shift)

**Files:**
- `INaturalistBrowseTab.tsx`
- `useINaturalistObservations.ts`

---

### Task 20: Reduce Pagination to 10 per Page

**Status:** ⚪ Not Started

**Goal:** Show 10 observations per page instead of 20 in Browse tab (better vertical scrolling UX).

**Implementation:**
- Change `PAGE_SIZE` from 20 → 10 in `useINaturalistObservations.ts`

**Files:**
- `useINaturalistObservations.ts`

**Priority:** Low

---

### Task 21: Add Date Range Filter

**Status:** ⚪ Not Started

**Goal:** Add start/end date pickers in Browse tab filter section to filter observations by `observed_on` date.

**Implementation:**
- Add two `<input type="date">` fields
- Pass `startDate`/`endDate` to `useINaturalistObservations`
- Filter observations client-side by date range

**Files:**
- `INaturalistBrowseTab.tsx`
- `useINaturalistObservations.ts`

**Priority:** Medium

---

### Task 22: Remember Last Active Tab

**Status:** ⚪ Not Started

**Goal:** When user switches away from iNaturalist and returns, restore the last active tab (Overview or Browse) instead of always resetting to Overview.

**Implementation:**
- Store `lastActiveTab` per layer ID in a ref or local state map
- Restore on layer reactivation
- Consider using `LayerContext` or a new `lastTabByLayer` map in `RightSidebar`

**Files:**
- `RightSidebar.tsx`
- `LayerContext.tsx`

**Priority:** Low

---

### Future/Low Priority: Save Observation → Create Filtered View

**Status:** Deferred

**Goal:** Clicking "Save" on an observation creates a new child view in Map Layers widget filtered to that specific observation (by ID or name).

**Implementation:**
- Wire "Save" action to `createNewView(pinnedId)` in LayerContext
- Set filter to `observation_id = {id}`
- Complex — requires linking browse actions to Map Layers state

**Priority:** Deferred — low user value, high complexity

**Files:**
- `INaturalistBrowseTab.tsx`
- `LayerContext.tsx`
- `inaturalistLayer.ts`

---

## Service Analysis

> Fill this out during Task 1.1

### Feature Service URL
TBD - Document the actual URL

### Available Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| | | |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Should we reuse any code from existing `INaturalistSidebar.tsx`?
- [ ] What's the max number of observations to load at once?
- [ ] Photo loading strategy (thumbnails first, then full size?)

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 13, 2026 | 1.4 | Task 19: Added observation search bar in Browse tab. Searches common/scientific names with 300ms debounce, clear button (X icon), instant client-side filtering. Focus state uses box-shadow to avoid layout shift. Placed above filter section. | Claude |
| Feb 13, 2026 | 1.4 | Task 18: Renamed floating legend widget title from "Filter Observations" to "iNaturalist Taxa". | Claude |
| Feb 13, 2026 | 1.4 | Task 16: Removed Bookmark button from ObservationCard and DetailView (DFT-046 deferred). Task 17: Filter section converted to compact dropdown with Select All. Label "iNat" → "iNaturalist" on external link button. | Claude |
| Feb 12, 2026 | 1.4 | Task 14 refinement: Removed custom cyan circle highlight; use only ArcGIS native highlight from view.openPopup. | Claude |
| Feb 12, 2026 | 1.4 | Task 14 complete: Observation card click opens detail view + pans/zooms/highlights marker on map + opens popup. Updated acceptance criteria. | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 1.2 | Resolved DFT-006: Overview tab opens first when layer is selected, with prominent "Browse Features →" button | Will + Claude |
| Feb 4, 2026 | 1.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 5, 2026 | 1.3 | Resolved DFT-039: Auto-apply everywhere — explicitly specified auto-apply behavior for all filter controls. Dropdowns fire immediately, text search debounced (500ms), date fields on calendar close/blur. `AbortController` cancels in-flight requests. Uses shared `FilterSection` component (DFT-038) | Will + Claude |

