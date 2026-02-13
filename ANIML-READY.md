# ANiML Phase 2 — Ready to Start

**Date:** February 12, 2026  
**Status:** 🟢 Ready for parallel development on `v2/animl` branch

---

## Quick Start

The Data Source Adapter Pattern (Phase 0 Task 23) is complete. ANiML can now be built in parallel with minimal merge conflicts.

### Documentation

1. **Implementation Guide:** `docs/IMPLEMENTATION/phases/phase-2-animl.md`
   - 8-step build instructions
   - Testing checklist
   - Common pitfalls
   - Reference implementations

2. **Task Tracker:** `docs/development-task-tracker.md`
   - Phase 2 marked "Ready to Start"
   - 7 tasks defined (2.1 - 2.7)

3. **Master Plan:** `docs/master-plan.md`
   - Phase status updated
   - Cross-phase decisions documented

---

## What's Ready

✅ **Core Architecture:**
- `DataSourceAdapter` interface defined
- Registry with commented placeholders for ANiML
- Layer catalog includes `animl-camera-traps`
- Type system includes `'animl'` data source
- iNaturalist reference implementation complete

✅ **Existing Code to Reuse:**
- `src/services/animlService.ts` (1,512 lines, fully functional)
- Deployment queries, image label queries, category counts
- Caching methods already implemented

---

## Merge Conflict Surface

**Only ~11 lines across 3 shared files:**

1. `src/v2/dataSources/registry.ts` — uncomment 6 lines
2. `src/v2/components/Map/layers/index.ts` — add `animl-camera-traps` case (~3 lines)
3. `src/v2/V2App.tsx` — wrap with `<AnimlFilterProvider>` (~2 lines)

All other work is in new directories (no conflicts).

---

## Build Order

1. **AnimlFilterContext** — Data fetching, caching, filter state
2. **Animl Adapter + Registry wiring** — Uncomment registry entries
3. **Animl Map Layer** — Camera trap icons with badges
4. **Animl Overview Tab** — Simple metadata display
5. **Animl Browse Tab (shell)** — Landing cards
6. **Animl Legend Widget** — Species filter floating widget
7. **Camera List + Detail views** — Full browse experience

Items 3-6 can be done in parallel once items 1-2 are complete.

---

## Reference Implementations

Follow the iNaturalist pattern:

- **Adapter:** `src/v2/dataSources/inaturalist/adapter.tsx`
- **Context:** `src/v2/context/INaturalistFilterContext.tsx`
- **Map Layer:** `src/v2/components/Map/layers/inaturalistLayer.ts`
- **Legend:** `src/v2/components/FloatingWidgets/INaturalistLegendWidget/`
- **Browse Tab:** `src/v2/components/RightSidebar/iNaturalist/INaturalistBrowseTab.tsx`

---

## Key Design Decisions

- **DFT-003c:** Landing cards for Animal-First vs Camera-First choice
- **DFT-012:** Numbered badges on camera icons (filtered image counts)
- **DFT-028:** Zero-result cameras grayed out (not hidden)
- **DFT-029:** No badges when layer has no filter
- **DFT-040:** Condensed dual-level filter UI

See `docs/IMPLEMENTATION/phases/phase-2-animl.md` for full details.

---

## Next Steps

```bash
# 1. Create a new branch
git checkout -b v2/animl

# 2. Open the implementation guide
open docs/IMPLEMENTATION/phases/phase-2-animl.md

# 3. Start with Step 1: Create AnimlFilterContext
# Follow the 8-step guide in the phase document
```

---

**Questions?** See the Implementation Guide section in `phase-2-animl.md` for detailed instructions and common pitfalls.
