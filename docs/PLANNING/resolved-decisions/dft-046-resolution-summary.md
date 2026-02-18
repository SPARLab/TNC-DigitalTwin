# DFT-046 Resolution: Drop Saved Items Widget — Unify into Map Layers

**Date:** February 11, 2026  
**Status:** ✅ Resolved  
**Decision:** Drop the Saved Items (Bookmarked Items) widget. All saved state unified into the Map Layers widget. Individual items saved as filtered views.  
**Decided by:** Team consensus (Will, Dan, Trisalyn, Amy)

---

## Context

The v2 Digital Catalog originally had **two floating widgets**:
1. **Mapped Item Layers** (left) — pinned layers with filtered views (multiple results)
2. **Saved Items** (right) — bookmarked individual features (single results)

The distinction was: layers manage collections (many items on the map), while saved items manage individual features you want to revisit.

## Problem

**Three out of three team members** independently expressed confusion about why two separate widgets existed for saving queries. Key feedback:

- **Dan:** "Why are there two different places to save queries? Both involve filtering."
- **PIs (Trisalyn, Amy):** Struggled with the Saved Items widget concept; wanted saved items to appear as filtered views in the Map Layers widget.

## Design Principles That Explain the Confusion

| Principle | How It Applies |
|-----------|---------------|
| **Conceptual Model Mismatch** (Norman) | Users had one mental model ("saved things") but the UI imposed two categories they didn't perceive as distinct |
| **Similarity** (Gestalt) | Both widgets looked alike (floating cards, lists, actions), creating "why two?" confusion |
| **Tesler's Law** (Conservation of Complexity) | Separation moved complexity to the user instead of absorbing it into the system |
| **Hick's Law** (Decision Friction) | Users were forced to decide "is this a layer view or a bookmark?" — a categorization they didn't find meaningful |
| **Jakob's Law** (Familiarity) | Most tools have one save destination; two violated expectations |
| **Nielsen #8** (Aesthetic Minimalism) | The second widget competed for attention without providing perceived value |

## Resolution

**Unified approach:**
- Drop the Saved Items widget entirely
- Rename "Mapped Item Layers" → **"Map Layers"**
- Individual items (cameras, datasets, observations) are saved as filtered views that return one result
- The right sidebar "Bookmark" action becomes "Save as View" / "Save Query" (language TBD)
- All saved state lives in the Map Layers widget

**What changes in the right sidebar:**
- iNaturalist, ANiML, DataOne "Bookmark" buttons will become "Save as View" (or similar)
- The action creates a filtered view in Map Layers widget instead of a bookmark in Saved Items
- If the parent layer isn't pinned, it pins automatically

## Implementation

**Code changes (Feb 11, 2026):**
- `BookmarkedItemsWidget` render removed from `MapContainer.tsx` (import commented, preserved)
- `BookmarkProvider` removed from `V2App.tsx` (import commented, preserved)
- `useBookmarks` removed from `V2Header.tsx` (cart count = pinned layers only now)
- `useBookmarks` removed from `INaturalistBrowseTab.tsx` (bookmark action stubbed as TODO)
- `BookmarkedItem` and `BookmarkType` types marked `@deprecated` in `types/index.ts`
- `MapLayersWidget` title changed from "Mapped Item Layers" to "Map Layers"
- CSS bookmark animations preserved with "PRESERVED" comment header for reuse

**Code NOT deleted:**
- `BookmarkedItemsWidget/` component directory (preserved for CSS/animation patterns)
- `BookmarkContext.tsx` (preserved for reference)
- `dummyBookmarks.ts` (preserved for reference)
- Bookmark CSS animations in `index.css` (preserved for reuse)

**Documentation updated:**
- `master-plan.md` — updated to reflect decision
- `future-enhancements.md` — Widget Terminology Refinement updated with resolution
- Meeting notes — resolution appended

## Future Work

- **"Save as View" action** — replace bookmark buttons with filtered-view creation in right sidebar
- **ANiML queries** — rethink language for saving individual camera queries as views
- **DataOne datasets** — rethink language for saving individual dataset references as views
- **Map Layers widget density** — may need visual indicators for single-result vs multi-result views
- **Cross-widget search** — consider future search-across-all-saved-views feature (Dan's Point #6)

## Related Documents

- `docs/PLANNING/feedback/meeting-notes/2026-02-11-ui-confusion-mapped-vs-saved.md`
- `docs/PLANNING/component-specs/bookmarked-items-widget.md` (now archived)
- `docs/PLANNING/component-specs/map-layers-widget.md`
