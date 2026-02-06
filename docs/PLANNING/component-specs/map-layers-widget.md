# Component Spec: Map Layers Widget

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-001, DFT-003, DFT-003b, DFT-004, DFT-005, DFT-013, DFT-015, DFT-019, DFT-024, DFT-025, DFT-026, DFT-031, DFT-034  
**Status:** Draft — pending review

---

## Terminology

- **Active Layer** = the layer the user most recently clicked in the left sidebar. Visible on map, shown in right sidebar. Temporary — replaced when another layer is clicked. Only ONE at a time.
- **Pinned Layer** = a layer explicitly saved via the [pin] button. Persists until unpinned. Multiple allowed. Has independent visibility toggle.
- **Filtered View** = a pinned layer with a specific query/filter applied. Multiple views of the same layer are possible (DFT-013).
- **Item** = a record within a layer. Not "Feature."

---

## Anatomy

The widget has two layouts depending on whether the active layer is pinned or not.

**Layout A: Active layer is NOT pinned (ACTIVE LAYER section visible)**

```
┌──────────────────────────────────────────────────┐
│  Map Layers                  [undo] [collapse] ✕ │  A. Widget header
├──────────────────────────────────────────────────┤
│  ACTIVE LAYER                                    │  B. Section header (conditional)
│  Dendra Sensors                            [pin] │  C. Active layer row
├──────────────────────────────────────────────────┤
│  PINNED LAYERS                                   │  D. Section header
├──────────────────────────────────────────────────┤
│  [drag] [eye] ANiML Cameras (mt. lion) [F 5] [x]│  E. Pinned layer row (flat)
│  [drag] [eye] iNaturalist              [F]   [x]│  F. Pinned layer row (no filters)
└──────────────────────────────────────────────────┘
```

**Layout B: Active layer IS pinned or no active layer (ACTIVE LAYER section hidden)**

```
┌──────────────────────────────────────────────────┐
│  Map Layers                  [undo] [collapse] ✕ │  A. Widget header
├──────────────────────────────────────────────────┤
│  PINNED LAYERS                                   │  D. Section header
├──────────────────────────────────────────────────┤
│ *[drag] [eye] ANiML Cameras (mt. lion) [F 5] [x]│  E. Pinned row + active indicator (*)
│  [drag] [eye] iNaturalist              [F]   [x]│  F. Pinned layer row
│  [drag] [eye] Camera Traps v                 [x]│  G. Pinned parent row (nested)
│         [eye]   mountain lion     [F 5]          │  H. Nested child (visible)
│                 deer                             │  I. Nested child (hidden)
│         [+ New View]                             │  J. Create new view action
└──────────────────────────────────────────────────┘
```

**Labeled Parts:**

| Part | Element | Description |
|------|---------|-------------|
| A | Widget header | Title + undo button + collapse toggle + close button. Title is configurable (default "Map Layers"; team can test "Pinned Item Layers" etc.). |
| B | "ACTIVE LAYER" section header | **Conditional — only shown when active layer is NOT pinned.** Uppercase label, `text-[10px] font-semibold text-gray-500 tracking-wide` |
| C | Active layer row | Shows non-pinned active layer with [pin] button. Hidden when active layer is pinned. |
| D | "PINNED LAYERS" section header | Same styling as B. Always visible when pinned layers exist. |
| E | Pinned layer row (flat) | Drag handle + eye toggle + name + filter indicator + remove. When this row's layer is also active, shows active indicator (`*` = emerald left border + bold text). |
| F | Pinned layer row (no filter) | Same as E but filter icon is muted gray |
| G | Pinned parent row (nested) | When 2+ views exist. Has chevron (v/>) and eye toggle |
| H | Nested child (visible) | Indented. Eye icon ON. Filter indicator visible |
| I | Nested child (hidden) | Indented. Eye icon grayed. No filter indicator shown |
| J | Create new view | `[+ New View]` action link, indented with children |

**Active layer duplication rule (Feb 6 resolution):** The ACTIVE LAYER section appears **only when the active layer is NOT pinned.** When the active layer IS pinned, it is shown in the PINNED LAYERS section with an active indicator (emerald left border + bold text — mirrors the left sidebar's active styling). This eliminates visual duplication and follows Gestalt (Similarity), Norman (Conceptual Model), Nielsen #8 (Minimalism), and Hick's Law (fewer sections to scan).

---

## States

### State 1a: Default — Non-Pinned Active Layer + Pinned Layers

The active layer (Dendra Sensors) is NOT pinned, so the ACTIVE LAYER section is visible.

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
├──────────────────────────────────────────────────┤
│  ACTIVE LAYER                                    │
│  Dendra Sensors                            [pin] │
├──────────────────────────────────────────────────┤
│  PINNED LAYERS                                   │
│  [drag] [eye] iNaturalist (birds)    [F 2]  [x] │
│  [drag] [eye] Camera Traps v                [x] │
│         [eye]   mountain lion   [F 5]            │
│                 deer                             │
│         [+ New View]                             │
└──────────────────────────────────────────────────┘
```

### State 1b: Default — Active Layer IS Pinned

The active layer (iNaturalist) is already pinned. ACTIVE LAYER section is hidden. The active pinned row gets an active indicator.

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
├──────────────────────────────────────────────────┤
│  PINNED LAYERS                                   │
│ *[drag] [eye] iNaturalist (birds)    [F 2]  [x] │  ← Active indicator (emerald border)
│  [drag] [eye] Camera Traps v                [x] │
│         [eye]   mountain lion   [F 5]            │
│                 deer                             │
│         [+ New View]                             │
└──────────────────────────────────────────────────┘
```

**Active indicator on pinned row:** `border-l-2 border-emerald-600 font-semibold` — same styling vocabulary as left sidebar active state.

**Notes:**
- Undo button `[undo]` is always visible in header. Gray/inactive when no actions to undo.
- `[-]` collapses the widget. `[x]` closes it.
- Pinned rows have: drag handle, eye toggle, name with distinguisher, filter indicator, remove button.
- Nested "Camera Traps" has two child views. Only "mountain lion" has eye ON (visible).

---

### State 2: Active Layer Section — With [pin] Button Visible

When a non-pinned layer is active, the ACTIVE LAYER section shows it with a pin button.

```
├──────────────────────────────────────────────────┤
│  ACTIVE LAYER                                    │
│  Dendra Sensors                            [pin] │
├──────────────────────────────────────────────────┤
```

**Behavior:**
- Clicking [pin] moves the layer to the PINNED section and hides the ACTIVE LAYER section (since the active layer is now pinned).
- Layer inherits its current filter state when pinned.
- The pinned row receives the active indicator (emerald border).

---

### State 3: Active Layer Section — Hidden (No Section Shown)

The ACTIVE LAYER section is **hidden entirely** when:
- The active layer is already pinned (shown in PINNED LAYERS with active indicator instead)
- No layer has been selected yet (widget opens directly to PINNED LAYERS)
- Active layer was just pinned (section disappears after pin action)

This avoids empty placeholder text and dead space. The widget is more compact — only showing sections that have actionable content.

---

### State 4: Pinned Layer Row — Flat, Single View, With Filters

```
│  [drag] [eye] ANiML Cameras (mt. lion) [F 5] [x]│
```

**Row elements (left to right):**

| Element | Icon/Text | Styling | Behavior |
|---------|-----------|---------|----------|
| Drag handle | `[drag]` (Lucide `GripVertical`) | `text-gray-400 hover:text-gray-600 cursor-grab` | Drag to reorder (DFT-034) |
| Eye toggle | `[eye]` (Lucide `Eye`) | Blue = visible, gray = hidden | Toggle map visibility |
| Layer name | "ANiML Cameras" | `text-sm font-medium text-gray-900` | Click expands row |
| Distinguisher | "(mt. lion)" | `text-sm text-gray-500` | Auto-generated from primary filter |
| Filter indicator | `[F 5]` (Lucide `Filter` + count) | Colored badge when active (DFT-024) | Click → Browse tab in sidebar |
| Remove | `[x]` (Lucide `X`) | `text-gray-400 hover:text-red-500` | Unpin layer (immediate, undo available) |

**Filter indicator states (DFT-024):**
- **Has filters:** Lucide `Filter` icon + count number. Tooltip: "5 filters applied. Click to edit."
- **No filters:** Lucide `Filter` icon only, muted gray. Tooltip: "No filters — click to add."
- ARIA: `aria-label="5 filters applied. Click to edit."`

---

### State 5: Pinned Layer Row — Flat, No Filters

```
│  [drag] [eye] Fire Hazard              [F]  [x] │
```

**Notes:**
- Filter icon `[F]` is muted gray (`text-gray-400`), still clickable.
- No count number displayed.
- No distinguisher text (no filter to derive it from).

---

### State 6: Pinned Layer Row — Nested/Multi-View (DFT-013)

When a layer has 2+ saved filtered views, it becomes a parent with nested children.

```
│  [drag] [eye] Camera Traps v                [x] │  ← Parent
│         [eye]   mountain lion   [F 5]            │  ← Child (visible)
│                 deer                             │  ← Child (hidden)
│         [+ New View]                             │
```

**Parent row:**
- Drag handle, eye toggle, layer name (no distinguisher), chevron `v`/`>`, remove `[x]`
- Background: `bg-slate-50` or subtle left border
- Text: `font-semibold`
- Eye toggle: ON if any child is visible; OFF if all children hidden

**Child rows:**
- Indented: `ml-6` (24px) with subtle connecting line
- Visible child: Eye icon ON (blue), filter indicator shown
- Hidden child: Eye icon absent or grayed, name in `text-gray-400`
- Entire child row is clickable → toggles that view's visibility

**Visibility logic (DFT-013):**
- Only ONE child view visible at a time (mutual exclusivity)
- Clicking a hidden child → makes it visible, auto-hides previous
- Clicking visible child's eye → turns it OFF, parent eye also OFF
- Clicking parent eye ON → restores previously-selected child (memory-preserving)
- Clicking parent eye OFF → hides all children; remembers which was selected

---

### State 7: Nested Child — Visible View (Expanded with Filter Summary)

When a child view's row is clicked/expanded, shows filter summary and actions.

```
│  [drag] [eye] Camera Traps v                [x] │
│         [eye]   mountain lion   [F 5]            │  ← Expanded child
│         ┌────────────────────────────────────┐   │
│         │ Filters: species=mt. lion,         │   │
│         │          date>2024                 │   │
│         │ [Clear]  [+ New View]  [Edit F ->] │   │
│         └────────────────────────────────────┘   │
│                 deer                             │
│         [+ New View]                             │
```

**Expanded panel (DFT-003b, DFT-019):**
- Shows filter summary text (readable query description)
- Action buttons:
  - `[Clear]` — left-aligned. Clears all filters immediately, no confirmation (DFT-031). Undo available.
  - `[+ New View]` — center. Duplicates layer with current filters as new child view.
  - `[Edit Filters ->]` — right-aligned, includes arrow. Opens Browse tab in right sidebar.
- Only ONE layer expanded at a time. Clicking another collapses the previous.
- Widget panel stays expanded when "Edit Filters" is clicked (DFT-019) so user can reference filter state.

---

### State 8: Nested Child — Hidden View

```
│                 deer                             │
```

**Styling:**
- No eye icon (or grayed eye)
- Name in `text-gray-400`
- No filter indicator shown
- Clickable — clicking makes this view visible

---

### State 9: Widget Collapsed

```
┌──────────────────────────────────────────────────┐
│  Map Layers (3)                            [+]   │
└──────────────────────────────────────────────────┘
```

**Notes:**
- Shows layer count in parentheses
- `[+]` expand button
- Collapsed by default when time-series data is active (DFT-005)
- User can manually override collapse/expand

---

### State 10: Widget Empty — First Visit (DFT-015)

User has never pinned a layer before. ACTIVE LAYER section hidden (no active layer).

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
├──────────────────────────────────────────────────┤
│                                                  │
│              [pin-icon - muted]                  │
│                                                  │
│         No layers pinned.                        │
│                                                  │
│    Pin layers from the left sidebar              │
│    to save them here.                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Styling:**
- Icon: `w-12 h-12 text-gray-300` (Lucide `Pin`)
- Title: `text-sm font-medium text-gray-700`
- Body: `text-sm text-gray-500`
- Container: `flex flex-col items-center justify-center text-center px-6 py-8`
- Utilitarian tone (DFT-015)

**Detection:** `localStorage.hasEverPinnedLayer === false`

---

### State 11: Widget Empty — Returning User (DFT-015)

User has pinned before, but currently has no pinned layers. ACTIVE LAYER section hidden.

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
├──────────────────────────────────────────────────┤
│     Pinned layers appear here.                   │
└──────────────────────────────────────────────────┘
```

**Styling:**
- `text-sm text-gray-500` — laconic, single line

**Detection:** `localStorage.hasEverPinnedLayer === true`

**Collapsed variant:**
```
┌─────────────────────────────────────────────────────────┐
│  Map Layers (pin layers from the left)            [+]   │
└─────────────────────────────────────────────────────────┘
```

---

### State 12: Drag in Progress (DFT-034)

User is dragging a pinned layer to reorder it.

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
├──────────────────────────────────────────────────┤
│  PINNED LAYERS                                   │
│                                                  │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄ 4px blue drop line ┄┄┄┄┄┄┄┄┄┄┄  │  ← Drop target indicator
│  [drag] [eye] iNaturalist (birds)    [F 2]  [x] │
│                                                  │
│  ╔══════════════════════════════════════════════╗ │
│  ║ [drag] [eye] ANiML (mt. lion)    [F 5] [x]  ║ │  ← Dragged row (lifted)
│  ╚══════════════════════════════════════════════╝ │
│                                                  │
│  [drag] [eye] Fire Hazard            [F]    [x] │
└──────────────────────────────────────────────────┘
```

**Dragged row visual (DFT-034):**
- `opacity: 0.6`
- `transform: scale(0.95) rotate(2deg)`
- `box-shadow: 0 12px 40px -8px rgba(0,0,0,0.3)`
- `border: 2px dashed #3b82f6` (blue)
- `cursor: grabbing`
- Reduced motion: no rotation, just `scale(0.95)`

**Drop target indicator:**
- 4px solid blue line (`#3b82f6`) at insertion point
- Subtle background highlight on target row (`rgba(59,130,246,0.05)`)
- Margin offset prevents layout shift

**After drop:**
- 400ms settle animation (`ease-out`) with green highlight (`#dcfce7`)
- Toast: "Map layer order updated" (2s auto-dismiss, bottom-center)
- Map z-order updates (top of widget = top of map rendering)

**Keyboard support (WCAG 2.1.1):**
- Focus on drag handle → Arrow Up/Down moves layer one position
- Shift+Home → move to top; Shift+End → move to bottom
- ARIA announces: "{LayerName} moved to position {N} of {total}"

**Edge cases:**
- Single pinned layer: hide drag handles (nothing to reorder)
- Invalid drop (outside widget): snap back with brief shake (2px, 2 cycles)
- Rapid reorders: debounce map updates by 300ms

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Click [pin] on active layer | Layer moves from ACTIVE to PINNED section; [eye]+[pin] icons appear on sidebar row | DFT-001 |
| Click [eye] on pinned layer | Toggle map visibility (blue=ON, gray=OFF); syncs with left sidebar eye icon | DFT-001, Feb 6 |
| Click pinned layer row | Expand to show filter summary + action buttons | DFT-003b |
| Click [x] on pinned layer | Unpin immediately (no confirmation); undo available | DFT-031 |
| Click [Clear] in expanded panel | Clear all filters immediately; undo available | DFT-031 |
| Click [Edit Filters ->] | Right sidebar switches to Browse tab (150-200ms crossfade); widget stays expanded | DFT-019 |
| Click [+ New View] | Duplicate layer with current filters as new child view | DFT-003b, DFT-013 |
| Click [F N] filter indicator | Same as [Edit Filters ->] — opens Browse tab | DFT-024 |
| Click child view row | Toggle that view's visibility (mutual exclusivity) | DFT-013 |
| Click [undo] in header | Undo most recent action (unpin, clear filters, delete view) | DFT-031 |
| Click [-] collapse | Collapse widget to header-only bar | |
| Click [x] close | Close widget entirely | |
| Drag layer row | Reorder pinned layers (changes map z-order) | DFT-034 |
| Filter changes in right sidebar | Widget row animates/highlights to confirm change | DFT-003 |

---

## Widget Header Detail

```
┌──────────────────────────────────────────────────┐
│  Map Layers                    [undo]  [-]  [x]  │
│  ^ title                       ^ undo  ^ min ^ close
└──────────────────────────────────────────────────┘
```

**Undo button (DFT-031):**

| State | Styling | Tooltip |
|-------|---------|---------|
| Inactive | `text-gray-400 opacity-40 cursor-not-allowed` | "No actions to undo" |
| Active | `text-emerald-600 cursor-pointer` | "Undo: Unpinned ANiML Cameras" |

- Icon: Lucide `Undo2` or `RotateCcw`, `w-5 h-5`
- Pulse animation (1 cycle, 400ms) when activated
- Respects `prefers-reduced-motion`
- Stack size: 5 actions per widget (single-level for v2.0)
- Actions covered: unpin layer, delete filtered view, clear filters

---

## Create New View Animation (DFT-025)

When user clicks [+ New View] on a single-view (flat) layer:

| Phase | Timing | Effect |
|-------|--------|--------|
| 1. Button press | 0ms | Visual feedback (button depress) |
| 2. Row expansion | 0–150ms | Row expands vertically (`ease-out`). Parent styling appears (bg, border, chevron). |
| 3. Children appear | 150–250ms | Child rows fade in. Original child has eye ON, new child has eye OFF. Children indented 24px. |
| 4. New child highlight | 300–500ms | New child row flashes `bg-green-100`, fading to normal over 200ms. |

- Total duration: 250–300ms (excluding highlight fade)
- Focus moves to new child row after animation
- Screen reader: "New view created. {LayerName} now has {count} views."
- `prefers-reduced-motion`: instant state change + brief highlight only
- Debounce button to prevent animation stacking

---

## Auto-Collapse Behavior (DFT-005)

| Widget State | During Time-Series View | Rationale |
|-------------|-------------------------|-----------|
| Map Layers widget | Auto-collapses | Not needed during sensor exploration |
| Bookmarked Items widget | Remains expanded | Needed for "bookmark range" action |

- Trigger: Time-series chart/pop-up is active (e.g., Dendra sensor detail)
- Restoration: Widget restores to previous expand/collapse state when time-series closes
- Override: User can manually expand during time-series (overrides auto-collapse)

---

## Design Decision Summary

- **Widget title:** "Map Layers" (default). Configurable for team testing — alternatives: "Pinned Item Layers". Configurable via `src/config/terminology.ts`.
- **Conditional sections:** "ACTIVE LAYER" only appears when active layer is NOT pinned. "PINNED LAYERS" always shown. Active pinned layer gets emerald border indicator. No duplication. (Feb 6 resolution)
- **Eye toggle sync:** Visibility toggles in this widget sync bidirectionally with eye icons on pinned layers in the left sidebar. Single source of truth for layer visibility state. (Feb 6 resolution)
- **No filter editing in widget** — sidebar is the canonical filter editor (DFT-004). Widget shows filter status only.
- **"Edit Filters ->"** includes arrow to indicate navigation to right sidebar (DFT-019)
- **One expanded row at a time** — clicking another collapses the previous (DFT-003b)
- **Multiple filtered views** use nested parent/child structure; mutual exclusivity (DFT-013)
- **Single-view layers stay flat** — nesting only when 2+ views exist (DFT-013)
- **Undo instead of confirmation** for all single-item destructive actions (DFT-031)
- **Drag-and-drop** changes both widget order and map z-order (DFT-034)
- **Filter indicator** uses Lucide Filter icon + count, single-line rows (DFT-024)
- **SVG/Lucide icons only**, no emojis (DFT-026)
- **Auto-collapse** during time-series viewing (DFT-005)
- **Empty states** differentiate first-visit (educational) from returning (laconic) (DFT-015)

---

## Accessibility

- **ARIA:** Widget container: `role="region"` with `aria-label="Map Layers"`
- **Drag-and-drop:** `aria-label="Drag to reorder layer. Use arrow keys to move up or down."` on handles
- **ARIA live region:** `role="status" aria-live="polite"` for drag position announcements
- **Tab order:** Part of global tab order after map (DFT-017)
- **Keyboard:** Enter/Space on buttons; Arrow keys on drag handles; Escape closes expanded panels
- **Screen reader:** Announces significant actions — "Layer pinned", "Layer unpinned", "Filter applied"

---

## Open Questions

1. ~~**Widget title terminology:**~~ **RESOLVED (Feb 6):** Use "Map Layers" as default. Configurable for team testing via terminology config.
2. ~~**Active layer section when active layer is also pinned:**~~ **RESOLVED (Feb 6):** ACTIVE LAYER section hidden when active layer is pinned. Active pinned row gets emerald border indicator. No duplication.
3. ~~**Parent row remove [x] behavior:**~~ **RESOLVED (Feb 6):** Treat as single action (remove parent + all children) with undo. The parent is "one thing" from the user's perspective.
