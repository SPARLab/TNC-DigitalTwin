# Mockup Review Email Draft: V2 Layout & Bookmark Visualization

**TO:** Team  
**SUBJECT:** Quick Review: Data Catalog Layout & Bookmark Demo  
**ATTACHMENTS:** `02a-unified-layout.html`, `02c-browse-animl.html`

---

## Hi Team,

I've attached **two HTML mockups** that demonstrate our proposed V2 layout for the Dangermond Preserve Data Catalog. Please open each file in a browser and take 5-10 minutes to explore.

**I'm looking for approval on:**
1. ✅ **The main layout** (left sidebar + right sidebar + two floating widgets)
2. 🔍 **How bookmarks work** — especially seeing related data for a bookmarked item

---

## The Main Layout

We have a **three-zone layout**:

| Zone | Purpose | What You Do Here |
|------|---------|------------------|
| **Left Sidebar** | Browse categories & layers | Find data sources, pin layers to the map |
| **Right Sidebar** | Inspect layer details | Browse rows, apply filters, bookmark specific items |
| **Two Floating Widgets** | Your workspace summary | See what you've pinned (left) and bookmarked (right) |

The layout separates **high-level browsing** (left) from **detail inspection** (right). This matches how people naturally explore data: first find what you want, then dig into specifics.

### Floating Widgets — Your Workspace

Two separate widgets float over the map:

- **📌 Pinned Layers** (top-left) — Shows layers you've added to the map. Aligned with the left sidebar where you pin layers.
- **🔖 Bookmarked Items** (top-right) — Shows individual rows/features you've saved. Aligned with the right sidebar where you view row details.

**Why two widgets?** It reinforces the mental model: **left = layers (tables), right = features (rows)**.

---

## What We're Showing: Bookmarks with Related Data

People have already approved the left/right sidebar and pinning layers. But **bookmarks** are getting "uhhh yeah I guess" reactions — people find them a bit complex.

**The key question:** When you bookmark something that has related data (like a camera with images, or a sensor with time series), what does it look like to view that related data?

### Mockup 02c: ANiML Cameras — Bookmark Example

**The scenario:**
1. You browse ANiML cameras
2. You bookmark a camera (CAM-042)
3. That camera has 10,847 images
4. You filter those images for "Mountain Lions, 2023" → 47 images
5. You bookmark the camera **with that filter**

**What you'll see:**
- In the **Bookmarked Items widget** (top-right): `CAM-042 → 🦁 2023` (shows the filter)
- Clicking it opens the camera detail view with the image gallery filtered to those 47 mountain lion images
- The bookmark "remembers" your filter — you can come back later and see exactly those 47 images

**This is the "related data" visualization** — showing what it looks like when a bookmark includes a filter on related data.

---

## What to Look At

### 02a: Unified Layout Overview
**Purpose:** See the overall layout with all zones active.

🔴 **Focus on:**
- Left sidebar with categories
- Right sidebar with tabs (Overview | Browse | Export)
- **Pinned Layers widget** (top-left) — shows layers with query controls
- **Bookmarked Items widget** (top-right) — shows bookmarks, some with filters (the "→" arrow indicates a filter)

### 02c: ANiML Browse — Bookmark Demo
**Purpose:** See what it looks like to bookmark a camera and view its filtered images.

🔴 **Focus on:**
- Browse tab showing camera cards
- Click a camera → see its image gallery
- Filter images (e.g., "Mountain Lion, 2023")
- Bookmark the camera with that filter
- See the bookmark appear in the widget showing `CAM-042 → 🦁 2023`
- Click the bookmark → see the filtered images again

**This demonstrates:** When you bookmark something with related data, the bookmark saves your filter, and you can return to that filtered view later.

---

## Questions for You

1. **Layout:** Does the left sidebar / right sidebar / floating widgets layout feel right? Any concerns?

2. **Bookmarks with Related Data:** In 02c, when you bookmark a camera with a filter (e.g., "Mountain Lions 2023"), does it make sense that:
   - The bookmark shows `CAM-042 → 🦁 2023` in the widget?
   - Clicking it takes you back to that filtered view?
   - This feels like a natural way to "save your place" in the data?

3. **Cognitive Load:** Is the bookmark concept clear, or does it feel too complex? What would make it clearer?

---

## Why This Matters

Bookmarks let researchers:
- **Save interesting finds** while exploring (don't lose your place)
- **Return to filtered views** later (e.g., "those mountain lion images from CAM-042")
- **Accumulate a collection** of items to export together

But we need to make sure the UI makes this feel natural, not overwhelming.

---

Please reply with your thoughts — especially on whether the bookmark visualization makes sense!

Thanks!

---

*Mockups generated: January 2026*  
*Development Plan: `docs/development_plans/v2-pin-bookmark-export-mockup-plan.md`*
