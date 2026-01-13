# Responsive Design System

## Implementation Status: ✅ IMPLEMENTED

This document describes the responsive design token system that has been implemented across the codebase.

**Summary:** We now have semantic CSS custom properties that scale across breakpoints. Typography and spacing automatically adjust for tablet and mobile screen sizes by changing ~20 variables in one file (`src/styles/tokens.css`).

---

## Current State Analysis

### Typography Usage (690 total instances)

| Class | Count | Current Use Cases |
|-------|-------|-------------------|
| `text-sm` | 356 (52%) | Body text, descriptions, form inputs, list items |
| `text-xs` | 255 (37%) | Labels, badges, metadata, timestamps |
| `text-lg` | 62 (9%) | Section headings, sidebar titles, card titles |
| `text-xl` | 9 (1%) | Page titles, modal headers |
| `text-base` | 6 (<1%) | Card titles (DataCatalog), some body text |
| `text-2xl+` | 2 (<1%) | Hero elements, large headings |

**Font Weights:**
| Class | Count |
|-------|-------|
| `font-medium` | 253 |
| `font-semibold` | 82 |
| `font-bold` | 17 |

### Spacing Usage (Top 20 patterns)

| Class | Count | Typical Context |
|-------|-------|-----------------|
| `gap-2` | 123 | Card grids, list spacing |
| `p-4` | 98 | Card/container padding |
| `mb-1` | 86 | Tight vertical spacing |
| `px-3` | 82 | Button/input horizontal padding |
| `py-2` | 80 | Button/input vertical padding |
| `mb-2` | 79 | Element margins |
| `px-4` | 60 | Larger horizontal padding |
| `py-1` | 52 | Compact vertical padding |
| `gap-3` | 52 | Medium grid gaps |
| `space-y-3` | 42 | Vertical stacking |
| `mb-4` | 41 | Section margins |
| `mt-1` | 38 | Top margins |
| `mr-2` | 37 | Icon spacing |
| `p-3` | 34 | Compact card padding |
| `p-2` | 31 | Tight padding |
| `mb-3` | 30 | Medium bottom margins |

### Border Radius
| Class | Count |
|-------|-------|
| `rounded-lg` | 132 |
| `rounded-full` | 53 |
| `rounded-md` | 39 |

---

## Proposed Design Token System

### Option A: CSS Custom Properties (Recommended)

Create semantic design tokens in `src/index.css`:

```css
:root {
  /* ============================================
     TYPOGRAPHY TOKENS
     ============================================ */
  
  /* Page-level titles (e.g., "Dangermond Preserve Data Catalog") */
  --text-title-page: 1.25rem;      /* text-xl (20px) */
  
  /* Section headings (e.g., "Data Type", sidebar titles) */
  --text-title-section: 1.125rem;  /* text-lg (18px) */
  
  /* Card titles, prominent labels */
  --text-title-card: 1rem;         /* text-base (16px) */
  
  /* Primary body text, descriptions */
  --text-body: 0.875rem;           /* text-sm (14px) */
  
  /* Labels, metadata, badges, small text */
  --text-label: 0.75rem;           /* text-xs (12px) */
  
  /* Micro text (rare) */
  --text-micro: 0.625rem;          /* text-[10px] */

  /* ============================================
     SPACING TOKENS
     ============================================ */
  
  /* Page/section level padding */
  --space-page: 1.5rem;            /* p-6 (24px) */
  
  /* Container/card padding */
  --space-container: 1rem;         /* p-4 (16px) */
  
  /* Compact container padding */
  --space-container-sm: 0.75rem;   /* p-3 (12px) */
  
  /* Grid gaps, element spacing */
  --space-gap: 0.5rem;             /* gap-2 (8px) */
  
  /* Tight spacing between related items */
  --space-gap-tight: 0.25rem;      /* gap-1 (4px) */
  
  /* Section margins (between major sections) */
  --space-section: 1rem;           /* mb-4, mt-4 (16px) */
  
  /* Element margins (between elements) */
  --space-element: 0.5rem;         /* mb-2, mt-2 (8px) */
  
  /* Button/input padding */
  --space-button-x: 0.75rem;       /* px-3 (12px) */
  --space-button-y: 0.5rem;        /* py-2 (8px) */

  /* ============================================
     COMPONENT-SPECIFIC TOKENS
     ============================================ */
  
  /* Sidebar width */
  --sidebar-width: 16rem;          /* w-64 */
  
  /* Filter button min-width */
  --filter-button-width: 22.7rem;
  
  /* Card border radius */
  --radius-card: 0.5rem;           /* rounded-lg */
  --radius-button: 0.375rem;       /* rounded-md */
}

/* ============================================
   RESPONSIVE OVERRIDES
   ============================================ */

/* Tablet and below (< 1024px) */
@media (max-width: 1023px) {
  :root {
    --text-title-page: 1.125rem;     /* text-lg */
    --text-title-section: 1rem;      /* text-base */
    --text-title-card: 0.875rem;     /* text-sm */
    
    --space-page: 1rem;              /* p-4 */
    --space-container: 0.75rem;      /* p-3 */
    --space-gap: 0.375rem;           /* gap-1.5 */
    
    --filter-button-width: 100%;
  }
}

/* Mobile (< 768px) */
@media (max-width: 767px) {
  :root {
    --text-title-page: 1rem;         /* text-base */
    --text-title-section: 0.875rem;  /* text-sm */
    --text-body: 0.875rem;           /* stays text-sm */
    --text-label: 0.75rem;           /* stays text-xs */
    
    --space-page: 0.75rem;           /* p-3 */
    --space-container: 0.5rem;       /* p-2 */
    --space-container-sm: 0.5rem;    /* p-2 */
    --space-section: 0.75rem;        /* mb-3 */
    
    --sidebar-width: 100%;
  }
}

/* Small mobile (< 480px) */
@media (max-width: 479px) {
  :root {
    --text-title-page: 0.875rem;     /* text-sm */
    --text-title-section: 0.875rem;  /* text-sm */
    --text-body: 0.75rem;            /* text-xs */
    
    --space-page: 0.5rem;            /* p-2 */
  }
}
```

### Using the Tokens in Components

**Before (current approach):**
```tsx
<h2 className="text-lg font-semibold text-gray-900">Data Type</h2>
<p className="text-sm text-gray-500 mt-1">Select a data type...</p>
<div className="p-4 gap-2">
```

**After (with tokens):**
```tsx
<h2 className="font-semibold text-gray-900" style={{ fontSize: 'var(--text-title-section)' }}>
  Data Type
</h2>
<p className="text-gray-500" style={{ fontSize: 'var(--text-body)', marginTop: 'var(--space-gap)' }}>
  Select a data type...
</p>
<div style={{ padding: 'var(--space-container)', gap: 'var(--space-gap)' }}>
```

### Option B: Extend Tailwind Config (Alternative)

Extend `tailwind.config.js` to use CSS variables:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        'title-page': 'var(--text-title-page)',
        'title-section': 'var(--text-title-section)',
        'title-card': 'var(--text-title-card)',
        'body': 'var(--text-body)',
        'label': 'var(--text-label)',
      },
      spacing: {
        'page': 'var(--space-page)',
        'container': 'var(--space-container)',
        'container-sm': 'var(--space-container-sm)',
        'section': 'var(--space-section)',
        'element': 'var(--space-element)',
      },
      gap: {
        'default': 'var(--space-gap)',
        'tight': 'var(--space-gap-tight)',
      },
    },
  },
  plugins: [],
}
```

**Usage:**
```tsx
<h2 className="text-title-section font-semibold text-gray-900">Data Type</h2>
<p className="text-body text-gray-500 mt-element">Select a data type...</p>
<div className="p-container gap-default">
```

---

## Semantic Token Mapping

Here's how current hardcoded values map to semantic tokens:

### Typography Mapping

| Current Class | Semantic Token | Use Case |
|---------------|----------------|----------|
| `text-xl` | `--text-title-page` | Main page titles, modal headers |
| `text-lg` | `--text-title-section` | Section headings, sidebar titles |
| `text-base` | `--text-title-card` | Card titles, prominent text |
| `text-sm` | `--text-body` | Descriptions, body text, inputs |
| `text-xs` | `--text-label` | Labels, badges, timestamps, metadata |

### Spacing Mapping

| Current Class | Semantic Token | Use Case |
|---------------|----------------|----------|
| `p-6`, `px-6` | `--space-page` | Page-level padding (header, footer) |
| `p-4` | `--space-container` | Card/panel padding |
| `p-3` | `--space-container-sm` | Compact containers |
| `gap-2`, `space-y-2` | `--space-gap` | Element spacing |
| `gap-1` | `--space-gap-tight` | Tight groupings |
| `mb-4`, `mt-4` | `--space-section` | Between sections |
| `mb-2`, `mt-2` | `--space-element` | Between elements |
| `px-3` | `--space-button-x` | Button horizontal |
| `py-2` | `--space-button-y` | Button vertical |

---

## Implementation Plan

### Phase 1: Foundation (Low Risk)
1. Add CSS custom properties to `src/index.css`
2. Add Tailwind config extensions
3. **Do NOT change any components yet**

### Phase 2: High-Impact Components First
Start with the components that appear on every screen:
1. `Header.tsx` (131 lines) - Easy win
2. `FilterSubheader.tsx` (545 lines) - Already identified as problem
3. `DataCatalog.tsx` (283 lines) - Sidebar cards
4. `Footer.tsx` (if exists)

### Phase 3: Sidebars
These are the most text-heavy components:
1. `AnimlSidebar.tsx` (897 lines)
2. `INaturalistSidebar.tsx` (709 lines)
3. `CalFloraSidebar.tsx` (549 lines)
4. `DendraSidebar.tsx` (543 lines)

### Phase 4: Detail Views
1. `AnimlDetailsSidebar.tsx` (1477 lines)
2. `DendraDetailsSidebar.tsx` (948 lines)
3. Other detail components

---

## Honest Assessment & Pushback

### This IS a Good Idea Because:
1. **You have clear patterns** - The analysis shows strong clustering (text-sm at 52%, gap-2 at 123 uses)
2. **Single source of truth** - Change one variable, update everywhere
3. **Breakpoint-aware** - Media queries adjust everything at once
4. **Future-proof** - Adding new breakpoints is trivial

### Potential Concerns:

1. **Initial migration effort** - 16,456 lines of component code to audit
2. **Not all instances are equal** - A `text-sm` in a tooltip might need different behavior than `text-sm` in a form
3. **Inline styles vs Tailwind** - Using `style={{ fontSize: 'var(...)' }}` loses some Tailwind benefits (hover states, responsive utilities)

### My Recommendation:

**Go with Option B (Tailwind Config)** because:
- You keep Tailwind's class-based approach
- You can still use responsive prefixes: `text-title-section md:text-title-page`
- IntelliSense still works
- Easier migration (just swap class names)

**Start small**: Convert `Header`, `FilterSubheader`, and `DataCatalog` first. If it works well, continue to other components. If you find cases where the abstraction doesn't fit, that's valuable feedback to refine the tokens.

---

## Quick Win: Immediate Responsive Fix

If you want a quick win RIGHT NOW without the full token system, add these responsive utilities to the problematic components:

```tsx
// FilterSubheader.tsx - Filter buttons
className="min-w-full lg:min-w-[22.7rem]"

// DataCatalog.tsx - Container  
className="p-2 md:p-3 space-y-2 md:space-y-3"

// Header.tsx - Padding
className="px-2 md:px-3 lg:px-6"
```

This is a stopgap, not a long-term solution, but it would make the current small-screen experience tolerable while you implement the full token system.

---

## Files to Create/Modify

1. `src/styles/tokens.css` - CSS custom properties (new file)
2. `tailwind.config.js` - Extended theme
3. `src/index.css` - Import tokens
4. Components (gradual migration)

Would you like me to start implementing Phase 1?

