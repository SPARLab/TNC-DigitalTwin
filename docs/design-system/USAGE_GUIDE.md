# Design System Usage Guide

**Created:** January 2026  
**Status:** Active  
**Companion to:** `DESIGN_SYSTEM.md`

---

## Quick Start

The Dangermond Preserve Data Catalog uses a **responsive, data-dense design system** with semantic tokens. All styling should use these tokens rather than hardcoded Tailwind values.

### The Golden Rule

```tsx
// ❌ BAD - Hardcoded values
<h2 className="text-lg p-4 mb-2">Title</h2>

// ✅ GOOD - Semantic tokens with responsive breakpoints
<h2 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl">
  Title
</h2>
```

### Essential Pattern: Three-Breakpoint Responsive Classes

Every design token has values for three breakpoints. Always specify all three:

```tsx
// Pattern: {token}-lg xl:{token}-xl 2xl:{token}-2xl
className="text-body-lg xl:text-body-xl 2xl:text-body-2xl"
```

| Breakpoint | Width Range | Target Devices |
|------------|-------------|----------------|
| `lg` | 1024–1279px | MacBooks with "Larger Text" scaling |
| `xl` | 1280–1439px | MacBooks at default, Windows laptops |
| `2xl` | ≥1440px | Desktops, external monitors |

---

## Token Categories

### Typography Tokens

| Token | Purpose | Example |
|-------|---------|---------|
| `title-page` | Main page headings | Site title, page titles |
| `title-section` | Section headers | Sidebar titles, filter groups |
| `title-card` | Card/item titles | Data source cards, list items |
| `body` | Body text | Descriptions, paragraphs |
| `label` | Labels, metadata | Form labels, badges |
| `caption` | Secondary info | Timestamps, counts |
| `micro` | Very small text | Badge abbreviations |

**Usage Examples:**

```tsx
// Page title
<h1 className="text-title-page-lg xl:text-title-page-xl 2xl:text-title-page-2xl">
  Dangermond Preserve Data Catalog
</h1>

// Section heading
<h2 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold">
  Data Type
</h2>

// Body text
<p className="text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-600">
  Select a data type to explore...
</p>

// Label/metadata
<span className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-500">
  {count} items
</span>

// Micro text (badge abbreviation)
<span className="text-micro-lg xl:text-micro-lg 2xl:text-micro-2xl">
  Arc
</span>
```

---

### Spacing Tokens

#### Padding (Internal spacing)

| Token | Purpose |
|-------|---------|
| `pad-card` | Standard card/container padding |
| `pad-card-compact` | Compact card variant |
| `page` / `page-y` | Page container horizontal/vertical padding |
| `btn-x` / `btn-y` | Button horizontal/vertical padding |

```tsx
// Standard card padding
<div className="p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl">

// Compact card padding (for dense lists)
<button className="p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl">

// Page container
<div className="px-page-lg xl:px-page-xl 2xl:px-page-2xl py-page-y-lg xl:py-page-y-xl 2xl:py-page-y-2xl">

// Button padding
<button className="px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl">
```

#### Margins (External spacing)

| Token | Purpose |
|-------|---------|
| `margin-section` | Between major UI sections |
| `margin-element` | Between sibling elements |

```tsx
// Section margin
<div className="mb-margin-section-lg xl:mb-margin-section-xl 2xl:mb-margin-section-2xl">

// Element margin
<h3 className="mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl">
```

#### Gaps (Flex/Grid spacing)

| Token | Purpose |
|-------|---------|
| `gap-section` | Between major flex/grid sections |
| `gap-card-grid` | Between cards in a grid |
| `gap-element` | Between elements in a row |
| `gap-tight` | Very tight (icon + label) |

```tsx
// Card grid
<div className="grid grid-cols-1 gap-gap-card-grid-lg xl:gap-gap-card-grid-xl 2xl:gap-gap-card-grid-2xl">

// Element row
<div className="flex items-center gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">

// Tight grouping (icon + text)
<div className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</div>
```

---

### Width Tokens

```tsx
// Left sidebar (Data Catalog)
<aside className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl">

// Right sidebar (Details panel)
<aside className="w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl">
```

| Token | lg (1024px) | xl (1280px) | 2xl (1440px+) |
|-------|-------------|-------------|---------------|
| `sidebar-left` | 240px | 280px | 320px |
| `sidebar-right` | 280px | 320px | 384px |

---

## Common Component Patterns

### Sidebar Container

```tsx
<div className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
  {/* Header */}
  <div className="p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl border-b border-gray-200">
    <h2 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold">
      Section Title
    </h2>
  </div>
  
  {/* Content */}
  <div className="flex-1 overflow-y-auto p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl">
    {/* Items */}
  </div>
</div>
```

### Data Card (Responsive with Compact Mode)

The design system supports **compact mode** at `lg` breakpoint where descriptions are hidden:

```tsx
<button
  className="relative flex items-center xl:items-start p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl rounded-card border text-left transition-all"
>
  {/* Icon */}
  <div className="p-gap-tight-lg xl:p-gap-tight-xl 2xl:p-gap-tight-2xl rounded-button mr-gap-element-lg xl:mr-gap-element-xl 2xl:mr-gap-element-2xl flex-shrink-0 bg-blue-50 text-blue-600">
    <Icon className="w-4 h-4 2xl:w-5 2xl:h-5" />
  </div>
  
  {/* Content */}
  <div className="flex-1 min-w-0 flex items-center xl:block">
    <h3 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold">
      {title}
    </h3>
    
    {/* Description: Hidden at lg, visible at xl+ */}
    <p className="hidden xl:block text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 line-clamp-2">
      {description}
    </p>
  </div>
  
  {/* Badge */}
  <span className="px-gap-tight-lg xl:px-gap-tight-xl 2xl:px-gap-tight-2xl py-0.5 text-micro-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge bg-gray-100">
    {badge}
  </span>
</button>
```

### Info Icon for Compact Mode

When descriptions are hidden at `lg`, show an info icon with tooltip:

```tsx
{/* Info icon: Visible at lg only, hidden at xl+ */}
<span 
  className="xl:hidden flex-shrink-0 ml-gap-tight-lg cursor-help"
  title={description}
>
  <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
</span>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center h-full p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl text-center">
  <div className="mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl">
    <Search className="w-16 h-16 text-gray-300" />
  </div>
  <h3 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-medium text-gray-900 mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl">
    Start Your Search
  </h3>
  <p className="text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-600">
    Enter selection criteria and hit search to see results
  </p>
</div>
```

### Stats/Metadata Row

```tsx
<div className="flex items-center justify-between text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-600">
  <span>{total} items</span>
  <div className="flex items-center gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">
    <span className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
      <Icon className="w-3 h-3" />
      {count}
    </span>
  </div>
</div>
```

### Form Input

```tsx
<input
  type="text"
  placeholder="Search..."
  className="w-full px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl text-body-lg xl:text-body-xl 2xl:text-body-2xl border border-gray-300 rounded-button focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

### Filter Button/Badge

```tsx
<button
  className="px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge transition-colors bg-white text-gray-600 hover:bg-gray-100"
>
  Filter Option
</button>
```

---

## Anti-Patterns to Avoid

### ❌ Hardcoded Font Sizes

```tsx
// ❌ BAD
<p className="text-sm">Description</p>
<h2 className="text-lg font-bold">Title</h2>

// ✅ GOOD
<p className="text-body-lg xl:text-body-xl 2xl:text-body-2xl">Description</p>
<h2 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold">Title</h2>
```

### ❌ Hardcoded Spacing

```tsx
// ❌ BAD
<div className="p-4 mb-2 gap-3">

// ✅ GOOD
<div className="p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">
```

### ❌ Missing Breakpoint Prefixes

```tsx
// ❌ BAD - Only specifies lg, missing xl and 2xl
<p className="text-body-lg">

// ✅ GOOD - All three breakpoints specified
<p className="text-body-lg xl:text-body-xl 2xl:text-body-2xl">
```

### ❌ Hardcoded Sidebar Widths

```tsx
// ❌ BAD
<aside className="w-64">
<aside className="w-80">

// ✅ GOOD
<aside className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl">
<aside className="w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl">
```

### ❌ Inconsistent Font Weights

```tsx
// ❌ BAD - Using font-bold instead of font-semibold for titles
<h2 className="text-title-section-lg font-bold">

// ✅ GOOD - Semantic weights: titles use semibold (600), card titles use medium (500)
<h2 className="text-title-section-lg font-semibold">
<h3 className="text-title-card-lg font-medium">
```

---

## Migration Checklist

When updating existing components to use the design system:

### 1. Typography
- [ ] Replace `text-xs` → `text-label-lg xl:text-label-xl 2xl:text-label-2xl` or `text-caption-*`
- [ ] Replace `text-sm` → `text-body-lg xl:text-body-xl 2xl:text-body-2xl`
- [ ] Replace `text-base` → `text-title-card-lg xl:text-title-card-xl 2xl:text-title-card-2xl`
- [ ] Replace `text-lg` → `text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl`
- [ ] Replace `text-xl`/`text-2xl` → `text-title-page-lg xl:text-title-page-xl 2xl:text-title-page-2xl`

### 2. Padding
- [ ] Replace `p-2`/`p-3`/`p-4` → `p-pad-card-*` tokens
- [ ] Replace `px-*`/`py-*` in containers → `p-page-*` or `p-pad-card-*` tokens

### 3. Margins
- [ ] Replace `mb-1`/`mb-2` → `mb-margin-element-*` tokens
- [ ] Replace `mb-4`/`mb-6`/`mb-8` → `mb-margin-section-*` tokens
- [ ] Replace `mt-*`/`my-*` similarly

### 4. Gaps
- [ ] Replace `gap-1`/`gap-2` → `gap-gap-tight-*` or `gap-gap-element-*` tokens
- [ ] Replace `gap-3`/`gap-4` → `gap-gap-card-grid-*` or `gap-gap-section-*` tokens
- [ ] Replace `space-y-*`/`space-x-*` similarly

### 5. Widths
- [ ] Replace hardcoded sidebar widths → `w-sidebar-left-*` or `w-sidebar-right-*`

### 6. Border Radius
- [ ] Replace `rounded`/`rounded-md` → `rounded-card`
- [ ] Replace `rounded-sm` → `rounded-button` or `rounded-badge`

---

## Testing Your Changes

After applying design system tokens, test at these viewports:

| Width | How to Test | What to Check |
|-------|-------------|---------------|
| 1024px | DevTools → Responsive → 1024×768 | Compact mode: descriptions hidden, tight spacing |
| 1280px | DevTools → Responsive → 1280×800 | Standard mode: descriptions visible |
| 1440px+ | DevTools → Responsive → 1440×900 | Full mode: generous spacing, larger fonts |

### DevTools Checklist
- [ ] No horizontal scrolling at any width
- [ ] Sidebar fits without overlap
- [ ] Cards display correctly (compact at lg, standard at xl+)
- [ ] Text is legible (may be small at lg — that's expected)
- [ ] All interactive elements are accessible

---

## Token Reference Quick Look

### Typography (font sizes in px)

| Token | lg | xl | 2xl |
|-------|----|----|-----|
| `title-page` | 15 | 16 | 18 |
| `title-section` | 13 | 14 | 15 |
| `title-card` | 12 | 13 | 14 |
| `body` | 12 | 12 | 13 |
| `label` | 10 | 11 | 12 |
| `caption` | 10 | 10 | 11 |
| `micro` | 9 | 9 | 10 |

### Spacing (in px)

| Token | lg | xl | 2xl |
|-------|----|----|-----|
| `pad-card` | 6 | 8 | 12 |
| `pad-card-compact` | 4 | 6 | 8 |
| `margin-section` | 12 | 16 | 24 |
| `margin-element` | 4 | 6 | 8 |
| `gap-section` | 10 | 12 | 16 |
| `gap-card-grid` | 4 | 6 | 8 |
| `gap-element` | 3 | 4 | 6 |
| `gap-tight` | 2 | 2 | 4 |

### Widths (in px)

| Token | lg | xl | 2xl |
|-------|----|----|-----|
| `sidebar-left` | 240 | 280 | 320 |
| `sidebar-right` | 280 | 320 | 384 |

---

## Getting Help

- **Token specifications:** `docs/design-system/DESIGN_SYSTEM.md`
- **Tailwind config:** `tailwind.config.js`
- **Example components:** 
  - `src/components/DataCatalog.tsx` — Cards with compact mode
  - `src/components/Header.tsx` — Page-level layout
  - `src/components/TNCArcGISSidebar.tsx` — Complex sidebar with filters

