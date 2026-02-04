# DFT-001 Resolution Summary: Pinned Layers Widget Design

**Date:** January 27, 2026  
**Status:** ✅ Resolved  
**Decision:** Model C (Selection = Active, Pin Separate)

---

## The Problem

Sophia's feedback identified confusion: eyeball (visibility) and pin (save) icons seemed to do the same thing, creating unclear UX. The core tension:
- **Eyeball** = "show me this right now" (temporary)
- **Pin** = "save this layer + query for my session" (persistent)

Both result in "layer appears on map," causing confusion about their distinct purposes.

---

## The Solution: Model C

### Left Sidebar (Clean Navigation)

```
┌─────────────────────────────────────┐
│ 🪨 Soils & Geology                  │
│   ● Earthquake Faults               │  ← ● = active/selected
│     Soil Types                      │  
│     Geologic Units                  │
│ 🦎 Species                          │
│     iNaturalist Observations        │
└─────────────────────────────────────┘
```

**Sidebar job:** Navigation and selection only. No eyeball/pin clutter.

### Floating Widget (State Management)

**Collapsed state (typical view):**
```
┌─────────────────────────────────────┐
│ 👁 ACTIVE LAYER                     │
├─────────────────────────────────────┤
│ ● Camera Traps (mt. lion)  [🔍4] 📌 │
├─────────────────────────────────────┤
│ 📌 PINNED LAYERS                    │
├─────────────────────────────────────┤
│ 👁 Camera Traps (mt. lion)  [🔍5] ✕ │
│ 👁 Camera Traps (deer)      [🔍3] ✕ │
│ 👁 iNaturalist (birds)      [🔍2] ✕ │
│ 👁 Fire Hazard              [🔍]  ✕ │  ← gray icon = no filters
└─────────────────────────────────────┘
```

**Expanded state (when a pinned layer is clicked/active):**
```
┌───────────────────────────────────────────────┐
│ 👁 ACTIVE LAYER                               │
├───────────────────────────────────────────────┤
│ ● Camera Traps (mt. lion)            [🔍4] 📌 │
├───────────────────────────────────────────────┤
│ 📌 PINNED LAYERS                              │
├───────────────────────────────────────────────┤
│ 👁 ■ Camera Traps (mt. lion)         [🔍5] ✕ │  ← EXPANDED
│   ┌─────────────────────────────────────────┐ │
│   │ Filters: species = mt. lion, date>2024 │ │
│   │ [Edit Filters] [Clear] [+ New View]    │ │
│   └─────────────────────────────────────────┘ │
│ 👁 ■ Camera Traps (deer)             [🔍3] ✕ │
│ 👁 ■ iNaturalist (birds)             [🔍2] ✕ │
│ 👁   Fire Hazard                     [🔍]  ✕ │
└───────────────────────────────────────────────┘
```

**Widget job:** Show active layer + all pinned layers. Manage visibility, filters, and layer actions.

**Row elements:** `[drag] [👁] [Layer Name (distinguisher)] [Filter N] [✕]`  
**Note:** No swatch in row. Map legend shows symbology for active layer only.

**Expansion behavior (DFT-003b resolution):**
- Clicking a pinned layer makes it "active" and expands its panel
- Only ONE layer expanded at a time
- Expanded panel shows: filter summary, Edit Filters, Clear, **+ Create New View**
- "Create New View" duplicates the layer with current filters as a new pinned entry
- Active state indicated by: expansion (panel visible) + visual treatment (background color, left border accent)

---

## Key Behaviors

### Active Layer Section
- Shows currently selected layer from sidebar
- Only ONE active non-pinned layer at a time
- Selecting another layer in sidebar **replaces** the active layer
- [📌] button pins the active layer (moves to Pinned section)

### Pinned Layers Section
- Shows all saved layers with their queries
- Multiple layers can be pinned simultaneously
- Each has independent visibility toggle:
  - 👁 **blue** = visible on map
  - 👁 **gray** = hidden but still pinned
- Clicking pinned layer in sidebar:
  - Makes it active
  - **Auto-restores visibility** if it was hidden
  - Shows in right sidebar
- [✕] button unpins the layer

---

## Filter Indicators

### Icon Approach (DFT-024 Resolution - Feb 4, 2026)

**Decision:** Use icon-based filter indicator (not text-based).

| State | Example | Meaning |
|-------|---------|---------|
| **With count** | `[Filter 5]` | 5 filters applied, clickable to edit |
| **No filters** | `[Filter]` (gray) | No filters, clickable to add |

**Icon:** Lucide `Filter` icon (standard funnel symbol)  
**Tooltip:** "5 filters applied" or "No filters — click to add"  
**ARIA label:** `aria-label="5 filters applied. Click to edit."`

**Rationale:** Icon-based approach provides better density for multi-layer scenarios, maintains visual rhythm with consistent single-line rows, and aligns with progressive disclosure pattern (summary → details). Tooltip addresses first-time learnability. Filter funnel icon is industry convention familiar to target users.

### Primary Distinguisher (Parenthetical)

Auto-generated label helps differentiate multiple views of the same layer:

```
│ 👁 Camera Traps (mt. lion)  [Filter 5] ✕ │  ← species filter
│ 👁 Camera Traps (deer)      [Filter 3] ✕ │  ← different species
│ 👁 iNaturalist (birds)      [Filter 2] ✕ │  ← taxon filter
│ 👁 Fire Hazard (high risk)  [Filter 1] ✕ │  ← severity filter
```

**Algorithm (priority order):**
1. Species/taxon filter (most distinctive)
2. Date range (if no species)
3. Spatial filter (if no date)
4. User-provided name (override)
5. "View 1", "View 2" (fallback)

### Clicking Behavior

- **Click layer row** → Expands the layer panel in widget (shows filter summary + action buttons)
- **Click filter indicator or "Edit Filters" button** → Opens Browse tab in right sidebar with editable filters
- **Click "+ Create New View" button** → Duplicates layer with current filters as new pinned entry
- **Click "Clear" button** → Removes all filters from the layer
- **Right sidebar shows:** Full filter breakdown, editable
- **User can rename** the distinguisher label with [✏️] button (accessible in expanded panel or right sidebar)

---

## A/B Testing Plan (SUPERSEDED — DFT-024 Resolution)

**Decision (Feb 4, 2026):** Icon-based approach adopted. A/B testing removed from implementation plans.

**Original plan (Jan 27, 2026):**
Include debug toggle (dev-only or settings) to switch between:

**Option A: Text-based**
```
│ 👁 Camera Traps (mt. lion)      ✕  │
│   • 5 filters                       │  ← second line
```

**Option B: Icon-based (adopted)**
```
│ 👁 Camera Traps (mt. lion)  [Filter 5] ✕ │  ← single line
```

Collect user feedback before finalizing.

---

## Design Principles

1. **Compact by default, details on demand** — Widget rows are concise; click for full breakdown
2. **Primary distinguisher visible** — Parenthetical shows what makes each view unique
3. **Editability signaled, not hidden** — Filter indicator is clickable; clicking opens filter UI
4. **Consistent mental model** — Widget → Right sidebar → Export builder all use same labels

---

## Invariants

| State | On Map | In Right Sidebar |
|-------|--------|------------------|
| Active + Unpinned | ✅ Visible | ✅ Visible |
| Active + Pinned | ✅ Visible | ✅ Visible |

**Rule:** Active = "I'm working with this" → always visible + shown in sidebar.

**Edge case:** Selecting a hidden pinned layer → auto-restores visibility (avoids "editing invisible layer" confusion).

---

## Why This Works

| User Intent | Action | Result |
|-------------|--------|--------|
| "I want to see what this layer looks like" | Click layer name in sidebar | Becomes Active Layer, visible on map |
| "I want to keep this layer for my session" | Click [📌] in Active section | Moves to Pinned, stays when exploring others |
| "I want to temporarily hide a pinned layer" | Click 👁 in widget | Hidden but still pinned (keeps filters) |
| "I want to see/manage this pinned layer" | Click layer row in widget | Expands panel with filter summary + actions |
| "I want to edit filters" | Click filter indicator or "Edit Filters" button | Opens Browse tab with editable filters |
| "I want a second view with different filters" | Click "+ Create New View" in expanded panel | Duplicates layer as new pinned entry |
| "I'm done with this layer" | Click [✕] | Removed from workspace |

---

## Comparison to Analogous UIs

| Pattern | Example | Lesson |
|---------|---------|--------|
| File explorer | Select file → opens. Select another → switches. | Users understand single selection |
| Photo apps | Click photo → edit it. Click another → switches focus. | No warning needed for replacement |
| Browser bookmarks | Browse without bookmarking. Save → persists. | Pin/bookmark distinction is familiar |

---

## What Changed from Original Mockup

### Before (Mockup 01)
```
│ [👁][📌] Earthquake Faults │  ← Two icons per layer
```

### After (Model C)
```
│   ● Earthquake Faults      │  ← Clean sidebar
```

**Widget handles everything:**
- Visibility states (active vs pinned)
- Filter indicators
- Pin/unpin actions

---

## Supporting DFT-013 (Multiple Views)

This design inherently supports multiple filtered views on the same layer (Trisalyn's predator-prey request):

```
│ 👁 ■ Camera Traps (mountain lion)  [Filter 5] ✕ │
│ 👁 ■ Camera Traps (deer)            [Filter 5] ✕ │
```

Each view:
- Has its own set of filters
- Can be toggled independently
- Shows on map simultaneously
- Exports as separate datasets

**How to create multiple views (DFT-003b resolution):**
1. Pin the layer with initial filter (e.g., "mountain lion")
2. Click the pinned layer row to expand it
3. Click **"+ Create New View"** button
4. A duplicate entry appears (e.g., `Camera Traps (View 2)`)
5. Edit filters on the new entry to change to "deer"
6. Both views now exist independently

---

## Documentation Updated

1. **Design Feedback Tracker** (`task-tracker.md`)
   - DFT-001 marked resolved with full decision rationale
   - DFT-003b marked resolved with expanded panel design (Feb 2, 2026)
   - DFT-024 marked resolved with icon-based filter indicator (Feb 4, 2026)
2. **Phase 0 Foundation** (`phases/phase-0-foundation.md`)
   - Task 0.2: Left sidebar design updated
   - Task 0.5: Widget design updated with full spec + icon-based filter indicator + expanded panel behavior
3. **Master Development Plan** (`master-development-plan.md`)
   - Cross-phase decisions updated
   - Change log updated

**Last updated:** February 2, 2026 (DFT-003b resolution added)

---

## Next Steps

1. **Mockup update:** Update `01-full-layout-overview.html` with Model C design
2. **Icon implementation:** Use Lucide `Filter` icon for filter indicators with tooltip and ARIA labels
3. **Development:** Use Phase 0 task 0.5 as implementation spec
4. **Team review:** Present to Amy/Trisalyn for sign-off before implementation

---

## Questions for Team

1. ~~Does the funnel emoji (🌪️) feel intuitive for "filters"?~~ *(Resolved: Icon-based approach with Lucide Filter icon)*
2. Should we prompt users to name views, or rely on auto-generated distinguishers?
3. Any concerns about auto-restoring visibility when selecting hidden pinned layers?

---

**Status:** Ready for implementation (pending team review)
