# Data Catalog UX Paradigm: Layers, Rows, and Related Data

**Date:** January 21, 2026  
**Context:** Internal feedback and design exploration following Jan 20 team meeting  
**Status:** Conceptual framework - V1 scope defined  
**Last Updated:** January 21, 2026

---

## Executive Summary

This document captures a conceptual model for how users interact with data in the TNC Digital Catalog. The key insight is that data exists at **multiple levels of abstraction**, and users need to "save" or "work with" data at each level differently.

**Core Principle:** For any given layer, there is exactly ONE view on the map at any time. No duplicates.

**V1 Scope:** Build the foundation with one active query per layer. Saved query snapshots are a V2 enhancement.

---

## Part 1: The Conceptual Model

### The Three-Level Hierarchy

```
Level 1: LAYER (Table)
    │
    ├── PIN: Add layer to map workspace
    ├── QUERY: Filter visible features (one active at a time)
    │
    └── Level 2: ROW / FEATURE
            │
            ├── Self-Contained Row
            │   └── BOOKMARK: Save reference (no Level 3 exists)
            │
            └── Pointer Row (has related data)
                │
                ├── BOOKMARK (simple): Save reference only
                │
                └── BOOKMARK WITH FILTER: Save reference + Level 3 query
                    │
                    └── Level 3: RELATED DATA
                        └── QUERY: Filter attached to bookmark
```

### The Symmetry

There's a beautiful symmetry in this model:

| Layer Level | Feature Level (for pointer rows) |
|-------------|----------------------------------|
| **Pin** a layer | **Bookmark** a feature |
| **Query** the layer | **Query** the related data |
| One active view | One filter per bookmark |

Just as you can pin a layer and apply a query to it, you can bookmark a feature and apply a query to its related data.

### What Each Level Represents

| Level | What It Is | Example | User Action |
|-------|-----------|---------|-------------|
| **Layer** | A table/data source | "Camera Traps" | Pin to map |
| **Query on Layer** | Filtered view of table | "North preserve only" | Edit query |
| **Row/Feature** | Single record in table | "Camera CAM-042" | Bookmark |
| **Related Data** | Data pointed to by row | "Images from CAM-042" | (only for pointer rows) |
| **Query on Related** | Filtered related data | "Mountain lions only" | Bookmark with filter |

### Two Types of Rows

**Self-Contained Rows:** The row IS the data
- iNaturalist observation
- Fire perimeter polygon
- eBird sighting
- **Export** = metadata + link to source
- **No Level 3** - nothing to query beyond the row itself

**Pointer Rows:** The row POINTS TO data
- DataOne dataset → multiple files (CSV, TIFF, PDF)
- Dendra sensor → time-series datastream
- ANiML camera → archive of captured images
- **Export** = metadata + THE DATA IT POINTS TO (possibly filtered)
- **Has Level 3** - user can query the related data

---

## Part 2: The "One Active View" Principle

### Why Only One View Per Layer?

If we allowed multiple simultaneous filtered views of the same layer, we'd get confusing duplicates:

```
❌ Multiple simultaneous views (BAD):

Map shows:
  • Mountain lion from CAM-042 (from "Mountain Lions" query)
  • Mountain lion from CAM-042 (from "All Nocturnal" query)  ← DUPLICATE!
  • Mountain lion from CAM-042 (from "2023 only" query)      ← DUPLICATE!

User: "Why am I seeing the same feature three times?"
```

```
✅ One active view per layer (GOOD):

Map shows:
  • Mountain lion from CAM-042 (from currently active query)

User switches to different query → map updates to show that view instead

Clear, comprehensible, no duplicates.
```

### The Principle

> **For any given layer, there is exactly one view on the map at any time.**
> 
> You can change the query (filter), but only one query is "active" and rendered.
> In the future (V2), you can save multiple query snapshots and switch between them.

This applies at both levels:
- **Layer level:** One active query per pinned layer
- **Bookmark level:** One Level 3 filter per bookmark (want different filter? Bookmark again)

---

## Part 3: V1 vs V2 Scope

### V1: Build the Foundation (Current Sprint)

| Feature | V1 Status | Notes |
|---------|-----------|-------|
| Pin layers | ✅ Build | Core functionality |
| One active query per layer | ✅ Build | Query overwrites previous |
| Bookmark features | ✅ Build | Simple bookmark |
| Bookmark with Level 3 filter | ✅ Build | For ANiML, Dendra |
| Export Builder | ✅ Build | Basic version |
| **Saved query snapshots** | ❌ Skip | V2 enhancement |

**V1 Query Behavior:**
- Apply a query to a pinned layer
- Query persists while you explore other layers
- If you change the query, old query is overwritten (no history)
- "Clear" removes all filters

```
V1 Widget:
┌──────────────────────────────────────────┐
│ 📌 Camera Traps                          │
│    ⚡ Filtered: North preserve           │
│    Showing 8 of 42 cameras               │
│                                          │
│    [Edit Query] [Clear]                  │
└──────────────────────────────────────────┘
```

### V2: Add Saved Queries (Future Enhancement)

**Not a rewrite** - just adds an array of saved queries to existing state:

```javascript
// V1: One active query
pinnedLayer.activeQuery = { region: "north" }

// V2: Add saved queries array (additive change)
pinnedLayer.savedQueries = [
  { name: "North Preserve", query: { region: "north" } },
  { name: "Coastal Cameras", query: { region: "coastal" } }
]
```

```
V2 Widget (future):
┌──────────────────────────────────────────┐
│ 📌 Camera Traps                          │
│    ⚡ Active: North Preserve             │
│                                          │
│    📁 Saved Queries:                     │
│       • North Preserve ← active          │
│       • Coastal Cameras                  │
│       + Save current as...               │
│                                          │
│    [Edit Query] [Clear]                  │
└──────────────────────────────────────────┘
```

**Why this isn't a box:** The query is already stored as a data structure. Adding saved queries is just storing an array of them. UI change is additive (add dropdown), not a rewrite.

---

## Part 4: Context-Aware Actions

### Principle: Show the right actions at the right time, in the right place

Instead of showing all actions everywhere, we use **progressive disclosure**:
- Actions appear based on WHERE the user is looking
- Actions appear based on WHAT type of data they're interacting with
- Complex operations (like export) happen in dedicated workflows

### The "Where" Determines "What Actions"

| User Is Looking At | Location | Available Actions |
|--------------------|----------|-------------------|
| Layer in left sidebar | Left sidebar row | 📌 Pin / Unpin |
| Pinned layer in floating widget | Floating widget | 👁️ Toggle, ⚡ Edit Query, ✕ Unpin |
| Layer details | Right sidebar Overview tab | View metadata, attribution |
| Self-contained feature | Right sidebar Browse tab | 🔖 Bookmark |
| Pointer row feature | Right sidebar Browse tab | 🔖 Bookmark, 🔖 Bookmark with Filter |
| Bookmarked item | Floating widget Bookmarks section | 👁️ View, ✕ Remove |
| Ready to export | Export Builder | Configure all export options |

### The Action Vocabulary (5 Core Operations)

| Action | Icon | Meaning | Where It Appears |
|--------|------|---------|------------------|
| **Pin** | 📌 | "Add this layer to my map workspace" | Left sidebar |
| **Toggle** | 👁️ | "Show/hide on map" | Floating widget |
| **Query** | ⚡ | "Filter what I see" | Floating widget, Browse tab |
| **Bookmark** | 🔖 | "Remember this specific item" | Browse tab, Map popups |
| **Export** | 📦 | "Package data for download" | Floating widget, Export Builder |

---

## Part 5: Bookmark with Filter (Level 3 Queries)

### The Problem with "Defer to Export"

Originally we proposed deferring Level 3 complexity to export time. But for **exploration workflows** (especially ANiML), users do the query work during browsing:

```
User's Actual Workflow:
───────────────────────
1. Pin Camera Traps layer
2. Browse to Camera CAM-042
3. Filter images: "Mountain Lion" + "2023"
4. See 47 images
5. Think: "I want to save this and compare with fire data"
6. Pin Fire Hazard layer
7. Look at map - see camera location relative to fire perimeters

❌ If we defer: "Sorry, redo that filter at export time"
✅ What user wants: "Save this filter NOW, attached to my bookmark"
```

### The Solution: Bookmark with Filter

For **pointer rows only**, the Browse tab offers two bookmark options:

```
┌─────────────────────────────────────────────────────────────┐
│ 📷 Camera CAM-042                                           │
│    Location: 34.4521, -120.4712                             │
│    Total images: 10,847                                     │
│                                                             │
│ ┌─ Image Filters ─────────────────────────────────────────┐ │
│ │ Species: [Mountain Lion ▼]                              │ │
│ │ Date: [2023-01-01] to [2023-12-31]                      │ │
│ │ Showing: 47 of 10,847 images                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔖 Bookmark Camera]  [🔖 Bookmark with Filter]             │
│                                                             │
│ ───────────────────────────────────────────────────────────  │
│ Filtered Images:                                            │
│  🦁 IMG-2341 - Mountain Lion - Jan 18, 2023                 │
│  🦁 IMG-2897 - Mountain Lion - Feb 3, 2023                  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Two bookmark options:**
- **"Bookmark Camera"** = Save the camera, decide on images later (at export)
- **"Bookmark with Filter"** = Save the camera + current Level 3 query

### How Bookmarks Display Their Context

```
┌─────────────────────────────────────────────────────────────┐
│ 🔖 Bookmarked Items (4)                                     │
│                                                             │
│  📷 CAM-042 → Mountain Lions 2023                           │
│     47 images • [View] [Edit Filter] [✕]                    │
│                                                             │
│  📷 CAM-015                                                 │
│     All images • [View] [✕]                                 │
│                                                             │
│  🌡️ RS-042 → Jan-Mar 2023                                   │
│     90 data points • [View] [Edit Filter] [✕]               │
│                                                             │
│  🐦 Observation #45231                                      │
│     iNaturalist • [View] [✕]                                │
│                                                             │
│ [Export All Bookmarks]                                      │
└─────────────────────────────────────────────────────────────┘
```

The bookmark **shows** its Level 3 query context. Actions:
- **View** = Jump to right sidebar with filter applied
- **Edit Filter** = Adjust the Level 3 query (for pointer rows)
- **✕** = Remove bookmark

### When Level 3 UI Appears

| Row Type | Has Related Data? | Level 3 Filter UI? |
|----------|-------------------|-------------------|
| iNaturalist observation | No | ❌ Just bookmark |
| Fire perimeter | No | ❌ Just bookmark |
| ANiML camera | Yes (images) | ✅ Bookmark with filter option |
| Dendra sensor | Yes (datastream) | ✅ Bookmark with filter option |
| DataOne dataset | Yes (files) | ✅ Bookmark with filter option |

---

## Part 6: The Export Builder

### How Level 3 Filters Simplify Export

Because bookmarks can include their Level 3 filter, the Export Builder is **simpler** - filters are pre-populated:

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Export Builder                                        [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ 📷 ANiML Camera Traps ──────────────────────────────────┐   │
│  │  Current query: North preserve (8 cameras)               │   │
│  │                                                          │   │
│  │  Export: ○ Query results (8)  ● Bookmarked only (2)      │   │
│  │                                                          │   │
│  │  ☑ CAM-042 → Mountain Lions 2023                         │   │
│  │    47 images (156 MB) [Change Filter]                    │   │
│  │                                                          │   │
│  │  ☑ CAM-015                                               │   │
│  │    All 3,241 images (1.2 GB) [Add Filter]                │   │
│  │                                                          │   │
│  │  Include: ☑ Metadata  ☑ Images  ☐ Thumbnails only        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Export Summary:                                                │
│  • 2 cameras, 3,288 images total (1.36 GB)                      │
│                                                                 │
│  [Cancel]                    [Export as ZIP]  [Generate Links]  │
└─────────────────────────────────────────────────────────────────┘
```

- Bookmarks with filters show their pre-saved filter (editable via "Change Filter")
- Bookmarks without filters show "All" with option to "Add Filter"
- User doesn't have to recreate their work

---

## Part 7: Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │ LEFT SIDEBAR│  │        MAP          │  │  RIGHT SIDEBAR  │ │
│  │             │  │                     │  │                 │ │
│  │ Layer list  │  │  ┌───────────────┐  │  │  Layer details  │ │
│  │             │  │  │Floating Widget│  │  │                 │ │
│  │ Action:     │  │  │               │  │  │  Tabs:          │ │
│  │ • Pin 📌    │  │  │ Pinned layers │  │  │  • Overview     │ │
│  │             │  │  │ (with query)  │  │  │  • Browse       │ │
│  │             │  │  │               │  │  │  • Export       │ │
│  │             │  │  │ Actions:      │  │  │                 │ │
│  │             │  │  │ • Toggle 👁️   │  │  │  Browse tab:    │ │
│  │             │  │  │ • Edit query  │  │  │  • Query/filter │ │
│  │             │  │  │ • Remove ✕    │  │  │  • Feature list │ │
│  │             │  │  │               │  │  │  • Bookmark 🔖  │ │
│  │             │  │  │ ─────────────  │  │  │  (with filter   │ │
│  │             │  │  │ Bookmarks 🔖  │  │  │   for pointer   │ │
│  │             │  │  │               │  │  │   rows)         │ │
│  │             │  │  │ [Export All]  │  │  │                 │ │
│  │             │  │  └───────────────┘  │  │                 │ │
│  │             │  │                     │  │                 │ │
│  └─────────────┘  └─────────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 8: Explicit Limits & Scope

### What We ARE Building (V1)

| Feature | Status | Notes |
|---------|--------|-------|
| Pin/Unpin layers | ✅ | Left sidebar |
| Toggle layer visibility | ✅ | Floating widget |
| One active query per layer | ✅ | Overwrites previous, no history |
| Bookmark self-contained rows | ✅ | Simple bookmark |
| Bookmark pointer rows with filter | ✅ | Saves Level 3 query |
| Bookmarks widget/section | ✅ | Shows all bookmarks with context |
| Export Builder | ✅ | Per-layer configuration |
| Bookmark from map popup | ✅ | Consistency with Browse tab |

### What We Are NOT Building (V1)

| Feature | Status | Rationale |
|---------|--------|-----------|
| Saved query snapshots | ❌ V2 | Additive enhancement, not critical for V1 |
| Multiple instances of same layer | ❌ Never | Creates confusing duplicates |
| Nested queries (query a query) | ❌ Never | Overcomplication |
| Cross-layer spatial queries | ❌ Future | "Cameras within fire perimeters" - complex |
| Backend-synced state | ❌ V2+ | localStorage only for now |
| Multiple Level 3 filters per bookmark | ❌ Never | Want different filter? Bookmark again |

### Accepted Constraints

- One active query per pinned layer (no saved snapshots in V1)
- One Level 3 filter per bookmark
- Bookmarks are a flat list (no folders/tags in V1)
- Level 3 UI only appears for pointer rows (self-contained rows just bookmark)

---

## Part 9: User Flow Summary

### Complete User Flow

```
USER'S MENTAL MODEL
═══════════════════

"I want to explore data"
        │
        ▼
┌───────────────────┐
│  FIND A LAYER     │ ──► Left Sidebar: Browse categories
│  (data source)    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  PIN THE LAYER    │ ──► 📌 Pin button
│  (add to my map)  │     Layer appears in floating widget
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  FILTER IT        │ ──► Right Sidebar Browse tab
│  (query what I    │     Apply filters, map updates
│   want to see)    │     ⚡ Filter indicator in widget
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  BOOKMARK ITEMS   │ ──► 🔖 Bookmark button
│  (save specifics) │     For pointer rows: option to
│                   │     include Level 3 filter
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  CROSS-REFERENCE  │ ──► Pin more layers
│  (compare data)   │     View bookmarks alongside
│                   │     other map data
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  EXPORT           │ ──► Export Builder
│  (get my data)    │     📦 Configure & download
└───────────────────┘
```

---

## Part 10: Open Questions (Deferred Decisions)

### To Decide Later

1. **Visual indicator for bookmarked items on map?**
   - Should bookmarked features look different?
   - Proposal: Maybe V2. Keep simple for now.

2. **Bookmark organization (tags/folders)?**
   - Start with flat list
   - Add organization if users request it

3. **Export formats?**
   - Proposal: CSV, GeoJSON, ZIP bundle
   - Details TBD based on data types

4. **"Quick Export" for single items?**
   - Useful for power users
   - Maybe add to Browse tab per-item

---

## Appendix: Technical Notes

### State Structure (V1)

```javascript
const appState = {
  pinnedLayers: [
    {
      id: "camera-traps",
      visible: true,
      activeQuery: { region: "north" }  // One query, overwrites
    }
  ],
  bookmarks: [
    {
      id: "bm-001",
      sourceLayer: "camera-traps",
      featureId: "CAM-042",
      featureLabel: "Camera CAM-042",
      // For pointer rows, optionally includes Level 3 filter:
      relatedDataQuery: { species: "mountain lion", year: 2023 }
    },
    {
      id: "bm-002",
      sourceLayer: "inaturalist",
      featureId: "obs-45231",
      featureLabel: "Observation #45231"
      // Self-contained row: no relatedDataQuery field
    }
  ]
};
```

### V2 Extension (Future)

```javascript
// Adding saved queries is just adding an array:
pinnedLayer.savedQueries = [
  { name: "North Preserve", query: { region: "north" } },
  { name: "Coastal Cameras", query: { region: "coastal" } }
]
pinnedLayer.activeQueryName = "North Preserve"  // Track which is active
```

---

**Document Author:** Will (with Claude assistance)  
**Last Updated:** January 21, 2026  
**Status:** V1 Scope Defined - Ready for Implementation
