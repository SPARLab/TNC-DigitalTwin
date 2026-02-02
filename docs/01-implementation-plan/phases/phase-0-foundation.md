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

- Master Plan: `docs/master-plan.md`
- Design System: `docs/00-design-iteration/design-system/design-system.md`
- Paradigm: `docs/00-design-iteration/feedback/meeting-notes/data-catalog-ux-paradigm-jan-21-2026.md`
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
- [ ] Global header includes "Export All" button (shopping cart icon) in top-right corner
- [ ] Shopping cart button shows badge indicator with count of pinned layers + bookmarked features
- [ ] Shopping cart button uses yellow/orange accent color to stand out
- [ ] Clicking shopping cart opens Export Builder modal (stub for now, implemented in Phase 5)

**Design Decision (Jan 29, 2026):** Resolved DFT-002 — Export button lives in global header (top-right) with shopping cart metaphor.

**Files to Create/Modify:**
- `src/v2/V2App.tsx` (create)
- `src/v2/components/Header/Header.tsx` (create — includes Export All button)
- `src/v2/components/Header/ExportCartButton.tsx` (create — shopping cart button with badge)
- `src/App.tsx` (modify)
- `src/legacy/LegacyApp.tsx` (move current App content)

---

### 0.2: Implement Left Sidebar Shell Component

**Goal:** Create the persistent left sidebar that shows categories and layers.

**Design (Jan 27, 2026):** Resolved DFT-001 — sidebar shows only selection state, no eyeball/pin icons.

**Acceptance Criteria:**
- [ ] Left sidebar renders with correct width
- [ ] Categories are collapsible/expandable
- [ ] Layers show within categories
- [ ] Selection indicator (●) shows which layer is active
- [ ] Clicking layer name selects it and makes it active (visible on map + right sidebar)
- [ ] Clicking pinned layer restores visibility if it was hidden
- [ ] No eyeball or pin icons in sidebar (widget handles this)

**Reference:** 
- Mockup: `mockups/01-full-layout-overview.html` (will be updated with this design)
- Design discussion: See DFT-001 in `design-feedback-design-task-tracker.md`

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

**Goal:** Create the floating widget that shows active and pinned layers over the map.

**Decision (Jan 27, 2026):** Resolved DFT-001 with Model C (selection = active, pin separate).  
**Decision (Feb 2, 2026):** Resolved DFT-003b — "Create New View" lives in expanded panel when layer is active.  
**Decision (Feb 2, 2026):** Removed swatch from row spec; active state indicated by expansion + visual treatment.

**Widget Design (Collapsed State):**
```
┌─────────────────────────────────────┐
│ 👁 ACTIVE LAYER                     │
├─────────────────────────────────────┤
│ ● Camera Traps (mt. lion)  🌪️4 📌 │
├─────────────────────────────────────┤
│ 📌 PINNED LAYERS                    │
├─────────────────────────────────────┤
│ 👁 Camera Traps (mt. lion)  🌪️5 ✕ │
│ 👁 Camera Traps (deer)      🌪️3 ✕ │
│ 👁 iNaturalist (birds)      🌪️2 ✕ │
│ 👁 Fire Hazard              🌪️  ✕ │  ← gray funnel = no filters
└─────────────────────────────────────┘
```

**Widget Design (Expanded State — when pinned layer is clicked):**
```
┌───────────────────────────────────────────────┐
│ 👁 ACTIVE LAYER                               │
├───────────────────────────────────────────────┤
│ ● Camera Traps (mt. lion)            🌪️4 📌 │
├───────────────────────────────────────────────┤
│ 📌 PINNED LAYERS                              │
├───────────────────────────────────────────────┤
│ 👁 ■ Camera Traps (mt. lion)         🌪️5 ✕ │  ← EXPANDED
│   ┌─────────────────────────────────────────┐ │
│   │ Filters: species = mt. lion, date>2024 │ │
│   │ [Edit Filters] [Clear] [+ New View]    │ │
│   └─────────────────────────────────────────┘ │
│ 👁 ■ Camera Traps (deer)             🌪️3 ✕ │
│ 👁 ■ iNaturalist (birds)             🌪️2 ✕ │
└───────────────────────────────────────────────┘
```

**Row elements:** `[drag] [👁] [Layer Name (distinguisher)] [🌪️N] [✕]`  
**Note:** No swatch in row. Map legend shows symbology for active layer only.

**Key Behaviors:**
- **Active Layer section:** Shows currently selected layer from left sidebar
  - Only ONE active non-pinned layer at a time
  - Selecting another layer in sidebar replaces active layer
  - [📌] button pins the active layer (moves to Pinned section)
- **Pinned Layers section:** Shows all saved layers with queries
  - Multiple layers can be pinned simultaneously
  - Each has independent visibility toggle (👁 blue = visible, gray = hidden)
  - Clicking pinned layer in sidebar makes it active AND restores visibility if hidden
  - [✕] button unpins the layer
- **Expanded panel behavior (DFT-003b):**
  - Clicking a pinned layer row expands it to show filter summary + action buttons
  - Only ONE layer expanded at a time (clicking another collapses the previous)
  - Action buttons: **Edit Filters**, **Clear**, **+ Create New View**
  - "Create New View" duplicates the layer with current filters as a new pinned entry
  - Active state indicated by: expansion (panel visible), visual treatment (background color, left border accent, etc.)
- **Filter indicators:**
  - 🌪️ (funnel emoji) shows filter count (e.g., `🌪️5` = 5 filters)
  - Parenthetical shows primary distinguisher (e.g., `(mt. lion)`)
  - No filters = desaturated funnel, still clickable
  - Clicking funnel or "Edit Filters" → opens Browse tab in right sidebar
- **Multiple views of same layer:** Supported via unique distinguishers (see DFT-013)
- **Filter change animation (DFT-003):** When user changes filters in right sidebar for a pinned layer, the widget row animates/highlights to confirm the change (addresses eye-tracking concern since editing happens in right sidebar but visual confirmation appears in left-floating widget)

**A/B Testing Note:**
Include a debug toggle (dev-only or settings panel) to switch between:
- **Option A:** Text-based filter indicator (`• 5 filters` on second line)
- **Option B:** Icon-based filter indicator (`🌪️5` inline)

This allows collecting user feedback before finalizing the design.

**Acceptance Criteria:**
- [ ] Widget renders in top-left of map area
- [ ] Widget is collapsible/expandable (user-controlled)
- [ ] Widget auto-collapses when time-series data view is active
- [ ] Widget restores previous state when time-series view closes
- [ ] Active Layer section shows selected layer with [📌] button
- [ ] Pinned Layers section shows all pinned layers
- [ ] Each pinned layer row shows: drag handle, visibility toggle (👁), name, distinguisher, filter indicator (🌪️N), remove button (✕)
- [ ] **No swatch in row** — map legend handles symbology for active layer only
- [ ] Clicking pinned layer row expands it to show filter summary + action buttons
- [ ] Only ONE layer expanded at a time (clicking another collapses the previous)
- [ ] Expanded panel shows: filter summary text, "Edit Filters" button, "Clear" button, "+ Create New View" button
- [ ] Active state indicated by: expansion (panel visible) + visual treatment (background color, left border accent)
- [ ] "Edit Filters" button opens Browse tab in right sidebar
- [ ] "Clear" button removes all filters from the layer
- [ ] "+ Create New View" button duplicates the layer with current filters as a new pinned entry
- [ ] Filter indicator shows count and is clickable (opens Browse tab)
- [ ] No filters = desaturated funnel icon
- [ ] Clicking pinned layer in sidebar restores visibility if hidden
- [ ] Debug toggle switches between text and icon filter representations
- [ ] Widget row animates/highlights when its filter changes (visual feedback for right sidebar edits)
- [ ] Optional: brief toast notification when filter is applied (to be tested)

**Reference:**
- Mockup: `mockups/02a-unified-layout.html` (canonical layout reference)
- Design discussion: See DFT-001 and DFT-003b in `docs/task-tracker.md`
- Widget spec: See `docs/00-design-iteration/feedback/resolved/dft-001-resolution-summary.md`

**Files to Create:**
- `src/v2/components/FloatingWidgets/PinnedLayersWidget.tsx`
- `src/v2/components/FloatingWidgets/ActiveLayerRow.tsx`
- `src/v2/components/FloatingWidgets/PinnedLayerRow.tsx`
- `src/v2/components/FloatingWidgets/FilterIndicator.tsx`

---

### 0.6: Implement Bookmarked Features Floating Widget

**Goal:** Create the floating widget that shows bookmarked features.

**Status Note:** Awaiting team feedback on bookmark paradigm.

**Acceptance Criteria:**
- [ ] Widget renders in top-right of map area
- [ ] Widget is collapsible/expandable
- [ ] Shows list of bookmarked features
- [ ] Each feature shows: icon, label, source, filter context (if applicable), view/remove buttons
- [ ] NO "Export All" button in widget (moved to global header per DFT-002 resolution)

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
| Jan 27, 2026 | 0.2, 0.5 | Updated with DFT-001 resolution (Model C: selection = active) | Will + Claude |
| Jan 27, 2026 | 0.5 | Added A/B testing for filter representation | Will + Claude |
| Jan 29, 2026 | 0.1, 0.6 | Updated with DFT-002 resolution (Export button in global header) | Will + Claude |
| Jan 29, 2026 | 0.5 | Added widget animation requirement from DFT-003 resolution | Will + Claude |
| Jan 29, 2026 | 0.5, 0.6 | Added auto-collapse behavior for time-series viewing (DFT-005) | Will + Claude |
| Feb 2, 2026 | 0.5 | Added expanded panel behavior with "Create New View" button (DFT-003b) | Will + Claude |
| Feb 2, 2026 | 0.5 | Removed swatch from row spec; active state indicated by expansion + visual treatment | Will + Claude |

