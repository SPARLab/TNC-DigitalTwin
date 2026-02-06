# Component Spec: Left Sidebar

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-001, DFT-006, DFT-015, DFT-017, DFT-021, DFT-026, DFT-031, DFT-035  
**Status:** Draft — pending review

---

## Terminology

- **Active** = the layer currently visible on the map and shown in the right sidebar (temporary, replaced when user clicks another layer)
- **Pinned** = a layer saved to the Map Layers widget (persistent, multiple allowed)
- **Item** = a record within a layer (camera, sensor, observation, dataset). Not "Feature" — per Trisalyn's update.

---

## Anatomy

```
┌────────────────────────────────────────────┐
│ [search] Search layers...                  │  A. Search bar
│────────────────────────────────────────────│
│ v [wildlife-icon] Wildlife             (3) │  B. Category header (expanded)
│    * Camera Traps (ANiML)  [eye] [pin]     │  C. Layer row (active + pinned)
│      iNaturalist Obs.      [eye] [pin]     │  D. Layer row (pinned, visible)
│      eBird Sightings                       │  E. Layer row (not pinned)
│ > [sensor-icon]  Env. Sensors          (2) │  F. Category header (collapsed)
│ v [dataset-icon] Research              (1) │
│      DataOne Datasets                      │
│ > [fire-icon]    Fire & Hazards        (3) │
│ > [ref-icon]     Reference             (5) │
│────────────────────────────────────────────│  G. Separator
│ > [research-icon] Research Datasets        │  H. Cross-category section
│                    (All Categories)        │
│      DataOne Datasets                      │
└────────────────────────────────────────────┘
```

**Labeled Parts:**

| Part | Element | Description |
|------|---------|-------------|
| A | Search bar | Full-width text input at top. Filters layer names in real time (500ms debounce, 2+ chars). |
| B | Category header | Collapsible group. Chevron + icon + name + layer count badge. |
| C | Layer row (active + pinned) | Bold text, emerald left border, green bg. Shows [eye] toggle + solid [pin]. |
| D | Layer row (pinned, not active) | Normal weight. [eye] toggle (blue=visible, gray=hidden) + solid [pin]. |
| E | Layer row (not pinned) | Normal weight text. No icons at rest. Hover: grayed [pin] appears. |
| F | Category header (collapsed) | Right-pointing chevron. Layer rows hidden. |
| G | Separator | Thin horizontal rule before cross-category section. |
| H | Cross-category section | DataOne and future cross-category sources. Labeled "(All Categories)". |

**Icon visibility rules:**

| Layer State | [eye] Icon | [pin] Icon |
|-------------|-----------|-----------|
| Not active, not pinned | Hidden | Hidden (grayed on hover) |
| Active, not pinned | Hidden (active styling = visibility) | Grayed on hover (clickable to pin) |
| Pinned, visible | Blue/ON (clickable) | Solid emerald (clickable to unpin) |
| Pinned, hidden | Gray/OFF (clickable) | Solid emerald (clickable to unpin) |
| Active + pinned, visible | Blue/ON (clickable) | Solid emerald (clickable to unpin) |

---

## States

### State 1: Default — Categories Expanded, Mixed Layer States

The initial populated state showing layers in various states.

```
┌────────────────────────────────────────────┐
│ [search] Search layers...                  │
│────────────────────────────────────────────│
│ v [icon] Wildlife Monitoring           (3) │
│    * Camera Traps (ANiML)  [eye] [pin]     │  ← Active + pinned + visible
│      iNaturalist Obs.   [eye-g] [pin]      │  ← Pinned but hidden (eye gray)
│      eBird Sightings                       │  ← Not pinned (no icons)
│ > [icon] Environmental Sensors         (2) │  ← Collapsed
│ v [icon] Research Datasets             (1) │
│      DataOne Datasets                      │
│ > [icon] Reference Layers              (5) │  ← Collapsed
│ > [icon] Fire & Hazards                (3) │  ← Collapsed
│────────────────────────────────────────────│
│ > [icon] Research Datasets                 │
│          (All Categories)                  │
└────────────────────────────────────────────┘
```

**Notes:**
- Only ONE layer is active at a time (DFT-021).
- Active layer has: bold text + `bg-emerald-50` + 2px left `border-emerald-600`.
- Pinned layers show [eye] + [pin] icons. [eye] blue = visible on map, [eye] gray = hidden.
- Non-pinned layers show no icons at rest (grayed [pin] appears on hover).
- Chevron `v` = expanded, `>` = collapsed.
- Category count badges show number of layers in that category.

---

### State 2: Layer Row — Default (Not Active, Not Pinned)

```
│      iNaturalist Observations        │
```

**Styling:**
- `text-sm text-gray-600`
- `py-1.5 px-3 pl-9` (indented under category)
- No icons visible at rest
- Cursor: `pointer`

---

### State 3: Layer Row — Active (Selected, Shown in Right Sidebar)

```
│    * Camera Traps (ANiML)            │
```

**Styling:**
- `text-sm font-semibold text-gray-900`
- `bg-emerald-50 border-l-2 border-emerald-600`
- `py-1.5 px-3 pl-9 rounded-sm`
- `*` represents the selection indicator (emerald dot or accent)

**Triggers:**
- User clicks layer row in sidebar → layer becomes active
- Right sidebar opens to Overview tab (DFT-006)
- Layer becomes visible on map
- Previous active layer is deactivated (replaced)

---

### State 4: Layer Row — Pinned, Visible (Not Active)

When a layer is pinned and visible on the map, both [eye] and [pin] icons are shown.

```
│      iNaturalist Obs.      [eye] [pin] │
```

**Styling:**
- Normal text weight (not active, just pinned)
- `[eye]` icon: Lucide `Eye`, `text-blue-500`, `w-4 h-4`, clickable — toggles map visibility
- `[pin]` icon: Lucide `Pin`, solid fill, `text-emerald-600`, `w-4 h-4`, clickable — unpins layer
- Both icons right-aligned in the row, `gap-1.5` between them

### State 4b: Layer Row — Pinned, Hidden (Not Active)

When a pinned layer's visibility is toggled off (eye OFF in the widget).

```
│      iNaturalist Obs.   [eye-g] [pin] │  ← [eye-g] = gray/off eye
```

**Styling:**
- Normal text weight
- `[eye-g]` icon: Lucide `EyeOff`, `text-gray-400`, `w-4 h-4`, clickable — toggles visibility back ON
- `[pin]` icon: same as State 4
- Layer name may optionally show slightly muted text (`text-gray-400`) to reinforce "hidden" state

**Notes:**
- Refinement of DFT-001 (Feb 6): original resolution said "no eyeball or pin icons in sidebar." Later feedback adds both back as interactive controls. Eye icons appear **only on pinned layers** (not on unpinned catalog layers). Active styling communicates visibility for the active layer.
- Eye toggles in the sidebar sync bidirectionally with the Map Layers widget eye toggles.
- Clicking [pin] unpins the layer. Clicking [eye] toggles map visibility. These are separate click targets.

---

### State 5: Layer Row — Active AND Pinned

```
│    * Camera Traps (ANiML)  [eye] [pin] │
```

**Styling:**
- Combines active styling (bold, emerald border, green bg) with [eye] and [pin] icons.
- All three indicators visible simultaneously: active styling + eye + pin.
- `[eye]` icon: Lucide `Eye`, `text-blue-500` (always ON — active layers are visible by definition)
- `[pin]` icon: Lucide `Pin`, solid fill, `text-emerald-600`

**Note:** The eye icon on an active+pinned layer is technically redundant with the active styling, but showing it maintains visual consistency with other pinned rows. If the user unpins while active, the eye icon disappears (active-only layers don't show eye icons).

---

### State 6: Layer Row — Hover (Unpinned Layer)

When hovering an unpinned layer, show a grayed-out pin icon. The icon is clickable — clicking pins the layer directly from the sidebar.

```
│      eBird Sightings        [pin-g]  │  ← [pin-g] = grayed pin icon (clickable)
```

**Styling:**
- Row: `hover:bg-gray-50 hover:text-gray-900`
- Grayed pin icon: `text-gray-300 hover:text-gray-500 w-4 h-4`, appears on hover only
- Icon disappears on mouse-out
- On pinned layers, the solid pin remains (no change on hover)

**Behavior:**
- Clicking the grayed pin icon pins the layer (adds to Map Layers widget PINNED section).
- Clicking the layer name (not the pin) activates the layer (shows in right sidebar, map).
- These are separate click targets: name = activate, pin = pin.

**Notes:**
- Pin icon is a **shortcut** for pinning directly from the sidebar. Users can also pin via the widget's [pin] button in the ACTIVE LAYER section.
- This follows Norman's principle of affordances — an icon that looks like a pin should behave like one.
- `hover:text-gray-500` on the icon provides hover feedback confirming it's interactive.

---

### State 7: Search Active

User has typed in the search bar. Layer list filters to matching results.

```
┌──────────────────────────────────────┐
│ [search] cam                    [x]  │  ← Search input with clear button
│──────────────────────────────────────│
│ v [icon] Wildlife Monitoring     (1) │  ← Count updates to filtered
│    * Camera Traps (ANiML)            │  ← Match
│──────────────────────────────────────│
│ (no other matches)                   │
└──────────────────────────────────────┘
```

**Behavior:**
- Filter is case-insensitive, matches layer name substrings
- Categories with 0 matching layers are hidden
- Category count badges update to show filtered count
- Debounce: 500ms after keystroke, 2+ characters (matches DFT-035 pattern)
- `[x]` clear button resets search and restores full list
- Active layer remains active even if search filters it out of view

---

### State 8: Empty Search Results

```
┌──────────────────────────────────────┐
│ [search] zzzzz                  [x]  │
│──────────────────────────────────────│
│                                      │
│         [search-icon - muted]        │
│                                      │
│     No layers match "zzzzz".         │
│     Try a different search term.     │
│                                      │
└──────────────────────────────────────┘
```

**Styling:**
- Icon: `w-12 h-12 text-gray-300` (Lucide `Search`)
- Title: `text-sm font-medium text-gray-700`
- Body: `text-sm text-gray-500`
- Utilitarian tone, no apologies (DFT-015 pattern)

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Click layer row | Layer becomes active; right sidebar opens to Overview tab; map shows layer | DFT-001, DFT-006, DFT-021 |
| Click already-active layer | No change (idempotent) | |
| Click pinned-but-hidden layer | Layer becomes active AND visibility restores | DFT-001 |
| Click category header | Toggle expand/collapse; chevron rotates | |
| Click [pin] icon (grayed, on hover) | Pin layer to Map Layers widget; [eye] + [pin] icons now persist on row | Feb 6 refinement |
| Click [pin] icon (solid, pinned layer) | Unpin layer from Map Layers widget; [eye] + [pin] icons removed; undo available | Feb 6, DFT-031 |
| Click [eye] icon (blue, visible) | Hide pinned layer on map; eye icon switches to gray `EyeOff`; syncs with widget | Feb 6 refinement |
| Click [eye] icon (gray, hidden) | Show pinned layer on map; eye icon switches to blue `Eye`; syncs with widget | Feb 6 refinement |
| Type in search bar | Layer list filters in real time (500ms debounce, 2+ chars) | Matches DFT-035 pattern |
| Click [x] in search bar | Clear search, restore full list | |
| Hover unpinned layer | Grayed [pin] icon appears (clickable to pin); no [eye] icon | Feb 6 refinement |
| Hover pinned layer | Standard row hover; [eye] + [pin] icons remain; both clickable | |
| Press Enter/Space on category | Toggle expand/collapse | WCAG 2.1.1 |
| Press Arrow Down | Navigate to next layer row | |
| Press Escape | Clear search (if search is active) | DFT-017 |

---

## Design Decision Summary

- **Visibility [eye] icons on pinned layers only** (Feb 6 refinement of DFT-001). Eye toggles map visibility and syncs bidirectionally with the Map Layers widget. Blue = visible, gray = hidden. Not shown on unpinned catalog layers — active styling communicates visibility for those.
- **Clickable [pin] icons** in sidebar rows (Feb 6 refinement of DFT-001). Solid pin = pinned (click to unpin), grayed pin on hover = unpinned (click to pin). Separate click target from layer name.
- **"Active" terminology** used instead of "Selected" (DFT-021). Active = visible on map.
- **One active layer at a time** (DFT-001, DFT-021). Clicking a new layer replaces the previous active layer.
- **Overview tab opens first** when a layer is selected (DFT-006).
- **SVG/Lucide icons only**, no emojis (DFT-026).
- **Cross-category section** (DataOne) appears below a separator with "(All Categories)" label.
- **Search is instant-filter** (substring matching, 500ms debounce, 2+ chars — matches DFT-035 pattern).

---

## Accessibility

- **ARIA:** `role="tree"` on sidebar, `role="treeitem"` on layer rows (DFT-017)
- **Keyboard:** Enter/Space toggles categories; Arrow keys navigate layers
- **Tab order:** Left sidebar is first in global tab order (DFT-017)
- **Focus:** Category expand/collapse maintains focus on the header

---

## Open Questions

1. ~~**Pin icon interactivity:**~~ **RESOLVED (Feb 6):** Pin icons ARE clickable. Grayed pin = click to pin. Solid pin = click to unpin.
2. **Category default state:** Should all categories start expanded or collapsed on first load? Current mockups show a mix. Recommend: top 2-3 categories expanded, rest collapsed.
3. **DataOne dual placement:** DataOne appears both under "Research Datasets" category AND in the cross-category section. Is this correct, or should it only appear in the cross-category section? Need confirmation.
4. ~~**Visibility icons in sidebar (pending):**~~ **RESOLVED (Feb 6):** Eye icons appear on pinned layers only (not on unpinned catalog layers). Blue `Eye` = visible on map, gray `EyeOff` = hidden. Syncs bidirectionally with Map Layers widget. Active styling already communicates visibility for the active layer, but active+pinned rows still show the eye icon for consistency.
