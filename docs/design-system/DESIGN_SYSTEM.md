# Design System for Data-Dense Applications

**Created:** January 2026  
**Updated:** January 2026  
**Status:** Active — Master Design System  
**Target:** Dangermond Preserve Data Catalog (11 data sources)

---

## Design Philosophy

### Optimization Target
**Maximum relevant information per screen** while maintaining acceptable readability.

### Key Principles
1. **Information density over comfort** — Users can zoom if needed (`Cmd +`)
2. **Aggressive responsive scaling** — Smaller screens get smaller text
3. **Consistency across data sources** — All 11 sources use the same tokens
4. **Desktop-only** — Optimized for 27" monitors, acceptable on 14" laptops, not designed for tablets/phones

---

## Supported Breakpoints

| Breakpoint | Pixel Range | Real-World Devices | Experience Level |
|------------|-------------|-------------------|------------------|
| **lg** | 1024–1279px | 13" MacBook (Larger Text), 14" MacBook (Larger Text) | **Compact** |
| **xl** | 1280–1439px | 13" MacBook (Default), Windows laptops | **Standard Laptop** |
| **2xl** | ≥1440px | 14" MacBook (Default), external monitors, desktops | **Desktop** |
| **<1024px** | — | Tablets, phones | **Blocked** (show "Desktop Required") |

### Device Reference

| Device | Display Setting | Effective Width | Breakpoint |
|--------|-----------------|-----------------|------------|
| 13" MacBook Air/Pro | Larger Text | ~1024px | lg (minimum) |
| 14" MacBook Pro | Larger Text | ~1147px | lg |
| 13" MacBook Air/Pro | Default | ~1280px | xl |
| 14" MacBook Pro | Default | ~1512px | 2xl |
| 15" MacBook Air | Default | ~1680px | 2xl |
| External monitor | 1920×1080 | 1920px | 2xl |
| 27" monitor | 2560×1440 | 2560px | 2xl |

---

## Typography

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `title-page` | 15px | 16px | 18px | Main page headings |
| `title-section` | 13px | 14px | 15px | Sidebar headers, section titles |
| `title-card` | 12px | 13px | 14px | Card titles, list item titles |
| `body` | 12px | 12px | 13px | Descriptions, body text |
| `label` | 10px | 11px | 12px | Metadata, badges, form labels |
| `caption` | 10px | 10px | 11px | Timestamps, secondary info |

### Line Heights

| Text Type | Line Height |
|-----------|-------------|
| Titles | 1.2 |
| Body | 1.4 |
| Labels/Captions | 1.3 |

### Font Weights

| Role | Weight | Tailwind Class |
|------|--------|----------------|
| Page title | 600 | `font-semibold` |
| Section title | 600 | `font-semibold` |
| Card title | 500 | `font-medium` |
| Body | 400 | `font-normal` |
| Label/Caption | 500 | `font-medium` |

---

## Padding (Internal spacing within containers)

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `pad-page` | 10px | 12px | 16px | Header, footer, main containers |
| `pad-card` | 6px | 8px | 12px | Card interiors |
| `pad-card-compact` | 4px | 6px | 8px | Compact card variant |
| `pad-button` | 4px 8px | 6px 10px | 6px 12px | Button padding (vertical × horizontal) |
| `pad-input` | 6px 8px | 8px 10px | 8px 12px | Form input padding |

---

## Margins (External spacing between elements)

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `margin-section` | 12px | 16px | 24px | Between major sections |
| `margin-element` | 4px | 6px | 8px | Between sibling elements |
| `margin-label` | 2px | 3px | 4px | Label to input, icon to text |

---

## Flex/Grid Gaps

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `gap-section` | 10px | 12px | 16px | Between major UI sections |
| `gap-card-grid` | 4px | 6px | 8px | Between cards in a grid/list |
| `gap-element` | 3px | 4px | 6px | Between elements in a row/column |
| `gap-tight` | 2px | 2px | 4px | Icon to label, very tight groupings |

---

## Sidebar Widths

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `sidebar-left` | 240px | 280px | 320px | Left data catalog sidebar |
| `sidebar-right` | 280px | 320px | 384px | Right detail sidebar |

---

## Header/Subheader Heights

| Token | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) | Use Case |
|-------|----------------------|----------------------|-------------------|----------|
| `header` | 40px | 48px | 56px | Main header, filter subheader |

Both header and subheader use the same fixed height to ensure visual consistency across the top bars.

---

## Card Modes

### Card Properties by Breakpoint

| Property | **lg** (1024–1279px) | **xl** (1280–1439px) | **2xl** (≥1440px) |
|----------|----------------------|----------------------|-------------------|
| **Style** | Compact | Standard | Standard |
| **Height** | ~36px | ~60px | ~80px |
| **Title** | Visible (12px) | Visible (13px) | Visible (14px) |
| **Description** | **Hidden** | 1 line, truncated | 2 lines |
| **Badge** | Abbreviated (3-4 chars) | Full text | Full text |
| **Padding** | 4px | 8px | 12px |
| **Gap between cards** | 4px | 6px | 8px |

### Visual Examples

**lg (Compact) — 1024–1279px:**
```
┌──────────────────────────────────┐
│ 🗺️  Map Layers             [Arc] │  ← 12px title, abbreviated badge
└──────────────────────────────────┘
Height: 36px | Padding: 4px | No description
```

**xl (Standard) — 1280–1439px:**
```
┌──────────────────────────────────┐
│ 🗺️  Map Layers          [ArcGIS] │  ← 13px title
│ Curated GIS layers including...  │  ← 12px, 1 line truncated
└──────────────────────────────────┘
Height: 60px | Padding: 8px
```

**2xl (Full) — ≥1440px:**
```
┌──────────────────────────────────┐
│ 🗺️  Map Layers          [ArcGIS] │  ← 14px title
│ Curated GIS layers including     │  ← 13px, 2 lines
│ boundaries, vegetation, fire...  │
└──────────────────────────────────┘
Height: 80px | Padding: 12px
```

---

## Mobile/Tablet Blocking

For viewports <1024px, display a blocking message instead of the application.

### Message Content

```
┌─────────────────────────────────────────┐
│                                         │
│            🖥️ Desktop Required          │
│                                         │
│  The Dangermond Preserve Data Catalog   │
│  is optimized for desktop browsers.     │
│                                         │
│  Please visit on a laptop or desktop    │
│  computer for the best experience.      │
│                                         │
│  Minimum supported width: 1024px        │
│                                         │
│  Tip: If you're on a laptop, try        │
│  reducing your display scaling or       │
│  browser zoom level.                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Consistency Framework for 11 Data Sources

All data source sidebars MUST follow this structure:

```
┌─ Source Header ─────────────────────────┐
│ {Icon} {Source Name}         {Badge}    │  ← title-section
│ {Count} results from {timeframe}        │  ← label
├─────────────────────────────────────────┤
│ [🔍 Search input]                       │  ← body
│ [▼ Filter dropdown]                     │  ← body
├─────────────────────────────────────────┤
│ {DataCard}                              │  ← Compact or Standard
│ {DataCard}                              │
│ {DataCard}                              │
│ ...scrollable...                        │
└─────────────────────────────────────────┘
```

### Data Sources Covered

1. ArcGIS Hub (Map Layers)
2. iNaturalist (Wildlife Observations)
3. eBird (Bird Sightings)
4. CalFlora (Plants)
5. Animl (Camera Traps)
6. Dendra (Weather Stations)
7. LiDAR
8. Drone Imagery
9. DataONE
10. MODIS (planned)
11. GBIF (planned)

---

## Testing Strategy

### Breakpoint Testing Matrix

| Test Scenario | Viewport | Expected Result |
|---------------|----------|-----------------|
| Below minimum | 1023px | "Desktop Required" message |
| Minimum (lg) | 1024px | Compact cards, tight spacing |
| Standard laptop (xl) | 1280px | Standard cards, normal spacing |
| Desktop threshold (2xl) | 1440px | Full cards, generous spacing |
| 14" MacBook Default | 1512px | Full experience |
| Full HD monitor | 1920px | Full experience |
| 27" monitor | 2560px | Full experience |

### Browser Testing

| Browser | Priority |
|---------|----------|
| Chrome | Primary |
| Firefox | Secondary |
| Safari | Secondary |
| Edge | Tertiary |

### Manual Testing Checklist

- [ ] "Desktop Required" message appears below 1024px
- [ ] Cards switch to compact mode at lg breakpoint
- [ ] All 11 data sources render consistently
- [ ] Sidebars fit without overlap at all breakpoints
- [ ] No horizontal scrolling at any supported width
- [ ] Text is legible (may need reading glasses at lg)

---

## Implementation Reference

### Tailwind Config Structure

The design tokens should be implemented in `tailwind.config.js` following this naming pattern:

```javascript
// Typography: text-{role}-{breakpoint}
fontSize: {
  'title-page-lg': ['0.9375rem', { lineHeight: '1.2', fontWeight: '600' }],  // 15px
  'title-page-xl': ['1rem', { lineHeight: '1.2', fontWeight: '600' }],       // 16px
  'title-page-2xl': ['1.125rem', { lineHeight: '1.2', fontWeight: '600' }],  // 18px
  // ... etc
}

// Spacing: {type}-{role}-{breakpoint}
spacing: {
  'pad-page-lg': '0.625rem',   // 10px
  'pad-page-xl': '0.75rem',    // 12px
  'pad-page-2xl': '1rem',      // 16px
  // ... etc
}

// Widths: {component}-{breakpoint}
width: {
  'sidebar-left-lg': '15rem',   // 240px
  'sidebar-left-xl': '17.5rem', // 280px
  'sidebar-left-2xl': '20rem',  // 320px
  // ... etc
}
```

### Usage in Components

```tsx
// Typography
<h1 className="text-title-page-lg xl:text-title-page-xl 2xl:text-title-page-2xl">
  Dangermond Preserve Data Catalog
</h1>

// Padding
<div className="p-pad-page-lg xl:p-pad-page-xl 2xl:p-pad-page-2xl">

// Gaps
<div className="flex gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">

// Sidebar width
<aside className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl">
```

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Initial draft (consumer app approach) | Team |
| 2026-01-13 | Revised for data-dense application | Team |
| 2026-01-13 | Added current state analysis | Team |
| 2026-01-13 | Finalized breakpoints, typography, spacing, card modes | Team |
| 2026-01-13 | Promoted to master design system | Team |

