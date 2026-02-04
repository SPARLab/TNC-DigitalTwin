# DFT-021 Resolution Summary: "Active" vs "Selected" Layer Terminology

**Date:** February 4, 2026  
**Status:** ✅ Resolved  
**Decision:** Use "Active" terminology

---

## The Problem

Documentation and mockups used "active," "selected," and "working" layer terminology interchangeably, creating confusion in specs and acceptance criteria:
- "Active Layer" (widget section header in specs)
- "Selected Layer" (acceptance criteria)
- "Active non-pinned layer" (behavior description)
- "Currently selected layer from left sidebar"
- `.selected` CSS class in mockup code

**Core question:** Do these mean the same thing? If so, which term? If not, what's the distinction?

---

## The Solution: Use "Active" Terminology

### Terminology System

| State | Definition | Visual Indicator | Cardinality |
|-------|-----------|------------------|-------------|
| **Active** | Layer currently being inspected/worked with; displayed in right sidebar | Green border in left sidebar | ONE at a time |
| **Visible** | Rendered on map | Blue eye icon (ON state) | Multiple simultaneous |
| **Pinned** | Saved to widget with filters | Appears in widget, pin icon shown | Multiple simultaneous |
| **Expanded** | Pinned layer showing filter controls in widget | Expanded panel in widget | ONE at a time |

**Key distinction:** Active ≠ Visible

A layer can be:
- **Active but not visible** — User is inspecting attributes/data in right sidebar while map visibility is toggled OFF
- **Visible but not active** — Multiple layers showing on map, but only ONE is active (right sidebar context)

---

## Why "Active" Over "Selected"?

### User Mental Model (Norman's Conceptual Model)

**"Active" conveys functional working state:**
- Matches GIS mental model: "active layer" = layer receiving operations/queries
- Familiar from desktop metaphors: "active window" = in focus but may be minimized (not visible)
- Conveys "this is what I'm currently working with"

**"Selected" implies temporary UI highlight only:**
- Sounds like text selection (ephemeral)
- Doesn't capture "visibility can be toggled independently"
- Weaker semantic: "selected" doesn't convey "this is my working context"

### Real-World Scenarios

**Scenario 1:** User toggles OFF visibility of active layer to reduce map clutter while still inspecting its data table
- ✅ "Active but hidden" makes sense
- ❌ "Selected but hidden" sounds contradictory

**Scenario 2:** User has 3 pinned layers visible on map, clicks one to inspect
- ✅ "Earthquake Faults is now the active layer" (one is in focus)
- ❌ "Earthquake Faults is now the selected layer" (ambiguous with multi-select)

---

## Key Behaviors

### Clicking a Layer in Left Sidebar
**Action:** User clicks layer row in left sidebar

**Result:**
1. Layer becomes **active** (green border, right sidebar updates)
2. Layer becomes **visible** (eye icon turns blue, renders on map)
   - If previously hidden, visibility is automatically restored
   - Rationale: Clicking implies "I want to work with this," which includes seeing it

**Visual feedback:** Brief blue pulse on eye icon to signal auto-restore (if applicable)

### Visibility Toggle Independence
**Action:** User clicks eye icon on active layer

**Result:**
- Layer remains **active** (right sidebar still shows its data)
- Layer becomes **hidden** (removed from map, eye icon gray)

**Rationale:** User may want to inspect data/attributes without map visual clutter

---

## Implementation Updates Required

### Code Changes (mockups & production)

**CSS classes:**
```css
/* Before */
.layer-row.selected { ... }

/* After */
.layer-row.active { ... }
```

**JavaScript state:**
```javascript
// Before
state.selectedLayer = layerId;

// After
state.activeLayer = layerId;
```

**Functions:**
```javascript
// Before
function selectLayer(layerId) { ... }

// After  
function activateLayer(layerId) { ... }
```

### Documentation Updates

**Replace throughout specs:**
- "Selected layer" → "Active layer"
- "Currently selected" → "Currently active"
- "Select a layer" → "Activate a layer" (or "Click a layer to make it active")

**Retain "selected" only for:**
- Multi-select contexts (e.g., "Select multiple bookmarks to export")
- Generic UI patterns not specific to layers

---

## Widget Design Note: Expanded Hit Targets

**Related concern:** Eye icon click targets must be large enough to prevent accidental row activation.

**Problem:** When toggling visibility of multiple layers quickly, users may miss the small eye icon and accidentally activate the wrong layer.

**Solution:** Expand hit area around eye icon
- Visual icon: ~16px × 16px
- **Hit target:** ~32-40px × 32-40px (generous padding)
- Hover state indicates "you're about to toggle visibility" (e.g., light blue background)

**Layout recommendation:**
```
┌──────┬──────────────────────────────┬──────┐
│  👁  │  Fire Hazard (3 filters)     │  ✕   │
│ 40px │  Activates layer on click    │ 28px │
└──────┴──────────────────────────────┴──────┘
   ↑                ↑                    ↑
Eye column    Name area (click       Remove
(entire        to activate)           button
column is
clickable)
```

**Distinct hover states:**
- Eye column: Theme-appropriate background (e.g., light blue)
- Name area: Theme-appropriate background (e.g., light green)
- Remove button: Theme-appropriate background (e.g., light red)

**Note:** Exact colors/styling deferred for theming flexibility. Core principle: **Generous hit areas + clear hover signifiers.**

---

## Cross-References

**Related decisions:**
- **DFT-001:** Pin vs toggle behavior (established pinned layer model)
- **DFT-013:** Multiple filtered views (pinned layers with distinct queries)
- **DFT-019:** Edit Filters navigation (active layer context preserved)

**Affects these specs:**
- `phase-0-foundation.md` (widget behavior)
- `phase-1-inaturalist.md` (activation logic)
- Mockup `02a-unified-layout.html` (CSS/JS implementation)

---

## Summary

**Decision:** Use **"Active"** for layer working state.

**Rationale:**
1. ✅ Conveys functional state, not just UI selection
2. ✅ Matches GIS mental model ("active layer" is industry term)
3. ✅ Supports "active but not visible" scenario
4. ✅ Clearer semantics than "selected" for single-focus context

**Next steps:**
- Update all specs to use "active layer" terminology
- Rename CSS classes and JS functions in mockup
- Apply to production code when building Phase 0

**Approved by:** Will  
**Date:** February 4, 2026
