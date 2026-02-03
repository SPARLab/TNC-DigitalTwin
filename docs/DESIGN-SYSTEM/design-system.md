# Design System - TNC Digital Catalog

**Last Updated:** February 3, 2026  
**Purpose:** Single source of truth for styling decisions, component patterns, and design policies that affect multiple phases.

---

## Icon Policy

### ❌ No Emojis Policy

**Policy:** Do not use emojis in the UI. Use SVG icons instead.

**Rationale:**
- Emojis render inconsistently across different browsers and operating systems
- SVG icons provide consistent visual appearance across all platforms
- SVG icons can be styled with CSS (color, size, etc.)
- SVG icons are more accessible and can be optimized for performance

**Implementation:**
- All icons must be SVG files stored in `src/components/icons/` or `public/icons/`
- Use React components for SVG icons (see existing examples: `DroneIcon.tsx`, `LidarIcon.tsx`)
- For icon libraries, prefer Lucide React (already in use) or similar SVG-based icon libraries
- When adding new icons, search for existing SVG icons first before creating custom ones

**Existing Icon Locations:**
- Component icons: `src/components/icons/`
- Data source icons: `src/utils/dataSourceIcons.tsx`
- Public assets: `public/icons/`

**For AI Agents:**
- When you encounter a need for an icon, automatically search for appropriate SVG icons
- Check existing icon components first (`src/components/icons/`, `src/utils/dataSourceIcons.tsx`)
- If no suitable icon exists, search for SVG icons from reputable sources (Lucide, Heroicons, etc.)
- Create a new icon component following the pattern of existing icons
- Never suggest or use emoji characters in code or UI

---

## Terminology Configuration

**Policy:** All UI terminology referencing the parent-child relationship (layers → features/items) must use a centralized config to allow team testing.

**Implementation:** `src/config/terminology.ts`

```typescript
// src/config/terminology.ts
export const TERMINOLOGY = {
  childNoun: "Feature",        // or "Item" — team toggle for testing
  childNounPlural: "Features", // or "Items"
  
  // Derived labels
  get pinnedWidgetTitle() { return `Pinned ${this.childNoun} Layers`; },
  get bookmarkedWidgetTitle() { return `Bookmarked ${this.childNounPlural}`; },
  
  // Empty state copy
  get pinnedEmptyFirstVisit() { return `Pin layers from the left sidebar to save them here.`; },
  get pinnedEmptyReturning() { return `Pinned layers appear here.`; },
  get bookmarkedEmptyFirstVisit() { 
    return `Bookmarks save specific ${this.childNounPlural.toLowerCase()} within layers (cameras, sensors, observations). Bookmark ${this.childNounPlural.toLowerCase()} from the right sidebar.`; 
  },
  get bookmarkedEmptyReturning() { return `Bookmarked ${this.childNounPlural.toLowerCase()} appear here.`; },
};
```

**Rationale:**
- "Feature" aligns with GIS terminology (Nielsen's "match between system and real world")
- "Item" is a fallback if team feedback suggests "feature" is confusing for non-GIS users
- Centralized config ensures consistency across all UI components
- Team can toggle between values during development without code changes

**Usage:**
- All widget titles, empty state messages, button labels, and tooltips must import from this config
- Never hardcode "Feature" or "Item" in UI components

---

## Empty State Patterns

**Policy (DFT-015):** All empty states follow a consistent pattern with differentiation between first-visit (educational) and returning-user (laconic) states.

### Visual Pattern

**Container:**
```css
.empty-state {
  @apply flex flex-col items-center justify-center text-center px-6 py-8;
}
```

**Design Tokens:**
| Element | Tailwind Classes |
|---------|------------------|
| Icon | `w-12 h-12 text-gray-300` |
| Title | `text-sm font-medium text-gray-700` |
| Body | `text-sm text-gray-500` |
| Action link | `text-sm text-emerald-600 hover:underline` |

**Tone:** Utilitarian (professional, no warmth or friendliness)

### First-Visit vs Returning User

| State | Behavior | Copy Length |
|-------|----------|-------------|
| First visit | Show expanded widget with educational copy | 2-3 sentences explaining what goes here and how |
| Returning (empty) | Show expanded widget with laconic copy | 1 sentence reminder |
| Collapsed | Header includes parenthetical hint | Short hint in parentheses |

### Tracking First Visit

- Use localStorage to track whether user has ever pinned a layer or bookmarked a feature
- Key: `hasEverPinnedLayer`, `hasEverBookmarkedFeature`
- First visit = key doesn't exist or is false
- Returning = key is true (even if currently empty)

### Widget-Specific Empty States

**Pinned Layers Widget:**
- First visit: "No layers pinned. Pin layers from the left sidebar to save them here."
- Returning: "Pinned layers appear here."
- Collapsed: "(pin layers from the left)"

**Bookmarked Features Widget:**
- First visit: "No {features/items} bookmarked. Bookmarks save specific {features/items} within layers (cameras, sensors, observations). Bookmark {features/items} from the right sidebar."
- Returning: "Bookmarked {features/items} appear here."
- Collapsed: "(bookmark {features} from the right)"

**Right Sidebar (no layer selected):**
- "Click any {feature/item} layer in the left sidebar to view its details here."

**Browse Tab (zero filter results):**
- Dynamic: "No {feature_label_plural} match your filters."
- Include suggestions specific to active filters
- Filters remain visible via UI controls

**DataOne Search (no results):**
- Echo search query
- Actionable suggestions
- "Clear Search" button

### Team Design Toggle

**Widget initial state is configurable:**
- Default: Expanded (educational)
- Option: Collapsed (with instructive header)
- Team can toggle to test both before finalizing

**Implementation:** Environment variable or localStorage flag (not user-facing in v2.0)

---

## Styling Decisions

> **Note:** This section tracks styling decisions that affect multiple phases. Component-specific styling should be documented in component files.

### Color Palette

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| Overall color palette | ⚪ TBD | - | Mockups use emojis/colors - need to tone down |
| Data source accent colors | ⚪ TBD | - | |

### Typography

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| Font system | ✅ Decided | - | See `docs/research_findings/typography-best-practices.md` |
| Responsive typography scale | ✅ Decided | - | See `docs/research_findings/typography-best-practices.md` |

### Spacing

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| 8-point grid system | ✅ Decided | - | See `docs/research_findings/spacing-best-practices.md` |
| Responsive spacing tokens | ✅ Decided | - | See `docs/research_findices/spacing-best-practices.md` |

### Components

| Component | Decision | Status | Date | Details |
|-----------|----------|--------|------|---------|
| Right sidebar header | ⚪ TBD | - | |
| Card component | ⚪ TBD | - | |

---

## Cross-Phase Patterns

### Widget Patterns

| Pattern | Status | Date | Details |
|---------|--------|------|---------|
| Widget card styling | ✅ Decided | - | See phase-0-foundation.md task 0.5 |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 3, 2026 | Added No Emojis Policy | Will |
| Feb 3, 2026 | Added Terminology Configuration (DFT-015) — configurable "Feature" vs "Item" terminology | Will + Claude |
| Feb 3, 2026 | Added Empty State Patterns (DFT-015) — visual pattern, first-visit vs returning user, widget-specific copy | Will + Claude |
