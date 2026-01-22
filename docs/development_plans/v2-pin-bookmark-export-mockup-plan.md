# V2 Mockup Plan: Pin → Query → Bookmark → Export Paradigm

**Created:** January 21, 2026  
**Target Presentation:** Jack Dangermond Demo  
**Status:** ✅ Core Complete (6/6) • 🔜 DataOne Detail View Planned  
**Paradigm Doc:** `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md`

---

## Progress Summary

**Completed Mockups:** ✅ 6 / 6 Core Mockups • 🔜 1 Enhancement Planned

| Mockup | Status | Purpose |
|--------|--------|---------|
| **02a** | ✅ Complete | Unified layout with floating widget (pinned + bookmarks) |
| **02b** | ✅ Complete | iNaturalist Browse (self-contained rows) |
| **02c** | ✅ Complete | ANiML Browse (pointer rows + dual-level filters) |
| **02d** | ✅ Complete | Dendra Browse (pointer rows + Level 3 datastream + floating chart) |
| **02e** | ✅ Complete | DataOne Browse (pointer rows, no Level 3) |
| **02e+** | 🔜 Planned | DataOne Detail View (drill-down with full metadata) |
| **02f** | ✅ Complete | Export Builder (all bookmark types together) |

**Key Achievements:**
- ✅ Demonstrated three-level hierarchy (Layer → Feature → Related Data)
- ✅ Self-contained vs. pointer row patterns clear
- ✅ Level 3 filtering shown in two contexts (ANiML images, Dendra time series)
- ✅ Floating time series panel integrated without overlap
- ✅ DataOne pointer pattern complete (simple bookmark, no Level 3)
- ✅ Export Builder shows all bookmark types converging in single workflow
- 🔜 DataOne detail view planned (completes drill-down pattern consistency)

---

## What Changed

The previous mockups (`01-full-layout-overview.html`) demonstrated **pinning layers**. This new set of mockups demonstrates the complete **three-level hierarchy**:

```
V1 Mockups (Previous):           V2 Mockups (This Plan):
──────────────────────           ────────────────────────
• Pin layers ✓                   • Pin layers ✓
• Toggle visibility ✓            • Toggle visibility ✓
• (that's it)                    • Query pinned layers ✓
                                 • Bookmark features ✓
                                 • Bookmark with Level 3 filter ✓
                                 • Export Builder ✓
```

---

## The Three-Level Hierarchy

```
Level 1: LAYER
    ├── PIN: Add to map
    ├── QUERY: Filter what's visible (one active query)
    │
    └── Level 2: FEATURE (Row)
            │
            ├── Self-Contained Row → BOOKMARK (simple)
            │   Examples: iNaturalist observation, fire perimeter
            │
            └── Pointer Row → BOOKMARK or BOOKMARK WITH FILTER
                │   Examples: ANiML camera, Dendra sensor, DataOne dataset
                │
                └── Level 3: RELATED DATA
                    └── QUERY: Filter attached to bookmark
                        Examples: Mountain lion images, Q1 2023 datastream
```

---

## Mockups to Build

### Overview

| Mockup | Purpose | Data Sources Shown |
|--------|---------|-------------------|
| **02a** | Unified Layout + Floating Widget | All (pinned layers + bookmarks) |
| **02b** | Browse Tab: iNaturalist | Self-contained rows |
| **02c** | Browse Tab: ANiML Cameras | Pointer rows with image gallery |
| **02d** | Browse Tab: Dendra Sensors | Pointer rows with time series |
| **02e** | Browse Tab: DataOne | Pointer rows with file lists |
| **02f** | Export Builder | All bookmark types together |

**🔴 REQUIREMENT: All mockups must include complete left sidebar structure**
- All 13 primary TNC categories (alphabetical order)
- Separator line
- "Research Datasets (All Categories)" section with DataOne
- See "Mockup 02a" for reference structure

---

## Mockup 02a: Unified Layout with Floating Widget

**Purpose:** Show the consistent shell that works for ALL data sources.

**What's Consistent:**
- Left sidebar (categories, layers, pin button)
- Floating widget (pinned layers + bookmarks)
- Right sidebar tabs (Overview | Browse | Export)

**Left Sidebar Structure:**

All mockups must include the complete category structure from the live site:

```
🗺️ Boundaries
🌍 Earth Observations  
⛰️ Elevation and Bathymetry
🔥 Fire
💧 Freshwater
🏗️ Infrastructure
🌿 Land Cover
🌊 Oceans and Coasts
🔬 Research and Sensor Equipment
🪨 Soils and Geology
🦎 Species
⚠️ Threats and Hazards
🌤️ Weather and Climate
───────────────────────────────────
🔬 Research Datasets (All Categories)
   └── 📊 DataOne Datasets
```

**Key Points:**
- Categories in alphabetical order
- Separator line before cross-category section
- "Research Datasets (All Categories)" clearly labeled
- Each category shows layer count badge

**Floating Widget:**

```
┌─────────────────────────────────────────────────────────────┐
│  🗺️ Map Layers                                        [−]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📌 Pinned Layers (4)                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️ 🦎 iNaturalist Observations                      │   │
│  │    ⚡ Filtered: Birds, 2023 (847 of 12,430)         │   │
│  │    [Edit Query] [Clear]                     [✕]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️ 📷 ANiML Camera Traps                            │   │
│  │    ⚡ Cameras: North preserve (8 of 42)             │   │
│  │    ⚡ Images: Mountain Lion, 2023 (127 total)       │   │
│  │    [Edit Query] [Clear]                     [✕]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️ 🌡️ Dendra: Rain Sensors                          │   │
│  │    No filter applied (12 sensors)                   │   │
│  │    [Add Query]                              [✕]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️ 🔬 DataOne Datasets                              │   │
│  │    ⚡ Filtered: Marine, 2020-2023 (47 of 876)       │   │
│  │    [Edit Query] [Clear]                     [✕]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🔖 Bookmarked Items (5)                                    │
│                                                             │
│  🐦 Observation #45231                                      │
│     iNaturalist • [View] [✕]                                │
│                                                             │
│  📷 CAM-042 → Mountain Lions 2023                           │
│     ANiML • 47 images • [View] [✕]                          │
│                                                             │
│  📷 CAM-015                                                 │
│     ANiML • All images • [View] [✕]                         │
│                                                             │
│  🌡️ RS-042 → Jan-Mar 2023                                   │
│     Dendra • 90 points • [View] [✕]                         │
│                                                             │
│  📄 Marine Biodiversity Study                               │
│     DataOne • [View] [✕]                                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  [📦 Export All]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- All pinned layers show same structure: icon, name, query indicator, actions
- All bookmarks show same structure: icon, label, source, context (if Level 3 filter), actions
- Clicking a pinned layer or bookmark → Right sidebar shows that item

**File:** `mockups/02a-unified-layout.html`

---

## Mockup 02b: Browse Tab - iNaturalist (Self-Contained Rows)

**Purpose:** Show how self-contained rows work - simple bookmark, no Level 3.

**Row Type:** Self-contained (the observation IS the data)

**Browse Tab:**

```
┌─────────────────────────────────────────────────────────────┐
│  🦎 iNaturalist Observations                                │
│  Community science biodiversity observations                │
├─────────────────────────────────────────────────────────────┤
│  [Overview]  [Browse]  [Export]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Filter Observations ────────────────────────────────┐   │
│  │ Taxon: [Birds ▼]                                     │   │
│  │ Species: [All species ▼]                             │   │
│  │ Date: [2023-01-01] to [2023-12-31]                   │   │
│  │ Research grade only: ☑                               │   │
│  │                                                      │   │
│  │ Showing: 847 of 12,430 observations                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Results:                                                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🦅 Red-tailed Hawk                                     │ │
│  │ Observed by: jsmith • Jan 15, 2023                     │ │
│  │ Location: 34.4521, -120.4712                           │ │
│  │                                                        │ │
│  │ [View on Map]  [🔖 Bookmark]  [Open in iNat ↗]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🦉 Great Horned Owl                                    │ │
│  │ Observed by: birdwatcher22 • Feb 3, 2023               │ │
│  │ Location: 34.4498, -120.4689                           │ │
│  │                                                        │ │
│  │ [View on Map]  [🔖 Bookmark]  [Open in iNat ↗]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (845 more)                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Only `[🔖 Bookmark]` button - no "Bookmark with Filter" (no Level 3)
- Each observation is self-contained
- Bookmark saves just the observation reference

**File:** `mockups/02b-browse-inaturalist.html`

---

## Mockup 02c: Browse Tab - ANiML Cameras (Images-First Browsing)

**Purpose:** Show how users browse camera trap images with minimal friction.

**Row Type:** Pointer (camera points to image archive)

### ⚠️ KEY INSIGHT: Images-First Browsing

> **The sooner we take users to actual camera trap images, the better.**

The previous dual-level filter approach buried images behind too many filter steps. The new approach uses **two entry points** that both lead directly to images:

**Two Workflows:**
1. **By Animal**: Choose animal tag → See all images → Optionally filter by camera
2. **By Camera**: Choose camera → See all images → Optionally filter by animal

**The Key Shift:**
```
OLD: Filter → Filter → See images (images buried behind 2 decisions)
NEW: Choose ONE thing → See images → Optionally filter (1 click to images)
```

### Browse Tab - Layer View WITH Dual-Level Filters

```
┌─────────────────────────────────────────────────────────────┐
│  📷 ANiML Camera Traps                                      │
│  Wildlife camera network across the preserve                │
├─────────────────────────────────────────────────────────────┤
│  [Overview]  [Browse]  [Export]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Filter Cameras ─────────────────────────────────────┐   │
│  │ Region: [North Preserve ▼]                           │   │
│  │ Status: [Active ▼]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Filter Images (applies to ALL cameras) ─────────────┐   │
│  │ Species: [Mountain Lion ▼]                           │   │
│  │ Date: [2023-01-01] to [2023-12-31]                   │   │
│  │ Time of day: [Any ▼]                                 │   │
│  │                                                      │   │
│  │ ℹ️ This filter will apply to all cameras below       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Showing: 8 cameras • 127 total mountain lion images │    │
│  │                                                      │    │
│  │  [📌 Pin Layer with Query]                           │    │
│  │  ↑ Saves BOTH camera filter + global image filter    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Matching Cameras:                                          │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📷 CAM-042 • 47 mountain lion images                   │ │
│  │ North Ridge • Active                                   │ │
│  │                                                        │ │
│  │ [View Camera →]  [🔖 Bookmark with Current Filter]     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📷 CAM-015 • 23 mountain lion images                   │ │
│  │ Valley Floor • Active                                  │ │
│  │                                                        │ │
│  │ [View Camera →]  [🔖 Bookmark with Current Filter]     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📷 CAM-028 • 18 mountain lion images                   │ │
│  │ Coastal Bluff • Active                                 │ │
│  │                                                        │ │
│  │ [View Camera →]  [🔖 Bookmark with Current Filter]     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (5 more cameras)                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Saved Where

| User Action | What's Saved | Map Shows | Export Includes |
|-------------|--------------|-----------|-----------------|
| **Pin Layer with Query** | Layer + camera filter + global image filter | 8 camera icons on map | All 127 mountain lion images across all 8 cameras |
| **Bookmark with Current Filter** (CAM-042) | Individual camera + image filter | (nothing new on map) | 47 mountain lion images from CAM-042 only |

### Browse Tab - Camera Detail View (drill-down)

When user clicks "View Camera →", they see the camera detail with the global filter pre-applied:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Cameras                                          │
│                                                             │
│  📷 Camera CAM-042                                          │
│  North Ridge • 34.4521, -120.4712 • Active                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total images: 10,847                                       │
│  Date range: Jan 2020 - Present                             │
│                                                             │
│  ┌─ Filter Images ──────────────────────────────────────┐   │
│  │ Species: [Mountain Lion ▼]   ← Pre-filled from layer │   │
│  │ Date: [2023-01-01] to [2023-12-31]                   │   │
│  │ Time of day: [Any ▼]                                 │   │
│  │                                                      │   │
│  │ Showing: 47 of 10,847 images                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [🔖 Bookmark Camera]  [🔖 Bookmark with Filter]            │
│                        ↑ Saves current filter for this      │
│                          camera specifically                │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Filtered Images:                                           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🦁       │ │ 🦁       │ │ 🦁       │ │ 🦁       │       │
│  │ IMG-2341 │ │ IMG-2897 │ │ IMG-3102 │ │ IMG-3455 │       │
│  │ Jan 18   │ │ Feb 3    │ │ Mar 12   │ │ Apr 7    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ... (43 more images)                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Model for Layer with Global Image Filter

```javascript
// Pinned layer with dual-level query
pinnedLayer: {
  id: "camera-traps",
  name: "ANiML Camera Traps",
  activeQuery: {
    // Level 2: Camera attributes
    cameraFilter: {
      region: "north",
      status: "active"
    },
    // Level 3: Image attributes (applied globally to ALL cameras)
    globalImageFilter: {
      species: "mountain lion",
      year: 2023
    }
  },
  featureCount: { cameras: 8, images: 127 }
}
```

### Key Points

1. **Dual-level filters at layer browse level** - Both camera AND image filters shown
2. **Global image filter** - Applies to all cameras in result
3. **"Pin Layer with Query"** - Saves both filter levels
4. **Camera cards show image counts** - "47 mountain lion images" not "10,847 total images"
5. **Drill-down inherits filter** - When viewing camera detail, filter is pre-applied
6. **Still can bookmark individual cameras** - For when you want just one camera's filtered images

### ⚠️ Important: Bookmarks Are Independent of Layer Query

**Bookmarks persist even when the user changes the layer's current filter.**

```
Scenario:
1. Layer filter: "Mountain Lions 2023" → shows 8 cameras
2. User bookmarks CAM-042 with "Mountain Lions 2023" filter
3. User changes layer filter to "Deer 2024" → shows 12 different cameras
4. Bookmark "CAM-042 → Mountain Lions 2023" STILL EXISTS
   → Independent of current layer state
   → Can be viewed/exported regardless of layer filter
```

This is critical for:
- **Accumulating research** - bookmark interesting finds while exploring
- **Cross-referencing** - compare bookmarked items with different layer views
- **Export flexibility** - export bookmarks separately from layer query

The same applies to **DataOne bookmarks** - they persist regardless of how the user changes the search/filter on the DataOne layer.

### Why This Matters

Without this pattern:
- User pins layer, queries cameras, sees 8 cameras
- Opens CAM-042, filters for mountain lions, bookmarks with filter
- Opens CAM-015, filters for mountain lions, bookmarks with filter
- ... repeats 8 times
- Export: select all 8 bookmarks

With this pattern:
- User pins layer, queries cameras AND images in one go
- "Pin Layer with Query" saves everything
- Export: just export the pinned layer
- **OR** user can still bookmark individual cameras if they want granular control

**File:** `mockups/02c-browse-animl.html`

---

## Mockup 02d: Browse Tab - Dendra Sensors (Pointer → Datastream)

**Purpose:** Show how pointer rows work with Level 3 filter on time series.

**Row Type:** Pointer (sensor points to datastream)

**Browse Tab - Layer View (list of sensors):**

```
┌─────────────────────────────────────────────────────────────┐
│  🌡️ Dendra: Rain Sensors                                    │
│  Precipitation monitoring network                           │
├─────────────────────────────────────────────────────────────┤
│  [Overview]  [Browse]  [Export]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Filter Sensors ─────────────────────────────────────┐   │
│  │ Region: [All ▼]                                      │   │
│  │ Status: [Active ▼]                                   │   │
│  │                                                      │   │
│  │ Showing: 12 of 12 sensors                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Sensors:                                                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🌡️ RS-042 (Rain Gauge)                                 │ │
│  │ North Ridge • Active                                   │ │
│  │ Last reading: 0.2 mm • 5 min ago                       │ │
│  │                                                        │ │
│  │ [View Sensor Details →]                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🌡️ RS-018 (Rain Gauge)                                 │ │
│  │ Valley Floor • Active                                  │ │
│  │ Last reading: 0.0 mm • 5 min ago                       │ │
│  │                                                        │ │
│  │ [View Sensor Details →]                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (10 more sensors)                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Browse Tab - Sensor Detail View (with time series):**

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Sensors                                          │
│                                                             │
│  🌡️ Sensor RS-042 (Rain Gauge)                              │
│  North Ridge • 34.4521, -120.4712 • Active                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current: 0.2 mm • Updated: 5 min ago                       │
│  Data range: Jan 2019 - Present                             │
│                                                             │
│  ┌─ Filter Datastream (Level 3) ────────────────────────┐   │
│  │ Time range: [2023-01-01] to [2023-03-31]             │   │
│  │ Aggregation: [Daily average ▼]                       │   │
│  │                                                      │   │
│  │ Showing: 90 data points                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [🔖 Bookmark Sensor]  [🔖 Bookmark with Time Range]        │
│                        ↑ Saves Level 3 query                │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Datastream Preview:                                        │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     📈 Rainfall - Daily Average                        │ │
│  │  mm                                                    │ │
│  │  15│         ▄                                         │ │
│  │  10│      ▄▄▄█▄▄      ▄                                │ │
│  │   5│   ▄▄▄█████▄▄▄▄▄▄▄█▄▄▄                             │ │
│  │   0└─────────────────────────────                      │ │
│  │     Jan       Feb       Mar                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [View Full Chart]  [Download CSV]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Two-level Browse: Sensors list → Sensor detail
- Level 3 filter = time range + aggregation
- Chart preview shows filtered data
- "Bookmark with Time Range" saves the time query

**File:** `mockups/02d-browse-dendra.html`

---

## Mockup 02e: Browse Tab - DataOne (Pointer → Files)

**Purpose:** Show how DataOne datasets work - pointer rows but typically no Level 3 filter.

**Row Type:** Pointer (dataset points to files), but filtering files is rare

**⚠️ Critical: Cross-Category Context**

DataOne appears under "Research Datasets (All Categories)" in the left sidebar because it contains datasets across ALL TNC categories. The right sidebar must clearly communicate this:

```
Right Sidebar Header:
┌──────────────────────────────────────────┐
│ 📊 DataOne Datasets                      │
│ Research data across all categories      │
└──────────────────────────────────────────┘
```

This prevents confusion: users understand they're filtering by TNC category WITHIN the DataOne collection, not viewing a category-specific layer.

### Browse Tab - Dataset List View

```
┌─────────────────────────────────────────────────────────────┐
│  🔬 DataOne Datasets                                        │
│  Research datasets from the DataOne repository              │
├─────────────────────────────────────────────────────────────┤
│  [Overview]  [Browse]  [Export]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Search & Filter Datasets ───────────────────────────┐   │
│  │ Search: [marine biodiversity_______________]         │   │
│  │ Category: [Marine ▼]                                 │   │
│  │ Date range: [2020] to [2023]                         │   │
│  │ Author: [Any ▼]                                      │   │
│  │                                                      │   │
│  │ Showing: 47 of 876 datasets                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Results:                                                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📄 Marine Biodiversity Assessment - Point Conception   │ │
│  │ Smith, J. et al. • 2020                                │ │
│  │ "Comprehensive survey of marine species diversity      │ │
│  │ along the Point Conception coastline..."               │ │
│  │                                                        │ │
│  │ Files: 3 (observations.csv, report.pdf, metadata.xml)  │ │
│  │                                                        │ │
│  │ [🔖 Bookmark]  [Details →]  [Open in DataOne ↗]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📄 Coastal Erosion Monitoring - Gaviota                │ │
│  │ Chen, M. et al. • 2021                                 │ │
│  │ "Long-term monitoring of coastal erosion rates and     │ │
│  │ sediment transport patterns..."                        │ │
│  │                                                        │ │
│  │ Files: 12 (imagery/, measurements.csv, shapefiles/)    │ │
│  │                                                        │ │
│  │ [🔖 Bookmark]  [Details →]  [Open in DataOne ↗]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (45 more datasets)                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Browse Tab - Dataset Detail View (drill-down)

When user clicks "Details →", the right sidebar switches to detail view:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Datasets                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🌊 Marine Biodiversity Assessment                   │    │
│  │    Point Conception                                 │    │
│  │                                                     │    │
│  │    Smith, J., Garcia, A., Johnson, R. • 2020       │    │
│  │    doi: 10.5063/F1Z60PZP                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Description                                                │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  Comprehensive survey of marine species diversity along     │
│  the Point Conception coastline, including intertidal       │
│  zones and kelp forest ecosystems. This study documents     │
│  seasonal variation in species abundance and distribution   │
│  patterns across multiple sampling sites.                   │
│                                                             │
│  Funded by: National Science Foundation                     │
│  Project: Dangermond Preserve Baseline Studies              │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Files (3)                                                  │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 observations.csv                            2.4 MB │ │
│  │    Species occurrence records with coordinates        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📄 report.pdf                                  1.8 MB │ │
│  │    Final technical report with methodology            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📋 metadata.xml                               12 KB   │ │
│  │    EML metadata record                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Spatial Coverage                                           │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  Bounding Box: 34.42°N to 34.51°N, 120.38°W to 120.52°W    │
│  [View on Map]                                              │
│                                                             │
│  ───────────────────────────────────────────────────────────│
│  Keywords                                                   │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  [marine] [biodiversity] [intertidal] [kelp forest]         │
│  [Point Conception] [species survey]                        │
│                                                             │
│  ═══════════════════════════════════════════════════════════│
│                                                             │
│  [🔖 Bookmark Dataset]                                      │
│                                                             │
│  [Open in DataOne ↗]  [Copy DOI]  [Cite]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. Navigation Pattern:**
- "← Back to Datasets" button at top (consistent with ANiML cameras, Dendra sensors)
- Clicking back returns to list view **with filters preserved**
- Filter state persists across detail view navigation

**2. What the Detail View Shows:**
| Section | Content | Why |
|---------|---------|-----|
| **Header** | Title, authors, year, DOI badge | Quick identification |
| **Description** | Full abstract (not truncated) | Complete context for decision-making |
| **Files** | All files with size and descriptions | Let user assess what's included |
| **Spatial Coverage** | Bounding box + "View on Map" link | Geographic context |
| **Keywords** | Clickable tags | Help users find related datasets |
| **Actions** | Bookmark, Open in DataOne, Copy DOI, Cite | Complete workflow support |

**3. Why NOT an iframe embed?**
- DataOne pages are complex and may not render well in a narrow sidebar
- External auth/session issues
- Better to show curated summary + link to full DataOne page
- Keeps the UI consistent with other data sources

**4. Filter Persistence Behavior:**
```
User Flow:
1. Search: "marine biodiversity", Category: Marine, Years: 2020-2023
2. Results show 47 datasets
3. User clicks "Details →" on Marine Biodiversity Assessment
4. Detail view shows → User clicks "← Back to Datasets"
5. Filters still applied → Still showing 47 datasets
6. User can continue browsing without re-entering filters
```

**5. Key Difference from ANiML/Dendra:**
- **No Level 3 filter** - DataOne datasets are bookmarked whole
- **No "Bookmark with Filter"** - Only simple `[🔖 Bookmark Dataset]`
- Files are browseable for context but not individually bookmarkable

### Data Model

```javascript
// Dataset object (from ArcGIS Feature Service or DataOne API)
dataset: {
  id: "urn:uuid:abc123...",
  title: "Marine Biodiversity Assessment - Point Conception",
  authors: ["Smith, J.", "Garcia, A.", "Johnson, R."],
  year: 2020,
  doi: "10.5063/F1Z60PZP",
  abstract: "Comprehensive survey of marine species...",
  keywords: ["marine", "biodiversity", "intertidal", ...],
  files: [
    { name: "observations.csv", size: "2.4 MB", description: "Species records" },
    { name: "report.pdf", size: "1.8 MB", description: "Technical report" },
    { name: "metadata.xml", size: "12 KB", description: "EML metadata" }
  ],
  boundingBox: {
    north: 34.51, south: 34.42,
    east: -120.38, west: -120.52
  },
  dataoneUrl: "https://search.dataone.org/view/urn:uuid:abc123..."
}

// Bookmark (simple, no Level 3 filter)
bookmark: {
  id: "bm-dataone-123",
  type: "dataone-dataset",
  datasetId: "urn:uuid:abc123...",
  title: "Marine Biodiversity Assessment",
  authors: "Smith et al. 2020"
  // No filter property - entire dataset is bookmarked
}
```

**Key Points:**
- Two-level Browse: Dataset list → Dataset detail (consistent with ANiML, Dendra)
- Only `[🔖 Bookmark]` - no "Bookmark with Filter" (no Level 3)
- User bookmarks entire dataset, not filtered files
- Detail view shows full context: description, files, spatial coverage, keywords
- Actual data access via "Open in DataOne" external link
- Filter state preserved when navigating between list and detail views

**File:** `mockups/02e-browse-dataone.html`

---

## Mockup 02f: Export Builder

**Purpose:** Show all bookmark types coming together in export.

**Export Builder Modal:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Export Builder                                        [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You have 4 pinned layers and 5 bookmarked items.               │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  ┌─ 🦎 iNaturalist Observations ────────────────────────────┐   │
│  │  Filter: Birds, 2023 (847 observations)                  │   │
│  │                                                          │   │
│  │  ● Export filtered results (847)                         │   │
│  │  ○ Export bookmarked only (1)                            │   │
│  │  ○ Skip                                                  │   │
│  │                                                          │   │
│  │  Format: ☑ CSV  ☐ GeoJSON                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 📷 ANiML Camera Traps ──────────────────────────────────┐   │
│  │  Camera filter: North preserve (8 of 42 cameras)         │   │
│  │  Image filter: Mountain Lion, 2023 (127 images total)    │   │
│  │                                                          │   │
│  │  ● Export filtered results (8 cameras, 127 images)       │   │
│  │  ○ Export bookmarked only (2 cameras)                    │   │
│  │  ○ Skip                                                  │   │
│  │                                                          │   │
│  │  [Change Camera Filter]  [Change Image Filter]           │   │
│  │                                                          │   │
│  │  ─────────────────────────────────────────────────────   │   │
│  │  Or export specific bookmarks instead:                   │   │
│  │                                                          │   │
│  │  ☐ CAM-042 → Mountain Lions 2023                         │   │
│  │    47 images (156 MB) [Change Filter]                    │   │
│  │  ☐ CAM-015 (all images)                                  │   │
│  │    3,241 images (1.2 GB) [Add Filter]                    │   │
│  │                                                          │   │
│  │  Include: ☑ Metadata  ☑ Images  ☐ Thumbnails only        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 🌡️ Dendra: Rain Sensors ────────────────────────────────┐   │
│  │  No filter (12 sensors)                                  │   │
│  │                                                          │   │
│  │  ○ Export all sensors                                    │   │
│  │  ● Export bookmarked only (1 sensor)                     │   │
│  │  ○ Skip                                                  │   │
│  │                                                          │   │
│  │  Bookmarked:                                             │   │
│  │  ☑ RS-042 → Jan-Mar 2023                                 │   │
│  │    90 data points [Change Time Range]                    │   │
│  │                                                          │   │
│  │  Include: ☑ Metadata  ☑ Datastream CSV                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 🔬 DataOne Datasets ────────────────────────────────────┐   │
│  │  Filter: Marine, 2020-2023 (47 datasets)                 │   │
│  │                                                          │   │
│  │  ○ Export filtered results (47 datasets)                 │   │
│  │  ● Export bookmarked only (1 dataset)                    │   │
│  │  ○ Skip                                                  │   │
│  │                                                          │   │
│  │  Bookmarked:                                             │   │
│  │  ☑ Marine Biodiversity Study                             │   │
│  │                                                          │   │
│  │  Include: ☑ Metadata  ☑ File links  ☐ Download files     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  Export Summary:                                                │
│  ─────────────────────────────────────────────────────────────  │
│  • 847 bird observations (CSV)                                  │
│  • 8 cameras: 127 mountain lion images (48 MB)                  │
│  • 1 sensor: 90 data points (CSV)                               │
│  • 1 DataOne dataset (metadata + links)                         │
│  ─────────────────────────────────────────────────────────────  │
│  Estimated total: ~52 MB                                        │
│                                                                 │
│  [Cancel]                     [Export ZIP]  [Generate Links]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Each layer shows: current filter, export options, bookmarked items
- Pointer row bookmarks show their Level 3 filter (editable)
- Export summary aggregates everything
- Consistent structure, data-type-specific options

**File:** `mockups/02f-export-builder.html`

---

## Consistency vs. Variation Summary

### What's CONSISTENT

| Component | Consistent Across All |
|-----------|----------------------|
| Left sidebar | Categories → Layers → Pin button |
| Floating widget - Pinned layers | Icon, name, query indicator, [Edit] [Clear] [✕] |
| Floating widget - Bookmarks | Icon, label, source, context, [View] [✕] |
| Right sidebar tabs | Overview \| Browse \| Export |
| Right sidebar - Overview | Title, description, attribution |
| Export Builder | Per-layer section with options |

### What VARIES

| Component | Variation | Examples |
|-----------|-----------|----------|
| Browse tab filters | Data-type specific | Species (iNat), Region (ANiML), Time (Dendra), Category (DataOne) |
| Browse tab results | Card content differs | Observation card vs. Camera card vs. Sensor card vs. Dataset card |
| Bookmark options | Self-contained: 1 button; Pointer: 2 buttons | `[Bookmark]` vs. `[Bookmark]` + `[Bookmark with Filter]` |
| Level 3 exists? | Only for pointer rows | ANiML: images; Dendra: datastream; DataOne: n/a usually |
| Export options | Data-type specific | Images vs. CSV vs. Links |
| **Dual-level filter at layer browse?** | **ANiML only** | ANiML shows both camera filters AND image filters at layer level; others only show row-level filters |
| **Category placement** | **Most in primary categories, DataOne cross-category** | DataOne in "Research Datasets (All Categories)" with category filter in right sidebar |

### ⚠️ ANiML Special Case: Dual-Level Filtering

ANiML is unique among our data sources because:
1. Users frequently want to filter by **related data attributes** (species, date) across ALL cameras
2. The "Pin Layer with Query" can include a **global image filter** that applies to every camera
3. This avoids tedious per-camera bookmarking when the user wants the same filter applied everywhere

**V1 Decision: Only ANiML has dual-level filtering at layer browse level.**

| Data Source | V1 Approach | Reason |
|-------------|-------------|--------|
| **iNaturalist** | Single-level | Self-contained rows - no related data |
| **Dendra** | Single-level | Backend complexity (time-series indexing); per-sensor filtering is sufficient for V1 |
| **DataOne** | Single-level | Datasets bookmarked whole - no file-level filtering needed |
| **ANiML** | **Dual-level** | Users frequently want same image filter across multiple cameras |

> **Future:** Dendra *could* support "sensors with values > X during time Y" but requires backend work. Deferred to V2.

---

## Development Schedule

| Day | Mockup | Focus | Status |
|-----|--------|-------|--------|
| 1 | 02a | Unified layout + floating widget | ✅ **COMPLETE** |
| 2 | 02b | iNaturalist Browse (self-contained baseline) | ✅ **COMPLETE** |
| 3 | 02c | ANiML Browse (**dual-level filter pattern**) | ✅ **COMPLETE** |
| 4 | 02d | Dendra Browse (pointer + Level 3 datastream) | ✅ **COMPLETE** |
| 5 | 02e | DataOne Browse (pointer, no Level 3) | ✅ **COMPLETE** |
| 6 | 02f | Export Builder (all together) | ✅ **COMPLETE** |
| 7 | 02e+ | **DataOne Detail View** (drill-down pattern) | 🔜 **Next** |
| 8 | Polish | Consistency check, edge cases, demo prep | 📋 Planned |

### 02c Development Notes (ANiML)

**This mockup is the most complex because it demonstrates dual-level filtering:**

Must show:
1. **Layer Browse View** with BOTH camera filters AND global image filters
2. **"Pin Layer with Query"** button that saves both filter levels
3. **Camera cards showing filtered image counts** (e.g., "47 mountain lion images")
4. **Camera Detail View** with filter pre-populated from layer-level selection
5. **Individual bookmark options** at camera detail level

User flow to demonstrate:
1. User sets camera filter (region: north)
2. User sets image filter (species: mountain lion, year: 2023)
3. Results show "8 cameras • 127 total mountain lion images"
4. User clicks "Pin Layer with Query" → both filters saved
5. User can also drill into CAM-042 and bookmark just that camera with the filter

### Notes on Completed Tasks

**02a - Unified Layout (Jan 21, 2026)**
- ✅ Created combined floating widget showing pinned layers + bookmarks
- ✅ Demonstrated query indicators on pinned layers (green badges)
- ✅ Showed both simple bookmarks and Level 3 filtered bookmarks (with "→" arrow)
- ✅ Added layout toggle: Combined mode (single widget) vs Split mode (pinned left, bookmarks right)
- 📝 Uses DM Sans font for improved typography
- 📝 Color scheme: Blue for pinned layers, Amber for bookmarks, Emerald for active queries

**02b - iNaturalist Browse (Jan 21, 2026)**
- ✅ Demonstrated self-contained row pattern (observations ARE the data)
- ✅ Showed filtering UI: taxon, species, date range, research grade
- ✅ Created observation cards with only `[Bookmark]` button (no Level 3 filter option)
- ✅ Used split widget layout (pinned layers left, bookmarks right)
- ✅ Included proper result counts and visual feedback
- 📝 Set baseline for Browse tab structure that others will follow

**02c - ANiML Browse (Jan 21, 2026)**
- ✅ Implemented dual-level filtering (camera filters + global image filters)
- ✅ Created "Pin Layer with Query" button that saves both filter levels
- ✅ Camera cards show filtered image counts (e.g., "47 mountain lion images")
- ✅ Drill-down camera detail view with filter pre-populated from layer-level
- ✅ Two bookmark options: "Bookmark Camera" vs "Bookmark with Filter"
- ✅ Visual distinction: gray filter section for cameras, amber for images
- 📝 Most complex mockup - demonstrates the full pointer row + Level 3 pattern

**02d - Dendra Browse (Jan 21, 2026)**
- ✅ Demonstrated pointer row pattern (sensor points to datastream)
- ✅ Sensor list view with filtering by region and status
- ✅ Live indicator (pulsing dot) for active sensors, maintenance status badge
- ✅ Sensor detail view with current reading display
- ✅ Level 3 filter: time range (from/to dates) + aggregation (daily, hourly, etc.)
- ✅ Two bookmark options: "Bookmark Sensor" vs "Bookmark with Time Range"
- ✅ **Floating time series panel on map** (inspired by 03a mockup)
  - Positioned at bottom of map to avoid overlap with bookmarks widget (top-right)
  - Interactive chart with SVG line visualization and grid
  - Time range navigator with draggable selection window
  - Stats sidebar: Total, Daily Avg, Max, Rain Days
  - Minimize/expand/close functionality
  - "Bookmark Range" and "Export CSV" actions
- ✅ Teal color theme for Dendra-specific elements (filter sections, badges)
- 📝 Clean example of time-series Level 3 filter (simpler than ANiML's dual-level)

**02e - DataOne Browse (Jan 21, 2026)**
- ✅ Demonstrated pointer row pattern WITHOUT Level 3 filter
- ✅ Dataset list view: search & filter (text search, category, year range, author)
- ✅ Dataset cards show: title, authors, year, description, DOI badge, file tags
- ✅ Only `[Bookmark]` button (no "Bookmark with Filter") - key distinction
- ✅ External access via "Open in DataOne ↗" button
- ✅ Indigo/violet color theme for scholarly/research feel
- 📝 Simplest pointer row pattern - bookmarks are always for entire datasets
- 📝 DOI badges provide citation links to original research

**02e - DataOne Detail View (TODO)**
- 🔜 `[Details →]` button → drills into dataset detail view
- 🔜 "← Back to Datasets" navigation (consistent with ANiML/Dendra pattern)
- 🔜 Full description (not truncated), files list with sizes
- 🔜 Spatial coverage section with bounding box + "View on Map"
- 🔜 Keywords as clickable tags
- 🔜 Actions: Bookmark Dataset, Open in DataOne, Copy DOI, Cite
- 🔜 Filter persistence: returning to list preserves search/filter state
- 📝 Decision: No iframe embed - curated summary is better UX for narrow sidebar

**⚠️ IMPORTANT: Left Sidebar Requirements for All Mockups**
- 📋 **ACTION REQUIRED:** Update all existing mockups (02a-02f) to include complete left sidebar
  - All 13 primary TNC categories (alphabetical: Boundaries → Weather and Climate)
  - Separator line (`───────────────────────────────`)
  - "Research Datasets (All Categories)" section
  - DataOne layer under this section
- 🎯 **Rationale:** Prevents confusion about DataOne being a cross-category data source
- 📍 **Reference:** See `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` Part 10

**DataOne Details View Plan (Documented Above):**
- ✅ `[Details →]` button shows dataset detail view in right sidebar
- ✅ Uses existing right sidebar detail styling (consistent with ANiML camera detail, Dendra sensor detail)
- ✅ Shows curated metadata summary instead of iframe (better UX, consistent width)
- ✅ Clear "← Back to Datasets" navigation at top
- ✅ Filters persist when navigating between list and detail views
- ✅ Detail view includes: full description, files list, spatial coverage, keywords, actions
- ✅ Completes the drill-down pattern consistency across all data sources

**Implementation Status:** 🔜 Ready for mockup implementation

---

## Files

```
mockups/
├── 01-full-layout-overview.html    ← V1 baseline (pin only)
├── 02a-unified-layout.html         ← V2: Floating widget + bookmarks
├── 02b-browse-inaturalist.html     ← V2: Self-contained rows
├── 02c-browse-animl.html           ← V2: Pointer + Level 3 (images)
├── 02d-browse-dendra.html          ← V2: Pointer + Level 3 (datastream)
├── 02e-browse-dataone.html         ← V2: Pointer, no Level 3
└── 02f-export-builder.html         ← V2: Export workflow
```

---

## Success Criteria

- [x] All 4 data sources shown with consistent outer structure
- [x] Variations in Browse tab are clear and justified
- [x] Level 3 concept is obvious for pointer rows (✅ shown in 02a bookmarks)
- [x] Self-contained vs. pointer row distinction is clear (✅ shown in 02a bookmarks)
- [x] Export Builder shows how all bookmark types converge
- [x] Team can articulate the three-level hierarchy (✅ demonstrated in 02a)
- [ ] DataOne detail view implemented (drill-down pattern complete across all sources)
- [ ] Jack Dangermond demo-ready (needs polish pass)

### Mockup 02a Complete
✅ Successfully demonstrates:
- Pin → Query paradigm (Level 1)
- Bookmarks with and without filters (Level 2 & 3)
- Layout flexibility (Combined vs Split widgets)
- Consistent visual language across all data sources

**02f - Export Builder (Jan 21, 2026)**
- ✅ Created full-screen modal Export Builder
- ✅ Shows all 4 pinned layers in consistent section format
- ✅ Per-layer export options: filtered results, bookmarked only, or skip
- ✅ Data-source-specific format options (CSV, GeoJSON, metadata, images, etc.)
- ✅ Bookmarked items shown with Level 3 filters where applicable
- ✅ "Change Filter" / "Change Time Range" links for editable bookmarks
- ✅ ANiML dual-level filter display (camera filter + image filter)
- ✅ Export Summary section aggregates all selections
- ✅ Estimated size calculation (~52 MB example)
- ✅ Two export actions: "Generate Links" and "Export ZIP"
- 📝 Color-coded section borders match data source themes
- 📝 Emerald/teal gradient for export-specific UI elements

---

**Last Updated:** January 21, 2026  
**Status:** ✅ Core Mockups Complete (6 of 6) • 🔜 Detail View Enhancement Planned  
**Next:** Implement DataOne detail view (02e+) to complete drill-down pattern

**Latest Completion:** 02f - Export Builder (all bookmark types together)  
**Upcoming:** 02e+ - DataOne Detail View (full dataset metadata, files, spatial coverage)

