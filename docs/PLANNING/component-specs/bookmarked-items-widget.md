# Component Spec: Bookmarked Items Widget

> **⚠️ DEPRECATED (Feb 11, 2026):** This widget has been dropped per DFT-046. All saved state is now unified into the Map Layers widget ("Map Layers"). Individual items are saved as filtered views. This spec is preserved for historical reference and CSS/animation pattern reuse. See `docs/PLANNING/resolved-decisions/dft-046-resolution-summary.md`.

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-005, DFT-007, DFT-015, DFT-017, DFT-018, DFT-020, DFT-026, DFT-030, DFT-031, DFT-036  
**Status:** ❌ Deprecated — widget dropped (DFT-046)

---

## Terminology

- **Bookmark** = a saved reference to a specific item (camera, sensor, observation, dataset) within a layer. Created from the right sidebar Browse tab.
- **Pointer row bookmark** = a bookmark of an item that has related data (ANiML camera → images, Dendra sensor → datapoints). May include a Level 3 filter (e.g., "mountain lions only").
- **Self-contained row bookmark** = a bookmark of an item that IS the data (iNaturalist observation, fire perimeter). No Level 3 filter possible.
- **Layer group header** = a non-interactive label showing which layer a group of bookmarks came from. Visual context only.
- **Item** = a record within a layer. Not "Feature" — per Trisalyn's direction.

---

## Widget Principle

> **The Bookmarked Items widget is the collection of saved item-level references.** The Map Layers widget manages _layers_ (what's on the map); this widget manages _items within layers_ (what the user wants to revisit). It answers: "Which specific cameras, sensors, and observations have I saved?"

---

## Anatomy

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │  A. WidgetHeader
├──────────────────────────────────────────────────┤
│  -- Camera Traps --------------------------------│  B. Layer group header
│     CAM-042 -> Mountain Lions 2023               │  C. Bookmark row (with filter)
│     47 images  [View] [Edit Filter] [x]          │
│     CAM-015                                      │  D. Bookmark row (without filter)
│     All images  [View] [x]                       │
│  -- Dendra Sensors ------------------------------│  B. Layer group header
│     RS-042 -> Mar 2024                           │  C. Bookmark row (with filter)
│     90 datapoints  [View] [Edit Filter] [x]      │
│  -- iNaturalist ---------------------------------│  B. Layer group header
│     Observation #45231                           │  E. Bookmark row (self-contained)
│     [View] [x]                                   │
└──────────────────────────────────────────────────┘
```

**Positioning:** Floating, absolute, top-right of map area (`top-4 right-[416px]`), `z-40`. Offset accounts for right sidebar (400px) + gap (16px).  
**Width:** 320px (matches Map Layers widget).  
**Max body height:** 350px (scrollable via `sidebar-scroll`).

**Labeled Parts:**

| Part | Element | Description |
|------|---------|-------------|
| A | WidgetHeader | Title + undo button (DFT-031) + collapse toggle + close button. |
| B | Layer group header | Non-interactive label. Muted styling. Groups bookmarks by parent layer (DFT-007). |
| C | Bookmark row (with filter) | Pointer row with Level 3 filter context. Shows item name, filter arrow, filter description, count, and actions. |
| D | Bookmark row (without filter) | Pointer row without Level 3 filter. Shows "All [noun]" and fewer actions. |
| E | Bookmark row (self-contained) | iNaturalist/eBird/fire bookmark. No filter context, no "Edit Filter". |

---

## Component 1: WidgetShell (Shared Floating Container)

Uses the same `WidgetShell` as the Map Layers widget.

| Element | Styling |
|---------|---------|
| Container | `floating-widget absolute top-4 right-[416px] w-[320px] bg-white rounded-xl z-40` |
| Shadow | `box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)` |
| Backdrop | `backdrop-filter: blur(8px)` |

---

## Component 2: WidgetHeader

```
┌──────────────────────────────────────────────────┐
│ [bookmark-icon]  Bookmarked Items  [undo] [-] [x]│
│  ^ icon          ^ title           ^ undo ^ min ^ close
└──────────────────────────────────────────────────┘
```

| Element | Styling | Notes |
|---------|---------|-------|
| Container | `flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-t-xl border-b border-gray-200` | Matches Map Layers widget header |
| Icon | Lucide `Bookmark`, `w-4 h-4 text-gray-500` | SVG only (DFT-026) |
| Title | `text-sm font-semibold text-gray-900` | "Bookmarked Items" |
| Undo button | DFT-031 pattern: always visible, grayed when inactive | See below |
| Collapse toggle | `icon-btn p-1 text-gray-400 hover:text-gray-600` | Lucide `Minus` (expanded) / `Plus` (collapsed) |
| Close button | `icon-btn p-1 text-gray-400 hover:text-gray-600` | Lucide `X` — closes widget entirely |

### Undo Button States (DFT-031)

| State | Styling | Tooltip |
|-------|---------|---------|
| Inactive | `text-gray-400 opacity-40 cursor-not-allowed` | "No actions to undo" |
| Active | `text-emerald-600 hover:text-emerald-700 cursor-pointer` | "Undo: Removed bookmark for CAM-042" |

- Icon: Lucide `Undo2` or `RotateCcw`, `w-5 h-5`
- Pulse animation (1 cycle, 400ms) when activated
- Respects `prefers-reduced-motion`
- Stack size: 5 actions per widget (single-level for v2.0)
- Actions covered: remove bookmark, remove multiple bookmarks

**Close vs. Map Layers:** Map Layers widget has NO close button (always visible — it's the primary map state manager). Bookmarked Items widget CAN be closed — bookmarks are optional and the widget can be re-opened from a header action or keyboard shortcut.

---

## Component 3: Layer Group Header (DFT-007)

```
│  -- Camera Traps --------------------------------│
```

| Element | Styling |
|---------|---------|
| Container | `px-3 py-1 flex items-center gap-2` |
| Label | `text-[10px] font-semibold text-gray-400 uppercase tracking-wide` |
| Divider line | `flex-1 border-t border-dashed border-gray-200` |

**Behavior:**
- Non-interactive — not clickable, not focusable
- No hover state (`cursor: default`, no background change)
- No buttons or icons (no eye, no x, no chevron)
- Auto-inserts when first bookmark from a layer is added
- Auto-removes when last bookmark from a layer is removed
- Persists even if the parent layer is unpinned (bookmarks are independent of pin state)

---

## Component 4: Bookmark Row

Three variants depending on the bookmark type. All share a common row container.

### Common Row Tokens

| Element | Styling |
|---------|---------|
| Container | `px-3 py-2 flex flex-col gap-0.5 cursor-pointer` |
| Hover | `hover:bg-gray-50` |
| Focus (keyboard) | `focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1 rounded` |

### Variant A: Pointer Row — With Filter Context

A bookmark from a pointer-row layer (ANiML, Dendra, DataOne) that captured a Level 3 filter.

```
│     CAM-042 -> Mountain Lions 2023               │
│     47 images  [View] [Edit Filter] [x]          │
```

| Element | Styling |
|---------|---------|
| Item name | `text-sm font-medium text-gray-900` |
| Filter arrow | `text-gray-400 mx-1` (separator: `→`) |
| Filter description | `text-sm text-gray-600` |
| Count + noun | `text-xs text-gray-500` |
| [View] | `text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium` |
| [Edit Filter] | `text-xs text-gray-500 hover:text-gray-700 cursor-pointer` |
| [x] remove | `icon-btn text-gray-300 hover:text-red-500`, Lucide `X`, `w-3.5 h-3.5` |
| Action gap | `gap-3` between action links |

**Notes:**
- "Edit Filter" allows post-save filter correction (DFT-020).
- Multiple bookmarks of the same item are allowed (each with different filter = different "view").
- Auto-captures current Level 3 filter at bookmark time (DFT-020).

### Variant B: Pointer Row — Without Filter

A bookmark from a pointer-row layer where the user bookmarked without any filter active.

```
│     CAM-015                                      │
│     All images  [View] [x]                       │
```

| Element | Styling |
|---------|---------|
| Item name | `text-sm font-medium text-gray-900` |
| "All [noun]" | `text-xs text-gray-500` |
| [View] | Same as Variant A |
| [x] remove | Same as Variant A |

**Notes:**
- Shows "All [noun]" to indicate no filter was applied.
- No "Edit Filter" action — there's no filter to edit. User can add a filter by clicking [View] and then filtering in the sidebar.

### Variant C: Self-Contained Row

A bookmark from a self-contained row layer (iNaturalist, eBird, fire perimeters). These items have no related data to filter.

```
│     Observation #45231                           │
│     [View] [x]                                   │
```

| Element | Styling |
|---------|---------|
| Item name | `text-sm font-medium text-gray-900` |
| [View] | Same as Variant A |
| [x] remove | Same as Variant A |

**Notes:**
- No filter context line (no Level 3 exists).
- No "Edit Filter" action (nothing to filter).

---

## States

### State 1: Default — Items Grouped by Parent Layer

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items          [undo-g] [-] [x]  │
├──────────────────────────────────────────────────┤
│  -- Camera Traps --------------------------------│
│     CAM-042 -> Mountain Lions 2023               │
│     47 images  [View] [Edit Filter] [x]          │
│     CAM-015                                      │
│     All images  [View] [x]                       │
│  -- Dendra Sensors ------------------------------│
│     RS-042 -> Mar 2024                           │
│     90 datapoints  [View] [Edit Filter] [x]      │
│  -- iNaturalist ---------------------------------│
│     Observation #45231                           │
│     [View] [x]                                   │
└──────────────────────────────────────────────────┘
```

**Notes:**
- Bookmarks are grouped by their parent layer (DFT-007).
- Layer group headers are non-interactive context labels.
- Order: groups appear in the order the first bookmark from each layer was created.
- Within a group, bookmarks appear in creation order (newest last).

---

### State 2: Hover State (DFT-036: Highlight on Map)

When user hovers over a bookmark row, the corresponding item highlights on the map.

```
│  >  CAM-042 -> Mountain Lions 2023               │  ← Hovered (subtle bg)
│     47 images  [View] [Edit Filter] [x]          │
```

**Row hover styling:** `hover:bg-gray-50`

**Map highlight (DFT-036):**

| Property | Value |
|----------|-------|
| Visual | Bright cyan ring around item's map symbol |
| Ring width | 4px |
| Ring offset | 8px from symbol |
| Animation | Subtle pulse (2 cycles, 800ms, `ease-in-out`) |
| Z-order | Elevated above other features |
| Timing | Instant (<100ms via map API) |
| Reduced motion | Static ring (no pulse) |
| Cleanup | Clears on unhover (instant or 50ms fade-out) |

**Off-screen items:**
- No map highlight (no forced pan)
- Widget row shows subtle Lucide `MapPin` icon + "Off-screen" text indicator (`text-gray-400`, `text-[10px]`). Uses SVG icon, not emoji (DFT-026 overrides DFT-036 emoji reference).
- Click [View] button to pan + zoom to item (deliberate action)

**Performance:**
- Debounce rapid hover events (50ms)
- Single highlight at a time (clear previous on new hover)
- Only highlight when widget is expanded

**Edge cases:**
- Layer group headers: no hover highlight (non-interactive, DFT-007)
- Multiple bookmarks of same item: highlights same map symbol
- Widget collapsed: no highlighting
- Item not loaded: graceful degradation, no error
- Map layer toggled off: no highlight (respects layer visibility)

---

### State 3: Widget Collapsed

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items (4)                  [+]   │
└──────────────────────────────────────────────────┘
```

**Collapsed behavior:**
- Header shows total bookmark count in parentheses.
- Toggle switches to `[+]` (Lucide `Plus`).
- Body transitions: `max-height: 0; opacity: 0; padding: 0;` over `0.2s ease-out`.
- **Stays expanded during time-series viewing** (DFT-005) — Dendra time-series requires bookmarked items visible for "bookmark range" action. Map Layers widget auto-collapses instead.
- User can manually collapse at any time.

---

### State 4: Auto-Expanded During Time Series (DFT-005)

When a Dendra time-series chart is active, the Map Layers widget auto-collapses but this widget stays expanded. This is intentional — users need access to bookmarked sensors/cameras while viewing time-series data.

**Behavior:**
- If manually collapsed by user before time-series opens, stays collapsed (user override respected).
- If expanded when time-series opens, stays expanded.

---

### State 5: Widget Empty — First Visit (DFT-015)

User has never bookmarked an item before.

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items          [undo-g] [-] [x]  │
├──────────────────────────────────────────────────┤
│                                                  │
│           [bookmark-icon - muted]                │
│                                                  │
│       No items bookmarked.                       │
│                                                  │
│    Bookmarks save specific items within          │
│    layers (cameras, sensors, observations).      │
│    Bookmark items from the right sidebar.        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Styling:**
- Icon: `w-12 h-12 text-gray-300` (Lucide `Bookmark`)
- Title: `text-sm font-medium text-gray-700`
- Body: `text-sm text-gray-500`
- Container: `flex flex-col items-center justify-center text-center px-6 py-8`
- Utilitarian tone (DFT-015)

**Detection:** `localStorage.hasEverBookmarkedItem === false`

**Note:** Drone imagery and LiDAR are pin-only layers — they will never have bookmark entries. The empty state copy reflects this by mentioning "cameras, sensors, observations" as examples.

---

### State 6: Widget Empty — Returning User (DFT-015)

User has bookmarked before, but currently has no bookmarks.

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items          [undo-g] [-] [x]  │
├──────────────────────────────────────────────────┤
│     Bookmarked items appear here.                │
└──────────────────────────────────────────────────┘
```

**Styling:**
- `text-sm text-gray-500` — laconic, single line

**Detection:** `localStorage.hasEverBookmarkedItem === true`

**Collapsed variant:**
```
┌───────────────────────────────────────────────────────────┐
│ [bm] Bookmarked Items (bookmark items from the right) [+] │
└───────────────────────────────────────────────────────────┘
```

---

### State 7: Loading — Bookmark Restoration (DFT-018)

On app load, saved bookmarks are restored from `localStorage`. While restoring:

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items                    [-] [x]  │
├──────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐ │
│  │  ░░░░░░░░░░░░░ ░░░░░░░░░░                  │ │  ← skeleton row
│  │  ░░░░░░░  ░░░░░░  ░░                       │ │
│  ├─────────────────────────────────────────────┤ │
│  │  ░░░░░░░░░░░░░ ░░░░░░░░░░                  │ │  ← skeleton row
│  │  ░░░░░░░  ░░                               │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Behavior:**
- Skeleton rows match bookmark row height and structure.
- Shows as many skeleton rows as there are stored bookmarks (count from localStorage).
- Replaced by actual bookmark rows as data resolves.
- Typically <300ms (localStorage is fast) — skeleton only visible on slow devices.

---

### State 8: Error — Bookmark Restoration Failed (DFT-030)

If localStorage data is corrupted or unreadable:

```
┌──────────────────────────────────────────────────┐
│ [bm] Bookmarked Items                    [-] [x]  │
├──────────────────────────────────────────────────┤
│                                                  │
│    Could not restore bookmarks.                  │
│    [Clear saved data]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Styling:**
- Message: `text-sm text-gray-700`
- Action link: `text-xs text-emerald-600 hover:text-emerald-700 cursor-pointer`

**Behavior:**
- "Clear saved data" resets localStorage bookmark state and shows empty widget (State 5 or 6 depending on `hasEverBookmarkedItem`).
- No retry — localStorage corruption is not transient.
- Utilitarian tone (DFT-015): no apologies, actionable.

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Click bookmark row (anywhere) | Right sidebar opens to that item with filter applied (if any) | Same as [View] — full row is clickable |
| Click [View] on bookmark | Right sidebar opens to that item with filter applied (if any) | Explicit action link |
| Click [Edit Filter] | Right sidebar opens to item's Browse tab filter section | DFT-020 |
| Click [x] on bookmark | Remove bookmark immediately (no confirmation); undo available | DFT-031 |
| Click [undo] in header | Undo most recent action (remove bookmark) | DFT-031 |
| Click [-] collapse | Collapse widget to header-only bar | |
| Click [+] expand | Expand widget to show all bookmarks | |
| Click [x] close | Close widget entirely | Can be re-opened from header |
| Hover bookmark row | Highlight corresponding item on map (if in viewport) | DFT-036 |
| Hover layer group header | No highlight (non-interactive) | DFT-007 |
| Tab to bookmark row | Map highlight follows keyboard focus | DFT-036, WCAG |
| Press Escape | Close widget (if focused) | DFT-017 |

---

## Design Decision Summary

- **Widget title:** "Bookmarked Items" — uses "Items" per Trisalyn's terminology update (not all layers are ArcGIS Feature Layers).
- **Widget position:** Top-right of map area, offset for right sidebar width. Map Layers widget is top-left.
- **Bookmarks grouped by parent layer** — layer headers are non-interactive context labels (DFT-007).
- **Single "Bookmark" button** in the right sidebar captures current filter automatically (DFT-020). No "Bookmark with Filter" variant.
- **"Edit Filter"** action on pointer-row bookmarks allows post-save filter correction (DFT-020). No "Add Filter" action for bookmarks without filter — [View] is sufficient (opens sidebar where user can filter).
- **Multiple bookmarks of same item** allowed — each with different filter = different "view" (DFT-020).
- **Full row is clickable** — clicking anywhere on a bookmark row (not on a specific button) triggers the same action as [View]. Consistent with Map Layers widget row click behavior.
- **Hover-to-highlight** for in-viewport items, no auto-pan (DFT-036).
- **Off-screen indicator** shows Lucide `MapPin` icon + "Off-screen" text; click [View] to pan (DFT-036). SVG icon per DFT-026.
- **Undo instead of confirmation** for bookmark removal (DFT-031).
- **SVG/Lucide icons only**, no emojis (DFT-026).
- **Stays expanded during time-series** viewing while Map Layers auto-collapses (DFT-005).
- **Empty states** differentiate first-visit (educational) from returning (laconic) (DFT-015).
- **Bookmarks persist** even when the parent layer's current query changes or the layer is unpinned (paradigm doc).
- **Layer group headers persist** even if parent layer is unpinned — bookmarks are independent of pin state.
- **Widget closable** (unlike Map Layers widget which only collapses). Bookmarks are optional.

---

## Accessibility

- **ARIA:** Widget container: `role="region"` with `aria-label="Bookmarked Items"`
- **Hover highlight:** ARIA live region announces "Item CAM-042 highlighted on map" (`aria-live="polite"`)
- **Keyboard:** Tab navigates bookmark rows; highlight follows focus; Enter activates [View]
- **Tab order:** After Map Layers widget in global tab order (DFT-017)
- **Layer group headers:** Not focusable (non-interactive). Use `role="separator"` or `role="presentation"`.
- **Screen reader announcements** (`aria-live="polite"`):
  - "Item bookmarked" — when bookmark is created
  - "Bookmark removed" — on deletion
  - "Undo: bookmark restored" — on undo
  - "Item [name] highlighted on map" — on hover/focus
- **Focus management:** When bookmark is removed, focus moves to the next bookmark row (or previous if last in group). If group becomes empty, focus moves to next group header.
- **ARIA live region for highlight announcements:**
  ```html
  <div id="bookmark-highlight-announcements" role="status" aria-live="polite" class="sr-only"></div>
  ```

---

## File Structure

```
src/v2/components/FloatingWidgets/
  BookmarkedItemsWidget/
    BookmarkedItemsWidget.tsx      <- Main widget container (WidgetShell + Header + Body)
    LayerGroupHeader.tsx           <- Component 3: non-interactive layer group divider
    BookmarkRow.tsx                <- Component 4: unified row (variants A/B/C via props)
    BookmarkEmptyState.tsx         <- States 5/6: first-visit vs returning empty
  shared/
    WidgetShell.tsx                <- Shared floating container (also used by MapLayersWidget)
    WidgetHeader.tsx               <- Shared title + undo + collapse + close buttons
```

---

## Component Interface (Top-Level)

```typescript
interface BookmarkedItemsWidgetProps {
  // Bookmarks
  bookmarks: BookmarkedItem[];
  onViewBookmark: (bookmarkId: string) => void;
  onEditFilter: (bookmarkId: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;

  // Undo (DFT-031)
  canUndo: boolean;
  onUndo: () => void;
  undoDescription?: string;

  // Widget state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isClosed: boolean;
  onClose: () => void;

  // Loading / error
  isLoading: boolean;
  loadingCount?: number;         // Number of skeleton rows to show
  error?: string | null;
  onClearError: () => void;

  // Empty state
  hasEverBookmarked: boolean;
}

interface BookmarkedItem {
  id: string;
  itemId: string;                // The underlying item (camera, sensor, observation)
  itemName: string;              // "CAM-042", "RS-042", "Observation #45231"
  layerName: string;             // "Camera Traps", "Dendra Sensors", "iNaturalist"
  layerGroupOrder: number;       // Order of the layer group (first bookmark created)
  createdAt: number;             // Timestamp for ordering within group

  // Bookmark type
  type: 'pointer-filtered' | 'pointer-unfiltered' | 'self-contained';

  // Filter context (pointer-filtered only)
  filterDescription?: string;    // "Mountain Lions 2023"
  resultCount?: number;          // 47
  resultNoun?: string;           // "images", "datapoints"

  // Unfiltered pointer row
  allNoun?: string;              // "images" — used for "All images" label

  // Map highlight
  isInViewport: boolean;
  mapCoordinates?: [number, number];
}
```

---

## Open Questions

1. ~~**Widget positioning:**~~ **RESOLVED (Feb 6):** Map Layers widget is top-left (`top-4 left-4`). Bookmarked Items widget is top-right (`top-4 right-[416px]`), offset by right sidebar width (400px) + gap (16px). Confirmed in master-plan.md: "Floating widget for pins + bookmarks" with "Pin widget top-left, Bookmark widget top-right" positioning.

2. ~~**"Edit Filter" for bookmarks without filter:**~~ **RESOLVED (Feb 6):** No "Add Filter" action for bookmarks without a Level 3 filter. [View] is sufficient — opens sidebar where user can filter and then re-bookmark with the new filter. Adding an "Add Filter" button violates minimalism (Nielsen #8) and increases Hick's Law friction for a niche use case. The user mental model is "view → filter → bookmark again" (DFT-020: "Want different filter? Bookmark again.").

3. ~~**Bookmark row click behavior:**~~ **RESOLVED (Feb 6):** Clicking a bookmark row (not on a specific button) triggers the same action as [View]. Full row is clickable for maximum Fitts's Law target area. Consistent with Map Layers widget where clicking a row opens the expanded panel. "Edit Filter" and [x] remain separate click targets within the row.
