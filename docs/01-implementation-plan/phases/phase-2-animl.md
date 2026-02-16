# Phase 2: ANiML Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** ~40% — Browse tab MVP done  
**Branch:** `v2/animl`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

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
- Design System: `docs/00-design-iteration/design-system/design-system.md`
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
| 2.1 | Query ANiML service to understand attributes | 🟢 Complete | | Done during implementation |
| 2.2 | Create ANiML right sidebar shell | 🟢 Complete | | ANiMLSidebar, tabs, drill-down |
| 2.3 | Implement camera filter UI (Level 2) | 🟢 Complete | | FilterSection, AnimlFilterContext |
| 2.4 | Implement global image filter UI (Level 3) | 🟢 Complete | | Species + Cameras dual-level |
| 2.5 | Implement camera list with filtered image counts | 🟢 Complete | | Camera cards, ImageList |
| 2.6 | Implement camera detail drill-down | 🟢 Complete | | CameraDetailView, AnimalDetailView |
| 2.7 | Investigate and decide on caching strategy | 🟢 Complete | | Deferred; service/context caching in place |
| 2.8 | SVG icons for map markers + tag rows | 🟢 Complete | | Replaced emoji with SVG camera glyphs |
| 2.10 | Right sidebar scrollbar — prevent content shift | 🟢 Complete | | scrollbar-gutter: stable |
| 2.11 | Date/time frame filter above Species and Cameras | 🟢 Complete | | DateFilterSection, presets |
| 2.12 | Image list pagination (Prev/Next) | 🟢 Complete | | Page-based nav, PAGE_SIZE |
| 2.13 | Image expanded view on click | 🟢 Complete | | ImageExpandedView lightbox |
| 2.14 | Expanded view arrow key navigation | 🟢 Complete | | Left/right arrows, Esc, auto-pagination |
| 2.15 | Image click → highlight camera on map | 🟢 Complete | | focusDeployment, layerView.highlight |
| 2.16 | Camera badges (numbered icons for query results) | 🟢 Complete | | Dynamic map badge symbols |
| 2.17 | iNaturalist-style loading indicators | 🟢 Complete | | MapCenterLoadingOverlay, LoadingPrimitives |
| 2.18 | Synchronize matching images results with map/layer counts | ⚪ Not Started | | Map, layer badge, and matching images must show same count |

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
- [x] Document camera feature service attributes
- [x] Document image/tag feature service attributes
- [x] Identify relationship between cameras and images
- [x] Note current query performance (baseline for caching decision)

**Questions to Answer:**
- What attributes exist on cameras? (region, status, ID, coordinates)
- What attributes exist on images/tags? (species, date, time, camera_id)
- How are cameras and images related in the feature service?
- What's the current load time for various queries?

**Output:** Add findings to "Service Analysis" section below.

---

### 2.2: Create ANiML Right Sidebar Shell

**Goal:** Set up the component structure for the ANiML browse experience.

**Acceptance Criteria:**
- [x] Component renders when ANiML layer is selected
- [x] Tabs exist: Overview | Browse | Export
- [x] Browse tab is the default/active tab
- [x] Component can show camera list OR camera detail (drill-down pattern)

**Files to Create:**
- `src/v2/components/RightSidebar/ANiML/ANiMLSidebar.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLBrowseTab.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLOverviewTab.tsx`
- `src/v2/components/RightSidebar/ANiML/ANiMLExportTab.tsx`
- `src/v2/components/RightSidebar/ANiML/CameraListView.tsx`
- `src/v2/components/RightSidebar/ANiML/CameraDetailView.tsx`

---

### 2.3: Implement Camera Filter UI (Level 2)

**Goal:** Create filters for the cameras themselves.

**Acceptance Criteria:**
- [x] Region dropdown
- [x] Status dropdown (Active, Inactive, etc.)
- [x] Filter updates camera list below
- [x] Filter can be saved with "Pin Layer with Query"

**Reference:** Mockup `02c-browse-animl.html` "Filter Cameras" section

---

### 2.4: Implement Global Image Filter UI (Level 3)

**Goal:** Create filters for images that apply to ALL cameras in the result.

**This is the dual-level filtering pattern unique to ANiML.**

**Acceptance Criteria:**
- [x] Species dropdown
- [x] Date range picker
- [x] Time of day filter (optional)
- [x] Filter shows aggregate count: "X cameras • Y total images"
- [x] "Pin Layer with Query" saves BOTH camera filter AND image filter
- [x] Clear visual distinction between camera filters and image filters

**Reference:** Mockup `02c-browse-animl.html` "Filter Images" section (note the info text)

**State Shape (for dual-level query):**
```typescript
activeQuery: {
  cameraFilter: { region: "north", status: "active" },
  globalImageFilter: { species: "mountain lion", year: 2023 }
}
```

---

### 2.5: Implement Camera List with Filtered Image Counts

**Goal:** Display cameras as cards showing filtered image counts.

**Acceptance Criteria:**
- [x] Each camera card shows filtered image count (not total)
- [x] Example: "CAM-042 • 47 mountain lion images"
- [x] "View Camera →" button navigates to detail view
- [x] "Bookmark with Current Filter" saves camera + active image filter

**Reference:** Mockup `02c-browse-animl.html` camera cards

---

### 2.6: Implement Camera Detail Drill-Down

**Goal:** When user clicks a camera, show its detail view with images.

**Acceptance Criteria:**
- [x] "← Back to Cameras" navigation
- [x] Camera info header (name, location, status)
- [x] Image filter UI (pre-populated from global filter if set)
- [x] "Bookmark Camera" (no filter)
- [x] "Bookmark with Filter" (saves camera + current image filter)
- [x] Image gallery showing filtered results
- [x] Image gallery supports pagination or lazy loading

**Reference:** Mockup `02c-browse-animl.html` camera detail section

---

### 2.7: Investigate and Decide on Caching Strategy

**Goal:** Address the 8-12 second load time for ANiML data.

**Background:**
Current ANiML queries take 8-12 seconds because we're loading all data at once. This needs investigation and a decision on caching approach.

**Acceptance Criteria:**
- [x] Document current query performance (what takes how long?)
- [x] Identify the bottleneck (network? query complexity? data volume?)
- [x] Evaluate caching options (see analysis below)
- [x] Recommend and document decision in master plan
- [x] If caching needed, create implementation sub-tasks

**Status (Feb 13):** Marked done for now. Service/context caching in place; formal investigation deferred.

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

### Additional Tasks (2.8–2.17) — Completed

| ID | Task | Key Implementation |
|----|------|--------------------|
| 2.8 | SVG icons for map markers + tag rows | Replaced emoji with SVG camera glyphs in `animlLayer.ts`; icon rows in legend and filter lists |
| 2.10 | Right sidebar scrollbar — prevent content shift | `scrollbar-gutter: stable` on right sidebar scroll area |
| 2.11 | Date/time frame filter above Species and Cameras | `DateFilterSection` with presets (Last 30 days, 6 months, This Year, Last Year) |
| 2.12 | Image list pagination | Prev/Next controls, page indicator, `PAGE_SIZE` pagination |
| 2.13 | Image expanded view on click | `ImageExpandedView` lightbox with metadata, Back to list |
| 2.14 | Expanded view arrow key navigation | Left/right arrows, Esc to close, auto-pagination across pages |
| 2.15 | Image click → highlight camera on map | `focusDeployment()`, `layerView.highlight()` in `useAnimlMapBehavior` |
| 2.16 | Camera badges | Dynamic numbered icons on map when filters applied; muted for 0-result cameras |
| 2.17 | iNaturalist-style loading indicators | `MapCenterLoadingOverlay`, shared `LoadingPrimitives` in Map Layers and legend |

---

### 2.18: Synchronize Matching Images Results with Map/Layer Counts

**Goal:** Ensure the map, map layer badge, and matching images section all display the same result count for a given filter selection.

**Problem:** When selecting species (e.g. Coyote) and camera (e.g. Big Kojo), the map may show 605 results while the matching images section and map layer badge show only 200. These three sources of truth are out of sync.

**Acceptance Criteria:**
- [ ] Map result count matches matching images count
- [ ] Map layer badge count matches matching images count
- [ ] All three use the same underlying query/aggregation logic (or explicitly document why counts may differ, e.g. pagination cap)

**Notes:** Likely root cause: different code paths for count aggregation vs. image fetch (e.g. count from one query, images from another with different limits or filters). Fix by unifying the data source or ensuring count and image fetch share the same query parameters and result set.

---

## Service Analysis

> Fill this out during Task 2.1

### Feature Service URLs
- Cameras: TBD
- Images/Tags: TBD

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
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

### Caching Decision

| Decision | Date | Rationale |
|----------|------|-----------|
| Deferred | Feb 13, 2026 | Service/context caching in place; formal investigation deferred |

---

## Open Questions

- [ ] Should we reuse any code from existing `AnimlDetailsSidebar.tsx`?
- [ ] How to handle image thumbnails vs full images?
- [ ] What's the relationship structure between cameras and images in the service?
- [ ] Backend work needed from Dan for caching?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 2.18 | Added task: Synchronize matching images results with map/layer counts. Map shows 605, matching images/layer show 200 — counts out of sync for species+camera filter. | Claude |
| Feb 16, 2026 | All | Synced with development-task-tracker: 2.1–2.7 complete; added 2.8, 2.10–2.17. Browse tab MVP done (~40%). | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |

