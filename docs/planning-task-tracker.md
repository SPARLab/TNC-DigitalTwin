# Design Feedback & Issue Tracker

**Purpose:** Track UI/UX feedback, design decisions, and implementation concerns for **v2.0** as discrete issues. This document serves as a staging area before development plans are finalized.

**Scope:** This tracker is focused on v2.0 design decisions. Features deferred to future versions (v2.1+) are tracked in `PLANNING/future-enhancements.md`.

**How to use this doc:**
1. New feedback gets logged as a numbered issue
2. Discuss/iterate in the issue's "Discussion" section
3. Mark resolved once a decision is made
4. Resolved issues feed into development plans
5. **When resolving an issue:** Update `master-development-plan.md` and relevant phase documents with the decision

**For AI Agents:** When you mark a feedback item as resolved with a decision/outcome:
- Document the decision in the issue's "Resolution" section
- Update `docs/master-plan.md` if it affects cross-phase decisions
- **CRITICAL:** Update relevant phase documents in `docs/IMPLEMENTATION/phases/` if it affects specific implementation
  - Update ASCII diagrams to match the decision
  - Update acceptance criteria if needed
  - Add decision notes at the top of relevant task sections
- Add an entry to "Cross-Phase Decisions" in master plan if the decision impacts multiple phases
- **DO NOT automatically archive resolved items** — Only archive to `PLANNING/resolved-decisions/` when explicitly requested by the user. The user may request archiving to keep this document manageable as it grows.

**For Processing Meeting Transcripts:**
- Store raw transcripts in `PLANNING/feedback/transcripts/`
- Process transcripts and create structured documents in `PLANNING/feedback/ai-derived-tasks-from-transcripts/`
- Extract DFT-XXX items from processed documents and add to this tracker

**Design Decision Sync Process:**
- When a design decision is made in this tracker (DFT-XXX resolved), ensure the ASCII diagrams and specs in `IMPLEMENTATION/phases/` match exactly
- Phase documents are the **canonical source** for implementation specs
- This tracker documents the **decision rationale** and **discussion process**
- If diagrams differ, phase document takes precedence (it's what developers will reference)

**📋 When Resolving a DFT-XXX Item — Update Checklist:**

When marking a DFT-XXX item as resolved, verify/update ALL of the following:

1. **Phase Documents (`IMPLEMENTATION/phases/`):**
   - [ ] Find all affected phase tasks (e.g., if widget design changes, check `phase-0-foundation.md` task 0.5)
   - [ ] Update ASCII diagrams to match the decision exactly
   - [ ] Update acceptance criteria if behavior changes
   - [ ] Add decision note at top of relevant task section (format: `**Decision (Date):** Resolved DFT-XXX — [summary]`)

2. **Master Plan (`master-plan.md`):**
   - [ ] Add entry to "Cross-Phase Decisions" → "UX Decisions" table if decision affects multiple phases
   - [ ] Update changelog with resolution date and summary

3. **Resolved Decisions (`PLANNING/resolved-decisions/`):**
   - [ ] Create summary document `dft-XXX-resolution-summary.md` if decision is significant enough to archive
   - [ ] Include: decision date, rationale, design decisions, ASCII diagrams, verification checklist

4. **This Tracker (`planning-task-tracker.md`):**
   - [ ] Update status to 🟢 Resolved
   - [ ] Fill in "Resolution" section with decision summary
   - [ ] Add "Documented in:" section listing all places updated
   - [ ] Add "✅ Verification Checklist" showing what was checked

5. **Mockups (if applicable):**
   - [ ] Note if mockups need updating (e.g., "Mockup 02c needs update to reflect new button logic")
   - [ ] Update mockup files if decision significantly changes UI

**Common Locations to Check:**
- **Widget designs:** `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.5 (Pinned Layers Widget)
- **Left sidebar:** `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.2 (Left Sidebar)
- **Right sidebar:** Various phase documents depending on data source
- **Export functionality:** `IMPLEMENTATION/phases/phase-5-export-builder.md`
- **Cross-phase decisions:** `master-plan.md` → "Cross-Phase Decisions" → "UX Decisions"

**Last Updated:** February 6, 2026 (Archived DFT-033 through DFT-040; restructured DFT-037 with component specs phase)

**Next Steps:**
- [x] **BEFORE MOCKUPS (DFT-037):** Resolve all design discussion tasks (DFT-015 through DFT-040) -- ALL DONE
  - ~~**High priority:** DFT-018, DFT-020, DFT-030, DFT-038, DFT-039~~ -- All resolved
  - ~~**Medium priority:** DFT-019, DFT-024, DFT-028, DFT-029, DFT-031, DFT-032, DFT-035, DFT-040~~ -- All resolved
  - ~~**Low priority:** DFT-036~~ -- Resolved Feb 5
- [x] **Sidebar Template System:** Defined shared templates (TabBar, OverviewTab, ResultCard, Pagination, LeftSidebar) + theme tokens in `design-system.md` (Feb 5, 2026)
- [x] **Stale entries cleaned:** Updated bookmark widget and filter representation status in `master-plan.md` (Feb 5, 2026)
- [x] **Archive completed:** Archived DFT-001 through DFT-027 to `PLANNING/archived-planning-tasks-from-tracker.md` (Feb 4, 2026)
- [x] **Archive completed:** Archived DFT-033 through DFT-035 to `PLANNING/resolved-decisions/` (Feb 5, 2026)
- [ ] **START DFT-037:** Generate template-driven mockups. 02a defines the master template; 02b-02e show content differences only

---

## Quick Reference

**Note:** Tasks DFT-001 through DFT-040 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. The summaries below are kept for quick reference.

| ID | Summary | Category | Status | Priority |
|----|---------|----------|--------|----------|
| DFT-001 | Should clicking the eyeball icon auto-pin a layer, or should pin be a separate explicit action? | UI/UX | 🟢 Resolved | Medium |
| DFT-002 | "Export Bookmarks" button placement made it unclear that pinned layers are also exportable | UI/UX | 🟢 Resolved | Medium |
| DFT-003 | In ANiML browse view, the "Pin with Filter" vs "Bookmark" buttons are confusing—unclear what each does | UI/UX | 🟢 Resolved | High |cgvdfrt  `
| DFT-003b | Where should "Create New View" action live? (Widget dropdown vs right sidebar) | UI/UX | 🟢 Resolved | Medium |
| DFT-003c | ANiML Browse: Tabs vs landing cards for Animal-First/Camera-First choice | UI/UX | 🟢 Resolved | Low |
| DFT-004 | Two filter locations (layer-level and feature-level) appear simultaneously—need clearer visual hierarchy | UI/UX | 🟢 Resolved | High |
| DFT-005 | Floating widgets crowd the screen when viewing time-series data; consider auto-collapse behavior | UI/UX | 🟢 Resolved | Low |
| DFT-006 | When a layer is selected, which tab opens first in the right sidebar—Overview or Browse? | UI/UX | 🟢 Resolved | Low |
| DFT-007 | Bookmark widget title should clarify that bookmarks are features within layers, not separate items | UI/UX | 🟢 Resolved | Medium |
| DFT-008 | TNC provided brand colors (Parrot Green, Leaf Green, Benthic Blue) for optional integration | Styling | 🟢 Resolved | Low |
| DFT-009 | TNC provided brand fonts (Barlow, Chronicle) for optional integration | Styling | 🟢 Resolved | Low |
| DFT-010 | Terminology: Change "items" to "features" throughout — more familiar to GIS users | UI/UX | 🟢 Resolved | High |
| DFT-011 | Target audience clarification: Researchers (GIS-minded), not broad public | Design Decision | 🟢 Resolved | Medium |
| DFT-012 | Camera trap clustering: Show numbered icons at locations, click to see filtered images | Feature Request | 🟢 Resolved | Medium |
| DFT-013 | Multiple filtered views on same layer — save mountain lion AND deer queries simultaneously | Paradigm Extension | 🟢 Resolved | High |
| DFT-015 | Empty state design for widgets, Browse tab, search results | UI/UX | 🟢 Resolved | High |
| DFT-016 | Mobile/tablet responsiveness scope decision | Technical | 🟢 Resolved | Medium |
| DFT-017 | Keyboard navigation & accessibility patterns | Accessibility | 🟢 Resolved | Medium |
| DFT-018 | Loading states and skeleton UI patterns | UI/UX | 🟢 Resolved | High |
| DFT-019 | Edit Filters button navigation behavior — what happens to widget? | UI/UX | 🟢 Resolved | Medium |
| DFT-020 | Pointer-row bookmark UI — one button vs two for "Bookmark" vs "Bookmark with Filter" | UI/UX | 🟢 Resolved | High |
| DFT-021 | Terminology consistency — "Active" vs "Selected" layer | Terminology | 🟢 Resolved | Low |
| DFT-022 | Parent toggle memory edge case — what if previously-selected child is deleted? | Edge Case | 🟢 Deferred | Low |
| DFT-023 | Widget positioning dimensions — exact spacing values | Visual Spec | 🟢 Deferred | Low |
| DFT-024 | Filter indicator A/B test decision — make choice before mockups | Visual Design | 🟢 Resolved | Medium |
| DFT-025 | Create New View transition animation — visual feedback for state change | Microinteraction | 🟢 Resolved | Low |
| DFT-026 | Emoji/icon vocabulary consistency — shopping cart vs export icon | Design System | 🟢 Resolved | Low |
| DFT-027 | "Browse Features →" button destination confirmation | Terminology | 🟢 Resolved | Low |
| DFT-028 | Zero-result camera behavior — hidden vs grayed out when filter matches 0 images | UI/UX | 🟢 Resolved | Medium |
| DFT-029 | Unfiltered layer badge behavior — show total counts or no badges? | UI/UX | 🟢 Resolved | Medium |
| DFT-030 | Error state design — API failures, network errors, timeout handling | UI/UX | 🟢 Resolved | High |
| DFT-031 | Confirmation dialogs — when to require explicit confirmation (delete, clear filters) | UI/UX | 🟢 Resolved | Medium |
| DFT-032 | Map tooltip design — what info shows on hover before clicking feature? | UI/UX | 🟢 Resolved | Medium |
| DFT-033 | Right sidebar width and resizability — fixed or user-adjustable? | Layout | 🟢 Resolved | Low |
| DFT-034 | Drag-and-drop reorder feedback — what visual cues during layer reorder? | Microinteraction | 🟢 Resolved | Low |
| DFT-035 | DataOne search behavior — instant search or explicit submit? | UI/UX | 🟢 Resolved | Medium |
| DFT-036 | Feature highlight on map when hovering bookmark row | UI/UX | 🟢 Resolved | Low |
| DFT-037 | Generate component specs + mockups reflecting all resolved design decisions | Task | 🟡 Open | High |
| └─ DFT-037-P1 | Component Spec: Left Sidebar (docs/PLANNING/component-specs/left-sidebar.md) | Planning | ✅ Complete | High |
| └─ DFT-037-P2 | Component Spec: Map Layers Widget (docs/PLANNING/component-specs/map-layers-widget.md) | Planning | ✅ Complete | High |
| └─ DFT-037-P3 | Component Spec: Bookmarked Items Widget (docs/PLANNING/component-specs/bookmarked-items-widget.md) | Planning | ✅ Complete | High |
| └─ DFT-037-P4 | Component Spec: Right Sidebar Template (docs/PLANNING/component-specs/right-sidebar-template.md) | Planning | ✅ Complete | High |
| └─ DFT-037a | HTML Mockup: mockups/02a-unified-layout.html — Compose from P1-P4 specs | Task | 🟡 Open | High |
| └─ DFT-037b | HTML Mockup: mockups/02b-browse-inaturalist.html | Task | 🟡 Open | High |
| └─ DFT-037c | HTML Mockup: mockups/02c-browse-animl.html | Task | 🟡 Open | High |
| └─ DFT-037d | HTML Mockup: mockups/02d-browse-dendra.html | Task | 🟡 Open | High |
| └─ DFT-037e | HTML Mockup: mockups/02e-browse-dataone.html | Task | 🟡 Open | High |
| └─ DFT-037f | HTML Mockup: mockups/02f-export-builder.html | Task | 🟡 Open | High |
| DFT-038 | Filter section anatomy — shared structural template for Browse tab filter UI across all data sources | Design System | 🟢 Resolved | High |
| DFT-039 | Filter apply behavior — auto-apply vs explicit Apply button consistency across data sources | UI/UX | 🟢 Resolved | High |
| DFT-040 | Dual-level filter visual distinction — how Level 2 vs Level 3 filters look different (ANiML, Dendra) | UI/UX | 🟢 Resolved | Medium |
| DFT-041 | Right sidebar Export tab content — what should the per-layer Export tab show? | UI/UX | 🟢 Resolved | Medium |
| DFT-042 | ANiML landing cards mode-switch — how to switch between Animal-First and Camera-First after initial choice | UI/UX | 🟢 Resolved | Low |
| DFT-043 | Dendra sidebar body at Level 3 — what shows in sidebar when chart renders in floating pop-up? | UI/UX | 🟢 Resolved | Low |
| DFT-044 | Self-contained row detail view — shared component for iNaturalist observation and DataOne dataset detail views | UI/UX | 🟢 Resolved | Medium |
|| DFT-045 | Left sidebar taxonomy: Should "Research Datasets" exist as a standalone category, or should DataOne be distributed/cross-referenced across domain categories? | IA | 🟢 Resolved | High |

   **Status Key:**
- 🟢 Resolved — Decision made, ready for dev
- 🟡 Open — Needs discussion/decision
- 🔵 In Discussion — Actively being debated
- ✅ Implemented — Built and shipped

**Note:** Deferred features (pushed to v2.1+) are tracked in `PLANNING/future-enhancements.md`

---

---

## Discussion Items

| ID | Summary | Discuss With | Resolution Status |
|----|---------|--------------|-------------------|
| DFT-001 | Should clicking the eyeball icon auto-pin a layer, or should pin be a separate explicit action? | Amy, Trisalyn | ✅ Resolved - Jan 27 |
| DFT-002 | "Export Bookmarks" button placement made it unclear that pinned layers are also exportable | Amy, Trisalyn | ✅ Resolved - Jan 29 |
| DFT-003 | In ANiML browse view, the "Pin with Filter" vs "Bookmark" buttons are confusing—unclear what each does | Amy, Trisalyn | ✅ Resolved - Jan 29 |
| DFT-003b | Where should "Create New View" action live? (for multiple filtered views of same layer) | Amy, Trisalyn, Dan | ✅ Resolved - Feb 2 |
| DFT-003c | ANiML Browse: Tabs vs landing cards for Animal-First/Camera-First entry point | Amy, Trisalyn | ✅ Resolved - Feb 2 |
| DFT-004 | Two filter locations (layer-level and feature-level) appear simultaneously—need clearer visual hierarchy | Amy, Trisalyn, Dan | ✅ Resolved - Feb 2 |
| DFT-006 | When a layer is selected, which tab opens first in the right sidebar—Overview or Browse? | Amy, Trisalyn | ✅ Resolved - Feb 2 |
| DFT-007 | Bookmark widget title should clarify that bookmarks are features within layers, not separate items | Amy, Trisalyn | ✅ Resolved - Feb 2 |
| DFT-012 | Camera trap clustering: Show numbered icons at locations, click to see filtered images | Dan | ✅ Resolved - Feb 3 |
| DFT-013 | Multiple filtered views on same layer — save mountain lion AND deer queries simultaneously | Dan, Amy, Trisalyn | ✅ Resolved - Feb 3 |
| DFT-015 | Empty state design for widgets, Browse tab, search results | Will | ✅ Resolved - Feb 3 |
| DFT-016 | Mobile/tablet responsiveness scope decision | Amy, Trisalyn | ✅ Resolved - Feb 3 |
| DFT-017 | Keyboard navigation & accessibility patterns | Will | ✅ Resolved - Feb 3 |
| DFT-018 | Loading states and skeleton UI patterns | Will, Dan | ✅ Resolved - Feb 3 |
| DFT-019 | Edit Filters button navigation behavior | Will | ✅ Resolved - Feb 4 |
| DFT-020 | Pointer-row bookmark UI (one vs two buttons) | Amy, Trisalyn | ✅ Resolved - Feb 4 |
| DFT-021 | "Active" vs "Selected" terminology | Will | ✅ Resolved - Feb 4 |
| DFT-022 | Parent toggle memory edge case | Will | ✅ Deferred - Feb 4 |
| DFT-023 | Widget positioning dimensions | Will | ✅ Deferred - Feb 4 |
| DFT-024 | Filter indicator A/B test decision | Will | ✅ Resolved - Feb 4 |
| DFT-025 | Create New View transition animation | Will | ✅ Resolved - Feb 4 |
| DFT-026 | Emoji/icon vocabulary consistency | Will | ✅ Resolved - Feb 3 |
| DFT-027 | "Browse Features →" button destination | Will | ✅ Resolved - Feb 4 |
| DFT-028 | Zero-result camera behavior | Amy, Trisalyn, Dan | ✅ Resolved - Feb 4 |
| DFT-029 | Unfiltered layer badge behavior | Amy, Trisalyn | ✅ Resolved - Feb 4 |
| DFT-030 | Error state design | Will, Dan | ✅ Resolved - Feb 4 |
| DFT-031 | Confirmation dialogs pattern | Will | ✅ Resolved - Feb 4 |
| DFT-032 | Map tooltip design | Will | ✅ Resolved - Feb 4 |

## Paradigm Sign-Offs

These are high-level architectural decisions that need team consensus before development.

**✅ CORE PARADIGM APPROVED** — Focus has shifted to implementation details.

| Decision | Status | Sign-offs |
|----------|--------|-----------|
| Left sidebar / Right sidebar split | ✅ Approved | Sophia (Jan 23), Dan, Trisalyn, Amy |
| Three-level data hierarchy (Layer → Feature → Related Data) | ✅ Approved | Dan, Trisalyn, Amy |
| Pin (layers) vs. Bookmark (features) distinction | ✅ Approved | Dan, Trisalyn, Amy |
| Floating widget for pins + bookmarks | ✅ Approved | Sophia (Jan 23), Dan, Trisalyn, Amy |
| DataOne cross-category placement | ✅ Approved | Sophia (Jan 23) |
| DataOne Level 3 simplified (no file filtering) | ✅ Approved | Sophia (Jan 23) |

**Resolution Status Key:**
- 🟡 Pending — Not yet discussed
- ⏳ Blocked — Waiting on another decision
- 🔵 In Discussion — Actively being debated
- ✅ Approved — All required sign-offs received

---

### Google Form Candidates (Quick Polls)

These issues have clear options and would benefit from a quick team vote:

**1. DFT-001: Pin vs Toggle Behavior**
> When you click the eyeball icon on a layer, should it automatically pin the layer?
> - (A) Yes, auto-pin — eyeball = pin
> - (B) No, separate actions — eyeball = temporary view, pin = explicit save
> - (C) Hybrid — eyeball adds to "recent", pin moves to "saved"

**2. DFT-002: Export Button Location**
> Where should the "Export" button live?
> - (A) Each widget has its own export button
> - (B) Single "Export All" button in header or sidebar
> - (C) Both options available

**3. DFT-006: Default Tab When Selecting Layer**
> When you select a layer, which tab should open first?
> - (A) Overview tab (with prominent "Browse Features" button)
> - (B) Browse tab (jump straight to features)
> - (C) Context-dependent (depends on how user got there)

**4. DFT-007: Bookmark Widget Label**
> What should the floating bookmark widget be called?
> - (A) "Bookmarked Features"
> - (B) "Saved Features"
> - (C) "Bookmarks" with a subtitle explaining they're features
> - (D) Something else (specify)

---

## Decision Triage

### Team Context

| Person | Role | Decision Authority |
|--------|------|-------------------|
| **Amy** | PI (Spatial Lab) | Final authority on major decisions |
| **Trisalyn** | PI (Spatial Lab) | Final authority on major decisions |
| **Dan** | Backend/GIS (Spatial Lab) | Technical approach, performance, backend architecture |
| **Kelly** | Dangermond Preserve Lead (TNC) | High-level TNC alignment, preserve-specific needs |
| **Sophia** | Technical Staff (TNC, reports to Kelly) | Day-to-day TNC feedback, user perspective |
| **Will** | Frontend Lead (Spatial Lab) | Implementation details, UI refinement |

**Decision Authority:** Spatial Lab (Amy/Trisalyn) are final decision-makers (Jack Dangermond grant). TNC (Kelly/Sophia) are collaborators whose feedback we value but don't require for sign-off except on preserve-specific matters.

---

## Issues

**Archived Tasks:** Tasks DFT-001 through DFT-040 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. Summaries remain in the Quick Reference table above.

---

### DFT-036: Feature Highlight on Bookmark Hover

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 5, 2026

**Context:**
When user hovers over a bookmarked feature in the Bookmarked Features widget, should the corresponding feature highlight on the map?

**Why this matters (Gestalt: Common fate / Nielsen: Recognition over recall):**
Highlighting creates a visual link between widget row and map feature, helping users understand the relationship without clicking.

**Questions Resolved:**
1. ✅ Does hovering a bookmark row highlight the feature on the map? **Yes, if feature is in viewport**
2. ✅ What does "highlight" look like? **Cyan ring (4px width, 8px offset) with subtle pulse (2 cycles, 800ms)**
3. ✅ Does this work for features not currently visible on the map? **Shows "📍 Off-screen" text indicator; click [View] to pan**
4. ✅ Should it scroll the map to show the feature? **No auto-pan on hover; click [View] button for deliberate pan**
5. ✅ Does hovering a pinned layer row highlight all its features? **No; layer headers are non-interactive per DFT-007**

**Resolution:** **Hover-to-highlight for in-viewport features (no auto-pan)**

### Design Decision

**Pattern:** Bookmark row hover → map feature highlights (if visible in viewport)

**Highlight Specification:**
- **Visual style:** Bright cyan ring (4px width, 8px offset from feature symbol)
- **Animation:** Subtle pulse (2 cycles, 800ms, `ease-in-out`)
- **Z-order:** Elevated above other features
- **Timing:** Instant feedback (<100ms via map API)
- **Reduced motion:** Static ring (no pulse) if user preference set
- **Cleanup:** Highlight clears on unhover (instant or 50ms fade-out)

**Off-Screen Features:**
- No map highlight (no forced pan)
- Widget row shows subtle "📍 Off-screen" text indicator (gray, 12px)
- Click [View] button to pan + zoom (deliberate action)

**Keyboard Support (WCAG 2.1.1):**
- Highlight follows Tab focus when navigating bookmark rows
- ARIA live region announces: "Feature CAM-042 highlighted on map" (polite)
- Maintains parity between mouse hover and keyboard focus

**Performance:**
- Debounce rapid hover events (50ms) to prevent map thrashing
- Single highlight at a time (clear previous on new hover)
- Only highlight when bookmark widget is expanded

**Edge Cases:**
- **Layer headers:** No hover highlight (non-interactive per DFT-007)
- **Multiple bookmarks of same feature:** Highlights same map feature (expected)
- **Widget collapsed:** No highlighting (widget not visible)
- **Feature not loaded:** Graceful degradation, no error
- **Map layer toggled off:** No highlight (respects layer visibility state)

### Design Rationale

Analyzed through 9 UI/UX frameworks with **strong cross-framework convergence:**

**✅ Gestalt (Common Fate, Proximity):** Widget hover + map highlight creates visual grouping, reinforces spatial relationship

**✅ Norman (Feedback, Conceptual Model):** Instant feedback for exploratory action, matches GIS software conventions (ArcGIS Pro, QGIS attribute table ↔ map coordination)

**✅ Norman (User Control):** No forced pan—hover remains lightweight, non-committal exploration

**✅ Nielsen (#1 Visibility, #6 Recognition):** Shows which map feature corresponds to row, removes memory burden of mental mapping

**✅ Nielsen (#4 Consistency, #7 Flexibility):** Follows GIS platform standards, enables efficient wayfinding for power users

**✅ Cognitive Science (Hick's Law, Feedback Timing):** Reduces decision complexity, instant feedback (<100ms)

**✅ Visual Fundamentals (Contrast, Hierarchy):** High-contrast ring (4.5:1), elevated z-order creates temporary focal point

**✅ WCAG (Perceivable, Operable, Understandable):** Keyboard support, ARIA announcements, respects `prefers-reduced-motion`

**✅ Behavioral Science (Perceived Control):** Responsive system, user-initiated, low-commitment interaction

**✅ Information Architecture (Wayfinding, Lensing):** Coordinates two views (list + map) of same data, reduces cognitive load

**✅ Motion/Time (Continuity, Easing):** Smooth fade-in (150ms `ease-out`), instant removal, respects reduced motion

**❌ Pan-on-Hover Rejected:** Violates user control (Norman), breaks instant feedback expectation (400-600ms pan duration), disorienting for keyboard users navigating list

### Deferred Enhancements (Phase 6)

**Edge Indicators for Off-Screen Features:**
- "Starfighter" style directional arrow at screen edge pointing toward off-screen bookmarks
- Shows direction + approximate distance
- Estimated effort: 6-8 hours (medium complexity)
- **Decision:** Defer to Phase 6 to preserve 15-day v2.0 timeline
- Gather user feedback: "Do you wish you knew which direction bookmarks were?"
- Implement if users express need; v2.0 text indicator may be sufficient

**Bidirectional Highlighting:**
- Map feature hover → highlight widget row
- Added complexity (widget may not be visible)
- Defer to Phase 6 for post-v2.0 user feedback

### Tradeoffs

**What we sacrifice:**
- Off-screen feature spatial feedback (hover provides none)
- Pan-to-feature on hover (users from consumer maps like Google Maps might expect it)
- Bidirectional highlighting (map → widget)
- Edge indicators (directional arrows)

**Why acceptable:**
- Click [View] is appropriate for deliberate pan action (keeps hover lightweight)
- Target audience (GIS researchers, DFT-011) expect GIS conventions (highlight-only), not consumer map behavior
- Unidirectional (widget → map) solves 80% use case; can add bidirectional based on feedback
- Simple text indicator adequate for v2.0; edge indicators add ~6-8 hours to timeline

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-0-foundation.md` (Task 0.6 acceptance criteria)
- ✅ `docs/IMPLEMENTATION/phases/phase-6-polish.md` (Deferred enhancements)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (9 frameworks analyzed)
- [x] Highlight visual specification provided
- [x] Keyboard support specified (WCAG compliance)
- [x] ARIA patterns specified
- [x] Edge cases handled
- [x] Off-screen behavior specified
- [x] Tradeoffs analyzed
- [x] Deferred enhancements documented (Phase 6)
- [x] Cross-references added

---

### DFT-037: Generate Component Specs + Mockups Reflecting All Resolved Design Decisions

**Category:** Task  
**Status:** 🟡 Open  
**Priority:** High  
**Source:** Will, Feb 3, 2026

**Context:**
Component specs define ASCII representations of each component with all states, pulling from all resolved DFTs. HTML mockups are then composed from these specs. Component specs are the authoritative source for what each component should look like.

**Prerequisites:**
- All high-priority design issues resolved (DFT-015, DFT-018, DFT-020, DFT-030) -- DONE
- All medium-priority design issues resolved (or explicitly deferred) -- DONE
- All resolved decisions documented in phase documents and master plan -- DONE
- DFT-038 (filter anatomy), DFT-039 (filter apply behavior), DFT-040 (dual-level distinction) -- DONE
- Sidebar Template System defined in `design-system.md` (TabBar, OverviewTab, ResultCard, Pagination, LeftSidebar, theme tokens) -- DONE

**Task:**
Generate component specs FIRST, then HTML mockups composed from those specs. Component specs define ASCII representations of each component with all states, pulling from all resolved DFTs.

**Phase 1: Component Specs (Planning)**
- [ ] **DFT-037-P1:** Component Spec: Left Sidebar (`docs/PLANNING/component-specs/left-sidebar.md`)
- [x] **DFT-037-P2:** Component Spec: Map Layers Widget (`docs/PLANNING/component-specs/map-layers-widget.md`)
- [x] **DFT-037-P3:** Component Spec: Bookmarked Items Widget (`docs/PLANNING/component-specs/bookmarked-items-widget.md`)
- [ ] **DFT-037-P4:** Component Spec: Right Sidebar Template (`docs/PLANNING/component-specs/right-sidebar-template.md`)

**Phase 2: HTML Mockups (Task)**
- [ ] **DFT-037a:** HTML Mockup: `mockups/02a-unified-layout.html` — Compose from P1-P4 specs
- [ ] **DFT-037b:** HTML Mockup: `mockups/02b-browse-inaturalist.html`
- [ ] **DFT-037c:** HTML Mockup: `mockups/02c-browse-animl.html`
- [ ] **DFT-037d:** HTML Mockup: `mockups/02d-browse-dendra.html`
- [ ] **DFT-037e:** HTML Mockup: `mockups/02e-browse-dataone.html`
- [ ] **DFT-037f:** HTML Mockup: `mockups/02f-export-builder.html`

**Component Spec Requirements:**
Each component spec must include:
- ASCII diagrams showing all states (empty, loading, error, populated)
- All interaction patterns as resolved in DFTs
- All visual specifications (spacing, typography, colors)
- State transitions and edge cases
- Accessibility requirements (ARIA, keyboard navigation)

**Mockup Requirements:**
HTML mockups must demonstrate:
- All resolved UX decisions from DFT-001 through DFT-040
- Empty states (per DFT-015)
- Loading states (per DFT-018)
- Error states (per DFT-030)
- All widget designs with final specifications
- All sidebar designs with final specifications
- All interaction patterns as resolved
- **Template-driven consistency** — mockups composed from component specs

**Template-Driven Mockup Strategy:**

The mockups must demonstrate the **Sidebar Template System** documented in `design-system.md`. This means:

1. **02a (unified layout)** defines the shared template — TabBar, OverviewTab layout, ResultCard shape, Pagination, LeftSidebar categories. This is the "master mockup" that all data sources inherit from.

2. **02b-02e (data source mockups)** only show content differences — which metadata fields, which filter controls, which result card slots. The structural layout (tabs, card shapes, spacing, typography) must be identical across all four.

3. **Any styling change to the template in one mockup must be applied to all others.** If the team decides to try different tab styling, card padding, or accent colors, it changes everywhere — not per-data-source.

4. **Documented exceptions** (ANiML landing cards, Dendra chart slider, Level 3 FeatureDetailCard) are the only places where data-source mockups diverge structurally from the template.

5. **Theme tokens** from `sidebarTheme` in `design-system.md` define the initial values for all shared styling (colors, spacing, typography). Mockups establish these initial values; team adjusts by changing tokens.

**Exclusions:**
- Any DFT decisions explicitly omitted or deferred to v2.1+
- Decisions marked as "defer to Phase 6" unless they affect mockup generation

**Post-Completion:**
After DFT-037 is complete, **archive resolved design decisions** to `PLANNING/resolved-decisions/` to keep `planning-task-tracker.md` manageable. The tracker should focus on open issues, not serve as a historical archive.

**Discussion:**
*All prerequisites met — ready to begin component specs*

**Resolution:** *Pending*

---

### DFT-038: Filter Section Anatomy — Shared Structural Template

**Category:** Design System  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Will + Claude design discussion, Feb 5, 2026  
**Resolved:** February 5, 2026

**Context:**
We have 4 data sources (iNaturalist, ANiML, Dendra, DataOne) that each need filter controls in the right sidebar Browse tab. Each has different applicable filters (species, date range, spatial filters, keywords, station selectors, etc.), but there is no shared design system for how these filters are visually structured. Without a consistent anatomy, 4 parallel Cursor agents will build 4 visually different filter UIs, making Phase 6 (Polish) significantly harder.

**What this decides:**
The structural skeleton that every Browse tab's filter section follows — not the exact styling (colors, border-radius, spacing values), which is deferred to mockup iteration (DFT-037).

**Filter Parameter Inventory (from service analysis):**

| Filter Type | iNaturalist | ANiML | Dendra | DataOne |
|---|:---:|:---:|:---:|:---:|
| Date range | Start/End | Start/End | Days-back / Range | Start/End |
| Text search | Taxon name | — | — | Title search |
| Single dropdown | Quality grade | Region, Status | Station, Datastream, Aggregation | Repository, TNC Category |
| Multi-select | Iconic taxa, Months | Species labels, Deployments | — | — |
| Toggle/Radio | Photo filter | — | "From most recent" | "Use preserve radius" |
| Result count | "X of Y observations" | "X cameras, Y images" | "X sensors" / "X data points" | "X of Y datasets" |
| Dual-level filters | No | Yes (camera + image) | Yes (station + datastream) | No |

**Resolution:** **Shared `FilterSection` anatomy template adopted — consistent skeleton across all 4 data sources**

### Design Decision

#### 1. Structural Skeleton

```
┌─────────────────────────────────────────┐
│ Filter [Plural Noun]         [Clear All]│  ← Header row (Clear All right-aligned, visible only when filters active)
│─────────────────────────────────────────│  ← Subtle separator (border-b)
│                                         │
│  [Control 1: full-width]                │  ← Text search always first (if present)
│  [Control 2] [Control 3] ← 2-col grid  │  ← Compact dropdowns paired
│  [Control 4: full-width]                │  ← Date ranges, multi-selects
│  ☐ [Toggle/checkbox option]             │  ← Checkboxes/toggles last
│                                         │
│─────────────────────────────────────────│  ← Subtle separator
│  Showing 47 of 876 [noun]              │  ← Result count footer
└─────────────────────────────────────────┘
│ [Feature list / results below]          │
```

**"Clear All" placement:** Header row, right-aligned — near where the user's eye lands when reading the filter title (Fitts's Law). Visible only when at least one filter is active. Gray link style, not a button (low visual weight until needed).

#### 2. Control Sizing Rules (within ~368px usable at 400px sidebar)

| Control Type | Layout | Width | Rationale |
|---|---|---|---|
| Text search | Full-width, always first position | 100% (`col-span-2`) | Serial Position Effect — first seen, most used |
| Single dropdown | Pair 2 side-by-side | ~50% each (`col-span-1`) | Compact, scannable |
| Date range (start + end) | Full-width, inline pair | 100% (`col-span-2`, 2-col internal) | Dates need space for readability |
| Multi-select (pills) | Full-width | 100% (`col-span-2`) | Pills need horizontal space |
| Toggle/checkbox | Full-width, at end of controls | 100% (`col-span-2`) | Low visual weight, end of list |

**Grid:** CSS Grid with `grid-template-columns: 1fr 1fr` and `gap: 8px` (8-point grid). Controls use `col-span-1` (half) or `col-span-2` (full).

**When only 1-2 dropdowns and no text search** (e.g., Dendra Level 2 with Region + Status), they still use the 2-column grid to reduce filter section height and keep more results visible (Shneiderman's overview-first).

#### 3. Section Header Convention

| Context | Pattern | Examples |
|---|---|---|
| Single-level layers | `"Filter [Plural Noun]"` | "Filter Observations", "Filter Datasets" |
| Dual-level, layer scope | `"Filter [Plural Noun]"` | "Filter Cameras", "Filter Sensors" |
| Dual-level, feature scope | `"Filter [Feature Noun]"` | "Filter Images", "Filter Datapoints" |

**Dropped:** The "Optional:" prefix from the ANiML mockup. Every filter is optional. The header convention is sufficient context. "Optional" adds cognitive load without value (Nielsen #8: Aesthetic minimalism).

#### 4. Container Styling

**Single flat background for all filter sections:**

```css
.filter-section {
  @apply bg-slate-50 border border-slate-200 rounded-lg p-3;
}
```

**Rejected:** Gradient backgrounds (`linear-gradient(135deg, ...)`) used in ANiML/Dendra mockups. Gradients add visual noise and diverge across data sources. A flat `slate-50` background creates sufficient Common Region grouping (Gestalt) without decoration. Exact values (border-radius, padding specifics) deferred to DFT-037 mockups, but the flat approach is locked in.

#### 5. Shared `FilterSection` React Component

A `FilterSection` wrapper enforces the anatomy. Each data source passes in its specific controls as children.

**Component interface (conceptual):**

```typescript
interface FilterSectionProps {
  label: string;              // "Filter Observations"
  resultCount: number;        // 847
  totalCount: number;         // 12430
  noun: string;               // "observations"
  hasActiveFilters: boolean;  // controls Clear All visibility
  onClearAll: () => void;
  children: React.ReactNode;  // Data-source-specific controls
}

// Usage:
<FilterSection
  label="Filter Observations"
  resultCount={847}
  totalCount={12430}
  noun="observations"
  hasActiveFilters={true}
  onClearAll={handleClearAll}
>
  <SearchInput className="col-span-2" ... />
  <Dropdown className="col-span-1" ... />
  <Dropdown className="col-span-1" ... />
  <DateRangePicker className="col-span-2" ... />
  <Checkbox className="col-span-2" ... />
</FilterSection>
```

The wrapper enforces:
- Section header with `label` prop and conditional "Clear All" link
- 2-column CSS grid layout for children
- Result count footer ("Showing X of Y [noun]")
- Consistent container styling (`bg-slate-50`, border, padding)
- Consistent 8px gap between controls

#### 6. Per-Data-Source Control Inventory

| Data Source | Level | Header | Controls (as children) |
|---|---|---|---|
| **iNaturalist** | Single | "Filter Observations" | Taxon dropdown, Species dropdown (2-col), Date range (full), Quality grade checkbox |
| **ANiML** | L2 | "Filter Cameras" | Region dropdown, Status dropdown (2-col) |
| **ANiML** | L3 | "Filter Images" | Species multi-select (full), Date range (full), Deployment dropdown |
| **Dendra** | L2 | "Filter Sensors" | Region dropdown, Status dropdown (2-col) |
| **Dendra** | L3 | "Filter Datapoints" | Date range (full), Aggregation dropdown |
| **DataOne** | Single | "Filter Datasets" | Title search (full), Repository dropdown, TNC Category dropdown (2-col), Date range (full) |

#### 7. What Is Deferred

| Deferred To | Item |
|---|---|
| **DFT-039** | Auto-apply vs Apply button behavior (consistency across data sources) |
| **DFT-040** | Visual distinction between Level 2 and Level 3 filter sections |
| **DFT-037** | Exact spacing values, border-radius, focus states, dropdown component choice, collapse/expand behavior, filter summary pill display |

### Design Rationale

Analyzed through 9 UI/UX frameworks with **strong cross-framework convergence:**

| Principle | How This Template Addresses It | Rating |
|---|---|:---:|
| **Gestalt: Common Region** | Bounded container groups all filter controls as a cohesive unit | ✅ |
| **Gestalt: Proximity** | Controls grouped tightly; result count at bottom adjacent to content it describes | ✅ |
| **Gestalt: Similarity** | Same container, header style, and control styling across all 4 data sources | ✅ |
| **Norman: Signifiers** | Section header ("Filter X") tells users exactly what they're editing | ✅ |
| **Norman: Affordances** | Dropdowns look selectable, inputs look typeable, "Clear All" looks clickable | ✅ |
| **Norman: Feedback** | Result count updates continuously as filters change (ties into DFT-039) | ✅ |
| **Nielsen #4: Consistency** | Same anatomy across all Browse tabs — researchers learn once, apply everywhere | ✅ |
| **Nielsen #6: Recognition** | Consistent control vocabulary reduces learning curve per new data source | ✅ |
| **Nielsen #8: Minimalism** | No "Optional:" labels, no gradient decoration, no unnecessary visual weight | ✅ |
| **Hick's Law** | 2-col grid keeps filter section compact; fewer visible items = faster scanning | ✅ |
| **Miller's Law** | Max ~5 controls per section; dual-level splits complexity across levels | ✅ |
| **IA: Wayfinding** | Header + result count = "where am I, what am I filtering, how many results" | ✅ |
| **IA: Progressive Disclosure** | Level 2 collapses when Level 3 is active (addressed in DFT-040) | ✅ |
| **Fitts's Law** | "Clear All" in header row (near eye focus); full-width inputs maximize target size | ✅ |
| **WCAG: Operable** | Standard form controls, keyboard navigable, labeled inputs | ✅ |

### Tradeoffs

**What we sacrifice:**
- Per-data-source visual flair (e.g., teal accent for Dendra filters) — replaced by uniform `slate-50`
- "Optional:" contextual labels — dropped for minimalism
- Gradient backgrounds in filter containers — dropped for consistency

**Why acceptable:**
- Uniform styling is the entire point (Nielsen #4) — data-source identity lives in the sidebar header, not the filter controls
- "Optional" is redundant when filters default to "All" — the empty state communicates optionality
- Gradients add visual noise at 400px width where space is premium

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/DESIGN-SYSTEM/design-system.md` (Filter Section Patterns)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (9+ frameworks analyzed)
- [x] Structural skeleton specified (ASCII diagram)
- [x] Control sizing rules specified (CSS Grid, col-span)
- [x] Section header convention locked
- [x] Container styling locked (flat `slate-50`, no gradients)
- [x] Shared component interface defined (`FilterSection`)
- [x] Per-data-source control inventory documented
- [x] Tradeoffs analyzed
- [x] Deferred items documented (DFT-039, DFT-040, DFT-037)
- [x] Cross-references added (design-system.md, master-plan.md)

---

### DFT-039: Filter Apply Behavior — Auto-Apply vs Explicit Apply Button

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Will + Claude design discussion, Feb 5, 2026  
**Resolved:** February 5, 2026

**Context:**
DFT-035 decided DataOne uses auto-apply (debounced instant search, immediate dropdown response). The Phase 3 Dendra spec still showed `[Apply]` buttons in ASCII diagrams (Tasks 3.3, 3.6). ANiML was already updated to auto-apply via DFT-003 (Feb 3). iNaturalist implied auto-apply but wasn't explicit. This created an inconsistency that would confuse researchers switching between data sources (Nielsen #4: Consistency).

**Actual state before resolution:**
- **iNaturalist:** Auto-apply implied ("Filters update the pinned layer's activeQuery")
- **ANiML:** Auto-apply explicit (DFT-003: "filter changes auto-apply to pinned layer")
- **Dendra:** Explicit `[Apply]` button in both Layer View and Feature View ASCII diagrams
- **DataOne:** Auto-apply explicit (DFT-035: debounced search + immediate dropdowns)

3 of 4 data sources already used auto-apply. Only Dendra had `[Apply]` buttons.

**Resolution:** **Option A — Auto-apply everywhere. No Apply button in any data source.**

### Design Decision

**Universal auto-apply rules (all data sources):**

| Control Type | Trigger | Timing | Rationale |
|---|---|---|---|
| Text search | Keystroke | 500ms debounce, 2+ chars | Per DFT-035 pattern |
| Single dropdown | Selection change | Immediate | Selecting = committed action (Norman) |
| Multi-select (pills) | Each toggle | Immediate | Each pill toggle = discrete commit |
| Date range (each field) | Calendar close / blur | Immediate per field | Calendar picker close = committed action |
| Toggle / checkbox | Click | Immediate | Binary state = instant feedback |

**Shared infrastructure (all data sources):**
- `AbortController` cancels in-flight requests when new filter state arrives
- Loading feedback per DFT-018 thresholds (300ms+ spinner, 3s+ text, 15s+ warning)
- Stale results visible with opacity overlay during loading (not blanked)
- Result count in `FilterSection` footer (DFT-038) updates continuously
- "Clear All" in filter header fires immediately, resets to unfiltered state
- ARIA live region announces result count changes

**Date range edge case:** Changing start date fires a query with new start + existing end date. Changing end date fires another query. `AbortController` cancels intermediate queries. Previous results remain visible with subtle opacity overlay during loading. This is the same pattern DataOne uses for its year range picker.

**Phase doc updates:**
- **Dendra (Phase 3):** Removed `[Apply]` buttons from Tasks 3.3 and 3.6 ASCII diagrams
- **iNaturalist (Phase 1):** Explicitly specified auto-apply behavior in Task 1.3
- **ANiML (Phase 2):** Already correct (auto-apply per DFT-003)
- **DataOne (Phase 4):** Already correct (auto-apply per DFT-035)

### Design Rationale

**Core tension:** Consistency (Nielsen #4) vs. Perceived Control (Shneiderman #7). An Apply button gives "I decide when to commit" feeling but breaks the feedback loop on every filter interaction. For a 4-control filter section, this adds 1 extra click per iteration cycle. Researchers (DFT-011) iterate frequently — this compounds.

**Why Dendra doesn't need special treatment:**
- Level 2 filters (Region, Status dropdowns): selecting from a dropdown *is* a committed action (Norman: Feedback). Apply after dropdown selection breaks the action-response link.
- Level 3 filters (date range + aggregation): same control types that DataOne uses with auto-apply.
- ANiML queries take 8-12s (slowest in the system) and already use auto-apply. If ANiML can handle it, Dendra can too.
- `AbortController` + debounce + loading states (DFT-018) mitigate all performance concerns.

| Principle | How Auto-Apply Addresses It | Rating |
|---|---|:---:|
| **Nielsen #4: Consistency** | Same behavior across all 4 Browse tabs — learn once, apply everywhere | ✅ |
| **Norman: Feedback** | Every control change produces immediate, visible result update | ✅ |
| **Norman: Conceptual Model** | "Adjust filter = see results" — no hidden staged state | ✅ |
| **Hick's Law** | No "Apply" decision per iteration; reduces micro-decisions by 1 per cycle | ✅ |
| **Nielsen #1: System Status** | Live result count always reflects current filter state | ✅ |
| **Shneiderman #3: Feedback** | Action → response loop unbroken for every control type | ✅ |
| **Shneiderman #4: Dialog Closure** | Each filter change = complete interaction cycle (not staged) | ✅ |
| **Shneiderman #7: User Control** | Slight tradeoff — users can't compose filters "offline" before committing | 🟡 |
| **Fitts's Law** | No Apply button target needed; full-width controls maximize hit area | ✅ |
| **Nielsen #5: Error Prevention** | `AbortController` prevents race conditions; debounce prevents over-querying | ✅ |
| **DFT-018 Compliance** | Tiered loading feedback for all query durations | ✅ |
| **DFT-038 Compliance** | Shared `FilterSection` component works identically everywhere | ✅ |
| **WCAG: Operable** | Standard form controls; Enter key bypass for text; ARIA announcements | ✅ |
| **IA: Mental Models** | Matches ArcGIS Hub, modern data catalog conventions | ✅ |

### Tradeoffs

**What we sacrifice:**
- "Compose multiple filters then commit" workflow — acceptable because each filter change is independently reversible via "Clear All" or individual control reset, and `AbortController` means intermediate queries have near-zero cost
- Slightly more API calls than explicit Apply — acceptable because ArcGIS hosted services handle this well, cancellation prevents wasted work, and silent staged state is worse for feedback
- Possible brief intermediate results during multi-filter changes — acceptable because stale results remain visible with overlay (not blanked), and intermediate state resolves in <500ms

**What we gain:**
- Perfect cross-source consistency (Nielsen #4)
- Unbroken feedback loop on every interaction (Norman)
- Fewer clicks per exploration cycle (Hick's Law)
- Simpler `FilterSection` component (no Apply button state management)
- Alignment with 3 existing data source decisions

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-3-dendra.md` (Tasks 3.3, 3.6 — removed `[Apply]` buttons)
- ✅ `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` (Task 1.3 — explicit auto-apply)
- ✅ `docs/DESIGN-SYSTEM/design-system.md` (Filter Apply Behavior subsection)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)
- ✅ `docs/PLANNING/resolved-decisions/dft-039-resolution-summary.md`

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (14 principles analyzed)
- [x] Universal auto-apply rules table provided (5 control types)
- [x] Shared infrastructure specified (AbortController, loading states, ARIA)
- [x] Date range edge case documented
- [x] Phase 3 Dendra ASCII diagrams updated (removed `[Apply]`)
- [x] Phase 1 iNaturalist auto-apply explicitly specified
- [x] Design system updated with Filter Apply Behavior subsection
- [x] Master plan Cross-Phase Decisions updated
- [x] Resolution summary created
- [x] Tradeoffs analyzed

---

### DFT-040: Dual-Level Filter Visual Distinction

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Will + Claude design discussion, Feb 5, 2026  
**Resolved:** February 5, 2026

**Context:**
ANiML and Dendra have two levels of filters that appear in the same right sidebar Browse tab:
- **ANiML:** Level 2 = "Filter Cameras" (region, status) → Level 3 = "Filter Images" (species, date)
- **Dendra:** Level 2 = "Filter Sensors" (region, status, time range) → Level 3 = "Filter Datapoints" (date range, aggregation)

DFT-004 established progressive disclosure: sidebar is the canonical filter editor, level transitions happen when users drill in/out. DFT-038 established a shared `FilterSection` component with flat `slate-50` background. The question: how do the two filter levels look visually distinct when the user is at Level 3?

**Key Insight:** Because of DFT-004, both levels are never fully expanded simultaneously. The user is always in one of two states:
- **State A (Layer View):** Only Level 2 filter visible. Standard `FilterSection`. No distinction needed.
- **State B (Feature View):** User drilled into a camera/sensor. Level 2 is irrelevant — the back button provides the escape hatch, and Level 2 filter state doesn't affect Level 3 content.

**Resolution:** **Condensed Feature Detail layout — no Level 2 summary bar, merged feature header + filter controls**

### Design Decision

**When user drills into a feature (Level 3), the Browse tab uses a 6-zone layout:**

```
┌─────────────────────────────────────────┐
│ ← Back to Cameras                      │  1. Navigation breadcrumb
├─────────────────────────────────────────┤
│ 📷 CAM-042 — North Ridge              │
│ Active • 10,847 images   [Clear] [↩]  │  2. Feature identity + filter actions
│─────────────────────────────────────────│
│  [Species ▼] [Deployment ▼]  (2-col)  │
│  [Date range: start — end]   (full)   │  3. Filter controls (DFT-038 grid)
│─────────────────────────────────────────│
│  Showing 47 of 10,847 images          │  4. Result count
├─────────────────────────────────────────┤
│  [Results list / image grid]           │  5. Results
├─────────────────────────────────────────┤
│  [← Prev]            [Next →]         │  6. Pagination
└─────────────────────────────────────────┘
```

**What was dropped:**
- **No Level 2 summary bar.** When drilled into CAM-042's images, the Level 2 filter ("All regions, Active") is irrelevant — it doesn't affect images at this camera. The back button is the only Level 2 reference needed. Level 2 filter state is preserved in memory and visible on return.
- **No separate "Filter [Noun]" header at Level 3.** The feature header card provides scope context. You're at CAM-042 — the filter controls below obviously filter CAM-042's images. Adding "Filter Images" is redundant (Nielsen #8: Minimalism).

**Feature header row specification:**

| Element | Styling | Purpose |
|---|---|---|
| Feature icon + name | `text-sm font-bold text-gray-900` | Feature identity (camera/sensor ID + location) |
| Status + count line | `text-[10px] text-gray-500` | Context metadata |
| [Clear] link | `text-[10px] text-gray-400 hover:text-red-500` | Clear All filters (per DFT-038/DFT-031) |
| [↩] undo button | `text-[10px] text-gray-400` (grayed when no actions) | Persistent undo (per DFT-031) |

**Filter controls:** Use the same DFT-038 CSS grid layout (`grid-template-columns: 1fr 1fr`, `gap: 8px`), `col-span-1`/`col-span-2` rules. Controls are children of the feature detail card, not wrapped in a standalone `FilterSection`.

**Per-data-source application:**

| Data Source | Feature Header | Filter Controls | Result Count |
|---|---|---|---|
| **ANiML** | `📷 CAM-042 — North Ridge` / `Active • 10,847 images` | Species multi-select, Date range, Deployment dropdown | "Showing 47 of 10,847 images" |
| **Dendra** | `🌧️ RS-042 — North Ridge` / `Active • Rain Gauge • 0.2mm` | Date range, Aggregation dropdown | "Showing 90 datapoints" |

**Component structure:**

| Context | Component | Notes |
|---|---|---|
| Single-level (iNaturalist, DataOne) | `FilterSection` (DFT-038) | Standard: header + grid + footer |
| Level 2 (ANiML cameras, Dendra sensors) | `FilterSection` (DFT-038) | Standard: "Filter Cameras" / "Filter Sensors" |
| Level 3 (drilled into feature) | `FeatureDetailCard` | Embeds filter controls directly; no separate `FilterSection` header |

**`FeatureDetailCard` component interface (conceptual):**

```typescript
interface FeatureDetailCardProps {
  icon: React.ReactNode;
  name: string;                 // "CAM-042"
  subtitle: string;             // "North Ridge"
  metadata: string;             // "Active • 10,847 images"
  resultCount: number;
  totalCount: number;
  noun: string;                 // "images" or "datapoints"
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  children: React.ReactNode;    // Filter controls (use DFT-038 grid)
}
```

**Location:** `src/v2/components/RightSidebar/FeatureDetailCard.tsx`

### Edge Cases

| Scenario | Behavior |
|---|---|
| User clicks "← Back" | Returns to Level 2 list view with Level 2 `FilterSection` visible; Level 2 filter state preserved |
| Feature disappears (Level 2 filter change via widget) | Navigate back to list with "Feature no longer matches current filters" message |
| All filters cleared | Result count shows full total; [Clear] link hidden; [↩] active for undo |
| Screen reader | Back button: `aria-label="Back to camera list"`; Feature header: `role="banner"`; Filter controls: standard form labels |

### Design Rationale

| Principle | How This Solution Addresses It | Rating |
|---|---|:---:|
| **Gestalt: Figure-Ground** | Active filter controls on `slate-50` grid; feature header on `white` — clear editing surface | ✅ |
| **Gestalt: Proximity** | Feature identity + filter actions + controls in one region — everything related is close | ✅ |
| **Norman: Conceptual Model** | "I'm at a camera. I see its info and its filters. Back takes me to the list." Clean spatial metaphor | ✅ |
| **Norman: Signifiers** | Form controls signal editability; back arrow signals escape; [Clear]/[↩] signal actions | ✅ |
| **Nielsen #1: Visibility** | Feature identity always visible at top of drilled-down view | ✅ |
| **Nielsen #4: Consistency** | Both ANiML and Dendra use same `FeatureDetailCard` pattern at Level 3 | ✅ |
| **Nielsen #6: Recognition** | Feature header provides scope — no need to recall what "Filter Images" refers to | ✅ |
| **Nielsen #8: Minimalism** | Dropped Level 2 summary bar (irrelevant), dropped "Filter [Noun]" header (redundant) | ✅ |
| **Hick's Law** | Only one set of filter controls visible — no Level 2 vs Level 3 decision | ✅ |
| **IA: Wayfinding** | Back button = "where I came from"; Feature header = "where I am" | ✅ |
| **IA: Progressive Disclosure** | Level 2 fully hidden at Level 3; revealed on back navigation | ✅ |
| **Fitts's Law** | [Clear] and [↩] in feature header row — near eye focus, no scrolling needed | ✅ |
| **WCAG: Perceivable** | Standard form controls, labeled, keyboard navigable | ✅ |
| **Motion: Continuity** | 150-200ms crossfade between Level 2 and Level 3 views (per DFT-019) | ✅ |

### Rejected Options

**Option A (original): Level 2 summary bar + separate FilterSection**
- Level 2 summary bar is irrelevant at Level 3 — doesn't affect feature content
- Creates 4 visual zones above results, wasting vertical space at 400px width
- Adds cognitive load without aiding the task at hand

**Option B: Accordion panels with colored left borders**
- Adds permanent color-coding vocabulary to learn
- Progressive disclosure already prevents simultaneous expansion
- Conflicts with DFT-038's "no per-data-source decoration" principle

**Option C: Sub-tabs within Browse tab**
- Creates "tab within tab" pattern (parallel framing for hierarchical relationship)
- Wastes horizontal space at 400px (DFT-033)
- Breaks spatial drill-down metaphor

### Tradeoffs

**What we sacrifice:**
- Visible Level 2 filter state when at Level 3 (acceptable: back button takes you there instantly)
- Separate "Filter [Noun]" header at Level 3 (acceptable: feature header provides scope)
- Ability to edit Level 2 filters without navigating back (acceptable: Level 2 doesn't affect Level 3 content)

**Why acceptable:**
- Level 2 filter state doesn't affect Level 3 content — cameras exist regardless of how the camera list was filtered
- Back button restores full Level 2 context with one click
- Condensed layout maximizes vertical space for results (critical at 400px sidebar width)
- Matches GIS conventions — ArcGIS Pro hides parent-level controls when drilled into feature detail

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-2-animl.md` (Task 2.4 decision note, updated acceptance criteria)
- ✅ `docs/IMPLEMENTATION/phases/phase-3-dendra.md` (Tasks 3.5/3.6 decision notes, updated ASCII diagrams)
- ✅ `docs/DESIGN-SYSTEM/design-system.md` (Dual-Level Filter Pattern section)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)
- ✅ `docs/PLANNING/resolved-decisions/dft-040-resolution-summary.md`

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (14 principles analyzed)
- [x] 6-zone layout specified (ASCII diagram)
- [x] Feature header row specification provided
- [x] `FeatureDetailCard` component interface defined
- [x] Per-data-source application documented (ANiML + Dendra)
- [x] Edge cases handled
- [x] Rejected options documented with rationale
- [x] Tradeoffs analyzed
- [x] Phase 2 ANiML updated (Task 2.4)
- [x] Phase 3 Dendra updated (Tasks 3.5, 3.6 — removed collapsed summary, updated ASCII diagrams)
- [x] Design system updated (Dual-Level Filter Pattern)
- [x] Master plan Cross-Phase Decisions updated
- [x] Resolution summary created
- [x] Cross-references added

---

### DFT-041: Right Sidebar Export Tab Content

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Component spec review (DFT-037-P4), Feb 6, 2026  
**Resolved:** February 6, 2026

**Context:**
DFT-002 resolved that the Export Builder lives in a modal opened from the global header shopping cart button. The right sidebar has three tabs: Overview, Browse, Export. But no DFT specifies what the Export tab actually contains.

**The problem:** If the Export Builder is a global modal, the per-layer Export tab risks being either (a) redundant, (b) empty/confusing, or (c) a useful summary that doesn't exist yet.

**Options:**
1. **Read-only per-layer summary** — Shows pin status, active filter count, bookmarked items from this layer, and directs user to the Export Builder modal. Informational only.
2. **Remove the Export tab entirely** — Reduce to 2 tabs (Overview | Browse). Export is exclusively accessed via the global header shopping cart. Simpler.
3. **Per-layer export configuration** — Allow users to configure export settings (format, fields) for this specific layer within the tab. Could duplicate Export Builder modal functionality.
4. **"Add to Export" action tab** — Shows what this layer would contribute to an export and has an "Add to Export Cart" button.

**Resolution:** **Option 2 — Remove the Export tab. Promote export status to Overview tab.**

### Design Decision

**Tab bar becomes:** `Overview | Browse` (two tabs only)

**Overview tab gains an export status section at the bottom:**

When layer is pinned:
```
│─────────────────────────────────────────│
│ Export Status                           │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Pinned · 3 filters · 2 bookmarks  │ │
│ │   Open Export Builder [cart-icon]   │ │
│ └─────────────────────────────────────┘ │
```

When layer is NOT pinned:
```
│─────────────────────────────────────────│
│ Export                                  │
│  Pin this layer to include in your      │
│  export package. [Pin Now]              │
```

**Rationale:**
- Export tab was a dead-end signpost — click → read → redirect to modal
- Shopping cart badge in header already provides always-visible export awareness
- Overview tab is the default landing screen (DFT-006), so export status is seen immediately
- Export status section provides actionable shortcuts: "Pin Now" button or "Open Export Builder" link
- Reduces cognitive load: 2 tabs < 3 tabs (Hick's Law)
- Per-layer export preview still lives in Export Builder modal (Phase 5, Task 5.2) where it's actionable

**What changes:**
- `TabBar` component: Drop from 3 tabs to 2
- `OverviewTab` component: Add export status section at bottom with conditional content (pinned vs unpinned)
- `OverviewTabProps` interface: Add `isPinned`, `activeFilterCount`, `bookmarkCount`, `onPinClick`, `onOpenExportBuilder` props
- Remove States 7 & 8 from right sidebar template spec (Export tab states)

### Design Rationale

Analyzed through 9 UI/UX frameworks with strong cross-framework convergence:

| Principle | How This Solution Addresses It | Rating |
|---|---|:---:|
| **Nielsen #8: Minimalism** | Removes a tab whose content is either empty or a redirect | ✅ |
| **Hick's Law** | 2 tabs < 3 tabs — faster tab selection per session | ✅ |
| **Norman: Conceptual Model** | Export is global (modal), not per-layer. Tab removal reinforces correct mental model | ✅ |
| **IA: Redundancy** | Eliminates 4th surface showing pin/bookmark status (left sidebar, widget, shopping cart badge, export tab) | ✅ |
| **Nielsen #6: Discoverability** | Export status section in Overview tab + shopping cart badge in header maintain awareness | ✅ |
| **Fitts's Law** | Eliminates dead-end click (tab → read → redirect). "Pin Now" and "Open Export Builder" are direct actions | ✅ |
| **Norman: Feedback** | Shopping cart badge updates in real time (better than tab requiring navigation) | ✅ |
| **Nielsen #4: Consistency** | Export Builder modal becomes the single export configuration surface (no competing UIs) | ✅ |
| **Norman: Affordances** | "Pin Now" button provides actionable shortcut from Overview | ✅ |
| **IA: Wayfinding** | "Open Export Builder" link provides direct path to canonical export surface | ✅ |
| **Gestalt: Proximity** | Export status near layer metadata = related context grouped | ✅ |
| **Serial Position Effect** | Browse CTA (most important) stays first; export status (secondary) at bottom | ✅ |

### Tradeoffs

**What we sacrifice:**
- Export tab as visible word in tab bar (reduces surface area for export awareness)
- A dedicated screen for per-layer export preview
- Visual symmetry of three equally-weighted tabs

**Why acceptable:**
- Shopping cart badge in header is always visible (better than a tab you navigate to)
- Per-layer export preview lives in Export Builder modal (Phase 5, Task 5.2) where it's actionable
- Two-tab layouts are common in GIS apps (ArcGIS Online uses Overview + Data, not three tabs)
- Overview tab's export status section is more useful because it's visible on default landing screen (DFT-006)

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/PLANNING/component-specs/right-sidebar-template.md` (TabBar updated, Export tab states removed, OverviewTab export section added)
- ✅ `docs/PLANNING/component-specs/right-sidebar-inaturalist.md` (Updated to 2-tab layout)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (12 principles analyzed)
- [x] ASCII diagrams provided for new export status section
- [x] Component interface updates specified (`OverviewTabProps`)
- [x] Tradeoffs analyzed
- [x] Component specs updated (right-sidebar-template.md, right-sidebar-inaturalist.md)
- [x] Cross-references added

---

### DFT-042: ANiML Landing Cards Mode-Switch

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** Component spec review (DFT-037-P4), Feb 6, 2026  
**Resolved:** February 6, 2026  
**Related:** DFT-003c

**Context:**
DFT-003c resolved that ANiML's Browse tab shows landing cards (Animal-First vs Camera-First) on first visit. User preference is remembered so landing cards are skipped on return. But how does a user switch modes after making their initial choice?

**The problem:** Once a user chooses Camera-First browsing, there's no specified way to switch to Animal-First (or vice versa). The user is locked into their initial choice unless we provide a switch mechanism.

**Resolution:** **Text link above filter section: "Switch to [other mode]"**

### Design Decision

**Visual placement:**
```
┌─────────────────────────────────────────┐
│ [shuffle-icon] Switch to Animal-First  │  ← Text link, gray-500, hover emerald-500
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ FILTER CAMERAS         [Clear All] │ │
│ │─────────────────────────────────────│ │
│ │ Region: [All ▼]  Status: [Active ▼]│ │
│ │─────────────────────────────────────│ │
│ │ Showing 42 of 73 cameras           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Link specification:**
- **Location:** Above filter section, standalone line (not inside `FilterSection` header)
- **Visual style:** Text link with shuffle icon (Lucide `ArrowLeftRight` or `Shuffle`), `text-gray-500 hover:text-emerald-500`, `text-sm`
- **Text pattern:** Dynamic based on current mode:
  - In Camera-First mode: "Switch to Animal-First"
  - In Animal-First mode: "Switch to Camera-First"
- **Always visible:** Present in both modes at all times
- **ARIA label:** `aria-label="Switch from Camera-First to Animal-First browsing"` (or vice versa)

**Behavior on click:**
1. If filters are active: Show confirmation dialog: "Switching modes will clear your current filters. Continue?"
2. If no filters: Switch immediately (no confirmation)
3. Update localStorage preference (`animl-browse-mode`)
4. 150-200ms crossfade transition (per DFT-019)
5. Render new filter controls for new mode
6. Clear results, load defaults for new mode
7. Optional toast notification: "Switched to Animal-First browsing"

**Confirmation dialog (when filters active):**
- Custom modal component (not `window.confirm()`)
- Title: "Switch Browse Mode?"
- Message: "Switching modes will clear your current filters. Continue?"
- Buttons: [Cancel] [Switch Mode]
- Cancel preserves current state, Switch Mode proceeds with mode change

**Mode preference storage:**
- Stored per-layer in localStorage: `animl-browse-mode` (values: `"animal-first"` or `"camera-first"`)
- Default for new users: `"camera-first"` (matches most common GIS workflow: browse by location first)

### Design Rationale

Analyzed through 9 UI/UX frameworks with strong cross-framework convergence:

| Principle | How Solution Addresses It | Rating |
|---|---|:---:|
| **Gestalt: Proximity** | Link near filter controls (spatially groups mode with filtering) | ✅ |
| **Gestalt: Figure-Ground** | Subtle styling (gray-500) keeps it background until needed | ✅ |
| **Norman: User Control** | Users can reverse mode choice at any time | ✅ |
| **Norman: Affordances** | Text link with icon signals clickability | ✅ |
| **Norman: Feedback** | Transition + toast notification confirm mode change | ✅ |
| **Nielsen #4: Consistency** | Always in same location (above filter section) | ✅ |
| **Nielsen #6: Recognition** | Explicit text "Switch to Animal-First" removes recall burden | ✅ |
| **Nielsen #7: Flexibility** | Expert users can switch modes when research question changes | ✅ |
| **Nielsen #8: Minimalism** | Text link (not button) keeps visual weight low | ✅ |
| **Shneiderman #6: Reversibility** | Mode switch is immediately reversible | ✅ |
| **Shneiderman #7: User Control** | User-initiated action, not system-forced | ✅ |
| **Hick's Law** | One additional control, but ignorable for satisfied users | ✅ |
| **IA: Findability** | Near filter controls (where mode manifests) | ✅ |
| **IA: Mental Models** | "This changes how I filter" → placed near filters | ✅ |
| **WCAG: Operable** | Keyboard accessible, clear ARIA label | ✅ |
| **WCAG: Understandable** | Explicit action text, predictable behavior | ✅ |
| **Motion: Continuity** | 150-200ms crossfade transition provides smooth feedback | ✅ |

**Core insight:** Researchers experiencing friction in one mode will look at the filter controls (where the mode manifests). Placing the switch link above the filter section maximizes discoverability while keeping visual weight low.

**Rejected options:**
- **Dropdown in header:** Competes with "Clear All", potentially confusing (is this filtering by mode or changing modes?)
- **Settings gear icon:** Buried in header, less discoverable, requires 2 clicks vs 1
- **Reset link in Overview tab:** Low discoverability (users in Browse tab won't see it), violates Fitts's Law

### Tradeoffs

**What we sacrifice:**
- One line of vertical space in Browse tab (acceptable: sidebar is scrollable, ~20px is minimal)
- Potential confusion if user accidentally clicks (acceptable: confirmation dialog prevents data loss)

**Why acceptable:**
- The alternative (no switch mechanism) violates Nielsen #7 (Flexibility) and Norman (User Control)
- Vertical space sacrifice is minimal (~20px at `text-sm`)
- Confirmation dialog for active filters prevents accidental data loss (DFT-031 patterns)

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-2-animl.md` (Task 2.2 updated with mode-switch spec)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)
- ✅ `docs/PLANNING/resolved-decisions/dft-042-resolution-summary.md`

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (17+ principles analyzed)
- [x] Visual placement specified (ASCII diagram)
- [x] Link specification provided (location, style, text pattern, ARIA)
- [x] Behavior specification provided (confirmation logic, transition, storage)
- [x] Tradeoffs analyzed
- [x] Rejected options documented with rationale
- [x] Phase 2 ANiML updated (Task 2.2)
- [x] Master plan Cross-Phase Decisions updated
- [x] Resolution summary created
- [x] Cross-references added

---

### DFT-043: Dendra Sidebar Body at Level 3

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** Component spec review (DFT-037-P4), Feb 6, 2026  
**Resolved:** February 6, 2026  
**Related:** DFT-004, DFT-040

**Context:**
DFT-004 resolved that Dendra's time-series chart renders in a floating pop-up on the map (with slider for exploration). DFT-040 resolved that Level 3 uses a `FeatureDetailCard` with embedded filter controls. But the spec doesn't fully define what the sidebar body shows beyond filter controls and the bookmark button when the chart is in the pop-up.

**The problem:** The sidebar has vertical space below the filter controls and result count that could either show useful content or remain empty. The chart is elsewhere (pop-up), so the sidebar is primarily a filter control panel at Level 3.

**Options considered:**
1. **Filter controls + bookmark only** — Sidebar is minimal at Level 3. All data visualization is in the pop-up. Clean separation.
2. **Filter controls + stats summary** — Show min, max, avg, total below the result count. Quick reference without needing to look at the chart.
3. **Filter controls + mini chart** — Small inline chart in the sidebar that mirrors the pop-up. Provides context if user closes the pop-up.
4. **Filter controls + data table** — Tabular view of datapoints as an alternative to the chart. Useful for researchers who want exact values.

**Resolution:** **Option 1 — Minimal sidebar (filter controls + bookmark only). Stats appear in pop-up footer.**

### Design Decision

**Sidebar at Level 3 contains:**
- Back button
- Sensor header with actions (Clear, Undo)
- Filter controls (time range, aggregation)
- Result count
- Bookmark button
- **No stats, no chart, no data table**

**Pop-up contains:**
- Time-series chart
- Interactive slider (exploration viewport, ephemeral)
- **Stats footer**: "Min: 12.3° | Max: 28.7° | Avg: 19.2° | Total: 847 readings"
- Action buttons: [View Full Chart] [Download CSV]

**Rationale:**
Analyzed through 9 UI/UX frameworks (Gestalt, Norman, Nielsen, Shneiderman, Cognitive Science, Visual Fundamentals, Accessibility, Behavioral Science, Information Architecture, Motion). **17 green / 0 yellow / 0 red** alignment score for Option 1.

**Key principles:**
- **Separation of concerns** (DFT-004 principle): Sidebar = parametric control, pop-up = visualization + metadata
- **Spatial proximity = cognitive proximity** (Gestalt, Norman): Stats (descriptive metadata) belong with chart (primary artifact), not with controls
- **Minimalism** (Nielsen #8): Sidebar remains focused control panel; no role creep
- **Reduced cognitive load** (Miller's Law): Sidebar stays at 7 chunks (not 11)
- **Reduced split attention**: Chart + stats co-located reduces eye travel and memory load
- **Accessibility** (WCAG Operable): Logical Tab order within pop-up container
- **Industry conventions** (IA Mental Models): Chart stats always appear with chart (Excel, Tableau, etc.)
- **Fitts's Law**: Stats near chart reduce cursor travel for users exploring data

**Tradeoffs accepted:**
- Users must have pop-up open to see stats (acceptable because stats without chart context are meaningless)
- Sidebar has white space below bookmark button (acceptable; reinforces "control panel" identity and reduces visual density)

**Optional enhancement (low priority):** If user research shows researchers need quick numeric reference without opening pop-up, consider adding inline stats to result count: `847 datapoints (12.3° – 28.7°, avg 19.2°)`. Default to minimal sidebar unless user testing indicates otherwise.

**Documented in:**
- Phase 3 Task 3.5 acceptance criteria updated (stats location clarified)
- right-sidebar-template.md open question #2 marked resolved
- Master plan UX Decisions section (DFT-043 entry added)
- Master plan Change Log updated

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 3 task 3.5 updated with stats location
- [x] right-sidebar-template.md open question marked resolved
- [x] Master plan UX Decisions section updated
- [x] Master plan Change Log updated

---

### DFT-044: Self-Contained Row Detail View Component

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Component spec review (DFT-037-P4), Feb 6, 2026  
**Resolved:** February 6, 2026  
**Related:** DFT-040, Phase 1 Task 1.5, Phase 4 Task 4.5

**Context:**
The template defines two shared components for Browse tab content views:
- `FilterSection` (DFT-038) — for list views with filters
- `FeatureDetailCard` (DFT-040) — for Level 3 drill-downs (ANiML cameras, Dendra sensors)

But iNaturalist (Phase 1, Task 1.5) and DataOne (Phase 4, Task 4.5) both have **detail views** for self-contained rows that don't fit either component. These are "click an item to see expanded details" views, not Level 3 drill-downs.

**The problem:** Without shared components, iNaturalist and DataOne will independently implement detail views that may drift visually. Both need: back button, expanded metadata, larger media display, action buttons.

**Resolution:** **No shared detail view component. Use shared sub-components + design tokens for consistency.**

### Design Decision

**Architectural principle:** Maintain **consistent structural template** (Overview | Browse tabs, shared FilterSection, shared ResultCard) with **flexibility for custom-built content components** when use cases differ.

**Rationale:** iNaturalist observations (atomic events) and DataOne datasets (structured resources) are conceptually different:
- **iNaturalist:** Hero image + flat metadata grid + 3 actions. Simple 6-zone layout.
- **DataOne:** Multi-section hierarchical layout (abstract, files, keywords, spatial, temporal) + 4 actions + progressive disclosure.

Forcing both into a shared `ItemDetailView` component creates a leaky abstraction with complex props (`sections[]`, optional hero, conditional actions). This violates Nielsen #8 (Minimalism) and increases cognitive load (Hick's Law).

**Pattern:** Extract **shared sub-components** for scaffolding consistency, build **purpose-specific detail views** for content strategy.

### Shared Sub-Components Created

**1. `DetailBackButton.tsx`** (in `shared/`)
```typescript
interface DetailBackButtonProps {
  label: string;              // "Back to Observations"
  onClick: () => void;
}
```
- Consistent styling: `text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1`
- Icon: Lucide `ChevronLeft` (12px)
- Keyboard: focusable, Enter activates
- ARIA: `aria-label={label}`

**2. `DetailActionRow.tsx`** (in `shared/`)
```typescript
interface DetailActionRowProps {
  actions: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
    icon?: React.ReactNode;
  }[];
}
```
- Consistent button styling (DFT-031 standards)
- Flex layout with gap
- Responsive: wraps on narrow screens

**3. `DetailMetadataGrid.tsx`** (in `shared/`)
```typescript
interface DetailMetadataGridProps {
  items: { label: string; value: string }[];
}
```
- 2-col layout: `grid-cols-[auto_1fr]`
- Label: `text-xs text-gray-500 font-medium`
- Value: `text-sm text-gray-900`
- Reusable by any detail view needing key-value pairs

### Purpose-Built Detail Views

**4. `iNaturalist/ObservationDetailView.tsx`**
- Uses `DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`
- Hero image section (unique to observations)
- Simple layout: back → hero → title → grid → actions

**5. `DataOne/DatasetDetailView.tsx`**
- Uses `DetailBackButton`, `DetailActionRow`
- Multi-section layout: back → title → abstract → files → keywords → spatial → temporal → actions
- Progressive disclosure for abstract (expand/collapse at 500 chars)
- Does NOT use `DetailMetadataGrid` (different layout strategy)

### Design Tokens (added to `design-system.md`)

```typescript
export const detailViewTokens = {
  container: 'bg-white p-4',
  titlePrimary: 'text-base font-semibold text-gray-900',
  titleSecondary: 'text-sm text-gray-500 italic',
  sectionSeparator: 'border-t border-gray-200 my-3',
  sectionLabel: 'text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2',
  heroImage: 'w-full aspect-[4/3] object-cover rounded-lg mb-3',
};
```

### Design Rationale

Analyzed through 9 UI/UX frameworks with strong alignment for Option C (sub-components):

| Principle | How This Solution Addresses It | Rating |
|---|---|:---:|
| **Gestalt: Common Region, Similarity** | Shared sub-components (back button, action row) create consistent boundaries and styling | ✅ |
| **Norman: Conceptual Model** | Purpose-built components match mental models (observation = event, dataset = resource) | ✅ |
| **Norman: Affordances** | Each view shows appropriate affordances (DOI/Cite for datasets, hero image for observations) | ✅ |
| **Nielsen #4: Consistency** | Sub-components + tokens enforce consistency without forcing abstraction | 🟡 |
| **Nielsen #6: Recognition** | Back button, action row, title hierarchy consistent → learnable pattern | ✅ |
| **Nielsen #8: Minimalism** | No leaky abstraction; each component is simple and purpose-built | ✅ |
| **Hick's Law** | Simple interfaces (no complex `sections[]` prop) reduce cognitive load | ✅ |
| **IA: Mental Models** | Observations and datasets treated as distinct types (accurate to domain) | ✅ |
| **IA: Progressive Disclosure** | DataOne can implement collapsible abstract; iNaturalist doesn't need it | ✅ |
| **WCAG: Operable** | Shared sub-components ensure consistent keyboard navigation and ARIA | ✅ |
| **Visual Fundamentals: Hierarchy** | Design tokens enforce consistent visual hierarchy across detail views | ✅ |

**Note:** Nielsen #4 (Consistency) gets 🟡 because we rely on developer discipline to use shared sub-components + tokens. A monolithic shared component would *enforce* consistency but at the cost of complexity (Hick's Law) and conceptual clarity (Norman).

### Edge Cases

| Scenario | Handling |
|---|---|
| iNaturalist observation with no photo | No hero section. `DetailMetadataGrid` starts immediately after title. |
| DataOne dataset with no files | Files section omitted. No empty state needed. |
| DataOne abstract >500 characters | Truncate at 500 chars with "Read more" link. Expands inline (accordion). |
| Screen reader navigation | `DetailBackButton` announces destination. Action row buttons have clear labels. Metadata grid uses `<dl>` semantic HTML. |
| Keyboard navigation | Tab order: back → title (non-interactive) → actions (focusable). |
| Mobile (future) | Hero image maintains aspect ratio. Metadata grid stacks to 1-col on <400px width. Action row wraps. |

### Tradeoffs

**What we sacrifice:**
- Enforced layout consistency via single component — relies on developer discipline to use shared sub-components
- Single source of truth for detail view layout — two components means two places to maintain

**Why acceptable:**
- iNaturalist and DataOne detail views are conceptually different (atomic event vs. structured resource)
- The scaffolding (back button, action row) is shared via sub-components
- The content strategy (hero + flat grid vs. multi-section hierarchical) should differ
- Nielsen #4 (Consistency) applies to user-facing patterns (back button placement, action row styling), not component architecture
- Users don't see components — they see consistent UI patterns
- Future extensibility: New data sources can compose from same sub-components without touching existing ones

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/PLANNING/component-specs/right-sidebar-template.md` (Sub-components section added)
- ✅ `docs/DESIGN-SYSTEM/design-system.md` (Detail view tokens added)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (11 principles analyzed)
- [x] Sub-component interfaces defined (3 components)
- [x] Purpose-built detail view components specified (iNaturalist, DataOne)
- [x] Design tokens specified
- [x] Edge cases handled
- [x] Tradeoffs analyzed
- [x] Cross-references added

---

### DFT-045: Left Sidebar Taxonomy for DataOne

**Category:** IA  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Phase 4 planning review, Feb 6, 2026

**The Problem:** DataOne datasets span multiple scientific domains (species, freshwater, fire, soils, etc.). The left sidebar has 13 TNC domain categories. Should "Research Datasets" exist as a standalone category, or should DataOne be distributed/cross-referenced across domain categories?

**Resolution:** **Hybrid model (Model C) — Standalone category + explicit DataOne shortcut rows in domain categories**

### Design Decision

**Left Sidebar — Category Expanded:**
```
┌────────────────────────────────────────────┐
│ v [icon] Species                       (3) │
│      Camera Traps (ANiML)                  │
│      iNaturalist Observations              │
│      eBird Sightings                       │
│      📚 DataOne Datasets (15)              │  ← Special shortcut row
│                                             │
│ v [📚] Research Datasets                (1) │
│      DataOne Datasets                      │  ← Canonical location
└────────────────────────────────────────────┘
```

### How It Works

1. **Canonical Location:**
   - DataOne lives as a layer under "Research Datasets" category
   - Clicking "DataOne Datasets" here opens right sidebar with **no domain pre-filter** (shows all datasets)

2. **Domain Shortcuts:**
   - When a domain category is expanded, a special row appears at the bottom: `📚 DataOne Datasets (count)`
   - Count shows number of DataOne datasets for that domain (e.g., "15" species datasets)
   - Special row only appears if count > 0 for that domain

3. **Clicking Shortcut Row:**
   - Activates DataOne layer (right sidebar opens to Browse tab)
   - Pre-filters Browse tab category dropdown to that domain (e.g., "Species")
   - Map shows DataOne datasets filtered to that domain
   - Result count updates (e.g., "Showing 15 datasets")

### Visual Specs

**Special Shortcut Row:**
- **Label:** `DataOne Datasets (count)` — explicitly shows source (not generic "Research Datasets")
- **Icon:** Lucide `Library` or `BookOpen` (16×16px, books/library icon)
- **Styling:** `text-sm text-gray-600 italic` (muted, italic signals "shortcut/link")
- **Spacing:** `mt-1.5` (small gap above to visually separate from regular layers)
- **Optional:** 1px `border-top border-gray-200` above row as subtle divider
- **Hover:** `hover:bg-emerald-50` (subtle green tint to match DataOne theme)
- **Placement:** Always last row within expanded category (after all regular layers)

### Design Rationale

**Core Insight:** Model A (standalone only) creates a discoverability cliff. Researchers exploring "Species" won't discover DataOne datasets without prior knowledge of the "Research Datasets" category. This is especially problematic for Jack Dangermond's demo — we want the app to feel comprehensive, not like it's hiding data.

**Why Hybrid (Model C):**
- ✅ **Findability:** Special rows appear exactly where users are looking (domain context)
- ✅ **Actionable:** Shortcut row is clickable with clear affordance
- ✅ **Efficiency:** Reduces clicks — no need to navigate to Research Datasets → filter by domain
- ✅ **Conceptual clarity:** DataOne has two access paths: direct (Research Datasets) and contextual (domain shortcuts)
- ✅ **Progressive disclosure:** Only appears when category is expanded
- ✅ **Future-proof:** Explicit "DataOne" label allows adding other repos later (Dryad, Zenodo) with different icons

**Why Explicit "DataOne" Label:**
- Future extension: if we add Dryad, we add `🗂️ Dryad Datasets (8)` with different icon
- Clarity: users know exactly what they're clicking
- YAGNI: don't over-engineer for hypothetical multi-repo state

### Implementation Details

**Data loading:**
```javascript
// On sidebar mount
const categoryBreakdown = await dataOneService.getCategoryCounts();
// Returns: { species: 15, fire: 8, freshwater: 12, ... }
```

**Activation behavior:**
```javascript
function activateDataOneWithFilter(domain) {
  activateLayer('dataone-datasets');
  setActiveTab('browse');
  setDataOneCategoryFilter(domain);
  fetchDataOneDatasetsForCategory(domain);
}
```

### Edge Cases

**"Research Datasets" Category:** Clicking canonical "DataOne Datasets" layer activates DataOne without pre-filtering (shows all datasets, category dropdown = "All Categories")

**Categories with 0 Datasets:** No shortcut row appears (e.g., Boundaries has 0 DataOne datasets)

**Future: Multiple Repos:**
```
│      📚 DataOne Datasets (15)              │
│      🗂️ Dryad Datasets (8)                 │  ← Different icon
```
If 2+ shortcuts feel cluttered, can add flyout/submenu logic in v2.1+.

### Tradeoffs

**What we sacrifice:**
- Slightly more complex left sidebar (special rows add visual elements)
- Small implementation cost (query DataOne for category counts, render shortcut component)

**Why acceptable:**
- Special rows are subtle and only appear when category is expanded
- Implementation cost is low (1-2 hours)
- Dramatically improves discoverability for domain-first users (majority use case)
- Protects against "where did all the research datasets go?" confusion during demo
- Natural extension path for future repositories

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/PLANNING/component-specs/left-sidebar.md` (State 9: Special DataOne Shortcut Row)
- ✅ `docs/IMPLEMENTATION/phases/phase-4-dataone.md` (Updated Task 4.2)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)
- ✅ `docs/PLANNING/resolved-decisions/dft-045-resolution-summary.md` (Resolution summary)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (9 frameworks analyzed)
- [x] Visual examples provided (ASCII diagrams)
- [x] Implementation details specified (data loading, rendering, activation)
- [x] Edge cases handled
- [x] Tradeoffs analyzed
- [x] Component specs updated (left-sidebar.md)
- [x] Phase document updated (phase-4-dataone.md)
- [x] Cross-references added to master plan
- [x] Resolution summary created

---


### DFT-002: Export Button Placement/Visibility ✅

**Resolved:** Jan 29, 2026  
**Source:** Sophia Leiker, Jan 23, 2026

**Decision:** **Shopping cart button in global header (top-right corner)**

**Key Design Elements:**
- **Placement:** Top-right corner of global header, equidistant from both floating widgets
- **Visual design:** Shopping cart icon (🛒) with "Export All" label
- **Badge indicator:** Red circle showing total count (pinned layers + bookmarked features)
- **Accent color:** Yellow/orange to make it pop and feel distinct from other UI elements
- **Action:** Opens unified Export Builder modal showing both pinned layers and bookmarked features
- **Rationale:**
  - Follows universal shopping cart convention (top-right = "saved items basket")
  - Global header placement = global action (not tied to single layer or widget)
  - Equidistant from both widgets → doesn't favor one over the other
  - Avoids Law of Proximity violation (not in right sidebar which implies single-layer scope)

**Impact:**
- Phase 0 task 0.1 updated with header button requirement
- Phase 5 task 5.1 updated: modal opens from global header (not bookmark widget)
- Master plan updated with cross-phase UX decision

---

## Changelog

| Date | Change |
|------|--------|
| Feb 6, 2026 | **Completed DFT-037-P1:** Left Sidebar component spec (docs/PLANNING/component-specs/left-sidebar.md) finalized with all resolved design decisions. Added State 9: Special DataOne Shortcut Row (DFT-045) with full visual specs, rendering logic, click behavior, and design rationale. Updated Interactions table, Design Decision Summary, Open Questions, and Anatomy section. Status: ✅ Complete — ready for dev |
| Feb 6, 2026 | Resolved DFT-045: Left sidebar taxonomy — Hybrid model (Model C) with explicit DataOne shortcut rows. DataOne has canonical location under "Research Datasets" category (no pre-filter, shows all datasets). Special shortcut rows appear at bottom of expanded domain categories (e.g., "📚 DataOne Datasets (15)"), providing quick access to pre-filtered datasets. Clicking shortcut activates DataOne with that domain pre-filtered in Browse tab. Improves discoverability for domain-first users without cluttering sidebar. Analyzed via 9 UI/UX principles. See left-sidebar.md State 9, dft-045-resolution-summary.md |
| Feb 6, 2026 | Resolved DFT-043: Dendra sidebar body at Level 3 — minimal sidebar (filter controls + bookmark only). Stats appear in pop-up footer with chart. Rationale: separation of concerns (sidebar = parametric control, pop-up = visualization + metadata), spatial/cognitive proximity (stats belong with chart), minimalism (Nielsen #8), reduced split attention, accessibility (logical Tab order), industry conventions (chart metadata lives with chart). Scored 17 green / 0 yellow / 0 red across 9 UI/UX frameworks. Updated Phase 3 Task 3.5, right-sidebar-template.md open question #2, master-plan.md UX Decisions |
| Feb 6, 2026 | Resolved DFT-044: Self-contained row detail view component — no shared detail view component. Extract shared sub-components (`DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`) + design tokens for consistency. Purpose-built detail views for iNaturalist (hero image + flat grid) and DataOne (multi-section hierarchical). Architectural principle: consistent structural template (tabs, scaffolding) with flexibility for custom content. Analyzed via 11 design principles. See right-sidebar-template.md sub-components section |
| Feb 6, 2026 | Resolved DFT-042: ANiML landing cards mode-switch — text link above filter section ("Switch to [other mode]"). Always visible, subtle styling (gray-500, hover emerald-500). Confirmation dialog if filters active. Analyzed via 17+ UI/UX principles. Rationale: discoverable near filters (where mode manifests), low visual weight (Nielsen #8), user control (Norman), flexibility for expert users (Nielsen #7). Rejected options: dropdown (confusing), settings gear (less discoverable), Overview reset (violates Fitts's Law). Mode preference stored per-layer in localStorage. Updated Phase 2 Task 2.2, master plan, created resolution summary |
| Feb 6, 2026 | Resolved DFT-041: Right sidebar Export tab — remove Export tab entirely (reduce to 2 tabs: Overview | Browse). Export status promoted to Overview tab with actionable shortcuts ("Pin Now" / "Open Export Builder"). Analyzed via 12 design principles (Nielsen #8 Minimalism, Hick's Law, Norman, IA Redundancy, Fitts's Law). Shopping cart badge in header provides always-visible export awareness. Updated component specs (right-sidebar-template.md, right-sidebar-inaturalist.md) |
| Feb 6, 2026 | Added DFT-041 through DFT-044: open design questions surfaced during right sidebar component spec (DFT-037-P4). DFT-041: Export tab content. DFT-042: ANiML landing cards mode-switch. DFT-043: Dendra sidebar body at Level 3. DFT-044: Self-contained row detail view component (iNaturalist + DataOne shared pattern). All 🟡 Open, awaiting design principles analysis |
| Feb 5, 2026 | Resolved DFT-038: Filter section anatomy — shared `FilterSection` component enforces consistent Browse tab filter anatomy across all 4 data sources. Structural skeleton: header row with conditional "Clear All", 2-col CSS grid, result count footer. Flat `slate-50` container (no gradients). Header convention: "Filter [Plural Noun]". "Optional:" labels dropped. Per-data-source control inventory documented. Analyzed via 9 UI/UX frameworks. See design-system.md Filter Section Patterns |
| Feb 5, 2026 | Archived DFT-033 through DFT-035 to `PLANNING/resolved-decisions/` with full resolution summaries. Detailed sections removed from tracker to keep it manageable; summaries remain in Quick Reference table |
| Feb 5, 2026 | Added DFT-038 (filter section anatomy), DFT-039 (filter apply behavior consistency), DFT-040 (dual-level filter visual distinction). These three items establish the Browse tab filter design system before mockup generation. DFT-038 proposes a shared `FilterSection` component to enforce consistent anatomy across all data sources. DFT-039 addresses inconsistency between DataOne's auto-apply (DFT-035) and ANiML/Dendra's `[Apply]` button pattern. DFT-040 addresses visual distinction for dual-level data sources (ANiML, Dendra). Updated DFT-037 prerequisites to include DFT-038 and DFT-039 as blocking |
| Feb 5, 2026 | Resolved DFT-035: DataOne search behavior — debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Text search uses Enter key bypass for power users. Initial state loads all datasets (most recent first), eliminating v1 "pre-search" dead state. Pagination with Previous/Next (20 per page). `AbortController` cancels in-flight requests to prevent race conditions. Loading feedback per DFT-018 thresholds. Analyzed via Norman (Feedback), Nielsen (#1 System Status, #5 Error Prevention), Shneiderman (#3, #4, #7), Hick's Law, Fitts's Law, Mental Models (ArcGIS Hub conventions), Wayfinding, Accessibility. Tradeoff: slight control feeling sacrifice vs. continuous feedback + eliminated friction. See Phase 4 task 4.3 |
| Feb 5, 2026 | Resolved DFT-034: Drag-and-drop reorder feedback — enhanced lifted row visual treatment (60% opacity, 95% scale, 2deg rotation, dashed border), 4px drop line with background highlight, 400ms settle animation with green highlight, toast notification for map z-order updates, keyboard support (arrow keys + Shift+Home/End), ARIA announcements for screen readers. Analyzed through 9 UI/UX frameworks. Keyboard support essential for v2.0 WCAG compliance (not deferred). Aligns with animation timing standards (DFT-025: 250-400ms). See Phase 0 task 0.5 |
| Feb 5, 2026 | Resolved DFT-033: Right sidebar width and resizability — fixed width at 400px (not resizable). Analyzed through 9 UI/UX frameworks. Rationale: simplicity serves task, no user need for resize, matches GIS conventions, reduces cognitive load, enables optimized content layout. Optional collapse toggle deferred. Affects all phases with right sidebar implementations |
| Feb 4, 2026 | Resolved DFT-031: Context-specific undo buttons — no confirmation dialogs. Each widget has persistent undo button (always visible, grayed when inactive). Stack size: 5 actions per region. Cmd/Ctrl+Z support in Phase 6. Analyzed via Norman, Nielsen, Gestalt, behavioral science |
| Feb 3, 2026 | **UX Design Review:** Added DFT-015 through DFT-037 (23 new issues). DFT-015 through DFT-036 cover empty states, responsiveness, accessibility, loading states, navigation behavior, terminology consistency, edge cases, visual specs, microinteractions, and interaction patterns. DFT-037 is the mockup generation task (blocked until design decisions resolved). **High-priority:** DFT-015 (empty states), DFT-018 (loading states), DFT-020 (pointer-row bookmark UI), DFT-030 (error states), DFT-037 (mockup generation). **Note:** After DFT-037, archive resolved decisions to keep tracker manageable |
| Jan 26, 2026 | Initial tracker created with 9 issues from Sophia's Jan 23 feedback |
| Jan 26, 2026 | Updated paradigm sign-offs: Dan, Trisalyn, and Amy approved core paradigm |
| Jan 26, 2026 | Added DFT-010 through DFT-014 from Trisalyn meeting feedback |
| Jan 26, 2026 | Resolved DFT-010: Applied "items" → "features" terminology to dev plan docs |
| Jan 26, 2026 | Added Discussion Items table and Team Context section |
| Jan 26, 2026 | Updated DFT-006 with Will's recommendation (Overview first with Browse button) |
| Jan 27, 2026 | Resolved DFT-001: Adopted Model C (selection = active, pin separate) with filter indicators |
| Jan 29, 2026 | Resolved DFT-002: Export button moves to global header (top-right) with shopping cart design |
| Jan 29, 2026 | Resolved DFT-005: Auto-collapse Pinned Layers widget when viewing time-series data |
| Feb 2, 2026 | Resolved DFT-003b: "Create New View" lives in expanded panel when layer is active (Option C) |
| Feb 2, 2026 | Resolved DFT-003c: Landing cards approach for Animal-First/Camera-First entry point |
| Feb 2, 2026 | Resolved DFT-004: Progressive disclosure + direct/parametric separation. Sidebar edits filters (context-aware), pop-up has slider only (exploration), widget shows status |
| Feb 2, 2026 | Resolved DFT-006: Overview tab opens first when layer selected, with prominent "Browse Features →" button |
| Feb 2, 2026 | Resolved DFT-007: Bookmark widget groups features by parent layer; layer header is non-interactive context label using muted styling |
| Feb 3, 2026 | Resolved DFT-012: Camera trap clustering — count badges on camera icons showing filtered image counts. Badges appear when layer-level filter is applied. Progressive disclosure integration confirmed |
| Feb 3, 2026 | Resolved DFT-013: Multiple filtered views — "Multiple Saved, Single Visible" model. Users can save multiple filtered views but only one is visible at a time (mutual exclusivity). Nested widget structure when 2+ views exist. Memory-preserving parent toggle. Future enhancement could allow limited simultaneous views |
| Feb 3, 2026 | Created `PLANNING/future-enhancements.md` backlog for v2.1+ features. Moved DFT-014 (biodiversity aggregation) to backlog. Updated tracker scope to clarify it's focused on v2.0 design decisions |
| Feb 3, 2026 | Resolved DFT-015: Empty state design — show with placeholder, differentiate first-visit (educational) vs returning (laconic). Configurable terminology via `src/config/terminology.ts` ("Feature" vs "Item"). Widget titles use pattern: "Pinned {childNoun} Layers" / "Bookmarked {childNoun}s". Utilitarian tone, simple SVG icons (no emoji). Drone/LiDAR confirmed as pin-only (no bookmarkable items) |
| Feb 3, 2026 | Resolved DFT-018: Loading states — hybrid indicators (skeleton for content, spinner for actions, progress bar for ANiML queries). Region-specific/non-blocking/escapable. Dynamic ETA for multi-query operations. Progressive image loading with infinite scroll. Timeout thresholds: 0-300ms none, 300ms-3s spinner, 3s-15s +text, 15s+ warning, 30s auto-timeout. Added to `DESIGN-SYSTEM/design-system.md` |
| Feb 4, 2026 | Resolved DFT-019: Edit Filters button navigation — "Edit Filters →" label with arrow, widget stays expanded, right sidebar uses 150-200ms crossfade transitions. Separation of concerns: widget manages visibility, sidebar manages editing |
| Feb 4, 2026 | Resolved DFT-020: Pointer-row bookmark UI — single button pattern ("Bookmark" always captures current filter state). Removed "Bookmark with Filter" variant to reduce cognitive load |
| Feb 4, 2026 | Resolved DFT-021: Terminology consistency — "Active" layer (visible on map) vs "Selected" layer (chosen for editing). Applied throughout docs |
| Feb 4, 2026 | Deferred DFT-022: Parent toggle memory edge case — runtime state management question best solved during implementation |
| Feb 4, 2026 | Deferred DFT-023: Widget positioning dimensions — exact pixel values deferred to mockup/implementation phase with constraints (8px grid, ArcGIS reference, adaptive height, DFT-019 animation standards, left-aligned collapse button for accessibility) |
| Feb 4, 2026 | Resolved DFT-024: Filter indicator design — icon-based approach (Lucide Filter icon + count). Single-line rows, tooltip for learnability. Removed A/B testing toggle |
| Feb 4, 2026 | Resolved DFT-025: Create New View transition animation — inline transformation with sequential staging (250-300ms). Row expands → children appear → new child highlights. Respects reduced motion. Focus moves to new child. Screen reader announces state change |
| Feb 4, 2026 | Resolved DFT-028: Zero-result camera behavior — cameras with 0 matching images grayed out (not hidden). 40-50% opacity, desaturated, no badge. Remain clickable/accessible. 300ms ease-out transition. Preserves spatial context for negative evidence discovery |
| Feb 4, 2026 | Resolved DFT-029: Unfiltered layer badge behavior — no badges when layer has no filter. Badges only appear when layer-level filter is applied (semantic indicator). Optional hover tooltip shows total count. Follows Gestalt figure/ground and Shneiderman's overview-first principles |
| Feb 4, 2026 | Resolved DFT-032: Map tooltip design — minimal MVP approach (ID + Type only). Defer filter-aware content to post-v2.0 after teammate feedback. Recommend native browser tooltips (title attribute) for zero overhead. Format: "CAM-042 • Camera". Extensible for future enhancement |

| Feb 5, 2026 | Resolved DFT-033: Right sidebar width and resizability — fixed width at 400px (not resizable). Analyzed through 9 UI/UX frameworks. Rationale: simplicity serves task, no user need for resize, matches GIS conventions, reduces cognitive load, enables optimized content layout. Optional collapse toggle deferred. Affects all phases with right sidebar implementations |
| Feb 5, 2026 | Resolved DFT-034: Drag-and-drop reorder feedback — enhanced lifted row visual treatment (60% opacity, 95% scale, 2deg rotation, dashed border), 4px drop line with background highlight, 400ms settle animation with green highlight, toast notification for map z-order updates, keyboard support (arrow keys + Shift+Home/End), ARIA announcements for screen readers. Analyzed through 9 UI/UX frameworks. Keyboard support essential for v2.0 WCAG compliance (not deferred). Aligns with animation timing standards (DFT-025: 250-400ms). See Phase 0 task 0.5 |
| Feb 5, 2026 | Resolved DFT-035: DataOne search behavior — debounced instant search (500ms, 2+ chars) + immediate dropdown filters. Initial state loads all datasets (no pre-search dead state). Pagination: Previous/Next (20/page). AbortController cancels in-flight requests. Continuous feedback (Norman, Nielsen #1), reduced cognitive load (Hick's Law), matches ArcGIS Hub conventions. See Phase 4 task 4.3 |
| Feb 5, 2026 | Resolved DFT-036: Feature highlight on bookmark hover — hover-to-highlight for in-viewport features (no auto-pan). Cyan ring (4px width, 8px offset) with subtle pulse (2 cycles, 800ms). Off-screen features show "📍 Off-screen" text indicator; click [View] to pan. Keyboard support: highlight follows Tab focus, ARIA announcements. Analyzed through 9 UI/UX frameworks with strong cross-framework convergence. Matches GIS conventions (ArcGIS Pro, QGIS). Deferred enhancements to Phase 6: edge indicators (directional arrows), bidirectional highlighting. See Phase 0 task 0.6 |
| Feb 5, 2026 | Resolved DFT-039: Filter apply behavior — auto-apply everywhere, no Apply button in any data source. Universal rules: dropdowns immediate, text search 500ms debounce, date fields on calendar close/blur, toggles immediate. `AbortController` cancels in-flight requests. Loading per DFT-018. Removed `[Apply]` buttons from Phase 3 Dendra (Tasks 3.3, 3.6). Explicitly specified auto-apply in Phase 1 iNaturalist (Task 1.3). Consistent with DFT-035 (DataOne) and DFT-003 (ANiML). Analyzed via 14 design principles. See design-system.md Filter Apply Behavior |
|| Feb 5, 2026 | Resolved DFT-040: Dual-level filter visual distinction — condensed 6-zone layout for Level 3 (feature detail). Dropped Level 2 summary bar (irrelevant at Level 3). Merged feature header + filter controls into `FeatureDetailCard`. Back button is only Level 2 reference. Single-level data sources still use `FilterSection` (DFT-038). Updated Phase 2 Task 2.4, Phase 3 Tasks 3.5/3.6. See design-system.md Dual-Level Filter Pattern |

