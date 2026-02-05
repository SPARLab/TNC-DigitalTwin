# DFT-039 Resolution Summary: Filter Apply Behavior

**Date:** February 5, 2026  
**Status:** ✅ Resolved  
**Decision:** Auto-apply everywhere — no Apply button in any data source

---

## The Problem

DFT-035 decided DataOne uses auto-apply (debounced instant search, immediate dropdown response). ANiML was updated to auto-apply via DFT-003 (Feb 3). But Phase 3 Dendra still showed explicit `[Apply]` buttons in ASCII diagrams (Tasks 3.3 and 3.6). iNaturalist implied auto-apply but wasn't explicit. This inconsistency would confuse researchers who switch between data sources (Nielsen #4: Consistency).

**State before resolution:**

| Data Source | Behavior | Source |
|---|---|---|
| iNaturalist | Auto-apply (implied) | Phase 1, Task 1.3 |
| ANiML | Auto-apply (explicit) | Phase 2, Tasks 2.3-2.4 (DFT-003) |
| Dendra | **Explicit `[Apply]` button** | Phase 3, Tasks 3.3, 3.6 |
| DataOne | Auto-apply (explicit) | Phase 4, Task 4.3 (DFT-035) |

3 of 4 data sources already used auto-apply. Only Dendra had `[Apply]` buttons.

---

## The Solution: Auto-Apply Everywhere

### Universal Auto-Apply Rules

| Control Type | Trigger | Timing | Rationale |
|---|---|---|---|
| **Text search** | Keystroke | 500ms debounce, 2+ chars | Per DFT-035 pattern; Enter key bypasses debounce |
| **Single dropdown** | Selection change | Immediate | Selecting = committed action (Norman Feedback) |
| **Multi-select (pills)** | Each toggle | Immediate | Each pill toggle = discrete commit |
| **Date range (each field)** | Calendar close / blur | Immediate per field | Calendar picker close = committed action |
| **Toggle / checkbox** | Click | Immediate | Binary state change = instant feedback |

### Shared Infrastructure (All Data Sources)

- **`AbortController`** cancels in-flight requests when new filter state arrives
- **Loading feedback** per DFT-018 thresholds (300ms+ spinner, 3s+ text, 15s+ warning)
- **Stale results** visible with opacity overlay during loading (not blanked)
- **Result count** in `FilterSection` footer (DFT-038) updates continuously
- **"Clear All"** in filter header fires immediately, resets to unfiltered state
- **ARIA live region** announces result count changes

### Date Range Edge Case

Changing one date field (e.g., start date) fires a query with the new value + existing other field. When the user then changes the end date, `AbortController` cancels the intermediate query and fires the final one. Previous results remain visible with a subtle opacity overlay during loading. This is the same pattern DataOne uses for its year range picker.

---

## Design Rationale

**Core tension:** Consistency (Nielsen #4) vs. Perceived Control (Shneiderman #7).

An Apply button gives users a sense of "I decide when to commit" — but at the cost of breaking the feedback loop on every filter interaction. For a 4-control filter section, this adds 1 extra click per iteration cycle. Researchers (DFT-011) iterate on filters frequently. Over a session, this compounds.

**Why Dendra doesn't need special treatment:**
- Level 2 filters (Region, Status dropdowns): selecting from a dropdown *is* a committed action. Apply after a dropdown breaks the action-response link.
- Level 3 filters (date range + aggregation): same control types that DataOne uses with auto-apply.
- ANiML queries take 8-12s (slowest in the system) and already use auto-apply. If ANiML handles it, Dendra can too.
- `AbortController` + debounce + loading states (DFT-018) mitigate all performance concerns.

---

## Design Principles Summary

| Principle | Compliant? | How Solution Addresses It |
|-----------|:----------:|---------------------------|
| **Nielsen #4: Consistency** | ✅ | Same behavior across all 4 Browse tabs |
| **Norman: Feedback** | ✅ | Every control change produces immediate result update |
| **Norman: Conceptual Model** | ✅ | "Adjust filter = see results" — no hidden staged state |
| **Hick's Law** | ✅ | No "Apply" decision per iteration cycle |
| **Nielsen #1: System Status** | ✅ | Live result count always reflects current filters |
| **Shneiderman #3: Feedback** | ✅ | Action → response loop unbroken |
| **Shneiderman #4: Dialog Closure** | ✅ | Each filter change = complete cycle |
| **Shneiderman #7: User Control** | 🟡 | Slight tradeoff — can't compose offline |
| **Fitts's Law** | ✅ | No Apply button target needed |
| **Nielsen #5: Error Prevention** | ✅ | `AbortController` prevents race conditions |
| **DFT-018 Compliance** | ✅ | Tiered loading feedback for all durations |
| **DFT-038 Compliance** | ✅ | `FilterSection` works identically everywhere |
| **WCAG: Operable** | ✅ | Standard controls; Enter key bypass; ARIA |
| **IA: Mental Models** | ✅ | Matches ArcGIS Hub conventions |

---

## Tradeoffs

**What we sacrifice:**
- "Compose multiple filters then commit" workflow — acceptable because each change is independently reversible via "Clear All", and `AbortController` means intermediate queries have near-zero cost
- Slightly more API calls than explicit Apply — acceptable because ArcGIS services handle this well, and cancellation prevents wasted work
- Brief intermediate results during multi-filter changes — acceptable because stale results stay visible with overlay (not blanked)

**What we gain:**
- Perfect cross-source consistency (Nielsen #4)
- Unbroken feedback loop (Norman)
- Fewer clicks per exploration cycle (Hick's Law)
- Simpler `FilterSection` component (no Apply button state management)
- Alignment with 3 existing data source decisions

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-039 marked resolved with full specification

2. **Phase 3 Dendra** (`docs/IMPLEMENTATION/phases/phase-3-dendra.md`)
   - Task 3.3: Removed `[Apply]` from Layer View ASCII diagram, added auto-apply acceptance criteria
   - Task 3.6: Removed `[Apply]` from Feature View ASCII diagram, added auto-apply acceptance criteria

3. **Phase 1 iNaturalist** (`docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`)
   - Task 1.3: Explicitly specified auto-apply behavior for all filter controls

4. **Design System** (`docs/DESIGN-SYSTEM/design-system.md`)
   - Added Filter Apply Behavior subsection under Filter Section Patterns
   - Updated Related Decisions list

5. **Master Plan** (`docs/master-plan.md`)
   - Added to Cross-Phase Decisions → UX Decisions table

6. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-039-resolution-summary.md`

---

**Status:** Ready for implementation (all phase documents updated)
