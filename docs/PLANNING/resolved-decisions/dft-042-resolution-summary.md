# DFT-042 Resolution Summary: ANiML Landing Cards Mode-Switch

**Date Resolved:** February 6, 2026  
**Decision Maker:** Will + Claude (via UI/UX design principles analysis)  
**Related DFTs:** DFT-003c (Landing cards entry point)

---

## The Problem

DFT-003c (resolved Feb 2, 2026) established that ANiML's Browse tab presents users with **landing cards** on first visit, offering two distinct browsing paradigms:

- **Animal-First**: "I want to see all observations of mountain lions" → select species → optionally narrow to specific cameras
- **Camera-First**: "I want to browse what CAM-042 captured" → select camera → optionally filter by species

The user's initial choice is remembered (stored in browser localStorage), so landing cards are skipped on return visits. The user goes directly to their preferred mode.

**The Problem:** Once locked into a mode, there was no specified mechanism to switch. A researcher who initially chose Camera-First might later need Animal-First workflow (e.g., "show me all coyote sightings across all cameras"). Without a switch mechanism, they must either:
- Clear their browser cache/localStorage (non-discoverable, technical)
- Work inefficiently in the wrong mode
- Not realize the other mode exists

Four options were considered:
1. Text link above filter section: "Switch to [other mode]"
2. Dropdown/toggle in filter section header
3. Settings gear icon in Browse tab header
4. Reset link in Overview tab

---

## The Decision

**Text link above filter section: "Switch to [other mode]"**

### Visual Placement

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

### Link Specification

**Location:** Above filter section, standalone line (not inside `FilterSection` header)

**Visual style:**
- Text link with shuffle icon (Lucide `ArrowLeftRight` or `Shuffle`)
- Colors: `text-gray-500 hover:text-emerald-500`
- Size: `text-sm`
- Icon positioned left of text

**Text pattern:** Dynamic based on current mode:
- In Camera-First mode: "Switch to Animal-First"
- In Animal-First mode: "Switch to Camera-First"

**Always visible:** Present in both modes at all times

**ARIA label:** `aria-label="Switch from Camera-First to Animal-First browsing"` (or vice versa)

### Behavior on Click

1. **If filters are active:** Show confirmation dialog:
   - Title: "Switch Browse Mode?"
   - Message: "Switching modes will clear your current filters. Continue?"
   - Buttons: [Cancel] [Switch Mode]
   - Cancel preserves current state, Switch Mode proceeds

2. **If no filters:** Switch immediately (no confirmation)

3. **On switch:**
   - Update localStorage preference (`animl-browse-mode`)
   - 150-200ms crossfade transition (per DFT-019)
   - Render new filter controls for new mode
   - Clear results, load defaults for new mode
   - Optional toast notification: "Switched to Animal-First browsing"

### Mode Preference Storage

- **Storage:** Per-layer in localStorage: `animl-browse-mode`
- **Values:** `"animal-first"` or `"camera-first"`
- **Default for new users:** `"camera-first"` (matches most common GIS workflow: browse by location first)

### Confirmation Dialog Specification

- **Type:** Custom modal component (not `window.confirm()`)
- **Trigger:** Only when filters are currently active (any non-default filter value)
- **Purpose:** Prevent accidental data loss (switching modes clears filter state because modes have different filter schemas)
- **Follows DFT-031 pattern:** Context-specific confirmation for bulk/destructive actions

---

## Design Rationale

Analyzed through 9 UI/UX frameworks with **strong cross-framework convergence** around Option 1.

### Core Insight

Researchers experiencing friction in one mode will look at the **filter controls** (where the mode manifests). Placing the switch link above the filter section maximizes discoverability while keeping visual weight low.

### Principle Analysis

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

### Why Not the Other Options?

**Option 2: Dropdown in filter section header**
- ❌ Higher visual weight (competes with "Clear All")
- ❌ Dropdown pattern usually means "select from options" (but here it's a mode toggle, not a filter)
- ❌ Potentially confusing: is this *filtering* by mode or *changing* modes?

**Option 3: Settings gear icon in Browse tab header**
- ❌ Buried in header (less discoverable)
- ❌ Settings icon pattern usually means "app settings," not "workflow mode"
- ❌ Requires 2 clicks (click → menu → select) vs 1 click

**Option 4: Reset link in Overview tab**
- ❌ Low discoverability (users in Browse tab won't see it)
- ❌ Requires navigation: Browse → Overview → click link → return to Browse
- ❌ Violates Fitts's Law (more clicks, more distance)

---

## Tradeoffs

**What we sacrifice:**
- One line of vertical space in Browse tab (acceptable: sidebar is scrollable, ~20px at `text-sm` is minimal)
- Potential confusion if user accidentally clicks (acceptable: confirmation dialog prevents data loss when filters are active)

**Why acceptable:**
- **Violating User Control is worse:** The alternative (no switch mechanism) locks users into their initial choice, violating Nielsen #7 (Flexibility) and Norman (User Control)
- **Vertical space is cheap:** Sidebar is scrollable; 20px is 5% of 400px width
- **Confirmation dialog prevents accidental data loss:** Follows DFT-031 patterns for context-specific confirmation
- **Most users won't need it:** Satisfied users can ignore the link (low visual weight ensures it doesn't distract)

---

## Files Updated

1. **`docs/planning-task-tracker.md`**
   - Updated DFT-042 status to 🟢 Resolved
   - Added full resolution with design decision, ASCII diagram, link specification, behavior specification, principle analysis, tradeoffs
   - Updated Quick Reference table status
   - Added changelog entry

2. **`docs/IMPLEMENTATION/phases/phase-2-animl.md`**
   - Added decision note in Task 2.2 header
   - Updated Task 2.2 acceptance criteria with mode-switch specifications:
     - Location, styling, text pattern
     - Click behavior (confirmation logic)
     - Transition spec (150-200ms crossfade)
     - localStorage storage pattern
     - Keyboard accessibility

3. **`docs/master-plan.md`**
   - Updated ANiML Browse entry point (DFT-003c) row in Cross-Phase Decisions → UX Decisions
   - Added reference to DFT-042 resolution

4. **`docs/PLANNING/resolved-decisions/dft-042-resolution-summary.md`**
   - Created this resolution summary

---

## Verification Checklist

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

## Impact on Implementation

### Phase 0 (Foundation)
- No impact — sidebar shell implementation unaffected

### Phase 2 (ANiML)
- **Task 2.2:** ANiML Browse tab must render mode-switch link above filter section
- **Component:** Create `<ModeSwitchLink>` component (or inline in `ANiMLBrowseTab`)
- **Props:** `currentMode`, `onSwitch`, `hasActiveFilters`
- **Confirmation modal:** Custom modal component for "Switch Browse Mode?" dialog
- **localStorage:** Read/write `animl-browse-mode` preference
- **Transition:** 150-200ms crossfade when switching modes (matches DFT-019 standards)

### Phases 1, 3, 4 (Other Data Sources)
- No impact — this is ANiML-specific exception (DFT-003c)

### Phase 5 (Export Builder)
- No impact

### Phase 6 (Polish)
- No impact

---

## Related Decisions

- **DFT-003c (Feb 2, 2026):** Landing cards for Animal-First vs Camera-First entry point
- **DFT-019 (Feb 4, 2026):** 150-200ms crossfade transition standard for sidebar tab switches
- **DFT-031 (Feb 4, 2026):** Context-specific confirmation dialogs (bulk actions warrant explicit consent)
- **DFT-038 (Feb 5, 2026):** Shared `FilterSection` component anatomy
- **DFT-041 (Feb 6, 2026):** Right sidebar reduced to 2 tabs (Overview | Browse)

---

## Open Questions (None)

All questions resolved. Implementation ready.
