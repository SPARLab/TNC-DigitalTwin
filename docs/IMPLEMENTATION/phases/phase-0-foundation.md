# Phase 0: Foundation

**Status:** 🟢 Foundation complete — parallel branches ready  
**Progress:** CON-GL-01 through 08 + 0.9 + D20-01 complete  
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
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/PLANNING/feedback/transcripts/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockup: `mockups/02a-unified-layout.html`

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| TF-12 | ⚪ Not Started | Feb 20, 2026 | Expand "Open Table Overlay" to all TNC ArcGIS feature service layers (currently only Oil Seeps) | Medium priority; Trisalyn reacted very positively — "this is how the GIS brain thinks." Source: Trisalyn QA Feb 20 |

*Completed tasks (CON-GL-01 through CON-GL-08, 0.9, D20-01) archived. See `docs/archive/phases/phase-0-foundation-completed.md`.*

## Backlog (Nice to Have / v2)

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-GL-03 | ⚪ Not Started | Feb 18, 2026 | Spatial filter: select polygon from pinned layer | Extra credit / v2 |

## Task Status

*Completed tasks archived. See `docs/archive/phases/phase-0-foundation-completed.md`.*

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

**Component Spec (Feb 6, 2026):** ✅ Complete — `docs/PLANNING/component-specs/left-sidebar.md`

**Design Decisions:**
- **DFT-001 (Jan 27, 2026):** Resolved — sidebar shows active/pinned state. Eye/pin icons appear on pinned layers only (not unpinned catalog layers). Eye toggles map visibility, pin toggles pinned state. Grayed pin icon on hover for unpinned layers (click to pin). All icons are clickable and sync with Map Layers widget.
- **DFT-045 (Feb 6, 2026):** Resolved — DataOne special shortcut rows. When domain categories expand, special shortcut rows appear at bottom ("📚 DataOne Datasets (count)"). Clicking activates DataOne with domain pre-filtered in Browse tab. Canonical location remains under "Research Datasets" category.

**Acceptance Criteria:**
- [ ] Left sidebar renders with correct width (280px fixed)
- [ ] 13 TNC domain categories + "Research Datasets" category, alphabetically ordered
- [ ] Categories are collapsible/expandable (all start collapsed)
- [ ] Layers show within categories
- [ ] Active layer has bold text + emerald left border + green bg
- [ ] Clicking layer name activates it (visible on map + right sidebar opens to Overview tab)
- [ ] Clicking pinned-but-hidden layer restores visibility
- [ ] Eye icons appear on pinned layers only (blue = visible, gray = hidden)
- [ ] Pin icons: solid emerald when pinned (click to unpin), grayed on hover when unpinned (click to pin)
- [ ] Eye and pin icons sync bidirectionally with Map Layers widget
- [ ] Search bar filters layer list (500ms debounce, 2+ chars, substring matching)
- [ ] DataOne shortcut rows render at bottom of expanded domain categories
- [ ] Shortcut rows only show when DataOne has datasets for that domain (count > 0)
- [ ] Clicking shortcut row activates DataOne with domain pre-filter
- [ ] Keyboard navigation: Enter/Space toggles categories, Arrow keys navigate layers, Escape clears search

**Reference:** 
- Component Spec: `docs/PLANNING/component-specs/left-sidebar.md`
- Mockup: `mockups/02a-unified-layout.html`
- Design decisions: DFT-001 (sidebar icons), DFT-045 (DataOne shortcut rows)

**Files to Create:**
- `src/v2/components/LeftSidebar/LeftSidebar.tsx`
- `src/v2/components/LeftSidebar/CategoryGroup.tsx`
- `src/v2/components/LeftSidebar/LayerRow.tsx`
- `src/v2/components/LeftSidebar/DataOneShortcutRow.tsx`

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
**Decision (Feb 2, 2026):** Resolved DFT-004 — Widget shows filter **status** (🌪️ indicator) but does NOT contain filter editing UI. "Edit Filters" button navigates to right sidebar. Sidebar is the canonical filter editor.  
**Decision (Feb 3, 2026):** Resolved DFT-013 — Multiple filtered views use "Multiple Saved, Single Visible" model. Nested widget structure when 2+ views exist; only one view visible at a time (mutual exclusivity); memory-preserving parent toggle.  
**Decision (Feb 3, 2026):** Resolved DFT-015 — Empty state design. Widget title uses configurable terminology: "Pinned {childNoun} Layers". First visit shows educational empty state (expanded); returning user sees laconic message. See design-system.md for terminology config.  
**Decision (Feb 4, 2026):** Resolved DFT-019 — "Edit Filters" button navigation behavior. Button labeled "Edit Filters →" (with arrow), right-aligned in expanded panel. Widget remains expanded (user can reference filter state). Right sidebar uses crossfade animation (~150-200ms) for tab transitions. Separation of Concerns: Widget manages visibility/stacking; sidebar manages deep editing.  
**Decision (Feb 4, 2026):** Resolved DFT-025 — Create New View transition animation. Inline transformation with sequential staging (250-300ms total): row expands → children appear → new child highlights briefly. Respects `prefers-reduced-motion`. Focus moves to new child row. Screen reader announces state change.  
**Decision (Feb 4, 2026):** Resolved DFT-031 — Confirmation dialog strategy. **Hybrid approach:** No confirmation for single-item actions (unpin layer, clear filters, delete filtered view)—these execute immediately with 5-10s undo toast. Bulk actions (clear all, if implemented) require custom modal confirmation. Widget header has persistent undo button (always visible, grayed when inactive). Stack size: 5 actions per region. Actions covered: Unpin layer, delete filtered view, clear filters. Pattern documented in design-system.md. Replace `window.confirm()` with custom modal component for any bulk operations.  
**Decision (Feb 5, 2026):** Resolved DFT-034 — Drag-and-drop reorder feedback. Enhanced lifted row (60% opacity, 95% scale, 2deg rotation, dashed border), 4px drop line with background highlight, 400ms settle animation with green highlight, toast notification for map z-order updates. Keyboard support essential for v2.0 WCAG compliance: arrow keys (up/down), Shift+Home/End (top/bottom), ARIA announcements for screen readers. Aligns with animation timing standards (400ms = DFT-025, DFT-031). See DFT-034 resolution for complete specification.

**Widget Header Layout:**
```
┌──────────────────────────────────────────────────┐
│  Pinned Feature Layers        [↶]  [−]  [✕]     │
│  ↑ title                      ↑undo ↑collapse ↑close
├──────────────────────────────────────────────────┤
```

**Undo Button States:**
- Inactive: Gray, 40% opacity, "No actions to undo" tooltip, not clickable
- Active: Emerald-600, full opacity, "Undo: [action]" tooltip, clickable
- Animation: Subtle pulse (1 cycle, 400ms) when activated, respects `prefers-reduced-motion`

**Widget Design (Collapsed State):**
```
┌─────────────────────────────────────┐
│ 👁 ACTIVE LAYER                     │
├─────────────────────────────────────┤
│ ● Camera Traps (mt. lion)  🌪️4 📌 │
├─────────────────────────────────────┤
│ 📌 PINNED LAYERS                    │
├─────────────────────────────────────┤
│ 👁 Camera Traps (mt. lion)  🌪️5 ✕ │  ← Single view (flat)
│ 👁 iNaturalist (birds)      🌪️2 ✕ │  ← Single view (flat)
│ 👁 Fire Hazard              🌪️  ✕ │  ← gray funnel = no filters
└─────────────────────────────────────┘
```

**Widget Design (Nested — Multiple Filtered Views per DFT-013):**
```
┌──────────────────────────────────────────┐
│ 👁 ACTIVE LAYER                          │
├──────────────────────────────────────────┤
│ ● Camera Traps (mt. lion)       🌪️4 📌 │
├──────────────────────────────────────────┤
│ 📌 PINNED LAYERS                         │
├──────────────────────────────────────────┤
│ 👁 Dendra Sensors (2024)         🌪️1 ✕ │  ← Single view (flat)
│ 👁 Camera Traps ▼                    ✕  │  ← Parent (nested)
│    👁 mountain lion 🌪️5                 │  ← Child view (visible)
│      deer                                │  ← Child view (hidden, eye grayed)
│    [+ New View]                          │
└──────────────────────────────────────────┘
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
│   │ [Clear] [+ New View]    [Edit Filters →]│ │  ← Arrow + right-aligned
│   └─────────────────────────────────────────┘ │
│ 👁 ■ Camera Traps (deer)             🌪️3 ✕ │
│ 👁 ■ iNaturalist (birds)             🌪️2 ✕ │
└───────────────────────────────────────────────┘
```

**Note:** "Edit Filters →" is right-aligned and includes arrow to indicate navigation to right sidebar.

**Row elements:** `[drag] [👁] [Layer Name (distinguisher)] [🌪️N] [✕]`  
**Note:** No swatch in row. Map legend shows symbology for active layer only.

**Key Behaviors:**
- **Active Layer section:** Shows currently active layer from left sidebar
  - Only ONE active non-pinned layer at a time
  - Activating another layer in sidebar replaces active layer
  - [📌] button pins the active layer (moves to Pinned section)
- **Pinned Layers section:** Shows all saved layers with queries
  - Multiple layers can be pinned simultaneously
  - Each has independent visibility toggle (👁 blue = visible, gray = hidden)
  - Clicking pinned layer in sidebar makes it active AND restores visibility if hidden
  - [✕] button unpins the layer
- **Expanded panel behavior (DFT-003b, DFT-019):**
  - Clicking a pinned layer row expands it to show filter summary + action buttons
  - Only ONE layer expanded at a time (clicking another collapses the previous)
  - Action buttons: **Clear** (left), **+ Create New View**, **Edit Filters →** (right-aligned, with arrow)
  - "Edit Filters →" navigates to Browse tab in right sidebar; widget panel stays expanded so user can reference filter state
  - "Create New View" duplicates the layer with current filters as a new pinned entry
  - Active state indicated by: expansion (panel visible), visual treatment (background color, left border accent, etc.)
- **Filter indicators (status display, NOT editing):**
  - 🌪️ (funnel emoji) shows filter count (e.g., `🌪️5` = 5 filters)
  - Parenthetical shows primary distinguisher (e.g., `(mt. lion)`)
  - No filters = desaturated funnel, still clickable
  - Clicking funnel or "Edit Filters" → opens Browse tab in right sidebar
  - **Widget does NOT contain filter editing UI** (per DFT-004) — sidebar is canonical editor
- **Multiple filtered views (DFT-013) — "Multiple Saved, Single Visible" model:**
  - **Single-view layers:** Remain flat (no nesting) until second view is created
  - **Multi-view layers:** Promote to nested structure (parent + child views)
  - **Mutual exclusivity:** Only ONE child view visible at a time (eye ON); others hidden (eye grayed)
  - **Parent eye toggle:** ON if any child visible; OFF if all children hidden
  - **Click child row:** Makes that view visible, auto-hides previously visible view (entire row is clickable)
  - **Click child eye to turn OFF:** Also turns off parent eye (no children visible)
  - **Click parent eye to turn ON:** Restores previously-selected child view (memory-preserving)
  - **[+ New View] button:** Creates duplicate child view with current filters
  - **Transition:** When "Create New View" is clicked on single-view layer, layer promotes to nested structure with original as first child
- **Filter change animation (DFT-003):** When user changes filters in right sidebar for a pinned layer, the widget row animates/highlights to confirm the change (addresses eye-tracking concern since editing happens in right sidebar but visual confirmation appears in left-floating widget)

**Filter Indicator (DFT-024 Resolution):**
- Use icon-based approach: Lucide `Filter` icon + count
- Visual states:
  - **Has filters:** `[Filter 5]` — colored badge, clickable
  - **No filters:** `[Filter]` — muted gray, still clickable
- Tooltip: "5 filters applied" or "No filters — click to add"
- ARIA label: `aria-label="5 filters applied. Click to edit."`
- CSS styling will be determined during implementation

**Acceptance Criteria:**
- [ ] Widget renders in top-left of map area
- [ ] Widget is collapsible/expandable (user-controlled)
- [ ] Widget auto-collapses when time-series data view is active
- [ ] Widget restores previous state when time-series view closes
- [ ] Active Layer section shows active layer with [📌] button
- [ ] Pinned Layers section shows all pinned layers
- [ ] Each pinned layer row shows: drag handle, visibility toggle (👁), name, distinguisher, filter indicator (Filter icon + count), remove button (✕)
- [ ] **No swatch in row** — map legend handles symbology for active layer only
- [ ] Clicking pinned layer row expands it to show filter summary + action buttons
- [ ] Only ONE layer expanded at a time (clicking another collapses the previous)
- [ ] Expanded panel shows: filter summary text, "Clear" button (left), "+ Create New View" button, "Edit Filters →" button (right-aligned, with arrow)
- [ ] Active state indicated by: expansion (panel visible) + visual treatment (background color, left border accent)
- [ ] "Edit Filters →" button opens Browse tab in right sidebar (widget panel remains expanded for reference)
- [ ] Right sidebar tab switches use crossfade animation (~150-200ms) — global pattern per DFT-019
- [ ] **Widget header includes undo button (DFT-031):**
  - [ ] Undo button always present in header (right side, before collapse/close)
  - [ ] Inactive state: Gray, 40% opacity, "No actions to undo" tooltip
  - [ ] Active state: Emerald-600, full opacity, "Undo: [action]" tooltip
  - [ ] Subtle pulse animation (1 cycle, 400ms) when activated
  - [ ] Respects `prefers-reduced-motion` preference
  - [ ] Stack size: 5 actions per widget (single-level for v2.0)
  - [ ] Actions covered: Unpin layer, delete filtered view, clear filters
  - [ ] See design-system.md for full undo button specification
- [ ] "Clear" button removes all filters from the layer **without confirmation** (DFT-031: immediate action + undo toast)
- [ ] "+ Create New View" button duplicates the layer with current filters as a new pinned entry
- [ ] Filter indicator shows count and is clickable (opens Browse tab)
- [ ] No filters = muted gray filter icon (still clickable)
- [ ] Filter indicator has tooltip: "N filters applied" or "No filters — click to add"
- [ ] Widget row animates/highlights when its filter changes (visual feedback for right sidebar edits)
- [ ] Optional: brief toast notification when filter is applied (to be tested)
- [ ] **Empty state (DFT-015):**
  - [ ] Widget title uses configurable terminology from `src/config/terminology.ts`: "Pinned {childNoun} Layers"
  - [ ] First visit (never pinned before): Show expanded educational empty state with muted pin icon, "No layers pinned." title, "Pin layers from the left sidebar to save them here." body
  - [ ] Returning user (has pinned before, currently empty): Show laconic message "Pinned layers appear here."
  - [ ] Collapsed header includes instructive text: "(pin layers from the left)"
  - [ ] Empty state uses design tokens: icon `w-12 h-12 text-gray-300`, title `text-sm font-medium text-gray-700`, body `text-sm text-gray-500`
  - [ ] Team design toggle for initial widget state (expanded vs collapsed)
- [ ] **Multiple filtered views (DFT-013):**
  - [ ] Single-view layers remain flat (no nesting) until second view is created
  - [ ] Multi-view layers show nested structure (parent + indented child views)
  - [ ] Parent eye toggle: ON if any child visible, OFF if all hidden
  - [ ] Only ONE child view visible at a time (mutual exclusivity)
  - [ ] Clicking anywhere in child row toggles that view's visibility
  - [ ] Clicking child eye to turn OFF also turns off parent eye
  - [ ] Clicking parent eye to turn ON restores previously-selected child (memory-preserving)
  - [ ] [+ New View] button appears in nested structure, creates duplicate child view
  - [ ] When "Create New View" clicked on single-view layer, layer promotes to nested structure
- [ ] **Create New View transition animation (DFT-025):**
  - [ ] Animation sequence: button press → row expansion (0-150ms) → children appear (150-250ms) → new child highlight (300-500ms)
  - [ ] Row expands vertically with `ease-out` timing
  - [ ] Parent row styling: `bg-slate-50` or subtle left border, `font-semibold` text, chevron (▼) appears
  - [ ] Children indented (`ml-6` / 24px) with subtle connecting line
  - [ ] Original child has eye ON, new child has eye OFF (per mutual exclusivity)
  - [ ] New child flashes `bg-green-100` fading to normal over 300-500ms
  - [ ] Total animation duration: 250-300ms
  - [ ] Focus moves to new child row after animation completes
  - [ ] Screen reader announces: "New view created. {LayerName} now has {count} views."
  - [ ] Respects `prefers-reduced-motion` media query (instant state change + brief highlight only if reduced motion enabled)
  - [ ] Debounce "Create New View" button to prevent animation stacking
  - [ ] No layout shift or janky scrolling during animation
- [ ] **Drag-and-drop reorder (DFT-034):**
  - [ ] Drag handle (`⋮⋮` icon, Lucide `GripVertical`) on each pinned layer row
  - [ ] Hover drag handle: `cursor: grab`, color shift `#94a3b8` → `#64748b`
  - [ ] Active drag: `cursor: grabbing`
  - [ ] Dragged row visual: 60% opacity, 95% scale, 2deg rotation, dashed blue border (`#3b82f6`), elevated shadow
  - [ ] Drop target: 4px solid blue line (`#3b82f6`) at top or bottom of target card + subtle background highlight (`rgba(59, 130, 246, 0.05)`)
  - [ ] Drop animation: 400ms settle animation (`ease-out`) with green highlight (`#dcfce7`)
  - [ ] Map z-order update: Reordering layers updates map rendering order (top of widget = top of map)
  - [ ] Toast notification: "Map layer order updated" (2s auto-dismiss, bottom-center position)
  - [ ] Keyboard support (WCAG 2.1.1): Arrow Up/Down moves layer up/down one position, Shift+Home moves to top, Shift+End moves to bottom
  - [ ] ARIA live region announces position changes: "{LayerName} moved to position {N} of {total}"
  - [ ] Focus maintained on drag handle after keyboard reorder
  - [ ] Respects `prefers-reduced-motion`: No rotation on drag, no bounce on drop (instant change + highlight only)
  - [ ] Edge case: Hide drag handles when only 1 pinned layer (nothing to reorder)
  - [ ] Edge case: Invalid drop (outside widget) snaps card back with brief shake animation (2px, 2 cycles)
  - [ ] Debounce map updates by 300ms to prevent thrashing during rapid reorders
  - [ ] See DFT-034 resolution for complete CSS/JavaScript specifications

**Reference:**
- Mockup: `mockups/02a-unified-layout.html` (canonical layout reference)
- Design discussion: See DFT-001 and DFT-003b in `docs/planning-task-tracker.md`
- Widget spec: See `docs/PLANNING/resolved-decisions/dft-001-resolution-summary.md`

**Files to Create:**
- `src/v2/components/FloatingWidgets/PinnedLayersWidget.tsx`
- `src/v2/components/FloatingWidgets/ActiveLayerRow.tsx`
- `src/v2/components/FloatingWidgets/PinnedLayerRow.tsx`
- `src/v2/components/FloatingWidgets/FilterIndicator.tsx`

---

### 0.6: Implement Bookmarked Features Floating Widget

**Goal:** Create the floating widget that shows bookmarked features.

**Design Decision (Feb 2, 2026):** Resolved DFT-007 — Bookmarks are grouped by parent layer within the widget. Layer headers are non-interactive context labels (muted styling, no hover) that help users form the correct mental model (layers contain features). This structure addresses UX principles: Conceptual Model, Proximity, Recognition over Recall, Signifiers, Visual Hierarchy.

**Design Decision (Feb 4, 2026):** Resolved DFT-020 — Single "🔖 Bookmark" button for pointer-row features. Auto-captures current Level 3 filter if active. Multiple bookmarks of same feature allowed (each = different "view"). "Edit Filter" action on bookmark allows post-save correction. Applies to ANiML cameras, Dendra sensors, DataOne datasets.

**Design Decision (Feb 5, 2026):** Resolved DFT-036 — Feature highlight on bookmark hover. Hovering a bookmark row highlights the corresponding feature on the map (if visible in viewport). Cyan ring (4px width, 8px offset) with subtle pulse (2 cycles, 800ms). Off-screen features show "📍 Off-screen" text indicator; clicking [View] button pans to feature. Keyboard support: highlight follows Tab focus, ARIA announcements. Matches GIS conventions (ArcGIS Pro, QGIS attribute table ↔ map coordination). Deferred to Phase 6: edge indicators (directional arrows), bidirectional highlighting.

**Acceptance Criteria:**
- [ ] Widget renders in top-right of map area
- [ ] Widget is collapsible/expandable
- [ ] Shows list of bookmarked features **grouped by parent layer**
- [ ] **Layer headers** (non-interactive context labels):
  - Muted color (gray text, ~60% opacity)
  - No hover state, no background change
  - No buttons/icons (no 👁, no ✕, no chevron)
  - Different typography (smaller, uppercase, or lighter weight)
  - Full-width span with optional dotted line or background tint
- [ ] **Feature rows** (interactive):
  - Standard hover states and clickable styling
  - Shows: icon, label, filter context (if applicable)
  - Visibility toggle [👁] and remove button [✕]
  - **For pointer rows with filter:** Show "Edit Filter" action alongside [View] and [✕]
  - **For pointer rows without filter:** Show only [View] and [✕]
  - **For self-contained rows:** Show only [View] and [✕] (no "Edit Filter" — these have no Level 3 data)
- [ ] NO "Export All" button in widget (moved to global header per DFT-002 resolution)
- [ ] AUTO-collapses when time-series data is active (DFT-005)
- [ ] **Widget header includes undo button (DFT-031):**
  - [ ] Undo button always present in header (right side, before collapse/close)
  - [ ] Inactive state: Gray, 40% opacity, "No actions to undo" tooltip
  - [ ] Active state: Emerald-600, full opacity, "Undo: [action]" tooltip
  - [ ] Subtle pulse animation (1 cycle, 400ms) when activated
  - [ ] Respects `prefers-reduced-motion` preference
  - [ ] Stack size: 5 actions per widget (single-level for v2.0)
  - [ ] Actions covered: Remove bookmark, remove multiple bookmarks
  - [ ] See design-system.md for full undo button specification
  - [ ] **Note (DFT-031):** Remove bookmark action executes immediately without confirmation (undo toast provides safety)
- [ ] **Empty state (DFT-015):**
  - [ ] Widget title uses configurable terminology from `src/config/terminology.ts`: "Bookmarked {childNoun}s"
  - [ ] First visit (never bookmarked before): Show expanded educational empty state with muted bookmark icon, "No {childNoun}s bookmarked." title, "Bookmarks save specific {childNoun}s within layers (cameras, sensors, observations). Bookmark {childNoun}s from the right sidebar." body
  - [ ] Returning user (has bookmarked before, currently empty): Show laconic message "Bookmarked {childNoun}s appear here."
  - [ ] Collapsed header includes instructive text: "(bookmark {childNoun}s from the right)"
  - [ ] Empty state uses design tokens: icon `w-12 h-12 text-gray-300`, title `text-sm font-medium text-gray-700`, body `text-sm text-gray-500`
  - [ ] Team design toggle for initial widget state (expanded vs collapsed)
  - [ ] Note: Drone imagery and LiDAR are pin-only layers — they will never have bookmark entries
- [ ] **Hover-to-highlight interaction (DFT-036):**
  - [ ] Hovering bookmark row highlights corresponding map feature (if in viewport)
  - [ ] Highlight style: Cyan ring (4px width, 8px offset), subtle pulse (2 cycles, 800ms, `ease-in-out`)
  - [ ] Elevated z-order (renders above other features)
  - [ ] Instant feedback (<100ms via map API)
  - [ ] Respects `prefers-reduced-motion` (static ring, no pulse)
  - [ ] Off-screen features: show "📍 Off-screen" text indicator (gray, 12px) in widget row
  - [ ] Click [View] button to pan + zoom to off-screen features (deliberate action)
  - [ ] Keyboard support: highlight follows Tab focus when navigating rows
  - [ ] ARIA live region announces: "Feature CAM-042 highlighted on map" (polite)
  - [ ] Debounce rapid hover events (50ms) to prevent map thrashing
  - [ ] Single highlight at a time (clear previous on new hover)
  - [ ] Layer headers: no hover highlight (non-interactive per DFT-007)
  - [ ] Only highlight when widget is expanded (not collapsed)

**ASCII Wireframe (Updated with DFT-020 resolution):**
```
┌────────────────────────────────────────────────────────────────┐
│ 🔖 BOOKMARKED FEATURES                                         │
├────────────────────────────────────────────────────────────────┤
│ ┄┄ Camera Traps ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │  ← Non-interactive layer label
│    CAM-042 → Mountain Lions 2023                               │  ← With filter
│    47 images • [View] [Edit Filter] [✕]                        │
│    CAM-015                                                      │  ← Without filter
│    All images • [View] [✕]                                     │
│ ┄┄ Dendra Sensors ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│    Sensor ABC-123 → Mar 2024                                   │  ← With filter
│    90 data points • [View] [Edit Filter] [✕]                   │
│ ┄┄ iNaturalist ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│    Observation #45231                                           │  ← Self-contained (no filter)
│    [View] [✕]                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Note:** "Edit Filter" only shows for pointer-row bookmarks that have related data (ANiML, Dendra, DataOne). Self-contained rows (iNaturalist, eBird, fire perimeters) only show [View] and [✕].

**Reference:**
- Mockup: `mockups/02a-unified-layout.html` (bookmark widget section)
- DFT-020 resolution: Single button pattern for pointer rows

**Files to Create:**
- `src/v2/components/FloatingWidgets/BookmarkedFeaturesWidget.tsx`
- `src/v2/components/FloatingWidgets/BookmarkCard.tsx`
- `src/v2/components/FloatingWidgets/BookmarkLayerHeader.tsx` (non-interactive group header)

---

### D20-01: Right Sidebar Collapse Button

**Goal:** Add a collapse button to the right sidebar so users can maximize map/legend real estate on smaller screens (e.g., laptops).

**Source:** Dan feedback, Feb 20, 2026 — `docs/feedback/meeting-notes/extracted-tasks-dan-feedback-feb-20-2026.md`

**Acceptance Criteria:**
- [x] Right sidebar has a collapse button (e.g., chevron or similar affordance)
- [x] Default state: sidebar open
- [x] When user collapses: sidebar stays collapsed until user manually re-expands
- [x] No auto-reopen on layer change, tab switch, or other app events
- [x] Collapsed state persists across session (localStorage or equivalent) — user preference respected
- [x] When collapsed: a small expand affordance (e.g., tab or button) remains visible so user can re-expand

**Design Decision (from meeting):** Default open. Once collapsed by user, do not auto-reopen. User must intentionally re-expand.

**Implementation (Feb 20, 2026):** Extruded tab on the left edge of the right sidebar, centered vertically. Uses `PanelRightClose`/`PanelRightOpen` icons. Single `margin-right` animation (shell stays 400px wide, slides off via `-mr-[400px]`) so the tab and sidebar move as one unit. Header X close removed; header Collapse button removed in favor of edge tab. localStorage key `v2-right-sidebar-collapsed`. 300ms ease-in-out transition.

**Files Modified:**
- `src/v2/V2App.tsx` — shell, edge toggle button, localStorage, layout
- `src/v2/components/RightSidebar/SidebarHeader.tsx` — removed X close, collapse moved to edge
- `src/v2/components/RightSidebar/RightSidebar.tsx` — removed onClose prop

---

### 0.7: Implement Error Handling Components

**Goal:** Create reusable error handling components that all phases will use.

**Design Decision (Feb 4, 2026):** Resolved DFT-030 — Severity-based error hierarchy with combination approach (critical modal, regional inline, partial banner, action toast).

**Acceptance Criteria:**

**Toast Component (Action Failures):**
- [ ] Toast component renders at top of right sidebar (full-width)
- [ ] Design tokens: `bg-red-50 border-b border-red-200`, Lucide `XCircle` icon
- [ ] Auto-dismisses after 8 seconds
- [ ] Dismissible via ✕ button
- [ ] "Try Again" inline button retries action and dismisses toast
- [ ] Supports stacking (newest on top, max 3 visible)
- [ ] Position: `absolute; top: 0; right: 0; left: 0;` relative to right sidebar
- [ ] Use cases: Bookmark save failed, pin failed, export failed, filter apply failed

**Inline Error Component (Content Failures):**
- [ ] Renders in-place where content should load
- [ ] Design tokens: `bg-amber-50 border border-amber-200 rounded-lg p-4`, Lucide `AlertTriangle` icon
- [ ] Shows error title and body text
- [ ] Includes "Retry" primary button
- [ ] Includes "Go Back" secondary button (contextual navigation)
- [ ] Includes "Show Details" expandable section (collapsed by default)
- [ ] Persistent until user acts (Retry, Go Back, navigate away)
- [ ] Use cases: Right sidebar content failed, camera list failed, search failed

**Partial Failure Banner:**
- [ ] Banner component renders above loaded content
- [ ] Shows "[⚠] X items failed to load. [Retry Failed] [✕]"
- [ ] "Retry Failed" only retries failed items
- [ ] Banner persists until dismissed or failures resolved
- [ ] Design tokens: `bg-amber-50 border-b border-amber-200 px-4 py-2`

**Critical Error Modal:**
- [ ] Full-screen overlay modal for app-breaking errors
- [ ] Only used for total API outage or app initialization failure
- [ ] Shows error icon, message, "Try Again" button, "Show Technical Details" toggle
- [ ] Blocks app interaction until resolved

**Shared Specifications:**
- [ ] Error message tone: Utilitarian, direct, no apologies
- [ ] Color tokens: `amber-*` for warnings, `red-*` for errors
- [ ] "Show Details" expansion shows: endpoint, HTTP status, timestamp, duration
- [ ] All components keyboard accessible (focusable buttons, ARIA labels)
- [ ] ARIA: `role="alert"` for toasts, `aria-live="polite"` for inline
- [ ] Animation: Fade in 200ms + subtle shake (2px), respects `prefers-reduced-motion`
- [ ] Timeout: 30s auto-timeout for all API requests → inline error with [Retry]

**Reference:**
- Design system: `docs/DESIGN-SYSTEM/design-system.md` (Error State Patterns section)
- DFT-030 resolution in `docs/planning-task-tracker.md`

**Files to Create:**
- `src/v2/components/ErrorHandling/Toast.tsx`
- `src/v2/components/ErrorHandling/InlineError.tsx`
- `src/v2/components/ErrorHandling/PartialFailureBanner.tsx`
- `src/v2/components/ErrorHandling/CriticalErrorModal.tsx`
- `src/v2/components/ErrorHandling/ShowDetailsPanel.tsx` (shared expansion)
- `src/v2/utils/errorMessages.ts` (standardized error text)

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Spatial query controls are canonical in the right sidebar Browse tab, directly below Date Range. Draw interaction happens on-map but is triggered and managed from sidebar controls. | Feb 18, 2026 | Improves conceptual consistency ("all filters edited in sidebar"), reduces split attention, and aligns with CON-GL-02 stakeholder feedback. |
| "Current View" spatial mode is snapshot-based (captured extent at selection time), not live-follow while panning. | Feb 18, 2026 | Predictable saved-view behavior, stable exports, and less surprising filter drift during map navigation. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| Draw Custom Polygon section matches filter-section card styling | Feb 19, 2026 | Visual consistency with Date Range, Species, Cameras: `border border-gray-200 rounded-lg overflow-hidden`, `bg-slate-50` header with chevron (expand/collapse), body with Draw/Redraw + Remove buttons. Expanded by default; status text only when drawing. | No |

### Draw Custom Polygon (Spatial Query) — Right Sidebar Standard

**Component:** `SpatialQuerySection` (`src/v2/components/RightSidebar/shared/SpatialQuerySection.tsx`)

**Presence:** Include in Edit Filters for all Browse tabs that support spatial filtering:
- iNaturalist (`INaturalistBrowseTab`) — `layerId="inaturalist-obs"`
- ANiML (`AnimlBrowseTab`) — `layerId="animl-camera-traps"`
- Dendra (`DendraBrowseTab`) — `layerId` from active Dendra layer
- DataOne (`DataOneBrowseTab`) — `layerId="dataone-datasets"`

**Styling (matches filter-section cards):**
- Outer: `border border-gray-200 rounded-lg overflow-hidden`
- Header: `bg-slate-50 px-3 py-2.5`, chevron (expand/collapse) + Crop icon + "Draw Custom Polygon" label; collapsed badge: "Polygon active" or "None"
- Body: Collapsible, expanded by default (`defaultExpanded={true}`); Draw/Redraw + Remove buttons; status text only when drawing
- Status text: Only when drawing ("Drawing mode active: click map to add points, double-click to finish.")

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, use the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 0:** Confirms foundational shared state is sufficient for bidirectional Map Layers <-> right-sidebar query sync across all data sources.
- **Phase 0 verification:** Validate that `viewId` activation, edit-filter hydration, and rename persistence are implemented as shared primitives (not source-specific forks).
- Foundation/shared state should define the canonical child-view naming contract used by all data sources: manual rename persists and auto naming only applies to non-custom names.
- Data-source branches may implement different auto-name algorithms, but must not fork shared rename persistence or `viewId` sync behavior.

---

## Open Questions

- [ ] What state management library? (Zustand? React Context? Redux?)
- [ ] How to handle layer registry? (Use existing category_mappings.json or create new?)
- [ ] Feature flag mechanism for v2 toggle?

---

### 0.9: Dynamic Layer Registry from Data Catalog Service

**Status:** 🟢 Complete (implemented; documented Feb 19, 2026)

**Goal:** Replace static layer registry with dynamic fetch from the Data Catalog FeatureServer so the left sidebar is populated from the live catalog (~90+ datasets across 14 categories).

**Implementation:** `src/v2/hooks/useCatalogRegistry.ts` fetches categories (Table 0), datasets (Table 1), and junction data (Table 2) from `Dangermond_Preserve_Data_Catalog` FeatureServer. `CatalogContext` wraps the hook and exposes `categories`, `layerMap`, loading, and error state. Left sidebar uses `CatalogContext` for its layer tree. `layerRegistry.ts` provides only icon mapping and external/synthetic layers (iNaturalist, ANiML, DataOne) that aren't in the ArcGIS catalog. Layers without adapters show a generic placeholder in the right sidebar instead of a toast.

**Files:** `src/v2/hooks/useCatalogRegistry.ts`, `src/v2/context/CatalogContext.tsx`, `src/v2/data/layerRegistry.ts`, `src/v2/components/LeftSidebar/LeftSidebar.tsx`

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 27, 2026 | 0.2 | **Left sidebar layer card right padding restored.** User-reported regression: layer cards (e.g. Dangermond Preserve, Santa Barbara County Boundary) were flush to sidebar edge. Restored pr-1 on CategoryGroup and ServiceGroup layer-card wrappers so cards sit a few pixels from edge. See phase-7-polish CON-FEB25-08. | Cursor |
| Feb 26, 2026 | 0.2 | **Left sidebar row spacing polish.** Removed right-edge whitespace; switched to padding-based indentation (`pl-1 pr-1` category, `pl-3 pr-1` subcategory) in CategoryGroup, LayerRow, ServiceGroup. Content aligns flush to sidebar edge. | — |
| Feb 25, 2026 | — | **Archived** completed tasks (CON-GL-01–08, 0.9, D20-01) to `docs/archive/phases/phase-0-foundation-completed.md`. | — |
| Feb 20, 2026 | D20-01 | Added right sidebar collapse button task from Dan feedback. Default open; manual collapse only; no auto-reopen. Phase-0 is appropriate (app-wide layout). | Will |
| Feb 19, 2026 | CON-GL-02 | **Draw Custom Polygon refinements.** Removed "No polygon drawn..." status text. Added expand/collapse (chevron) for visual consistency with Date Range, Species, Cameras; expanded by default. Documented styling standard in phase-0. | Will + Claude |
| Feb 19, 2026 | 0.9 | Documented Task 0.9 (Dynamic Layer Registry) as complete. Implementation in `useCatalogRegistry.ts` + `CatalogContext.tsx`; left sidebar populated from Data Catalog FeatureServer. Parallel branches unblocked. | Claude |
| Feb 18, 2026 | CON-GL-07 | Fixed intermittent Map Layers ↔ right-sidebar filter drift by reconciling `activeLayer.viewId` against pinned child views after visibility/view changes, ensuring filter sync/name updates always target the visible/valid child view. | Codex |
| Feb 18, 2026 | CON-GL-05, CON-GL-06 | Refined Edit Filters navigation feedback to flash only the Browse "Edit Filters" card (darker green), and implemented a shared green "Edit Filters" card wrapper in Browse tabs across iNaturalist/ANiML/Dendra/DataONE. | Claude |
| Feb 18, 2026 | CON-GL-04 | Implemented multi-expand behavior for Map Layers pinned rows. Expanded state now tracks multiple rows simultaneously (Set-based), preserves active-layer auto-expand, and no longer collapses other expanded rows on activation. | Claude |
| Feb 9, 2026 | 0.8 | ✅ Completed tree connector refinement — Fixed gaps by extending lines into `space-y-1` gaps (4px) between child rows. Used CSS borders for seamless L-shape corners. | Claude |
| Feb 4, 2026 | 0.5, 0.6 | Updated with DFT-031 resolution (Confirmation dialog strategy: hybrid approach with undo for single-item actions, confirmation for bulk operations) | Will + Claude |
| Feb 4, 2026 | 0.7 | Added error handling components task (DFT-030 resolution) — toast, inline error, partial failure, critical modal | Will + Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Jan 27, 2026 | 0.2, 0.5 | Updated with DFT-001 resolution (Model C: selection = active) | Will + Claude |
| Jan 27, 2026 | 0.5 | Added A/B testing for filter representation | Will + Claude |
| Jan 29, 2026 | 0.1, 0.6 | Updated with DFT-002 resolution (Export button in global header) | Will + Claude |
| Jan 29, 2026 | 0.5 | Added widget animation requirement from DFT-003 resolution | Will + Claude |
| Jan 29, 2026 | 0.5, 0.6 | Added auto-collapse behavior for time-series viewing (DFT-005) | Will + Claude |
| Feb 2, 2026 | 0.5 | Added expanded panel behavior with "Create New View" button (DFT-003b) | Will + Claude |
| Feb 2, 2026 | 0.5 | Removed swatch from row spec; active state indicated by expansion + visual treatment | Will + Claude |
| Feb 2, 2026 | 0.5 | Clarified widget shows filter status but does NOT edit filters (DFT-004). Sidebar is canonical editor | Will + Claude |
| Feb 2, 2026 | 0.6 | Resolved DFT-007: Bookmarks grouped by parent layer; layer headers are non-interactive context labels with muted styling | Will + Claude |
| Feb 3, 2026 | 0.5 | Resolved DFT-013: Multiple filtered views use nested widget structure with mutual exclusivity (only one view visible at a time) | Will + Claude |
| Feb 3, 2026 | 0.5, 0.6 | Resolved DFT-015: Empty state design — educational first-visit, laconic returning user. Configurable terminology ("Feature" vs "Item"). Drone/LiDAR are pin-only layers | Will + Claude |

| Feb 4, 2026 | 0.6 | Resolved DFT-020: Single "Bookmark" button for pointer rows. Auto-captures filter if active. Multiple bookmarks = multiple views. "Edit Filter" on bookmark widget | Will + Claude |
| Feb 4, 2026 | 0.5 | Resolved DFT-025: Create New View transition animation — inline transformation with sequential staging (250-300ms). Row expands → children appear → new child highlights. Respects reduced motion. Focus moves to new child | Will + Claude |

