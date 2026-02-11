# Component Spec: Map Layers Widget

> **Updated Feb 11, 2026 (DFT-046):** Widget title changed from "Mapped Item Layers" to **"Map Layers"**. The Saved Items widget has been dropped; all saved state (layers AND individual items) is now unified into this widget. Individual items are saved as filtered views returning one result. See `docs/PLANNING/resolved-decisions/dft-046-resolution-summary.md`.

**Date:** February 6, 2026 (updated Feb 11, 2026)  
**DFTs Referenced:** DFT-001, DFT-003b, DFT-005, DFT-013, DFT-015, DFT-017, DFT-019, DFT-024, DFT-025, DFT-026, DFT-029, DFT-031, DFT-034, DFT-046  
**Status:** Active — primary widget for all saved map state

---

## Terminology

- **Active** = the layer currently being inspected; shown in right sidebar and visible on map. Only ONE at a time.
- **Pinned** = a layer saved to this widget with optional filters. Multiple allowed. Persistent for session.
- **Filtered view** = a pinned layer with specific query parameters (e.g., "Camera Traps — mountain lion").
- **Nested / multi-view** = when a layer has 2+ filtered views, it promotes to a parent-child structure (DFT-013).
- **Distinguisher** = the parenthetical label that differentiates views of the same layer (e.g., "(mountain lion)", "(deer)").

---

## Widget Principle

> **The Map Layers widget is the single state management hub for all saved map state.** The left sidebar is for _navigation and selection_; this widget is for _persistence, visibility, filtering, and ordering_. It answers: "What's on my map right now, and what have I saved?" As of DFT-046, this includes both layer-level filtered views (multiple results) AND individual item references (single-result filtered views).

---

## Anatomy — Full Widget

```
┌──────────────────────────────────────────────────┐
│ A. WidgetHeader                                  │
│    [layers-icon]  Map Layers    [undo] [−] [x]   │
├──────────────────────────────────────────────────┤
│ B. ActiveLayerSection                            │
│    ┌──────────────────────────────────────────┐  │
│    │ ACTIVE LAYER                             │  │  ← amber section header
│    │ [eye] iNaturalist Observations   [Pin]   │  │  ← active layer row
│    └──────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│ C. PinnedLayersSection                           │
│    ┌──────────────────────────────────────────┐  │
│    │ PINNED LAYERS (2)                        │  │  ← blue section header
│    │ [drag][eye] Camera Traps v   [Filter 5][x]│ │  ← nested parent row
│    │       [eye] mountain lion    [Filter 5]  │  │  ← child (visible)
│    │             deer             [Filter 3]  │  │  ← child (hidden)
│    │       [+ New View]                       │  │
│    │ [drag][eye] Fire Perimeter   [Filter]  [x]│ │  ← flat row (no filters)
│    └──────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│ D. WidgetTip                                     │
│    Pin layers to keep them on the map.           │
└──────────────────────────────────────────────────┘
```

**Positioning:** Floating, absolute, top-left of map area (`top-4 left-4`), `z-40`.  
**Width:** 320px.  
**Max body height:** 350px (scrollable via `sidebar-scroll`).

| Part | Element | Description |
|------|---------|-------------|
| A | WidgetHeader | Widget icon + title + undo button (DFT-031) + collapse toggle + close button. |
| B | ActiveLayerSection | Amber-accented section for the currently selected (non-pinned) layer. Shows eye icon + layer name + [Pin] button. Empty when no layer is active or active layer is already pinned. |
| C | PinnedLayersSection | Blue-accented section for all pinned layers. Supports flat rows, nested multi-view rows, drag reorder (DFT-034), filter indicators (DFT-024), expanded panels (DFT-003b). |
| D | WidgetTip | Educational hint at bottom. `text-[11px] text-gray-500`. |

---

## Component 1: WidgetHeader

```
┌──────────────────────────────────────────────────┐
│ [layers-icon]  Map Layers       [undo] [−] [x]   │
└──────────────────────────────────────────────────┘
```

| Element | Styling | Notes |
|---------|---------|-------|
| Container | `flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-t-xl border-b border-gray-200` | Matches Bookmarked Items widget header |
| Icon | Lucide `Layers`, `w-4 h-4 text-gray-500` | SVG only (DFT-026) |
| Title | `text-sm font-semibold text-gray-900` | "Map Layers" |
| Undo button | DFT-031 pattern: always visible, grayed when inactive | See design system `UndoButton` pattern |
| Collapse toggle | `icon-btn p-1 text-gray-400 hover:text-gray-600` | Lucide `Minus` |
| Close button | Hidden for this widget — widget should always be visible | See Open Questions |

### Undo Button States (DFT-031)

| State | Styling | Tooltip |
|-------|---------|---------|
| Inactive | `text-gray-400 opacity-40 cursor-not-allowed` | "No actions to undo" |
| Active | `text-emerald-600 hover:text-emerald-700 cursor-pointer` | "Undo: [action description]" |

**Undo covers:** Unpin layer, delete filtered view, clear filters.

---

## Component 2: ActiveLayerSection

The section that shows the currently selected (non-pinned) layer.

### Anatomy

```
┌──────────────────────────────────────────────────┐
│ [eye-icon] ACTIVE LAYER                          │  ← section header (amber)
├──────────────────────────────────────────────────┤
│ [eye] iNaturalist Observations           [Pin]   │  ← active layer row
└──────────────────────────────────────────────────┘
```

### Section Header Tokens

| Element | Styling |
|---------|---------|
| Container | `px-3 py-1.5 bg-amber-50 border-b border-amber-200` |
| Label | `text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1` |
| Icon | Lucide `Eye`, `w-3 h-3` (inline with label) |

### Active Layer Row Tokens

| Element | Styling |
|---------|---------|
| Container | `px-3 py-2.5 flex items-center gap-2 bg-amber-50/50` |
| Eye icon | Lucide `Eye`, `w-4 h-4 text-amber-600` — always visible (active = on map) |
| Layer name | `text-sm text-gray-800 font-medium flex-1 truncate` |
| [Pin] button | `flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-md text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors text-[11px] font-medium` |
| Pin icon | Lucide `Pin`, `w-3.5 h-3.5` (inside button) |

### Behavior

- **One active layer at a time.** Selecting a new layer in the left sidebar replaces the current active layer (DFT-001, DFT-021).
- **Active layer is always visible on map.** Eye icon is always ON (amber).
- **[Pin] button** moves the layer from Active to Pinned section. Layer remains active but is now also pinned.
- **Empty when:** No layer selected, or the active layer is already pinned (pinned+active layers show in the Pinned section with active styling instead).

---

## Component 3: PinnedLayersSection

The section that shows all persistently saved layers.

### Section Header Tokens

| Element | Styling |
|---------|---------|
| Container | `px-3 py-1.5 bg-blue-50 border-y border-blue-200` |
| Label | `text-[10px] font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1` |
| Icon | Lucide `Pin`, `w-3 h-3` (inline with label) |
| Count badge | `bg-blue-200 text-blue-800 px-1.5 rounded-full text-[10px] ml-1` |

### Pinned Layer Row — Flat (Single View)

When a layer has only one filtered view (or no filters).

```
┌──────────────────────────────────────────────────┐
│ [drag] [eye] Fire Perimeter 2025   [Filter] [x]  │
└──────────────────────────────────────────────────┘
```

| Element | Styling | Purpose |
|---------|---------|---------|
| Container | `widget-layer-card rounded-lg px-3 py-2 flex items-center gap-2 bg-white` | Standard card |
| Drag handle | Lucide `GripVertical`, `w-4 h-4`, `cursor-grab` / `cursor-grabbing` (DFT-034) | Reorder layers |
| Eye toggle (visible) | Lucide `Eye`, `w-4 h-4 text-emerald-600`, `icon-btn` | Toggle map visibility |
| Eye toggle (hidden) | Lucide `EyeOff`, `w-4 h-4 text-gray-300`, `icon-btn` | Toggle map visibility |
| Layer name | `text-sm text-gray-700 flex-1 truncate` | Includes distinguisher in parentheses if filtered |
| Filter indicator (with filters) | `flex items-center gap-0.5 text-xs text-emerald-600 cursor-pointer` | DFT-024: Lucide `Filter` + count |
| Filter indicator (no filters) | `flex items-center gap-0.5 text-xs text-gray-400 cursor-pointer` | DFT-024: Lucide `Filter` only |
| Remove [x] | `icon-btn text-gray-300 hover:text-red-500`, Lucide `X`, `w-4 h-4` | Unpin layer |

### Expanded Panel (DFT-003b)

When a pinned layer row is clicked, an expanded panel appears below it showing filter summary and actions.

```
┌──────────────────────────────────────────────────┐
│ [drag] [eye] Camera Traps (mt. lion) [F 5] [x]   │  ← row (with bg highlight)
│ ┌──────────────────────────────────────────────┐ │
│ │ species = Mountain Lion, date > 2024-01-01, │ │  ← filter summary (gray text)
│ │ region = North Ridge, status = Active,      │ │
│ │ confidence >= 80%                           │ │
│ │                                             │ │
│ │ [Clear]                  [Edit Filters ->]  │ │  ← action row
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Panel container | `bg-gray-50 border border-gray-200 rounded-lg mx-1 px-3 py-2.5` |
| Filter summary | `text-[11px] text-gray-500 leading-relaxed mb-2` |
| [Clear] link | `text-[11px] text-gray-400 hover:text-red-500 cursor-pointer` |
| [Edit Filters ->] link | `text-[11px] font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer` |
| Chevron (inline with Edit Filters) | Lucide `ChevronRight`, `w-3 h-3 inline ml-0.5` |

**Behavior:**
- Only ONE panel expanded at a time. Clicking another row collapses the current panel.
- Transition: `max-height 0.2s ease-out, opacity 0.15s ease` (collapse animation).
- **"Edit Filters ->"** opens the right sidebar Browse tab for this layer, highlighting the filter section (DFT-019). Expanded panel remains open so user can reference filter summary.
- **"Clear"** removes all filters. Executes immediately — no confirmation dialog (DFT-031). Undo available.
- If no filters applied, panel shows: "No filters applied. Edit Filters ->" with "Edit Filters" link only.

### Pinned Layer Row — Nested (Multi-View, DFT-013)

When a layer has 2+ filtered views, it promotes to a parent-child structure.

```
┌──────────────────────────────────────────────────┐
│ [drag] [eye] Camera Traps v                [x]   │  ← parent row
│        [eye] mountain lion    [Filter 5]         │  ← child (visible, emerald bg)
│              deer             [Filter 3]         │  ← child (hidden, grayed)
│        [+ New View]                              │  ← create action
└──────────────────────────────────────────────────┘
```

### Parent Row Tokens

| Element | Styling |
|---------|---------|
| Container | `widget-layer-card rounded-lg px-3 py-2 flex items-center gap-2 bg-white` |
| Name | `text-sm font-semibold text-gray-800 flex-1 truncate cursor-pointer` |
| Chevron | `w-3 h-3 inline ml-0.5 text-gray-400`, rotates when collapsed |
| No filter indicator on parent | Filter info is on each child row |
| Remove [x] | Unpins ALL child views |

### Child Row Tokens — Visible

| Element | Styling |
|---------|---------|
| Container | `widget-layer-card nested-child rounded-lg px-3 py-2 flex items-center gap-2 bg-emerald-50 border-emerald-200 cursor-pointer` |
| Eye | Lucide `Eye`, `w-3.5 h-3.5 text-emerald-600` |
| Name | `text-sm text-gray-800 flex-1 truncate` |
| Filter indicator | `flex items-center gap-0.5 text-xs text-emerald-600 cursor-pointer` |
| Indentation | `ml-6` (24px) from parent, with `nested-child::before` connecting line |

### Child Row Tokens — Hidden

| Element | Styling |
|---------|---------|
| Container | `widget-layer-card nested-child rounded-lg px-3 py-2 flex items-center gap-2 bg-white cursor-pointer opacity-60` |
| Eye | Lucide `EyeOff`, `w-3.5 h-3.5 text-gray-300` |
| Name | `text-sm text-gray-400 flex-1 truncate` |
| Filter indicator | `flex items-center gap-0.5 text-xs text-gray-300` |

### "+ New View" Button

| Element | Styling |
|---------|---------|
| Container | `w-full text-left px-3 py-1.5 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors` |
| Icon | Lucide `Plus`, `w-3 h-3 inline mr-1` |
| Label | "New View" |

### Connecting Line (Nested Children)

```css
.nested-child {
  position: relative;
}
.nested-child::before {
  content: '';
  position: absolute;
  left: 12px;
  top: -4px;
  bottom: -4px;
  width: 1px;
  background: #e2e8f0;
}
```

---

## Component 4: WidgetTip

```
┌──────────────────────────────────────────────────┐
│ Pin layers to keep them on the map. Only one     │
│ non-pinned layer can be visible at a time.       │
└──────────────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Container | `px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-b-xl` |
| Text | `text-[11px] text-gray-500` |

**Visibility:** Always visible when widget body is expanded. Hidden when widget is collapsed.

---

## Component 5: WidgetShell (Floating Container)

The outer floating container shared with the Bookmarked Items widget.

| Element | Styling |
|---------|---------|
| Container | `floating-widget absolute top-4 left-4 w-[320px] bg-white rounded-xl z-40` |
| Shadow | `box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)` |
| Backdrop | `backdrop-filter: blur(8px)` |

---

## States

### State 1: Default — Active Layer + Pinned Layers Populated

The most common state during active use.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers           [undo-g] [−]      │
├──────────────────────────────────────────────────┤
│ [eye] ACTIVE LAYER                               │
│ [eye] iNaturalist Observations           [Pin]   │
├──────────────────────────────────────────────────┤
│ [pin] PINNED LAYERS (2)                          │
│ [drag][eye] Camera Traps v               [x]     │
│       [eye] mountain lion    [Filter 5]          │
│             deer             [Filter 3]          │
│       [+ New View]                               │
│ [drag][eye] Fire Perimeter   [Filter]    [x]     │
├──────────────────────────────────────────────────┤
│ Pin layers to keep them on the map.              │
└──────────────────────────────────────────────────┘
```

---

### State 2: Empty — No Layers Active or Pinned (First Visit)

When user has never pinned a layer and no layer is currently selected.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers                     [−]      │
├──────────────────────────────────────────────────┤
│                                                  │
│           [pin-icon - muted]                     │
│                                                  │
│     No layers pinned                             │
│                                                  │
│     Pin layers from the left sidebar             │
│     to save them here.                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Styling (DFT-015):**
- Icon: `w-12 h-12 text-gray-300` (Lucide `Pin`)
- Title: `text-sm font-medium text-gray-700`
- Body: `text-sm text-gray-500`
- Container: `flex flex-col items-center justify-center text-center px-6 py-8`
- Utilitarian tone — no apologies, no warmth.

### State 2b: Empty — Returning User

When user has previously pinned layers but currently has none.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers                     [−]      │
├──────────────────────────────────────────────────┤
│                                                  │
│     Pinned layers appear here.                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Detection:** localStorage key `hasEverPinnedLayer` (DFT-015).

---

### State 3: Active Layer Only (Nothing Pinned)

User has selected a layer from the left sidebar but hasn't pinned anything yet.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers                     [−]      │
├──────────────────────────────────────────────────┤
│ [eye] ACTIVE LAYER                               │
│ [eye] iNaturalist Observations           [Pin]   │
├──────────────────────────────────────────────────┤
│ [pin] PINNED LAYERS (0)                          │
│                                                  │
│     Pinned layers appear here.                   │
│     (or first-visit educational copy)            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### State 4: Active Layer IS Pinned

When the active layer has been pinned, it appears in the Pinned section with active styling. The Active Layer section is empty/hidden.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers           [undo-g] [−]      │
├──────────────────────────────────────────────────┤
│ [pin] PINNED LAYERS (2)                          │
│ [drag][eye] Camera Traps v               [x]     │  ← active + pinned (bold name)
│       [eye] mountain lion    [Filter 5]          │  ← this is the active view
│             deer             [Filter 3]          │
│       [+ New View]                               │
│ [drag][eye] Fire Perimeter   [Filter]    [x]     │
├──────────────────────────────────────────────────┤
│ Pin layers to keep them on the map.              │
└──────────────────────────────────────────────────┘
```

**Notes:**
- Active Layer section header is hidden (no amber section) when active layer is already pinned.
- The active layer's row in the Pinned section shows additional bold/accent styling to indicate it's the current focus.
- This avoids duplication — the same layer doesn't appear in both sections.

---

### State 5: Expanded Panel Open (DFT-003b)

User has clicked a pinned layer row to see its filter summary and actions.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers           [undo-g] [−]      │
├──────────────────────────────────────────────────┤
│ [pin] PINNED LAYERS (2)                          │
│ [drag][eye] Camera Traps (mt. lion) [F 5] [x]    │  ← active + highlighted
│ ┌──────────────────────────────────────────────┐ │
│ │ species = Mountain Lion, date > 2024-01-01, │ │
│ │ region = North Ridge, status = Active,      │ │
│ │ confidence >= 80%                           │ │
│ │                                             │ │
│ │ [Clear]                  [Edit Filters ->]  │ │
│ └──────────────────────────────────────────────┘ │
│ [drag][eye] Fire Perimeter   [Filter]    [x]     │
├──────────────────────────────────────────────────┤
│ Pin layers to keep them on the map.              │
└──────────────────────────────────────────────────┘
```

---

### State 6: Widget Collapsed

User has clicked the collapse toggle [−].

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers (3)                [+]      │
└──────────────────────────────────────────────────┘
```

**Collapsed behavior:**
- Header shows total layer count in parentheses: `"Map Layers (3)"`.
- Toggle switches to [+] (expand icon).
- Body transitions: `max-height: 0; opacity: 0; padding: 0;` over `0.2s ease-out`.
- **No hint text when collapsed** — count badge provides sufficient context.

---

### State 7: Auto-Collapsed (DFT-005 — Time Series Active)

When a Dendra time-series chart is open, this widget auto-collapses to free screen space.

```
┌──────────────────────────────────────────────────┐
│ [layers]  Map Layers (3)                [+]      │
└──────────────────────────────────────────────────┘
```

**Behavior (DFT-005):**
- Auto-collapses when time-series chart/pop-up is active.
- Restores to previous expand/collapse state when time-series view closes.
- User override: if user manually expands during time-series, stays expanded.

---

### State 8: Pinned Layer — Eye Hidden

A pinned layer has been toggled to invisible on the map.

```
│ [drag][eye-off] Fire Perimeter   [Filter]  [x]  │
```

| Element | Change from Visible |
|---------|-------------------|
| Eye icon | Switches to Lucide `EyeOff`, `text-gray-300` |
| Layer name | `text-gray-400` (muted to reinforce hidden state) |
| Filter indicator | `text-gray-300` (dimmed) |
| Row opacity | Slight dimming but NOT `opacity-60` on entire row (keep [x] and drag handle visible) |

---

### State 9: Drag in Progress (DFT-034)

User is dragging a pinned layer to reorder.

```
┌──────────────────────────────────────────────────┐
│ [pin] PINNED LAYERS (3)                          │
│ ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───     │  ← 4px blue drop indicator
│ [drag][eye] iNaturalist   [Filter 2]    [x]      │  ← normal row
│                                                  │
│ ╭ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╮   │
│ │ [drag][eye] Camera Traps   [Filter 5] [x] │   │  ← dragged row (lifted)
│ ╰ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╯   │
│                                                  │
│ [drag][eye] Fire Perimeter   [Filter]   [x]      │
└──────────────────────────────────────────────────┘
```

**Dragged row styling (DFT-034):**
```css
.widget-layer-card.dragging {
  opacity: 0.6;
  transform: scale(0.95) rotate(2deg);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.3);
  cursor: grabbing;
  border: 2px dashed #3b82f6;
}
```

**Drop target indicator:**
```css
.widget-layer-card.drag-over {
  border-top: 4px solid #3b82f6;
  margin-top: -4px;
  background-color: rgba(59, 130, 246, 0.05);
}
```

**Post-drop settle animation:**
```css
.widget-layer-card.just-dropped {
  animation: settle 400ms ease-out;
  background-color: #dcfce7; /* green = success */
}
```

**Reduced motion:** `transform: scale(0.95)` only (no rotation). No settle animation.

---

### State 10: Single Pinned Layer (No Drag Handle)

When only one layer is pinned, drag handles are hidden (nothing to reorder).

```
┌──────────────────────────────────────────────────┐
│ [pin] PINNED LAYERS (1)                          │
│       [eye] Fire Perimeter   [Filter]    [x]     │  ← no drag handle
└──────────────────────────────────────────────────┘
```

---

## Multi-View Behavior (DFT-013)

### Promotion to Nested Structure

When a user clicks "+ New View" on a single-view (flat) pinned layer:

1. The flat row promotes to a nested parent-child structure.
2. Original view becomes the first child (retains its filters + distinguisher).
3. New child appears with the current filter state as a duplicate.
4. Animation: 250-300ms expansion (DFT-025).

### Mutual Exclusivity

| Rule | Behavior |
|------|----------|
| Only ONE child visible at a time | Clicking a child's eye auto-hides the previously visible one |
| Parent eye toggle ON | Restores the previously-selected child view (memory-preserving) |
| Parent eye toggle OFF | Hides all children |
| Click child eye OFF | Also turns off parent eye (no children visible = parent "off") |
| Click child row | Entire row is clickable; toggles that view's visibility |

### Distinguisher Algorithm (DFT-001)

Auto-generated label for differentiating views of the same layer:

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Species/taxon filter | "Camera Traps (mountain lion)" |
| 2 | Date range | "Camera Traps (2024)" |
| 3 | Spatial filter | "Camera Traps (North Ridge)" |
| 4 | User-provided name | "Camera Traps (my query)" |
| 5 | Fallback | "Camera Traps (View 1)" |

### Create New View Animation (DFT-025)

| Phase | Timing | Effect |
|-------|--------|--------|
| 1. Button press | 0ms | Visual feedback (button depress) |
| 2. Row expansion | 0–150ms | Row expands vertically (`ease-out`). Parent styling appears. |
| 3. Children appear | 150–250ms | Child rows fade in. Original has eye ON, new has eye OFF. |
| 4. New child highlight | 300–500ms | New child flashes `bg-green-100`, fading to normal over 200ms. |

**Total duration:** 250-300ms (excluding highlight fade).

**Post-animation:**
- Focus moves to new child row.
- Screen reader announces: "New view created. [LayerName] now has [count] views."
- Reduced motion: instant state change + brief highlight only.

---

## Filter Indicator (DFT-024)

### Visual States

| State | Display | Styling |
|-------|---------|---------|
| Has filters | Lucide `Filter` + count (e.g., "5") | `text-xs text-emerald-600` |
| No filters | Lucide `Filter` only | `text-xs text-gray-400` |

### Tokens

| Element | Styling |
|---------|---------|
| Container | `flex items-center gap-0.5 cursor-pointer` |
| Icon | Lucide `Filter`, `w-3 h-3` |
| Count | `text-xs` (inherits container color) |

### Behavior

- **Click:** Opens Browse tab in right sidebar for this layer (same as "Edit Filters ->").
- **Tooltip (with filters):** `"5 filters applied. Click to edit."`
- **Tooltip (no filters):** `"No filters — click to add"`
- **ARIA:** `aria-label="5 filters applied. Click to edit."` or `"No filters. Click to add."`

---

## Map Z-Order (DFT-034)

Widget row order from top to bottom corresponds to map layer rendering order (top = renders on top).

**After reorder:**
- Map layer z-order updates (debounced 300ms).
- Toast at bottom-center of map: "Map layer order updated" (2s auto-dismiss).

---

## Map Badge Behavior (DFT-029)

Count badges on map features (camera icons, sensor markers) only appear when a layer-level filter is active.

| State | Badge | Marker |
|-------|-------|--------|
| No filter active | No badge | Normal styling |
| Filter active, results > 0 | Badge with filtered count | Normal styling |
| Filter active, results = 0 | No badge | Grayed out (DFT-028) |

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Click layer in left sidebar | Layer appears in Active Layer section; right sidebar opens to Overview | DFT-001, DFT-006 |
| Click [Pin] button in Active section | Layer moves to Pinned section; Active section empties or hides | DFT-001 |
| Click pinned layer row | Expanded panel opens with filter summary + actions | DFT-003b |
| Click "Edit Filters ->" in expanded panel | Right sidebar opens to Browse tab; filter section highlighted | DFT-019 |
| Click "Clear" in expanded panel | All filters removed immediately; undo available | DFT-031 |
| Click "+ New View" button | Promotes to nested structure (or adds new child); animation per DFT-025 | DFT-013 |
| Click filter indicator icon | Right sidebar opens to Browse tab for that layer | DFT-024 |
| Click eye toggle (ON -> OFF) | Layer hidden on map; icon switches to `EyeOff`; row dims | DFT-001 |
| Click eye toggle (OFF -> ON) | Layer visible on map; icon switches to `Eye`; row returns to normal | DFT-001 |
| Click [x] on pinned layer | Layer unpinned; removed from widget; undo available | DFT-001, DFT-031 |
| Click [x] on nested parent | All child views unpinned; undo available | DFT-013 |
| Click child row (nested) | Toggles that child's visibility; previous visible child auto-hides | DFT-013 |
| Click parent eye (ON -> OFF, nested) | All children hidden | DFT-013 |
| Click parent eye (OFF -> ON, nested) | Previously-selected child restored | DFT-013 |
| Drag a pinned row | Reorder with visual feedback; map z-order updates on drop | DFT-034 |
| Click collapse toggle [−] | Widget collapses to header-only; count badge shown | |
| Click expand toggle [+] | Widget expands to full body | |
| Press Escape | Closes expanded panel (if open); otherwise no effect | DFT-017 |
| Press Arrow Up/Down on drag handle | Reorder via keyboard; ARIA live announces position | DFT-034 |
| Selecting hidden pinned layer in sidebar | Auto-restores visibility; layer becomes active | DFT-001 |

---

## Left Sidebar Sync

The widget's visibility state syncs bidirectionally with the left sidebar's eye/pin icons (Feb 6 left-sidebar.md refinement):

| Widget Action | Left Sidebar Effect |
|---|---|
| Eye ON | Sidebar eye icon turns blue |
| Eye OFF | Sidebar eye icon turns gray |
| Unpin layer | Sidebar pin icon removed; eye icon removed |
| Pin layer | Sidebar shows solid pin + eye icon |

| Sidebar Action | Widget Effect |
|---|---|
| Click eye icon (blue -> gray) | Widget eye turns gray; layer hidden on map |
| Click eye icon (gray -> blue) | Widget eye turns blue; layer visible on map |
| Click pin icon (hover, unpinned) | Layer added to Widget Pinned section |
| Click pin icon (solid, pinned) | Layer removed from Widget Pinned section; undo available |

---

## Design Decision Summary

- **Two-section layout: Active + Pinned** (DFT-001). Active is temporary (one at a time). Pinned is persistent (multiple). Clear separation of transient vs. saved state.
- **Active Layer section hidden when active layer is pinned** — avoids duplication. Active styling moves to the Pinned section row.
- **Pin action is explicit** (DFT-001). Clicking a layer in the sidebar makes it active but does NOT pin it. The [Pin] button is a deliberate save action.
- **Multi-view nested structure** (DFT-013). Only promoted when 2+ views exist. Mutual exclusivity prevents badge confusion. Parent eye toggle is memory-preserving.
- **Expanded panel for filter summary** (DFT-003b). Click row to expand. Shows filter text summary + "Edit Filters" and "Clear" actions. Only one expanded at a time.
- **Filter indicator icon + count** (DFT-024). Compact, clickable, familiar funnel icon. Tooltip bridges learnability gap.
- **Drag-to-reorder** (DFT-034). Drag handles visible when 2+ pinned layers. Map z-order matches widget order. Keyboard support via Arrow keys.
- **No confirmation dialogs** (DFT-031). All destructive actions (unpin, clear, delete view) execute immediately. Persistent undo button in widget header.
- **Auto-collapse during time-series** (DFT-005). Pinned Layers widget auto-collapses when Dendra chart is active. Bookmarked Features stays expanded.
- **SVG/Lucide icons only** (DFT-026). No emojis.
- **Widget always present** — collapses to header, never fully closes. This is the primary state management interface for map layers.

---

## Accessibility

- **ARIA:** `role="region"` on widget, `aria-label="Map Layers"`.
- **Sections:** `role="group"` on Active Layer and Pinned Layers sections with `aria-label`.
- **Drag handles:** `aria-label="Drag to reorder layer. Use arrow keys to move up or down."` (DFT-034).
- **Eye toggles:** `aria-label="[Layer name] is visible on map"` / `"[Layer name] is hidden"`. `aria-pressed` toggle state.
- **Filter indicators:** `aria-label="5 filters applied. Click to edit."` (DFT-024).
- **Keyboard:**
  - Tab navigates between interactive elements (handles, eyes, filter indicators, buttons).
  - Arrow Up/Down on drag handle reorders layers. Shift+Home moves to top, Shift+End to bottom.
  - Enter/Space activates buttons and toggles.
  - Escape closes expanded panel.
- **Screen reader announcements** (via `aria-live="polite"`):
  - "Layer pinned" / "Layer unpinned"
  - "Layer visibility toggled on/off"
  - "Filters cleared"
  - "[Layer name] moved to position [N] of [total]" (during reorder)
  - "New view created. [Layer name] now has [count] views."
- **Tab order:** Widget is third in global tab order (after left sidebar, then map) (DFT-017).
- **Focus management:** When expanded panel opens, focus moves to first action ("Clear" or "Edit Filters"). When panel closes, focus returns to the row that triggered it.
- **ARIA live region for reorder announcements:**
  ```html
  <div id="drag-announcements" role="status" aria-live="polite" class="sr-only"></div>
  ```

---

## File Structure

```
src/v2/components/FloatingWidgets/
  MapLayersWidget/
    MapLayersWidget.tsx         <- Main widget container (WidgetShell + Header + Body)
    ActiveLayerSection.tsx      <- Section B: amber-accented active layer display
    PinnedLayersSection.tsx     <- Section C: blue-accented pinned layers list
    PinnedLayerRow.tsx          <- Flat row (single view) or nested parent row
    PinnedLayerChildRow.tsx     <- Child row within nested multi-view
    ExpandedFilterPanel.tsx     <- DFT-003b: filter summary + actions
    FilterIndicator.tsx         <- DFT-024: funnel icon + count badge
    NewViewButton.tsx           <- DFT-013: "+ New View" action
  shared/
    WidgetShell.tsx             <- Floating container (shadow, backdrop, rounded)
    WidgetHeader.tsx            <- Title + undo + collapse + close buttons
    WidgetTip.tsx               <- Educational hint at bottom
  BookmarkedItemsWidget/
    ...                         <- Separate widget (DFT-037-P3)
```

---

## Open Questions

1. ~~**Widget close button:**~~ **RESOLVED (Feb 6):** Widget does not have a close [x] button. It collapses to header but is always visible. This is the primary state management interface — hiding it would orphan layers on the map with no way to manage them. Collapse toggle [−] is sufficient for screen space management.

2. **Active Layer section when active layer is also pinned:** Current spec says Active section is hidden and active styling moves to the Pinned row. Alternative: always show Active section, with "Already pinned" badge instead of [Pin] button. **Decision needed** — hiding is cleaner (less vertical space), but always-showing provides consistent spatial layout. **Proposal:** Hide the Active section when active layer is pinned. The pinned row's active styling (bold name, left border accent) is sufficient to communicate "this is what I'm currently looking at."

3. **Expanded panel for nested children:** Should clicking a child row open an expanded panel (like flat rows), or should expanding only work at the parent level? **Proposal:** Child rows are clickable to toggle visibility; parent row expansion shows the active child's filter summary. This keeps the interaction consistent — "click row = expand, click eye = toggle."

---

## Component Interface (Top-Level)

```typescript
interface MapLayersWidgetProps {
  // Active layer
  activeLayer?: {
    id: string;
    name: string;
    isPinned: boolean;
  };
  onPinActiveLayer: () => void;

  // Pinned layers
  pinnedLayers: PinnedLayer[];
  onToggleVisibility: (layerId: string, viewId?: string) => void;
  onUnpin: (layerId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onEditFilters: (layerId: string, viewId?: string) => void;
  onClearFilters: (layerId: string, viewId?: string) => void;
  onCreateNewView: (layerId: string) => void;

  // Undo
  canUndo: boolean;
  onUndo: () => void;
  undoDescription?: string;

  // Widget state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface PinnedLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isActive: boolean;
  filterCount: number;
  filterSummary?: string;     // "species = Mountain Lion, date > 2024"
  distinguisher?: string;     // "(mountain lion)"
  views?: PinnedLayerView[];  // If multi-view (DFT-013)
}

interface PinnedLayerView {
  id: string;
  name: string;               // Distinguisher label
  isVisible: boolean;
  filterCount: number;
  filterSummary?: string;
}
```
