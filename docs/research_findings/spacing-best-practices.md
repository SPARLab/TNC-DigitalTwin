# Spacing Best Practices for Responsive Web Design

**Research Date:** January 2026  
**Status:** Reference Documentation  
**Purpose:** Evidence-based guidelines for spacing decisions in the Dangermond Preserve Data Catalog

---

## Executive Summary

This document compiles industry best practices for responsive spacing from major design systems (Material Design 3, Apple HIG, IBM Carbon, GitHub Primer) and accessibility standards. The findings inform our spacing token system in `tailwind.config.js`.

**Key Takeaways:**
- Use an 8-point grid (4px half-step) for consistent spacing
- Touch targets: minimum 44×44px (Apple) or 48×48px (Material Design)
- Spacing should compress ~40–50% from desktop to mobile
- Maintain spacing ratios (e.g., 2:1 between sections and elements)
- Use optical spacing adjustments for icons and buttons

---

## 1. Grid System Foundations

### 1.1 The 8-Point Grid

The 8-point grid is the industry standard for UI spacing:

| Value | Pixels | Use Case |
|-------|--------|----------|
| 0.5× | 4px | Micro spacing (icon gaps, tight groupings) |
| **1×** | **8px** | **Default element gap** |
| 1.5× | 12px | Medium element gap |
| **2×** | **16px** | **Standard container padding** |
| 3× | 24px | Section margins |
| 4× | 32px | Large section spacing |
| 6× | 48px | Page-level padding |

**Why 8px?** Divisible by 2 and 4, works well with common screen densities (@1x, @2x, @3x), and aligns with Material Design and iOS standards.

### 1.2 Design System Spacing Scales

| System | Base Unit | Scale Values |
|--------|-----------|--------------|
| Material Design 3 | 4px | 0, 4, 8, 12, 16, 24, 32, 48, 64 |
| Apple HIG | 8pt | 0, 8, 16, 20, 24, 32, 40 |
| IBM Carbon | 2px | 2, 4, 8, 12, 16, 24, 32, 48, 64, 96 |
| GitHub Primer | 4px | 0, 4, 8, 16, 24, 32, 40, 48 |
| Tailwind Default | 4px | 0, 1, 2, 4, 6, 8, 12, 16, 20, 24... |

---

## 2. Spacing Categories and Recommendations

### 2.1 Spacing Taxonomy

| Category | Definition | Desktop Range | Mobile Range |
|----------|------------|---------------|--------------|
| **Page padding** | Container margins, header/footer | 16–48px | 8–16px |
| **Section margin** | Between major content blocks | 24–48px | 12–24px |
| **Container padding** | Card/panel internal padding | 16–24px | 8–16px |
| **Element margin** | Between sibling elements | 8–16px | 4–8px |
| **Gap (tight)** | Between closely related items | 4–8px | 2–4px |

### 2.2 Responsive Spacing Compression

Spacing should compress more aggressively than typography:

| Context | Desktop | Tablet | Mobile | Compression |
|---------|---------|--------|--------|-------------|
| Page padding | 24px | 16px | 8px | 67% |
| Section margin | 24px | 16px | 8px | 67% |
| Container padding | 16px | 12px | 8px | 50% |
| Element gap | 8px | 6px | 4px | 50% |
| Tight gap | 4px | 4px | 2px | 50% |

**Rationale:** Unlike text, spacing doesn't affect readability as directly, so it can compress more to accommodate smaller screens.

---

## 3. Touch Target Guidelines

### 3.1 Minimum Touch Targets

| Standard | Minimum Size | Notes |
|----------|--------------|-------|
| Apple HIG | 44×44pt | Recommended for all tappable elements |
| Material Design | 48×48dp | 40dp with 8dp padding minimum |
| WCAG 2.2 | 44×44px | Target Size (Level AAA) |
| Microsoft Fluent | 32×32px | Minimum, 40×40 recommended |

**Our Recommendation:** 44×44px minimum for all interactive elements on mobile.

### 3.2 Button Sizing Guidelines

| Button Type | Min Height | Min Width | Padding |
|-------------|------------|-----------|---------|
| Primary action | 40–48px | 120px | 16px horizontal |
| Secondary | 36–40px | 80px | 12px horizontal |
| Compact/Icon | 32–36px | 32px | 8px |
| Toolbar | 32px | 32px | 4px |

### 3.3 Implementation in Our System

```
Button padding:
  Desktop: px-3 py-1.5 (12px × 6px) → 36px+ height with text
  Mobile:  px-2 py-1 (8px × 4px)   → Compact but tappable
  
Touch target expansion (mobile):
  Add min-h-[44px] min-w-[44px] on mobile breakpoints
```

---

## 4. Component-Specific Spacing

### 4.1 Cards

| Element | Desktop | Mobile |
|---------|---------|--------|
| Card padding | 16px | 8–12px |
| Card gap (grid) | 16px | 8px |
| Card border-radius | 8px | 6px |
| Internal element gap | 8px | 4–6px |

### 4.2 Sidebars

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar padding | 16px | 8px |
| Section title margin | 16px | 8px |
| Item gap | 8px | 6px |
| Nested item indent | 16px | 12px |

### 4.3 Headers and Navigation

| Element | Desktop | Mobile |
|---------|---------|--------|
| Header height | 48–64px | 44–56px |
| Nav item gap | 16–24px | 8–12px |
| Logo-to-nav gap | 24–32px | 12–16px |
| Header padding-x | 24px | 12px |

### 4.4 Forms and Inputs

| Element | Desktop | Mobile |
|---------|---------|--------|
| Input height | 40px | 44px (larger for touch) |
| Input padding-x | 12px | 12px |
| Label-to-input gap | 4–8px | 4px |
| Form field gap | 16px | 12px |

---

## 5. Spacing Patterns for Data-Dense UIs

Our application displays significant amounts of data. Here are patterns for dense interfaces:

### 5.1 Compact Mode Guidelines

| Context | Standard | Compact | Ultra-Compact |
|---------|----------|---------|---------------|
| Container padding | 16px | 8px | 4px |
| Item gap | 8px | 4px | 2px |
| Section margin | 16px | 8px | 4px |
| Border radius | 8px | 4px | 2px |

### 5.2 Information Density Tradeoffs

| Density Level | Use Case | Risk |
|---------------|----------|------|
| Comfortable | General browsing, mobile | Less data visible |
| **Standard** | **Desktop, data catalogs** | **Balanced** |
| Compact | Dashboards, tables | Reduced scannability |
| Dense | Data tables, lists | Fatigue, misclicks |

**Our Approach:** Standard density for sidebars, Compact for cards in grid view, Comfortable for mobile.

---

## 6. Responsive Spacing Strategies

### 6.1 Scaling Approaches

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Fixed per breakpoint** | Explicit values at each breakpoint | Predictable, testable | More verbose |
| Fluid (clamp) | CSS clamp() for smooth scaling | Smooth transitions | Complex debugging |
| Percentage-based | % of container width | Flexible | Inconsistent |
| Aspect-ratio | Maintain proportions | Visual consistency | Limited use cases |

**Our Choice:** Fixed per breakpoint — matches our typography approach and Tailwind workflow.

### 6.2 Breakpoint Spacing Values

Our implementation follows these ranges:

```
Page padding:
  base: 4px  sm: 6px  md: 8px  lg: 12px  xl: 12px  2xl: 12px

Container padding:
  base: 4px  sm: 6px  md: 8px  lg: 12px  xl: 12px  2xl: 16px

Element gap:
  base: 4px  sm: 4px  md: 4px  lg: 6px   xl: 6px   2xl: 8px

Section margin:
  base: 6px  sm: 8px  md: 12px lg: 16px  xl: 16px  2xl: 24px
```

---

## 7. Sidebar Width Guidelines

### 7.1 Industry Sidebar Widths

| Application | Desktop Width | Collapsed |
|-------------|---------------|-----------|
| VS Code | 200–300px | 48px |
| Slack | 220px | 72px |
| Figma | 240px | — |
| Gmail | 256px | 72px |
| Notion | 240px | 48px |

**Common Range:** 200–300px for desktop, 48–72px for collapsed/icon-only.

### 7.2 Our Sidebar Implementation

```
Sidebar width:
  base: 100% (mobile drawer)
  lg:   192px (12rem)
  xl:   224px (14rem)
  2xl:  256px (16rem)
```

**Rationale:** Our data-dense sidebar content requires slightly wider widths than typical navigation sidebars.

---

## 8. Accessibility Considerations

### 8.1 WCAG 2.2 Spacing Requirements

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| 1.4.12 Text Spacing | AA | Must support 1.5× line height, 2× letter spacing |
| 2.5.5 Target Size | AAA | 44×44px minimum for pointer targets |
| 2.5.8 Target Size (Minimum) | AA | 24×24px minimum OR 44px with spacing |

### 8.2 Implementation Checklist

- [x] Touch targets meet 44px minimum on mobile
- [x] Adequate spacing between interactive elements (≥8px)
- [x] No content overlap when text spacing increased
- [x] Sufficient padding for comfortable interaction

---

## 9. Application to Our Design System

### 9.1 Token Naming Convention

Our pattern: `{role}-{breakpoint}`

```
page-base          → Page padding on mobile
page-lg            → Page padding on desktop
card-base          → Card padding on mobile
gap-large-2xl      → Large gaps on 2xl screens
```

### 9.2 Usage Pattern

```tsx
// Component usage
<div className="p-card-base sm:p-card-sm lg:p-card-lg 2xl:p-card-2xl">
  <h3>Card Content</h3>
</div>

// Gap usage
<div className="flex gap-default-base lg:gap-default-lg 2xl:gap-default-2xl">
  {items.map(item => <Item key={item.id} />)}
</div>
```

### 9.3 Recommended Audit Checks

When implementing spacing tokens:

1. **Visual balance:** Does spacing create clear visual hierarchy?
2. **Touch targets:** Are all interactive elements ≥44px on mobile?
3. **Consistency:** Do similar elements use the same spacing tokens?
4. **Breathing room:** Is content cramped or too sparse?
5. **Responsiveness:** Does layout reflow gracefully at breakpoints?

---

## 10. References

### Design Systems Consulted

1. **Material Design 3** — https://m3.material.io/foundations/layout/understanding-layout
2. **Apple Human Interface Guidelines** — https://developer.apple.com/design/human-interface-guidelines/layout
3. **IBM Carbon Design System** — https://carbondesignsystem.com/guidelines/spacing/overview/
4. **GitHub Primer** — https://primer.style/foundations/primitives/spacing

### Accessibility Standards

1. **WCAG 2.2 Target Size** — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
2. **WCAG 2.1 Text Spacing** — https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html

### Grid System Resources

1. **8-Point Grid** — https://spec.fm/specifics/8-pt-grid
2. **Space in Design Systems** — https://medium.com/eightshapes-llc/space-in-design-systems-188bcbae0d62

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Initial research compilation | Team |

