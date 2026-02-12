# Count Display Testing — Map Layers Widget

**Created:** February 11, 2026  
**Status:** Active testing feature  
**Purpose:** Test different approaches for displaying result counts in the Map Layers widget

---

## Overview

A temporary dropdown menu has been added to the Map Layers widget header to test different ways of displaying:
- **Filter counts** (how many filters are applied)
- **Result counts** (how many features match the filters)

This is a design-testing tool to help decide which approach provides the best user experience.

---

## How to Use

1. **Open the v2 app**: Navigate to `http://localhost:5173/?v2`
2. **Locate the settings icon**: In the Map Layers widget header (top-left floating widget), you'll see a gear/settings icon (⚙) next to the undo button
3. **Click the settings icon**: A dropdown menu will appear with 6 count display modes
4. **Select a mode**: Click any option to see how counts are displayed

---

## Available Modes

### 1. No Counts
- **Behavior:** Hides all counts (filter and result)
- **Use case:** Minimalist view for users who don't care about counts

### 2. Filter Count Only (Current Behavior)
- **Behavior:** Shows the number of active filters (e.g., "🔽 3")
- **Use case:** Tells you "how filtered" a layer is, but not the outcome
- **Location:** Collapsed row, next to layer name

### 3. Result Count (Collapsed)
- **Behavior:** Shows the number of features matching filters (e.g., "47 results")
- **Use case:** Answers "what did I get?" immediately in collapsed state
- **Location:** Collapsed row, next to layer name

### 4. Result Count (Expanded Only)
- **Behavior:** Shows result count only when row is expanded
- **Use case:** Keeps collapsed state clean; result count in expanded panel
- **Location:** Expanded panel, below divider (e.g., "47 results match your filters")

### 5. Result Count (Children)
- **Behavior:** Shows result count on child views only (nested structure)
- **Use case:** Focus on child-level results where filtering matters most
- **Location:** Child rows, collapsed and expanded states

### 6. Both (Test)
- **Behavior:** Shows both filter count AND result count side-by-side
- **Use case:** Comparison mode to see if both are valuable (likely too dense)
- **Location:** Collapsed row, both indicators next to layer name

---

## Mock Data

The following layers have mock result counts for testing:

| Layer | Result Count |
|-------|-------------|
| Camera Traps → mountain lion view | 47 |
| Camera Traps → deer view | 128 |
| iNaturalist Observations | 342 |
| Fire Perimeters | 8 |
| Water Level Sensors (Mar 2024) | 12 |

**Note:** These are hardcoded values for testing purposes. In production, these would come from actual map queries.

---

## What to Evaluate

When testing each mode, consider:

1. **Clarity:** Does the count answer the user's question?
2. **Density:** Is there too much information in limited space?
3. **Usefulness:** Which count is more valuable — filters (input) or results (output)?
4. **Scannability:** Can you quickly read the count without cognitive load?
5. **Space constraints:** Does the count cause layout issues with long layer names?

---

## Feedback Questions

- **Which mode feels most useful?**
- **Does showing result count help you understand what's on the map?**
- **Is filter count valuable, or is it just metadata?**
- **Does "Both (Test)" feel too cluttered?**
- **Do you prefer result count in collapsed state (immediate) or expanded state (clean)?**

---

## Implementation Notes

### Files Modified

- `src/v2/types/index.ts` — Added `CountDisplayMode` type
- `src/v2/components/FloatingWidgets/shared/CountDisplayDropdown.tsx` — New dropdown component
- `src/v2/components/FloatingWidgets/shared/WidgetHeader.tsx` — Added `customActions` prop
- `src/v2/components/FloatingWidgets/MapLayersWidget/MapLayersWidget.tsx` — Added dropdown state
- `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayersSection.tsx` — Pass mode through
- `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerRow.tsx` — Conditional rendering
- `src/v2/components/FloatingWidgets/MapLayersWidget/PinnedLayerChildRow.tsx` — Conditional rendering
- `src/v2/context/LayerContext.tsx` — Added mock result counts to initial data

### Temporary Code

This feature is **temporary** and designed for design testing. Once a decision is made:
1. Remove the `CountDisplayDropdown` component
2. Remove the `countDisplayMode` state and props
3. Implement the chosen approach directly in the components
4. Update documentation

---

## Related Documents

- `docs/PLANNING/feedback/meeting-notes/2026-02-11-ui-confusion-mapped-vs-saved.md` — User confusion about widgets
- `docs/PLANNING/component-specs/map-layers-widget.md` — Map Layers widget specification
- UI/UX review analyzing whether result counts improve usability

---

## Next Steps

1. **Test with stakeholders** (Amy, Trisalyn, Dan)
2. **Gather feedback** on which mode is most useful
3. **Make a decision** before Feb 20 deadline
4. **Implement chosen approach** and remove testing code
5. **Update documentation** with final design rationale
