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

**Last Updated:** February 4, 2026 (Archived DFT-001 through DFT-027 to reduce tracker size)

**Next Steps:**
- [ ] **BEFORE MOCKUPS (DFT-037):** Resolve all design discussion tasks (DFT-015 through DFT-036)
  - **High priority:** ~~DFT-018 (loading states)~~, ~~DFT-020 (pointer-row bookmark UI)~~, DFT-030 (error states)
  - **Medium priority:** ~~DFT-019 (Edit Filters navigation)~~, ~~DFT-024 (Filter indicator)~~, DFT-028, DFT-029, DFT-031, DFT-032, DFT-035
  - **Low priority:** Can defer to Phase 6 if not blocking mockup generation
- [x] **Archive completed:** Archived DFT-001 through DFT-027 to `PLANNING/archived-planning-tasks-from-tracker.md` (Feb 4, 2026)

---

## Quick Reference

**Note:** Tasks DFT-001 through DFT-027 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. The summaries below are kept for quick reference.

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
| DFT-031 | Confirmation dialogs — when to require explicit confirmation (delete, clear filters) | UI/UX | 🟡 Open | Medium |
| DFT-032 | Map tooltip design — what info shows on hover before clicking feature? | UI/UX | 🟡 Open | Medium |
| DFT-033 | Right sidebar width and resizability — fixed or user-adjustable? | Layout | 🟡 Open | Low |
| DFT-034 | Drag-and-drop reorder feedback — what visual cues during layer reorder? | Microinteraction | 🟡 Open | Low |
| DFT-035 | DataOne search behavior — instant search or explicit submit? | UI/UX | 🟡 Open | Medium |
| DFT-036 | Feature highlight on map when hovering bookmark row | UI/UX | 🟡 Open | Low |
| DFT-037 | Generate updated mockups reflecting all resolved design decisions (DFT-001 through DFT-036) | Task | 🟡 Open | High |

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
| DFT-031 | Confirmation dialogs pattern | Will | 🟡 Pending |
| DFT-032 | Map tooltip design | Will | 🟡 Pending |
| DFT-033 | Right sidebar width and resizability | Will | 🟡 Pending |
| DFT-034 | Drag-and-drop reorder feedback | Will | 🟡 Pending |
| DFT-035 | DataOne search behavior | Will, Dan | 🟡 Pending |
| DFT-036 | Feature highlight on bookmark hover | Will | 🟡 Pending |
| DFT-037 | Generate updated mockups after design decisions resolved | Will | 🟡 Pending |

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

**Archived Tasks:** Tasks DFT-001 through DFT-027 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. Summaries remain in the Quick Reference table above.

---

### DFT-028: Zero-Result Camera Behavior

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026 (extracted from DFT-012 edge cases)

**Context:**
Per DFT-012, when a species filter is applied (e.g., "mountain lion"), cameras show badges with counts. 

**Edge case:** What happens to cameras with 0 matching images?

**Options:**
1. **Hide cameras with 0 matches** — cleaner map, shows only relevant locations
2. **Show grayed out** — maintains spatial context, shows where species is NOT present
3. **Show with "0" badge** — explicit count, but clutters map
4. **User preference** — toggle to "show all cameras" or "show matching only"

**Considerations:**
- Hiding may cause confusion ("where did CAM-042 go?")
- Graying out maintains mental map of all camera locations
- Showing "0" badges adds noise but is explicit

**Resolution:** Feb 4, 2026 — **Gray out cameras with 0 matching images**

**Design Specification:**

1. **Visual Treatment:**
   - Reduce opacity to 40-50% (test for contrast with map background)
   - Desaturate color (grayscale or muted version of active color)
   - Remove badge entirely (don't show "0")
   - Consider subtle pattern overlay (diagonal lines) for colorblind accessibility

2. **Interaction:**
   - Camera remains **clickable** and **keyboard-focusable**
   - Click behavior: Sidebar shows camera metadata + message: "No [species name] images at this location" with "Adjust Filters" button
   - Hover tooltip: "CAM-042: No matching images"
   - ARIA label: "CAM-042: Camera location with no [species name] images"

3. **Animation:**
   - When filter applied: 300ms ease-out transition from active → grayed
   - Stagger by 30ms per camera (subtle wave effect)
   - When filter removed: 300ms ease-out transition back to active state

4. **Edge Cases:**
   - If ALL cameras are zero-results → show empty state in sidebar: "No cameras match your filter" with "Adjust Filters" and "Clear Filters" buttons
   - Map still shows all grayed cameras (preserves spatial context)

**Rationale:**
- **Preservation over Removal:** Maintains spatial structure and mental map of camera network (Gestalt Continuity, Norman Conceptual Models)
- **Negative Evidence:** Researchers need to see where species is NOT present for ecological analysis (scientific workflow requirement)
- **Contrast Creates Clarity:** Grayed cameras make active results stand out MORE effectively than hiding (Von Restorff Effect)
- **Accessibility:** Hidden cameras can't be clicked or keyboard-navigated; grayed cameras remain operable (WCAG Operable principle)
- **Cognitive Load:** Graying reduces "Where did it go?" confusion; preserves Recognition over Recall (Nielsen's Heuristic #6)

**Documented in:**
- Phase 2 (ANiML): Task 2.5 acceptance criteria updated
- Master Plan: Added to UX Decisions

**✅ Verification Checklist:**
- [x] Resolution documented in planning-task-tracker.md
- [x] Specification added with visual treatment, interaction, animation details
- [x] Phase 2 document updated with decision
- [x] Master plan updated with UX decision entry
- [x] Related to DFT-012 (camera badges) and DFT-029 (unfiltered badge behavior)

---

### DFT-029: Unfiltered Layer Badge Behavior

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026 (extracted from DFT-012 edge cases)  
**Resolved:** February 4, 2026

**Context:**
Per DFT-012, badges appear on camera icons showing filtered image counts. Badges only appear when a layer-level filter is applied.

**Question:** What happens when NO filter is applied? Should cameras show total image counts, or no badges at all?

**Options:**
1. **No badges until filter applied** — cleaner default, badges indicate active query
2. **Always show total counts** — useful overview, but may clutter map
3. **Show totals on hover only** — clean map, details on demand
4. **User preference** — toggle for "show image counts"

**Considerations:**
- Showing totals may overwhelm with numbers if 50+ cameras
- No badges until filter is cleaner but loses "overview" capability
- Hover-only is a middle ground but requires interaction

**Discussion:**
- **Option 1 (No badges until filter)** aligns with DFT-012's semantic of "badges = filtered results here"
- Badges become meaningful signals when they only appear during filtering (figure/ground separation)
- Research audience understands query-driven workflows ("filter first, then see results")
- Camera icons themselves show location; hover tooltips can show total counts on demand
- Avoids cognitive overload from 50+ simultaneous numbers on map

**Resolution:** **Option 1 adopted** — No badges when layer has no filter. Badges only appear when layer-level filter is applied, making them semantic indicators of filtered query results. Optional fallback: hover tooltip shows total count ("CAM-042: 1,247 images").

**Design Specification:**
- **Default state (no filter):** Camera icons show no badges
- **With layer-level filter:** Badges appear showing filtered counts (per DFT-012)
- **Optional enhancement:** Hover tooltip shows total count even when no filter applied
- **Rationale:**
  - Badges carry information: "filtered results exist here"
  - Clean default for first-time users
  - Consistent with DFT-012 resolution
  - Follows Gestalt figure/ground principles (badges stand out when they mean something)
  - Shneiderman's mantra: overview (camera locations) first, details (counts) on demand (hover or filter)

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file) — resolution added
- ✅ `docs/master-plan.md` — added to Cross-Phase Decisions → UX Decisions
- ✅ `docs/IMPLEMENTATION/phases/phase-2-animl.md` — decision note added to Task 2.5

**✅ Verification Checklist:**
- [x] Phase document updated (phase-2-animl.md task 2.5)
- [x] Master plan updated (UX Decisions table)
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with rationale
- [x] Cross-references added ("Documented in:")
- [x] Design specification included
- [ ] Mockups noted (not applicable — badges already specified in DFT-012)

---

### DFT-030: Error State Design

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 4, 2026

**Context:**
No design specification for error handling:
- API request fails (network error, timeout, 500 error)
- Partial data load failure (some cameras load, others fail)
- Rate limiting errors

**Why this matters (Nielsen: Help users recognize, diagnose, recover from errors):**
Errors are inevitable. Users need clear feedback about what went wrong and how to recover.

**Resolution:** **Combination approach with severity-based hierarchy**

**Design Decisions:**

### 1. Error Severity Hierarchy

| Severity | Example | Pattern | Lifespan |
|----------|---------|---------|----------|
| **Critical** | Total API outage | Modal | Persistent (blocks app) |
| **Regional** | Right sidebar content failed | Inline in region | Persistent until resolved |
| **Partial** | 3 of 47 cameras failed | Banner + loaded content | Persistent until resolved |
| **Action** | Bookmark save failed | Toast | 8s auto-dismiss |

### 2. Toast Notifications (Action Failures)

**Placement:** Top of right sidebar (above header)
- Position: `position: absolute; top: 0; right: 0; left: 0;` (full width of sidebar)
- Z-index above sidebar content but below modals
- Stacked if multiple (newest on top, max 3 visible)

**Visual Design:**
```
┌────────────────────────────────────────────────────┐
│  [✕ Icon]  Bookmark failed to save. [Try Again]  ✕│
└────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Container: `bg-red-50 border-b border-red-200`
- Icon: `w-5 h-5 text-red-500` (Lucide `XCircle`)
- Text: `text-sm text-gray-800`
- Button: `text-sm text-red-600 hover:underline`
- Dismiss: `text-gray-400 hover:text-gray-600`

**Behavior:**
- Auto-dismiss after 8 seconds
- User can dismiss manually via ✕
- "Try Again" inline button retries action and dismisses toast
- Multiple toasts stack (newest on top, max 3)

**Use for:**
- Bookmark save failed
- Pin action failed
- Export failed
- Filter apply failed

**Rationale:** Top of right sidebar avoids map legend conflict, maintains proximity to action context (most errors originate from sidebar interactions), consistent location for users to learn.

### 3. Inline Errors (Content Failures)

**Placement:** In the region where content should have loaded
- Right sidebar for layer/feature load failures
- Widget for widget-specific failures
- Map overlay for map layer failures

**Visual Design:**
```
┌─────────────────────────────────────────────────────┐
│  [⚠ Icon]                                           │
│  Unable to load camera data                         │
│  The server didn't respond in time.                 │
│                                                     │
│  [Retry]  [← Back to Layer List]  [Show Details ▼] │
└─────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Container: `bg-amber-50 border border-amber-200 rounded-lg p-4`
- Icon: `w-8 h-8 text-amber-500` (Lucide `AlertTriangle`)
- Title: `text-sm font-medium text-gray-800`
- Body: `text-sm text-gray-600`
- Primary button: `bg-emerald-600 text-white`
- Secondary button: `text-gray-600 hover:underline`

**Behavior:**
- Persistent until user takes action (Retry, Go Back, or navigates away)
- "Retry" triggers re-fetch with loading indicator
- "Go Back" returns to previous view (contextual navigation)
- "Show Details" expands technical info (optional, collapsed by default)
- Dismissible via ✕ in cases where it's optional to retry

**Use for:**
- Right sidebar content failed to load
- Camera/sensor list failed to load
- Search results failed

### 4. Partial Failure Banner

**Pattern:** Show what loaded successfully, banner for failures

```
┌─────────────────────────────────────────────────────┐
│ [⚠] 3 cameras failed to load. [Retry Failed] [✕]   │
└─────────────────────────────────────────────────────┘
│  Camera A1        🦁 23 images                      │
│  Camera A2        🦁 15 images                      │
│  ...successfully loaded content continues...        │
```

**Design Tokens:**
- Banner: `bg-amber-50 border-b border-amber-200 px-4 py-2`
- Text: `text-sm text-gray-700`
- Button: `text-sm text-amber-700 hover:underline`

**Behavior:**
- Banner persists until dismissed or failures resolved
- "Retry Failed" only retries the failed items (not successful ones)
- Show loaded content below banner (don't throw away good data)

**Use for:**
- ANiML multi-camera queries where some succeed and some fail
- Batch operations with partial success

### 5. Critical Error Modal

**Pattern:** Full-screen overlay for app-breaking errors

```
┌─────────────────────────────────────────────────────┐
│                   [⚠ Icon]                          │
│                                                     │
│     Unable to connect to data services              │
│                                                     │
│  The application couldn't reach the data servers.   │
│  This may be a temporary issue.                     │
│                                                     │
│         ┌───────────────────────────┐               │
│         │       Try Again           │               │
│         └───────────────────────────┘               │
│                                                     │
│             [Show Technical Details]                │
└─────────────────────────────────────────────────────┘
```

**Use for:**
- Total API outage (all services unreachable)
- Critical browser incompatibility
- App initialization failure

**Note:** No authentication errors (public-facing dashboard).

### 6. Error Message Tone

**Utilitarian** (consistent with DFT-015 empty states, DFT-011 researcher audience):
- Direct, professional, no warmth
- No apologetic language ("Oops!", "Sorry!")
- Factual causality ("The server didn't respond" not "Something went wrong")

**Examples:**
- Good: "Unable to load camera data"
- Good: "Request timed out after 30 seconds"
- Good: "Bookmark failed to save"
- Bad: "Oops! Something went wrong"
- Bad: "Sorry, we couldn't save that"

### 7. Color Tokens

| Severity | Background | Border | Icon/Text |
|----------|------------|--------|-----------|
| Warning/Recoverable | `amber-50` | `amber-200` | `amber-500` |
| Error/Failed | `red-50` | `red-200` | `red-500` |

### 8. Timeout Behavior (Aligned with DFT-018)

- 0-30s: Show loading state (per DFT-018)
- 30s: Auto-timeout → inline error: "Request timed out. [Retry]"
- Instant failure (4xx/5xx): Immediate error display

### 9. "Show Details" Expansion

Standardized pattern for technical debugging:
- Collapsed by default
- Toggle reveals: Request endpoint, HTTP status, timestamp, duration, request ID (if available)
- Target audience (researchers) may need this for debugging queries

### 10. Accessibility

- **Focus management:** Move focus to error container when it appears
- **ARIA:** `role="alert"` for toasts, `aria-live="polite"` for inline errors
- **Color independence:** Icons + text + color (not color alone)
- **Keyboard:** All buttons focusable and actionable via Enter/Space

### 11. Animation

- Error appears: Fade in 200ms + subtle shake (2px, 2 cycles)
- Toast auto-dismiss: Fade out 300ms after 8s
- Retry clicked: Error fades, loading spinner appears
- **Reduced motion:** Use `prefers-reduced-motion` — replace shake with border pulse

**Rationale:**
- **Regional containment:** Errors appear where they happened (Gestalt Proximity, Norman Feedback)
- **Always actionable:** Retry, Go Back, or Dismiss options (Nielsen #3: User control)
- **Ephemeral vs. Persistent:** Toasts for actions (brief), inline for content (persistent until resolved)
- **Utilitarian tone:** Matches researcher audience (DFT-011) and design system consistency
- **Toast placement:** Top of right sidebar avoids map legend conflict, maintains contextual proximity

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file) — resolution added
- ✅ `docs/DESIGN-SYSTEM/design-system.md` — error state patterns added
- ✅ `docs/master-plan.md` — added to Cross-Phase Decisions

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design system updated with error patterns
- [x] Master plan updated (cross-phase UX decision)
- [x] Cross-references added ("Documented in:")
- [x] Rationale provided using UI/UX principles
- [ ] Mockups noted (defer to DFT-037 — mockup generation task)

---

### DFT-031: Confirmation Dialogs Pattern

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Some actions may warrant confirmation dialogs to prevent accidental data loss:
- Unpinning a layer with filters (loses filter state)
- Clearing all filters on a pinned layer
- Removing a bookmark
- Deleting a filtered view

**Question:** Which actions require explicit confirmation, and which can be undone via undo/redo?

**Options:**
1. **No confirmations, rely on undo** — faster workflow, less friction
2. **Confirm destructive actions** — unpin with filters, delete view
3. **Confirm all removes** — any ✕ button shows "Are you sure?"
4. **Soft delete + toast with undo** — action happens immediately, toast shows "Undo" for 5 seconds

**Considerations:**
- Too many confirmations = friction and "confirmation fatigue"
- Too few = anxiety about accidental clicks
- Undo is generally preferred over confirmation (less disruptive)

**Discussion:**
*Needs decision — affects interaction patterns*

**Resolution:** *Pending*

---

### DFT-032: Map Tooltip Design

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
When users hover over features on the map (cameras, sensors, observations), what information appears in the tooltip before they click?

**Why this matters (Nielsen: Visibility of system status / Shneiderman: Overview first, details on demand):**
Tooltips provide "information scent" — users can preview what they'll get by clicking, reducing uncertainty and wasted clicks.

**Questions to Resolve:**
1. What fields appear in each data source's tooltip?
2. Should tooltips show filter-relevant info (e.g., "23 mountain lion images" on camera)?
3. How long before tooltip appears? (instant? 200ms delay?)
4. Does tooltip persist on hover, or dismiss after a timeout?
5. Are tooltips accessible via keyboard (focus state)?

**Options by Data Source:**
- **ANiML Camera:** Camera ID, location, image count (filtered if filter active)
- **Dendra Sensor:** Sensor ID, type, date range, latest reading
- **iNaturalist:** Species, date, observer
- **DataOne Dataset:** Title, date, source

**Discussion:**
*Needs specification for each data source*

**Resolution:** *Pending*

---

### DFT-033: Right Sidebar Width and Resizability

**Category:** Layout  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
What is the right sidebar's width, and can users resize it?

**Questions to Resolve:**
1. Fixed width or resizable?
2. If fixed, what width? (320px? 400px? 480px?)
3. If resizable, what are min/max widths?
4. Should width persist across sessions?
5. Does the sidebar have a collapse/expand toggle?

**Options:**
1. **Fixed width (400px)** — consistent, simpler implementation
2. **Resizable with drag handle** — flexible, accommodates different content needs
3. **Breakpoint-based** — wider on larger screens, narrower on smaller
4. **Collapsible** — full collapse to maximize map, expand when needed

**Considerations:**
- Image grids (ANiML) benefit from wider sidebar
- Time-series charts (Dendra) benefit from wider sidebar
- Text metadata (iNaturalist) works fine with narrower sidebar
- Map needs to remain usable with sidebar open

**Discussion:**
*Low priority but affects layout*

**Resolution:** *Pending*

---

### DFT-034: Drag-and-Drop Reorder Feedback

**Category:** Microinteraction  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Per Phase 0, pinned layers have drag handles for reordering. What visual feedback appears during drag?

**Questions to Resolve:**
1. What cursor appears when hovering drag handle? (grab cursor)
2. What happens to the row being dragged? (lifted, semi-transparent, ghost)
3. How is the drop target indicated? (line, highlighted gap, placeholder)
4. What animation plays when dropped?
5. Does drag reorder affect map layer z-order?

**Options:**
1. **Lifted row + drop line** — row lifts visually, line shows where it will land
2. **Ghost placeholder** — ghost of row follows cursor, placeholder in list
3. **Swap animation** — adjacent rows move aside as you drag past them
4. **Minimal** — just cursor change, row moves on drop (no animation)

**Considerations:**
- This is a polish item, not critical for MVP
- ArcGIS/Esri patterns may provide precedent

**Discussion:**
*Low priority — can defer to Phase 6*

**Resolution:** *Pending*

---

### DFT-035: DataOne Search Behavior

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
DataOne has a search interface. How should search behave?

**Questions to Resolve:**
1. Instant search (as you type) or explicit submit (press Enter/button)?
2. If instant, what debounce delay? (300ms? 500ms?)
3. Should search include all fields or specific fields (title, author, keywords)?
4. How are search results paginated?
5. What happens on empty search (show all? show recent? show placeholder)?

**Options:**
1. **Instant search with debounce** — responsive, modern feel
2. **Explicit submit** — more control, less API load
3. **Hybrid** — instant for 3+ characters, explicit for fewer

**Considerations:**
- DataOne API may have rate limits
- Large result sets need pagination or virtualization
- Empty search could be overwhelming (many datasets)

**Discussion:**
*Needs input from Dan on API constraints*

**Resolution:** *Pending*

---

### DFT-036: Feature Highlight on Bookmark Hover

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
When user hovers over a bookmarked feature in the Bookmarked Features widget, should the corresponding feature highlight on the map?

**Why this matters (Gestalt: Common fate / Nielsen: Recognition over recall):**
Highlighting creates a visual link between widget row and map feature, helping users understand the relationship without clicking.

**Questions to Resolve:**
1. Does hovering a bookmark row highlight the feature on the map?
2. What does "highlight" look like? (pulse, ring, color change, zoom to?)
3. Does this work for features not currently visible on the map?
4. Should it scroll the map to show the feature?
5. Does hovering a pinned layer row highlight all its features?

**Options:**
1. **Highlight only** — feature pulses/rings but map doesn't move
2. **Highlight + pan** — map pans to show feature if off-screen
3. **No hover interaction** — click required to see feature
4. **Bidirectional** — hovering map feature highlights widget row too

**Considerations:**
- Could be distracting if many bookmarks
- Pan-on-hover may feel disorienting
- May conflict with map's own hover behavior

**Discussion:**
*Low priority polish item*

**Resolution:** *Pending*

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

## Resolved Issues

### DFT-001: Pin vs. Toggle Visibility Behavior ✅

**Resolved:** Jan 27, 2026  
**Source:** Sophia Leiker, Jan 23, 2026

**Decision:** **Model C adopted** — Selection-based active layer, separate pin action.

**Key Design Elements:**
- **Left sidebar:** Only shows selection indicator (●), no eyeball/pin icons
- **Widget sections:** "Active Layer" (single-select) + "Pinned Layers" (multi-select)
- **Behavior:** Click layer → active/visible. Click [📌] → pins it. Toggle 👁 → hide/show without unpinning.
- **Filter indicators:** Funnel emoji (🌪️) + count inline (e.g., `🌪️5`)
- **Distinguishers:** Parenthetical auto-generated from primary filter (e.g., `Camera Traps (mt. lion)`)
- **A/B testing:** Debug toggle to compare text vs icon filter representations

**Impact:** 
- Phase 0 tasks 0.2 and 0.5 updated with refined designs
- Supports DFT-013 (multiple filtered views) via unique distinguishers
- Clean UI with reduced cognitive load

---

### DFT-010: Terminology — "Items" → "Features" ✅

**Resolved:** Jan 26, 2026  
**Source:** Trisalyn Nelson

**Decision:** "Features is a word that is more familiar to the GIS user." Applied "items → features" terminology throughout.

**Impact:** Updated all development plan documents with new terminology.

---

### DFT-011: Target Audience Clarification ✅

**Resolved:** Jan 26, 2026  
**Source:** Trisalyn Nelson

**Decision:** Primary audience is **researchers** (academic, TNC staff), with particular attention to GIS-minded users. NOT targeting broad public.

**Impact:** Can use GIS terminology (features, layers, queries) without over-simplification.

---

## Changelog

| Date | Change |
|------|--------|
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

