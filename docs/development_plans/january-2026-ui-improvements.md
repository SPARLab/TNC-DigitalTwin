# January 2026 UI Improvements Development Plan

**Created:** January 13, 2026  
**Status:** Ready for Implementation  
**Owner:** Team

---

## Context Summary

> **Read this first!** This section summarizes key decisions made during planning.

### Design Philosophy
This is a **data-dense application** — we optimize for **maximum information per screen**, not reading comfort. Users can zoom (`Cmd +`) if needed.

### Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Target audience** | Desktop users only | Data catalog for researchers, not casual mobile browsing |
| **Minimum width** | 1024px | Below this, show "Desktop Required" message |
| **Font size priority** | Information density > readability | Smaller fonts (12-13px body) to fit more data |
| **Responsive approach** | Compact cards on laptops, full cards on desktops | Adaptive density based on screen size |
| **Consistency** | All 11 data sources use same tokens | Single design system for everything |

### Supported Breakpoints
| Breakpoint | Width | Experience | Card Mode |
|------------|-------|------------|-----------|
| `lg` | 1024–1279px | Compact (laptops with scaling) | Compact — no descriptions |
| `xl` | 1280–1439px | Standard (default laptops) | Standard — 1 line description |
| `2xl` | ≥1440px | Full (desktops, monitors) | Full — 2 line description |
| `<1024px` | — | **Blocked** | "Desktop Required" message |

### Primary Reference
📄 **`docs/design-system/DESIGN_SYSTEM.md`** — Contains all token specifications, values, and usage examples.

---

## Overview

This development plan addresses responsive design issues, establishes a consistent design system, and improves the overall user experience across the Dangermond Preserve Data Catalog.

**11 Data Sources:** ArcGIS, iNaturalist, eBird, CalFlora, Animl, Dendra, LiDAR, Drone Imagery, DataONE, MODIS (planned), GBIF (planned)

---

## Task Execution Checklist

**Tasks are numbered in execution order. Check off as completed.**

### Phase 1: Foundation
- [x] **Task 1** — Organize root directory files (🟡 MEDIUM)
- [x] **Task 2** — Research industry best practices for typography/spacing (🔵 RESEARCH) ✅ COMPLETE
- [ ] **Task 2a** — Implement "Desktop Required" gate for small screens (🔴 HIGH)
- [ ] **Task 3** — ⚡ **MIGRATE ENTIRE APP TO DESIGN SYSTEM** (🔴 HIGH) ⚡
- [ ] **Task 4** — Document design system usage patterns (🟡 MEDIUM)

### Phase 2: Polish & Fixes (Post-Migration)
- [ ] **Task 5** — Fix header and subheader height consistency (🟡 MEDIUM)
- [ ] **Task 6** — Locate and update Footer component (🟡 MEDIUM)
- [ ] **Task 7** — Align left sidebar with subheader (🟡 MEDIUM)
- [ ] **Task 8** — Fix Clear Filters button alignment (🟡 MEDIUM)
- [ ] **Task 9** — Scale map legends for screen sizes (🟡 MEDIUM)

### Phase 3: Data Source Refinements
- [ ] **Task 10** — Fix ArcGIS card sizing (🟡 MEDIUM)
- [ ] **Task 11** — Fix Dendra card margins (🟡 MEDIUM)
- [ ] **Task 12** — Replace Dendra "Christmas tree" icons (🟡 MEDIUM)
- [ ] **Task 13** — eBird image loading improvements (🟡 MEDIUM - Backend)

### Phase 4: Progressive Disclosure
- [ ] **Task 14** — Identify eye icon locations (🟡 MEDIUM)
- [ ] **Task 15** — Implement tooltip solution (🟡 MEDIUM)
- [ ] **Task 16** — Add hover tooltips for eye icons (🟡 MEDIUM)

### Phase 5: Research & Documentation
- [ ] **Task 17** — Research ArcGIS tags formatting (🟢 LOW)
- [ ] **Task 18** — Create documentation index (🟢 LOW)
- [ ] **Task 19** — Document responsive design patterns (🟢 LOW)

### Testing & Validation (Ongoing)
- [ ] Verify "Desktop Required" message appears below 1024px
- [ ] Test at 1024px (lg — minimum supported, compact mode)
- [ ] Test at 1280px (xl — standard laptop)
- [ ] Test at 1440px (2xl — desktop threshold)
- [ ] Test at 1512px (14" MacBook Pro default)
- [ ] Test at 1920px+ (Full HD monitor)
- [ ] Test in Chrome, Firefox, Safari
- [ ] Verify all 11 data sources use consistent styling

---

## Priority Legend

- **🔴 HIGH:** Critical for responsive functionality and user experience
- **🟡 MEDIUM:** Important improvements that enhance usability
- **🟢 LOW:** Nice-to-have enhancements for future consideration
- **🔵 RESEARCH:** Requires investigation and decision-making

---

## Task Details

### Task 1 — Organize Root Directory Files (🟡 MEDIUM)
**Goal:** Clean up messy root directory with scattered documentation and scripts

**Files to Organize:**

Move to `docs/` subdirectories:
- [ ] `ANIML_CONTEXT_PROMPT.txt` → `docs/animl-optimization/`
- [ ] `ANIML_TESTING_START_HERE.md` → `docs/animl-optimization/`
- [ ] `CSV_INTEGRATION_SUMMARY.md` → `docs/data_sources/`
- [ ] `EBIRD_QUERY_DEBUGGING.md` → `docs/debug_prompts/`
- [ ] `GROUP_BY_VS_MEMORY_EXPLAINED.md` → `docs/archive/`

Move to `scripts/one-off/`:
- [ ] `check-hubpage-urls.js`
- [ ] `explore-hub.js`
- [ ] `investigate-documents.js`
- [ ] `test-animl-queries.html` (or delete if obsolete)
- [ ] `test-hub-urls.html` (or delete if obsolete)

**Tasks:**
- [ ] Create directory structure: `docs/archive/`, `scripts/one-off/`
- [ ] Move files to appropriate locations
- [ ] Update any broken links in documentation

---

### Task 2 — Research Industry Best Practices (🔵 RESEARCH) ✅ COMPLETE
**Goal:** Establish evidence-based responsive design standards

**Status:** COMPLETE - Pivoted from consumer app standards to data-dense app standards

**Deliverables Created:**
- ✅ `docs/research_findings/typography-best-practices.md` — Industry standards from Material Design, Apple HIG, IBM Carbon
- ✅ `docs/research_findings/spacing-best-practices.md` — 8-point grid, touch targets, responsive compression
- ✅ `docs/research_findings/design-system-research-summary.md` — Executive summary
- ✅ `docs/design-system/DESIGN_SYSTEM.md` — **Primary reference** for implementation

**Implementation Notes:**
- Initial research focused on consumer app best practices (14-16px body text)
- After reviewing actual app usage on 14" MacBook, pivoted to data-dense approach
- **Key decision:** Optimize for information density, not readability comfort
- **Key decision:** Desktop-only (≥1024px), show blocking message on smaller screens
- Current font usage: 49% text-sm (14px), 38% text-xs (12px), only 6% semantic tokens
- Recommended: Smaller fonts (13px body, 12px labels), compact cards on laptops

---

### Task 2a — Implement "Desktop Required" Gate (🔴 HIGH)
**Goal:** Block access on screens <1024px with a friendly message

**Tasks:**
- [ ] Create `DesktopOnlyGate` component
- [ ] Wrap app in gate component
- [ ] Test at various viewport sizes
- [ ] Ensure message is accessible and professional

**Technical Approach:**
```tsx
// src/components/DesktopOnlyGate.tsx
import { useState, useEffect } from 'react';

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!isDesktop) {
    return <DesktopRequiredMessage />;
  }

  return <>{children}</>;
}
```

**Message Content (from DESIGN_SYSTEM.md):**
```
🖥️ Desktop Required

The Dangermond Preserve Data Catalog is optimized for desktop browsers.

Please visit on a laptop or desktop computer for the best experience.

Minimum supported width: 1024px

Tip: If you're on a laptop, try reducing your display scaling or browser zoom level.
```

**Files to Create/Modify:**
- `src/components/DesktopOnlyGate.tsx` (new)
- `src/App.tsx` (wrap with gate)

**Reference:** See `docs/design-system/DESIGN_SYSTEM.md` § Mobile/Tablet Blocking

---

### Task 3 — ⚡ MIGRATE ENTIRE APP TO DESIGN SYSTEM (🔴 HIGH) ⚡

**Goal:** Update the ENTIRE application to use the new design system tokens in one comprehensive sweep.

**Philosophy:** Do it all at once. If things look wonky, we iterate in Phase 2. Consistency across all 11 data sources is the priority.

**Reference:** `docs/design-system/DESIGN_SYSTEM.md` contains all token specifications.

---

#### Implementation Tips

> **Before starting:**
> 1. Read `docs/design-system/DESIGN_SYSTEM.md` thoroughly
> 2. Ensure dev server is running (`npm run dev`)
> 3. Open browser DevTools and test at 1024px, 1280px, and 1440px as you go
>
> **Approach:**
> 1. Start with `tailwind.config.js` — get all tokens in place first
> 2. Then work through components systematically (Header → FilterSubheader → Sidebars → Cards)
> 3. Test at lg, xl, 2xl breakpoints as you go
> 4. It's okay if things look slightly off — note issues for Phase 2
>
> **Don't worry about:**
> - Perfect alignment (Phase 2)
> - Edge cases (Phase 2)
> - Making it beautiful (just make it consistent)

---

#### Part A: Update Tailwind Config

Update `tailwind.config.js` with ALL design system tokens:

**Typography Tokens:**
| Token | lg (1024–1279px) | xl (1280–1439px) | 2xl (≥1440px) |
|-------|------------------|------------------|---------------|
| `title-page` | 15px (0.9375rem) | 16px (1rem) | 18px (1.125rem) |
| `title-section` | 13px (0.8125rem) | 14px (0.875rem) | 15px (0.9375rem) |
| `title-card` | 12px (0.75rem) | 13px (0.8125rem) | 14px (0.875rem) |
| `body` | 12px (0.75rem) | 12px (0.75rem) | 13px (0.8125rem) |
| `label` | 10px (0.625rem) | 11px (0.6875rem) | 12px (0.75rem) |
| `caption` | 10px (0.625rem) | 10px (0.625rem) | 11px (0.6875rem) |

**Padding Tokens:**
| Token | lg | xl | 2xl |
|-------|-----|-----|-----|
| `pad-page` | 10px | 12px | 16px |
| `pad-card` | 6px | 8px | 12px |
| `pad-card-compact` | 4px | 6px | 8px |

**Margin Tokens:**
| Token | lg | xl | 2xl |
|-------|-----|-----|-----|
| `margin-section` | 12px | 16px | 24px |
| `margin-element` | 4px | 6px | 8px |

**Gap Tokens:**
| Token | lg | xl | 2xl |
|-------|-----|-----|-----|
| `gap-section` | 10px | 12px | 16px |
| `gap-card-grid` | 4px | 6px | 8px |
| `gap-element` | 3px | 4px | 6px |

**Sidebar Width Tokens:**
| Token | lg | xl | 2xl |
|-------|-----|-----|-----|
| `sidebar-left` | 240px (15rem) | 280px (17.5rem) | 320px (20rem) |
| `sidebar-right` | 280px (17.5rem) | 320px (20rem) | 384px (24rem) |

---

#### Part B: Migrate All Components

Apply tokens to EVERY component in the app:

**Global Layout:**
- [ ] `src/App.tsx` — Main layout structure
- [ ] `src/components/Header.tsx` — Site title, navigation
- [ ] `src/components/FilterSubheader.tsx` — Filter labels, buttons
- [ ] Footer component (if exists)

**Left Sidebar (Data Catalog):**
- [ ] `src/components/DataCatalog.tsx` — Main sidebar container
- [ ] `src/components/DataView.tsx` — Data type cards
- [ ] All card components for each data source

**Right Sidebars (Details) — All 11 Data Sources:**
- [ ] `src/components/TNCArcGISSidebar.tsx`
- [ ] `src/components/TNCArcGISDetailsSidebar.tsx`
- [ ] `src/components/DendraSidebar.tsx`
- [ ] `src/components/DendraDetailsSidebar.tsx`
- [ ] `src/components/AnimlSidebar.tsx`
- [ ] `src/components/AnimlDetailsSidebar.tsx`
- [ ] `src/components/INaturalistSidebar.tsx`
- [ ] `src/components/INaturalistDetailsSidebar.tsx`
- [ ] `src/components/EBirdSidebar.tsx`
- [ ] `src/components/EBirdDetailsSidebar.tsx`
- [ ] `src/components/CalFloraSidebar.tsx`
- [ ] `src/components/CalFloraDetailsSidebar.tsx`
- [ ] Any other sidebar components (LiDAR, Drone, DataONE, etc.)

**Map Components:**
- [ ] Map container
- [ ] Map legends
- [ ] Map controls/overlays

**Shared Components:**
- [ ] Buttons
- [ ] Inputs
- [ ] Dropdowns
- [ ] Badges
- [ ] Cards
- [ ] Modals (if any)
- [ ] Any remaining components

---

#### Part C: Implement Compact Card Mode

For `lg` breakpoint (1024–1279px), cards should be compact:

| Property | lg (Compact) | xl/2xl (Standard) |
|----------|--------------|-------------------|
| **Description** | Hidden | Visible (1-2 lines) |
| **Badge** | Abbreviated (3-4 chars) | Full text |
| **Padding** | 4px | 8-12px |
| **Height** | ~36px | ~60-80px |

**Implementation:** Use Tailwind responsive classes:
```tsx
<p className="hidden xl:block text-body-lg xl:text-body-xl 2xl:text-body-2xl">
  {description}
</p>
```

---

#### Migration Checklist

**Before starting:**
- [ ] Read `docs/design-system/DESIGN_SYSTEM.md` thoroughly
- [ ] Ensure dev server is running
- [ ] Have browser DevTools open at 1024px, 1280px, and 1440px

**During migration:**
- [ ] Replace hardcoded `text-sm`, `text-xs`, `text-lg`, etc. with semantic tokens
- [ ] Replace hardcoded `p-4`, `gap-2`, `mb-1`, etc. with semantic tokens
- [ ] Add responsive breakpoint prefixes: `lg:`, `xl:`, `2xl:`
- [ ] Update sidebar widths to use width tokens

**After migration:**
- [ ] Test at lg (1024px) — everything should be compact
- [ ] Test at xl (1280px) — standard layout
- [ ] Test at 2xl (1440px+) — full experience
- [ ] Verify all 11 data sources look consistent
- [ ] Note any components that need special attention for Phase 2

---

#### Acceptance Criteria

- [ ] `tailwind.config.js` contains all design system tokens
- [ ] ALL components use semantic tokens instead of hardcoded values
- [ ] App renders correctly at lg (1024px), xl (1280px), 2xl (1440px)
- [ ] All 11 data sources have consistent styling
- [ ] Cards are compact at lg breakpoint (descriptions hidden)
- [ ] No TypeScript errors
- [ ] App builds successfully

**Note:** It's okay if things look slightly wonky after this task. Phase 2 is for polish and fixes.

---

### Task 4 — Document Design System Usage Patterns (🟡 MEDIUM)
**Goal:** Create practical documentation for using the design system

**Tasks:**
- [ ] Create `docs/design-system/USAGE_GUIDE.md` with examples
- [ ] Document common patterns and anti-patterns
- [ ] Add visual reference screenshots

---

### Task 5 — Fix Header and Subheader Height Consistency (🟡 MEDIUM)
**Goal:** Ensure header and subheader have identical heights across all screen sizes

**Tasks:**
- [ ] Adjust padding/height to match across header and subheader
- [ ] Ensure vertical rhythm is consistent
- [ ] Test at all breakpoints

**Acceptance Criteria:**
- Header and subheader have identical heights at all breakpoints

**Files to Modify:**
- `src/components/Header.tsx`
- `src/components/FilterSubheader.tsx`

---

### Task 6 — Locate and Update Footer Component (🟡 MEDIUM)
**Goal:** Ensure footer font sizes match header/subheader

**Tasks:**
- [ ] Locate footer component (if exists)
- [ ] Apply design system tokens
- [ ] Ensure font sizes match header navigation links
- [ ] Test across all breakpoints

---

### Task 7 — Align Left Sidebar with Subheader (🟡 MEDIUM)
**Goal:** Align right edge of left sidebar with midpoint between Category and Spatial Filter buttons

**Tasks:**
- [ ] Calculate required alignment values
- [ ] Adjust sidebar width tokens to achieve alignment
- [ ] Test alignment at all breakpoints

**Files to Modify:**
- `tailwind.config.js`
- Left sidebar component
- `src/components/FilterSubheader.tsx`

---

### Task 8 — Fix Clear Filters Button Alignment (🟡 MEDIUM)
**Goal:** Fix vertical alignment of Clear Filters button

**Tasks:**
- [ ] Adjust FilterSubheader layout to align Clear Filters button with filter buttons
- [ ] Consider using flexbox baseline alignment
- [ ] Test across different screen sizes

**Files to Modify:**
- `src/components/FilterSubheader.tsx`

---

### Task 9 — Scale Map Legends for Screen Size (🟡 MEDIUM)
**Goal:** Ensure map legends are appropriately sized for all screen sizes

**Tasks:**
- [ ] Scale legend icon sizes based on breakpoints
- [ ] Adjust legend container sizing
- [ ] Consider collapsible legends for small screens
- [ ] Test legend readability across devices

---

### Task 10 — Fix ArcGIS Card Sizing (🟡 MEDIUM)
**Goal:** Reduce card size in left sidebar for ArcGIS feature services

**Current Issues:**
- Cards are too large
- Height expanded due to presence of four tags per card

**Tasks:**
- [ ] Review card sizing after design system migration
- [ ] Test smaller font sizes for smaller screen widths
- [ ] Ensure cards are still readable and usable

---

### Task 11 — Fix Dendra Card Margins (🟡 MEDIUM)
**Goal:** Fix incorrect card margins for Dendra data streams

**Tasks:**
- [ ] Review margins after design system migration
- [ ] Test margins at all breakpoints
- [ ] Verify consistency with other data source cards

---

### Task 12 — Replace Dendra Christmas Tree Icons (🟡 MEDIUM)
**Goal:** Replace icons that resemble Christmas trees

**Tasks:**
- [ ] Research alternative icon options:
  - Weather station/meteorology icons
  - Sensor/telemetry icons (`Gauge`, `Radio`, `Antenna`, `Thermometer`)
- [ ] Select and implement new icon
- [ ] Test visual consistency

---

### Task 13 — eBird Image Loading Improvements (🟡 MEDIUM - Backend)
**Goal:** Improve image loading reliability and speed

**Current Issues:**
- Images load slowly
- Some bird species don't have images
- Currently using iNaturalist API

**Tasks:**
- [ ] Research alternative image APIs or caching strategies
- [ ] Implement backend API for serving bird images
- [ ] Ensure all species have fallback images
- [ ] Consider image optimization (compression, lazy loading, thumbnails)

---

### Task 14 — Identify Eye Icon Locations (🟡 MEDIUM)
**Goal:** Locate all components using eye icons for progressive disclosure

**Tasks:**
- [ ] Search codebase for eye icon usage
- [ ] Document all locations using progressive disclosure pattern
- [ ] Identify what descriptive text should be shown in tooltips

---

### Task 15 — Implement Tooltip Solution (🟡 MEDIUM)
**Goal:** Select and implement tooltip library or component

**Tasks:**
- [ ] Evaluate tooltip options (`react-tooltip`, `@radix-ui/react-tooltip`, custom)
- [ ] Install and configure chosen solution
- [ ] Create reusable tooltip component wrapper

---

### Task 16 — Add Hover Tooltips for Eye Icons (🟡 MEDIUM)
**Goal:** Show descriptive text on hover for eye icons at smaller screen sizes

**Tasks:**
- [ ] Add hover tooltips to all identified eye icon locations
- [ ] Show the full descriptive text that appears on larger screens
- [ ] Ensure tooltips work on touch devices

---

### Task 17 — Research ArcGIS Tags Formatting (🟢 LOW)
**Goal:** Decide whether to keep, remove, or reformat tags in ArcGIS cards

**Tasks:**
- [ ] Analyze tag usage and discoverability
- [ ] Consider alternative layouts (horizontal tags, collapsed tags, etc.)
- [ ] Make decision: keep, remove, or reformat

---

### Task 18 — Create Documentation Index (🟢 LOW)
**Goal:** Make documentation discoverable and navigable

**Tasks:**
- [ ] Create or update `docs/README.md` with directory structure explanation
- [ ] Document purpose of each subdirectory
- [ ] Create index of all major documentation files

---

### Task 19 — Document Responsive Design Patterns (🟢 LOW)
**Goal:** Create reference for future responsive development

**Tasks:**
- [ ] Document responsive design patterns established in this project
- [ ] Create examples of proper Tailwind usage
- [ ] Document common pitfalls and solutions

---

## Testing Checklist

### Breakpoints to Test
- [ ] **1024px (lg)** — Minimum supported, compact mode
- [ ] **1280px (xl)** — Standard laptop experience
- [ ] **1440px (2xl)** — Desktop threshold, full experience
- [ ] **1512px** — 14" MacBook Pro default scaling
- [ ] **1920px** — Full HD monitor

### Browsers to Test
- [ ] Chrome/Edge (Chromium) — Primary
- [ ] Firefox — Secondary
- [ ] Safari (macOS) — Secondary

### Specific Test Cases
- [ ] "Desktop Required" message appears below 1024px
- [ ] Header and subheader heights match at all breakpoints
- [ ] Left and right sidebar widths follow design tokens
- [ ] Font sizes follow design system consistently
- [ ] Cards switch to compact mode at lg breakpoint
- [ ] All 11 data sources render consistently
- [ ] No horizontal scrolling at any supported width
- [ ] Text is legible (may need reading glasses at lg — that's okay)

---

## Success Metrics

- [ ] All components use semantic design tokens (no hardcoded `text-sm`, `p-4`, etc.)
- [ ] Consistent styling across all 11 data sources
- [ ] App works at lg (1024px), xl (1280px), 2xl (1440px+)
- [ ] "Desktop Required" gate blocks screens <1024px
- [ ] No TypeScript errors, app builds successfully

---

## Development Guidelines

- **Use design system tokens** — No hardcoded font sizes or spacing
- **Responsive prefixes** — Use `lg:`, `xl:`, `2xl:` for breakpoint-specific styles
- **Consistency over perfection** — All 11 data sources should look the same
- **Iterate after migration** — Phase 2 is for polish; Task 3 is about getting tokens in place
- **Test at real breakpoints** — Use DevTools to simulate 1024px, 1280px, 1440px

---

## Instructions for AI Assistants

**READ THIS FIRST before working on any task in this plan:**

### Before Starting a Task

1. **Context Gathering:**
   - Read `docs/design-system/DESIGN_SYSTEM.md` for token specifications
   - Review the component you're about to modify
   - Check for existing patterns in the codebase

2. **For Task 3 (Big Migration):**
   - Start with `tailwind.config.js` — get all tokens in place first
   - Then work through components systematically
   - Test at lg, xl, 2xl breakpoints as you go
   - It's okay if things look slightly off — note issues for Phase 2

### After Completing a Task

1. **Announce Completion** with summary of changes
2. **Provide verification instructions** under heading **"How to Manually Verify Completeness"**
3. **Wait for user confirmation** before marking complete
4. **Update this document** — check off task, add implementation notes

---

## Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2026-01-13 | Initial draft created | Team |
| 2026-01-13 | Reorganized by execution order, added task checklist summary | Team |
| 2026-01-13 | Added Task 9 for repository/documentation cleanup | Team |
| 2026-01-13 | Removed duplicates, renumbered tasks sequentially, simplified feature tracking | Team |
| 2026-01-13 | **Task 2 COMPLETE** — Research pivoted from consumer app to data-dense approach | Team |
| 2026-01-13 | Added Task 2a (Desktop Required gate), revised Task 3 for data-dense tokens | Team |
| 2026-01-13 | Updated testing strategy for desktop-only approach (≥1024px) | Team |
| 2026-01-13 | Created `DESIGN_SYSTEM.md` with full specifications | Team |
| 2026-01-14 | **CONSOLIDATED** old Tasks 3, 5, 6, 9, 12, 13, 14, 16 into single Task 3 (Big Migration) | Team |
| 2026-01-14 | Added Context Summary section at top of document | Team |
| 2026-01-14 | Added Implementation Tips to Task 3 | Team |
| 2026-01-14 | Renumbered all tasks, simplified phase structure | Team |

---

## Appendix

### Tailwind Responsive Breakpoints

```javascript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',   // Minimum supported width
  'xl': '1280px',   // Standard laptop
  '2xl': '1440px',  // Desktop threshold
}
```

### Example Token Usage

```tsx
// Before (hardcoded values)
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
<div className="p-4 gap-2">

// After (design system tokens)
<h1 className="text-title-page-lg xl:text-title-page-xl 2xl:text-title-page-2xl">Title</h1>
<div className="p-pad-page-lg xl:p-pad-page-xl 2xl:p-pad-page-2xl gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">
```

### Quick Reference Card

| What | Token Pattern | Example |
|------|---------------|---------|
| Page title | `text-title-page-{breakpoint}` | `text-title-page-lg xl:text-title-page-xl` |
| Body text | `text-body-{breakpoint}` | `text-body-lg xl:text-body-xl` |
| Page padding | `p-pad-page-{breakpoint}` | `p-pad-page-lg xl:p-pad-page-xl` |
| Card padding | `p-pad-card-{breakpoint}` | `p-pad-card-lg xl:p-pad-card-xl` |
| Grid gaps | `gap-gap-card-grid-{breakpoint}` | `gap-gap-card-grid-lg xl:gap-gap-card-grid-xl` |
| Left sidebar | `w-sidebar-left-{breakpoint}` | `w-sidebar-left-lg xl:w-sidebar-left-xl` |
