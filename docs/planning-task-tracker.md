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

**Last Updated:** February 4, 2026 (Resolved DFT-020: Pointer-row bookmark UI — single button pattern)

**Next Steps:**
- [ ] **BEFORE MOCKUPS (DFT-037):** Resolve all design discussion tasks (DFT-015 through DFT-036)
  - **High priority:** ~~DFT-018 (loading states)~~, ~~DFT-020 (pointer-row bookmark UI)~~, DFT-030 (error states)
  - **Medium priority:** ~~DFT-019 (Edit Filters navigation)~~, ~~DFT-024 (Filter indicator)~~, DFT-028, DFT-029, DFT-031, DFT-032, DFT-035
  - **Low priority:** Can defer to Phase 6 if not blocking mockup generation
- [ ] **After DFT-037:** Archive resolved design decisions to `PLANNING/resolved-decisions/` to keep tracker manageable

---

## Quick Reference

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
| DFT-025 | Create New View transition animation — visual feedback for state change | Microinteraction | 🟡 Open | Low |
| DFT-026 | Emoji/icon vocabulary consistency — shopping cart vs export icon | Design System | 🟢 Resolved | Low |
| DFT-027 | "Browse Features →" button destination confirmation | Terminology | 🟡 Open | Low |
| DFT-028 | Zero-result camera behavior — hidden vs grayed out when filter matches 0 images | UI/UX | 🟡 Open | Medium |
| DFT-029 | Unfiltered layer badge behavior — show total counts or no badges? | UI/UX | 🟡 Open | Medium |
| DFT-030 | Error state design — API failures, network errors, timeout handling | UI/UX | 🟡 Open | High |
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
| DFT-025 | Create New View transition animation | Will | 🟡 Pending |
| DFT-026 | Emoji/icon vocabulary consistency | Will | ✅ Resolved - Feb 3 |
| DFT-027 | "Browse Features →" button destination | Will | 🟡 Pending |
| DFT-028 | Zero-result camera behavior | Amy, Trisalyn, Dan | 🟡 Pending |
| DFT-029 | Unfiltered layer badge behavior | Amy, Trisalyn | 🟡 Pending |
| DFT-030 | Error state design | Will, Dan | 🟡 Pending |
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

### DFT-001: Pin vs. Toggle Visibility Behavior

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> When you click the eyeball icon, it automatically pins the layer. Users might toggle many layers on/off while exploring, then have to manually remove each from the pinned widget. Alternative: eyeball adds to workspace temporarily, explicit pin action saves it.

**Options:**
1. **Current behavior:** Eyeball auto-pins. User must manually unpin.
2. **Explicit pin:** Eyeball shows/hides but doesn't pin. Separate pin action required to save.
3. **Hybrid:** Eyeball adds to "recent" section, pin moves to "saved" section.

**Discussion:**
- Will (Jan 26): The pinned widget serves three purposes: i) saving a layer for later, ii) saving a query, iii) quick visibility toggle. If eyeball doesn't auto-pin, how does a layer get into the widget?
- Will (Jan 27): After exploring multiple models, **Model C** (selection-based) is the best fit:
  - **Left sidebar:** Shows only selection state (●), no eyeball/pin clutter
  - **Widget:** Has two sections — "Active Layer" (single-select) and "Pinned Layers" (multi-select)
  - **Behavior:** Clicking layer name → makes it active/visible. Click [📌] in widget → pins it.

**Resolution:** Jan 27, 2026 — **Adopted Model C (selection = active, pin separate)**

**Design Decisions:**
1. **Left sidebar:** Only selection indicator (●), no eyeball or pin icons
2. **Widget sections:**
   - "👁 ACTIVE LAYER" (singular) — One non-pinned layer visible, replaced when selecting another
   - "📌 PINNED LAYERS" (no count) — Multiple saved layers with independent visibility toggles
3. **Pin action:** [📌] button in Active Layer section moves layer to Pinned
4. **Visibility control:** Eye icon (👁) in widget rows toggles visibility without unpinning
5. **Selecting hidden pinned layer:** Auto-restores visibility when made active
6. **No helper text:** Removed "selecting another layer will replace this" text — behavior is learnable, non-destructive
7. **Query indicators:**
   - **Funnel emoji (🌪️):** Shows filter count next to layer name (e.g., `🌪️5`)
   - **Primary distinguisher:** Auto-generated label in parentheses (e.g., `Camera Traps (mt. lion)`)
   - **Multiple views of same layer:** Each gets unique distinguisher (supports DFT-013)
   - **No filters:** Gray/desaturated funnel, still clickable to add filters
   - **A/B testing:** Will include debug toggle to test text ("5 filters") vs icon (🌪️5) representations

**Documented in:**
- Phase 0 task 0.2 updated with left sidebar design (no eyeball/pin icons)
- Phase 0 task 0.5 updated with refined widget design
- Note added to Phase 0 for A/B testing filter representation

**✅ Verification Checklist (for future reference):**
- [x] ASCII diagrams in `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.2 match decision (left sidebar)
- [x] ASCII diagrams in `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.5 match decision (widget)
- [x] Acceptance criteria in phase document updated
- [x] Decision notes added at top of relevant task sections
- [x] Cross-phase decision added to `master-plan.md` UX Decisions table
- [x] Resolved decision summary created in `PLANNING/resolved-decisions/dft-001-resolution-summary.md`

---

### DFT-002: Export Button Placement/Visibility

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "Export Bookmarks" button at bottom of bookmark widget implied only bookmarks are exportable. Didn't realize pinned layers (with queries) are also exportable until reading the 02f mockup.

**Options:**
1. Add matching "Export" button to pinned layers widget
2. Single "Export All" button in header or right sidebar
3. Rename to "Export Builder" button that opens unified export modal

**Discussion:**
- Will (Jan 26): Maybe a single "Export All" button in a prominent location (header or right sidebar) that opens the Export Builder, which then shows both pinned layers and bookmarks.
- Will (Jan 29): Analyzed placement options using UI/UX principles (Law of Proximity, Fitts's Law, visual hierarchy):
  - **Option A1 (Global Header):** Equidistant from both widgets, follows shopping cart convention
  - **Option A3 (Floating on Map):** Spatially centered but risks cluttering map
  - **Right Sidebar:** Violates proximity principle (implies single-layer scope)
- Will (Jan 29): Shopping cart metaphor aligns with user expectation — top-right corner is universal "saved items" location

**Resolution:** Jan 29, 2026 — **Option A1: Global Header (Top-Right)**

**Design Decisions:**
1. **Placement:** Top-right corner of global header (same level as logo, not in right sidebar)
2. **Visual design:** Shopping cart icon (🛒) with badge indicator showing total count of pinned layers + bookmarked features
3. **Button style:** Yellow/orange accent with "Export All" label + cart icon
4. **Badge behavior:** Red circle indicator displays sum of pinned layers count + bookmarked features count
5. **Action:** Opens unified Export Builder modal showing both pinned layers and bookmarked features
6. **Rationale:**
   - Shopping cart convention → top-right = "saved items basket"
   - Equidistant from both floating widgets → doesn't favor one over the other
   - Global header = global action (not tied to active layer)
   - Avoids Law of Proximity violation (not in right sidebar's single-layer scope)

**Documented in:**
- Phase 0 task 0.1 updated with header button requirement
- Phase 5 task 5.1 updated: modal opens from global header button (not bookmark widget)
- Master plan updated with cross-phase UX decision

---

### DFT-003: "Pin with Filter" vs "Bookmark" Labeling (ANiML)

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> Confused by the difference between "Pin with Filter" and "Bookmark" buttons in the ANiML browse view. If I filter for mountain lion images from Camera A, what's the difference between the two actions?

**Context:**
In ANiML mockup (02c), when viewing a filtered set of images for a camera, there are two buttons:
- "Pin with Filter" — saves the layer-level query (all cameras matching criteria)
- "Bookmark" — saves this specific camera (feature) with optional image filter

**Options:**
1. Clearer button labels: "Save Layer Query" vs "Bookmark This Camera"
2. Contextual help text explaining each action
3. Rethink button placement to avoid side-by-side confusion

**Discussion:**
- Will (Jan 26): This ties into DFT-004. The confusion stems from two query levels being visible simultaneously. If we solve the contextual clarity problem, this might resolve itself.
- Will (Jan 29): After extended discussion, realized the core issue: "Pin with Filter" is redundant once a layer is already pinned. Filter changes should auto-apply to pinned layers. The only explicit action needed is "Bookmark" for saving specific features.

**Resolution:** Jan 29, 2026 — **Remove side-by-side buttons; let context determine available actions**

**Design Decisions:**

1. **"Pin with Filter" only appears when layer is NOT pinned:**
   - If layer is not pinned, show "📌 Pin with [current filter]" button
   - Once layer is pinned, this button disappears — filter changes auto-apply

2. **Filter changes auto-apply to pinned layers:**
   - When user changes filters in right sidebar, the pinned layer's query updates automatically
   - Pinned Layers widget shows animation/highlight to confirm the change (visual feedback)
   - Optional: brief toast saying "Filter applied" (to be tested)

3. **"Bookmark" button appears only when a feature is selected:**
   - In Animal-First flow: only after user selects a specific camera
   - In Camera-First flow: available as soon as camera is selected
   - Button label: "🔖 Bookmark This Camera" (with current filter if any)

4. **ANiML Browse supports two mental models:**
   - **Animal-First:** Select animal(s) → optionally select camera → bookmark camera
   - **Camera-First:** Select camera → optionally filter by animal → bookmark camera

5. **Button visibility by state:**

   | State | Available Actions |
   |-------|-------------------|
   | Layer not pinned, no feature selected | "📌 Pin Layer" or "📌 Pin with [filter]" |
   | Layer pinned, no feature selected | (none — filters auto-apply) |
   | Layer pinned, feature selected | "🔖 Bookmark This Camera" |
   | Layer not pinned, feature selected | "📌 Pin Layer" + "🔖 Bookmark This Camera" |

6. **Widget animation requirement:**
   - When filter changes on a pinned layer, the Pinned Layers widget animates/highlights
   - This addresses eye-tracking concern (editing in right sidebar, watching left widget)

**Related Issues:**
- DFT-003b: Where to place "Create New View" action
- DFT-003c: Tabs vs landing cards for Animal-First/Camera-First choice
- DFT-013: Multiple filtered views on same layer

**Documented in:**
- Phase 0 updated with widget animation requirement
- Mockup 02c needs update to reflect new button logic

---

### DFT-003b: "Create New View" Action Placement

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Will, Jan 29, 2026 (derived from DFT-003 discussion)

**Context:**
If filter changes auto-apply to pinned layers, users need a way to create a second view of the same layer with different filters (e.g., "Mountain Lion" view AND "Deer" view of Camera Traps).

**Question:** Where should the "Create New View" or "Duplicate with Filters" action live?

**Options Considered:**
1. **Funnel (🌪️) as menu trigger** — Click funnel opens dropdown with Edit/Clear/Create New View
2. **Kebab menu (⋮)** — Add overflow menu to each row for secondary actions
3. **Expanded panel with action buttons** — Click layer expands to show filter details + action buttons

**Discussion:**
- Will (Jan 29): Analyzed options using UI/UX principles (Law of Proximity, Fitts's Law, discoverability, error prevention)
- Key insight: "Create New View" is high-importance action that should be immediately visible, not hidden in kebab menu
- Kebabs are "power user" affordances—not attention-grabbing enough for a key feature
- When layer becomes active (clicked), showing expanded view with prominent action buttons ensures discoverability
- Relates to DFT-013 (multiple filtered views on same layer)

**Resolution:** Feb 2, 2026 — **Option C: Expanded panel with action buttons**

**Design Decisions:**

1. **Collapsed state (inactive pinned layer):**
   ```
   │ [drag] [👁] Camera Traps (mt. lion) 🌪️5 ✕ │
   ```

2. **Expanded state (active pinned layer):**
   ```
   ┌─────────────────────────────────────────────────────┐
   │ [drag][👁] Camera Traps (mt. lion)            🌪️5 ✕│
   ├─────────────────────────────────────────────────────┤
   │ Filters: species = mountain lion, date > 2024      │
   │ ┌──────────────┐ ┌───────┐ ┌──────────────────┐    │
   │ │ Edit Filters │ │ Clear │ │ + Create New View│    │
   │ └──────────────┘ └───────┘ └──────────────────┘    │
   └─────────────────────────────────────────────────────┘
   ```

3. **Behavior:**
   - Clicking any pinned layer makes it "active" and expands its panel
   - Only ONE layer expanded at a time (clicking another collapses the previous)
   - Action buttons visible immediately in expanded state
   - "Create New View" creates a duplicate entry with the current filter state

4. **Alternative noted (Option B - Kebab menu):**
   - Could consolidate secondary actions into a kebab (⋮) menu
   - Pros: Scalable for future actions, no panel expansion needed
   - Cons: Lower discoverability for "Create New View"
   - Decision: Reserve kebab pattern for future consideration if action list grows

5. **Swatch removed:**
   - Swatch removed from row spec — map legend shows symbology for active layer only
   - Active state indicated by expansion + visual treatment (background color, left border accent)
   - Map legend component handles symbology explanation (one layer at a time)

**Rationale:**
- **Discoverability:** High-importance action visible immediately when user interacts with layer
- **Details on demand:** Row stays compact until user engages; expansion reveals full context
- **Contextual relevance:** "Create New View" appears when user is inspecting filter state (the moment they'd want to fork)
- **Single Source of Truth:** Widget is canonical location for pinned layer management (CRUD operations)

**Documented in:**
- Phase 0 task 0.5 updated with expanded/collapsed widget states
- DFT-001 resolution summary updated with refined widget design
- Master development plan updated with cross-phase UX decision

**✅ Verification Checklist (for future reference):**
- [x] ASCII diagrams in `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.5 match decision
- [x] Acceptance criteria in phase document updated
- [x] Decision notes added at top of relevant task section
- [x] Cross-phase decision added to `master-plan.md` UX Decisions table
- [x] Resolved decision summary created in `PLANNING/resolved-decisions/` (if archived)

---

### DFT-003c: ANiML Browse Entry Point (Tabs vs Landing Cards)

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** Will, Jan 29, 2026 (derived from DFT-003 discussion)

**Context:**
ANiML Browse tab needs to let users choose between Animal-First and Camera-First workflows.

**Options:**
1. **Sub-tabs (current mockup):** `🦁 By Animal` | `📷 By Camera` toggle
2. **Landing cards:** Two prominent cards explaining each approach:
   ```
   ┌─────────────────────────────────────┐
   │  🦁 Browse by Animal                │
   │  "Which animals are present?"       │
   └─────────────────────────────────────┘
   ┌─────────────────────────────────────┐
   │  📷 Browse by Camera                │
   │  "What's at this location?"         │
   └─────────────────────────────────────┘
   ```
3. **Hybrid:** Show cards on first visit, remember preference, use tabs thereafter

**Discussion:**
- Will (Feb 2): Analyzed UI/UX tradeoffs between tabs and landing cards
- Key insight: Animal-First vs Camera-First represent fundamentally different user intents, not just different views of the same data
- Landing cards provide better education opportunity and reduce cognitive load within each mode
- Tabs work best for parallel content sharing structure; these modes have different workflows

**Resolution:** Feb 2, 2026 — **Landing cards approach**

**Design Decisions:**
1. **Entry point:** Landing cards showing two prominent options when Browse tab opens
2. **Card design:** Each card includes icon, title, and brief tagline explaining the mental model
3. **User preference:** Remember user's last selection so returning users can skip the landing page
4. **Escape hatch:** Include subtle "Switch to [other mode]" link within each mode (footer or header)
5. **Rationale:**
   - Mode selection benefits from intentional friction (conscious choice vs rapid switching)
   - Education opportunity for first-time users who may not understand the distinction
   - Reduced cognitive load once committed to a paradigm
   - Cleaner information architecture (tabs imply parallel content with shared structure)

**Documented in:**
- Phase 2 task 2.2 updated with landing cards entry point requirement

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 2 task 2.2 updated with landing cards requirement

---

### DFT-004: Two Query Locations — Contextual Clarity

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "I am a little confused with where the primary filtering should take place, on the pop-up or the right side panel. I see two areas to filter date range, as well as two places to filter aggregation."

**Context:**
The three-level hierarchy legitimately requires two filter locations:
1. **Layer-level query:** Filter which features appear (e.g., which cameras)
2. **Feature-level query:** Filter related data for a bookmarked feature (e.g., which images from a camera)

These are different questions, but the mockups show both simultaneously without clear context.

**Options Considered:**
1. **Breadcrumb navigation:** Show user's location in hierarchy (`Camera Traps > CAM-042 > Images`)
2. **Progressive disclosure:** Only show relevant filters based on current view level
3. **Explicit container labels:** "Filter Cameras in This Layer" vs "Filter Images for CAM-042"
4. **Visual nesting:** Indent or contain feature-level UI to show you're "inside" a feature

**Discussion:**
- Will (Jan 26): This is our trickiest implementation detail. The paradigm is sound (the data actually has two levels), but the UI must make "which level am I filtering?" obvious. File system analogy: nobody confuses filtering folders with searching within a file because the UI shows your location.
- Will (Feb 2): Extended discussion focused on Dendra as the most complex case. Key insight: the same parameter (time range) can serve different purposes at different levels (discovery vs. focus). Need to separate **direct manipulation** (exploration) from **parametric control** (specification).

**Resolution:** Feb 2, 2026 — **Progressive Disclosure + Direct/Parametric Separation**

**Design Decisions:**

1. **Sidebar is the canonical location for parametric filter editing (date pickers, dropdowns)**
   - Pinned Layers widget shows filter *status* (🌪️ indicator) but does NOT contain filter editing UI
   - Widget has "Edit Filters" button that navigates to/opens right sidebar

2. **Sidebar is context-aware (progressive disclosure):**
   - **State A (Layer View):** When layer is active, no feature selected → show layer-level filters
   - **State B (Feature View):** When feature is selected → collapse layer filters to read-only summary, show feature-level filters
   - Only ONE filter scope visible at a time (reduces confusion)

3. **Pop-up charts (e.g., Dendra time-series) use direct manipulation only:**
   - Slider for exploration/viewport (pan through time)
   - NO date pickers in pop-up (avoids redundant affordances)
   - Slider state is **ephemeral** — not saved

4. **Persistence model:**
   | UI Location | What It Controls | Saved To |
   |-------------|------------------|----------|
   | Right Sidebar (Layer View) | Which features appear on map | Pinned layer's query |
   | Right Sidebar (Feature View) | What related data is shown | Bookmarked feature's query |
   | Pop-up Slider | Exploration viewport only | Not saved (ephemeral) |

5. **Inheritance on bookmark creation:**
   - When bookmarking a feature without an explicit feature filter, **inherit from layer filter** as default
   - User can then adjust the feature filter independently in sidebar
   - Layer and feature filters are **independent after creation** (not linked)

6. **Labeling for clarity:**
   - Layer filter section: "Show [features] with data in: [controls]"
   - Feature filter section: "View data from: [controls]"
   - Collapsed layer summary shows: "Layer: [filter summary]" with [Edit] link

**Rationale (UX Principles Applied):**
- **Progressive disclosure:** Only show relevant filters for current context
- **Recognition over recall:** Collapsed summary reminds user of active layer filter
- **Direct manipulation vs. parametric control:** Slider = exploration (fluid), date pickers = specification (precise)
- **Single source of truth:** Sidebar is the canonical edit location; pop-ups are for exploration only
- **Avoids redundant affordances:** No date pickers in pop-up when sidebar has them

**ASCII Example — State A (Layer View, Dendra):**
```
┌─────────────────────────────────────────────────────┐
│ RIGHT SIDEBAR                                       │
│ ═══════════════════════════════════════════════════│
│ Dendra Sensors                                     │
│ ─────────────────────────────────────────────────── │
│ LAYER FILTERS                                      │
│ "Show sensors with data in:"                       │
│ Start: [Jan 1, 2024    ]  End: [Dec 31, 2024  ]    │
│ [Apply]                                            │
│ ─────────────────────────────────────────────────── │
│ [📌 Pin Layer]                                     │
└─────────────────────────────────────────────────────┘
```

**ASCII Example — State B (Feature View, Dendra):**
```
┌─────────────────────────────────────────────────────┐
│ RIGHT SIDEBAR                                       │
│ ═══════════════════════════════════════════════════│
│ ← Back to Dendra Sensors                           │
│ Layer: 2024                                  [Edit]│
│ ─────────────────────────────────────────────────── │
│ Sensor ABC-123                                     │
│ ─────────────────────────────────────────────────── │
│ FEATURE FILTERS                                    │
│ "View data from:"                                  │
│ Start: [Mar 1, 2024    ]  End: [Mar 31, 2024  ]    │
│ Aggregation: [Daily ▼]                             │
│ [Apply]                                            │
│ ─────────────────────────────────────────────────── │
│ [🔖 Bookmark Sensor]                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ POP-UP CHART (floating on map)                     │
│ ═══════════════════════════════════════════════════│
│ [time-series chart]                                │
│ ───────────●━━━━━━━━━━━●─────────────────────────── │
│  Mar 1    Mar 10     Mar 20                 Mar 31 │
│                                                    │
│ (Slider for exploration — NOT saved)               │
└─────────────────────────────────────────────────────┘
```

**Documented in:**
- Phase 0 task 0.5 updated with widget status-only behavior (no filter editing in widget)
- Phase 3 (Dendra) updated with progressive disclosure sidebar design + pop-up slider-only behavior
- Master plan updated with cross-phase UX decision

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 0 task 0.5 updated (widget shows status, doesn't edit filters)
- [x] Phase 3 (Dendra) updated with progressive disclosure + pop-up slider design
- [x] Master plan updated with cross-phase UX decision
- [x] Quick Reference table updated with resolved status

---

### DFT-005: Widget Collapse Behavior (Screen Crowding)

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> Screen gets crowded with time series data. Maybe collapse only the pinned layers widget when editing Dendra pop-ups, so "bookmark range" action shows the bookmark widget.

**Options:**
1. Auto-collapse inactive widgets based on current task
2. User-controlled collapse (click to expand/collapse)
3. Minimize to icon bar when not in use

**Discussion:**
- Will (Jan 29): Auto-collapse makes sense for time-series viewing. Pinned Layers widget should collapse, but Bookmarked Features widget should remain expanded (needed for "bookmark range" action).

**Resolution:** Jan 29, 2026 — **Auto-collapse Pinned Layers widget when viewing time-series data**

**Design Decisions:**
1. **Pinned Layers widget:** Auto-collapses when time-series chart/pop-up is active (e.g., Dendra sensor detail view)
2. **Bookmarked Features widget:** Remains expanded during time-series viewing (needed for "bookmark range" action)
3. **State restoration:** Widgets restore to previous state when time-series view closes
4. **User override:** Users can manually expand/collapse widgets to override auto-collapse behavior
5. **Detection mechanism:** Widgets detect time-series view state (e.g., via context or prop indicating active time-series view)

**Documented in:**
- Master development plan: Added UX decision for auto-collapse behavior
- Phase 0 tasks 0.5 and 0.6: Updated acceptance criteria with auto-collapse requirements

---

### DFT-006: Tab Navigation Order on Layer Select

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "To confirm, once you add a layer to the workspace the Overview tab will be the first thing that pops up correct?"

**Options:**
1. Overview first (current assumption)
2. Browse first (jump straight to features)
3. Context-dependent (depends on how user got there)

**Discussion:**
- Will (Jan 26): I think it should always be Overview first. The Overview tab can include a prominent "Browse Features" button that takes the user to the Browse tab. This gives users context about the layer before diving into data. Good candidate for quick team confirmation via email/form.

**Resolution:** Feb 2, 2026 — **Overview tab opens first**

**Design Decisions:**
1. **Default tab:** Overview tab is active when a layer is selected in the left sidebar
2. **Prominent CTA:** Overview tab includes a prominent "Browse Features →" button to navigate to Browse tab
3. **Consistent behavior:** All layers follow this pattern (not context-dependent)
4. **Rationale:**
   - **Information hierarchy:** Researchers need layer context (temporal/spatial extent, data source, methodology, citations) before diving into data
   - **Discoverability:** Important metadata/caveats are visible before user explores features
   - **Consistent UX:** Same behavior every time builds predictable muscle memory
   - **Progressive disclosure:** Aligns with DFT-004 pattern (context first, then drill down)
   - **Low friction:** One-click "Browse Features →" button mitigates any extra navigation cost
5. **Future enhancement (optional):** Could persist tab selection per session for power users who repeatedly access the same layer

**Documented in:**
- Phase 1 task 1.2: Updated acceptance criteria to specify Overview as default tab
- Phase 2 task 2.2: Updated acceptance criteria to specify Overview as default tab
- Phase 3 task 3.2: Updated acceptance criteria to specify Overview as default tab
- Phase 4 task 4.2: Updated acceptance criteria to specify Overview as default tab

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 1 task 1.2 updated with Overview as default tab
- [x] Phase 2 task 2.2 updated with Overview as default tab
- [x] Phase 3 task 3.2 updated with Overview as default tab
- [x] Phase 4 task 4.2 updated with Overview as default tab
- [x] Quick Reference table updated with resolved status

---

### DFT-007: Bookmark Widget Labeling

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "I almost want the title to be 'Bookmark Items within Layer' or something to identify this distinction" — to clarify that bookmarks are features nested under layers.

**Context:**
The paradigm has two floating widgets — Pinned Layers (top-left) and Bookmarked Features (top-right) — that are conceptually parent-child (layers contain features), but visually appear as siblings (same widget type, same hierarchy level, both floating). The UI must communicate that bookmarked features are "plucked from" layers without overloading the title.

**Options Considered:**
1. "Bookmarked Features" (concise, GIS-friendly)
2. "Bookmarked Items (from Layers)" (explicit hierarchy)
3. "Saved Features" (alternative verb)
4. Keep "Bookmarks" but add subtitle/help text

**Discussion:**
- Will (Feb 2): Analyzed through established UX design principles (Norman, Gestalt, Nielsen)
- Key principles at risk: Conceptual Model, Proximity, Similarity, Recognition over Recall, Signifiers, Information Scent, Visual Hierarchy
- Solution: Use widget structure (not title) to communicate the relationship

**Resolution:** Feb 2, 2026 — **Group bookmarks by parent layer; layer header is non-interactive context label**

**Design Decisions:**

1. **Widget title:** "Bookmarked Features" (concise, matches GIS terminology)

2. **Widget structure:** Bookmarks grouped by parent layer
   - When user bookmarks a feature, its parent layer auto-inserts as a group header
   - Layer header is **non-interactive** (read-only context label, not a button)
   - Features appear as interactive rows under their parent layer

3. **Visual treatment for layer header (non-interactivity signifiers):**
   - Muted color (gray text, ~60% opacity)
   - No hover state (cursor stays default, no background change)
   - No buttons/icons on the row (no 👁, no ✕, no chevron)
   - Different typography (smaller, uppercase, or lighter weight than feature rows)
   - Full-width span (acts as section divider, not a card row)
   - Optional: subtle dotted line or different background tint

4. **Widget positioning:** Top-right (near right sidebar where feature-level work happens)
   - Gestalt Proximity at macro level: aligns with feature exploration context
   - Contrasts with Pinned Layers (top-left, near left sidebar/layer catalog)

5. **Feature rows remain fully interactive:**
   - Visibility toggle [👁]
   - Remove button [✕]
   - Standard hover states and clickable styling

**ASCII Wireframe:**

```
┌──────────────────────────────────────────────────┐
│ 🔖 BOOKMARKED FEATURES                           │
├──────────────────────────────────────────────────┤
│ ┄┄ Camera Traps ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │  ← Non-interactive layer label
│    CAM-042 (mt. lion)                 [👁] ✕    │  ← Interactive feature row
│    CAM-118                            [👁] ✕    │
│ ┄┄ Dendra Sensors ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│    Sensor ABC-123 (Mar 2024)          [👁] ✕    │
└──────────────────────────────────────────────────┘
```

**Rationale (UX Principles Applied):**
- **Norman's Conceptual Model:** Layer appears as parent → user sees hierarchy matching GIS mental model (layers contain features)
- **Gestalt Proximity:** Features positioned near layer label → perceived as related/grouped
- **Recognition over Recall:** Layer name visible inline → no memory burden to recall which layer a bookmark came from
- **Norman's Signifiers:** Non-interactive styling signals "this is context, not a control"
- **Visual Hierarchy:** Layer = muted group header, Features = prominent actionable rows
- **Information Scent:** Layer context visible → users can predict relationships without exploring

**Edge Case Noted:**
- If user bookmarks features from a layer they later unpin, bookmarked features remain with layer header as context (bookmarks are independent of pin state)

**Documented in:**
- Phase 0 task 0.6 updated with grouped widget structure and non-interactive layer header design
- Master plan updated with cross-phase UX decision
- Resolution summary: `PLANNING/resolved-decisions/dft-007-resolution-summary.md`

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 0 task 0.6 updated with grouped widget structure
- [x] Master plan updated with cross-phase UX decision
- [x] Resolution summary created in PLANNING/resolved-decisions/
- [x] Quick Reference table updated with resolved status

---

### DFT-008: TNC Brand Colors Integration

**Category:** Styling  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> Provided TNC brand colors for consideration. Current matte pastel palette is liked. Colors are optional, not required.

**TNC Brand Colors:**
- Parrot Green: `#05641c`
- Leaf Green: `#49a842`
- Benthic Blue: `#06063d`

**Notes:**
- Sophia mentioned she likes the current matte pastel palette
- These are options, not mandates
- Consider for accent colors, buttons, or headers

**Discussion:**
*None yet*

**Resolution:** *Pending — low priority, refine during development*

---

### DFT-009: TNC Brand Fonts Integration

**Category:** Styling  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> Provided TNC font recommendations. Current font is acceptable.

**TNC Brand Fonts:**
- Headline: **Barlow** (often bolded)
- Subheader: **Chronicle**
- Body/Sentence Case: **Barlow**

**Notes:**
- Sophia mentioned current font looks fine
- Consider if we want stronger TNC branding

**Discussion:**
*None yet*

**Resolution:** *Pending — low priority, refine during development*

---

### DFT-010: Terminology — "Items" → "Features"

**Category:** UI/UX (Terminology)  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> "Features is a word that is more familiar to the GIS user." Definite change: "item" should become "feature" throughout. For bookmarks, "saved features" was suggested as an option, though the exact label is still open.

**Required Changes:**
- "Bookmark Items" → "Bookmarked Features" or "Saved Features"
- "Marked items" → "Saved features"
- Any other "item" references in the UI

**Discussion:**
- Trisalyn confirmed "items → features" is a definite change
- "Bookmark" vs "Saved" label still open for discussion
- Ties into DFT-007 (Bookmark Widget Labeling)

**Resolution:** Jan 26, 2026 — Applied terminology change to development plans:
- master-development-plan.md: "Bookmarked Items" → "Bookmarked Features"
- phase-0-foundation.md: Updated task 0.6 and related text
- phase-5-export-builder.md: Updated export builder references
- design-system.md: Updated widget card pattern
- Note: "Bookmark" vs "Saved" label decision still pending (see DFT-007)

---

### DFT-011: Target Audience Clarification

**Category:** Design Decision  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> "Not the broad public. I think it's the researcher, with an eye towards the GIS researcher." The catalog should feel intuitive to someone who uses GIS, but extend beyond to general researchers.

**Resolution:**
- **Primary audience:** Researchers (academic, TNC staff)
- **Secondary consideration:** GIS-minded users (ensure GIS conventions feel natural)
- **NOT targeting:** Broad public / general visitors

**Design Implications:**
- Can use GIS terminology like "features", "layers", "queries"
- Don't need to over-simplify for non-technical users
- Export workflows can assume some technical literacy

---

### DFT-012: Camera Trap Clustering Visualization

**Category:** Feature Request / UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> When filtering for a species (e.g., mountain lions), show camera trap locations as clustered icons with numbers — "like the bike Maps icons where you have a number." The 127 mountain lion images should be distributed across 10-20 camera locations. Clicking a numbered icon shows a list of pictures.

**Example Workflow:**
1. User filters ANiML layer for "mountain lion"
2. Map shows ~15 camera trap icons, each with a number (e.g., "23")
3. The number represents mountain lion images at that trap
4. Click icon → see list/gallery of those 23 images

**Discussion:**
- Will (Jan 26): This is a significant UX improvement over showing individual image markers. May require rethinking ANiML visualization layer.
- Will (Feb 3): Analyzed design options using Norman, Gestalt, Nielsen, Shneiderman, and Tufte principles. Recommended Option A (count badge on camera icon) with hybrid tooltip approach.

**Resolution:** Feb 3, 2026 — **Count badges on camera icons (Option A)**

**Design Decisions:**

1. **Badge on camera icon showing filtered image count**
   - Small circular badge (upper-right corner of camera icon)
   - Contrasting color (red, blue, or TNC brand accent)
   - Shows count of observations matching the **layer-level filter**
   - Badge only appears when layer-level filter is applied

2. **When badges appear:**
   - Triggered by layer-level filter (species, date range, etc.) applied in right sidebar (Layer View)
   - NOT affected by feature-level filters (camera-specific filters in Feature View)
   - Badges remain visible when user drills into a specific camera

3. **Badge behavior:**
   - Click camera icon → sidebar navigates to that camera's filtered images
   - Hover shows tooltip with richer context (species name, date range)
   - Cameras with 0 matching images: **decision pending** (hidden vs grayed out)

4. **Interaction flow:**
   ```
   User in Layer View → applies species filter ("mountain lion")
       ↓
   Map updates: each camera shows badge with count
       ↓
   User clicks camera "CAM-042" (showing "23")
       ↓
   Sidebar transitions to Feature View → shows 23 mt. lion images
   ```

5. **Progressive disclosure (DFT-004) integration:**
   - Layer-level query (applied in sidebar Layer View) drives map badge counts
   - Feature-level query (applied when camera selected) only affects related data shown for that camera
   - Sidebar is canonical filter editor; widget shows status only

6. **Edge cases to resolve:**
   - No filter applied: Show total counts, or no badges until filter is applied?
   - Zero results: Hide cameras with 0 matches, or show grayed out?
   - Multiple species selected: Show combined count (if multi-select supported)

**UX Principles Applied:**
- **Norman (Visibility):** Counts make distribution immediately visible
- **Norman (Feedback):** Click immediately shows relevant images
- **Norman (Mapping):** Number on map = images at that location
- **Gestalt (Proximity):** Images grouped by camera location (spatial reality)
- **Nielsen (System Status):** Counts show what filter found and where
- **Shneiderman (Overview first):** Spatial overview before drilling into details
- **Tufte (Data-ink ratio):** Single number conveys essential information

**Documented in:**
- Phase 2 task 2.5 updated with numbered badge map visualization
- Master plan updated with cross-phase UX decision

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 2 task 2.5 updated with badge visualization design
- [x] Master plan updated with cross-phase UX decision
- [x] Quick Reference table updated with resolved status

---

### DFT-013: Multiple Filtered Views on Same Layer (PARADIGM)

**Category:** Paradigm Extension  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> "I might want to be able to pin my map of mountain lions and then also bring up my map of deer. So that I can look at a predator-prey interaction."

**Paradigm Implication:**
This is a **new feature** to the paradigm. Current assumption was one query per layer. Trisalyn wants:
- Multiple saved filtered views on the same layer
- Each filter can be toggled on/off independently
- Example: ANiML layer with both "mountain lions only" and "deer only" views active

**Questions to Resolve:**
1. How do multiple filtered views display in the Pinned Layers widget?
2. Are they sub-items under the parent layer, or separate entries?
3. How do we prevent UI clutter with many filtered views?
4. Do filtered views get different colors/symbology on the map?

**Discussion:**
- Will (Jan 26): This is a legitimate research workflow (predator-prey, co-occurrence analysis). Paradigm can support this conceptually. Implementation needs thought — possibly "filtered views" as a sub-concept under pinned layers.
- Will (Feb 3): Analyzed using Norman, Nielsen, Gestalt principles. Key constraint: map badge visualization becomes complex with multiple simultaneous filtered views (badge stacking, color management, legend complexity). Proposed "Multiple Saved, Single Visible" model as pragmatic MVP scope.
- Amy (Feb 3): Confirmed direction. Development time is a concern. Quick toggling between views is acceptable for MVP. Future enhancement could allow limited simultaneous views (e.g., 2-3 max). 80/20 rule: most users won't need simultaneous filtered views.

**Resolution:** Feb 3, 2026 — **"Multiple Saved, Single Visible" Model**

**Design Decisions:**

1. **Core Paradigm:** Users can save multiple filtered views of the same layer, but only ONE filtered view is visible on the map at a time (mutual exclusivity).

2. **Widget Structure — Nested when multiple views exist:**
   ```
   ┌──────────────────────────────────────────────────────┐
   │ 📌 PINNED LAYERS                                     │
   ├──────────────────────────────────────────────────────┤
   │ [👁] Camera Traps ▼                             ✕    │  ← Parent (ON if any child visible)
   │      [👁] mountain lion 🌪️3                          │  ← Active view (eye ON)
   │      [  ] deer 🌪️2                                   │  ← Inactive view (eye grayed)
   │      [+ New View]                                    │
   ├──────────────────────────────────────────────────────┤
   │ [👁] Dendra Sensors (2024) 🌪️1                  ✕    │  ← Single view (flat, no nesting)
   └──────────────────────────────────────────────────────┘
   ```

3. **Visibility Logic:**
   - **Parent eye icon:** ON if at least one child view is visible; OFF if no children visible
   - **Child eye icons:** Only ONE can be ON at a time (mutual exclusivity)
   - **Clicking a child row:** Makes that view visible, auto-turns off the previously visible view
   - **Clicking child eye to turn OFF:** Also turns off parent (no children visible)
   - **Clicking parent eye to turn ON:** Restores previously-selected child view (memory-preserving)
   - **Clicking parent eye to turn OFF:** Hides all children; remembers which was selected

4. **Click Targets:**
   - Entire child row is clickable (Fitts's Law — larger target, low-risk action)
   - Clicking anywhere in a child row activates that view's visibility

5. **Visual Indicators:**
   - Use consistent eye icon (👁) for all visibility toggles
   - Eye ON = normal color; Eye OFF = grayed out
   - No radio buttons — eye icon is the sole indicator of visibility state

6. **Flat vs. Nested Behavior:**
   - **Single view:** Layer stays flat (no nesting, no parent/child structure)
   - **Multiple views:** Layer becomes parent with nested child views
   - **Transition:** When user clicks "Create New View" on a single-view layer, it promotes to nested structure

7. **Map Symbology:**
   - Only the active/visible filtered view shows count badges on camera icons
   - No badge stacking or multi-color badge management needed
   - Badge visualization unchanged from DFT-012 (single filter = single badge set)

8. **Future Enhancement (Phase 2+):**
   - Could allow limited simultaneous views (e.g., 2-3 max) with distinct colors
   - "Compare Views" mode for side-by-side analysis
   - For now, users can export multiple views and analyze in GIS software

**Rationale (Design Principles Applied):**
- **Norman's Constraints:** Limiting to one visible view prevents visual chaos and simplifies map symbology
- **Fitts's Law:** Entire row clickable = larger, faster targets
- **Consistency:** Eye icon used throughout for all visibility toggles
- **Progressive Complexity:** Single-view layers stay simple; nesting only when needed
- **Memory-Preserving:** Parent toggle remembers which child was last selected
- **80/20 Rule:** Most users won't need simultaneous filtered views; quick toggling suffices

**Edge Cases:**
| Scenario | Behavior |
|----------|----------|
| User deletes all views | Layer demotes to flat single-view (or removes entirely if unfiltered base not kept) |
| User creates first "New View" | Layer promotes to nested structure; original becomes first child |
| All views hidden, then parent re-enabled | Restores last-selected view |
| User exports with multiple saved views | All saved views included in export (visibility state doesn't affect export) |

**Open Consideration:**
- Should ALL layers with any filter show nesting, or only layers with 2+ views? Current decision: nest only when 2+ views exist. May revisit if consistency becomes confusing.

**Documented in:**
- Phase 0 task 0.5 needs update with nested widget structure
- Master plan needs update with cross-phase UX decision

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 0 task 0.5 updated with nested widget design and visibility logic
- [x] Master plan updated with cross-phase UX decision
- [x] Quick Reference table updated with resolved status

---

### DFT-015: Empty State Design

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
The design documents thoroughly specify populated states, but not what users see when:
1. **First visit:** No pinned layers, no bookmarks — what do floating widgets show?
2. **Empty widget:** Bookmarked Features widget has no bookmarks — hide or show placeholder?
3. **Zero filter results:** User applies filters that match 0 features — what does Browse tab show?
4. **Search with no results:** DataOne search returns nothing — what message/suggestions?

**Why this matters (Nielsen: Help users recognize, diagnose, recover from errors):**
Empty states are critical teaching moments. A well-designed empty state guides users toward the desired action. A poorly designed one creates confusion or abandonment.

**Resolution:** Feb 3, 2026 — **Show with placeholder (educational), differentiate first-visit vs returning user**

**Design Decisions:**

1. **Terminology is configurable via `src/config/terminology.ts`:**
   - `childNoun`: "Feature" (default) or "Item" — team can toggle for testing
   - Widget titles use: "Pinned {childNoun} Layers" / "Bookmarked {childNoun}s"
   - All UI copy referencing features/items uses this config
   - Default to "Feature" (aligns with GIS terminology)

2. **Widget initial state: configurable (team design option):**
   - **Expanded (default):** Widgets start expanded with educational empty state
   - **Collapsed:** Widgets start collapsed with instructive header text
   - Team toggle allows testing both before finalizing default

3. **Empty state visual pattern:**
   - Simple muted SVG icons (no emoji)
   - Utilitarian tone (professional, no warmth)
   - Design tokens: icon `w-12 h-12 text-gray-300`, title `text-sm font-medium text-gray-700`, body `text-sm text-gray-500`
   - Container: `flex flex-col items-center justify-center text-center px-6 py-8`

4. **Pinned {Feature/Item} Layers Widget — Empty States:**

   **First visit (expanded, educational):**
   ```
   ┌────────────────────────────────────────────┐
   │ PINNED {FEATURE/ITEM} LAYERS           ▲  │
   ├────────────────────────────────────────────┤
   │                                            │
   │          [pin icon - muted]                │
   │                                            │
   │     No layers pinned.                      │
   │                                            │
   │     Pin layers from the left sidebar       │
   │     to save them here.                     │
   │                                            │
   └────────────────────────────────────────────┘
   ```

   **Returning user (laconic):**
   ```
   ┌────────────────────────────────────────────┐
   │ PINNED {FEATURE/ITEM} LAYERS           ▲  │
   ├────────────────────────────────────────────┤
   │     Pinned layers appear here.             │
   └────────────────────────────────────────────┘
   ```

   **Collapsed header:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ PINNED {FEATURE/ITEM} LAYERS (pin layers from the left) ▼  │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **Bookmarked {Features/Items} Widget — Empty States:**

   **First visit (expanded, educational):**
   ```
   ┌────────────────────────────────────────────┐
   │ BOOKMARKED {FEATURES/ITEMS}            ▲  │
   ├────────────────────────────────────────────┤
   │                                            │
   │        [bookmark icon - muted]             │
   │                                            │
   │     No {features/items} bookmarked.        │
   │                                            │
   │     Bookmarks save specific {features/     │
   │     items} within layers (cameras,         │
   │     sensors, observations).                │
   │                                            │
   │     Bookmark {features/items} from the     │
   │     right sidebar.                         │
   │                                            │
   └────────────────────────────────────────────┘
   ```

   **Returning user (laconic):**
   ```
   ┌────────────────────────────────────────────┐
   │ BOOKMARKED {FEATURES/ITEMS}            ▲  │
   ├────────────────────────────────────────────┤
   │     Bookmarked {features/items} appear     │
   │     here.                                  │
   └────────────────────────────────────────────┘
   ```

   **Collapsed header:**
   ```
   ┌───────────────────────────────────────────────────────────────────┐
   │ BOOKMARKED {FEATURES/ITEMS} (bookmark {features} from the right) ▼│
   └───────────────────────────────────────────────────────────────────┘
   ```

6. **Right Sidebar — No Layer Selected:**
   ```
   ┌─────────────────────────────────────────┐
   │                                         │
   │         [layers icon - muted]           │
   │                                         │
   │   Click any {feature/item} layer in     │
   │   the left sidebar to view its          │
   │   details here.                         │
   │                                         │
   └─────────────────────────────────────────┘
   ```

7. **Browse Tab — Zero Filter Results:**
   - Filters remain visible via proper UI controls (dropdowns, date pickers)
   - Dynamic label: "No {feature_label_plural} match your filters."
   - Suggestions specific to active filters
   - "Clear All Filters" button in filter section

8. **Feature Selected — No Related Data:**
   - Metadata section still shows (feature exists)
   - Explain mismatch between user's filter and available data range
   - One-click fix: "Adjust to data range" button
   - **Note:** Ideally, features with no related data in selected range should be filtered out or grayed at the layer level (per DFT-028), making this state rare

9. **DataOne Search — No Results:**
   - Echo the search query in message
   - Actionable suggestions (fewer keywords, check spelling)
   - "Clear Search" button

10. **Drone imagery and LiDAR are pin-only layers:**
    - These data sources do not have bookmarkable sub-items
    - They will never appear in the Bookmarked Features widget
    - The "feature" terminology works for layers that DO have discrete items

**Design Principles Applied:**
- **Nielsen's Visibility of System Status:** User understands empty state is intentional, not a bug
- **Nielsen's Recognition over Recall:** Show what action will populate the area
- **Norman's Signifiers:** Visual cues suggest the path forward
- **Gestalt Closure:** Empty states feel complete, not broken
- **Progressive Disclosure:** First-visit = educational, returning = laconic

**Documented in:**
- Phase 0 tasks 0.5 and 0.6 updated with empty state requirements
- Design system updated with empty state pattern and terminology config
- Master plan updated with UX decision

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 0 task 0.5 updated with empty state for Pinned Layers widget
- [x] Phase 0 task 0.6 updated with empty state for Bookmarked Features widget
- [x] Design system updated with empty state pattern
- [x] Design system updated with terminology config
- [x] Master plan updated with UX decision
- [x] Quick Reference table updated with resolved status

---

### DFT-016: Mobile/Tablet Responsiveness Scope

**Category:** Technical  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
The design documents assume a desktop layout (left sidebar, right sidebar, floating widgets). No mention of:
- Minimum supported viewport width
- Tablet behavior (collapse sidebars to overlays? stack vertically?)
- Whether mobile is explicitly out of scope

The existing `DesktopOnlyGate.tsx` component suggests this has been considered, but scope wasn't documented.

**Why this matters:**
If mockups are created at a fixed width without defined breakpoints, the team will inherit responsive decisions they didn't consciously make.

**Questions to Resolve:**
1. What is the minimum supported viewport width?
2. Is mobile explicitly out of scope for v2.0?
3. Should mockups be created at a specific width (e.g., 1440px)?
4. If tablet is in scope, how do the sidebars behave?

**Options:**
1. **Desktop-only** — explicitly state minimum width (e.g., 1280px), show "desktop required" gate
2. **Responsive design** — define breakpoints and sidebar collapse behavior
3. **Defer** — desktop-only for v2.0, responsive for v2.1+

**Discussion:**
Analyzed from multiple design theory perspectives (Nielsen, Gestalt, Norman):

**Nielsen's Heuristics:**
- **Visibility of system status + Recognition over recall:** The paradigm relies on *simultaneous visibility* of related information (left sidebar, right sidebar, floating widgets, map). Mobile forces sequential disclosure (hamburger menus, hidden panels), violating "recognition over recall."
- **Flexibility and efficiency:** Target audience (DFT-011: GIS-minded researchers) are power users who benefit from information density. Mobile's constrained viewport trades efficiency for simplicity — opposite of what this audience needs.

**Gestalt Principles:**
- **Proximity + Common Region:** Design uses spatial proximity to show relationships (layer in left sidebar → details in right sidebar). Breaking into separate "screens" destroys the gestalt.
- Widgets *need* to float over the map because they represent *parallel* concerns (persistent selections) while sidebars represent *current* exploration context.

**Norman's Principles:**
- **Mapping:** Left-to-right flow (browse → select → examine → export) maps to natural reading direction. Breaks on mobile.
- **Constraints:** Desktop constraints are *enabling* — fixed sidebars make system predictable. Mobile requires dynamic constraints (slide-in panels), adding interaction overhead.

**Practical Reality:**
- Mockup `02a-unified-layout.html` has 6 simultaneously-visible interaction zones
- Three-level data hierarchy (Layer → Feature → Related Data) benefits from stable UI landmarks
- Even on 10" iPad, significant UI compromise would be required

**Resolution:** 
**Option 1 adopted: Desktop-only for v2.0**

**Specifics:**
- **Minimum viewport width:** 1280px
- **Below 1280px:** Show existing `DesktopOnlyGate` component with explicit messaging
- **Mockups designed at:** 1440px (standard desktop breakpoint)
- **Mobile/tablet responsiveness:** Explicitly deferred to v2.1+ as optional enhancement
- **Documentation:** This is a professional desktop tool for researchers at workstations

**Rationale:**
- Aligns with target audience (researchers at workstations, not field work)
- Avoids design-by-accident (inheriting responsive decisions not consciously made)
- Frees development resources for core functionality
- `DesktopOnlyGate.tsx` already exists — formalize the threshold at 1280px

**Edge Case Noted:**
If TNC researchers need field verification (visiting camera trap locations with tablet), a view-only mobile mode showing bookmarked locations on simplified map could be v2.1+ feature.

**Documented in:**
- `docs/planning-task-tracker.md` (this file)
- `docs/master-plan.md` — UX Decisions table
- `docs/PLANNING/resolved-decisions/dft-016-resolution-summary.md`
- `src/components/DesktopOnlyGate.tsx` — updated MIN_DESKTOP_WIDTH constant to 1280px

**✅ Verification Checklist:**
- [x] Resolution documented in planning-task-tracker.md
- [x] Master plan updated with UX decision
- [x] DesktopOnlyGate.tsx updated to 1280px threshold
- [x] Resolution summary created in resolved-decisions/
- [x] Quick Reference table updated with resolved status

---

### DFT-017: Keyboard Navigation & Accessibility Patterns

**Category:** Accessibility  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
No mention of:
- Tab order between widgets, sidebars, map
- Keyboard shortcuts (e.g., Escape to close panels?)
- Screen reader announcements for state changes (widget animations, filter applied)
- Focus management when panels expand/collapse

**Why this matters (Nielsen: Flexibility and efficiency of use):**
GIS researchers often work with multiple windows and benefit from keyboard-driven workflows. Accessibility is also a legal requirement for many institutions.

**Resolution:** Feb 3, 2026 — **Baseline Accessibility: Natural DOM order, standard conventions**

**Design Decisions:**

1. **Tab Order Principle — Follow natural DOM order:**
   - Tab navigation will follow left-to-right, top-to-bottom layout matching visual structure
   - Flow: Left sidebar → Map → Floating widgets (top to bottom) → Right sidebar
   - Within each region: natural reading order (buttons, links, inputs in DOM order)
   - **No custom `tabindex` overrides** unless specific accessibility issue requires it
   - **Implementation note:** If CSS positioning (e.g., `position: absolute` for floating widgets) creates visual/DOM mismatch, adjust DOM order to match visual layout

2. **Escape Key Behavior — Close most recently opened/focused element:**
   - Modal open → Escape closes modal
   - Expanded widget row → Escape collapses row
   - Expanded panel → Escape collapses panel
   - Map popup open → Escape closes popup
   - **Rule:** Escape always closes/collapses the most recently opened UI element, moving focus back to trigger element when possible

3. **Focus Management — Move focus to first interactive element when expanding:**
   - Widget row expands → focus moves to first button (Edit Filters, Bookmark, etc.)
   - Right sidebar opens → focus moves to first tab or interactive element
   - Modal opens → focus moves to first focusable element in modal
   - **Rule:** When a container expands, focus should move to the first interactive element inside

4. **Screen Reader Announcements — Announce significant actions only:**
   - "Filter applied" when filter updates (announce count: "Filter applied: 47 features match")
   - "Layer pinned" / "Layer unpinned"
   - "Bookmark saved" / "Bookmark removed"
   - Error messages (inline and toast)
   - **Do NOT announce:** Hover states, subtle animations, non-critical UI updates
   - **Implementation:** Use ARIA live regions (`aria-live="polite"` for non-urgent, `aria-live="assertive"` for errors)

**Deferred to Phase 6 (Polish & Accessibility Audit):**
- Comprehensive keyboard shortcuts (beyond Tab and Escape)
- Full WCAG 2.1 AA compliance audit
- Detailed ARIA label copy and testing
- Screen reader testing with NVDA/JAWS/VoiceOver
- Keyboard-only workflow testing
- Color contrast verification
- Focus indicator styling refinement

**Rationale:**
These four principles establish the mental model for keyboard/accessibility behavior without overspecifying implementation details. Modern React components with semantic HTML will handle most accessibility automatically. Phase 6 will refine and audit, but developers have clear guidance now.

**Design Principles Applied:**
- **Nielsen #7 (Flexibility and efficiency of use):** Keyboard navigation supports power users
- **Norman's Feedback principle:** Focus states provide visual feedback for interaction
- **Gestalt Proximity:** Elements visually grouped are in the same tab group

---

### DFT-018: Loading States and Skeleton UI Patterns

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
The documents reference 8-12s ANiML load times (Phase 2 blocking issue) but don't specify:
- What users see during data loading (spinner? skeleton? progress bar?)
- Partial loading behavior (show available data while rest loads?)
- Error handling when API fails (retry button? fallback message?)

**Why this matters (Nielsen: Visibility of system status):**
This is critical for perceived performance. The paradigm document's "Choose-Then-See" principle depends on images loading fast enough to feel immediate. If users see a blank screen for 8-12 seconds, they'll think the app is broken.

**Resolution:**

**1. Hybrid Indicator Style with Clear Rules:**

| Context | Indicator | Behavior |
|---------|-----------|----------|
| Right sidebar content | Skeleton UI | Shows expected structure; non-blocking |
| ANiML camera queries | Progress bar | "Querying cameras: 12/47" (deterministic progress) |
| Image grid | Skeleton → progressive load | First 10 images load, then infinite scroll + background pre-fetch |
| Map markers | Subtle spinner overlay | Only if >300ms delay |
| Search/filter actions | Inline spinner | In search box or filter control |
| Save/bookmark actions | Button spinner | Inline, replaces button content |

**2. Region-Specific, Non-Blocking Loading:**
- Loading happens in the region where content will appear
- User can navigate away or interact with other regions
- Right sidebar loading is dismissable/escapable

**3. Dynamic ETA for Long Loads (ANiML):**
- Show "Estimated time: ~X seconds" based on `queriesRemaining / queriesPerSecond`
- Update ETA dynamically as queries complete
- Example: "Querying 47 cameras... ~12 seconds remaining"

**4. Progressive Image Loading:**
- Fetch first 10 image URLs immediately
- Display as they arrive (waterfall pattern)
- Infinite scroll triggers next batch
- Pre-fetch next batch in background

**5. Timeout Behavior:**

| Threshold | Indicator | User Communication |
|-----------|-----------|-------------------|
| 0-300ms | None | (Feels instant) |
| 300ms-3s | Spinner/skeleton | None needed |
| 3s-15s | Skeleton + text | "Loading... ~X seconds" |
| 15s+ | Skeleton + warning | "Taking longer than usual. [Cancel]" |
| 30s | Auto-timeout | Error state: "Request timed out. [Retry]" |

ANiML-specific: Show 30s timeout explicitly: "Loading may take up to 30 seconds for large queries."

**6. Error States:**

| Error Type | Pattern |
|------------|---------|
| Content load failed | Inline in region + "Retry" button |
| Action failed | Toast with "Try Again" |
| Timeout | Inline: "Request timed out. The server may be busy. [Retry]" |
| Partial failure | Show loaded content, inline error for failed portion |

**Design Principles Applied:**
- **Nielsen #1 (Visibility of system status):** Dynamic ETA, progress bars, and escapable loading
- **Nielsen #3 (User control and freedom):** Cancel/dismiss loading at any time
- **Nielsen #4 (Consistency):** Same patterns across all data sources
- **Norman (Feedback):** Continuous feedback throughout loading process
- **Gestalt (Continuity):** Skeleton shapes match final content layout

**Implementation:** See `DESIGN-SYSTEM/design-system.md` → "Loading State Patterns"

---

### DFT-019: Edit Filters Button Navigation Behavior

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Per DFT-003b, when a pinned layer is expanded in the widget (top-left), the "Edit Filters" button is visible. Clicking it navigates to the right sidebar (opposite side of screen).

This is the same "eye-tracking concern" noted in DFT-003 — user's attention is on the left widget, but action happens on the right.

**Questions to Resolve:**
1. Does the sidebar *open/animate* to draw attention? Or is it already open?
2. Does the expanded widget panel collapse when Edit Filters is clicked?
3. Should the button label be "Edit Filters" or "Go to Filters →" (implies navigation)?
4. Should clicking Edit Filters scroll the right sidebar into view if it's below the fold?

**Options:**
1. **Auto-collapse widget panel** — user's attention naturally moves to sidebar
2. **Keep both open** — user can reference widget while editing in sidebar
3. **Rename button** — "Go to Filters →" sets expectation of navigation, not in-place editing
4. **Add visual feedback** — sidebar highlights/pulses when Edit Filters is clicked

**Discussion:**
- Feb 3-4, 2026: Analyzed using Nielsen's Heuristics (visibility of system status, recognition over recall), Norman's feedback principle, Gestalt continuity, and Fitts's Law
- Auto-collapse (Option 1) rejected: increases cognitive load (user loses reference to filter state while editing)
- Key insight: **Separation of Concerns** — widget is responsible for visibility/stacking order; right sidebar is responsible for deep editing (filters, queries, browsing). The "Edit Filters →" button is a **navigation affordance**, not an editing tool.
- Researched animation best practices (UX Collective, Material Design): crossfade at 150-200ms is standard for tab transitions

**Resolution:** Feb 4, 2026 — **Combination: Navigation labeling + visual feedback**

**Design Decisions:**

1. **Button label:** "Edit Filters →" (with arrow indicating navigation)
   - Arrow (→) is a signifier that implies "go somewhere"
   - Sets expectation that view will shift to right sidebar

2. **Button placement:** Right-aligned within the expanded widget panel
   - Reduces perceived distance to destination (Fitts's Law)
   - Arrow points toward where attention will go

3. **Widget panel:** Remains expanded
   - User can reference current filter state while editing in sidebar
   - Supports recognition over recall (Nielsen #6)

4. **Right sidebar transitions:**
   - **Tab switching (global):** Crossfade animation (~150-200ms) when changing tabs
   - **Highlight (conditional):** If already on the correct tab (Browse), filter section receives ~200-300ms highlight animation
   - This applies globally to all tab changes in the right sidebar for a professional feel

5. **Scroll behavior:** If filter section not visible, scroll into view + highlight

**Separation of Concerns Rationale:**
- **Pinned Layers Widget responsibilities:** 
  - Managing layer visibility on the map (👁 toggle)
  - Managing stacking order (drag-and-drop reorder)
  - Showing pinned status and filter indicators (status display only)
- **Right Sidebar responsibilities:**
  - Deep editing (filters, queries, browsing features)
  - Feature selection and bookmarking
  - Layer metadata and overview

Editing queries/filters is a significant enough task that it needs its own dedicated space. The widget is the "quick controls panel"; the sidebar is the "editing workspace."

**Global Animation Guideline (added):**
All tab/view transitions in the right sidebar use crossfade (~150-200ms) to feel professional and avoid jarring state changes.

**Documented in:**
- Phase 0 task 0.5 (Pinned Layers Widget) — updated with "Edit Filters →" button spec
- master-plan.md — added UX Decision for global animation pattern

**Design Principles Applied:**
- **Nielsen #1 (Visibility of system status):** Visual feedback when navigating
- **Nielsen #2 (Match between system and real world):** Arrow implies navigation
- **Nielsen #6 (Recognition over recall):** Widget stays open for reference
- **Fitts's Law:** Button placement reduces distance to destination
- **Separation of Concerns:** Widget manages visibility; sidebar manages editing

---

### DFT-020: Pointer-Row Bookmark UI (One Button vs Two)

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** High  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
DFT-003 resolved that "📌 Pin Layer" only shows when not pinned, and "🔖 Bookmark" only shows when feature selected. This eliminates side-by-side confusion.

However, the paradigm document (Part 5) shows **two** bookmark options for pointer rows:
- "Bookmark Camera" (simple — no Level 3 filter)
- "Bookmark with Filter" (includes current Level 3 query)

**Question:** Are these two buttons shown simultaneously when a feature is selected?

If so, DFT-003's claim that we "eliminated side-by-side button confusion" may not hold for the most complex use case (ANiML cameras with active image filters).

**Options:**
1. **Single button, always capture filter** — if filter is active, it's included automatically
2. **Single button, never capture filter** — user can add filter later via Edit
3. **Single button with dropdown/modal** — "Bookmark" opens choice: "Include current filter?"
4. **Two buttons** — but with much clearer labels and visual separation

**Related:** DFT-003, Paradigm Doc Part 5

**Discussion:**
- Will (Feb 4): Option 3 adds too much text to already crowded right sidebar. The "two button" problem was artificial — asking users to predict future export needs at browse time is backwards. Real user intent is almost always "save what I'm looking at."
- Will (Feb 4): Paradigm doc Part 8 already states: "Want different filter? Bookmark again." This supports Option 1 — multiple bookmarks = multiple views of same feature.
- Will (Feb 4): Applied Hick's Law, Norman's Feedback/Affordances, Nielsen heuristics (User Control, Recognition over Recall), IA progressive disclosure. Single button with auto-capture minimizes decisions at bookmark time; "Edit Filter" on bookmark widget handles corrections.

**Resolution:** Feb 4, 2026 — **Option 1: Single button, always capture filter**

**Design Decisions:**

1. **Single "🔖 Bookmark" button** for all pointer-row features (ANiML cameras, Dendra sensors, DataOne datasets)
2. **Auto-capture current Level 3 filter** if active; saves feature-only if no filter applied
3. **Multiple bookmarks allowed** of same feature — each with different filter = different "view"
4. **"Edit Filter" action** on bookmark widget allows post-save correction of Level 3 query
5. **Feedback shows context:** Toast/animation displays "Bookmarked: CAM-042 → Mountain Lions 2023" (or similar)
6. **Bookmark widget display:**
   - Bookmarks with filters show: `📷 CAM-042 → Mountain Lions 2023` (47 images • [View] [Edit Filter] [✕])
   - Bookmarks without filters show: `📷 CAM-015` (All images • [View] [✕])
   - "Edit Filter" action only appears for pointer-row bookmarks (self-contained rows like iNaturalist show [View] [✕] only)

**Rationale:**
- **Eliminates premature decision** — no "do I want the filter?" choice at bookmark time (Hick's Law)
- **Aligns with paradigm doc Part 8** — "Want different filter? Bookmark again"
- **Minimizes right sidebar UI complexity** — single word button vs. dropdown/multiple buttons
- **"Save what I see" mental model** — intuitive, matches user expectation
- **Error recovery exists** — "Edit Filter" handles corrections without friction
- **Applies consistently** to ANiML, Dendra, DataOne pointer rows

**Documented in:**
- Phase 0 task 0.6 (Bookmarked Features Widget) — updated with single button behavior
- Phase 2 (ANiML) — updated Browse tab bookmark button spec
- Phase 3 (Dendra) — noted for sensor bookmark implementation
- Phase 4 (DataOne) — noted for dataset bookmark implementation
- master-plan.md — added UX Decision for pointer-row bookmark pattern

**✅ Verification Checklist:**
- [x] ASCII diagrams in `IMPLEMENTATION/phases/phase-0-foundation.md` task 0.6 match decision (bookmark widget)
- [x] Phase 2, 3, 4 documents note single button pattern for their respective pointer rows
- [x] Decision notes added at top of relevant task sections
- [x] Cross-phase decision added to `master-plan.md` UX Decisions table
- [x] Paradigm doc Part 5 correction noted (two buttons → single button)

---

### DFT-021: "Active" vs "Selected" Terminology Consistency

**Category:** Terminology  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
The documents use these terms interchangeably:
- "Active Layer" (widget section header)
- "Selected Layer" (acceptance criteria)
- "Active non-pinned layer" (behavior description)
- "Currently selected layer from left sidebar"

**Question:** Do these mean the same thing? If so, pick one. If not, define the distinction.

**Resolution:** Use **"Active"** terminology exclusively

**Terminology System:**
| State | Definition | Visual Indicator | Cardinality |
|-------|-----------|------------------|-------------|
| **Active** | Layer currently being inspected; displayed in right sidebar | Green border in left sidebar | ONE at a time |
| **Visible** | Rendered on map | Blue eye icon (ON) | Multiple simultaneous |
| **Pinned** | Saved to widget with filters | In widget, pin icon | Multiple simultaneous |
| **Expanded** | Pinned layer showing filter controls | Expanded panel in widget | ONE at a time |

**Key distinction:** Active ≠ Visible
- A layer can be **active but not visible** (inspecting data while map visibility OFF)
- A layer can be **visible but not active** (multiple layers on map, only one in focus)

**Rationale:**
- ✅ "Active" conveys functional working state (matches GIS mental model)
- ✅ Supports "active but hidden" scenario (visibility toggled OFF while inspecting)
- ✅ Clearer than "selected" which implies temporary UI highlight only

**Implementation Updates:**
- Code: Rename `.selected` → `.active`, `selectLayer()` → `activateLayer()`
- Docs: Replace "selected layer" → "active layer" throughout specs
- Widget: Expand eye icon hit targets (40px column) to prevent accidental activation

**Full details:** See `PLANNING/resolved-decisions/dft-021-resolution-summary.md`

**Resolution Date:** February 4, 2026

---

### DFT-022: Parent Toggle Memory Edge Case

**Category:** Edge Case  
**Status:** 🟢 Deferred  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Per DFT-013, when clicking parent eye to turn ON after all children were hidden, it "restores previously-selected child view (memory-preserving)."

**Edge case:** What if the previously-selected child is *deleted* while parent was off?

**Example:**
1. User has "mountain lion" and "deer" views
2. "mountain lion" is visible (selected)
3. User turns parent OFF (both children hidden)
4. User deletes "mountain lion" view while parent is off
5. User turns parent ON
6. What happens?

**Options:**
1. **Show first remaining child** — "deer" becomes visible
2. **Show nothing** — parent stays off, user must manually select
3. **Show unfiltered base** — if base layer still exists
4. **Demote to flat** — if only one child remains, demote layer to non-nested state

**Discussion:**
This is a runtime state management question best solved during implementation. The edge case is low-frequency and any reasonable fallback behavior (show first remaining child, show nothing, etc.) will work acceptably. Implementation can refine based on actual state management architecture and user testing feedback.

**Resolution:** Feb 4, 2026 — **Deferred to Implementation**

**Recommended Fallback Hierarchy (for implementation reference):**
- IF previousChild exists → restore it
- ELSE IF otherChildren.length > 0 → show first remaining child
- ELSE → parent stays off (no children to show)

**Rationale:**
- **Norman (Feedback & Conceptual Models):** Showing first remaining child preserves user intent ("I want to see this layer")
- **Nielsen (Error Prevention):** Prevents confusing state where parent eye is ON but nothing renders
- **Cognitive Load:** Not worth holding mental space during design phase; can be refined during development

---

### DFT-023: Widget Positioning Dimensions

**Category:** Visual Spec  
**Status:** 🟢 Deferred  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Current spec says widgets are positioned "top-left" and "top-right" of map area.

**Missing details:**
- Exact pixel offset from edges (16px? 24px? 32px?)
- Maximum widget height before scrolling
- Collapse button position (in header? left or right?)
- Animation easing for expand/collapse transitions
- Widget shadow/elevation values

**Options:**
1. **Specify now** — add values to design system doc (e.g., 24px from edges, max-height 400px)
2. **Let mockup define** — Opus 4.5 proposes values, team approves
3. **Reference existing pattern** — "use same spacing as ArcGIS/Esri widgets"

**Discussion:**
- Feb 4, 2026: Analyzed using design principles (Cognitive Load, Visual Fundamentals, Consistency)
- Exact pixel values are implementation details that don't affect conceptual decisions
- Animation timing already established in DFT-019 (150-200ms transitions)
- Better to let mockup propose values within constraints, approve visually

**Resolution:** Feb 4, 2026 — **Deferred to Mockup/Implementation Phase with Constraints**

**Constraints for Mockup/Implementation:**
- **Spacing:** Must use 8px grid increments (16px, 24px, 32px, etc.)
- **Reference:** Use ArcGIS/Esri widget spacing conventions (typically 16-24px from map edges)
- **Max height:** Adaptive logic (show ~6 items before scrolling, not hardcoded pixels)
- **Collapse button:** Left side of widget header (before title) for keyboard accessibility
- **Animation:** Use DFT-019 standards (150-200ms crossfade for expand/collapse, consistent with global tab transitions)
- **Shadow/elevation:** Defer to design system or ArcGIS reference standards

**Rationale:**
Exact pixel values are implementation details that don't affect conceptual decisions. Mockup generator can propose values within grid constraints; team can approve visually rather than numerically. Focus remains on higher-priority open decisions (error states, filter indicators, interaction patterns).

---

### DFT-024: Filter Indicator A/B Test Decision

**Category:** Visual Design  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 4, 2026

**Context:**
Per DFT-001, A/B testing was planned between:
- **Option A (Text):** "• 5 filters" on second line
- **Option B (Icon):** Filter icon + count inline (e.g., `[🔍5]`)

**Problem for mockups:** Mockup generator needs to pick one approach. Two-line text takes more vertical space but is more explicit; inline icon is compact but requires learning.

**Decision:** **Option B — Icon-based filter indicator**

**Rationale:**

Analysis across 9 design principle frameworks (Gestalt, Norman, Nielsen, Cognitive Laws, Visual Fundamentals, Accessibility, IA, Behavioral) revealed:

1. **Density matters** — Widget has limited vertical space; consistent single-line rows improve scannability when users have 4-6+ pinned layers
2. **Filter icon is convention** — Target users (researchers, data scientists) likely recognize filter funnel icon from other data tools (Excel, Airtable, Notion, ArcGIS)
3. **Progressive disclosure fit** — Compact indicator + tooltip + expanded panel aligns with summary → details pattern
4. **Better list rhythm** — Uniform row heights improve visual parsing (Gestalt: Rhythm & Continuity)
5. **Cognitive efficiency** — Single visual chunk per layer vs. two-line split (Miller's Law: 7±2 chunks)
6. **Tooltip bridges learnability gap** — Hover text "5 filters applied" satisfies Recognition over Recall for first-time users

**Implementation Spec:**

Icon approach with accessibility enhancements:
- Use **Lucide `Filter` icon** (from `lucide-react`) — standard funnel symbol
- Count displayed adjacent to icon when filters exist: `[Filter 5]`
- Muted/gray appearance when no filters applied: `[Filter]` (still clickable to add filters)
- Tooltip showing full text: "5 filters applied" (or "No filters — click to add")
- ARIA label for screen readers: `aria-label="5 filters applied. Click to edit."`
- CSS styling deferred to implementation phase

**Visual states:**
- **Has filters:** Filter icon + count in colored badge (e.g., emerald/green), clickable
- **No filters:** Muted gray filter icon only, still clickable to add filters

**Tradeoffs Accepted:**
- First-time users must learn icon meaning (mitigated by tooltip + industry convention)
- Requires explicit ARIA labeling for accessibility (standard practice)

**Discussion:**
Design principles strongly favored Option B for this use case. A/B testing deemed unnecessary given:
- Clear principle-based rationale
- Tooltip addresses primary learnability concern
- Target audience familiarity with filter icon patterns
- Space efficiency critical for multi-layer scenarios

**Resolution:** Icon-based approach adopted. Remove A/B testing toggle from Phase 0 implementation plans.

---

### DFT-025: Create New View Transition Animation

**Category:** Microinteraction  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Per DFT-003b and DFT-013, when "Create New View" is clicked on a single-view layer, the layer "promotes to nested structure."

**Question:** What does this look like? The state transformation could confuse users if not visually obvious.

**Missing:**
- Does the row animate/expand to show the new structure?
- Is there a success message or toast?
- Does the new child appear with a highlight/flash?
- Where does focus move after creation?

**Options:**
1. **Animate expansion** — row expands with slide animation, children appear below
2. **Flash/highlight** — new child row flashes briefly to draw attention
3. **Toast notification** — "New view created" message
4. **Combination** — animate + highlight, no toast (less intrusive)

**Discussion:**
*Low priority but affects polish*

**Resolution:** *Pending*

---

### DFT-026: Emoji/Icon Vocabulary Consistency

**Category:** Design System  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 3, 2026

**Context:**
Current emoji/icon vocabulary:
- 🌪️ for filter indicator (funnel/tornado)
- 📌 for pin
- 🔖 for bookmark
- 👁 for visibility
- ✕ for remove
- 🛒 for Export All (shopping cart)
- 📦 for export (in paradigm doc action vocabulary)

**Question:** The "Export All" button uses 🛒 (shopping cart), but the action vocabulary in Part 4 of paradigm doc shows 📦 (export). Should these match?

**Resolution:**
**No emojis policy established** — All emojis must be replaced with SVG icons. This resolves the vocabulary consistency question by removing emojis entirely.

**Decision:**
- Use SVG icons from `src/components/icons/` or Lucide React
- For shopping cart/export: Use Lucide's `ShoppingCart` icon or similar SVG
- For pin: Use Lucide's `Pin` icon or similar SVG
- For bookmark: Use Lucide's `Bookmark` icon or similar SVG
- For visibility: Use Lucide's `Eye` icon or similar SVG
- For filter: Use Lucide's `Filter` icon or similar SVG
- For remove/close: Use Lucide's `X` icon or similar SVG

**Documented in:**
- `docs/DESIGN-SYSTEM/design-system.md` — Icon Policy section
- `.cursor/rules/no-emojis-use-svg-icons.md` — Cursor rule for enforcement
- `docs/master-plan.md` — Cross-Phase Decisions → Styling Decisions

**Implementation Notes:**
- All existing emoji usage should be replaced with SVG icons during implementation
- Check `src/components/icons/` and `src/utils/dataSourceIcons.tsx` for existing icon patterns
- When adding new icons, search for appropriate SVG icons from Lucide React or other reputable sources

---

### DFT-027: "Browse Features →" Button Destination

**Category:** Terminology  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
Per DFT-006, the Overview tab includes a prominent "Browse Features →" button.

**Question:** This button navigates to the Browse tab, correct? The "→" arrow suggests navigation.

**Confirmation needed:**
- Button navigates to Browse tab (not a modal, not external link)
- Button label is exactly "Browse Features →" or should it be "Browse Features" (no arrow)?
- Should the button have an icon (e.g., grid icon for features)?

**Options:**
1. **"Browse Features →"** — arrow indicates navigation within sidebar
2. **"Browse Features"** — simpler, no arrow
3. **"View Features →"** — alternative verb
4. **Icon button** — grid/list icon with "Browse" label

**Discussion:**
*Quick confirmation needed*

**Resolution:** *Pending*

---

### DFT-028: Zero-Result Camera Behavior

**Category:** UI/UX  
**Status:** 🟡 Open  
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

**Discussion:**
*Needs decision — affects ANiML visualization*

**Resolution:** *Pending*

---

### DFT-029: Unfiltered Layer Badge Behavior

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026 (extracted from DFT-012 edge cases)

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
*Needs decision — affects ANiML default state*

**Resolution:** *Pending*

---

### DFT-030: Error State Design

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** High  
**Source:** UX Design Review, Feb 3, 2026

**Context:**
No design specification for error handling:
- API request fails (network error, timeout, 500 error)
- Partial data load failure (some cameras load, others fail)
- Authentication/permission errors
- Rate limiting errors

**Why this matters (Nielsen: Help users recognize, diagnose, recover from errors):**
Errors are inevitable. Users need clear feedback about what went wrong and how to recover.

**Questions to Resolve:**
1. Where do error messages appear? (Toast? Inline? Modal?)
2. Should errors include retry buttons?
3. How long do error toasts persist?
4. What's the error message tone? (Technical? Friendly?)
5. Should errors be logged for debugging?

**Options:**
1. **Toast notifications** — non-blocking, auto-dismiss after 5-10 seconds
2. **Inline errors** — appear in the component that failed (e.g., "Failed to load cameras")
3. **Error modal** — for critical errors that prevent app function
4. **Combination** — inline for component errors, toast for background errors

**Discussion:**
*High priority — affects user trust and recovery*

**Resolution:** *Pending*

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

