# Design Decision: Result Count Display

**Date:** February 11, 2026  
**Decision Maker:** Will (frontend lead)  
**Status:** ✅ Implemented  

---

## Decision

**Display result counts in expanded panel only, positioned after filter queries.**

### Selected Mode: "Result Count (Expanded)"

**Visual pattern:**

```
[COLLAPSED STATE]
┌────────────────────────────────────┐
│ 📌 Camera Traps (ANiML)            │ ← Clean, no count
└────────────────────────────────────┘

[EXPANDED STATE]
┌────────────────────────────────────┐
│ 📌 Camera Traps (ANiML)            │
├────────────────────────────────────┤
│ Filter queries:                    │
│ • species = Mountain Lion          │
│ • date > 2024-01-01                │
│ • confidence >= 80%                │
│ ────────────────────                │
│ 47 results match your filters      │ ← Count appears here
│                                    │
│ [+ New View]     [Edit Filters >]  │
└────────────────────────────────────┘
```

---

## Rationale

### Why Result Count (Not Filter Count)?

**Filter count = input** (how many filters applied)  
**Result count = output** (how many features returned)

Users care more about outcomes than process:
- ✅ "How many cameras match my filters?" → Result count answers this
- ❌ "How filtered is this layer?" → Filter count (less actionable)

### Why Expanded (Not Collapsed)?

**Collapsed:** Immediate information, but denser layout  
**Expanded:** Clean collapsed state, information in context

Advantages of expanded placement:
1. **Clean collapsed state** — Easier to scan layer list without visual noise
2. **Contextual display** — Result count appears alongside filter details (both outcome info)
3. **No space constraints** — Long layer names won't truncate from count badges
4. **Progressive disclosure** — Information revealed when user needs it
5. **Natural reading order** — User sees filters → result count → actions

### Why After Queries (Not Before)?

**Information hierarchy:**
1. What filters are applied? (input)
2. How many results did I get? (output)
3. What can I do? (actions: Clear, Edit Filters)

**Reading flow:** Filters → Result count → Actions feels natural.

---

## Design Principles Satisfied

### ✅ Nielsen #1: System Status Visibility
Result count shows outcome of filtering without requiring user to count map icons

### ✅ Nielsen #6: Recognition over Recall
User doesn't need to remember "was this 5 or 50 results?"

### ✅ Nielsen #8: Minimalism
Collapsed state stays clean; count only appears when layer details are expanded

### ✅ Progressive Disclosure (IA)
Essential info (layer name) immediately visible; result count on-demand

### ✅ Gestalt: Proximity
Result count grouped with filter details (both describe layer state)

---

## Rejected Alternatives

### ❌ No Counts
- **Why rejected:** Users lose outcome feedback, have to manually count map icons
- **When it's useful:** User doesn't care about counts (not common for filtered layers)

### ❌ Filter Count Only (Previous Behavior)
- **Why rejected:** Filter count is process metadata, not outcome data
- **When it's useful:** Debugging filter complexity (edge case)

### ❌ Result Count (Collapsed)
- **Why rejected:** Adds visual density, space constraints with long layer names
- **When it's useful:** User needs immediate count without expanding (less common)

### ❌ Result Count (Children Only)
- **Why rejected:** Inconsistent (parent layers also benefit from counts)
- **When it's useful:** Only nested structures matter (not true for this app)

### ❌ Both (Filter + Result)
- **Why rejected:** Too much information, cognitive overload
- **When it's useful:** Debugging/development (not end-user feature)

---

## Implementation Details

### Default Mode
- `countDisplayMode: 'results-expanded'` set as default in `MapLayersWidget.tsx`

### Count Position
- **Parent layers:** After filter queries, before action buttons
- **Child views:** After filter queries, before "Edit Filters" button
- **Visual separator:** Light gray border-top (`border-gray-100`) to distinguish result count from filters

### Data Source
- Mock counts for testing (hardcoded in `LayerContext.tsx`)
- Production: Real query results from map layer queries

### Styling
- Font size: `text-xs` (12px)
- Color: `text-gray-600` (readable, not too prominent)
- Weight: Bold number, regular text ("**47** results match your filters")

---

## Testing & Validation

### User Feedback
- **Tested with:** Will (designer), ready for Amy/Trisalyn/Dan
- **Feedback collected:** Expanded placement feels cleaner than collapsed
- **Concern addressed:** Position after queries (not before) improves information hierarchy

### Accessibility
- ✅ Sufficient color contrast (gray-600 on white)
- ✅ Screen reader friendly (semantic text)
- ✅ No motion/animation (static text)

---

## Future Enhancements

### When Real Data Available
1. Replace mock `resultCount` values with actual map query results
2. Update count when filters change (debounced)
3. Handle large counts (e.g., "1.2K results" for 1,234)
4. Handle zero results (e.g., "No results match your filters")

### Potential Improvements
- **Loading state:** Show "Counting..." while query runs
- **Performance:** Cache counts to avoid repeated queries
- **Interactivity:** Click count to zoom map to extent of results
- **Comparison:** Show count delta when adding/removing filters ("47 → 23")

---

## Cleanup Tasks

**Temporary code to remove (post-testing):**
- ✅ Keep `CountDisplayDropdown` for now (design testing still useful)
- ⏳ Once team validates, remove dropdown and unused modes
- ⏳ Simplify conditional rendering to only `results-expanded` logic
- ⏳ Archive design-testing docs to `docs/DESIGN-TESTING/archive/`

---

## Related Documents

- `docs/DESIGN-TESTING/count-display-testing.md` — Full testing documentation
- `docs/DESIGN-TESTING/count-display-visual-reference.md` — Visual mockups
- `docs/DESIGN-TESTING/implementation-summary.md` — Technical details
- `docs/development-task-tracker.md` — Task tracker (add this decision?)

---

## Commit Message Suggestion

```
feat(MapLayers): add result count display in expanded panel

- Show result count after filter queries in expanded view
- Default to 'results-expanded' mode for clean collapsed state
- Position count after queries for natural information hierarchy
- Add mock result counts for testing (47, 128, 342, 8, 12)
- Keep testing dropdown for stakeholder validation

Design rationale: Result count (outcome) more valuable than filter
count (process). Expanded placement keeps collapsed state clean while
providing outcome feedback in context with filter details.

Related: DFT-046 (Map Layers unified widget)
```

---

## Sign-off

**Decision approved by:** Will  
**Implementation date:** February 11, 2026  
**Status:** Live in v2 (default mode)  
**Next review:** After stakeholder feedback (Amy, Trisalyn, Dan)
