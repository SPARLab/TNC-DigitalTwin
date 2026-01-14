# January 2026 UI Improvements Development Plan

**Created:** January 13, 2026  
**Status:** Ready for Implementation  
**Owner:** Team

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
- [x] **Task 2a** — Implement "Desktop Required" gate for small screens (🔴 HIGH) ✅ COMPLETE
- [x] **Task 3** — ⚡ **MIGRATE ENTIRE APP TO DESIGN SYSTEM** (🔴 HIGH) ⚡ ✅ COMPLETE
- [x] **Task 4** — Document design system usage patterns (🟡 MEDIUM) ✅ COMPLETE

### Phase 2: Polish & Fixes (Post-Migration)
- [x] **Task 5** — Fix header and subheader height consistency (🟡 MEDIUM) ✅ COMPLETE
- [x] **Task 5a** — Fix DataCatalog icon/text vertical alignment (🟡 MEDIUM) ✅ COMPLETE
- [x] **Task 6** — Locate and update Footer component (🟡 MEDIUM) ✅ COMPLETE
- [x] **Task 7** — Align left sidebar with subheader (🟡 MEDIUM) ✅ COMPLETE
- [x] **Task 8** — Fix Clear Filters button alignment (🟡 MEDIUM) ✅ COMPLETE
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
| **Monotonic sizing** | Values always increase (or stay equal) with screen size | Predictable, consistent responsive behavior |

### Monotonic Sizing Rule ⚠️

**All responsive values must be monotonically increasing as screen size increases.**

Unless explicitly stated otherwise, any dimension (font size, padding, margin, gap, width, height) must follow this pattern:

| Pattern | Valid? | Example |
|---------|--------|---------|
| `lg ≤ xl ≤ 2xl` | ✅ Yes | 10px → 12px → 14px |
| `lg = xl < 2xl` | ✅ Yes | 10px → 10px → 12px |
| `lg < xl = 2xl` | ✅ Yes | 10px → 12px → 12px |
| `lg > xl` | ❌ No | 12px → 11px → 14px |
| `xl > 2xl` | ❌ No | 10px → 14px → 13px |

**Rationale:** Larger screens should never have smaller values than smaller screens. This ensures predictable, consistent responsive behavior where elements grow (or stay the same) as viewport increases.

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

### Task 2a — Implement "Desktop Required" Gate (🔴 HIGH) ✅ COMPLETE
**Goal:** Block access on screens <1024px with a friendly message

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Create `DesktopOnlyGate` component
- [x] Wrap app in gate component
- [x] Test at various viewport sizes
- [x] Ensure message is accessible and professional

**Implementation Notes:**
- Created `src/components/DesktopOnlyGate.tsx` with responsive width checking
- Wraps entire App component to block screens <1024px
- Shows centered card with professional message and helpful tip about display scaling
- Uses high z-index (9999) and dark overlay to prevent app interaction
- Includes null return during initial check to prevent flash of content
- All elements have descriptive IDs for accessibility and testing

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

**Files Created/Modified:**
- ✅ `src/components/DesktopOnlyGate.tsx` (created)
- ✅ `src/App.tsx` (wrapped with gate)

**Reference:** See `docs/design-system/DESIGN_SYSTEM.md` § Mobile/Tablet Blocking

**Commit:**
```
feat(App/DesktopOnlyGate): add gate blocking screens <1024px
```

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

**Status:** COMPLETE — January 14, 2026

**Implementation Summary:**
1. ✅ Updated `tailwind.config.js` with data-dense design system tokens
   - Typography: title-page, title-section, title-card, body, label, caption, micro
   - Spacing: pad-card, pad-card-compact, margin-section, margin-element, gap-section, gap-card-grid, gap-element, gap-tight
   - Widths: sidebar-left (240/280/320px), sidebar-right (280/320/384px)
   - All tokens have responsive values for lg, xl, 2xl breakpoints

2. ✅ Migrated all sidebar components to use responsive width tokens
   - Left sidebars: `w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl`
   - Right sidebars: `w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl`

3. ✅ Updated Header, FilterSubheader, Footer (already using tokens, now have correct values)

4. ✅ Updated DataCatalog and DataView with design system tokens

5. ✅ Implemented compact card mode at lg breakpoint
   - Descriptions hidden at lg, visible at xl+
   - Info icons appear on lg for hover tooltips
   - Compact padding applied

**Files Modified:**
- `tailwind.config.js` — Updated all token values
- `src/components/DataView.tsx`
- `src/components/DataCatalog.tsx`
- `src/components/TNCArcGISSidebar.tsx`
- `src/components/INaturalistSidebar.tsx`
- `src/components/DendraSidebar.tsx`
- `src/components/AnimlSidebar.tsx`
- `src/components/CalFloraSidebar.tsx`
- `src/components/FilterSidebar.tsx`
- `src/components/SearchResults.tsx`
- All Details Sidebar components (TNCArcGIS, INaturalist, eBird, CalFlora, Animl, Dendra, DataONE, DroneImagery)
- All DataView components (WildlifeEBirdView, DroneImageryView, DataONEView, LiDARView)
- `src/components/ShoppingCart/CartPanel.tsx`

---

### Task 4 — Document Design System Usage Patterns (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Create practical documentation for using the design system

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Create `docs/design-system/USAGE_GUIDE.md` with examples
- [x] Document common patterns and anti-patterns
- [ ] Add visual reference screenshots (deferred — documentation is text-complete)

**Deliverables Created:**
- ✅ `docs/design-system/USAGE_GUIDE.md` — Comprehensive usage guide

**Documentation Covers:**
- Quick start guide with the "golden rule" for token usage
- Three-breakpoint responsive pattern explanation
- All token categories: typography, spacing (padding/margins/gaps), widths
- Common component patterns with full code examples:
  - Sidebar containers
  - Data cards with compact mode
  - Info icons for compact mode
  - Empty states
  - Stats/metadata rows
  - Form inputs
  - Filter buttons/badges
- Anti-patterns to avoid (with before/after examples)
- Migration checklist for existing code
- Testing checklist with viewport sizes
- Token quick reference tables

**Files Created:**
- `docs/design-system/USAGE_GUIDE.md`

**Commit:**
```
docs(design-system): add USAGE_GUIDE.md with patterns and examples
```

---

### Task 5 — Fix Header and Subheader Height Consistency (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Ensure header and subheader have identical heights across all screen sizes

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Adjust padding/height to match across header and subheader
- [x] Ensure vertical rhythm is consistent
- [x] Test at all breakpoints
- [x] Fix missing `xl:` breakpoint classes in Header

**Acceptance Criteria:**
- [x] Header and subheader have identical heights at all breakpoints
- [x] Typography and spacing scale properly at xl breakpoint (1280-1439px)

**Implementation Summary:**
1. Added new `header` height tokens to `tailwind.config.js`:
   - lg: 40px, xl: 48px, 2xl: 56px
2. Applied fixed heights to both Header and FilterSubheader components
3. Removed floating labels above filter buttons (redundant with button placeholder text)
4. Added `items-center` and `h-full` to ensure proper vertical centering
5. Fixed missing `xl:` breakpoint classes throughout Header component:
   - Title font size now scales properly: 15px (lg) → 16px (xl) → 18px (2xl)
   - Padding, gaps, and button spacing now scale at all three breakpoints
6. Updated `docs/design-system/DESIGN_SYSTEM.md` with new height tokens

**Files Modified:**
- `tailwind.config.js` — Added height tokens
- `src/components/Header.tsx` — Applied fixed height, added missing xl: breakpoints
- `src/components/FilterSubheader.tsx` — Applied fixed height, removed floating labels
- `docs/design-system/DESIGN_SYSTEM.md` — Documented height tokens

**Design Decisions:**
1. **Removed floating labels** ("DATA CATEGORY", "TAGS", etc.) above filter buttons because:
   - They added unnecessary height to the subheader
   - Button placeholder text already indicates the filter type ("Select Category", "Select Spatial Filter")
   - Data-dense approach prioritizes vertical space efficiency

2. **Fixed missing xl: breakpoints** in Header:
   - Header was jumping from lg (1024px) directly to 2xl (1440px), skipping xl (1280px)
   - This caused title and spacing to not scale properly on standard laptops (1280-1439px)
   - All responsive tokens now include base, lg, xl, and 2xl variants

---

### Task 5a — Fix DataCatalog Icon/Text Vertical Alignment (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Achieve perfect vertical alignment between card icons and titles in the left sidebar

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Fine-tune icon sizes and text line-heights at each breakpoint
- [x] Account for typography descenders using margin-top offset
- [x] Test alignment at 1024px (lg), 1280px (xl), 1440px+ (2xl)
- [x] Verify visual harmony across all data source cards

**Acceptance Criteria:**
- [x] Icon container and text appear visually center-aligned at all breakpoints
- [x] Text cap height (not including descenders) aligns with icon center
- [x] Consistent appearance across all 11 data sources

**Files Modified:**
- `src/components/DataCatalog.tsx`

**Implementation Summary:**

1. **Consistent alignment strategy:** Changed card button from `items-center xl:items-start` to just `items-center` for consistent behavior at all breakpoints.

2. **Icon container alignment:** Added `self-center xl:self-start xl:mt-px 2xl:mt-0.5`
   - At lg: `self-center` keeps icon centered with title
   - At xl+: `self-start` with small margin-top fine-tunes alignment with first line of text

3. **Content container restructure:** Changed from `flex items-center xl:block` to `flex items-center xl:flex-col xl:items-start`
   - At lg: horizontal flex row (title + info icon)
   - At xl+: vertical column (title row above description)

4. **Title wrapper:** Added wrapper div `<div className="flex items-center">` around title and info icon
   - Keeps title and info icon always horizontally aligned
   - Info icon hidden at xl+ where full description is visible

5. **Removed hacks:** Removed manual `leading-5 2xl:leading-7` line-height overrides and `xl:mt-0.5 xl:mb-gap-tight-xl` margin hacks
   - Now uses design system's natural line-height (1.2) from typography tokens
   - Cleaner, more maintainable code

6. **Description spacing:** Added `mt-gap-tight-xl 2xl:mt-gap-tight-2xl` for consistent spacing between title and description using design system tokens

**Commit:**
```
fix(DataCatalog): improve icon/text vertical alignment across breakpoints
```

---

### Task 6 — Locate and Update Footer Component (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Ensure footer font sizes match header/subheader

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Locate footer component (if exists)
- [x] Apply design system tokens
- [x] Ensure font sizes match header navigation links
- [x] Test across all breakpoints

**Implementation Summary:**
1. Located footer at `src/components/Footer.tsx`
2. Added missing `xl:` breakpoint classes throughout (was jumping from lg to 2xl)
3. Replaced hardcoded `space-x-6` with responsive gap tokens: `gap-gap-section-base lg:gap-gap-section-lg xl:gap-gap-section-xl 2xl:gap-gap-section-2xl`

**Changes Made:**
- Horizontal padding: Added `xl:px-page-xl`
- Vertical padding: Added `xl:py-page-y-xl`
- Typography: Added `xl:text-body-xl` to copyright text and all links
- Link spacing: Changed from `space-x-6` to responsive gap tokens

**Files Modified:**
- `src/components/Footer.tsx`

**Commit:**
```
fix(Footer): add missing xl breakpoint classes and use design system gap tokens
```

---

### Task 7 — Align Left Sidebar with Subheader (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Align right edge of left sidebar with midpoint between Category and Spatial Filter buttons

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Calculate required alignment values
- [x] Adjust sidebar width tokens to achieve alignment
- [x] Test alignment at all breakpoints
- [x] Fix missing `xl:` breakpoint classes in FilterSubheader

**Implementation Summary:**

1. **Calculated target widths** using formula: `page-padding + filter-width + (gap/2)`
   - lg: 10px + 224px + 1px = **235px** (14.6875rem)
   - xl: 12px + 272px + 1.5px = **286px** (17.875rem)
   - 2xl: 16px + 320px + 2px = **338px** (21.125rem)

2. **Updated sidebar width tokens** in `tailwind.config.js`:
   - `sidebar-left-lg`: 14.6875rem (235px) — was 15rem (240px)
   - `sidebar-left-xl`: 17.875rem (286px) — was 17.5rem (280px)
   - `sidebar-left-2xl`: 21.125rem (338px) — was 20rem (320px)

3. **Fixed missing `xl:` breakpoint classes** in FilterSubheader:
   - Added `xl:px-page-xl` for horizontal padding
   - Added `xl:gap-gap-large-xl` for outer flex container
   - Added `xl:gap-gap-small-xl` for filter buttons container
   - Added `xl:gap-section-compact-xl` for right section

**Files Modified:**
- `tailwind.config.js` — Updated sidebar-left width tokens
- `src/components/FilterSubheader.tsx` — Added missing xl: breakpoint classes
- `docs/design-system/DESIGN_SYSTEM.md` — Documented alignment formula

**Commit:**
```
fix(FilterSubheader, design-system): align left sidebar with filter gap midpoint
```

---

### Task 8 — Fix Clear Filters Button Alignment (🟡 MEDIUM) ✅ COMPLETE
**Goal:** Fix vertical alignment of Clear Filters button

**Status:** COMPLETE — January 14, 2026

**Tasks:**
- [x] Adjust FilterSubheader layout to align Clear Filters button with filter buttons
- [x] Add matching vertical padding to Clear Filters button
- [x] Add missing `xl:` breakpoint for typography
- [x] Test across different screen sizes

**Implementation Summary:**
The Clear Filters button was misaligned because it had no vertical padding while the filter buttons had `py-btn-y-*` padding. This caused the text baselines to not align even though both containers used `items-center`.

**Changes Made:**
1. Added matching vertical padding: `py-btn-y-base lg:py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl`
2. Added missing `xl:` typography breakpoint: `xl:text-body-xl`

**Before:**
```tsx
className="text-body-base lg:text-body-lg 2xl:text-body-2xl text-blue-600 hover:text-blue-800"
```

**After:**
```tsx
className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-blue-600 hover:text-blue-800 py-btn-y-base lg:py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl"
```

**Files Modified:**
- `src/components/FilterSubheader.tsx`

**Commit:**
```
fix(FilterSubheader): align Clear Filters button with filter buttons
```

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
5. **Offer commit message** — After user says "complete", provide a Conventional Commits message

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
| 2026-01-14 | **Task 2a COMPLETE** — Desktop Required gate implemented | Team |
| 2026-01-14 | **Task 3 COMPLETE** — Migrated entire app to design system tokens | Team |
| 2026-01-14 | **Task 4 COMPLETE** — Created USAGE_GUIDE.md with patterns and examples | Team |
| 2026-01-14 | **Task 5 COMPLETE** — Header/subheader height consistency with fixed height tokens | Team |
| 2026-01-14 | **Task 5a COMPLETE** — DataCatalog icon/text vertical alignment fixed | Team |
| 2026-01-14 | **Task 6 COMPLETE** — Footer updated with xl breakpoints and design system gap tokens | Team |
| 2026-01-14 | Added **Monotonic Sizing Rule** to Context Summary and DESIGN_SYSTEM.md | Team |
| 2026-01-14 | **Task 7 COMPLETE** — Left sidebar aligned with filter gap midpoint, added missing xl: breakpoints | Team |
| 2026-01-14 | **Task 8 COMPLETE** — Clear Filters button alignment fixed with matching padding | Team |

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
