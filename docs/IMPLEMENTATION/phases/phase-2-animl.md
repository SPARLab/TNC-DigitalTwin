# Phase 2: ANiML Right Sidebar

**Status:** ⚪ Not Started  
**Progress:** 0 / 7 tasks  
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
| 2.1 | Query ANiML service to understand attributes | ⚪ Not Started | | |
| 2.2 | Create ANiML right sidebar shell | ⚪ Not Started | | |
| 2.3 | Implement camera filter UI (Level 2) | ⚪ Not Started | | |
| 2.4 | Implement global image filter UI (Level 3) | ⚪ Not Started | | Dual-level pattern |
| 2.5 | Implement camera list with filtered image counts | ⚪ Not Started | | |
| 2.6 | Implement camera detail drill-down | ⚪ Not Started | | |
| 2.7 | Investigate and decide on caching strategy | ⚪ Not Started | | Current load: 8-12s |

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

**Acceptance Criteria:**
- [ ] Component renders when ANiML layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] **Overview tab is the default/active tab**
- [ ] Overview tab includes prominent "Browse Features →" button to navigate to Browse tab
- [ ] Browse tab shows landing cards on first visit (Animal-First vs Camera-First)
- [ ] Landing cards include icon, title, and brief tagline for each mode
- [ ] User preference is remembered (skip landing page on return visits)
- [ ] Each mode includes subtle "Switch to [other mode]" link
- [ ] Component can show camera list OR camera detail (drill-down pattern)

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

**Design Decision (Feb 3, 2026):** Resolved DFT-003 — Button visibility is context-dependent. "📌 Pin Layer" only appears when layer is NOT pinned. Once pinned, filter changes auto-apply to the pinned layer.

**Acceptance Criteria:**
- [ ] Region dropdown
- [ ] Status dropdown (Active, Inactive, etc.)
- [ ] Filter updates camera list below
- [ ] Filter updates map markers (badge counts reflect active filter)
- [ ] **Context-dependent pin button:**
  - [ ] If layer NOT pinned: Show "📌 Pin Layer" or "📌 Pin with [filter summary]" button
  - [ ] If layer IS pinned: No pin button needed — filter changes auto-apply to pinned layer
  - [ ] Widget row animates/highlights when filter changes (visual feedback)

**Reference:** Mockup `02c-browse-animl.html` "Filter Cameras" section

---

### 2.4: Implement Global Image Filter UI (Level 3)

**Goal:** Create filters for images that apply to ALL cameras in the result.

**This is the dual-level filtering pattern unique to ANiML.**

**Design Decision (Feb 3, 2026):** Resolved DFT-003 — Once layer is pinned, both camera filter AND image filter changes auto-apply. No "Pin Layer with Query" button needed after initial pin.

**Acceptance Criteria:**
- [ ] Species dropdown
- [ ] Date range picker
- [ ] Time of day filter (optional)
- [ ] Filter shows aggregate count: "X cameras • Y total images"
- [ ] Clear visual distinction between camera filters (Level 2) and image filters (Level 3)
- [ ] **Auto-apply behavior:** If layer is already pinned, filter changes update the pinned layer automatically
- [ ] Widget row animates/highlights when filter changes (confirms change was applied)

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

**Decision (Feb 3, 2026):** Resolved DFT-012 — Numbered badges on camera icons showing filtered image counts. Map visualization integrates with progressive disclosure pattern.

**Acceptance Criteria:**
- [ ] Each camera card shows filtered image count (not total)
- [ ] Example: "CAM-042 • 47 mountain lion images"
- [ ] "View Camera →" button navigates to detail view
- [ ] "Bookmark with Current Filter" saves camera + active image filter
- [ ] **Map visualization with numbered badges:**
  - [ ] Camera icons on map display count badge (upper-right corner)
  - [ ] Badge shows filtered image count matching layer-level filter
  - [ ] Badge color: contrasting (red, blue, or TNC brand accent)
  - [ ] Badge only appears when layer-level filter is applied
  - [ ] Clicking camera icon navigates sidebar to that camera's filtered images
  - [ ] Hover tooltip shows species name and date range context
  - [ ] Cameras with 0 matching images: hidden or grayed out (to be decided)

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
| (pending investigation) | | |

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
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 2.2 | Added landing cards entry point (DFT-003c) and Overview tab as default (DFT-006) | Will + Claude |
| Feb 3, 2026 | 2.5 | Added numbered badge map visualization (DFT-012) with progressive disclosure integration | Will + Claude |
| Feb 3, 2026 | 2.3, 2.4, 2.6 | Resolved DFT-003: Context-dependent button visibility. "Pin Layer" only shows when layer not pinned; filter changes auto-apply to pinned layers. "Bookmark" only shows when camera is selected. | Will + Claude |

