# Mockup Review Email Draft: V2 Layout & Pin/Bookmark Paradigm

**TO:** Team  
**SUBJECT:** Please Review: Data Catalog V2 Mockups - Layout & Interaction Patterns  
**ATTACHMENTS:** `02a-unified-layout.html`, `02b-browse-inaturalist.html`, `02c-browse-animl.html`, `02d-browse-dendra.html`, `02e-browse-dataone.html`, `02f-export-builder.html`

---

## Hi Team,

I've attached six HTML mockups demonstrating our proposed V2 layout and interaction patterns for the Dangermond Preserve Data Catalog. **Please open each file in a browser** and take 10-15 minutes to explore them.

I'm looking for a **gut check** on:
1. The overall website layout (left sidebar, right sidebar, two floating widgets)
2. The "Pin Layers" and "Bookmark Features" paradigm
3. Whether the UI logic feels consistent across different data sources

---

## The Forest & Tree Analogy 🌲

Imagine a scientist interested in studying a forest. They'd want to do two things:

1. **Climb to the top of a tree** to see the entire forest — all the other trees, the landscape, how everything connects
2. **Inspect the tree trunk up close** — examine the bark, count the rings, observe the details

Our new layout follows this analogy:

| View | Location | Purpose |
|------|----------|---------|
| **Forest View** 🌲🌲🌲 | **Left Sidebar** | High-level browsing. See all categories, all layers. Select and pin what you want to explore. |
| **Tree Trunk View** 🪵 | **Right Sidebar** | Low-level detail. Inspect the layer you've selected. Browse rows, apply filters, bookmark specific items. |

The left sidebar lets you see the whole data landscape. The right sidebar lets you zoom in on specifics.

### Floating Widgets — Your Workspace

Floating over the map, we have **two separate widgets** that summarize what you've collected:

| Widget | Position | Purpose |
|--------|----------|---------|
| 📌 **Pinned Layers** | **Top-Left** | Shows layers you've added to the map. Aligned with the left sidebar (where you pin layers). |
| 🔖 **Bookmarked Items** | **Top-Right** | Shows individual rows/features you've saved. Aligned with the right sidebar (where you view row details). |

This separation reinforces the mental model: **left = layers (tables), right = features (rows)**.

---

## The Three-Level Data Hierarchy

Our data follows a three-level hierarchy, and understanding this is key to understanding our UI:

```
┌─────────────────────────────────────────────────────────────────────┐
│  LEVEL 1: LAYERS (Tables)                                           │
│  ───────────────────────────                                        │
│  A layer is a collection of items you can pin to the map.           │
│  Example: "iNaturalist Observations" with 12,430 rows               │
│                                                                     │
│  Actions: PIN (unpin) · QUERY (filter) · TOGGLE VISIBILITY          │
│                                                                     │
│  Pinning a layer = adding it to your workspace                      │
│  Querying a layer = filtering which rows are visible                │
│  (e.g., filtering 12,430 observations down to 847 bird sightings)   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LEVEL 2: FEATURES / ROWS (Individual Items)                        │
│  ───────────────────────────────────────────                        │
│  A feature is a single item from a layer you can bookmark.          │
│  Example: "Western Bluebird observation #48291"                     │
│                                                                     │
│  Actions: BOOKMARK · VIEW DETAILS                                   │
│                                                                     │
│  Bookmarking = saving a specific item for later                     │
│  (like bookmarking a page in a book)                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (some data sources only)
┌─────────────────────────────────────────────────────────────────────┐
│  LEVEL 3: RELATED DATA (Nested/Child Data)                          │
│  ───────────────────────────────────────────                        │
│  Some features have related data you can filter.                    │
│  Example: Camera CAM-042 → 3,241 images                             │
│                                                                     │
│  Actions: QUERY (filter the related data)                           │
│                                                                     │
│  Not all features have Level 3 data.                                │
│  Not all Level 3 data is queryable.                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Pinning vs. Bookmarking — The Key Distinction

| Action | What it does | Analogy |
|--------|--------------|---------|
| **📌 Pin a Layer** | Adds an entire table/collection to your map | Pinning a book to your desk — it's there, you can flip through all its pages |
| **🔖 Bookmark a Feature** | Saves one specific row/item for later | Bookmarking a single page — you want to come back to this exact spot |

**Important:** You pin a **layer** (multiple items, a table). You bookmark a **feature** (single item, one row).

---

## Data Source Comparison

Different data sources have different capabilities at each level:

| Data Source | Level 1 (Layer) | Level 2 (Features) | Level 3 (Related Data) |
|-------------|-----------------|-------------------|------------------------|
| **iNaturalist** | ✅ Pin & Query | ✅ Bookmark | ❌ None — observations are self-contained |
| **ANiML** | ✅ Pin & Query cameras | ✅ Bookmark cameras | ✅ Query images (species, date) |
| **Dendra** | ✅ Pin & Query sensors | ✅ Bookmark sensors | ✅ Query time series (date range) |
| **DataOne** | ✅ Pin & Query datasets | ✅ Bookmark datasets | ⚠️ Has files, but not queryable* |

*DataOne datasets have associated files, but the file structure is too complex to expose querying at this stage. Users bookmark the whole dataset.

### Visual Examples

**iNaturalist (Self-Contained Rows):**
```
Layer: iNaturalist Observations
    └── Feature: Western Bluebird #48291
        └── (no related data — the observation IS the data)
```

**ANiML (Pointer Rows → Queryable Related Data):**
```
Layer: ANiML Cameras (8 pinned, filtered to "North preserve")
    └── Bookmark: CAM-042
        └── Related: 3,241 images
            └── Query: "Mountain Lion, 2023" → 47 images
```

**Dendra (Pointer Rows → Queryable Time Series):**
```
Layer: Dendra Rain Sensors (12 pinned)
    └── Bookmark: RS-042 (Jalama Rain)
        └── Related: 2 years of data points
            └── Query: "Jan-Mar 2023" → 90 data points
```

**DataOne (Pointer Rows → Non-Queryable Files):**
```
Layer: DataOne Datasets (47 pinned, filtered to "Marine, 2020-2023")
    └── Bookmark: Marine Biodiversity Study
        └── Related: 3 files (CSV, PDF, ZIP)
            └── (no query — download files directly)
```

---

## Mockup Guide: What to Look At in Each File

### 02a: Unified Layout Overview
**Purpose:** Shows the overall layout with all zones active.

🔴 **Look at:**
- Left sidebar with all 13 TNC categories (alphabetically ordered)
- Separator line before "Research Datasets (All Categories)"
- **Pinned Layers widget (top-left)** — aligned with left sidebar where you pin layers
- **Bookmarked Items widget (top-right)** — aligned with right sidebar where you view row details

### 02b: Browse iNaturalist
**Purpose:** Shows the simplest case — self-contained rows with no Level 3.

🔴 **Look at:**
- Right sidebar Browse tab with observation cards
- How observations are bookmarked directly (no nested filtering)
- Query indicator on the pinned layer showing filter applied

### 02c: Browse ANiML
**Purpose:** Shows pointer rows with dual-level filters (cameras + images).

🔴 **Look at:**
- Browse tab showing camera cards as pointer rows
- Images-first gallery view
- How bookmarking a camera gives you Level 3 filtering options

### 02d: Browse Dendra
**Purpose:** Shows pointer rows with time-series filtering.

🔴 **Look at:**
- Sensor cards with "View Datastreams" action
- Time range picker for Level 3 filtering
- Chart preview of sensor data

### 02e: Browse DataOne
**Purpose:** Shows pointer rows where Level 3 exists but isn't queryable.

🔴 **Look at:**
- Dataset cards showing file counts but not exposing file filtering
- Version history dropdown
- How bookmarks work without Level 3 query capability

### 02f: Export Builder
**Purpose:** Shows how all bookmark types converge in the export flow.

🔴 **Look at:**
- Each data source section with its export options
- Different filtering capabilities exposed for each source
- How the summary shows estimated export size

---

## Questions for You

1. **Layout:** Does the left sidebar / right sidebar split feel intuitive? Does it make sense as "forest view" vs "tree trunk view"?

2. **Pinning Layers:** Is it clear that pinning adds a layer to your workspace, and that you can filter (query) pinned layers?

3. **Bookmarking Features:** Is the distinction between pinning (tables) and bookmarking (rows) clear? Any concern this might confuse users?

4. **Level 3 Filtering:** For ANiML and Dendra, the bookmarked feature has related data you can filter. Does this feel natural or overwhelming?

5. **Two Floating Widgets:** We've separated the Pinned Layers widget (top-left) from the Bookmarked Items widget (top-right). Does this separation feel right? Is it clear which widget is which?

6. **Cross-Category Section:** DataOne appears at the bottom under "Research Datasets (All Categories)" since it spans many categories. Does this placement make sense?

---

## Risks & Concerns

**Complexity Risk:** This is not a simple UI. We have three levels of data, two types of actions (pin vs bookmark), and different data sources behaving differently at Level 3. We need to be very careful about:
- Making the distinction between pin and bookmark obvious
- Not overwhelming users with too many options
- Keeping the UI consistent even when capabilities differ

**Current Mitigation:** 
- Clear visual language (📌 pin icon for layers, 🔖 bookmark badge for features)
- Consistent placement (left sidebar = browse categories & layers, right sidebar = row details)
- **Two separate floating widgets aligned with their respective sidebars:**
  - 📌 Pinned Layers widget (top-left) — matches left sidebar's "what to add to the map"
  - 🔖 Bookmarked Items widget (top-right) — matches right sidebar's "inspect individual rows"

---

Please reply with your thoughts, concerns, or questions. I'd love to get alignment before we start implementation.

Thanks!

---

*Mockups generated: January 2026*  
*Development Plan: `docs/development_plans/v2-pin-bookmark-export-mockup-plan.md`*
