# DFT-034 Resolution Summary: Drag-and-Drop Reorder Feedback

**Date:** February 5, 2026  
**Status:** ✅ Resolved  
**Decision:** Enhanced lifted row + drop line + settle animation with keyboard support

---

## The Problem

Per Phase 0, pinned layers have drag handles for reordering. Reordering affects map layer z-order (stacking order), which is critical for GIS workflows—researchers need points visible over polygons, or specific datasets prioritized for visual analysis.

**Questions to Resolve:**
1. What visual feedback during drag?
2. How to indicate drop target?
3. What animation on drop?
4. How to communicate map z-order changes?
5. Keyboard accessibility?

---

## The Solution: Enhanced Visual Feedback + Keyboard Support

### Design Specification

#### 1. Drag Handle & Cursor
- **Icon:** `⋮⋮` (6 dots in 2 columns, Lucide `GripVertical`)
- **Hover:** `cursor: grab`, color shift from `#94a3b8` to `#64748b`
- **Active drag:** `cursor: grabbing`
- **ARIA:** `aria-label="Drag to reorder layer. Use arrow keys to move up or down."`

#### 2. Dragged Row Visual Treatment (Enhanced)

```css
.widget-layer-card.dragging {
  opacity: 0.6;                               /* Increased from 0.5 */
  transform: scale(0.95) rotate(2deg);        /* More noticeable + tilt */
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.3);  /* Stronger elevation */
  cursor: grabbing;
  border: 2px dashed #3b82f6;                 /* Dashed = "in motion" */
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.dragging {
    transform: scale(0.95);  /* No rotation */
  }
}
```

**Rationale:**
- 95% scale (not 98%) for clearer lift (Gestalt Figure-Ground)
- 2deg rotation adds dynamism, mimics physical paper
- Dashed border adds texture, signals temporary state
- Respects `prefers-reduced-motion` (no rotation if enabled)

#### 3. Drop Target Indicator (Refined)

```css
.widget-layer-card.drag-over {
  border-top: 4px solid #3b82f6;              /* Increased from 2px */
  margin-top: -4px;
  background-color: rgba(59, 130, 246, 0.05); /* Subtle highlight */
}

.widget-layer-card.drag-over-bottom {
  border-bottom: 4px solid #3b82f6;
  margin-bottom: -4px;
  background-color: rgba(59, 130, 246, 0.05);
}
```

**Rationale:**
- 4px line meets WCAG contrast requirements (Perceivable)
- Background highlight double-encodes drop zone (Gestalt redundancy)
- Margin offset prevents layout shift

#### 4. Drop Animation (New)

```css
.widget-layer-card.just-dropped {
  animation: settle 400ms ease-out;
  background-color: #dcfce7;  /* Green = success */
}

@keyframes settle {
  0% { transform: scale(1.02); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.just-dropped {
    animation: none;
    background-color: #dcfce7;
  }
}
```

**Rationale:**
- 400ms aligns with DFT-031 undo button pulse (consistency)
- Green highlight = positive closure (Peak-End Rule)
- Subtle bounce mimics physical settling
- Respects `prefers-reduced-motion`

#### 5. Map Z-Order Feedback

**Approach:** Toast notification (non-intrusive, educational)

```javascript
function updateMapLayerOrder(layerIds, { animate = false }) {
  // Update ArcGIS map layer order...
  
  // Show brief toast
  showToast({
    message: "Map layer order updated",
    duration: 2000,           // Brief, auto-dismiss
    position: "bottom-center" // Near map
  });
}
```

**Rationale:**
- Educates users that widget order = map rendering order (Norman Conceptual Model)
- Non-intrusive (fades after 2s, no permanent visual noise)
- Bottom-center placement near map (Gestalt Proximity)

#### 6. Keyboard Support (WCAG 2.1.1 Compliance)

**Arrow keys (up/down):** Move layer up or down one position  
**Shift+Home:** Move to top  
**Shift+End:** Move to bottom

**ARIA Live Region:** Announces position changes for screen readers

**Rationale:**
- Arrow keys intuitive for vertical reordering (Mental Models)
- Shift+Home/End for quick repositioning (power user feature)
- Announces position for screen reader users (WCAG Perceivable)
- Maintains focus after reorder (Nielsen #3: User Control)
- **Keyboard support essential for v2.0** (not deferred to Phase 6)

#### 7. Edge Cases

**Rapid reorders:**
- Debounce map updates by 300ms (per DFT-025 pattern)
- Widget updates instantly, map follows with slight delay
- Prevents thrashing during rapid sequential drags

**Invalid drop (outside widget):**
- Card snaps back to origin position
- Brief shake animation (2px, 2 cycles) to signal "invalid"

**Single pinned layer:**
- Hide drag handles when only 1 layer pinned
- Nothing to reorder → reduces UI clutter (Aesthetic Minimalism)

---

## Summary Specification Table

| Element | Treatment | Duration | Rationale |
|---------|-----------|----------|-----------|
| **Drag Handle** | `⋮⋮` icon, `grab` cursor | — | Universal convention (Norman) |
| **Drag Start** | 60% opacity, 95% scale, 2deg rotation, dashed border, elevated shadow | — | Clear lift (Gestalt Figure-Ground) |
| **Drop Target** | 4px blue line + subtle background highlight | — | Dual encoding (Gestalt redundancy) |
| **Drop Animation** | Green highlight + subtle scale bounce | 400ms `ease-out` | Positive closure (Peak-End Rule) |
| **Map Feedback** | Toast: "Map layer order updated" | 2s auto-dismiss | Educates users (Norman Conceptual Model) |
| **Keyboard** | Arrow keys (up/down), Shift+Home/End | — | WCAG 2.1.1 compliance |
| **ARIA** | Live region announces position changes | — | Screen reader support |
| **Reduced Motion** | No rotation/bounce, instant change + highlight | — | Accessibility (WCAG) |

---

## Design Principles Applied

**Analyzed through 9 UI/UX frameworks:**

1. **Gestalt (Perception):** Figure-ground separation via lifted row, continuity via drop line, common fate (dragged row + cursor move together)

2. **Norman (Interaction):** Affordances (drag handle signals draggability), signifiers (cursor changes), feedback (visual state changes + toast), mappings (spatial layout matches z-order mental model)

3. **Nielsen (Usability):** Visibility of system status (#1), user control & freedom (#3), consistency & standards (#4), recognition over recall (#6)

4. **Cognitive Science:** Fitts's Law (small drag handle prevents accidental drags), feedback timing (<100ms instant, 400ms animation), Von Restorff Effect (dragged row stands out)

5. **Visual Fundamentals:** Contrast (opacity, color), hierarchy (elevated shadow), balance (scale + rotation suggests "lifted")

6. **Accessibility (WCAG):** Keyboard navigation (WCAG 2.1.1), ARIA announcements (Perceivable), 4px line contrast (Perceivable), reduced motion support

7. **Behavioral Science:** Loss aversion addressed by undo button (DFT-031), feedback loop rewards completion, perceived control via precise targeting

8. **Information Architecture:** Mental model (researchers understand layer stacking from GIS software), wayfinding (drop line shows destination)

9. **Motion & Time:** Duration (400ms aligns with DFT-025, DFT-031), easing (`ease-out` for settling), continuity (smooth transition), reduced motion respected

---

## Tradeoffs

**What we sacrifice:**
- Ghost placeholder pattern (more visually rich but adds complexity)
- Swap animation (adjacent rows animate aside—more tactile but increases motion complexity)
- Live z-order preview (map updates during drag—impressive but computationally expensive)
- Permanent z-order badges (position numbers—constant feedback but clutters widget)

**Why acceptable:**
- Target audience (researchers) values **efficiency over ornamentation** (DFT-011)
- Aligns with animation timing standards (DFT-025: 250-400ms, DFT-028: 300ms stagger)
- Respects **aesthetic minimalism** (Nielsen #8) while meeting **visibility** (Nielsen #1)
- Preserves **fast workflow** (no confirmation per DFT-031)

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-034 marked resolved
   - Full specification documented

2. **Phase 0** (`docs/IMPLEMENTATION/phases/phase-0-foundation.md`)
   - Task 0.5 acceptance criteria updated
   - Drag-and-drop patterns specified

3. **Design System** (`docs/DESIGN-SYSTEM/design-system.md`)
   - Drag-and-drop patterns documented

4. **Master Plan** (`docs/master-plan.md`)
   - Added to Cross-Phase Decisions → UX Decisions table

5. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-034-resolution-summary.md`

---

## Next Steps

**For implementation (Phase 0, Task 0.5):**
1. Implement drag handle with `GripVertical` icon
2. Add CSS for `.dragging`, `.drag-over`, `.just-dropped` states
3. Implement drop animation (400ms settle)
4. Add toast notification for map z-order updates
5. Implement keyboard support (arrow keys, Shift+Home/End)
6. Add ARIA live region for screen reader announcements
7. Handle edge cases (rapid reorders, invalid drops, single layer)

**For testing:**
- Test with keyboard-only navigation
- Test with screen reader
- Test with `prefers-reduced-motion` enabled
- Verify map z-order updates correctly

---

**Status:** Ready for implementation (Phase 0, Task 0.5)
