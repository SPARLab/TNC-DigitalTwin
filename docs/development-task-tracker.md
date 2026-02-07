# Development Task Tracker — V2 Digital Catalog

**Last Updated:** February 6, 2026  
**Current Phase:** Phase 0 (Foundation) — 🟡 In Progress  
**Target Deadline:** February 20, 2026 (14 days remaining)

---

## Quick Status

| Phase | Status | Progress | Branch | Blocking? |
|-------|--------|----------|--------|-----------|
| **0. Foundation** | 🟡 In Progress | ~85% | `v2/foundation` | YES — blocks all |
| 1. iNaturalist | ⚪ Not Started | 0% | `v2/inaturalist` | No |
| 2. ANiML | ⚪ Not Started | 0% | `v2/animl` | No |
| 3. Dendra | ⚪ Not Started | 0% | `v2/dendra` | No |
| 4. DataOne | ⚪ Not Started | 0% | `v2/dataone` | No |
| 5. Export Builder | ⚪ Not Started | 0% | `v2/export` | No |
| 6. Polish & Consistency | ⚪ Not Started | 0% | `v2/polish` | No |

**Status Legend:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## Phase 0: Foundation — Current Status

### ✅ Completed (Feb 6, 2026)

- [x] **0.1** App Shell & Router — v1/v2 toggle via `?v2` URL param
- [x] **0.2** Left Sidebar — 14 categories, layer rows, search, pin/eye interactions
- [x] **0.3** Pinned Layers State Management — `LayerContext` with undo support
- [x] **0.4** Bookmarks State Management — `BookmarkContext` with grouping
- [x] **0.5** Map Layers Widget — Active (amber) + Pinned (blue) sections, expandable panels
- [x] **0.6** Bookmarked Items Widget — Grouped rows, 3 bookmark variants
- [x] **0.7** Right Sidebar Shell — Empty state, TabBar (Overview | Browse), header

**Files Created:** 27 files, 1,748 lines total  
**Architecture:** Clean component separation, all files <200 lines for Cursor context windows

### 🟡 Remaining (Phase 0)

- [ ] **0.4** Map Container — Replace placeholder with ArcGIS WebMap integration
  - Reference: `docs/IMPLEMENTATION/phases/phase-0-foundation.md` Task 0.4
  - Current: Placeholder div with "ArcGIS Map" text
  - Needed: Real ArcGIS JS API 4.28 WebMap, GraphicsLayers per data source, z-order control

- [ ] **0.5** Drag-and-Drop Reorder — Implement drag handles for pinned layers
  - Reference: `docs/PLANNING/component-specs/map-layers-widget.md` DFT-034
  - Current: Drag handles render but don't function
  - Needed: `@dnd-kit/core` integration, visual feedback (60% opacity, 2deg rotation), keyboard support

- [ ] **0.6** Map Feature Highlight — Hover bookmark row → highlight on map
  - Reference: `docs/PLANNING/component-specs/bookmarked-items-widget.md` DFT-036
  - Current: Placeholder (no map integration yet)
  - Needed: Cyan ring highlight, off-screen indicator, keyboard support

### 📋 Phase 0 Acceptance Criteria

- [x] Clean component architecture with TypeScript
- [x] All 7 Phase 0 tasks complete with dummy data
- [x] Core interactions working (pin/unpin, eye toggle, tab switching)
- [x] Visual polish matching design system (Tailwind, no custom CSS)
- [x] Zero linter errors
- [ ] Real ArcGIS map integration (blocked by Task 0.4)
- [ ] Drag-and-drop reorder (nice-to-have for Phase 0, can defer)

---

## Next Steps

### Immediate (Complete Phase 0)

1. **ArcGIS Map Integration** (Task 0.4)
   - Install `@arcgis/core` (already in package.json)
   - Create `MapContainer` with WebMap
   - Wire up GraphicsLayers for pinned layers
   - Sync z-order with widget drag-reorder

2. **Test Core Interactions**
   - Verify pin/unpin syncs between sidebar ↔ widget
   - Verify eye toggle syncs bidirectionally
   - Verify undo stack works (max 5 actions)
   - Verify search filters correctly

### After Phase 0 (Phase 1-4)

- **Phase 1:** iNaturalist data source (5 tasks)
- **Phase 2:** ANiML data source (7 tasks)
- **Phase 3:** Dendra data source (6 tasks)
- **Phase 4:** DataOne data source (5 tasks)

See `docs/master-plan.md` for full phase breakdown.

---

## Key Files Reference

- **Master Plan:** `docs/master-plan.md` — Overall project structure, cross-phase decisions
- **Phase 0 Spec:** `docs/IMPLEMENTATION/phases/phase-0-foundation.md` — Detailed task breakdown
- **Component Specs:**
  - `docs/PLANNING/component-specs/left-sidebar.md`
  - `docs/PLANNING/component-specs/map-layers-widget.md`
  - `docs/PLANNING/component-specs/bookmarked-items-widget.md`
  - `docs/PLANNING/component-specs/right-sidebar-template.md`
- **Design System:** `docs/DESIGN-SYSTEM/design-system.md` — Styling tokens, patterns
- **Planning Decisions:** `docs/planning-task-tracker.md` — DFT-001 through DFT-045 resolutions

---

## Development Notes

- **Code Location:** All v2 code in `src/v2/`
- **Access:** V2 app at `http://localhost:5173/?v2`
- **State Management:** React Context API (`LayerContext`, `BookmarkContext`)
- **Styling:** Tailwind CSS only (no custom CSS files)
- **Icons:** Lucide React (no emojis per DFT-026)
- **File Size Target:** Keep files <200 lines for Cursor context efficiency

---

## Blocking Issues

| Issue | Blocking | Status | Owner | Notes |
|-------|----------|--------|-------|-------|
| ArcGIS map integration | Phase 0 completion | 🟡 In Progress | - | Need to replace placeholder with real WebMap |

---

## Change Log

| Date | Phase | Change | By |
|------|-------|--------|-----|
| Feb 6, 2026 | Phase 0 | Built core shell: left sidebar, map layers widget, bookmarked items widget, right sidebar shell, state management. 27 files, 1,748 lines. Zero TypeScript/linter errors. | Opus |
| Feb 6, 2026 | Phase 0 | Added v1/v2 toggle via `?v2` URL param. "Try v2.0" button in legacy header. | Opus |
