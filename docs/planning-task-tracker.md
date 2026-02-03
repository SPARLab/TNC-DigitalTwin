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

**Last Updated:** February 3, 2026 (DFT-013 resolved)

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

