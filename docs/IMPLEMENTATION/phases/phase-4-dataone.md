# Phase 4: DataOne Right Sidebar

**Status:** ⚪ Not Started  
**Progress:** 0 / 5 tasks  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the DataOne dataset browse experience in the right sidebar. This data source has:
- **Pointer rows** (datasets point to files)
- **No Level 3 filtering** (datasets are bookmarked whole, not filtered)
- **Cross-category nature** (datasets span all TNC categories)

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 10 - Cross-Category)
- Mockup: `mockups/02e-browse-dataone.html`

## Key Paradigm Notes

- **Row Type:** Pointer (dataset points to files)
- **Bookmark Options:** Only "Bookmark Dataset" (no "Bookmark with Filter")
- **No Level 3:** Datasets are bookmarked whole, not filtered by individual files
- **Cross-Category:** DataOne appears under "Research Datasets (All Categories)" with category filter in right sidebar
- **Left Sidebar Shortcuts (DFT-045):** Special shortcut rows appear in domain categories (Species, Fire, etc.) labeled "DataOne Datasets (count)". Clicking activates DataOne with that domain pre-filtered. Improves discoverability for domain-first users.

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 4.1 | Query DataOne service to understand attributes | ⚪ Not Started | | |
| 4.2 | Create DataOne right sidebar shell | ⚪ Not Started | | |
| 4.3 | Implement search and filter UI | ⚪ Not Started | | |
| 4.4 | Implement dataset list with cards | ⚪ Not Started | | |
| 4.5 | Implement dataset detail view | ⚪ Not Started | | |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 4.1: Query DataOne Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the DataOne feature service.

**Acceptance Criteria:**
- [ ] Document dataset feature service attributes
- [ ] Identify which attributes are useful for search/filtering
- [ ] Identify which attributes should display in dataset cards
- [ ] Note the category mapping (AI-enriched categories)

**Questions to Answer:**
- What metadata fields exist? (title, authors, abstract, DOI, keywords)
- How are TNC categories assigned? (AI-enriched field?)
- Are file lists included in the feature service or fetched separately?
- What's the bounding box / spatial coverage format?

**Output:** Add findings to "Service Analysis" section below.

---

### 4.2: Create DataOne Right Sidebar Shell

**Goal:** Set up the component structure for the DataOne browse experience.

**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.

**Acceptance Criteria:**
- [ ] Component renders when DataOne layer is selected
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
- [ ] Component can show dataset list OR dataset detail (drill-down pattern)
- [ ] Header clearly indicates "Research data across all categories"
- [ ] **Left sidebar shortcuts (DFT-045):**
  - [ ] Query DataOne service for category distribution on sidebar mount
  - [ ] Render special shortcut rows in expanded domain categories (if count > 0)
  - [ ] Shortcut rows labeled "DataOne Datasets (count)" with books icon
  - [ ] Clicking shortcut row activates DataOne with domain pre-filter applied

**Files to Create:**
- `src/v2/components/RightSidebar/DataOne/DataOneSidebar.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneOverviewTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneExportTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DatasetListView.tsx`
- `src/v2/components/RightSidebar/DataOne/DatasetDetailView.tsx`

---

### 4.3: Implement Search and Filter UI

**Goal:** Create search and filter controls for discovering datasets.

**Decision (Feb 5, 2026):** Resolved DFT-035 — Debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Enter key bypasses debounce. Initial state loads all datasets (most recent first), eliminating v1 "pre-search" dead state. Pagination with Previous/Next (20 per page). `AbortController` cancels in-flight requests.

**Acceptance Criteria:**
- [ ] Text search box with 500ms debounce (2+ character minimum)
- [ ] Enter key bypasses debounce and fires immediately
- [ ] Category dropdown (all 13 TNC categories) fires immediately on change
- [ ] Year range picker fires immediately on change
- [ ] Author filter (optional) fires immediately on change
- [ ] Filter count shows "Showing X of Y datasets" (updates live)
- [ ] Initial state loads all datasets (most recent first), no "pre-search" empty state
- [ ] `AbortController` cancels in-flight requests when filters change
- [ ] Loading feedback per DFT-018 thresholds (inline spinner, stale results with overlay)
- [ ] Empty results show "No datasets match your filters" + "Clear all filters" link
- [ ] ARIA live region announces result count changes
- [ ] Filters persist when navigating to detail and back

**Reference:** 
- Mockup `02e-browse-dataone.html` "Search & Filter" section
- DFT-035 resolution in `planning-task-tracker.md`

---

### 4.4: Implement Dataset List with Cards

**Goal:** Display datasets as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: title, authors, year, description snippet
- [ ] DOI badge (if available)
- [ ] File count/types shown (e.g., "3 files: CSV, PDF, XML")
- [ ] "Bookmark" button (simple, no filter option)
- [ ] "Details →" button navigates to detail view
- [ ] "Open in DataOne ↗" external link

**Reference:** Mockup `02e-browse-dataone.html` dataset cards

---

### 4.5: Implement Dataset Detail View

**Goal:** When user clicks a dataset, show its full details.

**Acceptance Criteria:**
- [ ] "← Back to Datasets" navigation
- [ ] Full title and author list
- [ ] Complete abstract (not truncated)
- [ ] Files list with sizes and descriptions
- [ ] Spatial coverage (bounding box, "View on Map" button)
- [ ] Keywords as clickable tags
- [ ] Temporal coverage
- [ ] "Bookmark Dataset" button
- [ ] "Open in DataOne ↗" primary action
- [ ] "Copy DOI" and "Cite" buttons

**Reference:** 
- Mockup `02e-browse-dataone.html` detail section
- Existing `DataONEDetailsSidebar.tsx` component (may have reusable code)

---

## Service Analysis

> Fill this out during Task 4.1

### Feature Service URL
TBD - Document the actual URL

### Dataset Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| title | string | Display, search | |
| authors | array/string | Display, filter | |
| abstract | string | Display | |
| doi | string | Display, link | |
| year | number | Filter | |
| tnc_category | string | Filter | AI-enriched |
| keywords | array | Display, search | |
| bounding_box | geometry | Map display | |
| files | array | Display | May be separate query |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| All datasets | | |
| Filtered by category | | |
| Search by keyword | | |

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

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, follow the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 4:** DataOne query/search filters can plug into existing child-view synchronization patterns rather than inventing a new widget-sidebar contract.
- **Phase 4 verification:** Confirm DataOne filter/search state hydrates from "Edit Filters," child query params update from sidebar edits, and custom child names remain stable after query changes.
- DataOne branch should adopt shared Map Layers child-view rename semantics: manual rename persists as custom and is not overwritten by sync.
- Provide DataOne-specific auto naming for non-custom views (query/category/year driven labels), while preserving shared child `viewId` navigation/edit flows.

---

## Open Questions

- [ ] Should we reuse code from existing `DataONEDetailsSidebar.tsx`?
- [ ] How to handle datasets with many files?
- [ ] Keyword click behavior - filter by that keyword?
- [ ] Preview capability vs. link to DataOne?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 5, 2026 | 4.3 | Resolved DFT-035: DataOne search behavior — debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Enter key bypass for power users. Initial state loads all datasets, eliminating "pre-search" state. `AbortController` for race condition prevention. See planning-task-tracker.md | Will + Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 4.2 | Resolved DFT-006: Overview tab opens first when layer is selected, with prominent "Browse Features →" button | Will + Claude |
| Feb 4, 2026 | 4.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |

