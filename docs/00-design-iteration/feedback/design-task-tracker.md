# Design Feedback & Issue Tracker

**Purpose:** Track UI/UX feedback, design decisions, and implementation concerns as discrete issues. This document serves as a staging area before development plans are finalized.

**How to use this doc:**
1. New feedback gets logged as a numbered issue
2. Discuss/iterate in the issue's "Discussion" section
3. Mark resolved once a decision is made
4. Resolved issues feed into development plans
5. **When resolving an issue:** Update `master-development-plan.md` and relevant phase documents with the decision

**For AI Agents:** When you mark a feedback item as resolved with a decision/outcome:
- Document the decision in the issue's "Resolution" section
- Update `docs/development_plans/master-development-plan.md` if it affects cross-phase decisions
- Update relevant phase documents in `docs/development_plans/phases/` if it affects specific implementation
- Add an entry to "Cross-Phase Decisions" in master plan if the decision impacts multiple phases

**Last Updated:** January 26, 2026

---

## Quick Reference

| ID | Summary | Category | Status | Priority |
|----|---------|----------|--------|----------|
| DFT-001 | Should clicking the eyeball icon auto-pin a layer, or should pin be a separate explicit action? | UI/UX | 🟢 Resolved | Medium |
| DFT-002 | "Export Bookmarks" button placement made it unclear that pinned layers are also exportable | UI/UX | 🟡 Open | Medium |
| DFT-003 | In ANiML browse view, the "Pin with Filter" vs "Bookmark" buttons are confusing—unclear what each does | UI/UX | 🟡 Open | High |
| DFT-004 | Two filter locations (layer-level and feature-level) appear simultaneously—need clearer visual hierarchy | UI/UX | 🟡 Open | High |
| DFT-005 | Floating widgets crowd the screen when viewing time-series data; consider auto-collapse behavior | UI/UX | 🟡 Open | Low |
| DFT-006 | When a layer is selected, which tab opens first in the right sidebar—Overview or Browse? | UI/UX | 🟡 Open | Low |
| DFT-007 | Bookmark widget title should clarify that bookmarks are features within layers, not separate items | UI/UX | 🟡 Open | Medium |
| DFT-008 | TNC provided brand colors (Parrot Green, Leaf Green, Benthic Blue) for optional integration | Styling | 🟡 Open | Low |
| DFT-009 | TNC provided brand fonts (Barlow, Chronicle) for optional integration | Styling | 🟡 Open | Low |
| DFT-010 | Terminology: Change "items" to "features" throughout — more familiar to GIS users | UI/UX | 🟢 Resolved | High |
| DFT-011 | Target audience clarification: Researchers (GIS-minded), not broad public | Design Decision | 🟢 Resolved | Medium |
| DFT-012 | Camera trap clustering: Show numbered icons at locations, click to see filtered images | Feature Request | 🟡 Open | Medium |
| DFT-013 | Multiple filtered views on same layer — save mountain lion AND deer queries simultaneously | Paradigm Extension | 🟡 Open | High |
| DFT-014 | Biodiversity/aggregation queries: Species counts and proportions per camera trap | Feature Request | ⚪ Deferred | Low |

**Status Key:**
- 🟢 Resolved — Decision made, ready for dev
- 🟡 Open — Needs discussion/decision
- 🔵 In Discussion — Actively being debated
- ⚪ Deferred — Pushed to future version
- ✅ Implemented — Built and shipped

---

---

## Discussion Items

| ID | Summary | Discuss With | Resolution Status |
|----|---------|--------------|-------------------|
| DFT-001 | Should clicking the eyeball icon auto-pin a layer, or should pin be a separate explicit action? | Amy, Trisalyn | ✅ Resolved - Jan 27 |
| DFT-002 | "Export Bookmarks" button placement made it unclear that pinned layers are also exportable | Amy, Trisalyn | 🟡 Pending |
| DFT-003 | In ANiML browse view, the "Pin with Filter" vs "Bookmark" buttons are confusing—unclear what each does | Amy, Trisalyn | ⏳ Blocked by DFT-004 |
| DFT-004 | Two filter locations (layer-level and feature-level) appear simultaneously—need clearer visual hierarchy | Amy, Trisalyn, Dan | 🟡 Pending — needs mockup iteration |
| DFT-006 | When a layer is selected, which tab opens first in the right sidebar—Overview or Browse? | Amy, Trisalyn | 🟡 Pending — Will recommends Overview |
| DFT-007 | Bookmark widget title should clarify that bookmarks are features within layers, not separate items | Amy, Trisalyn | 🟡 Pending |
| DFT-012 | Camera trap clustering: Show numbered icons at locations, click to see filtered images | Dan | 🟡 Pending — in backend brief |
| DFT-013 | Multiple filtered views on same layer — save mountain lion AND deer queries simultaneously | Dan, Amy, Trisalyn | 🟡 Pending — paradigm extension |

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
- Phase 0 task 0.5 updated with refined widget design
- Note added to Phase 0 for A/B testing filter representation

---

### DFT-002: Export Button Placement/Visibility

**Category:** UI/UX  
**Status:** 🟡 Open  
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

**Resolution:** *Pending*

---

### DFT-003: "Pin with Filter" vs "Bookmark" Labeling (ANiML)

**Category:** UI/UX  
**Status:** 🟡 Open  
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

**Resolution:** *Pending*

---

### DFT-004: Two Query Locations — Contextual Clarity

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** High  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "I am a little confused with where the primary filtering should take place, on the pop-up or the right side panel. I see two areas to filter date range, as well as two places to filter aggregation."

**Context:**
The three-level hierarchy legitimately requires two filter locations:
1. **Layer-level query:** Filter which features appear (e.g., which cameras)
2. **Feature-level query:** Filter related data for a bookmarked feature (e.g., which images from a camera)

These are different questions, but the mockups show both simultaneously without clear context.

**Options:**
1. **Breadcrumb navigation:** Show user's location in hierarchy (`Camera Traps > CAM-042 > Images`)
2. **Progressive disclosure:** Only show relevant filters based on current view level
3. **Explicit container labels:** "Filter Cameras in This Layer" vs "Filter Images for CAM-042"
4. **Visual nesting:** Indent or contain feature-level UI to show you're "inside" a feature

**Discussion:**
- Will (Jan 26): This is our trickiest implementation detail. The paradigm is sound (the data actually has two levels), but the UI must make "which level am I filtering?" obvious. File system analogy: nobody confuses filtering folders with searching within a file because the UI shows your location.

**Resolution:** *Pending*

---

### DFT-005: Widget Collapse Behavior (Screen Crowding)

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> Screen gets crowded with time series data. Maybe collapse only the pinned layers widget when editing Dendra pop-ups, so "bookmark range" action shows the bookmark widget.

**Options:**
1. Auto-collapse inactive widgets based on current task
2. User-controlled collapse (click to expand/collapse)
3. Minimize to icon bar when not in use

**Discussion:**
*None yet*

**Resolution:** *Pending*

---

### DFT-006: Tab Navigation Order on Layer Select

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Low  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "To confirm, once you add a layer to the workspace the Overview tab will be the first thing that pops up correct?"

**Current understanding:** Yes, selecting a layer opens the right sidebar with Overview tab active.

**Options:**
1. Overview first (current assumption)
2. Browse first (jump straight to features)
3. Context-dependent (depends on how user got there)

**Discussion:**
- Will (Jan 26): I think it should always be Overview first. The Overview tab can include a prominent "Browse Features" button that takes the user to the Browse tab. This gives users context about the layer before diving into data. Good candidate for quick team confirmation via email/form.

**Resolution:** *Pending — needs team confirmation*

---

### DFT-007: Bookmark Widget Labeling

**Category:** UI/UX  
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** Sophia Leiker, Jan 23, 2026

**Feedback (condensed):**
> "I almost want the title to be 'Bookmark Items within Layer' or something to identify this distinction" — to clarify that bookmarks are features nested under layers.

**Options:**
1. "Bookmarked Features"
2. "Bookmarked Items (from Layers)"
3. "Saved Features"
4. Keep "Bookmarks" but add subtitle/help text

**Discussion:**
*None yet*

**Resolution:** *Pending*

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
**Status:** 🟡 Open  
**Priority:** Medium  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> When filtering for a species (e.g., mountain lions), show camera trap locations as clustered icons with numbers — "like the bike Maps icons where you have a number." The 127 mountain lion images should be distributed across 10-20 camera locations. Clicking a numbered icon shows a list of pictures.

**Example Workflow:**
1. User filters ANiML layer for "mountain lion"
2. Map shows ~15 camera trap icons, each with a number (e.g., "23")
3. The number represents mountain lion images at that trap
4. Click icon → see list/gallery of those 23 images

**Notes:**
- Similar to bike crash map clustering pattern
- Aggregation at camera level, not individual images on map
- Informs how we handle ANiML browse view

**Discussion:**
- Will (Jan 26): This is a significant UX improvement over showing individual image markers. May require rethinking ANiML visualization layer.

**Resolution:** *Pending — scope for future iteration*

---

### DFT-013: Multiple Filtered Views on Same Layer (PARADIGM)

**Category:** Paradigm Extension  
**Status:** 🟡 Open  
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

**Resolution:** *Pending — paradigm extension, needs design iteration*

---

### DFT-014: Biodiversity/Aggregation Queries

**Category:** Feature Request  
**Status:** ⚪ Deferred  
**Priority:** Low  
**Source:** Trisalyn Nelson, Jan 26, 2026

**Feedback (condensed):**
> Want to analyze diversity of species per camera trap location:
> - "Are there some where almost all the species are mountain lions?"
> - Unique species count per camera
> - Pie chart symbols showing proportion of each species

**Potential Visualizations:**
1. Simple count badge: "5 species" on each camera icon
2. Proportional pie chart at each location (like bike map hazard breakdown)
3. Heat map of biodiversity index

**Notes:**
- Trisalyn acknowledged this may be "too in the weeds" for current scope
- Useful for informing long-term paradigm (query capabilities)
- Related to DFT-012 (clustering) and DFT-013 (multiple queries)

**Discussion:**
- Will (Jan 26): Deferred to future version, but valuable for understanding researcher workflows. Informs what aggregation/visualization capabilities we should architect for.

**Resolution:** *Deferred — future scope, v2+*

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

