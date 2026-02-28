# Phase 7: Polish & Consistency

**Status:** 🟡 In Progress  
**Progress:** 7 / 11 tasks (D20-01, CON-FEB25-01, CON-FEB25-02, CON-FEB25-03, CON-FEB25-08, CON-FEB25-09, POL-SELECT-CLEAR complete)  
**Branch:** `v2/polish`  
**Depends On:** Phases 0-6 (all complete)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Tasks will be added after other phases reveal what needs polishing.

---

## Phase Goal

Final consistency pass to ensure all components look and behave consistently. Fix any styling issues, ensure design system is followed, integrate TNC brand identity, and prepare for demo.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- All mockups: `mockups/02a-02f`

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| D20-01 | 🟢 Complete | Feb 20, 2026 | Add collapse button to right sidebar — default open, stays collapsed until user manually re-expands | Implemented in Phase 0 (app-wide layout). Extruded tab, localStorage, 300ms transition. |
| D20-03 | ⚪ Not Started | Feb 20, 2026 | Make Map Layers accordion header bar clickable to expand/collapse (not just the caret icon) | Dan kept trying to click the heading to expand. Retain the caret but make the whole header row interactive. Source: Dan Meeting Feb 20 |
| D20-04 | ⚪ Not Started | Feb 20, 2026 | Replace +/- symbols in Map Layers accordion with chevron (V / >) symbols | Plus/minus is not a clear expand/collapse affordance; chevron communicates directionality better. Source: Dan Meeting Feb 20 |
| D20-07 | ⚪ Not Started | Feb 20, 2026 | Verify custom polygon draw tool is working consistently across all data sources | iNaturalist and ANiML confirmed working; Dendra suspected broken; audit the rest. Source: Dan Meeting Feb 20 |
| D20-13 | ⚪ Not Started | Feb 20, 2026 | Add collapse button to left sidebar (lower priority) | Nice-to-have for full map exploration. Lower priority than right sidebar. Source: Dan Meeting Feb 20 |
| CON-FEB25-01 | 🟢 Complete | Feb 25, 2026 | Map marker click: when zoomed in, pan/center only; when zoomed out, pan and zoom in | Implemented across iNaturalist, ANiML, Dendra, DataONE, CalFlora, and GBIF marker clicks. DataONE zoom-out edge case fixed: root cause was `useDatasetDetailOrchestrator.ts` overriding smart zoom with hardcoded `zoom: 16`. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-02 | 🟢 Complete | Feb 25, 2026 | Add thin white outline around all map icons (including emoji) | Implemented as a 3D-only toggle (iNaturalist emoji + ANiML camera symbols). Currently disabled by default; 2D unchanged. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-03 | 🟢 Complete | Feb 26, 2026 | Collapsable Edit Filters component across all layers | ANiML, Dendra, DataONE, GBIF, CalFlora now use `collapsible defaultExpanded` on EditFiltersCard; iNaturalist already had it. |
| CON-FEB25-06 | ⚪ Not Started | Feb 25, 2026 | Analyze code for performance bottlenecks — low FPS in 3D view with iNaturalist | Scan for degradation; recommend/implement fixes. Extends 7.6. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-08 | 🟢 Complete | Feb 27, 2026 | Restore right padding for left sidebar layer cards | Layer cards (e.g. Dangermond Preserve, Santa Barbara County Boundary) had regressed to pr-0; restored pr-1 so cards sit a few pixels from sidebar edge. CategoryGroup, ServiceGroup. |
| CON-FEB25-09 | 🟢 Complete | Feb 27, 2026 | Map layer draw order matches Map Layers widget order | Unpinned active layer was rendering underneath pinned layers. Fixed in useMapLayerPresentationSync: unified desired stack = active-unpinned first, then pinned in widget order. |
| POL-SELECT-CLEAR | 🟢 Complete | Feb 27, 2026 | Shared Select All / Clear All primitive; TNC legend + iNaturalist species filter use identical styling | `SelectAllClearAllActions` in `src/v2/components/shared/`; emerald text + separator; TNCArcGISLegendWidget + INaturalistBrowseTab Filter Species. |

## Task Status

> Tasks will be added after Phases 1-5 are complete, based on discovered inconsistencies.

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| D20-01 | Add collapse button to right sidebar | 🟢 Complete | Codex | Implemented in Phase 0. Extruded tab on left edge, localStorage, no auto-reopen. |
| D20-03 | Map Layers accordion header bar clickable | ⚪ Not Started | | Whole header row interactive, not just caret. Source: Dan Meeting Feb 20 |
| D20-04 | Replace +/- with chevron in Map Layers accordion | ⚪ Not Started | | V when open, > when closed. Source: Dan Meeting Feb 20 |
| D20-07 | Audit custom polygon draw tool across all data sources | ⚪ Not Started | | iNaturalist ✅, ANiML ✅; Dendra suspected broken. Source: Dan Meeting Feb 20 |
| D20-13 | Add collapse button to left sidebar | ⚪ Not Started | | Lower priority than right sidebar. Source: Dan Meeting Feb 20 |
| TF-02 | Replace emoji icons with SVGs for cross-browser/cross-OS visual consistency | ⚪ Not Started | | High priority; emojis render differently on PC vs Mac. Source: Trisalyn QA Feb 20 |
| TF-05 | Standardize filter control ordering across all data sources (date range first, then custom draw polygon) | ⚪ Not Started | | High priority; order currently differs between Camera Traps and iNaturalist. Source: Trisalyn QA Feb 20 |
| TF-08 | Add collapse/hide caret to Map Layers widget | ⚪ Not Started | | Medium priority; no visible affordance to collapse widget. Source: Trisalyn QA Feb 20 |
| TF-15 | Create GIFs of current app state for Jack Dangermond presentation materials | ⚪ Not Started | | High priority; should be done before starting monitoring feature work. Source: Trisalyn QA Feb 20 |
| 7.1 | Integrate TNC brand fonts (Barlow, Chronicle) | ⚪ Not Started | | DFT-008, DFT-009 |
| 7.2 | Add TNC theme variants (Official, Soft) | ⚪ Not Started | | DFT-008, DFT-009 |
| 7.3 | Design system audit | ⚪ Not Started | | |
| 7.4 | Cross-component consistency check | ⚪ Not Started | | |
| 7.5 | Responsive design check | ⚪ Not Started | | |
| 7.6 | Performance audit | ⚪ Not Started | | |
| 7.7 | Accessibility check | ⚪ Not Started | | |
| 7.8 | Enhance map tooltips (post-v2.0) | ⚪ Not Started | | DFT-032 future enhancement |
| CON-FEB25-01 | Map marker click: when zoomed in, pan/center only; when zoomed out, pan and zoom in | 🟢 Complete | Codex | Shared smart goTo helper wired across all data sources. DataONE zoom-out edge case resolved: `useDatasetDetailOrchestrator.ts` was overriding smart zoom with hardcoded `zoom: 16`; replaced with `goToMarkerWithSmartZoom({ defaultZoomLevel: 16 })`. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-02 | Add thin white outline around all map icons (including emoji) | 🟢 Complete | Codex | 3D-only thin white halo added to iNaturalist emoji markers and ANiML camera symbols as a toggle. Currently disabled by default; 2D unchanged. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-03 | Collapsable Edit Filters component across all layers | 🟢 Complete | | ANiML, Dendra, DataONE, GBIF, CalFlora now match iNaturalist collapsible pattern. Feb 26, 2026. |
| CON-FEB25-06 | Analyze code for performance bottlenecks — low FPS in 3D view with iNaturalist | ⚪ Not Started | | Extends 7.6. Source: consolidated-tasks-feb-25-2026.md |
| CON-FEB25-08 | Restore right padding for left sidebar layer cards | 🟢 Complete | | Layer cards had regressed to pr-0; restored pr-1 in CategoryGroup, ServiceGroup so cards sit a few pixels from sidebar edge. Feb 27, 2026. |
| CON-FEB25-09 | Map layer draw order matches Map Layers widget order | 🟢 Complete | | Unpinned active layer was rendering underneath pinned layers. Fixed in useMapLayerPresentationSync: unified desired stack = active-unpinned first, then pinned in widget order. Feb 27, 2026. |
| POL-SELECT-CLEAR | Shared Select All / Clear All primitive; TNC legend + iNaturalist species filter | 🟢 Complete | | SelectAllClearAllActions component; TNC ArcGIS legend and iNaturalist Filter Species use identical emerald text + separator styling. Feb 27, 2026. |
| (more TBD) | | | | |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 7.1: Integrate TNC Brand Fonts

**Goal:** Add TNC's brand fonts (Barlow, Chronicle) to the design system.

**Implementation:**
- Import Barlow and Chronicle from Google Fonts in `src/index.css`
- Update `tailwind.config.js` to define font families
- Set Barlow as primary UI font (replaces Inter)
- Use Chronicle for section headers/special emphasis

**Acceptance Criteria:**
- [ ] Fonts imported and rendering correctly
- [ ] Barlow used for body text, labels, buttons
- [ ] Chronicle used for section headers (optional - test readability)
- [ ] Typography remains readable and clean

**Estimated Time:** 1-2 hours

---

### 7.2: Add TNC Theme Variants

**Goal:** Create 2-3 new theme options using TNC brand colors.

**TNC Brand Colors:**
- Parrot Green: `#05641c` (dark, rich green)
- Leaf Green: `#49a842` (bright, medium green)
- Benthic Blue: `#06063d` (very dark navy - text color)

**Themes to Create:**
1. **"TNC Official"** - Bold brand identity
   - Header: Parrot Green → Leaf Green gradient
   - Subheader: Light gray (current approach)
   - Set as default theme

2. **"TNC Soft"** (optional) - Muted brand version
   - Header: Lighter tints of brand greens
   - For users who prefer lower contrast

**Implementation:**
- Add theme definitions to `src/utils/themes.ts`
- Keep all existing themes (users can experiment and choose)

**Acceptance Criteria:**
- [ ] "TNC Official" theme added and set as default
- [ ] "TNC Soft" theme added (optional)
- [ ] Theme switcher shows new options
- [ ] All existing themes still work

**Estimated Time:** 30-60 minutes

**Note:** Experimentation encouraged - let users/designers try different themes and provide feedback on which works best.

---

### 7.3: Design System Audit

**Goal:** Ensure all components follow the design system.

**Acceptance Criteria:**
- [ ] All colors match design system palette
- [ ] All typography follows design system specs
- [ ] All spacing is consistent
- [ ] No hardcoded values that should be tokens

---

### 7.4: Cross-Component Consistency Check

**Goal:** Ensure similar patterns look the same across data sources.

**Areas to Check:**
- [ ] All layer cards have consistent structure
- [ ] All feature cards have consistent structure
- [ ] All filter UIs have consistent layout
- [ ] All detail views have consistent navigation
- [ ] All buttons have consistent styling
- [ ] All icons are consistent (Lucide, not emojis)

---

### 7.5: Responsive Design Check

**Goal:** Ensure layout works at different screen sizes.

**Breakpoints to Check:**
- [ ] Desktop (1280px+)
- [ ] Laptop (1024-1279px)
- [ ] Tablet (768-1023px) - if supported
- [ ] Mobile (<768px) - may not support for V2

---

### 7.6: Performance Audit

**Goal:** Ensure acceptable load times and smooth interactions.

**Areas to Check:**
- [ ] Initial page load time
- [ ] Layer pin/unpin responsiveness
- [ ] Sidebar transitions smooth
- [ ] No janky scrolling
- [ ] Map performance with multiple layers

---

### 7.7: Accessibility Check

**Decision (Feb 3):** Resolved DFT-017 — Baseline accessibility principles established. This task focuses on auditing and refining the implementation.

**Goal:** Audit and refine accessibility implementation based on baseline principles.

**Baseline Principles (from DFT-017):**
1. **Tab Order:** Natural DOM order (Left sidebar → Map → Floating widgets → Right sidebar)
2. **Escape Key:** Closes most recently opened element (modal, expanded row, panel, popup)
3. **Focus Management:** Focus moves to first interactive element when container expands
4. **Screen Reader:** Announce significant actions only (filter applied, layer pinned, errors)

**Areas to Check:**
- [ ] Keyboard navigation works across all components (verify tab order follows principle)
- [ ] Focus states visible and consistent (verify focus styling on all interactive elements)
- [ ] Sufficient color contrast (WCAG 2.1 AA minimum: 4.5:1 for normal text, 3:1 for large text)
- [ ] ARIA labels where needed (forms, icon buttons, dynamic content)
- [ ] Escape key behavior consistent (test modals, expanded panels, popups)
- [ ] Focus management on expand/collapse (verify focus moves correctly)
- [ ] Screen reader announcements appropriate (test with VoiceOver/NVDA/JAWS)
- [ ] No keyboard traps (user can always navigate away)
- [ ] Skip links for main content areas (optional enhancement)

**Testing Tools:**
- Chrome DevTools Lighthouse accessibility audit
- axe DevTools browser extension
- Keyboard-only navigation test (unplug mouse)
- Screen reader test (at least one: VoiceOver, NVDA, or JAWS)

**Note:** Full WCAG 2.1 AA compliance deferred to post-v2.0 if needed. Focus on usability for keyboard/screen reader users.

---

### 7.8: Enhance Map Tooltips (Post-v2.0)

**Decision (Feb 4):** Resolved DFT-032 — v2.0 ships with minimal tooltips (ID + Type only). This task enhances tooltips based on teammate feedback.

**Goal:** Upgrade map tooltips from minimal MVP (ID + Type) to richer, filter-aware tooltips after gathering teammate feedback on what additional information would be valuable.

**v2.0 Baseline:**
- Native browser tooltips using `title` attribute
- Format: `"CAM-042 • Camera"` or `"WL-08 • Water Level Sensor"`
- Zero implementation overhead, basic wayfinding

**Potential Enhancements (To Be Decided After Feedback):**

1. **Filter-aware counts:**
   - Show filtered image counts when species filter active (e.g., "23 mountain lion images")
   - Requires query integration and caching strategy

2. **Additional metadata fields:**
   - ANiML: Location, total image count
   - Dendra: Latest reading, date range
   - iNaturalist: Date, observer
   - DataOne: Source institution, update date

3. **Custom styling:**
   - Replace native browser tooltips with custom-styled component
   - 200ms show delay, fade animations
   - Better positioning control

4. **Advanced interactions:**
   - Hover-to-preview thumbnails (ANiML images)
   - Tooltip persists while hovering tooltip itself
   - **Bidirectional highlighting** (hover bookmark row → highlight map feature) — **Implemented in Phase 0 (DFT-036)** for unidirectional (widget → map). Bidirectional (map → widget) deferred pending user feedback.
   - **Edge indicators for off-screen bookmarks** (DFT-036 deferred enhancement) — "Starfighter" style directional arrow at screen edge pointing toward off-screen bookmarked features. Shows direction + approximate distance. Estimated effort: 6-8 hours. Implement if users express need during v2.0 testing.

**Implementation Approach:**

1. **Gather feedback** during v2.0 user testing:
   - Ask teammates: "What additional info would you want in tooltips?"
   - Observe: What questions do they ask after hovering features?
   - Prioritize enhancements based on frequency of need

2. **Design custom tooltip component** (if native tooltips insufficient):
   - Follow design system patterns (utilitarian tone, consistent styling)
   - Implement timing behavior (200ms delay, fade transitions)
   - Ensure accessibility (keyboard focus, screen reader support)

3. **Implement filter-aware content** (if high value):
   - Integrate with existing query caching
   - Show contextually relevant data based on active filters
   - Performance optimization: cache tooltip content, debounce updates

**Acceptance Criteria:**
- [ ] Teammate feedback gathered and documented
- [ ] Enhancement priorities decided based on actual usage
- [ ] Custom tooltip component implemented (if needed)
- [ ] Filter-aware content integrated (if needed)
- [ ] Accessibility verified (keyboard + screen reader)
- [ ] Performance acceptable (no lag on hover)

**Estimated Time:** 2-8 hours depending on scope

**Note:** This is explicitly deferred to post-v2.0 to avoid over-engineering without real user feedback. v2.0 ships with minimal tooltips that provide baseline value.

---

### CON-FEB25-01: Investigation Notes (DataONE zoom-out edge case) — RESOLVED

**Status:** Fixed. Root cause identified and resolved.

**Root cause:** `useDatasetDetailOrchestrator.ts` (right sidebar) had an auto-pan effect that fired whenever a new dataset was opened. It called `view.goTo({ center: [...], zoom: 16 })` with a **hardcoded `zoom: 16`**. When a user clicked a DataONE marker at zoom level > 16, the sequence was:
1. `useMapBehavior.ts` click handler → `goToMarkerWithSmartZoom` (correctly preserves zoom)
2. React re-renders → DatasetDetail mounts → orchestrator fires `goTo({ zoom: 16 })` → zooms OUT

This confirmed hypothesis #1 from the investigation: "A non-click DataONE effect may still run after selection and invoke map navigation that changes scale."

**Fix:** Replaced both the auto-pan effect and `handleRecenter` in `useDatasetDetailOrchestrator.ts` with `goToMarkerWithSmartZoom({ defaultZoomLevel: 16 })`. This preserves the zoom-in-close behavior for datasets opened from the sidebar list (zoom to 16 if currently below 16) while preventing zoom-out when already closer (at or above 16, keep current zoom).

**What was tried (prior to root cause discovery):**
- Added shared marker navigation helper (`src/v2/utils/mapMarkerNavigation.ts`) and applied to iNaturalist, ANiML, Dendra, DataONE, CalFlora, and GBIF.
- Implemented threshold logic (`defaultZoomLevel = 5`): zoom only when current zoom is below threshold; otherwise center-only.
- Updated helper to preserve existing zoom/scale during center-only moves.
- Updated DataONE-specific click paths in `useMapBehavior.ts` to use helper.
- Hardened SceneView zoom detection by rejecting invalid/transition values.

---

## Discovered Issues

> Add issues discovered during other phases that need fixing in polish.

### Shared Sync Dependency (from iNaturalist)

- **Reference:** After merging iNaturalist Task 25/26/27, use `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)") as the canonical behavior for Map Layers <-> right-sidebar query sync.
- **What this enables in Phase 6:** Cross-source polish and QA can validate one consistent interaction model for filter editing, child-view naming, and reactivation behavior.
- **Phase 6 verification:** Add regression checks for loop prevention, "Edit Filters" hydration accuracy, and custom-name persistence across layer switching.

| Issue | Discovered In | Priority | Notes |
|-------|---------------|----------|-------|
| (none yet) | | | |

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 27, 2026 | POL-SELECT-CLEAR | **Complete.** Shared `SelectAllClearAllActions` primitive in `src/v2/components/shared/`. TNC ArcGIS legend and iNaturalist Filter Species now use identical emerald text + separator styling. Disabled states for Select All (when all selected) and Clear All (when none selected). | Cursor |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 26, 2026 | CON-FEB25-03 | Collapsable Edit Filters — applied `collapsible defaultExpanded` to EditFiltersCard in ANiML, Dendra, DataONE, GBIF, CalFlora browse tabs | Cursor |
| Feb 3, 2026 | 7.1, 7.2 | Added TNC brand integration tasks (fonts + theme variants). Resolved DFT-008, DFT-009 | Will + Claude |
| Feb 3, 2026 | 7.7 | Updated accessibility check with DFT-017 baseline principles. Added specific testing checklist and tools | Will + Claude |
| Feb 4, 2026 | 7.8 | Added map tooltip enhancement task for post-v2.0 (DFT-032 future enhancement). v2.0 ships with minimal tooltips, enhancements based on teammate feedback | Will + Claude |
| Feb 25, 2026 | CON-FEB25-01 | Implemented shared marker click navigation behavior: zoom only when below default threshold, otherwise center-only. Applied to iNaturalist, ANiML, Dendra, DataONE, CalFlora, and GBIF with 2D/3D support | Codex |
| Feb 25, 2026 | CON-FEB25-01 | Re-opened task as in progress due to DataONE zoom-out edge case when already zoomed in. Documented attempted fixes and remaining hypotheses for targeted debugging | Codex |
| Feb 25, 2026 | CON-FEB25-01 | Resolved DataONE zoom-out edge case: root cause was `useDatasetDetailOrchestrator.ts` overriding smart zoom with hardcoded `zoom: 16`. Replaced with `goToMarkerWithSmartZoom({ defaultZoomLevel: 16 })` | Will + Claude |
| Feb 25, 2026 | CON-FEB25-02 | Added thin white icon halo in 3D view only so markers are legible against satellite terrain. Applied to iNaturalist emoji symbols and ANiML camera symbols; 2D icon styling unchanged | Codex |
| Feb 25, 2026 | CON-FEB25-02 | Updated 3D icon halo to be disabled by default while keeping implementation behind a single toggle (`iconHaloConfig.ts`) for quick re-enable | Codex |
| Feb 27, 2026 | CON-FEB25-08 | Restored right padding (pr-1) for left sidebar layer card containers. Layer cards had regressed to pr-0; CategoryGroup and ServiceGroup wrappers now use pr-1 so cards sit a few pixels from sidebar edge. | Cursor |

