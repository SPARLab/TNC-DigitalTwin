# Mockup Development Plan
## Digital Catalog Paradigm Shift - January 2026

**Created:** January 16, 2026  
**Target Deadline:** February 20, 2026  
**Related:** [digital-catalog-feedback-meeting-jan-15-2026.md](../feedback/digital-catalog-feedback-meeting-jan-15-2026.md)

---

## 📊 Task Summary & Progress

### Quick Status

```
Overall Progress: ▓▓▓▓▓▓░░░░ 6/9 tasks complete
```

**Last Updated:** January 20, 2026

### All Tasks

| ID | Task | Status | Assignee | Depends On | Commit |
|----|------|--------|----------|------------|--------|
| T0 | Create this plan document | ✅ Done | Wil | - | - |
| T1 | [Left Sidebar Layout Doc](#t1-left-sidebar-layout-document) | ✅ Done | Cursor | - | - |
| T2 | [Mockup 1: Full Layout Overview](#t2-mockup-1-full-layout-overview) | ✅ Done | Cursor | T1 | - |
| T3 | [Mockup 2: Cross-Referencing Demo](#t3-mockup-2-cross-referencing-demo) | ✅ Done | Cursor | T2 | - |
| T4 | [Mockup 3a: Dendra (floating panel)](#t4-mockup-3a-dendra-deep-dive-floating-panel) | ✅ Done | Cursor | T2 | - |
| T5 | [Mockup 3b: Dendra (sidebar panel)](#t5-mockup-3b-dendra-deep-dive-sidebar-panel) | ✅ Done | Cursor | T4 | - |
| T6 | [Mockup 4: DataONE Discovery](#t6-mockup-4-dataone-discovery) | 🔲 Not Started | - | T2 | - |
| T7 | Team Review: Layout Doc | 🔲 Not Started | Team | T1 | - |
| T8 | Team Review: All Mockups | 🔲 Not Started | Team | T2-T6 | - |

**Status Legend:** 🔲 Not Started · 🔄 In Progress · ✅ Done · ⏸️ Blocked · 🚫 Cancelled

### Completed Tasks
- ✅ **T0** Plan document created and reviewed
- ✅ **T1** Left Sidebar Layout Document created at `/docs/development_plans/left-sidebar-layout.md`
- ✅ **T2** Mockup 1: Full Layout Overview created at `/mockups/01-full-layout-overview.html`
- ✅ **T3** Cross-Referencing Demo (accomplished by T2 - pinning/cross-referencing functionality demonstrated in Full Layout mockup)
- ✅ **T4** Mockup 3a: Dendra Deep Dive (Floating Panel) created at `/mockups/03a-dendra-floating-panel.html`
- ✅ **T5** Mockup 3b: Dendra Deep Dive (Sidebar Panel) created at `/mockups/03b-dendra-sidebar-panel.html`

### Future Tasks
*Tasks discovered during mockup development will be added here:*

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| TF1 | Review Mockup 3a with Dan | 🔲 Not Started | Wil + Dan | Get feedback on Dendra floating panel approach, time series zoom widget, map panning behavior |
| TF2 | Mockup: iNaturalist/Animl observation browser | 🔲 Not Started | - | Show how to browse observations in right sidebar while maintaining access to filters. Explore collapsible filter panel, sticky filter bar, or tabbed approach. Goal: demonstrate how observation-heavy layers work in the new paradigm |

---

## 1. Overview

**Goal:** Create interactive HTML mockups demonstrating the new "Layer Browser" paradigm to get team alignment before implementation.

**Timeline:** Complete mockups within 1 week for team review, iterate as needed.

**Key Deliverables:**
1. Left Sidebar Layout Document (living document, updated as we iterate)
2. 4 HTML mockups demonstrating the paradigm
3. This plan document (for reference)

### The Paradigm Shift

**Problem:** Current navigation forces users into isolated, siloed views. Once you select a data source (iNaturalist, eBird, etc.), you can't see other data without navigating away and losing context.

**Solution:** 
- **Left sidebar** = Persistent layer browser (find and pin layers)
- **Right sidebar** = Detail workspace (query, browse, export selected layer)
- **Floating widget** = Quick access to pinned layers
- **Map** = Shows all pinned layers simultaneously

**User flow:** Find → Pin → Query → Browse → Export

---

## 2. Problem Statements

*These problems were identified in the [January 15, 2026 feedback meeting](../feedback/digital-catalog-feedback-meeting-jan-15-2026.md). The mockups demonstrate how the new paradigm addresses each one.*

### Critical Problems (Core Issues)

| ID | Problem | Impact |
|----|---------|--------|
| **P1** | **Siloed Navigation** | Users are "funneled into a small room" - selecting a data source locks them into an isolated view with no visibility into other data |
| **P2** | **No Cross-Referencing** | Cannot pin layers from different data sources simultaneously; switching views loses previous context |
| **P3** | **Limited Query Context** | Complex queries (species filters, time ranges) are lost when navigating away |

> These three problems are interconnected - they're all symptoms of the current navigation paradigm forcing isolated views.

### High Priority Problems

| ID | Problem | Impact |
|----|---------|--------|
| **P4** | **No Hierarchical Organization** | Results appear in flat alphabetical lists; no collapsible categories or visual grouping |
| **P5** | **Inconsistent Filter Behavior** | Global filters (time range, category) mean different things for different data sources |
| **P6** | **Poor Data Naming** | Cryptic layer names ("jcl1", "CMT") are meaningless to users *(separate issue - requires TNC coordination)* |

### Medium Priority Problems

| ID | Problem | Impact |
|----|---------|--------|
| **P7** | **Many-to-Many Categories** | Layers belong to multiple categories but hierarchy forces single placement |
| **P8** | **Data Viewers Use Too Much Space** | High "ink to information" ratio; same image shown 3x in iNaturalist viewer |
| **P9** | **Clear Filters Exits Viewer** | Unexpected behavior - users expect reset, not navigation |

### How This Plan Addresses Problems

| Solution Element | Problems Addressed |
|------------------|-------------------|
| **Persistent left sidebar** | P1, P2 (always visible, never locked into narrow view) |
| **Eye icon pinning** | P2, P3 (pin multiple layers, maintain context while browsing) |
| **Hierarchical dropdowns** | P4 (collapsible categories and subcategories) |
| **Right sidebar tabs** | P3, P5 (query context preserved; filters are layer-specific) |
| **Floating pinned widget** | P2 (quick access to all pinned layers) |
| **Primary category + tags** | P7 (single nav location, multiple search pathways) |

---

## 3. Task Specifications

---

### T1: Left Sidebar Layout Document

**Status:** ✅ Done  
**Assignee:** Cursor  
**Output:** `/docs/development_plans/left-sidebar-layout.md`

**Purpose:** Define exactly what categories, subcategories, and layers appear in the left sidebar. This is a prerequisite for all mockups.

**Instructions for Agent:** Generate a draft layout based on the Problem Statements (Section 2), Component Breakdown (Section 6), and the feedback meeting notes. The human will tweak as needed during mockup development.

**Contents:**
- Full hierarchy of categories
- Where each data source maps to (iNaturalist, eBird, CalFlora, Animl, Dendra, DataONE, TNC ArcGIS layers, Drone, LiDAR)
- Primary category assignments for each layer
- Notes on nested structures (e.g., Dendra sensor types within Remote Sensors > Weather)

**Acceptance Criteria:**
- [x] Document created at specified path
- [x] All current data sources have a home in the hierarchy
- [x] Dendra sensors are broken out by type (not monolithic)

---

## 4. Technical Approach

### 4.1 Dummy Data vs. Live Data

**Recommendation:** Start with dummy data for speed, consider live data for specific mockups.

| Mockup | Data Approach | Rationale |
|--------|---------------|-----------|
| Full Layout Overview | Dummy | Speed, focus on layout |
| Cross-Referencing | Dummy | Just need to show concept |
| Dendra Deep Dive | Dummy, realistic structure | Need sensor/station hierarchy |
| DataONE Discovery | Dummy | Focus on UX flow |

**Future consideration:** If we want to demonstrate loading states or realistic query behavior, we could create a mockup that hits the actual APIs. But that's more complex and probably not needed for initial alignment.

### 4.2 Technology

- **HTML + Tailwind CSS** (matches current app styling)
- **Vanilla JavaScript** for interactivity (expand/collapse, tab switching, eye toggles)
- **Single HTML file per mockup** (self-contained, easy to share)
- **No build step required** - just open in browser

### 4.3 Interactivity Level

Each mockup should have enough interactivity to demonstrate the concept:

| Interaction | Included | Notes |
|-------------|----------|-------|
| Expand/collapse categories | ✅ | Essential |
| Click eye icon to pin/unpin | ✅ | Essential |
| Tab switching in right sidebar | ✅ | Essential |
| Floating widget expand/collapse | ✅ | Essential |
| Search filtering | ⚠️ Maybe | Nice to have |
| Form inputs in query section | ✅ Visual only | Don't need to actually filter |
| Scrolling through results | ✅ | Show enough items to scroll |

---

## 5. Mockup Task Specifications

---

### T2: Mockup 1: Full Layout Overview

**Status:** ✅ Done  
**Assignee:** Cursor  
**Output:** `/mockups/01-full-layout-overview.html`  
**Depends On:** T1

**Purpose:** Show the complete paradigm at a glance. This is the foundational mockup that establishes all shared components.

**Problems Addressed:** P1 (siloing), P2 (cross-referencing), P3 (query context), P4 (hierarchy)

**What it shows:**
- Left sidebar with 4-5 categories, some expanded, some collapsed
- 3 layers pinned (blue highlight + filled eye icon)
- Floating pinned widget in top-left (expanded state)
- Right sidebar showing selected layer with tabs
- Map area as gray placeholder with "Map View" text

**Right sidebar state:** 
- Layer: iNaturalist Observations
- Active tab: "Browse & Query" (merged approach)
- Shows filters at top, results list below

**Required Interactions:**
- [x] Expand/collapse categories
- [x] Click eye icons to toggle pin state
- [x] Click layer names to "select" (highlight in left sidebar)
- [x] Tab switching in right sidebar
- [x] Expand/collapse floating widget

**Acceptance Criteria:**
- [x] HTML file created at specified path
- [x] All interactions listed above work
- [x] Matches category structure from T1
- [x] Ready for quick direction check before proceeding

---

### T3: Mockup 2: Cross-Referencing Demo

**Status:** ✅ Done (accomplished by T2)  
**Assignee:** Cursor  
**Output:** Integrated into `/mockups/01-full-layout-overview.html`  
**Depends On:** T2

**Purpose:** Show the core value prop - multiple layers from different sources visible together. *This is the primary demo for the core complaint.*

**Problems Addressed:** P1 (siloing), P2 (cross-referencing)

**Resolution:** The Full Layout Overview (T2) already demonstrates all cross-referencing capabilities:
- Eye icon pinning from multiple categories
- Floating widget showing pinned layers
- Ability to switch between layers while maintaining context
- Left sidebar always visible (not siloed)

A separate mockup was deemed unnecessary as T2 fully demonstrates the paradigm.

**Acceptance Criteria:**
- [x] Shows layers from different categories can be pinned (via T2)
- [x] Clicking layer in floating widget switches right sidebar (via T2)
- [x] Demonstrates the "not siloed" paradigm clearly (via T2)

---

### T4: Mockup 3a: Dendra Deep Dive (Floating Panel)

**Status:** ✅ Done  
**Assignee:** Cursor  
**Output:** `/mockups/03a-dendra-floating-panel.html`  
**Depends On:** T2

**Purpose:** Show how sensor data works in this paradigm, with time series in a floating panel over the map.

**Problems Addressed:** P3 (query context), P4 (hierarchy), P5 (filters are layer-specific)

**What it shows:**
- Left sidebar with Research & Sensors > Weather Sensors expanded
- "Rain Gauges" layer pinned and selected
- Right sidebar showing "Stations" tab for Rain Gauges
- List of 5 stations with "View Time Series" buttons
- **Floating time series panel** over map area

**Right sidebar state:**
- Layer: Rain Gauges
- Active tab: "Stations" (with Overview and Export tabs available)
- Filter: Date range selector, search box
- Results: List of 5 stations with status indicators
- Each station card has: name, ID, status badge, last reading, mini chart, "View Time Series" button

**Floating panel:**
- Shows when "View Time Series" is clicked
- Header: Station name, sensor type, gradient styling
- Controls: Date range dropdown, variable dropdown
- Chart area: Placeholder with stats (min/avg/max/total)
- Footer: Data source info, Export CSV button, close button

**Acceptance Criteria:**
- [x] HTML file created at specified path
- [x] Station list displays in right sidebar with 5 stations
- [x] "View Time Series" opens floating panel
- [x] Floating panel can be closed
- [x] Demonstrates nested category structure (Research & Sensors > Weather Sensors > Rain Gauges)
- [x] Stations shown on map as point markers
- [x] Clicking map marker selects station and opens time series

---

### T5: Mockup 3b: Dendra Deep Dive (Sidebar Panel)

**Status:** ✅ Done  
**Assignee:** Cursor  
**Output:** `/mockups/03b-dendra-sidebar-panel.html`  
**Depends On:** T4

**Purpose:** Alternative approach - time series appears IN the right sidebar instead of floating. Create for comparison.

**Design Decision:** Based on UX research (drilldown patterns, progressive disclosure, master-detail patterns), implemented as a **Replace View** approach:
- When user clicks "View Time Series", the station list is replaced with the time series detail view
- Clear "← Back to stations" navigation at top
- Maintains context while providing focused detail view
- Follows familiar drill-down pattern used in many dashboards

**What it shows:**
- Same as T4, but time series chart is embedded in right sidebar
- Station list view with "View Time Series" buttons
- Time series detail view with chart, stats, controls, and export
- Smooth view transitions between list and detail

**Acceptance Criteria:**
- [x] HTML file created at specified path
- [x] Time series appears in right sidebar (not floating)
- [x] Can compare with T4 to decide preferred approach
- [x] Clear back navigation to return to station list
- [x] Map click on station also triggers time series view

**Notes:** This is the alternative to T4's floating panel - compare both to decide preferred approach for implementation.

---

### TF2: Mockup: iNaturalist/Animl Observation Browser

**Status:** 🔲 Not Started  
**Assignee:** -  
**Output:** `/mockups/05-observations-browser.html` (or similar)  
**Depends On:** T2

**Purpose:** Show how observation-heavy layers (iNaturalist, Animl camera traps) work in the new paradigm. Key challenge: users need to both browse many observations AND apply complex filters in the same sidebar.

**Problems Addressed:** P3 (query context), P8 (space efficiency), P9 (clear filters behavior)

**What it shows:**
- Left sidebar with Species category expanded
- Either iNaturalist Observations or Animl Camera Traps pinned and selected
- Right sidebar showing both filters and observations

**Key UX Challenge to Solve:**
How do users toggle between viewing filters and browsing observations without losing context?

**Possible Approaches to Explore:**
1. **Collapsible filter panel** - Filters start expanded, can collapse to sticky bar showing active filters
2. **Sticky filter bar** - Filters always visible at top in compact form, click to expand
3. **Tabbed approach** - "Filter" tab vs "Browse" tab (may lose context though)
4. **Inline filter toggles** - Filters appear as chips/tags above results, click to modify
5. **Hybrid** - Compact filter summary at top, "Edit filters" button opens drawer/modal

**What it should demonstrate:**
- Observation cards showing photo, species name, date, location
- Active filters displayed prominently (e.g., "Birds • Last 30 days • Preserve boundary")
- Easy access to modify filters without scrolling back to top
- Ability to click observation → see detail view (like time series drill-down in 3b)
- Map markers for observations that sync with sidebar scroll/selection

**Right sidebar state:**
- Layer: iNaturalist Observations (or Animl Camera Traps)
- Active tab: "Browse & Query" (merged approach)
- Shows filters + results in clever space-efficient way
- Perhaps 200-500 observations to show (paginated or infinite scroll)

**Acceptance Criteria:**
- [ ] HTML file created at specified path
- [ ] Demonstrates at least 2 different filter UI approaches (can show alternate states)
- [ ] Shows how observation detail drill-down works
- [ ] Includes realistic observation cards with photos
- [ ] Active filters are always visible/accessible
- [ ] Ready to compare different approaches and pick best one

**Notes:** 
- This is critical for Species layers (biggest use case)
- Also applies to Animl camera trap images
- Consider how this differs from Dendra (stations → time series) vs observations (list → detail)
- May want to show both "list view" and "grid view" options for observations

---

### T6: Mockup 4: DataONE Discovery

**Status:** 🔲 Not Started  
**Assignee:** -  
**Output:** `/mockups/04-dataone-discovery.html`  
**Depends On:** T2

**Purpose:** Show how ~1000 datasets work as one layer with a discovery-focused interface.

**Problems Addressed:** P4 (hierarchy), P8 (space efficiency)

**What it shows:**
- Left sidebar with "Research Datasets" category
- "DataONE Studies" as single layer, pinned
- Right sidebar showing search/browse interface
- Map placeholder showing study area points

**Right sidebar state:**
- Layer: DataONE Studies
- Active tab: "Browse & Query" (or "Search Datasets")
- Search box for keywords
- Filter dropdowns (date range, data type, etc.)
- Results list showing dataset cards
- Each card: title, abstract snippet, date, "View Details" button

**Interaction:**
- Click dataset card → expands to show more info + download link
- Or: Click dataset → opens iframe preview (matching current behavior)

**Acceptance Criteria:**
- [ ] HTML file created at specified path
- [ ] Search box and filters are visible (don't need to function)
- [ ] Dataset cards show realistic dummy data
- [ ] Demonstrates how a "discovery" layer differs from a "view" layer

---

## 6. Component Breakdown

### 6.1 Left Sidebar: Layer Browser (Default Mode)

```
┌──────────────────────────────────┐
│ [🔍 Search layers...]  [Advanced]│
├──────────────────────────────────┤
│ ▼ Species                        │
│   👁 iNaturalist Observations    │
│   👁 eBird Sightings             │
│   👁 CalFlora Plants             │
│   👁 Camera Traps                │
├──────────────────────────────────┤
│ ▼ Fire & Climate                 │
│   👁 Fire Perimeters (2020-2024) │
│   👁 Fire History                │
│   ▼ Remote Sensors: Weather      │  ← Nested subcategory
│     👁 Rain Gauges               │
│     👁 Wind Sensors              │
│     👁 Temperature               │
├──────────────────────────────────┤
│ ▼ Land Cover                     │
│   ...                            │
├──────────────────────────────────┤
│ ▼ Research Datasets              │
│   👁 DataONE Studies             │
└──────────────────────────────────┘
```

**Behaviors:**
- Click layer name → selects it, opens details in right sidebar
- Click eye icon → pins/unpins (adds to floating widget)
- Pinned layers get blue background highlight
- Tooltip on hover shows brief description

### 6.2 Left Sidebar: Advanced Search (Alternative Mode)

```
┌──────────────────────────────────┐
│ [← Back to Browse]               │
├──────────────────────────────────┤
│ ADVANCED SEARCH                  │
│                                  │
│ Keywords: [____________]         │
│                                  │
│ Categories:                      │
│ [x] Species  [ ] Fire            │
│ [ ] Land Cover  [x] Research     │
│                                  │
│ [Search]                         │
├──────────────────────────────────┤
│ Results (12 layers):             │
│ 👁 iNaturalist Observations      │
│ 👁 DataONE Studies               │
│ ...                              │
└──────────────────────────────────┘
```

### 6.3 Floating Pinned Layers Widget

**Collapsed state:**
```
┌─────────────────┐
│ 📌 4 layers     │
└─────────────────┘
```

**Expanded state:**
```
┌─────────────────────────────────┐
│ 📌 PINNED LAYERS           [−]  │
├─────────────────────────────────┤
│ 👁 iNaturalist Observations  ✕  │
│ 👁̲ Fire Perimeters (hidden)  ✕  │
│ 👁 Rain Gauges               ✕  │
│ 👁 DataONE Studies           ✕  │
├─────────────────────────────────┤
│ [Clear All]                     │
└─────────────────────────────────┘
```

**Location:** Top-left corner of map area

### 6.4 Right Sidebar: Layer Workspace

Tab structure varies by layer type:

**For iNaturalist / eBird / CalFlora:**
```
[Overview] [Browse & Query] [Export]
```

**For DataONE:**
```
[Overview] [Search Datasets] [Export]
```

**For Dendra Sensors:**
```
[Overview] [Stations] [Export]
```

**For simple polygon layers (Fire Perimeters, etc.):**
```
[Overview] [Export]
```

---

## 7. Iteration Plan

### 7.1 Review Checkpoints

| Checkpoint | After Task | Purpose |
|------------|------------|---------|
| Layout Review | T1 | Validate category structure before building mockups |
| Direction Check | T2 | Confirm overall layout works; catch issues early |
| Scenario Review | T3, T4, T6 | Review specific use cases |
| Final Review | T8 | Team alignment before implementation |

### 7.2 Expected Iterations

| Area | Likely to change | Notes |
|------|------------------|-------|
| Category names | Yes | Will refine based on team feedback |
| Layer names | Yes | TNC may have preferences |
| Right sidebar tab labels | Yes | "Browse & Query" vs separate tabs |
| Floating widget design | Maybe | Position, contents, legend inclusion |
| Dendra time series location | Yes | Floating vs. in sidebar - need to try both |

### 7.3 How to Iterate Quickly

- Mockups are single HTML files - easy to duplicate and modify
- Tailwind CSS means style changes are fast
- Can create variants (e.g., "mockup-3a-floating.html" vs "mockup-3b-sidebar.html")
- Share via file or screenshot for quick feedback

---

## 8. Open Questions to Resolve

These should be answered during mockup review:

### Left Sidebar
- [ ] Final category names and hierarchy
- [ ] How deep should nesting go? (2 levels? 3?)
- [ ] Should pinned layers also appear in a "Pinned" section at top?
- [ ] Advanced search: modal, or replaces the browse view?

### Right Sidebar
- [ ] Tab labels: "Overview" vs "Details" vs "Info"
- [ ] Merged "Browse & Query" vs separate tabs - which feels better?
- [ ] What's the minimum info for a simple layer (just Overview + Export)?
- [ ] How do we handle layers with no queryable data?

### Floating Widget
- [ ] Show mini-legends? Or just layer names?
- [ ] Drag to reposition? Or fixed location?
- [ ] Maximum number of pinned layers? (Or unlimited?)

### Dendra Specific
- [ ] Time series: floating panel vs right sidebar?
- [ ] Multi-sensor comparison: how does that work?
- [ ] Station selection: checkboxes? Or select one at a time?

### DataONE Specific
- [ ] Dataset detail view: expand in place, or new "panel"?
- [ ] Iframe preview: still needed? Or link out?

---

## 9. Implementation Phase (Post-Mockup)

*This section is for reference once mockups are approved (after T8). These tasks will be added to the Future Tasks table.*

### Parallelization Opportunities

| Workstream | Dependencies | Can Parallelize With |
|------------|--------------|----------------------|
| Left sidebar component | Layout doc finalized | - |
| Right sidebar tab system | Paradigm confirmed | Left sidebar |
| iNaturalist detail view | Tab system | eBird, CalFlora views |
| eBird detail view | Tab system | iNaturalist, CalFlora |
| Dendra detail view | Tab system, time series decision | Other detail views |
| Floating pinned widget | Paradigm confirmed | Sidebar work |
| Backend: Master layer list | None | All frontend work |
| Backend: Category API | Layout doc | Frontend work |

**Key insight:** Once the tab system infrastructure exists, individual layer detail views can be built in parallel across multiple Cursor windows.

---

## 10. Commit Log

*Record commits here as tasks are completed:*

| Date | Task | Commit Hash | Message |
|------|------|-------------|---------|
| 2026-01-16 | T0 | - | Initial plan document |
| | | | |

---

## 11. Workflow Notes

### Recommended Task Order

1. **T1** → Left Sidebar Layout Doc *(prerequisite for all mockups)*
2. **T7** → Quick team review of layout structure
3. **T2** → Mockup 1: Full Layout *(establishes shared components)*
4. **T3, T4, T6** → Can be done in parallel after T2
5. **T5** → Optional comparison for T4
6. **T8** → Final team review

### How to Update This Document

**When starting a task:**
1. Change status to `🔄 In Progress` in Task Summary table
2. Add your name as Assignee

**When completing a task:**
1. Change status to `✅ Done` in Task Summary table
2. Check off acceptance criteria in task spec
3. Add commit hash and message to Commit Log
4. Update progress bar: `▓▓▓▓░░░░░░░░░░░░░░░░ 4/11`

**When discovering new tasks:**
1. Add to "Future Tasks" table with `TF#` ID
2. Note which task revealed it (e.g., "added after T2 review")
3. Optionally promote to main task list if blocking

---

## Appendix: Key Design Decisions

### Why This Paradigm?

From the January 15, 2026 feedback meeting:

> "The way it's doing it is like cutting off that bigger picture thinking" - Amy

> "I'm boxed in. I can only look at Birds... that's an unnecessary step to me" - Amy

> "I want all this to happen over here so that I can always see all my layers" - Amy

The new paradigm addresses:
1. **Siloing** - Left sidebar always visible, never locked into one view
2. **Cross-referencing** - Pin multiple layers from different categories
3. **Query context** - Right sidebar tabs preserve work while browsing

### Trade-offs Accepted

- **Right sidebar complexity increases** - It now handles browsing, querying, and details
- **More scrolling in left sidebar** - But floating widget provides quick access to pinned layers
- **Some data sources need special handling** - LiDAR (3D view), DataONE (discovery-focused)
