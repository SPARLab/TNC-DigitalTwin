# Mockup Component Patterns

**Purpose:** HTML/Tailwind snippets for all shared UI components in v2.0 mockups. These are the building blocks — copy and fill with data-source-specific content.

**Source of truth:** `docs/DESIGN-SYSTEM/design-system.md` defines the design decisions and rationale. This file translates those decisions into copy-pasteable HTML.

**Last Updated:** February 5, 2026

---

## 1. Shared HTML Boilerplate

Every mockup starts with this `<head>` section. The Tailwind config encodes theme tokens from `sidebarTheme` in `design-system.md`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mockup 02X: [Title] - TNC Digital Catalog v2.0</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- ArcGIS JS API -->
  <link rel="stylesheet" href="https://js.arcgis.com/4.28/esri/themes/light/main.css">
  <script src="https://js.arcgis.com/4.28/"></script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            'sans': ['DM Sans', 'sans-serif'],
            'mono': ['JetBrains Mono', 'monospace'],
          },
          colors: {
            'tnc': {
              'green': '#2e7d32',
              'green-dark': '#1b5e20',
              'green-light': '#4caf50',
            },
            'sidebar-bg': '#f8fafc',
            'widget-bg': '#ffffff',
          }
        }
      }
    }
  </script>

  <style>
    body { font-family: 'DM Sans', sans-serif; }
    .esri-ui-corner { display: none !important; }

    /* Custom scrollbar */
    .sidebar-scroll::-webkit-scrollbar { width: 6px; }
    .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
    .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* Transitions */
    .icon-btn { transition: all 0.15s ease; }
    .icon-btn:hover { transform: scale(1.1); }

    /* Layer row states (DFT-021) */
    .layer-row { transition: all 0.15s ease; border-left: 3px solid transparent; }
    .layer-row:hover { background-color: #f1f5f9; }
    .layer-row.active {
      border-left-color: #059669;
      background-color: #ecfdf5;
      font-weight: 600;
      color: #111827;
    }

    /* Floating widget */
    .floating-widget {
      box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(8px);
    }

    /* Widget layer cards */
    .widget-layer-card {
      transition: all 0.15s ease;
      border: 1px solid #e2e8f0;
    }
    .widget-layer-card:hover {
      border-color: #94a3b8;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
```

---

## 2. Page Layout Shell

```html
<body class="h-screen flex flex-col overflow-hidden bg-gray-100">
  <!-- Header -->
  <header id="global-header" class="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between z-50">
    <div class="flex items-center gap-3">
      <span class="text-sm font-semibold text-gray-900">TNC Digital Catalog</span>
      <span class="text-xs text-gray-400">Dangermond Preserve</span>
    </div>
    <!-- Cart button (DFT-002) -->
    <button id="cart-button" class="relative flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
      <!-- Replace with Lucide ShoppingCart SVG -->
      <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
      <span class="text-sm font-medium text-gray-700">Export</span>
      <span id="cart-badge" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
    </button>
  </header>

  <!-- Main content area -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar (260px) -->
    <aside id="left-sidebar" class="w-[260px] bg-sidebar-bg border-r border-gray-200 flex flex-col">
      <!-- See Section 3 -->
    </aside>

    <!-- Map Area + Floating Widgets -->
    <main id="map-container" class="flex-1 relative">
      <div id="map-view" class="w-full h-full"></div>
      <!-- Floating widgets positioned here — see Section 10 -->
    </main>

    <!-- Right Sidebar (400px fixed, DFT-033) -->
    <aside id="right-sidebar" class="w-[400px] bg-white border-l border-gray-200 flex flex-col">
      <!-- See Section 4 -->
    </aside>
  </div>
</body>
```

---

## 3. Left Sidebar

See `design-system.md` → Sidebar Template System → LeftSidebar Category Pattern for design tokens.

```html
<aside id="left-sidebar" class="w-[260px] bg-sidebar-bg border-r border-gray-200 flex flex-col">
  <!-- Search -->
  <div class="p-3 border-b border-gray-200">
    <input id="layer-search" type="text" placeholder="Search layers..."
      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
  </div>

  <!-- Category Tree -->
  <nav id="layer-categories" class="flex-1 overflow-y-auto sidebar-scroll py-2" role="tree">

    <!-- Expanded category -->
    <div class="category" role="treeitem" aria-expanded="true">
      <button id="cat-wildlife" class="flex items-center gap-2 w-full py-2 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
        <svg class="w-4 h-4 text-gray-400 transition-transform duration-150 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span>Wildlife Monitoring</span>
        <span class="text-xs text-gray-400 ml-auto">(3)</span>
      </button>
      <div class="category-children">
        <!-- Active layer (DFT-021: "active" = being inspected in right sidebar) -->
        <div id="layer-animl" class="layer-row active py-1.5 px-3 pl-9 text-sm rounded-sm cursor-pointer" role="treeitem">
          Camera Traps (ANiML)
        </div>
        <div id="layer-inat" class="layer-row py-1.5 px-3 pl-9 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer rounded-sm" role="treeitem">
          iNaturalist Observations
        </div>
        <div id="layer-ebird" class="layer-row py-1.5 px-3 pl-9 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer rounded-sm" role="treeitem">
          eBird Sightings
        </div>
      </div>
    </div>

    <!-- Collapsed category -->
    <div class="category" role="treeitem" aria-expanded="false">
      <button id="cat-environmental" class="flex items-center gap-2 w-full py-2 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
        <svg class="w-4 h-4 text-gray-400 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span>Environmental Sensors</span>
        <span class="text-xs text-gray-400 ml-auto">(2)</span>
      </button>
    </div>

    <!-- Add more categories per the data source organization in phase docs -->
  </nav>
</aside>
```

---

## 4. Right Sidebar Shell + TabBar

See `design-system.md` → Sidebar Template System → TabBar for design tokens.

```html
<aside id="right-sidebar" class="w-[400px] bg-white border-l border-gray-200 flex flex-col">
  <!-- Sidebar Header -->
  <div id="sidebar-header" class="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
    <div class="w-8 h-8 text-gray-600 bg-gray-100 rounded flex items-center justify-center">
      <!-- Data source icon (Lucide SVG or data-source-specific SVG) -->
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
    </div>
    <div>
      <h2 class="text-base font-semibold text-gray-900">[Data Source Name]</h2>
      <p class="text-xs text-gray-400">via [API source]</p>
    </div>
    <button id="sidebar-close" class="ml-auto text-gray-400 hover:text-gray-600" aria-label="Close sidebar">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>

  <!-- TabBar (underline style, emerald-600 active indicator) -->
  <div id="tab-bar" class="flex w-full border-b border-gray-200" role="tablist">
    <button role="tab" aria-selected="true"
      class="flex-1 py-2.5 text-sm font-semibold text-gray-900 border-b-2 border-emerald-600 text-center">
      Overview
    </button>
    <button role="tab" aria-selected="false"
      class="flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-center cursor-pointer transition-colors duration-150">
      Browse
    </button>
    <button role="tab" aria-selected="false"
      class="flex-1 py-2.5 text-sm text-gray-300 cursor-not-allowed text-center">
      Export
    </button>
  </div>

  <!-- Tab Content (scrollable) -->
  <div id="tab-content" class="flex-1 overflow-y-auto sidebar-scroll">
    <!-- Tab panels go here -->
  </div>
</aside>
```

---

## 5. OverviewTab

See `design-system.md` → Sidebar Template System → OverviewTab for the structural template and per-data-source metadata fields.

```html
<div id="overview-tab" class="p-4 space-y-4" role="tabpanel">
  <!-- Description -->
  <p id="overview-description" class="text-sm text-gray-600 leading-relaxed">
    [1-3 sentence description of this data source — get from phase doc]
  </p>

  <!-- Metadata Grid -->
  <div id="overview-metadata" class="grid grid-cols-2 gap-x-4 gap-y-2">
    <div>
      <span class="text-xs text-gray-500 font-medium">[Label]</span>
      <p class="text-sm text-gray-900">[Value]</p>
    </div>
    <div>
      <span class="text-xs text-gray-500 font-medium">[Label]</span>
      <p class="text-sm text-gray-900">[Value]</p>
    </div>
    <!-- Add data-source-specific fields per design-system.md OverviewTab content table -->
  </div>

  <!-- Browse Features CTA (DFT-027) -->
  <button id="browse-features-cta"
    class="w-full py-3 bg-tnc-green text-white text-sm font-medium rounded-lg hover:bg-tnc-green-dark transition-colors duration-150 min-h-[44px]">
    Browse Features →
  </button>
</div>
```

**Per-data-source metadata fields** (from `design-system.md`):

| Data Source | Fields |
|---|---|
| **iNaturalist** | Total observations, Species count, Date range, Quality grades, Coverage area |
| **ANiML** | Total cameras, Total images, Species detected, Date range, Coverage area |
| **Dendra** | Total sensors, Sensor types, Date range, Update frequency, Coverage area |
| **DataOne** | Total datasets, Categories covered, Date range, Sources, Coverage area |

---

## 6. FilterSection (DFT-038)

See `design-system.md` → Filter Section Patterns for full spec. This is the single-level filter pattern used by iNaturalist, DataOne, and ANiML/Dendra at Level 2.

```html
<div id="filter-section" class="bg-slate-50 border border-slate-200 rounded-lg p-3">
  <!-- Header -->
  <div class="flex items-center justify-between mb-2">
    <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Filter [Plural Noun]</span>
    <!-- Clear All: only visible when filters are active -->
    <button id="filter-clear-all" class="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer">Clear All</button>
  </div>
  <div class="border-b border-slate-200 mb-3"></div>

  <!-- Controls Grid (2-column, 8px gap) -->
  <div class="grid grid-cols-2 gap-2">
    <!-- Text search: always first, full-width -->
    <input id="filter-search" type="text" placeholder="Search..."
      class="col-span-2 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500">

    <!-- Paired dropdowns (col-span-1 each) -->
    <select id="filter-dropdown-1" class="col-span-1 px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
      <option>All [Type A]</option>
    </select>
    <select id="filter-dropdown-2" class="col-span-1 px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
      <option>All [Type B]</option>
    </select>

    <!-- Date range: full-width -->
    <div class="col-span-2 flex gap-2">
      <input type="date" class="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
      <span class="text-gray-400 self-center">–</span>
      <input type="date" class="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
    </div>

    <!-- Toggle/checkbox: at end, full-width -->
    <label class="col-span-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
      <span>[Toggle option label]</span>
    </label>
  </div>

  <!-- Result count footer -->
  <div class="pt-2 border-t border-slate-200 mt-3">
    <span class="text-[10px] text-gray-600">
      Showing <span class="font-semibold text-emerald-600">47</span>
      of <span class="font-medium">876</span> [noun]
    </span>
  </div>
</div>
```

**Swap the controls inside the grid per data source.** See `design-system.md` → Filter Section Patterns → Per-Data-Source Control Inventory:

| Data Source | Level | Controls |
|---|---|---|
| **iNaturalist** | Single | Taxon + Species dropdowns (2-col), Date range (full), Quality grade checkbox |
| **ANiML** | L2 | Region + Status dropdowns (2-col) |
| **ANiML** | L3 | *Use FeatureDetailCard instead (Section 7)* |
| **Dendra** | L2 | Region + Status dropdowns (2-col) |
| **Dendra** | L3 | *Use FeatureDetailCard instead (Section 7)* |
| **DataOne** | Single | Title search (full), Repository + TNC Category (2-col), Date range (full) |

**No Apply button** in any data source (DFT-039: auto-apply everywhere).

---

## 7. FeatureDetailCard (DFT-040 — Level 3 Only)

Replaces FilterSection when user drills into a specific camera/sensor. Used in ANiML (02c) and Dendra (02d) only. See `design-system.md` → Dual-Level Filter Pattern.

```html
<div id="feature-detail" class="space-y-0">
  <!-- 1. Back navigation -->
  <button id="feature-back" class="flex items-center gap-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 w-full text-left"
    aria-label="Back to camera list">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    Back to [Cameras/Sensors]
  </button>

  <!-- 2. Feature identity + filter actions -->
  <div id="feature-header" class="px-4 py-3 border-b border-gray-200">
    <div class="flex items-center gap-2">
      <!-- Replace with SVG icon — no emoji -->
      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
      <span class="text-sm font-bold text-gray-900">CAM-042 — North Ridge</span>
    </div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-[10px] text-gray-500">Active · 10,847 images</span>
      <div class="flex items-center gap-2">
        <button id="feature-clear" class="text-[10px] text-gray-400 hover:text-red-500">Clear</button>
        <button id="feature-undo" class="text-[10px] text-gray-400 opacity-40 cursor-not-allowed" aria-disabled="true" title="No actions to undo">↩</button>
      </div>
    </div>
  </div>

  <!-- 3. Filter controls (DFT-038 grid layout, no separate "Filter X" header) -->
  <div class="px-4 py-3 border-b border-gray-200">
    <div class="grid grid-cols-2 gap-2">
      <!-- Data-source-specific controls — see design-system.md inventory -->
    </div>
  </div>

  <!-- 4. Result count -->
  <div class="px-4 py-2 border-b border-gray-200">
    <span class="text-[10px] text-gray-600">
      Showing <span class="font-semibold text-emerald-600">47</span>
      of <span class="font-medium">10,847</span> [noun]
    </span>
  </div>

  <!-- 5. Results -->
  <div id="feature-results" class="px-4 py-3 space-y-2">
    <!-- ResultCards or image grid here -->
  </div>

  <!-- 6. Pagination — see Section 9 -->
</div>
```

**Per-data-source Level 3 controls:**

| Data Source | Feature Header | Controls | Result Noun |
|---|---|---|---|
| **ANiML** | CAM-042 — North Ridge / Active · 10,847 images | Species multi-select (full), Date range (full), Deployment dropdown | images |
| **Dendra** | RS-042 — North Ridge / Active · Rain Gauge · 0.2mm | Date range (full), Aggregation dropdown | datapoints |

---

## 8. ResultCard

See `design-system.md` → Sidebar Template System → ResultCard for design tokens.

```html
<!-- Standard result card -->
<div id="result-card-[unique-id]" class="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer">
  <div class="flex gap-3">
    <!-- Icon or Thumbnail -->
    <div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Lucide icon appropriate for data source -->
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
      </svg>
    </div>
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-gray-900 truncate">[Title]</h3>
      <p class="text-xs text-gray-500">[Subtitle / metadata]</p>
      <!-- Actions -->
      <div class="flex items-center gap-3 mt-1.5">
        <button class="text-xs font-medium text-emerald-600 hover:text-emerald-700">[Primary]</button>
        <button class="text-xs text-gray-500 hover:text-gray-700">[Secondary]</button>
      </div>
    </div>
  </div>
</div>

<!-- Grayed-out variant (DFT-028: zero-result cameras) -->
<div class="bg-white border border-gray-200 rounded-lg p-3 opacity-50 saturate-50 cursor-pointer">
  <!-- Same inner structure, reduced opacity + desaturation -->
</div>
```

**Per-data-source card content:**

| Data Source | Icon/Thumb | Title | Subtitle | Actions |
|---|---|---|---|---|
| **iNaturalist** | Species photo | Species name | Observer · Date | View, Bookmark |
| **ANiML** | Camera SVG icon | CAM-ID — Location | Status · Image count | View Camera, Bookmark |
| **Dendra** | Sensor SVG icon | Sensor-ID — Location | Status · Last reading | View Sensor, Bookmark |
| **DataOne** | Document SVG icon | Dataset title (truncated) | Authors · Year | Details, Bookmark |

---

## 9. Pagination

See `design-system.md` → Sidebar Template System → Pagination. Page size: 20 items (all data sources).

### List Pagination (iNaturalist, ANiML cameras, Dendra sensors, DataOne)

```html
<div id="pagination" class="flex items-center justify-between py-3 px-4 border-t border-gray-200">
  <button class="text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100">← Previous</button>
  <span class="text-xs text-gray-500">Page 2 of 12</span>
  <button class="text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100">Next →</button>
</div>

<!-- Disabled button state -->
<!-- <button class="text-sm text-gray-300 cursor-not-allowed px-3 py-1.5" disabled>← Previous</button> -->
```

### Image Grid Pagination (ANiML images within a camera)

```html
<div id="load-more" class="flex items-center justify-center gap-2 py-3 px-4 border-t border-gray-200">
  <button class="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Load 20 More</button>
  <span class="text-xs text-gray-400">(47 of 847 loaded)</span>
</div>
```

---

## 10. Floating Widgets

### Pinned Layers Widget (top-left of map)

See `design-system.md` → Undo Button Pattern for undo button spec, Cross-Phase Patterns for widget styling.

```html
<div id="pinned-layers-widget" class="floating-widget absolute top-4 left-4 w-[320px] bg-white rounded-xl z-40">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
    <span class="text-sm font-semibold text-gray-900">Pinned Feature Layers</span>
    <div class="flex items-center gap-1">
      <!-- Undo (DFT-031: always visible, grayed when inactive) -->
      <button id="pinned-undo" class="icon-btn p-1 text-gray-400 opacity-40 cursor-not-allowed"
        aria-disabled="true" title="No actions to undo">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4"/></svg>
      </button>
      <!-- Collapse -->
      <button id="pinned-collapse" class="icon-btn p-1 text-gray-400 hover:text-gray-600" aria-label="Collapse">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
      </button>
    </div>
  </div>

  <!-- Body -->
  <div class="p-2 space-y-1.5 max-h-[300px] overflow-y-auto sidebar-scroll">
    <!-- Widget layer card row -->
    <div class="widget-layer-card rounded-lg px-3 py-2 flex items-center gap-2 bg-white">
      <!-- Drag handle (DFT-034) -->
      <span class="text-gray-300 cursor-grab" aria-label="Drag to reorder">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
      </span>
      <!-- Eye toggle -->
      <button class="icon-btn text-emerald-600" aria-label="Toggle visibility">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
      </button>
      <!-- Layer name -->
      <span class="text-sm text-gray-700 flex-1 truncate">[Layer Name]</span>
      <!-- Filter indicator (DFT-024: icon + count) -->
      <span class="flex items-center gap-0.5 text-xs text-emerald-600" title="3 filters applied">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
        3
      </span>
      <!-- Remove -->
      <button class="icon-btn text-gray-300 hover:text-red-500" aria-label="Unpin layer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
</div>
```

### Bookmarked Features Widget (top-right of map, offset from right sidebar)

```html
<div id="bookmarked-features-widget" class="floating-widget absolute top-4 right-[416px] w-[320px] bg-white rounded-xl z-40">
  <!-- right-[416px] = 400px sidebar + 16px gap -->

  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
    <span class="text-sm font-semibold text-gray-900">Bookmarked Features</span>
    <div class="flex items-center gap-1">
      <button id="bookmark-undo" class="icon-btn p-1 text-gray-400 opacity-40 cursor-not-allowed"
        aria-disabled="true" title="No actions to undo">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4"/></svg>
      </button>
      <button id="bookmark-collapse" class="icon-btn p-1 text-gray-400 hover:text-gray-600" aria-label="Collapse">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
      </button>
    </div>
  </div>

  <!-- Body: grouped by parent layer (DFT-007) -->
  <div class="p-2 space-y-2 max-h-[300px] overflow-y-auto sidebar-scroll">
    <!-- Layer group header (non-interactive, muted styling) -->
    <div class="px-3 py-1">
      <span class="text-xs text-gray-400 font-medium">[Parent Layer Name]</span>
    </div>
    <!-- Bookmark row -->
    <div class="widget-layer-card rounded-lg px-3 py-2 flex items-center gap-2 bg-white">
      <span class="text-sm text-gray-700 flex-1 truncate">[Feature ID — Location]</span>
      <span class="text-xs text-gray-400">[filter summary]</span>
      <button class="icon-btn text-gray-300 hover:text-red-500" aria-label="Remove bookmark">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
</div>
```

---

## 11. Empty States (DFT-015)

See `design-system.md` → Empty State Patterns for the full spec. Utilitarian tone, no warmth.

```html
<!-- Pinned Layers: First Visit (educational) -->
<div id="empty-pinned-first" class="flex flex-col items-center justify-center text-center px-6 py-8">
  <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
  </svg>
  <p class="text-sm font-medium text-gray-700 mb-1">No layers pinned</p>
  <p class="text-sm text-gray-500">Pin layers from the left sidebar to save them here.</p>
</div>

<!-- Pinned Layers: Returning User (laconic) -->
<div id="empty-pinned-returning" class="flex flex-col items-center justify-center text-center px-6 py-8">
  <p class="text-sm text-gray-500">Pinned layers appear here.</p>
</div>

<!-- Right Sidebar: No Layer Selected -->
<div id="empty-sidebar" class="flex flex-col items-center justify-center text-center px-6 py-16">
  <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
  </svg>
  <p class="text-sm text-gray-500">Click any layer in the left sidebar to view its details here.</p>
</div>

<!-- Browse Tab: Zero Filter Results -->
<div id="empty-browse-results" class="flex flex-col items-center justify-center text-center px-6 py-8">
  <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
  <p class="text-sm font-medium text-gray-700 mb-1">No [noun] match your filters</p>
  <p class="text-sm text-gray-500">Try adjusting your filter criteria.</p>
  <button class="text-sm text-emerald-600 hover:underline mt-2">Clear all filters</button>
</div>
```

---

## 12. Loading States (DFT-018)

See `design-system.md` → Loading State Patterns for thresholds and indicator types.

```html
<!-- Skeleton: Sidebar content loading -->
<div id="loading-skeleton" class="p-4 space-y-4 animate-pulse">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-3 bg-gray-200 rounded w-full"></div>
  <div class="h-3 bg-gray-200 rounded w-5/6"></div>
  <div class="grid grid-cols-2 gap-4 mt-4">
    <div class="h-8 bg-gray-200 rounded"></div>
    <div class="h-8 bg-gray-200 rounded"></div>
    <div class="h-8 bg-gray-200 rounded"></div>
    <div class="h-8 bg-gray-200 rounded"></div>
  </div>
</div>

<!-- Progress bar: Multi-query operations (e.g., ANiML camera queries) -->
<div id="loading-progress" class="p-4">
  <p class="text-sm text-gray-600 mb-2">Querying 47 cameras...</p>
  <div class="w-full bg-gray-200 rounded-full h-2">
    <div class="bg-emerald-600 h-2 rounded-full transition-all duration-300" style="width: 25%"></div>
  </div>
  <div class="flex justify-between mt-1">
    <span class="text-xs text-gray-500">12/47</span>
    <span class="text-xs text-gray-500">~8 seconds remaining</span>
  </div>
  <button class="text-sm text-gray-500 hover:text-gray-700 mt-3">[Cancel]</button>
</div>
```

---

## 13. Error States (DFT-030)

See `design-system.md` → Error State Patterns for the severity hierarchy and design tokens.

```html
<!-- Toast: Action failure (placed at top of right sidebar) -->
<div id="error-toast" class="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-3" role="alert">
  <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <span class="text-sm text-gray-800 flex-1">Bookmark failed to save.</span>
  <button class="text-sm text-red-600 hover:underline font-medium">Try Again</button>
  <button class="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
</div>

<!-- Inline: Content load failure (placed where content should appear) -->
<div id="error-inline" class="bg-amber-50 border border-amber-200 rounded-lg p-4 mx-4 my-4">
  <div class="flex items-start gap-3">
    <svg class="w-8 h-8 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <div>
      <p class="text-sm font-medium text-gray-800">Unable to load [data type]</p>
      <p class="text-sm text-gray-600 mt-1">The server didn't respond in time.</p>
      <div class="flex gap-3 mt-3">
        <button class="text-sm text-amber-700 hover:underline font-medium">Retry</button>
        <button class="text-sm text-gray-500 hover:underline">← Back to Layer List</button>
      </div>
    </div>
  </div>
</div>

<!-- Partial failure banner (placed above loaded content) -->
<div id="error-partial" class="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
  <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
  <span class="text-sm text-gray-700 flex-1">3 cameras failed to load.</span>
  <button class="text-sm text-amber-700 hover:underline font-medium">Retry Failed</button>
  <button class="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
  </button>
</div>
```

---

## 14. Documented Exceptions

These components exist only in specific data-source mockups. They diverge from the shared template.

### ANiML Landing Cards (DFT-003c) — 02c only

Entry point choice displayed in Browse tab before any filters. See phase-2-animl.md.

```html
<div id="animl-landing" class="p-4 space-y-3">
  <p class="text-sm text-gray-600">How would you like to explore?</p>

  <button id="animl-animal-first" class="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all text-left">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900">Animal-First</h3>
        <p class="text-xs text-gray-500">Filter by species, then see which cameras detected them</p>
      </div>
    </div>
  </button>

  <button id="animl-camera-first" class="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all text-left">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900">Camera-First</h3>
        <p class="text-xs text-gray-500">Browse camera locations, then explore images at each site</p>
      </div>
    </div>
  </button>

  <p class="text-xs text-gray-400 text-center">You can switch between modes anytime</p>
</div>
```

### Dendra Time-Series Chart (DFT-004) — 02d only

Floating chart panel with slider for temporal exploration. Appears over the map, not in the sidebar.

*Pattern deferred — depends on charting approach for mockup (static image, Chart.js, or placeholder). Define during 02d generation.*

---

## Maintenance

- **When `design-system.md` changes:** Update the corresponding HTML pattern here to match.
- **When adding a new shared component:** Add spec to `design-system.md` first, then add HTML pattern here.
- **When team requests styling changes:** Update the Tailwind config block (Section 1) and the affected component patterns.
