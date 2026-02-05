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

**Last Updated:** February 5, 2026 (Resolved DFT-038: filter section anatomy)

**Next Steps:**
- [ ] **BEFORE MOCKUPS (DFT-037):** Resolve all design discussion tasks (DFT-015 through DFT-040)
  - **High priority:** ~~DFT-018 (loading states)~~, ~~DFT-020 (pointer-row bookmark UI)~~, ~~DFT-030 (error states)~~, ~~DFT-038 (filter anatomy)~~, DFT-039 (filter apply behavior)
  - **Medium priority:** ~~DFT-019 (Edit Filters navigation)~~, ~~DFT-024 (Filter indicator)~~, ~~DFT-028~~, ~~DFT-029~~, ~~DFT-031~~, ~~DFT-032~~, ~~DFT-035~~, DFT-040 (dual-level distinction)
  - **Low priority:** DFT-036 (bookmark hover highlight) — can defer to Phase 6 if not blocking mockup generation
- [x] **Archive completed:** Archived DFT-001 through DFT-027 to `PLANNING/archived-planning-tasks-from-tracker.md` (Feb 4, 2026)
- [x] **Archive completed:** Archived DFT-033 through DFT-035 to `PLANNING/resolved-decisions/` (Feb 5, 2026)

---

## Quick Reference

**Note:** Tasks DFT-001 through DFT-032 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. Tasks DFT-033 through DFT-035 have been archived to `PLANNING/resolved-decisions/` with full resolution summaries. The summaries below are kept for quick reference.

| ID | Summary | Category | Status | Priority |
|----|---------|----------|--------|----------|
| DFT-001 | Should clicking the eyeball icon auto-pin a layer, or should pin be a separate explicit action? | UI/UX | 🟢 Resolved | Medium |
| DFT-002 | "Export Bookmarks" button placement made it unclear that pinned layers are also exportable | UI/UX | 🟢 Resolved | Medium |
| DFT-003 | In ANiML browse view, the "Pin with Filter" vs "Bookmark" buttons are confusing—unclear what each does | UI/UX | 🟢 Resolved | High |
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
| DFT-037 | Generate updated mockups reflecting all resolved design decisions (DFT-001 through DFT-040) | Task | 🟡 Open | High |
| DFT-038 | Filter section anatomy — shared structural template for Browse tab filter UI across all data sources | Design System | 🟢 Resolved | High |
| DFT-039 | Filter apply behavior — auto-apply vs explicit Apply button consistency across data sources | UI/UX | 🟡 Open | High |
| DFT-040 | Dual-level filter visual distinction — how Level 2 vs Level 3 filters look different (ANiML, Dendra) | UI/UX | 🟡 Open | Medium |

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
| DFT-033 | Right sidebar width and resizability | Will | ✅ Resolved - Feb 5 |
| DFT-034 | Drag-and-drop reorder feedback | Will | ✅ Resolved - Feb 5 |
| DFT-035 | DataOne search behavior | Will, Dan | ✅ Resolved - Feb 5 |
| DFT-036 | Feature highlight on bookmark hover | Will | ✅ Resolved - Feb 5 |
| DFT-037 | Generate updated mockups after design decisions resolved | Will | 🟡 Pending |
| DFT-038 | Filter section anatomy — shared structural template | Will | ✅ Resolved - Feb 5 |
| DFT-039 | Filter apply behavior consistency | Will | 🟡 Pending |
| DFT-040 | Dual-level filter visual distinction (ANiML, Dendra) | Will | 🟡 Pending |

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

**Archived Tasks:** Tasks DFT-001 through DFT-032 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. Tasks DFT-033 through DFT-035 have been archived to `PLANNING/resolved-decisions/` with full resolution summaries. Summaries remain in the Quick Reference table above.

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

### DFT-037: Generate Updated Mockups After Design Decisions Resolved

**Category:** Task  
**Status:** 🟡 Open  
**Priority:** High  
**Source:** Will, Feb 3, 2026

**Context:**
Mockups should NOT be generated until all design discussion tasks (DFT-015 through DFT-036) are resolved. Once resolved, updated mockups need to be created that reflect all design decisions from DFT-001 through DFT-036 (excluding any decisions that were explicitly omitted or deferred).

**Prerequisites:**
- All high-priority design issues resolved (DFT-015, DFT-018, DFT-020, DFT-030)
- All medium-priority design issues resolved (or explicitly deferred)
- All resolved decisions documented in phase documents and master plan

**Task:**
Generate updated mockups (`mockups/02a-02f` or new versions) that demonstrate:
- All resolved UX decisions from DFT-001 through DFT-036
- Empty states (per DFT-015)
- Loading states (per DFT-018)
- Error states (per DFT-030)
- All widget designs with final specifications
- All sidebar designs with final specifications
- All interaction patterns as resolved

**Exclusions:**
- Any DFT decisions explicitly omitted or deferred to v2.1+
- Decisions marked as "defer to Phase 6" unless they affect mockup generation

**Post-Completion:**
After DFT-037 is complete, **archive resolved design decisions** to `PLANNING/resolved-decisions/` to keep `planning-task-tracker.md` manageable. The tracker should focus on open issues, not serve as a historical archive.

**Discussion:**
*Blocked until DFT-015 through DFT-036 are resolved*

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
**Status:** 🟡 Open  
**Priority:** High  
**Source:** Will + Claude design discussion, Feb 5, 2026

**Context:**
DFT-035 decided DataOne uses auto-apply (debounced instant search, immediate dropdown response). But the phase docs for ANiML (Phase 2, Tasks 2.3-2.4) and Dendra (Phase 3, Task 3.3) show `[Apply]` buttons in their ASCII diagrams. This inconsistency will confuse researchers who switch between data sources (Nielsen #4: Consistency).

**The Inconsistency:**
- **DataOne (DFT-035):** Auto-apply. Dropdowns fire immediately. Text search debounced at 500ms. No Apply button.
- **ANiML (Phase 2 spec):** Shows `[Apply]` button in filter section.
- **Dendra (Phase 3 spec):** Shows `[Apply]` button in filter section.
- **iNaturalist (Phase 1 spec):** Not specified either way.

**Questions to Resolve:**
1. Should all data sources use the same apply behavior, or is per-source variation acceptable?
2. If consistent, should it be auto-apply (DFT-035 pattern) or explicit Apply?
3. Are there data sources where auto-apply is problematic (e.g., expensive queries)?

**Options:**

**Option A: Auto-apply everywhere (recommended)**
- Dropdowns, date pickers, toggles: fire immediately on change
- Text inputs: debounced (500ms per DFT-035)
- No Apply button anywhere
- Result count updates continuously
- Rationale: consistent with DFT-035 reasoning (Norman Feedback, Hick's Law), every action reversible via "Clear" (DFT-031 undo pattern)

**Option B: Explicit Apply everywhere**
- All filter changes staged until user clicks Apply
- More "control" feeling
- Risk: silent state changes, broken feedback loop for dropdowns

**Option C: Hybrid (per data source)**
- Auto-apply for cheap queries (DataOne, iNaturalist)
- Explicit Apply for expensive queries (ANiML image search, Dendra datapoints)
- Risk: inconsistency across tabs

**Considerations:**
- ANiML queries can take 8-12s (Phase 2 notes). Auto-apply during typing could hammer the API.
- `AbortController` pattern (from DFT-035) mitigates stale request issues.
- Loading states (DFT-018) handle slow queries gracefully.
- Target audience (DFT-011): researchers iterate quickly on filters.

**Design Principles:**

| Principle | Option A | Option B | Option C |
|---|---|---|---|
| Nielsen #4: Consistency | Yes | Yes | No |
| Norman: Feedback | Yes (continuous) | Delayed | Mixed |
| Hick's Law | Fewer decisions | Extra decision per iteration | Variable |
| Shneiderman #7: User Control | Slightly less | More | Mixed |
| Nielsen #1: System Status | Continuous updates | Updates on demand | Mixed |

**Discussion:**
*Pending resolution*

**Resolution:** *Pending*

---

### DFT-040: Dual-Level Filter Visual Distinction

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** Will + Claude design discussion, Feb 5, 2026

**Context:**
ANiML and Dendra have two levels of filters that appear in the same right sidebar Browse tab:
- **ANiML:** Level 2 = "Filter Cameras" (region, status) → Level 3 = "Filter Images" (species, date)
- **Dendra:** Level 2 = "Filter Sensors" (region, status, time range) → Level 3 = "Filter Datapoints" (date range, aggregation)

DFT-004 established that the sidebar is the canonical filter editor and that level transitions use progressive disclosure. But it didn't specify the *visual treatment* that distinguishes one filter level from the other when both might be visible (e.g., Dendra shows a collapsed layer-filter summary + expanded feature-filter section).

iNaturalist and DataOne are single-level (no distinction needed), so this only applies to ANiML and Dendra.

**Questions to Resolve:**
1. How does the user visually distinguish "I'm editing camera-level filters" from "I'm editing image-level filters"?
2. When the user drills into a feature (Level 3), how does the Level 2 filter section change?
3. Should the two levels use different background colors, different section header styles, or something else?

**Options:**

**Option A: Section headers + subtle background shift (recommended)**
- Level 2 filter section: white background, standard section header ("Filter Cameras")
- Level 3 filter section: `slate-50` background, slightly inset, different section header ("Filter Images at CAM-042")
- Level 2 collapses to a read-only summary line with "[Edit]" link when Level 3 is active
- Rationale: double-encoding (Gestalt: Common Region + typography) without heavy-handed color coding

**Option B: Accordion panels with distinct borders**
- Each level in its own collapsible accordion with a colored left border
- Level 2: blue left border, Level 3: amber left border
- More visual separation but heavier UI weight

**Option C: Tab-like sub-navigation within the Browse tab**
- Sub-tabs: "Cameras" | "Images" within the Browse tab
- Most explicit separation but adds navigation complexity (a tab within a tab)

**Considerations:**
- Dendra's Phase 3 spec already has ASCII diagrams showing a "collapsed summary + [Edit]" pattern for Level 2 when Level 3 is active. Option A aligns with this existing spec.
- ANiML's Phase 2 spec says "clear visual distinction" but doesn't specify how.
- At 400px width (DFT-033), horizontal space is limited — Option C wastes some on sub-tabs.
- Progressive disclosure (DFT-004) means both levels are rarely fully expanded simultaneously — one is typically collapsed.

**Design Principles:**

| Principle | How It Applies |
|---|---|
| Gestalt: Common Region | Background color shift groups Level 3 controls as a distinct region |
| Gestalt: Proximity | Level 2 summary stays near top (spatial reference); Level 3 controls grouped below |
| Norman: Conceptual Model | "I'm inside a camera" = Level 3 context. Background shift signals scope change |
| Nielsen #6: Recognition | Section headers ("Filter Images at CAM-042") eliminate guessing |
| IA: Progressive Disclosure | Level 2 collapses when Level 3 is active; expandable to edit |
| IA: Wayfinding | "← Back to Cameras" breadcrumb + collapsed summary = "I came from here" |

**Discussion:**
*Pending resolution*

**Resolution:** *Pending*

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

