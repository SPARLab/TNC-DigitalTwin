# Mockups Changelog

This document tracks all mockup versions and the design decisions that drove each iteration.

---

## How to Use This File

1. **Create new version** when implementing resolved feedback items
2. **Link to DFT items** that drove the changes
3. **Save mockup with version number** (e.g., `01-layout-v2.1.html`)
4. **Don't overwrite** previous versions (allows comparison)

---

## Version History

### v2.1 - January 27, 2026 [PLANNED]

**Mockup:** `mockups/01-full-layout-overview-v2.1.html` (to be created)

**Status:** 🟡 Design finalized, mockup not yet updated

**Major Changes:**
- **DFT-001 Resolved:** Pin vs visibility behavior
  - Removed eyeball icon from left sidebar
  - Added "Active Layer" section to floating widget
  - Added "Pinned Layers" section (separate from active)
  - Selection indicator (●) shows active layer in sidebar
- **Filter indicators:** Added funnel emoji (🌪️) with count
- **Primary distinguisher:** Auto-generated labels in parentheses (e.g., "Camera Traps (mt. lion)")
- **Clean layout:** Widget owns all state, sidebar is navigation only

**Design Decisions:**
- Model C adopted (selection = active, pin separate)
- No helper text in widget (behavior is learnable)
- Funnel emoji for filters (vs text "N filters")
- Gray funnel indicates "no filters yet, but you can add"

**Feedback Items Addressed:**
- DFT-001: Pin vs. Toggle Visibility Behavior

**Files Updated:**
- `docs/00-design-iteration/feedback/design-task-tracker.md`
- `docs/00-design-iteration/feedback/resolved/dft-001-resolution-summary.md`
- `docs/01-implementation-plan/phases/phase-0-foundation.md`
- `docs/01-implementation-plan/master-development-plan.md`

---

### v2.0 - January 23, 2026

**Mockup:** `mockups/02a-unified-layout.html`

**Status:** ✅ Complete (superseded by v2.1)

**Major Changes:**
- Initial v2 paradigm shift
- Left sidebar: Persistent layer browser
- Right sidebar: Layer workspace (browse, query, export)
- Floating widgets: Pinned Layers + Bookmarked Features
- Three-level hierarchy: Layer → Feature → Related Data

**Design Decisions:**
- Pin (layers) vs Bookmark (features) distinction
- Left/right sidebar split for separate concerns
- Floating widgets always visible over map

**Feedback Items:**
- Initial paradigm approved by team (Dan, Trisalyn, Amy, Sophia)

**Files Created:**
- `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Multiple mockup files: 02a through 02f

---

### v1.0 - [Prior to Jan 23, 2026]

**Mockup:** `mockups/01-full-layout-overview.html` (original)

**Status:** ✅ Archived (v1 paradigm)

**Description:**
- Original mockup with layer browser + pin/visibility behavior
- Single floating "Map Layers" widget
- Eyeball icon for visibility, pin icon for saving

**Feedback:**
- Confusion between eyeball and pin (Sophia, Jan 23)
- Led to v2.0 paradigm redesign

---

## Template for New Versions

Copy this when adding a new version:

```markdown
### vX.X - Month DD, YYYY

**Mockup:** `mockups/[filename]`

**Status:** 🟡 In Progress | ✅ Complete | ⚪ Planned

**Major Changes:**
- [Change 1]
- [Change 2]
- [Change 3]

**Design Decisions:**
- [Decision 1 with rationale]
- [Decision 2 with rationale]

**Feedback Items Addressed:**
- DFT-XXX: [Title]
- DFT-YYY: [Title]

**Files Updated:**
- [List documentation files that were updated]

---
```

---

## Versioning Strategy

### Major Version (v2.0 → v3.0)
- Paradigm shift (e.g., v1 → v2 sidebar split)
- Complete redesign of a major section
- Breaking changes to user mental model

### Minor Version (v2.0 → v2.1)
- Resolved feedback items that change UX
- New sections or patterns added
- Refinements to existing components

### Patch (not used for mockups)
- For code, not design mockups

---

## Comparison Views

When presenting to team, create comparison views:

```html
<!-- Example: side-by-side comparison -->
<div style="display: flex; gap: 20px;">
  <iframe src="mockups/01-layout-v2.html" width="50%"></iframe>
  <iframe src="mockups/01-layout-v2.1.html" width="50%"></iframe>
</div>
```

Or link to both versions in meeting notes.

---

**Last Updated:** January 28, 2026
