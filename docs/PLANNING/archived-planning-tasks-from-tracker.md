# Archived Planning Tasks from Tracker

**Purpose:** This document contains the full text and resolution details for completed planning tasks (DFT-001 through DFT-027) that have been archived from `planning-task-tracker.md` to keep the tracker manageable.

**Archive Date:** February 4, 2026

**Note:** These tasks are resolved and their full descriptions are preserved here for historical reference. The Quick Reference table in `planning-task-tracker.md` still shows these tasks with their summaries, but full details are archived here.

---

## DFT-001: Pin vs. Toggle Visibility Behavior

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

## DFT-002: Export Button Placement/Visibility

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

## DFT-003: "Pin with Filter" vs "Bookmark" Labeling (ANiML)

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

## DFT-003b: "Create New View" Action Placement

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

## DFT-003c: ANiML Browse Entry Point (Tabs vs Landing Cards)

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

## DFT-004: Two Query Locations — Contextual Clarity

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
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 4, 2026

**Context:**
Per DFT-003b and DFT-013, when "Create New View" is clicked on a single-view layer, the layer "promotes to nested structure."

**Question:** What does this look like? The state transformation could confuse users if not visually obvious.

**Missing:**
- Does the row animate/expand to show the new structure?
- Is there a success message or toast?
- Does the new child appear with a highlight/flash?
- Where does focus move after creation?

**Options Considered:**
1. **Animate expansion** — row expands with slide animation, children appear below
2. **Flash/highlight** — new child row flashes briefly to draw attention
3. **Toast notification** — "New view created" message
4. **Combination** — animate + highlight, no toast (less intrusive)

**Discussion:**
- Will (Feb 4): Analyzed using all 9 design principle frameworks (Motion, Norman, Nielsen, Gestalt, Cognitive Science, Accessibility, Behavioral Science, Info Architecture, Visual Fundamentals)
- Key tension: Visibility vs. Minimalism for low-priority microinteraction
- Toast rejected: adds clutter for local widget change (user's attention already on widget)
- No animation rejected: fails Norman's feedback principle; users may be confused about what happened
- Inline transformation recommended: sequential staging shows continuity, brief highlight draws attention to new child

**Resolution:** Feb 4, 2026 — **Inline transformation with sequential staging**

**Animation Sequence (250-300ms total):**

1. **Button Click (0ms)**
   - Button press state (immediate visual feedback)

2. **Row Expansion (0-150ms)**
   - Original row expands vertically with `ease-out`
   - Background shifts to parent styling (subtle background color/border)
   - Text becomes bold (parent treatment)
   - Chevron (▼) appears next to parent name

3. **Children Appear (150-250ms)**
   - Two child rows slide/fade in below parent
   - Both indented with subtle connecting line
   - Original child has eye ON, new child has eye OFF
   - New child has temporary highlight (300-500ms flash, `bg-green-100` fading to normal)

4. **Settle (250-300ms)**
   - Highlight fades on new child
   - Focus moves to new child row
   - Screen reader announces: "New view created. [LayerName] now has 2 views."

**Visual Specifications:**

**Parent Row:**
- Background: `bg-slate-50` or subtle left border (`border-l-4 border-blue-500`)
- Text: `font-semibold` (slightly bolder than children)
- Chevron: `▼` indicating expand/collapse capability
- Eye icon: ON if any child visible

**Child Rows:**
- Indentation: `ml-6` (24px indent)
- Background: Slightly lighter than parent
- Eye icons: Only ONE can be ON (mutual exclusivity per DFT-013)
- New child highlight: `bg-green-100` fading to normal over 300-500ms

**Accessibility:**
- Respects `prefers-reduced-motion` media query
- If reduced motion: instant state change + brief highlight only (no sliding/expanding)
- Focus moves to new child row after creation
- ARIA live region (polite) announces structure change
- Screen reader: "New view created. {LayerName} now has {count} views. {FirstChild} is active. {NewChild} is inactive. Focus on {NewChild} row."

**Rationale (Design Principles Applied):**
- **Motion Principles (Continuity):** Sequential staging shows transformation, not abrupt replacement. Original row flows into parent structure.
- **Norman's Feedback:** Immediate visual response to button click. Transformation provides clear confirmation action succeeded.
- **Nielsen's Minimalism:** No toast notification (change is local; user's attention already on widget). Inline transformation doesn't require dismissal.
- **Gestalt (Common Region, Continuity):** Parent container visually encloses children. Vertical flow follows natural reading direction.
- **Cognitive Science (Peak-End Rule, Von Restorff):** New child briefly highlighted to create memorable peak moment. Clear ending state after animation settles.
- **Accessibility (WCAG):** Reduced motion variant, screen reader support, focus management, sufficient contrast.
- **Behavioral Science (Loss Aversion):** Animation shows continuity — original view becomes first child (not lost), addressing "Did my view disappear?" concern.

**Edge Cases:**
- **Focus management:** After creation, keyboard focus moves to new child row. Users can immediately press Enter to activate or arrow keys to navigate.
- **Rapid repeated clicks:** Debounce "Create New View" button to prevent animation stacking.
- **Layout shift:** Animation should not cause janky scrolling or layout reflow.

**Documented in:**
- Phase 0 task 0.5 — Pinned Layers floating widget acceptance criteria updated with animation spec
- Master plan — Cross-phase UX decision added for animation timing standards
- DFT-019 resolution — Cross-reference for global animation pattern (~150-200ms for tab transitions)

**✅ Verification Checklist:**
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 0 task 0.5 updated with animation acceptance criteria
- [x] Master plan updated with cross-phase UX decision
- [x] Quick Reference table updated with resolved status

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
**Status:** 🟢 Resolved  
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
- Will (Feb 4): Analyzed through UI/UX design principles framework
- Arrow provides redundant signification (Norman), directional cueing (Gestalt), aligns with navigation conventions (Nielsen)
- "Browse" matches domain terminology (GIS researchers familiar with term)
- Primary button styling establishes visual hierarchy
- Full-width button maximizes Fitts's Law (large target)
- Bottom placement leverages Serial Position Effect (recency)
- Reaffirmed DFT-006 decision: Always open Overview tab first (consistency > context-specific optimization)

**Resolution:** Feb 4, 2026 — **"Browse Features →" button with specified design**

**Design Specification:**
1. **Label:** "Browse Features →"
   - Arrow inline with text (Unicode U+2192 `→` or SVG arrow icon)
   - "Browse" verb aligns with data catalog conventions
   - "Features" noun matches GIS terminology (per DFT-010)
2. **Behavior:** Navigates to Browse tab in right sidebar (not modal, not external link)
3. **Style:** Primary button
   - Full-width within sidebar content area
   - TNC green background (`#2e7d32`), white text
   - Minimum 44px height (accessibility/Fitts's Law)
4. **Placement:** Bottom of Overview tab content (after layer metadata)
   - If Overview content is minimal (<3 sentences), consider top placement
5. **Interaction States:**
   - **Hover:** Slight color shift + subtle scale (1.02x)
   - **Focus:** 2px outline for keyboard navigation
   - **Transition:** 150-200ms ease-out tab switch (per DFT-025)
6. **Accessibility:**
   - Semantic `<button>` element
   - 4.5:1 contrast ratio (white on TNC green)
   - Keyboard navigable (tab order: content → button → tabs)

**Rationale:**
- **Arrow (→):** Provides redundant signification (good for accessibility), clear directional cue
- **Primary styling:** Establishes this as main action on Overview tab (Von Restorff Effect)
- **Full-width:** Maximizes click target size, feels like natural conclusion to Overview section
- **Bottom placement:** Leverages recency effect, creates reading flow (context → action)
- **Consistency:** Reaffirms always-Overview-first pattern (DFT-006) — consistency reduces cognitive load vs. context-dependent behavior

**Future Consideration (v2.1+):**
- Track analytics: Do users always immediately click "Browse Features →"?
- If yes, consider per-user preference or per-layer "last tab" memory
- But don't optimize prematurely

**Documented in:**
- Phase 0 tasks (0.1, 0.2, etc.): Update acceptance criteria with button spec

---

