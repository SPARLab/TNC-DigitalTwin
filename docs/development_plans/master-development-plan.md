# Master Development Plan - V2 Digital Catalog

**Created:** January 23, 2026  
**Last Updated:** January 23, 2026  
**Target Deadline:** February 20, 2026  
**Status:** 🟡 Planning

---

## Overview

This document is the single source of truth for the V2 Digital Catalog paradigm shift. It tracks phase status, cross-phase decisions, and blocking issues.

**The Paradigm Shift:**
- **Left sidebar:** Persistent layer browser (find and pin layers)
- **Right sidebar:** Layer workspace (browse, query, bookmark, export)
- **Floating widgets:** Pinned Layers (top-left) + Bookmarked Features (top-right)
- **Map:** Shows all pinned layers simultaneously

**Key Reference Documents:**
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`
- Mockups: `mockups/02a-02f` (unified layout, data source browse views, export builder)
- Previous mockup plan: `docs/development_plans/archive/v2-pin-bookmark-export-mockup-plan.md`

---

## Phase Status

| Phase | Name | Status | Progress | Branch | Blocking? |
|-------|------|--------|----------|--------|-----------|
| 0 | Foundation | ⚪ Not Started | 0 / 6 tasks | `v2/foundation` | YES - blocks all |
| 1 | iNaturalist | ⚪ Not Started | 0 / 5 tasks | `v2/inaturalist` | No |
| 2 | ANiML | ⚪ Not Started | 0 / 7 tasks | `v2/animl` | No |
| 3 | Dendra | ⚪ Not Started | 0 / 6 tasks | `v2/dendra` | No |
| 4 | DataOne | ⚪ Not Started | 0 / 5 tasks | `v2/dataone` | No |
| 5 | Export Builder | ⚪ Not Started | 0 / 4 tasks | `v2/export` | No |
| 6 | Polish & Consistency | ⚪ Not Started | 0 / ? tasks | `v2/polish` | No |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Phase Dependencies

```
Phase 0: Foundation
    │
    ├──► Phase 1: iNaturalist ──────────────────────────┐
    │                                                    │
    ├──► Phase 2: ANiML ────────────────────────────────┤
    │                                                    │
    ├──► Phase 3: Dendra ───────────────────────────────┼──► Phase 5: Export Builder ──► Phase 6: Polish
    │                                                    │
    └──► Phase 4: DataOne ──────────────────────────────┘
```

**Parallelization:**
- Phases 1-4 can be worked on simultaneously (different Cursor windows, different branches)
- Each phase has its own branch, merged to `v2/main` when complete
- Phase 5 requires all data sources to be functional
- Phase 6 is the final consistency pass

---

## Cross-Phase Decisions

> **IMPORTANT:** When any Cursor agent makes a styling or architectural decision that affects other phases, they MUST document it here AND in `design-system.md`.

### Architectural Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| Code structure (v2/ folder approach) | ✅ Decided | Will | Jan 23 | See "Code Structure" section below |
| State management for pinned layers | ⚪ TBD | - | - | |
| State management for bookmarks | ⚪ TBD | - | - | |
| Caching strategy | ⚪ TBD | - | - | See Phase 2 task 2.7 |

### Styling Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| Overall color palette | ⚪ TBD | - | - | Mockups use emojis/colors - need to tone down |
| Right sidebar header styling | ⚪ TBD | - | - | |
| Card component styling | ⚪ TBD | - | - | |
| Data source accent colors | ⚪ TBD | - | - | |

### UX Decisions

| Decision | Status | Made By | Date | Details |
|----------|--------|---------|------|---------|
| Pin/Bookmark paradigm | ✅ Decided | Team | Jan 21 | See paradigm doc |
| Left sidebar always visible | ✅ Decided | Team | Jan 20 | Confirmed in feedback |
| Bookmark widget (right-aligned) | ⏳ Awaiting Feedback | - | - | Feedback expected Monday |
| Pin vs visibility behavior (DFT-001) | ✅ Decided | Will | Jan 27 | Model C: Selection = active, pin separate. See DFT-001 resolution |
| Filter representation in widgets | 🟡 A/B Testing | Will | Jan 27 | Text vs funnel emoji (🌪️). Debug toggle for user feedback |
| Auto-collapse widgets for time-series | ✅ Decided | Will | Jan 29 | Widgets auto-collapse when viewing time-series data (e.g., Dendra pop-ups) to reduce screen crowding. See DFT-005 resolution |

---

## Code Structure

**Decided:** January 23, 2026

```
src/
├── App.tsx                        ← Router: v2 vs legacy
├── legacy/                        ← Current app (keep for reference)
│   └── LegacyApp.tsx
├── v2/                            ← New paradigm
│   ├── V2App.tsx                  ← New entry point
│   ├── components/
│   │   ├── LeftSidebar/
│   │   ├── RightSidebar/
│   │   │   ├── iNaturalist/
│   │   │   ├── ANiML/
│   │   │   ├── Dendra/
│   │   │   └── DataOne/
│   │   ├── FloatingWidgets/
│   │   │   ├── PinnedLayersWidget/
│   │   │   └── BookmarkedItemsWidget/
│   │   └── Map/
│   ├── hooks/
│   │   ├── usePinnedLayers.ts
│   │   └── useBookmarks.ts
│   └── store/                     ← If using state management
├── shared/                        ← Reusable across v1/v2
│   ├── services/                  ← animlService, dendraService, etc.
│   ├── types/
│   └── utils/
└── components/                    ← Legacy components
```

---

## Blocking Issues

> List anything preventing progress on any phase.

| Issue | Blocking | Status | Owner | Notes |
|-------|----------|--------|-------|-------|
| Awaiting team feedback on bookmark widget | Phase 0 finalization | ⏳ Waiting | Will | Feedback expected Monday |
| ANiML performance (8-12s load time) | Phase 2 | ⚪ Needs investigation | Dan | See Phase 2 task 2.7 |

---

## Team Responsibilities

| Person | Primary Role | Phases |
|--------|--------------|--------|
| Will | Frontend lead, Cursor orchestration | All phases |
| Dan | Backend, performance, ArcGIS services | Phase 0 (services), Phase 2 (caching) |
| (Others) | Feedback, review | All phases |

---

## Cursor Agent Instructions

When working on any phase:

1. **Before starting a task:**
   - Read the phase document for context
   - Check this master plan for cross-phase decisions
   - Check `design-system.md` for styling decisions

2. **After completing a task:**
   - Update the task status in the phase document
   - Update the phase progress in this master plan
   - If you made a decision that affects other phases, document it in both:
     - The "Cross-Phase Decisions" section above
     - The `design-system.md` file

3. **If you encounter a blocking issue:**
   - Add it to the "Blocking Issues" section above
   - Note it in the phase document

4. **If you make a styling decision:**
   - Document it in `design-system.md` with the rationale
   - Reference the file path where it's implemented

---

## Phase Documents

- **Phase 0:** `docs/development_plans/phases/phase-0-foundation.md`
- **Phase 1:** `docs/development_plans/phases/phase-1-inaturalist.md`
- **Phase 2:** `docs/development_plans/phases/phase-2-animl.md`
- **Phase 3:** `docs/development_plans/phases/phase-3-dendra.md`
- **Phase 4:** `docs/development_plans/phases/phase-4-dataone.md`
- **Phase 5:** `docs/development_plans/phases/phase-5-export-builder.md`
- **Phase 6:** `docs/development_plans/phases/phase-6-polish.md`

---

## Change Log

| Date | Phase | Change | By |
|------|-------|--------|-----|
| Jan 23, 2026 | - | Created master plan and phase documents | Will + Claude |
| Jan 27, 2026 | Phase 0 | Resolved DFT-001: Pin vs visibility behavior (Model C adopted) | Will + Claude |
| Jan 27, 2026 | Phase 0 | Added A/B testing for filter representation (text vs funnel emoji) | Will + Claude |
| Jan 29, 2026 | Phase 0 | Resolved DFT-005: Auto-collapse widgets when viewing time-series data | Will + Claude |

