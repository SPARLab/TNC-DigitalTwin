# Document Structure Analysis & Splitting Recommendations

**Date:** February 5, 2026  
**Purpose:** Analyze document sizes and structure to identify opportunities for splitting large documents to improve edit speed and maintainability.

---

## Current Document Sizes

| Document | Lines | Status | Recommendation |
|----------|-------|--------|----------------|
| `planning-task-tracker.md` | ~543 | ✅ Just archived | **Good** — Reduced from 1,379 to ~543 lines |
| `master-plan.md` | 256 | ✅ Manageable | **Keep as-is** — Well-structured, easy to navigate |
| `design-system.md` | 686 | ⚠️ Large | **Consider splitting** — See recommendations below |
| `phase-0-foundation.md` | 557 | ⚠️ Large | **Consider splitting** — See recommendations below |
| `phase-2-animl.md` | 345 | ✅ Manageable | **Keep as-is** |
| `phase-3-dendra.md` | 353 | ✅ Manageable | **Keep as-is** |
| `phase-1-inaturalist.md` | 204 | ✅ Manageable | **Keep as-is** |
| `phase-4-dataone.md` | 229 | ✅ Manageable | **Keep as-is** |
| `phase-5-export-builder.md` | 190 | ✅ Manageable | **Keep as-is** |
| `phase-6-polish.md` | 275 | ✅ Manageable | **Keep as-is** |

**Total:** ~3,094 lines across all planning/implementation docs

---

## Recommendations

### 1. `design-system.md` (686 lines) — **SPLIT RECOMMENDED**

**Current Structure:**
- Single file containing all design system patterns
- Includes: colors, typography, spacing, components, error states, loading states, empty states, etc.

**Proposed Split:**

```
docs/DESIGN-SYSTEM/
├── design-system.md (index/overview, ~50 lines)
├── tokens.md (colors, typography, spacing, ~150 lines)
├── components.md (buttons, cards, modals, ~200 lines)
├── states.md (loading, error, empty states, ~200 lines)
└── patterns.md (undo, tooltips, animations, ~150 lines)
```

**Benefits:**
- Faster edits — agents can target specific sections
- Parallel editing — multiple agents can work on different files
- Easier navigation — smaller files are faster to search
- Better organization — logical grouping by concern

**Migration Strategy:**
1. Create new files with extracted content
2. Update `design-system.md` to be an index with links to sub-files
3. Update all references across codebase
4. Test that all links work

---

### 2. `phase-0-foundation.md` (557 lines) — **SPLIT RECOMMENDED**

**Current Structure:**
- Single file with 7 tasks (0.1 through 0.7)
- Each task has detailed acceptance criteria, ASCII diagrams, design decisions

**Proposed Split:**

```
docs/IMPLEMENTATION/phases/phase-0-foundation/
├── README.md (overview, task status table, ~50 lines)
├── task-0.1-routing.md (~80 lines)
├── task-0.2-left-sidebar.md (~80 lines)
├── task-0.3-pinned-layers-state.md (~80 lines)
├── task-0.4-bookmarks-state.md (~80 lines)
├── task-0.5-pinned-layers-widget.md (~120 lines — largest, has many diagrams)
├── task-0.6-bookmarked-features-widget.md (~80 lines)
└── task-0.7-error-handling.md (~80 lines)
```

**Benefits:**
- Task-focused editing — agents work on one task file at a time
- Reduced conflicts — multiple agents can edit different tasks simultaneously
- Faster navigation — jump directly to task of interest
- Easier to mark tasks complete — clear file boundaries

**Migration Strategy:**
1. Extract each task section into its own file
2. Create `README.md` with overview and task status table
3. Update `master-plan.md` to reference `phase-0-foundation/README.md`
4. Update any cross-references

**Alternative (Less Aggressive):**
If splitting into 7 files feels too granular, consider:
- `phase-0-foundation.md` (overview + tasks 0.1-0.3, ~250 lines)
- `phase-0-widgets.md` (tasks 0.4-0.6, ~250 lines)
- `phase-0-error-handling.md` (task 0.7, ~80 lines)

---

### 3. `master-plan.md` (256 lines) — **KEEP AS-IS**

**Rationale:**
- Well-structured with clear sections
- Easy to navigate (tables, clear headings)
- Cross-phase decisions table is manageable
- Acts as navigation hub — splitting would reduce discoverability

**Recommendation:** No changes needed.

---

### 4. Phase Documents (Phases 1-6) — **KEEP AS-IS**

**Rationale:**
- All under 400 lines (manageable)
- Each phase is self-contained
- Splitting would reduce cohesion
- Current structure supports parallel work (different phases = different files)

**Recommendation:** No changes needed.

---

## Implementation Priority

### High Priority (Do Now)
1. ✅ **Archive resolved tasks** — **COMPLETED** (Feb 5, 2026)
   - Reduced tracker from 1,379 to ~543 lines
   - Moved DFT-001 through DFT-032 to archive file

### Medium Priority (Consider Soon)
2. **Split `design-system.md`** (686 lines)
   - Benefits: Faster pattern lookups, parallel editing
   - Effort: Medium (need to update references)
   - Impact: High (design system is frequently referenced)

3. **Split `phase-0-foundation.md`** (557 lines)
   - Benefits: Task-focused editing, reduced conflicts
   - Effort: Medium (need to update master plan references)
   - Impact: Medium (Phase 0 is foundational but may not be edited as frequently once started)

### Low Priority (Defer)
4. Monitor other documents — if any grow beyond 500 lines, consider splitting

---

## Decision Criteria for Future Splits

**Split a document if:**
- ✅ Exceeds 500 lines AND
- ✅ Contains multiple distinct concerns (e.g., tokens vs components) OR
- ✅ Frequently edited by multiple agents simultaneously OR
- ✅ Has clear logical boundaries (e.g., tasks, sections)

**Keep a document together if:**
- ✅ Under 400 lines OR
- ✅ Highly cohesive (all content relates to single concern) OR
- ✅ Acts as navigation hub (splitting reduces discoverability) OR
- ✅ Rarely edited (archival/historical value)

---

## Notes

- **Current state is good** — Most documents are manageable
- **Tracker archiving was critical** — Reduced from 1,379 to ~543 lines (60% reduction)
- **Design system is next candidate** — Largest remaining document, clear logical boundaries
- **Phase 0 split is optional** — Only if it becomes a bottleneck during implementation

---

**Last Updated:** February 5, 2026
