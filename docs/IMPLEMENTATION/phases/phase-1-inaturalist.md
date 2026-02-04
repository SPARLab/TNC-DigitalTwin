# Phase 1: iNaturalist Right Sidebar

**Status:** ⚪ Not Started  
**Progress:** 0 / 5 tasks  
**Branch:** `v2/inaturalist`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

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

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1.1 | Query iNaturalist service to understand attributes | ⚪ Not Started | | |
| 1.2 | Create iNaturalist right sidebar shell | ⚪ Not Started | | |
| 1.3 | Implement filter UI (taxon, species, date, etc.) | ⚪ Not Started | | |
| 1.4 | Implement observation list with cards | ⚪ Not Started | | |
| 1.5 | Implement observation detail view | ⚪ Not Started | | |

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

**Acceptance Criteria:**
- [ ] Taxon dropdown/search
- [ ] Species dropdown/search (filtered by taxon)
- [ ] Date range picker
- [ ] Research grade checkbox
- [ ] Filter count shows "Showing X of Y observations"
- [ ] Filters update the pinned layer's activeQuery

**Reference:** Mockup `02b-browse-inaturalist.html` filter section

---

### 1.4: Implement Observation List with Cards

**Goal:** Display filtered observations as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: species name, observer, date, location
- [ ] Cards show photo thumbnail (if available)
- [ ] "View on Map" button zooms to observation
- [ ] "Bookmark" button adds to bookmarks (simple, no filter)
- [ ] "Open in iNat" button links to iNaturalist.org
- [ ] List is paginated or virtualized for performance
- [ ] Clicking card selects it (for detail view)

**Reference:** Mockup `02b-browse-inaturalist.html` results section

---

### 1.5: Implement Observation Detail View

**Goal:** When user clicks an observation, show expanded details.

**Acceptance Criteria:**
- [ ] Detail view shows full observation data
- [ ] Larger photo display
- [ ] All metadata visible
- [ ] "Back to list" navigation
- [ ] Same actions available (Bookmark, Open in iNat)

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
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 1.2 | Resolved DFT-006: Overview tab opens first when layer is selected, with prominent "Browse Features →" button | Will + Claude |
| Feb 4, 2026 | 1.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |

