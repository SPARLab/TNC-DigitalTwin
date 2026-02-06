# Component Spec: Bookmarked Items Widget

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-007, DFT-015, DFT-020, DFT-026, DFT-031, DFT-036  
**Status:** Draft — pending review

---

## Terminology

- **Bookmark** = a saved reference to a specific item (camera, sensor, observation, dataset) within a layer. Created from the right sidebar Browse tab.
- **Pointer row bookmark** = a bookmark of an item that has related data (ANiML camera → images, Dendra sensor → datapoints). May include a Level 3 filter (e.g., "mountain lions only").
- **Self-contained row bookmark** = a bookmark of an item that IS the data (iNaturalist observation, fire perimeter). No Level 3 filter possible.
- **Layer group header** = a non-interactive label showing which layer a group of bookmarks came from. Visual context only.
- **Item** = a record within a layer. Not "Feature."

---

## Anatomy

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │  A. Widget header
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

**Labeled Parts:**

| Part | Element | Description |
|------|---------|-------------|
| A | Widget header | Title + undo button + collapse toggle + close button |
| B | Layer group header | Non-interactive label. Muted styling. Groups bookmarks by parent layer (DFT-007). |
| C | Bookmark row (with filter) | Pointer row with Level 3 filter context. Shows item name, filter arrow, filter description, count, and actions. |
| D | Bookmark row (without filter) | Pointer row without Level 3 filter. Shows "All [noun]" and fewer actions. |
| E | Bookmark row (self-contained) | iNaturalist/eBird/fire bookmark. No filter context, no "Edit Filter". |

---

## States

### State 1: Default — Items Grouped by Parent Layer

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │
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

### State 2: Bookmark Row — With Filter Context (Pointer Row Bookmark)

A bookmark from a pointer-row layer (ANiML, Dendra, DataOne) that captured a Level 3 filter.

```
│     CAM-042 -> Mountain Lions 2023               │
│     47 images  [View] [Edit Filter] [x]          │
```

**Row elements:**

| Element | Content | Styling |
|---------|---------|---------|
| Item name | "CAM-042" | `text-sm font-medium text-gray-900` |
| Filter arrow | "->" | `text-gray-400` (separator indicating filter context) |
| Filter description | "Mountain Lions 2023" | `text-sm text-gray-600` |
| Count + noun | "47 images" | `text-xs text-gray-500` |
| [View] | Action link | `text-xs text-emerald-600 hover:text-emerald-700` — jumps to right sidebar with filter applied |
| [Edit Filter] | Action link | `text-xs text-gray-500 hover:text-gray-700` — opens filter editing in sidebar |
| [x] | Remove button | `text-gray-400 hover:text-red-500` — removes bookmark immediately, undo available |

**Notes:**
- "Edit Filter" allows post-save filter correction (DFT-020).
- Multiple bookmarks of the same item are allowed (each with different filter = different "view").
- Auto-captures current Level 3 filter at bookmark time (DFT-020).

---

### State 3: Bookmark Row — Without Filter (Pointer Row, No Level 3 Query)

A bookmark from a pointer-row layer where the user bookmarked without any filter active.

```
│     CAM-015                                      │
│     All images  [View] [x]                       │
```

**Notes:**
- Shows "All [noun]" to indicate no filter was applied.
- No "Edit Filter" action — there's no filter to edit. User can add a filter by clicking [View] and then filtering in the sidebar.
- [View] opens the item in the right sidebar without any filter pre-applied.

---

### State 4: Bookmark Row — Self-Contained (No Level 3 Data)

A bookmark from a self-contained row layer (iNaturalist, eBird, fire perimeters). These items have no related data to filter.

```
│     Observation #45231                           │
│     [View] [x]                                   │
```

**Notes:**
- No filter context line (no Level 3 exists).
- No "Edit Filter" action (nothing to filter).
- Only [View] (opens item in right sidebar) and [x] (remove bookmark).

---

### State 5: Layer Group Header (Non-Interactive, DFT-007)

```
│  -- Camera Traps --------------------------------│
```

**Styling (DFT-007 — non-interactivity signifiers):**
- Text: `text-[10px] font-semibold text-gray-400 uppercase tracking-wide`
- Muted color (~60% opacity)
- No hover state (cursor stays `default`, no background change)
- No buttons or icons (no eye, no x, no chevron)
- Full-width span with dotted line or divider styling
- Acts as section divider, not a card row

**Behavior:**
- Non-interactive — not clickable, not focusable
- Auto-inserts when first bookmark from a layer is added
- Auto-removes when last bookmark from a layer is removed
- Persists even if the parent layer is unpinned (bookmarks are independent of pin state)

---

### State 6: Hover State (DFT-036: Highlight on Map)

When user hovers over a bookmark row, the corresponding item highlights on the map.

```
│  >  CAM-042 -> Mountain Lions 2023               │  ← Hovered (subtle bg)
│     47 images  [View] [Edit Filter] [x]          │
```

**Row hover styling:**
- `hover:bg-gray-50` subtle background highlight on the row

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

### State 7: Widget Collapsed

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items (4)                      [+]   │
└──────────────────────────────────────────────────┘
```

**Notes:**
- Shows total bookmark count in parentheses
- `[+]` expand button
- Stays expanded during time-series viewing (DFT-005) — needed for "bookmark range" action
- User can manually collapse at any time

---

### State 8: Widget Empty — First Visit (DFT-015)

User has never bookmarked an item before.

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │
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

### State 9: Widget Empty — Returning User (DFT-015)

User has bookmarked before, but currently has no bookmarks.

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │
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
│  Bookmarked Items (bookmark items from the right)   [+]   │
└───────────────────────────────────────────────────────────┘
```

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Click [View] on bookmark | Right sidebar opens to that item with filter applied (if any) | |
| Click [Edit Filter] | Right sidebar opens to item's Browse tab filter section | DFT-020 |
| Click [x] on bookmark | Remove bookmark immediately (no confirmation); undo available | DFT-031 |
| Click [undo] in header | Undo most recent action (remove bookmark) | DFT-031 |
| Click [-] collapse | Collapse widget to header-only bar | |
| Click [+] expand | Expand widget to show all bookmarks | |
| Click [x] close | Close widget entirely | |
| Hover bookmark row | Highlight corresponding item on map (if in viewport) | DFT-036 |
| Hover layer group header | No highlight (non-interactive) | DFT-007 |
| Tab to bookmark row | Map highlight follows keyboard focus | DFT-036, WCAG |

---

## Widget Header Detail

```
┌──────────────────────────────────────────────────┐
│  Bookmarked Items              [undo]  [-]  [x]  │
│  ^ title                       ^ undo  ^ min ^ close
└──────────────────────────────────────────────────┘
```

**Undo button (DFT-031):**

| State | Styling | Tooltip |
|-------|---------|---------|
| Inactive | `text-gray-400 opacity-40 cursor-not-allowed` | "No actions to undo" |
| Active | `text-emerald-600 cursor-pointer` | "Undo: Removed bookmark for CAM-042" |

- Icon: Lucide `Undo2` or `RotateCcw`, `w-5 h-5`
- Pulse animation (1 cycle, 400ms) when activated
- Respects `prefers-reduced-motion`
- Stack size: 5 actions per widget (single-level for v2.0)
- Actions covered: remove bookmark, remove multiple bookmarks

---

## Design Decision Summary

- **Widget title:** "Bookmarked Items" — uses "Items" per Trisalyn's terminology update (not all layers are ArcGIS Feature Layers).
- **Bookmarks grouped by parent layer** — layer headers are non-interactive context labels (DFT-007).
- **Single "Bookmark" button** in the right sidebar captures current filter automatically (DFT-020). No "Bookmark with Filter" variant.
- **"Edit Filter"** action on pointer-row bookmarks allows post-save filter correction (DFT-020).
- **Multiple bookmarks of same item** allowed — each with different filter = different "view" (DFT-020).
- **Hover-to-highlight** for in-viewport items, no auto-pan (DFT-036).
- **Off-screen indicator** shows Lucide `MapPin` icon + "Off-screen" text; click [View] to pan (DFT-036). SVG icon per DFT-026.
- **Undo instead of confirmation** for bookmark removal (DFT-031).
- **SVG/Lucide icons only**, no emojis (DFT-026).
- **Stays expanded during time-series** viewing (DFT-005).
- **Empty states** differentiate first-visit (educational) from returning (laconic) (DFT-015).
- **Bookmarks persist** even when the parent layer's current query changes or the layer is unpinned (paradigm doc).
- **Layer group headers persist** even if parent layer is unpinned — bookmarks are independent of pin state.

---

## Accessibility

- **ARIA:** Widget container: `role="region"` with `aria-label="Bookmarked Items"`
- **Hover highlight:** ARIA live region announces "Item CAM-042 highlighted on map" (`aria-live="polite"`)
- **Keyboard:** Tab navigates bookmark rows; highlight follows focus; Enter activates [View]
- **Tab order:** After Map Layers widget in global tab order (DFT-017)
- **Layer group headers:** Not focusable (non-interactive). Use `role="separator"` or `role="presentation"`.
- **Screen reader:** Announces significant actions — "Item bookmarked", "Bookmark removed"

---

## Open Questions

1. **Widget positioning:** Phase-0 says "top-right of map area" for bookmarks. Is this still correct with the Map Layers widget presumably in top-left? Need to confirm exact positioning — stacked vertically (Map Layers top-left, Bookmarked Items below it) or horizontally separated (Map Layers top-left, Bookmarked Items top-right)?
2. **"Edit Filter" for bookmarks without filter:** Current spec says no "Edit Filter" for bookmarks without a Level 3 filter. But should we show "Add Filter" instead, to let users add a filter post-bookmark? Or is [View] sufficient (opens sidebar where they can filter)?
3. **Bookmark row click behavior:** Currently only action buttons ([View], [Edit Filter], [x]) are interactive on the row. Should clicking the bookmark row itself (not on a button) do anything? Options: (a) nothing, (b) same as [View], (c) expand to show more detail. Current recommendation: same as [View] for consistency with Map Layers widget row click behavior.
4. ~~**Off-screen indicator icon:**~~ **RESOLVED (Feb 6):** Use Lucide `MapPin` icon instead of emoji. DFT-026 (SVG/Lucide only) overrides the emoji reference in DFT-036 text.
