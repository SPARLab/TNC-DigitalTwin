# DFT-033 Resolution Summary: Right Sidebar Width and Resizability

**Date:** February 5, 2026  
**Status:** ✅ Resolved  
**Decision:** Fixed width at 400px (not resizable)

---

## The Problem

The right sidebar appears in Browse tabs across all data sources (iNaturalist, ANiML, Dendra, DataOne). The question: should it be fixed width or resizable? What width accommodates different content types (image grids, time-series charts, text metadata)?

**Key Considerations:**
- Image grids (ANiML) benefit from wider sidebar
- Time-series charts (Dendra) benefit from wider sidebar
- Text metadata (iNaturalist) works fine with narrower sidebar
- Map needs to remain usable with sidebar open

---

## The Solution: Fixed Width at 400px

### Decision

**Fixed width at 400px (not resizable)**

**Core Principle:** The user's job is to analyze conservation data, not configure the interface.

### Why 400px

- Wide enough for 4-column image grids (ANiML)
- Wide enough for readable time-series charts (Dendra)
- Wide enough for metadata without excessive line wrapping (iNaturalist)
- Narrow enough to leave 60%+ of screen for map (at 1440px mockup width)
- Matches established GIS UI patterns (ArcGIS Online, QGIS)

### Why Not Resizable

**Key Findings from Framework Analysis:**

1. **Cognitive Load (Hick's Law):** Resizability adds micro-decisions that distract from primary task. Every UI adjustment forces users to ask "Is this too wide? Should I adjust it?" — cognitive overhead with no clear user need.

2. **Consistency & Spatial Memory (Nielsen #4):** Fixed width creates predictable spatial memory. Users know "where" content appears and "how much" map they'll lose when sidebar opens. Resizable introduces session-to-session variability.

3. **Simplicity Serves Task (Aesthetic Minimalism):** No evidence in user feedback that researchers want to fiddle with sidebar width. Resizable handles add visual noise and implementation complexity for questionable UX value.

4. **GIS Convention Alignment (Mental Models):** ArcGIS Online and QGIS use fixed sidebars. Matching this convention reduces learning curve for target audience (GIS-minded researchers).

5. **Accessibility (WCAG - Operable):** Resizable sidebars require precise mouse control (dragging edges), harder for motor impairments. Fixed width = keyboard-friendly.

6. **Engineering Efficiency:** Fixed width means content can be designed for a specific grid (e.g., 4-column image grid at 400px). Resizable requires responsive breakpoints for every Browse view, adding complexity without user value.

---

## Handling Edge Cases

**If specific content genuinely needs more space (e.g., Dendra chart):**
- Add **"Expand Chart"** button that pops out into modal/overlay
- This gives flexibility without introducing persistent UI configuration burden

---

## Optional Enhancement (Not Required for v2.0)

Consider a **collapse toggle** (hide sidebar entirely, maximize map) as a binary state (open/closed), not continuous adjustment. Simpler to implement, no drag handles, clear affordance.

---

## Design Principles Applied

**Analyzed through 9 UI/UX frameworks:**

1. **Gestalt:** Consistency creates predictable spatial relationships
2. **Norman:** Fixed width = clear affordance, no ambiguous controls
3. **Nielsen #4:** Consistency & standards — matches GIS conventions
4. **Cognitive Science:** Hick's Law — fewer decisions = faster workflow
5. **Visual Fundamentals:** Predictable layout enables optimized content design
6. **Accessibility (WCAG):** Fixed width = keyboard-friendly, no precise mouse control needed
7. **Behavioral Science:** Simplicity reduces cognitive load
8. **Information Architecture:** Predictable layout aids wayfinding
9. **Motion & Time:** No animation needed for resize = simpler implementation

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-033 marked resolved
   - Full decision rationale added

2. **Master Plan** (`docs/master-plan.md`)
   - Added to Cross-Phase Decisions → UX Decisions table
   - Change log updated

3. **Phase Documents** (`docs/IMPLEMENTATION/phases/`)
   - All phases with right sidebar implementations reviewed
   - 400px width specification noted

4. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-033-resolution-summary.md`

---

## Next Steps

**For implementation:**
- Apply 400px fixed width to all right sidebar implementations
- Design content layouts (image grids, charts, metadata) for 400px constraint
- Consider "Expand Chart" pattern for edge cases requiring more space
- Optional: Add collapse toggle (binary open/closed state)

**For mockup generation (DFT-037):**
- Use 400px width in all Browse tab mockups
- Verify image grids, charts, and metadata layouts work at this width

---

**Status:** Ready for implementation (affects all phases with right sidebar)
