# DFT-040 Resolution Summary: Dual-Level Filter Visual Distinction

**Date:** February 5, 2026  
**Status:** ✅ Resolved  
**Decision:** Condensed `FeatureDetailCard` layout at Level 3 — no Level 2 summary bar, no separate "Filter [Noun]" header

---

## The Problem

ANiML and Dendra have two levels of filters in the Browse tab:
- **Level 2 (Layer scope):** "Filter Cameras" / "Filter Sensors" — broad filtering of the feature list
- **Level 3 (Feature scope):** "Filter Images" / "Filter Datapoints" — detailed filtering within a specific feature

DFT-004 established progressive disclosure (Level 2 collapses when user drills into Level 3), and DFT-038 established a shared `FilterSection` component with flat `slate-50` background. But neither specified how the two levels should be visually distinguished when the user is at Level 3.

The initial proposal included a "Level 2 summary bar" showing the collapsed Level 2 filter state. User feedback correctly identified this as irrelevant — Level 2 filter state doesn't affect Level 3 content (cameras exist regardless of how the camera list was filtered).

---

## The Solution: Condensed 6-Zone Layout

When the user drills into a feature (Level 3), the Browse tab uses a condensed layout:

```
┌─────────────────────────────────────────┐
│ ← Back to [Cameras/Sensors]            │  1. Navigation breadcrumb
├─────────────────────────────────────────┤
│ [icon] Feature-ID — Location           │
│ Status • Count           [Clear] [↩]  │  2. Feature identity + actions
│─────────────────────────────────────────│
│  [Filter controls — DFT-038 grid]      │  3. Filter controls
│─────────────────────────────────────────│
│  Showing X of Y [noun]                 │  4. Result count
├─────────────────────────────────────────┤
│  [Results]                             │  5. Results
├─────────────────────────────────────────┤
│  [Pagination / Actions]                │  6. Pagination
└─────────────────────────────────────────┘
```

### What Was Dropped

- **No Level 2 summary bar.** When drilled into CAM-042's images, the Level 2 filter ("All regions, Active") is irrelevant — it doesn't affect images at this camera. The back button is the only Level 2 reference needed.
- **No separate "Filter [Noun]" header at Level 3.** The feature header card provides scope context — you're at CAM-042, the controls below obviously filter CAM-042's images. Adding "Filter Images" is redundant (Nielsen #8).

### Component Structure

| Context | Component | Notes |
|---|---|---|
| Single-level (iNaturalist, DataOne) | `FilterSection` (DFT-038) | Standard: header + grid + footer |
| Level 2 (ANiML cameras, Dendra sensors) | `FilterSection` (DFT-038) | Standard: "Filter Cameras" / "Filter Sensors" |
| Level 3 (drilled into feature) | `FeatureDetailCard` | Embeds filter controls; no separate header |

### Per-Data-Source Application

| Data Source | Feature Header | Filter Controls | Result Count |
|---|---|---|---|
| **ANiML** | `📷 CAM-042 — North Ridge` / `Active • 10,847 images` | Species multi-select, Date range, Deployment dropdown | "Showing 47 of 10,847 images" |
| **Dendra** | `🌧️ RS-042 — North Ridge` / `Active • Rain Gauge • 0.2mm` | Date range, Aggregation dropdown | "Showing 90 datapoints" |

---

## Design Rationale

**Core insight:** Progressive disclosure (DFT-004) means both levels are never fully expanded simultaneously. The distinction problem reduces to: "how does the collapsed Level 2 look different from the active Level 3?" Answer: **don't show collapsed Level 2 at all** — it's irrelevant.

---

## Design Principles Summary

| Principle | Compliant? | How Solution Addresses It |
|-----------|:----------:|---------------------------|
| **Gestalt: Figure-Ground** | ✅ | Active filter controls on `slate-50` grid; feature header on `white` |
| **Gestalt: Proximity** | ✅ | Feature identity + filter actions + controls in one region |
| **Norman: Conceptual Model** | ✅ | "I'm at a camera. I see its info and filters. Back takes me to the list." |
| **Norman: Signifiers** | ✅ | Form controls signal editability; back arrow signals escape |
| **Nielsen #1: Visibility** | ✅ | Feature identity always visible at top of drilled-down view |
| **Nielsen #4: Consistency** | ✅ | Both ANiML and Dendra use same `FeatureDetailCard` pattern |
| **Nielsen #6: Recognition** | ✅ | Feature header provides scope — no need to recall |
| **Nielsen #8: Minimalism** | ✅ | Dropped Level 2 summary bar + "Filter [Noun]" header |
| **Hick's Law** | ✅ | Only one set of filter controls visible |
| **IA: Wayfinding** | ✅ | Back button = "where I came from"; Feature header = "where I am" |
| **IA: Progressive Disclosure** | ✅ | Level 2 fully hidden at Level 3; revealed on back |
| **Fitts's Law** | ✅ | [Clear] and [↩] in feature header row — near eye focus |
| **WCAG: Perceivable** | ✅ | Standard form controls, labeled, keyboard navigable |
| **Motion: Continuity** | ✅ | 150-200ms crossfade between Level 2 and Level 3 views |

---

## Tradeoffs

**What we sacrifice:**
- Visible Level 2 filter state when at Level 3 — acceptable: back button restores full context
- Separate "Filter [Noun]" header — acceptable: feature header provides scope
- Ability to edit Level 2 without navigating back — acceptable: Level 2 doesn't affect Level 3

**What we gain:**
- Maximum vertical space for results (critical at 400px sidebar width)
- Fewer visual regions = faster scanning (Gestalt: Proximity)
- Clean spatial metaphor (drill-in / back-out)
- Consistency between ANiML and Dendra Level 3 views

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-040 marked resolved with full specification

2. **Phase 2 ANiML** (`docs/IMPLEMENTATION/phases/phase-2-animl.md`)
   - Task 2.4: Added DFT-040 decision note, updated acceptance criteria and ASCII diagram

3. **Phase 3 Dendra** (`docs/IMPLEMENTATION/phases/phase-3-dendra.md`)
   - Task 3.5: Added DFT-040 decision note, removed collapsed summary from acceptance criteria
   - Task 3.6: Added DFT-040 decision note, updated acceptance criteria and ASCII diagram

4. **Design System** (`docs/DESIGN-SYSTEM/design-system.md`)
   - Added Dual-Level Filter Pattern section with layout, component interface, and rationale

5. **Master Plan** (`docs/master-plan.md`)
   - Added to Cross-Phase Decisions → UX Decisions table
   - Added changelog entry

6. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-040-resolution-summary.md`

---

**Status:** Ready for implementation (all phase documents updated)
