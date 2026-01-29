# Design System - V2 Digital Catalog

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Purpose:** Track all styling and design decisions so Cursor agents don't reinvent the wheel.

---

## How to Use This Document

When you make a styling decision while working on any phase:
1. Add it to the appropriate section below
2. Include the rationale
3. Reference the file path where it's implemented
4. Update `master-development-plan.md` "Cross-Phase Decisions" section

---

## Color Palette

> **Status:** ⚪ Not Decided  
> **Note:** Current mockups use too many colors/emojis. Need to tone down for production.

### Primary Colors

| Name | Value | Usage | Decided |
|------|-------|-------|---------|
| TNC Green (Primary) | `#2e7d32` | Header, primary actions | TBD |
| TNC Green Dark | `#1b5e20` | Hover states | TBD |

### Neutral Colors

| Name | Value | Usage | Decided |
|------|-------|-------|---------|
| Sidebar Background | TBD | Left/Right sidebars | TBD |
| Card Background | TBD | Layer cards, feature cards | TBD |
| Border Color | TBD | Dividers, card borders | TBD |

### Data Source Accent Colors

| Data Source | Color | Tailwind Class | Decided |
|-------------|-------|----------------|---------|
| iNaturalist | TBD | TBD | TBD |
| ANiML | TBD | TBD | TBD |
| Dendra | TBD | TBD | TBD |
| DataOne | TBD | TBD | TBD |

### Semantic Colors

| Name | Value | Usage | Decided |
|------|-------|-------|---------|
| Pinned State | TBD | Pinned layer highlight | TBD |
| Bookmark State | TBD | Bookmarked feature indicator | TBD |
| Active Query | TBD | Query badge/indicator | TBD |
| Error | TBD | Error states | TBD |
| Success | TBD | Success states | TBD |

---

## Typography

> **Status:** ⚪ Not Decided

### Font Family

| Usage | Font | Tailwind Class | Decided |
|-------|------|----------------|---------|
| Primary | TBD | TBD | TBD |
| Monospace (code, IDs) | TBD | TBD | TBD |

### Font Sizes

| Element | Size | Tailwind Class | Decided |
|---------|------|----------------|---------|
| Right sidebar header | TBD | TBD | TBD |
| Layer name in list | TBD | TBD | TBD |
| Card title | TBD | TBD | TBD |
| Card body text | TBD | TBD | TBD |
| Badge text | TBD | TBD | TBD |
| Button text | TBD | TBD | TBD |

---

## Spacing

> **Status:** ⚪ Not Decided

| Element | Spacing | Tailwind Class | Decided |
|---------|---------|----------------|---------|
| Card padding | TBD | TBD | TBD |
| List item gap | TBD | TBD | TBD |
| Section gap | TBD | TBD | TBD |
| Sidebar padding | TBD | TBD | TBD |

---

## Component Patterns

### Layer Card (Left Sidebar)

```
Status: ⚪ Not Decided
File: TBD

┌─────────────────────────────────────────┐
│ [eye icon]  Layer Name           [pin] │
│             12 features                 │
└─────────────────────────────────────────┘
```

**Decisions:**
- (none yet)

### Feature Card (Right Sidebar Browse)

```
Status: ⚪ Not Decided
File: TBD

┌─────────────────────────────────────────┐
│ [icon]  Feature Title                   │
│         Subtitle / metadata             │
│         Description text...             │
│                                         │
│ [View on Map]  [Bookmark]               │
└─────────────────────────────────────────┘
```

**Decisions:**
- (none yet)

### Pinned Layer Widget Item

```
Status: ⚪ Not Decided
File: TBD

┌─────────────────────────────────────────┐
│ [eye]  Layer Name                    ✕  │
│        ⚡ Filtered: ... (X of Y)        │
│        [Edit Query] [Clear]             │
└─────────────────────────────────────────┘
```

**Decisions:**
- (none yet)

### Bookmarked Feature Widget Card

```
Status: ⚪ Not Decided
File: TBD

┌─────────────────────────────────────────┐
│ [icon]  Feature Name → Filter Context   │
│         Source • Count • [View] [✕]     │
└─────────────────────────────────────────┘
```

**Decisions:**
- (none yet)

---

## Icons

> **Status:** ⚪ Not Decided  
> **Recommendation:** Use Lucide icons instead of emojis for production

| Concept | Mockup (emoji) | Production (Lucide) | Decided |
|---------|----------------|---------------------|---------|
| Pin layer | 📌 | TBD | TBD |
| Bookmark feature | 🔖 | TBD | TBD |
| Visibility toggle | 👁️ | TBD | TBD |
| Query/Filter active | ⚡ | TBD | TBD |
| Camera trap | 📷 | TBD | TBD |
| Sensor | 🌡️ | TBD | TBD |
| Dataset | 📄 | TBD | TBD |
| Species | 🦎 | TBD | TBD |

---

## Tailwind Configuration

> **Status:** ⚪ Not Decided  
> **File:** `tailwind.config.js`

### Approach Decision

**Question:** How to balance theming flexibility with LLM-friendliness?

**Options:**
1. **Direct colors everywhere** (`bg-emerald-700`) - Most explicit, easiest for LLM
2. **Semantic tokens in config** (`bg-tnc-green`) - Themeable, slightly harder for LLM
3. **CSS custom properties** (`bg-[var(--primary)]`) - Most flexible, hardest for LLM

**Decision:** TBD

---

## Responsive Design

> **Status:** ⚪ Not Decided

| Breakpoint | Behavior | Decided |
|------------|----------|---------|
| Desktop (1280px+) | Full layout: left sidebar + map + right sidebar | TBD |
| Laptop (1024-1279px) | TBD | TBD |
| Tablet (768-1023px) | TBD | TBD |
| Mobile (<768px) | TBD (may not support for V2) | TBD |

---

## Animation & Transitions

> **Status:** ⚪ Not Decided

| Element | Animation | Duration | Decided |
|---------|-----------|----------|---------|
| Sidebar expand/collapse | TBD | TBD | TBD |
| Widget expand/collapse | TBD | TBD | TBD |
| Hover states | TBD | TBD | TBD |
| Loading states | TBD | TBD | TBD |

---

## Change Log

| Date | Decision | Made By | Rationale |
|------|----------|---------|-----------|
| Jan 23, 2026 | Created design system document | Will + Claude | Need to track styling decisions across phases |

