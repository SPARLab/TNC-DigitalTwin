# UI Confusion: Mapped Item Layers vs Saved Items

**Date:** February 11, 2026  
**Attendees:** Will (frontend lead), Dan (developer/coworker)  
**Topic:** Dan expressing confusion about the distinction between "Mapped Item Layers" widget and "Saved Items" widget  
**Context:** Phase 0 foundation nearing completion; reviewing widget interaction flow  
**Status:** ✅ **Resolved — Saved Items widget dropped; unified into Map Layers (DFT-046)**

---

## The Problem

Dan is confused about the conceptual difference between:
1. **Mapped Item Layers** (left widget) — pinned layers with filtered views
2. **Saved Items** (right widget) — bookmarked individual features/items

**Core confusion:**
> "Why are there two different places to save queries? Both involve filtering. Both show filtered data. Why separate them?"

**Specific pain points:**
- Both widgets involve the same underlying joins (e.g., camera traps + images)
- Both use filters (species, date, confidence)
- The difference between "saving a layer with filters" vs "saving an individual item with filters" is not immediately clear
- The naming ("Mapped Item Layers" vs "Saved Items") doesn't clearly communicate the distinction

---

## Current Widget Behavior (Will's Explanation)

### Mapped Item Layers Widget
- **Purpose:** Save filtered VIEWS of layers (multiple results)
- **Example:** "Camera Traps — Mountain Lions" shows ALL cameras with mountain lion images
- **Cardinality:** One layer → multiple map icons
- **When to use:** You want to see multiple features on the map simultaneously

### Saved Items Widget
- **Purpose:** Save individual ROWS from layers (single results)
- **Example:** "Camera CAM-042 — Mountain Lions 2023" is ONE specific camera
- **Cardinality:** One item → one map icon
- **When to use:** You want to bookmark a specific feature for later

### Will's Mental Model
- Mapped Item Layers = SQL query returning multiple rows
- Saved Items = SQL query returning one row (e.g., `WHERE camera_id = 'CAM-042'`)

---

## Dan's Counter-Argument

**"Why can't Mapped Item Layers handle both?"**

Dan's proposal:
- Use Mapped Item Layers for everything
- If user wants to save one specific camera, they create a filtered view that just selects that one camera
- The widget would show both "multiple result" views AND "single result" views in the same structure

**Example:**
```
📌 Camera Traps
   └─ 🦁 Mountain Lions (all cameras)
   └─ 🦌 Deer (all cameras)
   └─ 📷 CAM-042 only (one camera)
```

**Dan's reasoning:**
- Simpler mental model (one widget for all saved queries)
- Same underlying data structure (both are filtered queries)
- User doesn't have to decide "is this a layer or an item?"

---

## Will's Counter-Counter-Argument

**"Visually, these represent different things"**

Will's concern:
- Mapped Item Layers is visually designed to represent MULTIPLE map icons
- Saved Items is visually designed to represent INDIVIDUAL features
- If Mapped Item Layers includes both, the visual language becomes ambiguous

**Example confusion:**
- User saves 10 individual DataOne datasets as separate "views"
- Each one is technically a filtered query, but conceptually it's just bookmarking one dataset
- The widget would show 10 nested views under "Research Datasets," but they're not really "views" — they're just bookmarks

**Will's fear:**
- User clicks "Save" on a DataOne dataset
- It appears somewhere in the Mapped Item Layers widget (hidden among other views)
- User loses it, can't find it again (recall problem)

**Will's preference:**
- Clear separation: layers (multiple) vs items (single)
- Saved Items widget gives instant visual feedback ("I saved this thing, here it is")

---

## Related Data Type: Related Data Filters

**Additional complexity:** Some features have "related data" that requires special handling

**Example: Camera Traps**
- **Parent layer:** Camera locations (spatial points)
- **Related data:** Images (non-spatial, many-to-one)
- **User workflow:**
  1. Filter layer by species (Level 2: layer-level filter)
  2. Click one camera (Level 3: feature-level drill-down)
  3. Filter that camera's images by date/confidence
  4. Bookmark that ONE camera with those specific image filters

**Challenge:** Where do you represent this in the UI?

**Current design:**
- Mapped Item Layers = layer-level queries (all cameras, filtered by species)
- Saved Items = feature-level queries (one camera, filtered by species + date)

**Dan's question:**
> "Why not just nest everything in Mapped Item Layers? Parent row = layer, child rows = individual features?"

**Will's response:**
> "That could work, but then we're cramming a lot of responsibility into one widget. It becomes harder to explain, harder to scan."

---

## Unresolved Questions

1. **Terminology:** Do "Mapped Item Layers" and "Saved Items" clearly communicate their purpose?
   - Alternative: "Pinned Layers" vs "Bookmarked Features"?
   - Alternative: "Map Layers" vs "Saved Queries"?

2. **Visual Differentiation:** How do we make it obvious at a glance which widget is for what?
   - Icon differences?
   - Color coding?
   - Different card styles?

3. **Empty States:** How do we onboard users who see both widgets for the first time?
   - Explanatory text?
   - Interactive tutorial?
   - Tooltips?

4. **DataOne Edge Case:** Research datasets (DataOne) are non-spatial individual records
   - Do users "pin" the layer to see all datasets?
   - Do users "bookmark" individual datasets?
   - Or both?

5. **Scalability:** What happens when a user saves 20+ items?
   - Does Saved Items widget become overwhelming?
   - Should there be grouping/folding?

---

## Will's Current Stance

**"Let's test with users, but I'm not changing the paradigm right now"**

- Timeline pressure (Feb 20 deadline, 9 days away)
- Already invested significant time in current implementation
- Uncertainty about whether Dan's confusion is universal or specific to developer mindset

**Compromise:** 
- Keep current two-widget paradigm for v2.0
- Improve explanatory text / tooltips
- Add better visual feedback (animations, color coding)
- Observe user behavior in demos/feedback sessions
- Revisit in v2.1 if confusion is widespread

---

## Action Items

1. **Improve Empty State Text (P1)**
   - Mapped Item Layers: "Layers have multiple items. For export, use the Export All button."
   - Saved Items: "Results from queried layers can be saved here. For export, use Shopping Cart."
   - Replace "item" with "feature" if it's clearer

2. **Add Tooltips/Info Icons (P1)**
   - Small (i) icon next to each widget title
   - Click to see explanation of widget purpose

3. **Visual Differentiation (P2)**
   - Consider different accent colors for each widget
   - Consider different icon styles (layer stack vs bookmark)

4. **User Testing (P2)**
   - Show mockup to Amy, Trisalyn, and other team members
   - Specifically ask: "Is the difference between these two widgets clear?"

5. **Defer Full Paradigm Rework (P3)**
   - If feedback is overwhelmingly negative, revisit in v2.1
   - Document Dan's proposed alternative in future-enhancements.md

---

## Related Documents

- `docs/PLANNING/component-specs/map-layers-widget.md`
- `docs/PLANNING/component-specs/bookmarked-items-widget.md`
- `docs/PLANNING/resolved-decisions/dft-007-resolution-summary.md` — Bookmark widget structure
- `docs/PLANNING/resolved-decisions/dft-013-resolution-summary.md` — Multiple filtered views
- `docs/PLANNING/resolved-decisions/dft-020-resolution-summary.md` — Pointer-row bookmark button

---

## Design Principles at Play

**Supporting Current Paradigm:**
- **Recognition over Recall** (Nielsen) — Clear separation makes it obvious where things are saved
- **Proximity** (Gestalt) — Saved Items near right sidebar (feature-level work)
- **Conceptual Model** (Norman) — Layers (plural) vs Items (singular) reinforces cardinality

**Supporting Dan's Alternative:**
- **Simplicity** (Nielsen #8) — One widget is simpler than two
- **Consistency** (Hick's Law) — Same interaction pattern for all saved queries
- **Flexibility** — Users don't have to pre-decide "is this a layer or an item?"

**Tradeoff:** Clarity vs Flexibility

---

## Resolution (Feb 11, 2026)

**Decision:** Drop the Saved Items widget. Unify all saved state into the Map Layers widget (renamed from "Mapped Item Layers" to "Map Layers").

**What happened:** After extended design analysis, Will presented the two-widget paradigm to the full team (Dan, Trisalyn, Amy). All three team members independently expressed confusion and preference for a unified approach. Dan's original intuition was validated by user feedback.

**Key insight:** The distinction between "entity reference" (bookmark) and "saved query" (filtered view) was real in the designer's mental model but absent in the users' mental model. Three design principles explain the confusion:
1. **Conceptual Model Mismatch** (Norman) — users had one category ("saved things"), UI imposed two
2. **Tesler's Law** — separation moved complexity to the user, not the system
3. **Hick's Law** — forced categorization decision users didn't find meaningful

**Implementation:** Individual items (cameras, datasets) are now saved as filtered views that return one result. "Bookmark" actions become "Save as View" in the right sidebar.

**See:** `docs/PLANNING/resolved-decisions/dft-046-resolution-summary.md`
