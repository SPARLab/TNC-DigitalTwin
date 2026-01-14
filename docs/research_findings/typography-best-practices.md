# Typography Best Practices for Responsive Web Design

**Research Date:** January 2026  
**Status:** Reference Documentation  
**Purpose:** Evidence-based guidelines for typography decisions in the Dangermond Preserve Data Catalog

---

## Executive Summary

This document compiles industry best practices for responsive typography from major design systems (Material Design 3, Apple HIG, IBM Carbon, GitHub Primer) and accessibility standards (WCAG 2.1/2.2). The findings inform our design token system in `tailwind.config.js`.

**Key Takeaways:**
- Minimum body text: 14px desktop, 16px mobile (for touch/readability)
- Use modular scales (1.2–1.333 ratio) for harmonious sizing
- Line heights: 1.4–1.6 for body text, 1.1–1.3 for headings
- Font weight variations: Regular (400) for body, Medium (500) for emphasis, Semibold (600) for headings
- Maximum 4–6 distinct font sizes per project for consistency

---

## 1. Type Scale Foundations

### 1.1 Modular Scale Ratios

Type scales use mathematical ratios to create harmonious size relationships:

| Ratio Name | Value | Character | Best For |
|------------|-------|-----------|----------|
| Minor Second | 1.067 | Very tight | Dense data UIs |
| Major Second | 1.125 | Tight | Compact interfaces |
| **Minor Third** | **1.200** | **Balanced** | **Most web apps** |
| Major Third | 1.250 | Moderate | Marketing sites |
| Perfect Fourth | 1.333 | Generous | Editorial content |
| Golden Ratio | 1.618 | Dramatic | Hero sections |

**Our Choice:** Minor Third (1.2) — provides clear hierarchy without excessive size jumps, ideal for data-dense applications.

### 1.2 Industry Type Scale Comparison

| Role | Material Design 3 | Apple HIG | IBM Carbon | Tailwind Default | **Our System** |
|------|-------------------|-----------|------------|------------------|----------------|
| Display/Hero | 57px | 34pt | 54px | 48px (text-5xl) | N/A |
| Page Title | 45px | 28pt | 42px | 30px (text-3xl) | 20px (2xl) |
| Section Title | 24px | 22pt | 28px | 24px (text-2xl) | 18px (2xl) |
| Card Title | 16px | 17pt | 20px | 18px (text-lg) | 16px (2xl) |
| Body | 14–16px | 17pt | 14px | 14px (text-sm) | 14px (2xl) |
| Label/Caption | 12px | 12pt | 12px | 12px (text-xs) | 12px (2xl) |
| Micro | 10px | 11pt | — | 10px | 10px (2xl) |

---

## 2. Font Size Guidelines by Context

### 2.1 Minimum Readable Sizes

| Context | Minimum Size | Rationale |
|---------|--------------|-----------|
| Body text (desktop) | 14px | WCAG readability |
| Body text (mobile) | 16px | Prevents auto-zoom on iOS |
| Labels/captions | 12px | Absolute minimum for legibility |
| Touch interfaces | 16px | Apple HIG recommendation |

**WCAG Note:** While WCAG doesn't specify exact pixel sizes, it requires text to be "resizable up to 200%" without loss of functionality. Using relative units (rem) helps meet this criterion.

### 2.2 Responsive Font Size Ranges

Based on analysis of Material Design, Apple HIG, and IBM Carbon:

| Role | Mobile (<640px) | Tablet (640–1024px) | Desktop (>1024px) |
|------|-----------------|---------------------|-------------------|
| Page Title | 14–16px | 16–18px | 18–24px |
| Section Heading | 13–14px | 14–16px | 16–18px |
| Card Title | 12–13px | 13–14px | 14–16px |
| Body Text | 12–14px | 13–14px | 14–16px |
| Labels | 10–11px | 11–12px | 12px |

**Insight:** Font sizes should compress ~20–30% from desktop to mobile, not 50%+. Excessive reduction hurts readability.

### 2.3 Our Implementation

Our system in `tailwind.config.js` follows these ranges:

```
Page Title:    14px (mobile) → 16px (tablet) → 18px (lg) → 20px (2xl)
Section Title: 13px (mobile) → 14px (tablet) → 16px (lg) → 18px (2xl)
Card Title:    12px (mobile) → 13px (tablet) → 14px (md) → 16px (lg)
Body:          12px (mobile) → 13px (tablet) → 14px (lg)
Labels:        10px (mobile) → 11px (sm) → 12px (md+)
```

---

## 3. Line Height Best Practices

### 3.1 General Guidelines

| Text Type | Recommended Line Height | Notes |
|-----------|------------------------|-------|
| Headings | 1.1–1.3 | Tighter for visual weight |
| Body (short) | 1.4–1.5 | Single paragraphs, cards |
| Body (long) | 1.5–1.7 | Articles, documentation |
| Labels | 1.2–1.4 | Compact UI elements |

### 3.2 Design System Comparisons

| System | Body Line Height | Heading Line Height |
|--------|------------------|---------------------|
| Material Design 3 | 1.5 (24px/16px) | 1.2–1.3 |
| Apple HIG | 1.29 (22pt/17pt) | 1.07–1.14 |
| IBM Carbon | 1.5 | 1.25 |
| GitHub Primer | 1.5 | 1.25 |
| **Our System** | **1.6** | **1.2** |

**Our Choice:** 1.6 for body (excellent readability), 1.2 for headings (compact, authoritative)

---

## 4. Font Weight Guidelines

### 4.1 Weight Scale

| Weight | Name | Use Case |
|--------|------|----------|
| 300 | Light | De-emphasized text, large displays |
| **400** | **Regular** | **Body text, descriptions** |
| **500** | **Medium** | **Emphasis, card titles, labels** |
| **600** | **Semibold** | **Headings, important UI elements** |
| 700 | Bold | Strong emphasis, CTAs |

### 4.2 Recommendations by Element

| Element | Recommended Weight | Notes |
|---------|-------------------|-------|
| Page titles | 600 (Semibold) | Authority, hierarchy |
| Section headings | 600 (Semibold) | Clear section breaks |
| Card titles | 500 (Medium) | Scannable, not overwhelming |
| Body text | 400 (Regular) | Comfortable reading |
| Labels/badges | 500 (Medium) | Legible at small sizes |
| Buttons | 500–600 | Actionable, visible |

**Insight:** Avoid using Bold (700) for text smaller than 14px—it reduces legibility and looks heavy.

---

## 5. Responsive Typography Strategies

### 5.1 Approaches Compared

| Approach | Pros | Cons |
|----------|------|------|
| **Static breakpoints** | Predictable, easy to implement | Jump between sizes |
| Fluid (clamp) | Smooth scaling | Complex, harder to debug |
| Container queries | Component-based | Browser support, complexity |
| Viewport-based (vw) | Scales with screen | Can get too small/large |

**Our Choice:** Static breakpoints with Tailwind utilities. Rationale:
- Predictable behavior for testing
- Works with existing Tailwind workflow
- Easier to maintain and debug
- Good browser support

### 5.2 Breakpoint Strategy

Following mobile-first principles:

```
base (< 640px)  → Mobile phones
sm (640px+)     → Large phones, small tablets
md (768px+)     → Tablets portrait
lg (1024px+)    → Tablets landscape, small laptops
xl (1280px+)    → Desktop monitors
2xl (1440px+)   → Large desktop, external monitors
```

**Critical Breakpoints for Typography:**
- **640px (sm):** First size increase from base mobile
- **1024px (lg):** Major jump to desktop typography
- **1440px (2xl):** Final expansion for large screens

---

## 6. Accessibility Considerations

### 6.1 WCAG 2.1/2.2 Requirements

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| 1.4.4 Resize Text | AA | Text resizable to 200% |
| 1.4.10 Reflow | AA | No horizontal scroll at 320px |
| 1.4.12 Text Spacing | AA | Must tolerate spacing changes |

### 6.2 Implementation Checklist

- [x] Use relative units (rem) for font sizes
- [x] Ensure minimum 12px at smallest breakpoint
- [x] Test at 200% browser zoom
- [x] Verify line height adjustments don't break layout
- [x] Support system font-size preferences

### 6.3 Minimum Contrast Ratios

| Text Type | Normal Text | Large Text (≥18px) |
|-----------|-------------|-------------------|
| AA | 4.5:1 | 3:1 |
| AAA | 7:1 | 4.5:1 |

---

## 7. Application to Our Design System

### 7.1 Token Naming Convention

Our pattern: `text-{role}-{breakpoint}`

```
text-title-page-base     → Page titles on mobile
text-title-page-lg       → Page titles on desktop
text-body-base           → Body text on mobile
text-label-md            → Labels on tablet+
```

### 7.2 Usage Pattern

```tsx
// Component usage
<h1 className="text-title-page-base sm:text-title-page-sm lg:text-title-page-lg 2xl:text-title-page-2xl">
  Dangermond Preserve Data Catalog
</h1>
```

### 7.3 Recommended Audit Checks

When implementing typography tokens:

1. **Visual hierarchy:** Can users scan and find key information?
2. **Readability:** Is body text comfortable to read for extended periods?
3. **Touch targets:** Is text next to interactive elements large enough?
4. **Consistency:** Do similar elements use the same token?
5. **Responsiveness:** Does text remain legible across breakpoints?

---

## 8. References

### Design Systems Consulted

1. **Material Design 3** — https://m3.material.io/styles/typography
2. **Apple Human Interface Guidelines** — https://developer.apple.com/design/human-interface-guidelines/typography
3. **IBM Carbon Design System** — https://carbondesignsystem.com/guidelines/typography/overview/
4. **GitHub Primer** — https://primer.style/foundations/typography
5. **Tailwind CSS Documentation** — https://tailwindcss.com/docs/font-size

### Accessibility Standards

1. **WCAG 2.1** — https://www.w3.org/WAI/WCAG21/quickref/
2. **WCAG 2.2** — https://www.w3.org/TR/WCAG22/

### Typography Resources

1. **Type Scale Calculator** — https://typescale.com/
2. **Modular Scale** — https://www.modularscale.com/
3. **Practical Typography** — https://practicaltypography.com/

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Initial research compilation | Team |

