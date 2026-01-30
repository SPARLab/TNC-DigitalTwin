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
- Design discussion: See DFT-001 in `design-feedback-tracker.md`

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

**Widget Design:**
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
- **Filter indicators:**
  - 🌪️ (funnel emoji) shows filter count (e.g., `🌪️5` = 5 filters)
  - Parenthetical shows primary distinguisher (e.g., `(mt. lion)`)
  - No filters = desaturated funnel, still clickable
  - Clicking funnel or layer name → opens Browse tab in right sidebar
- **Multiple views of same layer:** Supported via unique distinguishers (see DFT-013)

**A/B Testing Note:**
Include a debug toggle (dev-only or settings panel) to switch between:
- **Option A:** Text-based filter indicator (`• 5 filters` on second line)
- **Option B:** Icon-based filter indicator (`🌪️5` inline)

This allows collecting user feedback before finalizing the design.

**Auto-Collapse Behavior (Jan 29, 2026):** Resolved DFT-005 — Widgets auto-collapse when viewing time-series data to reduce screen crowding.
- When time-series chart/pop-up is active (e.g., Dendra sensor detail view), Pinned Layers widget auto-collapses
- Bookmarked Features widget remains expanded (needed for "bookmark range" action)
- Widgets restore to previous state when time-series view closes
- User can manually override auto-collapse by expanding widget

**Acceptance Criteria:**
- [ ] Widget renders in top-left of map area
- [ ] Widget is collapsible/expandable (user-controlled)
- [ ] Widget auto-collapses when time-series data view is active
- [ ] Widget restores previous state when time-series view closes
- [ ] Active Layer section shows selected layer with [📌] button
- [ ] Pinned Layers section shows all pinned layers
- [ ] Each pinned layer row shows: visibility toggle (👁), name, distinguisher, filter indicator (🌪️N), remove button (✕)
- [ ] Filter indicator shows count and is clickable (opens Browse tab)
- [ ] No filters = desaturated funnel icon
- [ ] Clicking pinned layer in sidebar restores visibility if hidden
- [ ] Debug toggle switches between text and icon filter representations

**Reference:**
- Mockup: `mockups/01-full-layout-overview.html` (will be updated with this design)
- Design discussion: See DFT-001 in `design-feedback-tracker.md`

**Files to Create:**
- `src/v2/components/FloatingWidgets/PinnedLayersWidget.tsx`
- `src/v2/components/FloatingWidgets/ActiveLayerRow.tsx`
- `src/v2/components/FloatingWidgets/PinnedLayerRow.tsx`
- `src/v2/components/FloatingWidgets/FilterIndicator.tsx`

---

### 0.6: Implement Bookmarked Features Floating Widget

**Goal:** Create the floating widget that shows bookmarked features.

**Status Note:** Awaiting team feedback on bookmark paradigm.

**Auto-Collapse Behavior (Jan 29, 2026):** Resolved DFT-005 — Bookmarked Features widget remains expanded during time-series viewing (needed for "bookmark range" action).

**Acceptance Criteria:**
- [ ] Widget renders in top-right of map area
- [ ] Widget is collapsible/expandable (user-controlled)
- [ ] Widget remains expanded during time-series data viewing (unlike Pinned Layers widget)
- [ ] Shows list of bookmarked features
- [ ] Each feature shows: icon, label, source, filter context (if applicable), view/remove buttons
- [ ] "Export All" button exists (Note: moved to global header per DFT-002)

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
| Jan 29, 2026 | 0.5, 0.6 | Added auto-collapse behavior for time-series viewing (DFT-005) | Will + Claude |

