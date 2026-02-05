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

**Last Updated:** February 5, 2026 (Added DFT-038 through DFT-040: filter design system)

**Next Steps:**
- [ ] **BEFORE MOCKUPS (DFT-037):** Resolve all design discussion tasks (DFT-015 through DFT-040)
  - **High priority:** ~~DFT-018 (loading states)~~, ~~DFT-020 (pointer-row bookmark UI)~~, ~~DFT-030 (error states)~~, DFT-038 (filter anatomy), DFT-039 (filter apply behavior)
  - **Medium priority:** ~~DFT-019 (Edit Filters navigation)~~, ~~DFT-024 (Filter indicator)~~, ~~DFT-028~~, ~~DFT-029~~, ~~DFT-031~~, ~~DFT-032~~, ~~DFT-035~~, DFT-040 (dual-level distinction)
  - **Low priority:** DFT-036 (bookmark hover highlight) — can defer to Phase 6 if not blocking mockup generation
- [x] **Archive completed:** Archived DFT-001 through DFT-027 to `PLANNING/archived-planning-tasks-from-tracker.md` (Feb 4, 2026)

---

## Quick Reference

**Note:** Tasks DFT-001 through DFT-032 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. The summaries below are kept for quick reference.

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
| DFT-036 | Feature highlight on map when hovering bookmark row | UI/UX | 🟡 Open | Low |
| DFT-037 | Generate updated mockups reflecting all resolved design decisions (DFT-001 through DFT-040) | Task | 🟡 Open | High |
| DFT-038 | Filter section anatomy — shared structural template for Browse tab filter UI across all data sources | Design System | 🟡 Open | High |
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
| DFT-036 | Feature highlight on bookmark hover | Will | 🟡 Pending |
| DFT-037 | Generate updated mockups after design decisions resolved | Will | 🟡 Pending |
| DFT-038 | Filter section anatomy — shared structural template | Will | 🟡 Pending |
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

**Archived Tasks:** Tasks DFT-001 through DFT-032 have been archived. Full descriptions, discussions, resolutions, and design decisions are preserved in `PLANNING/archived-planning-tasks-from-tracker.md`. Summaries remain in the Quick Reference table above.

---

### DFT-033: Right Sidebar Width and Resizability

**Category:** Layout  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 5, 2026

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
Analyzed through all 9 UI/UX frameworks (Gestalt, Norman, Nielsen, Shneiderman, Cognitive Laws, Visual Fundamentals, Accessibility, Behavioral Science, Information Architecture).

**Resolution:** **Fixed width at 400px (not resizable)**

**Decision Rationale:**

**Core Principle:** The user's job is to analyze conservation data, not configure the interface.

**Key Findings from Framework Analysis:**

1. **Cognitive Load (Hick's Law):** Resizability adds micro-decisions that distract from primary task. Every UI adjustment forces users to ask "Is this too wide? Should I adjust it?" — cognitive overhead with no clear user need.

2. **Consistency & Spatial Memory (Nielsen #4):** Fixed width creates predictable spatial memory. Users know "where" content appears and "how much" map they'll lose when sidebar opens. Resizable introduces session-to-session variability.

3. **Simplicity Serves Task (Aesthetic Minimalism):** No evidence in user feedback that researchers want to fiddle with sidebar width. Resizable handles add visual noise and implementation complexity for questionable UX value.

4. **GIS Convention Alignment (Mental Models):** ArcGIS Online and QGIS use fixed sidebars. Matching this convention reduces learning curve for target audience (GIS-minded researchers).

5. **Accessibility (WCAG - Operable):** Resizable sidebars require precise mouse control (dragging edges), harder for motor impairments. Fixed width = keyboard-friendly.

6. **Engineering Efficiency:** Fixed width means content can be designed for a specific grid (e.g., 4-column image grid at 400px). Resizable requires responsive breakpoints for every Browse view, adding complexity without user value.

**Why 400px:**
- Wide enough for 4-column image grids (ANiML)
- Wide enough for readable time-series charts (Dendra)
- Wide enough for metadata without excessive line wrapping (iNaturalist)
- Narrow enough to leave 60%+ of screen for map (at 1440px mockup width)
- Matches established GIS UI patterns

**Handling Edge Cases:**
If specific content genuinely needs more space (e.g., Dendra chart), add **"Expand Chart"** button that pops out into modal/overlay. This gives flexibility without introducing persistent UI configuration burden.

**Optional Enhancement (Not Required for v2.0):**
Consider a **collapse toggle** (hide sidebar entirely, maximize map) as a binary state (open/closed), not continuous adjustment. Simpler to implement, no drag handles, clear affordance.

**Documented in:**
- `docs/planning-task-tracker.md` (this file)
- `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Analysis completed through 9 UI/UX frameworks
- [x] Decision documented in planning-task-tracker.md
- [x] Master plan updated with cross-phase UX decision
- [x] Phase documents reviewed (affects all right sidebar implementations across phases)
- [x] Mockup implications noted (400px width to be used in mockup generation)

---

### DFT-034: Drag-and-Drop Reorder Feedback

**Category:** Microinteraction  
**Status:** 🟢 Resolved  
**Priority:** Low  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 5, 2026

**Context:**
Per Phase 0, pinned layers have drag handles for reordering. Reordering affects map layer z-order (stacking order), which is critical for GIS workflows—researchers need points visible over polygons, or specific datasets prioritized for visual analysis.

**Current mockup implementation** (`02a-unified-layout.html`):
- Drag handle (`⋮⋮`) with `grab` cursor on hover
- `.dragging` state: 50% opacity, 98% scale, elevated shadow
- Drop target: 2px blue line at top/bottom edge based on cursor position
- Drop zones calculated by card midpoint

**Questions Resolved:**
1. ✅ Cursor: `grab` on hover, `grabbing` during drag
2. ✅ Dragged row: Enhanced visual lift with opacity, scale, rotation
3. ✅ Drop target: 4px blue line + subtle background highlight
4. ✅ Drop animation: 400ms settle animation with green highlight
5. ✅ Map z-order: Yes, widget order = map rendering order; toast notification educates users

**Resolution:** **Enhanced Lifted Row + Drop Line + Settle Animation**

### Design Specification

#### 1. Drag Handle & Cursor
- **Icon:** `⋮⋮` (6 dots in 2 columns, Lucide `GripVertical`)
- **Hover:** `cursor: grab`, color shift from `#94a3b8` to `#64748b`
- **Active drag:** `cursor: grabbing`
- **ARIA:** `aria-label="Drag to reorder layer. Use arrow keys to move up or down."`

#### 2. Dragged Row Visual Treatment (Enhanced)

```css
.widget-layer-card.dragging {
  opacity: 0.6;                               /* Increased from 0.5 */
  transform: scale(0.95) rotate(2deg);        /* More noticeable + tilt */
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.3);  /* Stronger elevation */
  cursor: grabbing;
  border: 2px dashed #3b82f6;                 /* Dashed = "in motion" */
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.dragging {
    transform: scale(0.95);  /* No rotation */
  }
}
```

**Rationale:**
- 95% scale (not 98%) for clearer lift (Gestalt Figure-Ground)
- 2deg rotation adds dynamism, mimics physical paper
- Dashed border adds texture, signals temporary state
- Respects `prefers-reduced-motion` (no rotation if enabled)

#### 3. Drop Target Indicator (Refined)

```css
.widget-layer-card.drag-over {
  border-top: 4px solid #3b82f6;              /* Increased from 2px */
  margin-top: -4px;
  background-color: rgba(59, 130, 246, 0.05); /* Subtle highlight */
}

.widget-layer-card.drag-over-bottom {
  border-bottom: 4px solid #3b82f6;
  margin-bottom: -4px;
  background-color: rgba(59, 130, 246, 0.05);
}
```

**Rationale:**
- 4px line meets WCAG contrast requirements (Perceivable)
- Background highlight double-encodes drop zone (Gestalt redundancy)
- Margin offset prevents layout shift

#### 4. Drop Animation (New)

```javascript
function handleDrop(e) {
  // ... existing reorder logic ...
  
  // After state.pinnedLayers updated:
  const droppedCard = document.querySelector(`[data-layer-id="${draggedLayerId}"]`);
  
  // Brief highlight on dropped card
  droppedCard.classList.add('just-dropped');
  setTimeout(() => droppedCard.classList.remove('just-dropped'), 500);
  
  // Update map z-order with animation
  updateMapLayerOrder(state.pinnedLayers, { animate: true });
}
```

```css
.widget-layer-card.just-dropped {
  animation: settle 400ms ease-out;
  background-color: #dcfce7;  /* Green = success */
}

@keyframes settle {
  0% { transform: scale(1.02); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.just-dropped {
    animation: none;
    background-color: #dcfce7;
  }
}
```

**Rationale:**
- 400ms aligns with DFT-031 undo button pulse (consistency)
- Green highlight = positive closure (Peak-End Rule)
- Subtle bounce mimics physical settling
- Respects `prefers-reduced-motion`

#### 5. Map Z-Order Feedback

**Approach:** Toast notification (non-intrusive, educational)

```javascript
function updateMapLayerOrder(layerIds, { animate = false }) {
  // Update ArcGIS map layer order...
  
  // Show brief toast
  showToast({
    message: "Map layer order updated",
    duration: 2000,           // Brief, auto-dismiss
    position: "bottom-center" // Near map
  });
}
```

**Rationale:**
- Educates users that widget order = map rendering order (Norman Conceptual Model)
- Non-intrusive (fades after 2s, no permanent visual noise)
- Bottom-center placement near map (Gestalt Proximity)

**Future Enhancement (v2.1+):**
- Widget subtitle: "Top layers render above bottom layers"
- Can be hidden after user reorders 3+ times

#### 6. Keyboard Support (WCAG 2.1.1 Compliance)

```javascript
// When drag handle focused:
dragHandle.addEventListener('keydown', (e) => {
  const layerId = e.target.closest('[data-layer-id]').dataset.layerId;
  const index = state.pinnedLayers.indexOf(layerId);
  
  if (e.key === 'ArrowUp' && index > 0) {
    e.preventDefault();
    // Swap with previous layer
    [state.pinnedLayers[index-1], state.pinnedLayers[index]] = 
      [state.pinnedLayers[index], state.pinnedLayers[index-1]];
    
    renderPinnedLayers();
    
    // Maintain focus
    document.querySelector(`[data-layer-id="${layerId}"] .drag-handle`).focus();
    
    // Announce position change
    announceToScreenReader(
      `${layerMeta[layerId].name} moved up to position ${index} of ${state.pinnedLayers.length}`
    );
    
    updateMapLayerOrder(state.pinnedLayers);
  }
  
  if (e.key === 'ArrowDown' && index < state.pinnedLayers.length - 1) {
    // Similar logic moving down
  }
  
  if (e.key === 'Home' && e.shiftKey && index !== 0) {
    e.preventDefault();
    // Move to top
    state.pinnedLayers.splice(index, 1);
    state.pinnedLayers.unshift(layerId);
    renderPinnedLayers();
    document.querySelector(`[data-layer-id="${layerId}"] .drag-handle`).focus();
    announceToScreenReader(`${layerMeta[layerId].name} moved to top`);
  }
  
  if (e.key === 'End' && e.shiftKey && index !== state.pinnedLayers.length - 1) {
    // Move to bottom (similar logic)
  }
});
```

**ARIA Live Region:**
```html
<div id="drag-announcements" role="status" aria-live="polite" class="sr-only"></div>
```

```javascript
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('drag-announcements');
  liveRegion.textContent = message;
  setTimeout(() => liveRegion.textContent = '', 1000);
}
```

**Rationale:**
- Arrow keys intuitive for vertical reordering (Mental Models)
- Shift+Home/End for quick repositioning (power user feature)
- Announces position for screen reader users (WCAG Perceivable)
- Maintains focus after reorder (Nielsen #3: User Control)
- **Keyboard support essential for v2.0** (not deferred to Phase 6)

#### 7. Edge Cases

**Rapid reorders:**
- Debounce map updates by 300ms (per DFT-025 pattern)
- Widget updates instantly, map follows with slight delay
- Prevents thrashing during rapid sequential drags

**Invalid drop (outside widget):**
- Card snaps back to origin position
- Brief shake animation (2px, 2 cycles) to signal "invalid"

**Single pinned layer:**
- Hide drag handles when only 1 layer pinned
- Nothing to reorder → reduces UI clutter (Aesthetic Minimalism)

### Summary Specification Table

| Element | Treatment | Duration | Rationale |
|---------|-----------|----------|-----------|
| **Drag Handle** | `⋮⋮` icon, `grab` cursor | — | Universal convention (Norman) |
| **Drag Start** | 60% opacity, 95% scale, 2deg rotation, dashed border, elevated shadow | — | Clear lift (Gestalt Figure-Ground) |
| **Drop Target** | 4px blue line + subtle background highlight | — | Dual encoding (Gestalt redundancy) |
| **Drop Animation** | Green highlight + subtle scale bounce | 400ms `ease-out` | Positive closure (Peak-End Rule) |
| **Map Feedback** | Toast: "Map layer order updated" | 2s auto-dismiss | Educates users (Norman Conceptual Model) |
| **Keyboard** | Arrow keys (up/down), Shift+Home/End | — | WCAG 2.1.1 compliance |
| **ARIA** | Live region announces position changes | — | Screen reader support |
| **Reduced Motion** | No rotation/bounce, instant change + highlight | — | Accessibility (WCAG) |

### Design Principles Applied

**Analyzed through 9 UI/UX frameworks:**

1. **Gestalt (Perception):** Figure-ground separation via lifted row, continuity via drop line, common fate (dragged row + cursor move together)

2. **Norman (Interaction):** Affordances (drag handle signals draggability), signifiers (cursor changes), feedback (visual state changes + toast), mappings (spatial layout matches z-order mental model)

3. **Nielsen (Usability):** Visibility of system status (#1), user control & freedom (#3), consistency & standards (#4), recognition over recall (#6)

4. **Cognitive Science:** Fitts's Law (small drag handle prevents accidental drags), feedback timing (<100ms instant, 400ms animation), Von Restorff Effect (dragged row stands out)

5. **Visual Fundamentals:** Contrast (opacity, color), hierarchy (elevated shadow), balance (scale + rotation suggests "lifted")

6. **Accessibility (WCAG):** Keyboard navigation (WCAG 2.1.1), ARIA announcements (Perceivable), 4px line contrast (Perceivable), reduced motion support

7. **Behavioral Science:** Loss aversion addressed by undo button (DFT-031), feedback loop rewards completion, perceived control via precise targeting

8. **Information Architecture:** Mental model (researchers understand layer stacking from GIS software), wayfinding (drop line shows destination)

9. **Motion & Time:** Duration (400ms aligns with DFT-025, DFT-031), easing (`ease-out` for settling), continuity (smooth transition), reduced motion respected

### Tradeoffs

**What we sacrifice:**
- Ghost placeholder pattern (more visually rich but adds complexity)
- Swap animation (adjacent rows animate aside—more tactile but increases motion complexity)
- Live z-order preview (map updates during drag—impressive but computationally expensive)
- Permanent z-order badges (position numbers—constant feedback but clutters widget)

**Why acceptable:**
- Target audience (researchers) values **efficiency over ornamentation** (DFT-011)
- Aligns with animation timing standards (DFT-025: 250-400ms, DFT-028: 300ms stagger)
- Respects **aesthetic minimalism** (Nielsen #8) while meeting **visibility** (Nielsen #1)
- Preserves **fast workflow** (no confirmation per DFT-031)

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-0-foundation.md` (Task 0.5 acceptance criteria)
- ✅ `docs/DESIGN-SYSTEM/design-system.md` (Drag-and-drop patterns)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (9 frameworks)
- [x] CSS specifications provided
- [x] JavaScript implementation patterns provided
- [x] Keyboard support specified (WCAG compliance)
- [x] ARIA patterns specified
- [x] Edge cases handled
- [x] Tradeoffs analyzed
- [x] Cross-references added

---

### DFT-035: DataOne Search Behavior

**Category:** UI/UX  
**Status:** 🟢 Resolved  
**Priority:** Medium  
**Source:** UX Design Review, Feb 3, 2026  
**Resolved:** February 5, 2026

**Context:**
DataOne has a search interface in the right sidebar Browse tab. The question: should search fire as the user types (instant), require an explicit submit (Enter/button), or use a hybrid approach?

**Key Constraints:**
- Two API calls per search: `countDatasets()` + `queryDatasets()` hit ArcGIS Feature Service
- ~12k records (latest versions, filtered to 20-mile radius)
- Text search uses `LIKE '%term%'` on `title` field only
- Four filter controls: text search, category dropdown, year range, author dropdown
- v1 implementation uses explicit submit with "pre-search" empty state
- Target audience: GIS researchers (DFT-011) at desktop workstations (DFT-016)

**Resolution:** **Debounced Instant Search + Immediate Dropdown Filters**

### Design Specification

**Text Search Input:**
- Debounce at **500ms** after last keystroke
- Fires at **2+ characters** (or 0 characters when clearing to show all)
- **Enter key bypasses debounce** and fires immediately (power user shortcut)
- No explicit "Search" button

**Dropdown/Select Controls (category, year, author):**
- Fire **immediately** on change
- Selecting from dropdown = committed action (Norman Feedback)
- Reset pagination to page 1 on any filter change

**Initial State (entering Browse tab):**
- Load all datasets immediately, sorted by `date_uploaded DESC`
- Display result count: "876 datasets within 20 miles"
- Eliminate v1 "pre-search" empty state (Shneiderman overview-first)

**Pagination:**
- Traditional Previous/Next buttons (20 per page)
- Positional awareness for researchers ("Page 3 of 44")
- "Load More" rejected — loses positional context (Wayfinding)

**Loading Feedback:**
- During debounce: subtle spinner replacing search icon (per DFT-018: 300ms+ = spinner)
- During query: inline spinner in result count area ("Loading..." replaces "Showing 47 of 876")
- Results area: show stale results with subtle opacity overlay, not blank (prevent layout shift)

**Empty Results:**
- Show "No datasets match your filters"
- Include **"Clear all filters"** link (per DFT-015 pattern)

**In-Flight Request Handling:**
- Cancel previous requests with `AbortController` when new filter state arrives
- Prevents race conditions where earlier, slower query overwrites newer one

**ARIA / Accessibility:**
- Live region announces result count changes for screen readers
- Enter key works as explicit trigger for keyboard-only users
- No rapid content swaps that trigger seizures (debounce prevents it)

### Design Rationale

**Norman (Feedback):** Every filter change immediately updates results. Dropdown selection feels like a complete action and produces visible feedback. No silent state changes.

**Nielsen #1 (System Status):** Live result count ("Showing 47 of 876") always reflects current filters. User never composes filters "blind."

**Hick's Law (Cognitive Load):** No "Search" button decision. Adjust filter = see results. One less micro-decision per filter iteration. For a 4-control interface, this compounds quickly.

**Fitts's Law:** Full-width search input recovers space from removed button. Enter key = zero-distance shortcut for power users.

**Shneiderman #7 (User Control):** Enter key gives explicit control for power users. 500ms debounce gives typing breathing room. Tradeoff: slightly less "I decide when" feeling, but acceptable for read-only, reversible search.

**Nielsen #5 (Error Prevention):** 2-char minimum prevents overly broad text queries. `AbortController` prevents race conditions.

**Mental Models (IA):** Matches ArcGIS Hub and modern data catalog conventions. Browse tab = exploration context, not formal query construction (like Web of Science).

**Wayfinding (IA):** Pagination with page numbers provides positional awareness. Result count provides scope awareness.

**Why 500ms (Not 300ms):** Each search triggers two network requests (count + query). 500ms debounce + two requests = 700-900ms total response time, still below 1-second threshold where users notice delay. Matches industry standard for debounced search when results replace in-place.

**Why Not Explicit Submit:** Three problems with v1 pattern:
1. Broken feedback loop for dropdowns (selecting category = no response until "Search" clicked)
2. Wasted vertical space on "pre-search" educational text (~200px)
3. Unnecessary friction for exploration (researchers adjust filters many times per session)

### Tradeoffs

**What we sacrifice:**
- "I decide when to search" feeling of explicit submit — acceptable because search is read-only and reversible
- Slightly more API calls than explicit submit — acceptable because ArcGIS hosted service handles this well, and `AbortController` cancels stale requests
- User might see intermediate results while adjusting filters — acceptable because debounce + cancellation minimizes this, and partial results better than no results

**What we gain:**
- Elimination of v1 "pre-search" dead state
- Continuous feedback on filter effects
- Fewer clicks per exploration cycle
- Full-width search input (recovered button space)
- Alignment with modern data catalog conventions (ArcGIS Hub, etc.)

### Implementation Summary

| Element | Behavior | Value | Rationale |
|---------|----------|-------|-----------|
| **Text search** | Debounced instant | 500ms, 2+ chars | Two-request overhead needs buffer; prevents overly broad queries |
| **Enter key** | Bypass debounce | Fires immediately | Power user shortcut (Fitts's Law) |
| **Dropdowns** | Immediate on change | No debounce | Selecting = committed action (Norman Feedback) |
| **Initial state** | Load all datasets | Most recent first | Eliminate v1 "pre-search" dead state (Shneiderman overview-first) |
| **Pagination** | Previous / Next | 20 per page | Positional awareness for researchers (Wayfinding) |
| **In-flight requests** | Cancel previous | `AbortController` | Prevent race conditions (Error Prevention) |
| **Loading feedback** | Inline spinner | Per DFT-018 thresholds | Stale results visible with overlay, not blanked |
| **Empty results** | Message + clear link | "No datasets match..." | Per DFT-015 pattern |
| **Search scope** | Title field | `LIKE '%term%'` | Matches current service; extend to keywords in v2.1+ |
| **ARIA** | Live region | Announces count changes | Accessibility compliance |

### Edge Cases Handled

**Rapid filter changes (dropdown + text in quick succession):**
- Cancel in-flight requests when new filter state arrives
- Only latest query's response updates UI

**Slow network / timeout:**
- Follow DFT-018 thresholds: 300ms = spinner, 3s = "Still loading...", 15s = warning, 30s = auto-timeout
- Show stale results with overlay during loading

**Large result sets (800+ datasets with no filters):**
- Pagination handles naturally (20 per page, "Page 1 of 44")

**Empty text + all filters cleared:**
- Show all datasets (most recent first) — "browse everything" state

### Design Principles Summary

| Principle | Compliant? | How Solution Addresses It |
|-----------|:----------:|---------------------------|
| **Norman: Feedback** | ✅ | Every filter change immediately updates results |
| **Nielsen #1: System Status** | ✅ | Live result count always reflects current filters |
| **Hick's Law** | ✅ | No "Search" button decision per iteration |
| **Fitts's Law** | ✅ | Full-width search input, Enter key shortcut |
| **Shneiderman #7: User Control** | ⚠️ | Enter key for power users; debounce = slight tradeoff |
| **Nielsen #5: Error Prevention** | ✅ | 2-char minimum, `AbortController` for race conditions |
| **Shneiderman #3: Feedback** | ✅ | Inline loading indicators, stale results with overlay |
| **Shneiderman #4: Dialog Closure** | ✅ | Each filter adjustment = complete cycle |
| **Mental Models (IA)** | ✅ | Matches ArcGIS Hub, data catalog conventions |
| **Wayfinding (IA)** | ✅ | Pagination + result count = positional awareness |
| **DFT-018 Compliance** | ✅ | Loading thresholds: 300ms spinner, 3s text, 15s warning |
| **DFT-015 Compliance** | ✅ | Empty state with "Clear all filters" link |
| **Accessibility (WCAG)** | ✅ | Enter key, live region, no rapid swaps |

**Documented in:**
- ✅ `docs/planning-task-tracker.md` (this file)
- ✅ `docs/IMPLEMENTATION/phases/phase-4-dataone.md` (Task 4.3)
- ✅ `docs/master-plan.md` (Cross-Phase Decisions → UX Decisions)

**✅ Verification Checklist:**
- [x] Analysis completed through 9 UI/UX frameworks (Norman, Nielsen, Shneiderman, Hick, Fitts, Mental Models, IA, Accessibility, Motion)
- [x] Decision documented in planning-task-tracker.md
- [x] Phase 4 document updated with decision notes
- [x] Master plan updated with cross-phase UX decision
- [x] Edge cases identified and addressed
- [x] Tradeoffs analyzed
- [x] Implementation specification provided

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

### DFT-038: Filter Section Anatomy — Shared Structural Template

**Category:** Design System  
**Status:** 🟡 Open  
**Priority:** High  
**Source:** Will + Claude design discussion, Feb 5, 2026

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

**Questions to Resolve:**
1. What is the consistent structural skeleton for the filter section?
2. How are controls sized and laid out within the 400px sidebar?
3. What is the section header labeling convention?
4. Should a shared `FilterSection` React component enforce this anatomy?

**Proposed Anatomy Template:**

```
┌─────────────────────────────────────────┐
│ [Section Header: "Filter [Noun]"]       │
│                                         │
│  [Control 1: full-width]                │
│  [Control 2] [Control 3] ← 2-col grid  │
│  [Control 4: full-width]                │
│                                         │
│  Showing 47 of 876 [noun]  [Clear All]  │
├─────────────────────────────────────────┤
│ [Feature list / results below]          │
└─────────────────────────────────────────┘
```

**Proposed Control Sizing Rules (within ~368px usable):**
- Text search: Always full-width
- Single dropdowns: Can pair 2 side-by-side (~174px each, 2-column grid)
- Date range (start + end): Full-width with inline start/end
- Multi-selects: Full-width (pills need horizontal space)
- Toggles/checkboxes: Can pair with a dropdown on same row

**Proposed Section Header Convention:**
- Single-level layers: `"Filter [Plural Noun]"` (e.g., "Filter Observations", "Filter Datasets")
- Dual-level, layer scope: `"Filter [Plural Noun]"` (e.g., "Filter Cameras")
- Dual-level, feature scope: `"Filter [Feature's Data]"` (e.g., "Filter Images", "Filter Datapoints")

**Proposed Shared Component:**
A `FilterSection` component wraps the consistent anatomy. Each data source passes in its specific controls as children, but the wrapper enforces:
- Section header with configurable label
- Consistent control grid layout
- Result count display ("Showing X of Y [noun]")
- "Clear All" action link
- Consistent padding/spacing (exact values deferred to DFT-037 mockups)

**What is deferred to mockups (DFT-037):**
- Exact spacing/padding values (px, gap sizes)
- Color treatment for filter section background
- Control component styling (border-radius, focus states, dropdown appearance)
- Filter section collapse/expand behavior
- Specific component library choice (Headless UI, Radix, custom Tailwind, etc.)
- Filter summary pill display (when section is collapsed)

**Design Principles:**

| Principle | How Template Addresses It |
|---|---|
| Gestalt: Common Region | Bounded filter section groups controls together |
| Gestalt: Proximity | Controls grouped by level; result count adjacent to its filter section |
| Norman: Signifiers | Section headers tell users what they're editing |
| Nielsen #4: Consistency | Same anatomy template across all data sources |
| Nielsen #6: Recognition | Consistent control vocabulary reduces learning curve per data source |
| IA: Wayfinding | Section headers + result counts = "where am I, what am I seeing" |

**Discussion:**
*Pending resolution*

**Resolution:** *Pending*

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

