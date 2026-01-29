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

**Widget job:** Show active layer + all pinned layers. Manage visibility and filters.

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

### Funnel Emoji: 🌪️

| State | Example | Meaning |
|-------|---------|---------|
| **With count** | `🌪️5` | 5 filters applied, clickable to edit |
| **No filters** | `🌪️` (gray) | No filters, clickable to add |

### Primary Distinguisher (Parenthetical)

Auto-generated label helps differentiate multiple views of the same layer:

```
│ 👁 Camera Traps (mt. lion)  🌪️5 ✕ │  ← species filter
│ 👁 Camera Traps (deer)      🌪️3 ✕ │  ← different species
│ 👁 iNaturalist (birds)      🌪️2 ✕ │  ← taxon filter
│ 👁 Fire Hazard (high risk)  🌪️1 ✕ │  ← severity filter
```

**Algorithm (priority order):**
1. Species/taxon filter (most distinctive)
2. Date range (if no species)
3. Spatial filter (if no date)
4. User-provided name (override)
5. "View 1", "View 2" (fallback)

### Clicking Behavior

- **Click funnel (🌪️) or layer name** → Opens Browse tab in right sidebar
- **Right sidebar shows:** Full filter breakdown, editable
- **User can rename** the distinguisher label with [✏️] button

---

## A/B Testing Plan

Include debug toggle (dev-only or settings) to switch between:

**Option A: Text-based**
```
│ 👁 Camera Traps (mt. lion)      ✕  │
│   • 5 filters                       │  ← second line
```

**Option B: Icon-based (recommended)**
```
│ 👁 Camera Traps (mt. lion)  🌪️5 ✕ │  ← single line
```

Collect user feedback before finalizing.

---

## Design Principles

1. **Compact by default, details on demand** — Widget rows are concise; click for full breakdown
2. **Primary distinguisher visible** — Parenthetical shows what makes each view unique
3. **Editability signaled, not hidden** — Funnel is clickable; clicking opens filter UI
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
| "I want to edit filters" | Click 🌪️ or layer name | Opens Browse tab with editable filters |
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
│ 👁 Camera Traps (mountain lion)  🌪️5 ✕ │
│ 👁 Camera Traps (deer)            🌪️5 ✕ │
```

Each view:
- Has its own set of filters
- Can be toggled independently
- Shows on map simultaneously
- Exports as separate datasets

---

## Documentation Updated

1. **Design Feedback Tracker** (`design-feedback-design-task-tracker.md`)
   - DFT-001 marked resolved with full decision rationale
2. **Phase 0 Foundation** (`phases/phase-0-foundation.md`)
   - Task 0.2: Left sidebar design updated
   - Task 0.5: Widget design updated with full spec + A/B testing note
3. **Master Development Plan** (`master-development-plan.md`)
   - Cross-phase decisions updated
   - Change log updated

---

## Next Steps

1. **Mockup update:** Update `01-full-layout-overview.html` with Model C design
2. **User testing:** Implement A/B toggle for filter representation feedback
3. **Development:** Use Phase 0 task 0.5 as implementation spec
4. **Team review:** Present to Amy/Trisalyn for sign-off before implementation

---

## Questions for Team

1. Does the funnel emoji (🌪️) feel intuitive for "filters"?
2. Should we prompt users to name views, or rely on auto-generated distinguishers?
3. Any concerns about auto-restoring visibility when selecting hidden pinned layers?

---

**Status:** Ready for implementation (pending team review)
