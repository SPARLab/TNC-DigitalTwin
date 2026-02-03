# DFT-016 Resolution Summary: Desktop-Only Scope

**Decision Date:** February 3, 2026  
**Status:** ✅ Resolved  
**Category:** Technical / UX  
**Priority:** Medium

---

## Decision

**The TNC Digital Catalog v2.0 is desktop-only with a minimum viewport width of 1280px.**

Mobile and tablet responsiveness are explicitly deferred to v2.1+ as optional enhancements.

---

## Specifics

| Aspect | Decision |
|--------|----------|
| **Minimum viewport width** | 1280px |
| **Below minimum behavior** | Show `DesktopOnlyGate` component with explicit "Desktop Required" message |
| **Mockup design width** | 1440px (standard desktop breakpoint) |
| **Mobile support** | Deferred to v2.1+ |
| **Tablet support** | Deferred to v2.1+ |
| **Target environment** | Desktop browsers, researchers at workstations |

---

## Rationale

### Design Theory Analysis

The decision was analyzed through multiple established design frameworks:

#### 1. Nielsen's Heuristics

**Visibility of system status + Recognition over recall:**
- The v2 paradigm relies on **simultaneous visibility** of related information:
  - Left sidebar: layer hierarchy and pin states
  - Right sidebar: details/browse/export for selected layer
  - Floating widgets: pinned layers and bookmarked features (persistent)
  - Map: spatial context
- On mobile, this would require **sequential disclosure** (hamburger menus, hidden panels)
- Users would need to **remember** what's pinned while navigating to filters, rather than **see** both simultaneously
- This directly violates Nielsen's "recognition over recall" principle

**Flexibility and efficiency of use:**
- Target audience (DFT-011): GIS-minded researchers = power users
- Power users benefit from information density
- Mobile's constrained viewport forces trading efficiency for simplicity
- This is the **opposite** of what the target audience needs

#### 2. Gestalt Principles

**Proximity + Common Region:**
- The design uses spatial proximity to show relationships:
  - Layer in left sidebar → details in right sidebar
  - Pinned layers → active filters in widget
- Breaking these into separate "screens" destroys the gestalt
- Widgets **must** float over the map because they represent **parallel** concerns (persistent selections) while sidebars represent **current** exploration context

#### 3. Norman's Principles

**Mapping:**
- Left-to-right flow (browse → select → examine details → export) maps to natural reading direction
- This spatial-positional mapping breaks on mobile

**Constraints:**
- Desktop constraints are **enabling** — fixed sidebars constrain where things live, making the system predictable
- Mobile would require dynamic constraints (panels that slide in/out), adding interaction overhead

### Practical Reality

**Interaction zone count:** The mockup (`02a-unified-layout.html`) contains at least **6 simultaneously-visible interaction zones**:
1. Left sidebar (layer browser with categories)
2. Map view
3. Pinned Layers widget
4. Bookmarked Features widget
5. Right sidebar header (current selection indicator)
6. Right sidebar tabs + content

**Data hierarchy depth:** The three-level data hierarchy (Layer → Feature → Related Data with filters) means users are doing **deep exploration** that benefits from stable UI landmarks.

**Tablet limitation:** Even on a 10" iPad, this would require significant UI compromise.

---

## Alignment with Project Context

### Target Audience (DFT-011)
- **Primary users:** Researchers (academic, TNC staff) at workstations
- **NOT field work:** Not targeting in-field data collection on mobile devices
- **Use case:** Desktop analysis, not mobile verification

### Existing Infrastructure
- `DesktopOnlyGate.tsx` component already exists
- This decision formalizes the threshold at 1280px (previously 1024px)

### Development Resources
- Avoids design-by-accident (inheriting responsive decisions not consciously made)
- Frees development resources to focus on core functionality
- Prevents scope creep during MVP development

---

## Edge Case Noted

**Field verification scenario:**  
If TNC researchers need to visit camera trap locations with a tablet to verify deployments, a **view-only mobile mode** could be added in v2.1+. This would show:
- Bookmarked locations on a simplified map
- Basic feature details
- No editing or filtering capabilities

This is explicitly deferred and would be treated as a separate feature request.

---

## Implementation Changes

### Files Updated

1. **`src/components/DesktopOnlyGate.tsx`**
   - Updated `MIN_DESKTOP_WIDTH` constant from 1024px to 1280px
   - Component already shows appropriate messaging below threshold

2. **`docs/planning-task-tracker.md`**
   - DFT-016 status changed to 🟢 Resolved
   - Full rationale documented

3. **`docs/master-plan.md`**
   - Added to UX Decisions table
   - Added to Change Log

4. **`docs/PLANNING/resolved-decisions/dft-016-resolution-summary.md`**
   - This document created

### Mockup Guidelines

All mockups should be designed at **1440px width** (standard desktop breakpoint).

No mobile or tablet breakpoint variants needed for v2.0.

---

## ✅ Verification Checklist

- [x] Resolution documented in `planning-task-tracker.md` with full rationale
- [x] Master plan updated in UX Decisions table
- [x] Master plan Change Log updated
- [x] `DesktopOnlyGate.tsx` updated to 1280px threshold
- [x] Resolution summary created (`dft-016-resolution-summary.md`)
- [x] Quick Reference table updated with resolved status
- [x] Discussion Items table updated with resolved status

---

## Related Decisions

- **DFT-011:** Target audience is researchers (GIS-minded), not broad public
- **DFT-015:** Empty state design (desktop-optimized patterns)
- **DFT-001:** Pin/visibility paradigm (requires simultaneous visibility of sidebar + widget)
- **DFT-013:** Multiple filtered views (nested widget structure benefits from desktop space)

---

## Future Considerations (v2.1+)

If mobile/tablet support is pursued in the future, consider:

1. **View-only mode** for field verification (read-only bookmarks on simplified map)
2. **Progressive Web App (PWA)** for offline capability
3. **Separate mobile interface** rather than responsive adaptation of desktop UI
4. **User research** with field staff to validate actual mobile needs

**Recommendation:** Treat mobile as a separate product with different workflows, not just a responsive version of the desktop interface.

---

**Resolved by:** Will + Claude  
**Sign-offs:** Will (design analysis)  
**Related Issues:** DFT-016  
**Next Steps:** Update any mockup generation tools to use 1440px as standard width
