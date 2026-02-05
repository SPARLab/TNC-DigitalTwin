# DFT-035 Resolution Summary: DataOne Search Behavior

**Date:** February 5, 2026  
**Status:** ✅ Resolved  
**Decision:** Debounced instant search (500ms, 2+ chars) + immediate dropdown filters

---

## The Problem

DataOne has a search interface in the right sidebar Browse tab. The question: should search fire as the user types (instant), require an explicit submit (Enter/button), or use a hybrid approach?

**Key Constraints:**
- Two API calls per search: `countDatasets()` + `queryDatasets()` hit ArcGIS Feature Service
- ~12k records (latest versions, filtered to 20-mile radius)
- Text search uses `LIKE '%term%'` on `title` field only
- Four filter controls: text search, category dropdown, year range, author dropdown
- v1 implementation uses explicit submit with "pre-search" empty state
- Target audience: GIS researchers (DFT-011) at desktop workstations (DFT-016)

---

## The Solution: Debounced Instant Search + Immediate Dropdown Filters

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

---

## Design Rationale

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

---

## Implementation Summary

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

---

## Edge Cases Handled

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

---

## Design Principles Summary

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

---

## Tradeoffs

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

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-035 marked resolved
   - Full specification documented

2. **Phase 4** (`docs/IMPLEMENTATION/phases/phase-4-dataone.md`)
   - Task 4.3 updated with decision notes
   - Search behavior specification added

3. **Master Plan** (`docs/master-plan.md`)
   - Added to Cross-Phase Decisions → UX Decisions table

4. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-035-resolution-summary.md`

---

## Next Steps

**For implementation (Phase 4, Task 4.3):**
1. Implement debounced text search (500ms, 2+ chars)
2. Add Enter key bypass for immediate search
3. Implement immediate dropdown filter changes
4. Load all datasets on initial Browse tab entry
5. Implement pagination (Previous/Next, 20 per page)
6. Add `AbortController` for request cancellation
7. Implement loading feedback per DFT-018 thresholds
8. Add empty state with "Clear all filters" link
9. Add ARIA live region for result count announcements

**For testing:**
- Test rapid filter changes (verify cancellation works)
- Test slow network scenarios (verify loading states)
- Test keyboard-only navigation (Enter key works)
- Test with screen reader (verify announcements)

---

**Status:** Ready for implementation (Phase 4, Task 4.3)
