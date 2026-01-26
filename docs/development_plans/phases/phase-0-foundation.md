# Phase 0: Foundation

**Status:** ⚪ Not Started  
**Progress:** 0 / 6 tasks  
**Branch:** `v2/foundation`  
**Blocking:** YES - All other phases depend on this  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Set up the V2 application shell, routing, state management, and shared components that all data source phases will use.

## Reference Documents

- Master Plan: `docs/development_plans/master-development-plan.md`
- Design System: `docs/development_plans/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02a-unified-layout.html`

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 0.1 | Create v2/ folder structure and routing | ⚪ Not Started | | |
| 0.2 | Implement Left Sidebar shell component | ⚪ Not Started | | |
| 0.3 | Implement Pinned Layers state management | ⚪ Not Started | | |
| 0.4 | Implement Bookmarks state management | ⚪ Not Started | | Awaiting team feedback |
| 0.5 | Implement Pinned Layers floating widget | ⚪ Not Started | | |
| 0.6 | Implement Bookmarked Features floating widget | ⚪ Not Started | | Awaiting team feedback |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 0.1: Create v2/ Folder Structure and Routing

**Goal:** Set up the code structure so v2 can be developed alongside the legacy app.

**Acceptance Criteria:**
- [ ] `src/v2/` folder exists with structure from master plan
- [ ] `src/v2/V2App.tsx` renders a basic shell
- [ ] `src/App.tsx` routes to v2 or legacy based on URL param or feature flag
- [ ] Legacy app still works at default route
- [ ] V2 app accessible at `/v2` or with `?v2=true`

**Files to Create/Modify:**
- `src/v2/V2App.tsx` (create)
- `src/App.tsx` (modify)
- `src/legacy/LegacyApp.tsx` (move current App content)

---

### 0.2: Implement Left Sidebar Shell Component

**Goal:** Create the persistent left sidebar that shows categories and layers.

**Acceptance Criteria:**
- [ ] Left sidebar renders with correct width
- [ ] Categories are collapsible/expandable
- [ ] Layers show within categories
- [ ] Pin button exists on each layer (wired to state in 0.3)
- [ ] Selected layer is visually highlighted
- [ ] Clicking layer name triggers selection (for right sidebar to respond)

**Reference:** 
- Mockup: `mockups/02a-unified-layout.html` (left sidebar section)
- Layout doc: `docs/development_plans/archive/left-sidebar-layout.md`

**Files to Create:**
- `src/v2/components/LeftSidebar/LeftSidebar.tsx`
- `src/v2/components/LeftSidebar/CategoryGroup.tsx`
- `src/v2/components/LeftSidebar/LayerRow.tsx`

**Data Source:**
- Use existing category mappings from `src/data-sources/tnc-arcgis/category_mappings.json`
- Or create new layer registry for v2

---

### 0.3: Implement Pinned Layers State Management

**Goal:** Create the state management for pinned layers that all components can access.

**Acceptance Criteria:**
- [ ] `usePinnedLayers` hook exists
- [ ] Can pin/unpin layers
- [ ] Can toggle layer visibility
- [ ] Can set active query per layer
- [ ] State persists to localStorage
- [ ] State shape matches paradigm doc

**State Shape (from paradigm doc):**
```typescript
interface PinnedLayer {
  id: string;
  name: string;
  visible: boolean;
  activeQuery: Record<string, any> | null;
  featureCount?: { total: number; filtered?: number };
}
```

**Files to Create:**
- `src/v2/hooks/usePinnedLayers.ts`
- `src/v2/store/pinnedLayersStore.ts` (if using Zustand/similar)

---

### 0.4: Implement Bookmarks State Management

**Goal:** Create the state management for bookmarked features.

**Status Note:** Awaiting team feedback on bookmark paradigm. Can stub out the interface.

**Acceptance Criteria:**
- [ ] `useBookmarks` hook exists
- [ ] Can add/remove bookmarks
- [ ] Bookmarks can optionally include Level 3 filter (for pointer rows)
- [ ] State persists to localStorage
- [ ] State shape matches paradigm doc

**State Shape (from paradigm doc):**
```typescript
interface Bookmark {
  id: string;
  sourceLayer: string;
  featureId: string;
  featureLabel: string;
  relatedDataQuery?: Record<string, any>; // Only for pointer rows
}
```

**Files to Create:**
- `src/v2/hooks/useBookmarks.ts`
- `src/v2/store/bookmarksStore.ts` (if using Zustand/similar)

---

### 0.5: Implement Pinned Layers Floating Widget

**Goal:** Create the floating widget that shows pinned layers over the map.

**Acceptance Criteria:**
- [ ] Widget renders in top-left of map area
- [ ] Widget is collapsible/expandable
- [ ] Shows list of pinned layers
- [ ] Each layer shows: visibility toggle, name, query indicator, remove button
- [ ] Query indicator shows when a filter is active
- [ ] "Edit Query" and "Clear" buttons work
- [ ] Drag-and-drop reordering (nice to have)

**Reference:**
- Mockup: `mockups/02a-unified-layout.html` (floating widget section)

**Files to Create:**
- `src/v2/components/FloatingWidgets/PinnedLayersWidget.tsx`
- `src/v2/components/FloatingWidgets/PinnedLayerCard.tsx`

---

### 0.6: Implement Bookmarked Features Floating Widget

**Goal:** Create the floating widget that shows bookmarked features.

**Status Note:** Awaiting team feedback on bookmark paradigm.

**Acceptance Criteria:**
- [ ] Widget renders in top-right of map area
- [ ] Widget is collapsible/expandable
- [ ] Shows list of bookmarked features
- [ ] Each feature shows: icon, label, source, filter context (if applicable), view/remove buttons
- [ ] "Export All" button exists

**Reference:**
- Mockup: `mockups/02a-unified-layout.html` (bookmark widget section)

**Files to Create:**
- `src/v2/components/FloatingWidgets/BookmarkedFeaturesWidget.tsx`
- `src/v2/components/FloatingWidgets/BookmarkCard.tsx`

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

- [ ] What state management library? (Zustand? React Context? Redux?)
- [ ] How to handle layer registry? (Use existing category_mappings.json or create new?)
- [ ] Feature flag mechanism for v2 toggle?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |

