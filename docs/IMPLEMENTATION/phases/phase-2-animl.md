# Phase 2: ANiML Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 6 / 12 tasks  
**Last Completed:** Task 2.12 (Image List Pagination) ✅  
**Branch:** `v2/animl`  
**Depends On:** Phase 0 (Foundation) — Data Source Adapter Pattern ✅ Complete  
**Owner:** TBD

---

## ✅ Readiness Assessment (Feb 12, 2026)

**The adapter pattern is ready for parallel development.** All core architecture is in place:

### What's Already Complete
- ✅ `DataSourceAdapter` interface defined (`src/v2/dataSources/types.ts`)
- ✅ Registry with commented placeholders for Animl (`src/v2/dataSources/registry.ts`)
- ✅ Layer catalog entry (`animl-camera-traps` in `layerRegistry.ts`)
- ✅ Type system includes `'animl'` data source
- ✅ iNaturalist reference implementation (complete working example)
- ✅ Existing v1 service layer (`src/services/animlService.ts` — 1,512 lines, fully functional)

### Merge Conflict Surface
**Only ~11 lines across 3 shared files:**
- `src/v2/dataSources/registry.ts` — uncomment 6 lines (imports + map + hooks)
- `src/v2/components/Map/layers/index.ts` — add `animl-camera-traps` case (~3 lines)
- `src/v2/V2App.tsx` — wrap with `<AnimlFilterProvider>` (~2 lines)

### Files to Create (No Shared File Conflicts)
All work is isolated in new directories:
- `src/v2/context/AnimlFilterContext.tsx` (cache + filter state)
- `src/v2/dataSources/animl/adapter.tsx`
- `src/v2/dataSources/animl/useMapBehavior.ts`
- `src/v2/components/Map/layers/animlLayer.ts`
- `src/v2/components/RightSidebar/ANiML/*.tsx` (6 files)
- `src/v2/components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget.tsx`

### Recommended Build Order
1. **AnimlFilterContext** — Data fetching, caching, filter state (foundation)
2. **Animl Adapter + Registry wiring** — Uncomment registry entries
3. **Animl Map Layer** — Camera trap icons with badges
4. **Animl Overview Tab** — Simple metadata display
5. **Animl Browse Tab (shell)** — Landing cards (Animal-First vs Camera-First)
6. **Animl Legend Widget** — Species filter floating widget
7. **Camera List + Detail views** — Full browse experience

Items 3-6 can be done in parallel once items 1-2 are complete.

### Reference Implementations
- iNaturalist adapter: `src/v2/dataSources/inaturalist/adapter.tsx`
- iNaturalist context: `src/v2/context/INaturalistFilterContext.tsx`
- iNaturalist map layer: `src/v2/components/Map/layers/inaturalistLayer.ts`
- iNaturalist legend: `src/v2/components/FloatingWidgets/INaturalistLegendWidget/`

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction. Task 2.7 (caching investigation) is particularly important to validate.

---

## Phase Goal

Implement the ANiML camera trap browse experience in the right sidebar. This is the **most complex** data source because it has:
- **Pointer rows** (cameras point to image archives)
- **Dual-level filtering** (camera filters + global image filters at layer level)
- **Level 3 related data** (images with species tags, dates)

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 5b - ANiML Special Case)
- Mockup: `mockups/02c-browse-animl.html`

## Key Paradigm Notes

- **Row Type:** Pointer (camera points to image archive)
- **Bookmark Options:** "Bookmark Camera" OR "Bookmark with Filter"
- **Has Level 3:** Yes - images with species, date, time of day
- **Special:** Dual-level filtering at layer browse level (unique to ANiML)

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 2.1 | Query ANiML service to understand attributes | 🟢 Complete | Will + Claude | Existing animlService.ts (1,512 lines) covers this |
| 2.2 | Create ANiML adapter, context, map layer, and sidebar shell (WIP) | 🟢 Complete | Will + Claude | Foundation pipeline done; sidebar UI is placeholder |
| 2.3 | Design decision: Browse tab interaction flow | 🟢 Complete | Will + Claude | Iteration 2: Expandable filter sections (Species, Cameras) with multi-select. See Change Log Feb 13. |
| 2.4 | Implement Browse tab interaction flow | 🟢 Complete | Will + Claude | FilterSection component, AnimlFilterContext (selectedCameras), live result count, ImageList. |
| 2.5 | Implement camera list with filtered image counts | 🟢 Complete | Will + Claude | Cameras as multi-select checkboxes in expandable FilterSection; cross-dimensional counts. |
| 2.6 | Implement camera detail drill-down | 🟢 Complete | Will + Claude | Replaced by unified filter + result view; no separate detail view needed for MVP. |
| 2.7 | Investigate and decide on caching strategy | ⚪ Not Started | | Current load: 8-12s |
| 2.8 | Use v1 SVG icons for map markers and animal tags | ⚪ Not Started | | Replace emoji markers with proper SVGs |
| 2.9 | Map Layers widget sync with browse filters | ⚪ Not Started | | Widget reflects active query state |
| 2.10 | Right sidebar scrollbar — prevent content shift | 🟢 Complete | Will + Claude | scrollbar-gutter: stable on right sidebar scroll area |
| 2.11 | Add date/time frame filter above Species and Cameras | 🟢 Complete | Will + Claude | DateFilterSection with date pickers + presets. Passes startDate/endDate to queryImageLabelsCached. Count fix: use images.length when fetched. |
| 2.12 | Image list pagination (Prev/Next Page) | 🟢 Complete | Will + Claude | Replaced "Load More" with page-based Prev/Next; added page/range indicators |
| 2.13 | Expanded image view on click | ⚪ Not Started | | Click thumbnail → larger view in sidebar |
| 2.14 | Arrow key navigation in expanded view | ⚪ Not Started | | Left/right keys to navigate between images |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 2.1: Query ANiML Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the ANiML feature services.

**Acceptance Criteria:**
- [ ] Document camera feature service attributes
- [ ] Document image/tag feature service attributes
- [ ] Identify relationship between cameras and images
- [ ] Note current query performance (baseline for caching decision)

**Questions to Answer:**
- What attributes exist on cameras? (region, status, ID, coordinates)
- What attributes exist on images/tags? (species, date, time, camera_id)
- How are cameras and images related in the feature service?
- What's the current load time for various queries?

**Output:** Add findings to "Service Analysis" section below.

---

### 2.2: Create ANiML Right Sidebar Shell

**Goal:** Set up the component structure for the ANiML browse experience.

**Decision (Feb 2, 2026):** Resolved DFT-003c — Landing cards entry point for Animal-First vs Camera-First choice.  
**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.
**Decision (Feb 6, 2026):** Resolved DFT-042 — Mode-switch mechanism: text link above filter section ("Switch to [other mode]"). Always visible, subtle styling (gray-500, hover emerald-500). Confirmation dialog if filters active. Mode preference stored in localStorage (`animl-browse-mode`).

**Acceptance Criteria:**
- [ ] Component renders when ANiML layer is selected
- [ ] Tabs exist: Overview | Browse
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
- [ ] Browse tab shows landing cards on first visit (Animal-First vs Camera-First)
- [ ] Landing cards include icon, title, and brief tagline for each mode
- [ ] User preference is remembered (skip landing page on return visits)
- [ ] **Mode-switch link visible in both modes** (DFT-042):
  - [ ] Located above filter section, standalone line (not inside FilterSection header)
  - [ ] Text pattern: "Switch to [other mode]" with shuffle icon (Lucide `ArrowLeftRight` or `Shuffle`)
  - [ ] Styling: `text-gray-500 hover:text-emerald-500`, `text-sm`
  - [ ] Click behavior: If filters active → confirmation dialog ("Switching modes will clear your current filters. Continue?"); if no filters → switch immediately
  - [ ] On switch: Update localStorage (`animl-browse-mode`), 150-200ms crossfade, render new filter controls, clear results, optional toast notification
  - [ ] Keyboard accessible with clear ARIA label
- [ ] Component can show camera list OR camera detail (drill-down pattern)

**Files to Create:**
- `src/v2/components/RightSidebar/ANiML/ANiMLSidebar.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLBrowseTab.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLOverviewTab.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLExportTab.tsx`
- `src/v2/components/RightSidebar/ANiML/CameraListView.tsx`
- `src/v2/components/RightSidebar/ANiML/CameraDetailView.tsx`

---

### 2.3: Design Decision — Browse Tab Interaction Flow

**Goal:** Think through and decide on the UX for the two browse modes before implementing.

**Status:** ⚪ Not Started

**Background (Feb 12, 2026):**
The Browse tab has two modes — "Animal-Tag-First" and "Camera-First" — with different interaction flows. The v1 implementation handled this as two views in AnimlSidebar.tsx with a toggle. The v2 implementation needs to refine this into a progressive-disclosure pattern that integrates with the Map Layers widget.

**Two Browse Flows to Design:**

**Flow A — Animal-Tag-First:**
```
1. User selects one or more animal tags (e.g., "Mountain Lion", "Coyote")
2. Sidebar shows cameras that have images matching those tags
   → Map updates: matching cameras highlighted, non-matching grayed out (DFT-028)
   → Map Layers widget reflects: "Camera Traps • Mountain Lion, Coyote"
3. User selects one or more cameras from the filtered list
4. Sidebar shows images for the selected cameras × selected tags
   → Map Layers widget reflects: "Camera Traps • Mountain Lion, Coyote • 3 cameras"
```

**Flow B — Camera-First:**
```
1. User selects one camera from the deployment list
2. Sidebar shows all animal tags detected at that camera (with counts)
   → Map updates: selected camera highlighted
   → Map Layers widget reflects: "Camera Traps • CAM-042"
3. User selects one or more animal tags to filter images
4. Sidebar shows images for the selected camera × selected tags
   → Map Layers widget reflects: "Camera Traps • CAM-042 • Mountain Lion, Coyote"
```

**Key Asymmetry to Note:**
- Animal-tag-first: 1+ tags → 1+ cameras → images
- Camera-first: 1 camera → 1+ tags → images

**Design Questions to Resolve:**

| Question | Options | Notes |
|----------|---------|-------|
| **Step transitions** | Progressive panels (slide in/out)? Accordion sections? All visible at once? | v1 used drill-down (click → replace list with observations) |
| **Filter persistence** | When user goes "back", do filter selections persist? | v1: selections persisted |
| **Map Layers widget format** | How to summarize the active query in the widget row? | Need concise text like "2 tags • 3 cameras" |
| **Legend widget role** | Should the legend widget also serve as the tag selector in animal-first mode? | Would reduce sidebar complexity |
| **Multi-select UX** | Checkboxes for multi-select? Click-to-toggle chips? | v1 used checkboxes in export tab |
| **Image result display** | Grid of thumbnails? Vertical list with metadata? | v1 used vertical list with ThumbnailImage |
| **Pagination** | Client-side pagination? Infinite scroll? Load more button? | v1 used 20-per-page client-side |

**Part A — Deliverable:** Design decision document (add to Discoveries/Decisions below). Include:
1. Wireframe or ASCII layout for each flow step
2. Map Layers widget text format
3. Component breakdown (which components handle which step)
4. State management approach (what lives in AnimlFilterContext vs local component state)

**Reference Implementations:**
- v1 AnimlSidebar: `src/components/AnimlSidebar.tsx` (camera-centric and animal-centric modes)
- v1 AnimlDetailsSidebar: `src/components/AnimlDetailsSidebar.tsx` (export tab with multi-select)
- v1 count lookups: `animlService.buildCountLookups()` (fast cross-referencing without loading all images)

---

### 2.4: Implement Browse Tab Interaction Flow

**Goal:** Build the interaction flow decided in Task 2.3.

**Status:** ⚪ Not Started — **Blocked on 2.3 design decision**

**Acceptance Criteria (preliminary — refine after 2.3):**
- [ ] Animal-tag-first flow: tag selection → camera list → image results
- [ ] Camera-first flow: camera selection → tag selection → image results
- [ ] Filter state syncs with Map Layers widget (query summary visible in widget row)
- [ ] Filter state syncs with map (camera markers update: highlighted/grayed)
- [ ] Filter state syncs with legend widget (selected animals highlighted)
- [ ] Mode-switch link (DFT-042) clears filters and switches between flows
- [ ] "Clear" and "Undo" controls available at each step
- [ ] Auto-apply behavior (DFT-039): changes apply immediately, no "Search" button
- [ ] All count displays use `animlService.buildCountLookups()` for performance (no full image fetch until viewing results)

**Files to Modify/Create:**
- `src/v2/components/RightSidebar/ANiML/AnimlBrowseTab.tsx` (refactor)
- `src/v2/components/RightSidebar/ANiML/CameraListView.tsx` (refactor)
- `src/v2/components/RightSidebar/ANiML/CameraDetailView.tsx` (refactor)
- `src/v2/context/AnimlFilterContext.tsx` (add selected cameras, query state)
- New components TBD based on 2.3 decision

**Previous Design Decisions That Still Apply:**
- DFT-003: Context-dependent pin button visibility
- DFT-028: Zero-result cameras grayed out, not hidden
- DFT-029: No badges when no filter active
- DFT-038: 2-column grid layout for filter controls
- DFT-039: Auto-apply filters
- DFT-040: Condensed feature detail card at Level 3
- DFT-042: Mode-switch mechanism

---

### 2.5: Implement Camera List with Filtered Image Counts

**Goal:** Display cameras as cards showing filtered image counts.

**Decision (Feb 3, 2026):** Resolved DFT-012 — Numbered badges on camera icons showing filtered image counts. Map visualization integrates with progressive disclosure pattern.
**Decision (Feb 4, 2026):** Resolved DFT-028 — Cameras with 0 matching images are grayed out (40-50% opacity, desaturated), not hidden. Remain clickable/keyboard-accessible. No "0" badge shown. Preserves spatial context and enables discovery of negative evidence (where species is NOT present).
**Decision (Feb 4, 2026):** Resolved DFT-029 — No badges when layer has no filter. Badges only appear when layer-level filter is applied, making them semantic indicators of filtered query results. Optional hover tooltip shows total count even when no filter is active.

**Acceptance Criteria:**
- [ ] Each camera card shows filtered image count (not total)
- [ ] Example: "CAM-042 • 47 mountain lion images"
- [ ] "View Camera →" button navigates to detail view
- [ ] "Bookmark with Current Filter" saves camera + active image filter
- [ ] **Map visualization with numbered badges:**
  - [ ] Camera icons on map display count badge (upper-right corner)
  - [ ] Badge shows filtered image count matching layer-level filter
  - [ ] Badge color: contrasting (red, blue, or TNC brand accent)
  - [ ] **Badge only appears when layer-level filter is applied (no filter = no badges)**
  - [ ] **Optional: Hover tooltip shows total count even when no filter applied**
  - [ ] Clicking camera icon navigates sidebar to that camera's filtered images
  - [ ] Hover tooltip shows species name and date range context when filter is active
  - [ ] **Cameras with 0 matching images: grayed out (not hidden)**
    - [ ] Visual: 40-50% opacity, desaturated color, no badge
    - [ ] Interaction: remains clickable and keyboard-focusable
    - [ ] Click shows: camera metadata + "No [species] images at this location" + "Adjust Filters" button
    - [ ] Hover tooltip: "CAM-042: No matching images"
    - [ ] ARIA label: "CAM-042: Camera location with no [species] images"
    - [ ] Animation: 300ms ease-out transition to/from grayed state, staggered 30ms per camera
    - [ ] Edge case: If ALL cameras are zero-results, show empty state in sidebar while map shows grayed cameras

**Reference:** Mockup `02c-browse-animl.html` camera cards

**Progressive Disclosure Integration:**
- Layer-level query (species, date range) applied in sidebar (Layer View) drives badge counts
- Feature-level query (camera-specific filters) does NOT affect map badges
- Badges remain visible when user drills into specific camera (sidebar in Feature View)

**Files to Create/Modify:**
- `src/v2/components/RightSidebar/ANiML/CameraListView.tsx`
- `src/v2/components/Map/AnimlCameraLayer.tsx` (map visualization with badges)

---

### 2.6: Implement Camera Detail Drill-Down

**Goal:** When user clicks a camera, show its detail view with images.

**Design Decision (Feb 3, 2026):** Resolved DFT-003 — "Bookmark" button only appears when a feature (camera) is selected. Button visibility follows the state machine defined below.

**Acceptance Criteria:**
- [ ] "← Back to Cameras" navigation
- [ ] Camera info header (name, location, status)
- [ ] Image filter UI (pre-populated from global filter if set)
- [ ] **Context-dependent button visibility:**

  | State | Available Actions |
  |-------|-------------------|
  | Layer not pinned, camera selected | "📌 Pin Layer" + "🔖 Bookmark This Camera" |
  | Layer pinned, camera selected | "🔖 Bookmark This Camera" only |

- [ ] "🔖 Bookmark This Camera" saves camera with current image filter (if any)
- [ ] Bookmark appears in Bookmarked Features widget, grouped under parent layer
- [ ] Image gallery showing filtered results
- [ ] Image gallery supports pagination or lazy loading

**Reference:** Mockup `02c-browse-animl.html` camera detail section

---

### 2.7: Investigate and Decide on Caching Strategy

**Goal:** Address the 8-12 second load time for ANiML data.

**Background:**
Current ANiML queries take 8-12 seconds because we're loading all data at once. This needs investigation and a decision on caching approach.

**Acceptance Criteria:**
- [ ] Document current query performance (what takes how long?)
- [ ] Identify the bottleneck (network? query complexity? data volume?)
- [ ] Evaluate caching options (see analysis below)
- [ ] Recommend and document decision in master plan
- [ ] If caching needed, create implementation sub-tasks

**Caching Options to Evaluate:**

| Option | Cost | Dev Effort | Performance Gain | Notes |
|--------|------|------------|------------------|-------|
| Client-side (React Query) | $0 | Low | Medium | Cache between navigations |
| Pre-computed JSON in Blob Storage | ~$0.02/mo | Medium | High | Nightly job creates summaries |
| Azure Table Storage as cache | ~$0.05/mo | Medium | High | Server-side KV cache |
| Azure Cache for Redis | ~$16/mo | High | Very High | Only if really needed |
| Lazy loading (don't load images until drill-down) | $0 | Low | High | UX change, not caching |

**Questions to Answer:**
1. What's slow? Loading cameras, or loading images, or both?
2. Can we defer image loading until camera drill-down?
3. Would pre-computed summary counts eliminate the slow query?
4. What's the acceptable load time target? (<2s? <1s?)

**Output:** 
- Add performance findings to "Service Analysis" section
- Document decision in master plan "Cross-Phase Decisions"
- If caching implemented, document approach in `design-system.md` or new doc

---

### 2.8: Use v1 SVG Icons for Map Markers and Animal Tags

**Goal:** Replace emoji-based map markers (`📷`) with the SVG icons used in the v1 implementation for a more polished look.

**Status:** ⚪ Not Started

**Acceptance Criteria:**
- [ ] Camera markers on map use SVG icon instead of emoji
- [ ] Animal tag rows in legend widget and browse tab use appropriate icons
- [ ] SVG icons sourced from v1 components (Lucide `Camera`, `Tag`, etc.) or custom SVGs
- [ ] Icons render correctly at map marker sizes (24-28px)

**Files to Modify:**
- `src/v2/components/Map/layers/animlLayer.ts` — replace `emojiToDataUri(CAMERA_EMOJI)` with SVG
- `src/v2/components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget.tsx` — add icons to rows
- `src/v2/components/RightSidebar/ANiML/AnimlBrowseTab.tsx` — add icons to tag rows

**Reference:** v1 `AnimlSidebar.tsx` uses Lucide `Camera`, `Tag` icons. Map markers in v1 used the MapView loaders.

---

### 2.9: Map Layers Widget Sync with Browse Filters

**Goal:** When the user builds a query in the ANiML Browse tab (selecting tags, cameras), the Map Layers widget row for "Camera Traps (ANiML)" should reflect the active query state.

**Status:** ⚪ Not Started

**Acceptance Criteria:**
- [ ] Widget row shows filter summary (e.g., "Mountain Lion, Coyote • 3 cameras")
- [ ] Filter count updates as user adds/removes filters
- [ ] Widget row highlights/animates when filter changes (visual feedback)
- [ ] Clearing filters in Browse tab resets widget row to default
- [ ] Filter summary format defined in Task 2.3 design decision

**Dependencies:** Task 2.3 (design decision defines widget text format), Task 2.4 (implementation)

**Files to Modify:**
- `src/v2/components/FloatingWidgets/MapLayersWidget/` — active layer row rendering
- `src/v2/context/AnimlFilterContext.tsx` — expose filter summary for widget consumption

---

### 2.10: Right Sidebar Scrollbar — Prevent Content Shift

**Goal:** When the right sidebar content grows (e.g., selecting species + camera expands filter sections and shows image list), the vertical scrollbar appears. The scrollbar should NOT cause content to shift left — content width should remain stable.

**Status:** ⚪ Not Started

**Acceptance Criteria:**
- [ ] Scrollbar overlays or reserves space so content width stays stable
- [ ] No horizontal jump when scrollbar appears/disappears
- [ ] Solution applies to right sidebar tab content area (flex-1 overflow-y-auto)

**Implementation Notes:**
- Consider `scrollbar-gutter: stable` (reserves space for scrollbar even when not visible)
- Alternative: overlay scrollbar (browser support varies)
- Reference: Phase 0 Task 5 — same pattern applied to Map Layers widget

**Files to Modify:**
- `src/v2/components/RightSidebar/RightSidebar.tsx` — tab content scroll container

---

### 2.11: Add Date/Time Frame Filter Above Species and Cameras

**Goal:** Add a date/time range query UI above the Species and Cameras filter sections in the ANiML Browse tab. Enables queries like "mountain lions at cameras A,B,C in summer 2023."

**Status:** 🟢 Complete (Feb 13, 2026)

**Acceptance Criteria:**
- [x] Date range picker (start date, end date) with free-form inputs + preset quick-select buttons
- [x] Placed above Species and Cameras filter sections
- [x] Integrates with AnimlFilterContext (startDate/endDate state, setDateRange, clearDateRange, hasDateFilter)
- [x] Filters image results by timestamp (passes startDate/endDate to queryImageLabelsCached)
- [x] Auto-apply behavior (DFT-039) — no separate "Search" button

**Design Decisions:**
- Both free-form date pickers AND preset quick-select buttons (Last 30 days, Last 6 months, This Year, Last Year)
- Date filter does NOT affect countLookups (species/camera counts remain all-time). Only image results are date-filtered. This is acceptable for MVP — re-computing counts per date range would require re-fetching grouped counts (~8-12s).
- Collapsible section matches FilterSection visual style (chevron, icon, badge, animated expand/collapse)
- Badge shows formatted date range summary when active, "All Time" when inactive
- Preset buttons highlight when active (emerald border/bg)
- Date inputs have min/max constraints to prevent invalid ranges

**Files Created/Modified:**
- `src/v2/components/RightSidebar/ANiML/DateFilterSection.tsx` — new collapsible date range picker component
- `src/v2/context/AnimlFilterContext.tsx` — added startDate/endDate state, setDateRange, clearDateRange, hasDateFilter, updated clearFilters
- `src/v2/components/RightSidebar/ANiML/AnimlBrowseTab.tsx` — added DateFilterSection above Species, passes dates to image query. **Count fix:** use actual `images.length` when fetched (not countLookups) so date-filtered counts match displayed results.

---

### 2.12: Image List Pagination (Prev/Next Page)

**Goal:** Replace "Load More" with a scrollable image list and Prev/Next Page controls underneath. Enables page-based navigation through large result sets.

**Status:** 🟢 Complete (Feb 13, 2026)

**Acceptance Criteria:**
- [x] Image list in scrollable container
- [x] Prev/Next Page buttons below the list
- [x] Page indicator (e.g., "Page 2 of 5" and "1-20 of 52")
- [x] Page size configurable (set to 20 per page via `PAGE_SIZE`)

**Implementation Notes:**
- Replaced "Load More" flow with explicit page state (`currentPage`) and fixed-size page slicing.
- Added reusable pagination controls in `ImageList` (Prev/Next buttons + page/range indicators).
- Applied consistently in Browse tab and both detail views so all ANiML image browsing follows one interaction pattern.

**Refinement (Feb 13):** Image results area expands to fill remaining sidebar space; always-visible scrollbar (`.scroll-area-animl-images`) so users can detect scrollability. Flex layout in `AnimlBrowseTab` + `expandToFill` prop in `ImageList`.

**Files Modified:** `AnimlBrowseTab.tsx`, `ImageList.tsx`, `CameraDetailView.tsx`, `AnimalDetailView.tsx`, `index.css`

---

### 2.13: Expanded Image View on Click

**Goal:** Click image thumbnail → show larger version in right sidebar. Lightbox-style expanded view within the sidebar (not modal overlay).

**Status:** ⚪ Not Started

**Acceptance Criteria:**
- [ ] Click thumbnail opens expanded view
- [ ] Larger image displayed within right sidebar
- [ ] Close button or click-outside to dismiss
- [ ] Metadata visible (species, timestamp, camera)

**Files to Create/Modify:** `ImageList.tsx`, new `ImageExpandedView.tsx` or equivalent

---

### 2.14: Arrow Key Navigation in Expanded View

**Goal:** In expanded image view, left/right arrow keys navigate between images.

**Status:** ⚪ Not Started

**Dependencies:** Task 2.13 (expanded view must exist)

**Acceptance Criteria:**
- [ ] Left arrow → previous image
- [ ] Right arrow → next image
- [ ] Wrap at ends (optional) or disable at first/last
- [ ] Focus/keyboard trap when expanded view is open

**Files to Modify:** `ImageExpandedView.tsx` (or equivalent)

---

## Service Analysis

> Completed via existing `animlService.ts` (1,512 lines, Dec 2025)

### Feature Service URLs
- Deployments (cameras): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/0`
- Image Labels (flattened): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/4`
- Image Labels (deduplicated): `https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/3`

### Camera Service Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Image/Tag Service Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| | | | |

### Query Performance Baseline
| Query Type | Avg Response Time | Data Volume | Notes |
|------------|-------------------|-------------|-------|
| All cameras (no images) | | | |
| All images for 1 camera | | | |
| Images filtered by species | | | |
| Current "load everything" | 8-12s | | This is the problem |

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| DFT-043: Convergent progressive disclosure — species filter position depends on mode | Feb 12, 2026 | Animal-first shows species filter at top (primary), camera-first shows it inside CameraDetailView (secondary). Matches mental model: "Where is X?" starts from species; "What's at Y?" starts from camera. |
| DFT-044: countLookups as 2-phase cache warming | Feb 12, 2026 | Phase 1 loads deployments + animalTags (fast, makes UI usable). Phase 2 loads grouped counts + builds countLookups (background, enables filtered counts). UI works without countLookups and upgrades when available. |
| DFT-045: Shared AnimalFilterSection component | Feb 12, 2026 | Same checkbox filter used in both modes and synced with legend widget via AnimlFilterContext. Camera-first shows camera-specific counts via `deploymentId` prop. |
| DFT-046: 3-column ImageGrid with Load More | Feb 12, 2026 | Grid layout for photo scanning (3 cols). Client-side "Load More" pagination (21 per batch = 3×7). Less jarring than page numbers; explicit user control. |
| DFT-047: Map Layers widget filter summary format | Feb 12, 2026 | Animal-first: "Mountain Lion, Coyote • 8 cameras". Camera-first: "CAM-042 • Mountain Lion, Coyote". No filter: "No filter applied". |
| DFT-048: ANiML image pagination uses Prev/Next pages | Feb 13, 2026 | Replaced "Load More" with explicit page navigation to improve wayfinding and positional awareness in large image result sets. Uses scrollable list + controls beneath (`Page X of Y`, `A-B of N`). |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

### Caching Decision

| Decision | Date | Rationale |
|----------|------|-----------|
| (pending investigation) | | |

---

## Open Questions

- [x] ~~Should we reuse any code from existing `AnimlDetailsSidebar.tsx`?~~ → Yes, reference v1 patterns; v2 reimplements with adapter pattern
- [ ] How to handle image thumbnails vs full images? (service provides `small_url` and `medium_url`)
- [x] ~~What's the relationship structure between cameras and images in the service?~~ → deployment_id links deployments (layer 0) to image_labels (layer 4)
- [ ] Backend work needed from Dan for caching?
- [ ] **NEW:** Browse tab UX flow — how to lay out the progressive filter steps (Task 2.3)
- [ ] **NEW:** Map Layers widget filter summary format — what text to show (Task 2.9)

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 2.2 | Added landing cards entry point (DFT-003c) and Overview tab as default (DFT-006) | Will + Claude |
| Feb 3, 2026 | 2.5 | Added numbered badge map visualization (DFT-012) with progressive disclosure integration | Will + Claude |
| Feb 3, 2026 | 2.3, 2.4, 2.6 | Resolved DFT-003: Context-dependent button visibility. "Pin Layer" only shows when layer not pinned; filter changes auto-apply to pinned layers. "Bookmark" only shows when camera is selected. | Will + Claude |
| Feb 4, 2026 | 2.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |
| Feb 4, 2026 | 2.5 | Resolved DFT-028: Zero-result cameras grayed out (not hidden). 40-50% opacity, desaturated, no badge. Remain clickable/keyboard-accessible. Preserves spatial context for negative evidence discovery. Animation: 300ms ease-out, staggered 30ms. | Will + Claude |
| Feb 4, 2026 | 2.5 | Resolved DFT-029: No badges when layer has no filter. Badges only appear when layer-level filter is applied (semantic indicator). Optional hover tooltip shows total count. Follows Gestalt figure/ground and Shneiderman's overview-first principles. | Will + Claude |

| Feb 12, 2026 | All | Added Readiness Assessment and Implementation Guide. Data Source Adapter Pattern complete (Phase 0 Task 23). Ready for parallel development on v2/animl branch. | Will + Claude |
| Feb 12, 2026 | 2.1, 2.2 | WIP: Created AnimlFilterContext, adapter, map layer, map behavior hook, sidebar shell (Overview + Browse tabs), legend widget. Wired into registry, V2App, layer factory. 8 new files, 4 modified files. | Will + Claude |
| Feb 12, 2026 | 2.3, 2.4, 2.8, 2.9 | Added new tasks: Browse tab interaction flow design decision (2.3), implementation (2.4), v1 SVG icons (2.8), Map Layers widget sync (2.9). Replaced old 2.3/2.4 (camera/image filter UI) with interaction-flow-first approach. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Convergent progressive disclosure design + implementation.** Animal-first: species filter at top → camera list → detail. Camera-first: camera list → detail with species filter inside. New: AnimalFilterSection (shared), ImageGrid (3-col + Load More), countLookups (2-phase cache warming). DFT-043 through DFT-047. 2 new files, 4 refactored files. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Iteration 1**: User feedback — lists too verbose, images need date visibility. Refactored to compact single-line lists, replaced ImageGrid with ImageList (vertical, date+time metadata). Created AnimalListView, AnimalDetailView. Sequential drill-down implementation. | Will + Claude |
| Feb 12, 2026 | 2.3–2.6 | **Iteration 2 (WIP)**: User feedback — sequential drill-down too restrictive for research queries (need "mountain lions AND coyotes at cameras A,B,C in summer 2023"). Pivoting to multi-dimensional filter system. Design review via ui-ux-reviewer recommends **Option 2: Expandable filter sections** (Species/Cameras/Date/Spatial, all multi-select, collapsible). Next: implement expandable sections with multi-select checkboxes. | Will + Claude |
| Feb 13, 2026 | 2.3–2.6 | **Iteration 2 Phase 1 MVP complete.** FilterSection.tsx (expandable, multi-select, Select All/Clear All). AnimlFilterContext: selectedCameras, toggleCamera, clearCameras, selectAllAnimals, selectAllCameras, filteredImageCount, getFilteredCountForSpecies. AnimlBrowseTab: Species + Cameras FilterSections, live result count, debounced image fetch, ImageList. Researchers can select multiple species AND cameras for complex queries. | Will + Claude |
| Feb 13, 2026 | 2.10, 2.11 | **New tasks added.** 2.10: Right sidebar scrollbar — prevent content shift when scrollbar appears (e.g., selecting species + camera). 2.11: Add date/time frame filter above Species and Cameras in Browse tab. | Will + Claude |
| Feb 13, 2026 | 2.10 | **Complete.** Added `scrollbar-gutter: stable` to right sidebar scroll area in `RightSidebar.tsx` + `.scroll-area-right-sidebar` CSS class in `index.css`. Prevents horizontal content shift when overflow scrollbar appears (e.g., expanding filter sections). Thin hover-reveal scrollbar for visual consistency. | Will + Claude |
| Feb 13, 2026 | 2.11 | **Complete.** DateFilterSection component: collapsible date range picker with start/end date inputs + quick-select presets (Last 30 days, Last 6 months, This Year, Last Year). AnimlFilterContext: added startDate/endDate state, setDateRange, clearDateRange, hasDateFilter. AnimlBrowseTab: DateFilterSection placed above Species, passes dates to queryImageLabelsCached. Auto-apply per DFT-039. **Count fix:** use actual images.length when fetched (not countLookups) so date-filtered counts match displayed results. Added Tasks 2.12 (image list pagination), 2.13 (expanded image view), 2.14 (arrow key nav). | Will + Claude |
| Feb 13, 2026 | 2.12 | **Complete.** Replaced "Load More" with page-based pagination across ANiML image views. Added scrollable image list containers, Prev/Next controls under list, page indicator (`Page X of Y`), and range indicator (`A-B of N`). Implemented in `AnimlBrowseTab`, `CameraDetailView`, `AnimalDetailView`, and shared `ImageList`. | Will + Claude |
| Feb 13, 2026 | 2.12 | **Refinement.** Image results expand to fill remaining sidebar space; always-visible scrollbar (`.scroll-area-animl-images`) for scrollability affordance. Flex layout + `expandToFill` in ImageList. **Next:** 2.13 (expanded view on click), 2.14 (arrow key nav). | Will + Claude |

---

## Implementation Guide for Next Session

### Step-by-Step Instructions

This section provides detailed guidance for implementing the Animl adapter following the proven iNaturalist pattern.

#### STEP 1: Create AnimlFilterContext (Foundation)

**File:** `src/v2/context/AnimlFilterContext.tsx`

**Purpose:** Central cache and filter state for Animl camera trap data. Similar to `INaturalistFilterContext.tsx`.

**Key Features:**
- Lazy loading: Data NOT fetched on mount, only when `warmCache()` is called
- Camera deployments: Fetch from `animlService.queryDeploymentsCached()`
- Image labels: Fetch from `animlService.queryImageLabelsCached()`
- Animal category counts: Use `animlService.getAnimalCategoryCountsCached()`
- Filter state: `selectedAnimals` Set, `dateRange`, `deploymentFilter`, `regionFilter`
- Methods: `toggleAnimal()`, `setDateRange()`, `selectAll()`, `clearFilters()`

**State Shape:**
```typescript
{
  // Cache
  deployments: AnimlDeployment[],
  imageLabels: AnimlImageLabel[],
  animalTags: AnimlAnimalTag[],
  loading: boolean,
  error: string | null,
  dataLoaded: boolean,
  
  // Filters
  selectedAnimals: Set<string>,  // Animal category names
  dateRange: { start: Date | null, end: Date | null },
  deploymentFilter: string | null,  // "All" | specific deployment ID
  regionFilter: string | null,  // "All" | "North" | "South" etc.
  
  // Methods
  warmCache: () => void,
  toggleAnimal: (animalName: string) => void,
  setDateRange: (start: Date | null, end: Date | null) => void,
  setDeploymentFilter: (deployment: string | null) => void,
  setRegionFilter: (region: string | null) => void,
  selectAll: () => void,
  clearFilters: () => void,
}
```

**Import Existing Service:**
```typescript
import {
  queryDeploymentsCached,
  queryImageLabelsCached,
  getAnimalCategoryCountsCached,
  type AnimlDeployment,
  type AnimlImageLabel,
  type AnimlAnimalTag,
} from '../../services/animlService';
```

**Provider Mounting:** Will be added to `V2App.tsx` in Step 6.

---

#### STEP 2: Create Animl Adapter

**File:** `src/v2/dataSources/animl/adapter.tsx`

**Pattern:** Follow `src/v2/dataSources/inaturalist/adapter.tsx`

**Content:**
```typescript
import type { DataSourceAdapter, OverviewTabProps, CacheStatus } from '../types';
import { AnimlOverviewTab } from '../../components/RightSidebar/ANiML/AnimlOverviewTab';
import { AnimlBrowseTab } from '../../components/RightSidebar/ANiML/AnimlBrowseTab';
import { AnimlLegendWidget } from '../../components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget';
import { AnimlFilterProvider, useAnimlFilter } from '../../context/AnimlFilterContext';

// Wrapper that warms cache when Overview tab mounts
function AnimlOverviewTabWithCache(props: OverviewTabProps) {
  const { warmCache } = useAnimlFilter();
  
  React.useEffect(() => {
    warmCache();
  }, [warmCache]);
  
  return <AnimlOverviewTab {...props} />;
}

export const animlAdapter: DataSourceAdapter = {
  id: 'animl',
  layerIds: ['animl-camera-traps'],
  OverviewTab: AnimlOverviewTabWithCache,
  BrowseTab: AnimlBrowseTab,
  LegendWidget: AnimlLegendWidget,
  CacheProvider: AnimlFilterProvider,
};

export function useAnimlCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useAnimlFilter();
  return { loading, dataLoaded, warmCache };
}
```

---

#### STEP 3: Create Map Behavior Hook

**File:** `src/v2/dataSources/animl/useMapBehavior.ts`

**Pattern:** Follow `src/v2/dataSources/inaturalist/useMapBehavior.ts`

**Key Logic:**
- Warm cache when layer first appears (pinned OR activated)
- Populate GraphicsLayer when data loads (one-time)
- Update badge counts when filters change
- Reset populated flag when layer is removed

**Dependencies:**
- `useAnimlFilter()` for data and filter state
- `populateAnimlLayer()` from `layers/animlLayer.ts` (create in Step 4)
- `updateAnimlBadges()` from `layers/animlLayer.ts`

---

#### STEP 4: Create Animl Map Layer

**File:** `src/v2/components/Map/layers/animlLayer.ts`

**Pattern:** Follow `src/v2/components/Map/layers/inaturalistLayer.ts`

**Functions:**
```typescript
export function createAnimlLayer(options): GraphicsLayer
export function populateAnimlLayer(layer, deployments): void
export function updateAnimlBadges(layer, deployments, imageLabels, filters): void
```

**Camera Icon Design:**
- Use PictureMarkerSymbol with camera emoji or SVG icon
- Badge overlay showing filtered image count (TextSymbol)
- Badge only appears when filters are active (DFT-029)
- Zero-result cameras: grayed out (40-50% opacity, DFT-028)

**Update Layer Factory:** Add case to `src/v2/components/Map/layers/index.ts`:
```typescript
case 'animl-camera-traps':
  return createAnimlLayer({ id: `v2-${layerId}`, ...options });
```

---

#### STEP 5: Update Registry

**File:** `src/v2/dataSources/registry.ts`

**Changes:** Uncomment all Animl lines (marked with `// ← v2/animl`):
```typescript
// Line 21-22: Uncomment imports
import { animlAdapter, useAnimlCacheStatus } from './animl/adapter';
import { useAnimlMapBehavior } from './animl/useMapBehavior';

// Line 32: Uncomment map entry
animl: animlAdapter,

// Line 57: Uncomment hook call
useAnimlMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);

// Line 69, 75: Uncomment cache status
const animl = useAnimlCacheStatus();
case 'animl': return animl;
```

---

#### STEP 6: Mount Provider in V2App

**File:** `src/v2/V2App.tsx`

**Change:** Add `AnimlFilterProvider` wrapper:
```typescript
import { AnimlFilterProvider } from './context/AnimlFilterContext';

// Wrap existing providers:
<LayerProvider>
  <MapProvider>
    <INaturalistFilterProvider>
      <AnimlFilterProvider>
        {/* existing content */}
      </AnimlFilterProvider>
    </INaturalistFilterProvider>
  </MapProvider>
</LayerProvider>
```

---

#### STEP 7: Create Right Sidebar Components

**Files to Create:**
1. `src/v2/components/RightSidebar/ANiML/AnimlSidebar.tsx` (may not need — adapter handles routing)
2. `src/v2/components/RightSidebar/ANiML/AnimlOverviewTab.tsx`
3. `src/v2/components/RightSidebar/ANiML/AnimlBrowseTab.tsx`
4. `src/v2/components/RightSidebar/ANiML/CameraListView.tsx`
5. `src/v2/components/RightSidebar/ANiML/CameraDetailView.tsx`
6. `src/v2/components/RightSidebar/ANiML/CameraCard.tsx`

**AnimlOverviewTab Pattern:**
- Read from `useAnimlFilter()` for total counts
- Display dataset description
- "Browse Features →" button (per DFT-027)

**AnimlBrowseTab Pattern:**
- Landing cards on first visit: "Browse by Animal" vs "Browse by Camera" (DFT-003c)
- Mode-switch link (DFT-042)
- Dual-level filtering (camera filters + image filters, Task 2.3/2.4)
- Camera list with badges (Task 2.5)
- Drill-down to camera detail (Task 2.6)

---

#### STEP 8: Create Legend Widget

**File:** `src/v2/components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget.tsx`

**Pattern:** Follow `INaturalistLegendWidget.tsx`

**Features:**
- Positioned `bottom-6 right-6` (floating over map)
- Collapsible with expand/collapse button
- Animal category list (sorted by count descending)
- Each row: color dot, icon, label, count
- Click toggles filter (syncs with Browse tab)
- Loading state with spinner

**Data Source:** `useAnimlFilter()` for `animalTags`, `selectedAnimals`, `toggleAnimal()`

---

### Testing Checklist

After implementation:

- [ ] Activate "Camera Traps (ANiML)" layer → Overview tab loads
- [ ] Data warms cache on first activation (~2-3s load time)
- [ ] Revisiting layer shows instant data (cache hit)
- [ ] "Browse Features →" button switches to Browse tab
- [ ] Landing cards appear: "Browse by Animal" vs "Browse by Camera"
- [ ] Legend widget appears at bottom-right
- [ ] Camera icons appear on map
- [ ] Clicking animal in legend filters cameras (badges update)
- [ ] Clicking camera navigates to detail view
- [ ] Filter changes sync between Browse tab, legend, and map

---

### Common Pitfalls

1. **Forgetting to warm cache** — AnimlFilterContext must call `warmCache()` when Overview tab mounts
2. **Not using idempotent cache warming** — Check `loading` or `dataLoaded` flags before fetching
3. **GraphicsLayer not refreshing** — Call `layer.graphics.removeAll()` before re-populating
4. **Badge visibility** — Only show badges when filters are active (DFT-029)
5. **React hooks order** — All hooks in `useAllMapBehaviors` must be called unconditionally

---

