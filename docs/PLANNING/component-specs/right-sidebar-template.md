# Component Spec: Right Sidebar Template

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-003c, DFT-004, DFT-005, DFT-006, DFT-015, DFT-017, DFT-018, DFT-019, DFT-020, DFT-026, DFT-027, DFT-028, DFT-030, DFT-031, DFT-033, DFT-038, DFT-039, DFT-040, DFT-041, DFT-042, DFT-043, DFT-044  
**Status:** ✅ Complete — ready for dev

---

## Terminology

- **Item** = a record within a layer (camera, sensor, observation, dataset). Not "Feature" — per Trisalyn's direction.
- **Active** = the layer currently being inspected; displayed in right sidebar.
- **Pinned** = a layer saved to the Map Layers widget with filters.
- **Self-contained row** = item IS the data (iNaturalist observation). No Level 3 related data.
- **Pointer row** = item POINTS TO data (ANiML camera → images, Dendra sensor → datastream). Has Level 3 related data.
- **Level 2** = layer-scope filters (which items appear on map). Uses `FilterSection`.
- **Level 3** = item-scope filters (which related data to view for a specific item). Uses `FeatureDetailCard`.
- All labels referencing items use `TERMINOLOGY` config from `src/config/terminology.ts`.

---

## Template Principle

> **All data sources share this structural template. Changing the template changes all data sources simultaneously. Individual data sources only customize *content* (fields, filters, labels), never *layout or styling* (unless a documented exception exists).**

**Documented exceptions:**
- ANiML: Landing cards for Animal-First / Camera-First entry (DFT-003c)
- ANiML/Dendra: `FeatureDetailCard` at Level 3 (DFT-040)
- Dendra: Pop-up time series chart with slider (DFT-004)

---

## Anatomy — Full Sidebar Shell

```
┌─────────────────────────────────────────┐
│ A. SidebarHeader                        │
│    [icon]  Layer Name              [x]  │
│    Source: via [Data Source API]         │
├─────────────────────────────────────────┤
│ B. TabBar                               │
│    Overview   │   Browse                │
│    ═══════════                          │  ← 2px active indicator
├─────────────────────────────────────────┤
│ C. TabContent (scrollable)              │
│                                         │
│    (tab-specific content renders here)  │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Width:** 400px fixed, not resizable (DFT-033).

| Part | Element | Description |
|------|---------|-------------|
| A | SidebarHeader | Data source icon (SVG/Lucide, no emoji — DFT-026), layer name, source badge, close [x] button. |
| B | TabBar | Two tabs: Overview, Browse. Underline style. Equal-width columns. Text-only (no icons — too narrow at 400px). |
| C | TabContent | Scrollable content area. Renders the active tab's content. |

---

## Component 1: SidebarHeader

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
└─────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Icon | `w-8 h-8 text-gray-600` (Lucide or data-source SVG) |
| Title | `text-base font-semibold text-gray-900` |
| Source badge | `text-xs text-gray-400 mt-0.5` |
| Close [x] | `w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer` (Lucide `X`) |

**Behavior:**
- Close [x] deactivates the layer and collapses the sidebar.
- Title truncates with ellipsis if longer than available space.
- Icon is data-source-specific (camera for ANiML, thermometer for Dendra, etc.).

---

## Component 2: TabBar

### Anatomy

```
┌──────────────┬──────────────┐
│   Overview   │    Browse    │
├──────────────┴──────────────┤
│ ═══════════                 │  ← 2px emerald underline on active
```

### States

**Active tab:**
```
│   Overview   │    Browse    │
│ ═══════════                 │
```
- `flex-1 py-2.5 text-sm font-semibold text-gray-900 border-b-2 border-emerald-600 text-center`

**Inactive tab:**
```
│   Overview   │    Browse    │
│              │ ═══════════  │
```
- `flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-center cursor-pointer transition-colors duration-150`

### Behavior
- Default active tab: **Overview** when layer is first selected (DFT-006).
- Tab click switches content with **150-200ms crossfade** transition (DFT-019).
- Equal-width columns prevent layout shift.
- Tab height: 40px total (meets 44px touch target with padding).
- Keyboard: Arrow Left/Right cycles tabs. Enter/Space activates.
- ARIA: `role="tablist"`, each tab is `role="tab"` with `aria-selected`.

---

## Component 3: OverviewTab

The Overview tab provides layer context before the user dives into data.

### Anatomy

```
┌─────────────────────────────────────────┐
│ [icon]  Data Source Name                │  1. Header (from SidebarHeader)
│ Source: via [API Name]                  │
├─── Overview ─── Browse ─────────────────┤
│ ═══════════                             │
├─────────────────────────────────────────┤
│                                         │
│ Brief description of this data source   │  2. Description
│ and what it contains (1-3 sentences).   │     (data-source-specific copy)
│                                         │
│─────────────────────────────────────────│
│ Key Metadata                            │  3. Metadata grid
│ ┌─────────────────┬───────────────────┐ │     (2-col, data-source fields)
│ │ Total records   │ 12,430            │ │
│ │ Date range      │ 2019 - 2025       │ │
│ │ Coverage        │ Dangermond Pres.  │ │
│ │ Last updated    │ Jan 15, 2026      │ │
│ └─────────────────┴───────────────────┘ │
│                                         │
│─────────────────────────────────────────│
│                                         │
│ ┌─────────────────────────────────────┐ │  4. CTA button (DFT-027)
│ │        Browse Items -->             │ │     Full-width primary
│ └─────────────────────────────────────┘ │
│                                         │
│─────────────────────────────────────────│
│ Export Status                           │  5. Export status (DFT-041)
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Pinned · 3 filters · 2 bookmarks  │ │  When pinned
│ │   Open Export Builder [cart-icon]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Design Tokens

| Element | Styling |
|---------|---------|
| Description | `text-sm text-gray-600 leading-relaxed` |
| Metadata label | `text-xs text-gray-500 font-medium` |
| Metadata value | `text-sm text-gray-900` |
| Metadata grid | `grid grid-cols-2 gap-x-4 gap-y-2` |
| CTA button | Full-width, `bg-[#2e7d32] text-white font-medium`, min-height 44px |
| CTA hover | Slight color shift + `scale(1.02)` |
| CTA focus | 2px outline for keyboard navigation |
| CTA transition | 150-200ms `ease-out` crossfade to Browse tab |
| Export status title | `text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2` |
| Export status box (pinned) | `bg-emerald-50 border border-emerald-200 rounded-lg p-3` |
| Export status box (unpinned) | `bg-slate-50 border border-slate-200 rounded-lg p-3` |
| Export status text (pinned) | `text-sm text-gray-800` |
| Export status text (unpinned) | `text-sm text-gray-600` |
| "Open Export Builder" link | `text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1` |
| "Pin Now" button | `text-sm bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-md inline-block mt-2` |

### Per-Data-Source Metadata Fields

| Data Source | Metadata Fields |
|---|---|
| **iNaturalist** | Total observations, Species count, Date range, Quality grades, Coverage area |
| **ANiML** | Total cameras, Total images, Species detected, Date range, Coverage area |
| **Dendra** | Total sensors, Sensor types, Date range, Update frequency, Coverage area |
| **DataOne** | Total datasets, Categories covered, Date range, Sources, Coverage area |

### Component Interface

```typescript
interface OverviewTabProps {
  icon: React.ReactNode;
  title: string;                    // "iNaturalist Observations"
  sourceBadge: string;              // "via iNaturalist API"
  description: string;              // 1-3 sentence summary
  metadata: { label: string; value: string }[];
  onBrowseClick: () => void;        // Navigate to Browse tab
  browseLabel?: string;             // Default: "Browse Items -->"
  // Export status props (DFT-041)
  isPinned: boolean;                // Is this layer pinned?
  activeFilterCount?: number;       // Number of active filters (if pinned)
  bookmarkCount?: number;           // Number of bookmarks from this layer (if pinned)
  onPinClick?: () => void;          // Pin action (if not pinned)
  onOpenExportBuilder?: () => void; // Open Export Builder modal (if pinned)
}
```

**Note:** `browseLabel` should use `TERMINOLOGY` config. Default renders as `Browse ${TERMINOLOGY.childNounPlural} -->`.

### Export Status Section (DFT-041)

The export status section appears at the bottom of the Overview tab, providing export-related context and actions.

**When layer is pinned:**
```
│─────────────────────────────────────────│
│ Export Status                           │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Pinned · 3 filters · 2 bookmarks  │ │
│ │   Open Export Builder [cart-icon]   │ │
│ └─────────────────────────────────────┘ │
```

**When layer is NOT pinned:**
```
│─────────────────────────────────────────│
│ Export                                  │
│  Pin this layer to include in your      │
│  export package.                        │
│  [Pin Now]                              │
```

**Behavior:**
- Pinned state: Shows checkmark, filter count, bookmark count. "Open Export Builder" link opens the global export modal (shopping cart button in header).
- Unpinned state: Instructive message + "Pin Now" button. Clicking "Pin Now" pins the layer to the Map Layers widget.
- Export Builder link includes shopping cart icon (Lucide `ShoppingCart`, `w-3 h-3`).

---

## Component 4: FilterSection (DFT-038)

The shared filter container used by all Browse tabs at Level 2 (and by single-level data sources like iNaturalist and DataOne).

### Anatomy

```
┌─────────────────────────────────────────┐
│ FILTER [PLURAL NOUN]        [Clear All] │  A. Header row
│─────────────────────────────────────────│
│                                         │
│  [Control 1: full-width]                │  B. Text search first (if present)
│  [Control 2]      [Control 3]           │  C. 2-col grid (dropdowns paired)
│  [Control 4: full-width]                │  D. Date ranges, multi-selects
│  [ ] [Toggle/checkbox option]           │  E. Toggles last
│                                         │
│─────────────────────────────────────────│
│  Showing 47 of 876 [noun]              │  F. Result count footer
└─────────────────────────────────────────┘
```

| Part | Element | Description |
|------|---------|-------------|
| A | Header | `"Filter [Plural Noun]"` + `[Clear All]` link (visible only when `hasActiveFilters`). |
| B-E | Controls grid | CSS Grid `1fr 1fr`, `gap: 8px`. Controls use `col-span-1` or `col-span-2`. |
| F | Result count | `"Showing X of Y [noun]"` — filtered count + total. Updates continuously. |

### Container Styling

```css
.filter-section {
  @apply bg-slate-50 border border-slate-200 rounded-lg p-3;
}
```

No gradients. Flat `slate-50` background. Data-source identity lives in sidebar header, not filter controls.

### Control Sizing Rules (within ~368px usable)

| Control Type | Grid Span | Position | Rationale |
|---|---|---|---|
| Text search | `col-span-2` | Always first | Serial Position Effect |
| Single dropdown | `col-span-1` | Pair 2 side-by-side | Compact, scannable |
| Date range (start + end) | `col-span-2` (2-col internal) | After dropdowns | Needs space |
| Multi-select (pills) | `col-span-2` | After dropdowns | Pills need horizontal space |
| Toggle/checkbox | `col-span-2` | End of controls | Low visual weight |

### Header Convention

| Context | Pattern | Examples |
|---|---|---|
| Single-level layers | `"Filter [Plural Noun]"` | "Filter Observations", "Filter Datasets" |
| Dual-level, layer scope | `"Filter [Plural Noun]"` | "Filter Cameras", "Filter Sensors" |

### Header Tokens

| Element | Styling |
|---------|---------|
| Title | `text-[10px] font-semibold text-gray-500 uppercase tracking-wide` |
| "Clear All" | `text-[10px] text-gray-400 hover:text-red-500 cursor-pointer` (visible only when `hasActiveFilters`) |

### Result Count Footer Tokens

| Element | Styling |
|---------|---------|
| Container | `pt-2 border-t border-slate-200 mt-2` |
| Text | `text-[10px] text-gray-600` |
| Filtered count | `font-semibold text-emerald-600` |
| Total count | `font-medium` |

### Filter Apply Behavior (DFT-039)

All controls auto-apply. **No Apply button in any data source.**

| Control Type | Trigger | Timing |
|---|---|---|
| Text search | Keystroke | 500ms debounce, 2+ chars. Enter bypasses debounce. |
| Single dropdown | Selection change | Immediate |
| Multi-select (pills) | Each toggle | Immediate |
| Date range (each field) | Calendar close / blur | Immediate per field |
| Toggle / checkbox | Click | Immediate |

**Shared infrastructure:**
- `AbortController` cancels in-flight requests when new filter state arrives
- Loading: stale results with opacity overlay, not blanked (DFT-018)
- Result count updates continuously
- "Clear All" fires immediately, resets to unfiltered state
- ARIA live region announces result count changes

### Component Interface

```typescript
interface FilterSectionProps {
  label: string;              // "Filter Observations"
  resultCount: number;        // 847
  totalCount: number;         // 12430
  noun: string;               // "observations"
  hasActiveFilters: boolean;
  onClearAll: () => void;
  children: React.ReactNode;  // Data-source-specific controls
}
```

**Location:** `src/v2/components/RightSidebar/shared/FilterSection.tsx`

---

## Component 5: FeatureDetailCard (DFT-040)

Used at Level 3 when user drills into a specific item (ANiML camera, Dendra sensor). Replaces `FilterSection` at Level 3 — the feature header provides scope, so no separate "Filter [Noun]" header is needed.

### Anatomy — 6-Zone Layout

```
┌─────────────────────────────────────────┐
│ [<-] Back to [Cameras/Sensors]          │  1. Navigation breadcrumb
├─────────────────────────────────────────┤
│ [icon] CAM-042 -- North Ridge           │
│ Active * 10,847 images  [Clear] [undo]  │  2. Item identity + actions
│─────────────────────────────────────────│
│  [Filter controls -- DFT-038 grid]      │  3. Filter controls (embedded)
│─────────────────────────────────────────│
│  Showing 47 of 10,847 images            │  4. Result count
├─────────────────────────────────────────┤
│  [Results list / image grid]            │  5. Results
├─────────────────────────────────────────┤
│  [<- Prev]           [Next ->]          │  6. Pagination
└─────────────────────────────────────────┘
```

### Key Design Decisions

- **No Level 2 summary bar.** Back button is the only Level 2 reference. Level 2 filter state is preserved in memory and visible on return.
- **No separate "Filter [Noun]" header.** The feature header card provides scope context — you're at CAM-042, so the filter controls below obviously filter CAM-042's data.
- **Filter controls use DFT-038 grid layout** (`1fr 1fr`, `gap: 8px`, `col-span-1`/`col-span-2` rules) but are children of the feature detail card, not wrapped in a standalone `FilterSection`.

### Item Header Row Tokens

| Element | Styling | Purpose |
|---|---|---|
| Icon + name | `text-sm font-bold text-gray-900` | Item identity (ID + location) |
| Status + count | `text-[10px] text-gray-500` | Context metadata |
| [Clear] link | `text-[10px] text-gray-400 hover:text-red-500` | Clear all Level 3 filters (DFT-031) |
| [undo] button | `text-[10px] text-gray-400` (grayed when no actions) | Persistent undo (DFT-031) |

### Per-Data-Source Application

| Data Source | Item Header | Filter Controls | Result Count |
|---|---|---|---|
| **ANiML** | `[camera-icon] CAM-042 -- North Ridge` / `Active * 10,847 images` | Species multi-select, Date range, Deployment dropdown | "Showing 47 of 10,847 images" |
| **Dendra** | `[sensor-icon] RS-042 -- North Ridge` / `Active * Rain Gauge * 0.2mm` | Date range, Aggregation dropdown | "Showing 31 datapoints" |

### Component Interface

```typescript
interface FeatureDetailCardProps {
  icon: React.ReactNode;
  name: string;                 // "CAM-042"
  subtitle: string;             // "North Ridge"
  metadata: string;             // "Active * 10,847 images"
  resultCount: number;
  totalCount: number;
  noun: string;                 // "images" or "datapoints"
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  children: React.ReactNode;    // Filter controls (DFT-038 grid)
}
```

**Location:** `src/v2/components/RightSidebar/shared/FeatureDetailCard.tsx`

**Applies to:** ANiML (Phase 2) and Dendra (Phase 3) only. iNaturalist and DataOne do not drill into items.

---

## Component 6: ResultCard

### Anatomy

```
┌─────────────────────────────────────────┐
│ [Icon/Thumb]  Title Line                │
│               Subtitle / metadata       │
│               [Action] [Action] [Action]│
└─────────────────────────────────────────┘
```

### Design Tokens

| Element | Styling |
|---------|---------|
| Container | `bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer` |
| Container (grayed) | `opacity-50 saturate-50` (for zero-result cameras, DFT-028). 300ms `ease-out` transition. |
| Thumbnail | `w-10 h-10 rounded object-cover` |
| Icon (no image) | `w-10 h-10 text-gray-400 bg-gray-100 rounded flex items-center justify-center` |
| Title | `text-sm font-medium text-gray-900 truncate` |
| Subtitle | `text-xs text-gray-500` |
| Action (primary) | `text-xs font-medium text-emerald-600 hover:text-emerald-700` |
| Action (secondary) | `text-xs text-gray-500 hover:text-gray-700` |
| Action (icon) | `w-5 h-5 text-gray-400 hover:text-red-500` (for remove/close) |

### Per-Data-Source Content

| Data Source | Icon/Thumb | Title | Subtitle | Actions |
|---|---|---|---|---|
| **iNaturalist** | Species photo | Species name | Observer, Date | View, Bookmark, Open in iNat |
| **ANiML** | Camera icon | CAM-ID -- Location | Status, Image count | View Camera, Bookmark |
| **Dendra** | Sensor icon | Sensor-ID -- Location | Status, Last reading | View Sensor, Bookmark |
| **DataOne** | Document icon | Dataset title | Authors, Year | Details, Bookmark, Open in DataOne |

### Component Interface

```typescript
interface ResultCardProps {
  icon?: React.ReactNode;
  thumbnail?: string;               // Image URL (replaces icon)
  title: string;                    // "CAM-042 -- North Ridge"
  subtitle?: string;                // "Active * 847 images"
  metadata?: string;                // Additional line
  actions: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'icon';
  }[];
  isGrayed?: boolean;               // For zero-result cameras (DFT-028)
  onClick?: () => void;             // Card click (drill-down)
}
```

**Location:** `src/v2/components/RightSidebar/shared/ResultCard.tsx`

---

## Component 7: Pagination

### List Pagination (iNaturalist, ANiML cameras, Dendra sensors, DataOne datasets)

```
┌─────────────────────────────────────────┐
│  [<- Previous]   Page 2 of 12  [Next ->]│
└─────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Container | `flex items-center justify-between py-3 border-t border-gray-200` |
| Button (active) | `text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100` |
| Button (disabled) | `text-sm text-gray-300 cursor-not-allowed px-3 py-1.5` |
| Page indicator | `text-xs text-gray-500` |

**Page size:** 20 items per page (consistent across all data sources).

### Image Grid Pagination (ANiML images within a camera — Level 3)

```
┌─────────────────────────────────────────┐
│  [Load 20 More]   (47 of 847 loaded)   │
└─────────────────────────────────────────┘
```

Images use "Load More" to avoid losing scroll position during visual scanning.

### Behavior
- Keyboard: Previous/Next buttons focusable. Enter activates.
- ARIA: `aria-label="Go to next page"`, `aria-label="Go to previous page"`.
- On page change: scroll TabContent to top, show loading per DFT-018.

**Location:** `src/v2/components/RightSidebar/shared/Pagination.tsx`

---

## Component 8: DetailBackButton (DFT-044)

Shared back navigation for detail views (iNaturalist observation detail, DataOne dataset detail).

### Anatomy

```
┌─────────────────────────────────────────┐
│ [<-] Back to Observations               │
└─────────────────────────────────────────┘
```

### Component Interface

```typescript
interface DetailBackButtonProps {
  label: string;              // "Back to Observations", "Back to Datasets"
  onClick: () => void;
}
```

### Design Tokens

| Element | Styling |
|---------|---------|
| Container | `flex items-center gap-1 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer transition-colors` |
| Icon | Lucide `ChevronLeft`, `w-4 h-4` |
| Text | Inherits container text styling |

### Behavior

- Hover: text darkens from `gray-600` to `gray-800`
- Keyboard: focusable, Enter/Space activates
- ARIA: `aria-label={label}` for screen readers
- Focus: 2px outline for keyboard navigation

**Location:** `src/v2/components/RightSidebar/shared/DetailBackButton.tsx`

---

## Component 9: DetailActionRow (DFT-044)

Shared action button row for detail views. Enforces consistent button layout and styling.

### Anatomy

```
┌─────────────────────────────────────────┐
│ [View on Map] [Bookmark] [iNat ->]      │
└─────────────────────────────────────────┘
```

### Component Interface

```typescript
interface DetailActionRowProps {
  actions: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
    icon?: React.ReactNode;       // Optional icon (e.g., external link)
  }[];
}
```

### Design Tokens

| Element | Styling |
|---------|---------|
| Container | `flex flex-wrap gap-2 pt-3 border-t border-gray-200` |
| Primary button | `bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-sm font-medium transition-colors` |
| Secondary button | `bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-md text-sm transition-colors` |
| Icon (if present) | `w-4 h-4 inline-block ml-1` |

### Behavior

- Flex wrap: buttons wrap on narrow screens
- Min button height: 40px (meets WCAG 44px with padding)
- Keyboard: Tab cycles through buttons, Enter/Space activates
- Focus: 2px outline for keyboard navigation
- Icon position: right-aligned for external link indicators

**Location:** `src/v2/components/RightSidebar/shared/DetailActionRow.tsx`

---

## Component 10: DetailMetadataGrid (DFT-044)

Shared 2-column key-value grid for detail views. Reusable by any detail view needing simple metadata display.

### Anatomy

```
┌─────────────────────────────────────────┐
│ Observer     @jane_doe                  │
│ Date         January 15, 2024           │
│ Location     34.4712, -120.4521         │
│ Quality      Research Grade             │
│ ID agreement 5 / 5                      │
│ License      CC-BY-NC                   │
└─────────────────────────────────────────┘
```

### Component Interface

```typescript
interface DetailMetadataGridProps {
  items: { label: string; value: string }[];
}
```

### Design Tokens

| Element | Styling |
|---------|---------|
| Container | `grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 py-3` |
| Label (dt) | `text-xs text-gray-500 font-medium` |
| Value (dd) | `text-sm text-gray-900` |

### Semantic HTML

Uses `<dl>`, `<dt>`, `<dd>` for accessibility:

```tsx
<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 py-3">
  {items.map(({ label, value }) => (
    <>
      <dt className="text-xs text-gray-500 font-medium">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </>
  ))}
</dl>
```

Screen readers announce: "Observer: @jane_doe. Date: January 15, 2024..." etc.

### Behavior

- Responsive: stacks to 1-col on mobile (<400px width)
- Label width: auto-sized to longest label
- Value width: fills remaining space, wraps if needed

**Location:** `src/v2/components/RightSidebar/shared/DetailMetadataGrid.tsx`

**Used by:**
- `iNaturalist/ObservationDetailView.tsx` (6 metadata fields)
- Potentially reusable by other detail views with simple key-value pairs

**NOT used by:**
- `DataOne/DatasetDetailView.tsx` (uses custom multi-section layout)

---

## States

### State 1: No Layer Selected — Empty Sidebar

When no layer is active, the sidebar shows an instructive empty state.

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│          [layers-icon - muted]          │
│                                         │
│    Click any item layer in the left     │
│    sidebar to view its details here.    │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Styling (DFT-015):**
- Icon: `w-12 h-12 text-gray-300` (Lucide `Layers`)
- Text: `text-sm text-gray-500 text-center px-6`
- Utilitarian tone — no apologies, no warmth.

**Note:** Message uses `TERMINOLOGY` config: `"Click any ${TERMINOLOGY.childNoun.toLowerCase()} layer..."`.

---

### State 2: Overview Tab Active (Default — DFT-006)

This is the default state when a user selects a layer from the left sidebar.

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview === Browse ─────────────────┤
├─────────────────────────────────────────┤
│                                         │
│ Research-grade community science        │
│ observations from the Dangermond        │
│ Preserve region via iNaturalist.        │
│                                         │
│─────────────────────────────────────────│
│ Total observations     12,430           │
│ Species count          847              │
│ Date range             2019 - 2025      │
│ Quality grades         Research Grade   │
│ Coverage               Dangermond Pres. │
│─────────────────────────────────────────│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │        Browse Items -->             │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Notes:**
- `===` indicates the active tab underline.
- Metadata fields are data-source-specific (see OverviewTab component).
- CTA button uses `TERMINOLOGY.childNounPlural` for label.

---

### State 3: Browse Tab — Populated with Results

User has clicked "Browse Items -->" or the Browse tab directly.

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ FILTER OBSERVATIONS     [Clear All]│ │
│ │─────────────────────────────────────│ │
│ │ Taxon:  [All \/]   Species: [All\/]│ │
│ │ Date: [2024-01-01] to [2024-12-31] │ │
│ │ [ ] Research grade only             │ │
│ │─────────────────────────────────────│ │
│ │ Showing 847 of 12,430 observations │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [img] California Condor            │ │
│ │       @jane_doe * Jan 15, 2024     │ │
│ │       [View] [Bookmark] [iNat ->]  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [img] Western Fence Lizard         │ │
│ │       @field_bio * Feb 3, 2024     │ │
│ │       [View] [Bookmark] [iNat ->]  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [img] Coast Live Oak               │ │
│ │       @botanist22 * Mar 8, 2024    │ │
│ │       [View] [Bookmark] [iNat ->]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [<- Previous]   Page 1 of 43  [Next ->] │
└─────────────────────────────────────────┘
```

**Notes:**
- FilterSection (DFT-038) at top with slate-50 background.
- ResultCards below with standard card styling.
- Pagination at bottom with Previous/Next + page indicator.
- All filter controls auto-apply (DFT-039).

---

### State 4: Browse Tab — Empty Results

User's filters returned zero results.

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ FILTER OBSERVATIONS     [Clear All]│ │
│ │─────────────────────────────────────│ │
│ │ Taxon: [Mammals\/] Species:[Wolf\/]│ │
│ │ Date: [2024-01-01] to [2024-12-31] │ │
│ │ [x] Research grade only             │ │
│ │─────────────────────────────────────│ │
│ │ Showing 0 of 12,430 observations   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                                         │
│          [search-icon - muted]          │
│                                         │
│   No observations match your filters.   │
│                                         │
│   Try broadening your date range or     │
│   selecting a different taxon.          │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior (DFT-015):**
- Filters remain visible and editable (user can adjust without leaving).
- Empty state uses dynamic noun: `"No ${noun} match your filters."`.
- Suggestions are contextual to the active filters.
- Icon: `w-12 h-12 text-gray-300` (Lucide `SearchX` or similar).
- Title: `text-sm font-medium text-gray-700`.
- Body: `text-sm text-gray-500`.

---

### State 5: Browse Tab — Loading

Content is loading after a filter change or initial load.

```
┌─────────────────────────────────────────┐
│ [icon]  ANiML Camera Traps         [x]  │
│         Source: via ANiML API           │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ FILTER CAMERAS          [Clear All]│ │
│ │─────────────────────────────────────│ │
│ │ Region: [North\/]  Status:[Active\/]│ │
│ │─────────────────────────────────────│ │
│ │ Showing ... of 42 cameras          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  ← Skeleton card
│ │ ░░░░░░░░░░░░  ░░░░░░░░            │ │
│ │ ░░░░░░ ░░░░░░░░ ░░░░░             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  ← Skeleton card
│ │ ░░░░░░░░░░░░  ░░░░░░░░            │ │
│ │ ░░░░░░ ░░░░░░░░ ░░░░░             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │  ← Skeleton card
│ │ ░░░░░░░░░░░░  ░░░░░░░░            │ │
│ │ ░░░░░░ ░░░░░░░░ ░░░░░             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Loading with progress (ANiML multi-query):**

```
┌─────────────────────────────────────────┐
│                                         │
│   Querying 47 cameras...                │
│   [======████████░░░░░░░░░]  12/47      │
│   ~8 seconds remaining                  │
│                                         │
│   [Cancel]                              │
│                                         │
└─────────────────────────────────────────┘
```

**Loading behavior (DFT-018):**

| Threshold | Indicator | Communication |
|-----------|-----------|---------------|
| 0-300ms | None | Feels instant |
| 300ms-3s | Skeleton cards | None needed |
| 3s-15s | Skeleton + text | "Loading... ~Xs" |
| 15s+ | Skeleton + warning | "Taking longer than usual. [Cancel]" |
| 30s | Auto-timeout | Error state: "Request timed out. [Retry]" |

- Region-specific, non-blocking: user can navigate away or interact with other UI.
- Dismissable: user can click elsewhere to cancel right sidebar loading.
- On filter change with existing results: stale results remain with opacity overlay, not blanked.

---

### State 6: Browse Tab — Feature Detail View (Level 3, DFT-040)

User has drilled into a specific item (ANiML camera or Dendra sensor). This state only applies to dual-level data sources.

**ANiML example:**

```
┌─────────────────────────────────────────┐
│ [icon]  ANiML Camera Traps         [x]  │
│         Source: via ANiML API           │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ [<-] Back to Cameras                    │
├─────────────────────────────────────────┤
│ [camera-icon] CAM-042 -- North Ridge    │
│ Active * 10,847 images  [Clear] [undo]  │
│─────────────────────────────────────────│
│  Species: [Mountain Lion \/]            │
│  Date: [2023-01-01] to [2023-12-31]    │
│  Deployment: [All \/]                   │
│─────────────────────────────────────────│
│  Showing 47 of 10,847 images           │
├─────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│ │img1│ │img2│ │img3│ │img4│           │  ← Image grid
│ └────┘ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│ │img5│ │img6│ │img7│ │img8│           │
│ └────┘ └────┘ └────┘ └────┘           │
├─────────────────────────────────────────┤
│  [Bookmark]                             │
│  [Load 20 More]  (8 of 47 loaded)      │
└─────────────────────────────────────────┘
```

**Dendra example:**

```
┌─────────────────────────────────────────┐
│ [icon]  Dendra Sensors             [x]  │
│         Source: via Dendra API          │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ [<-] Back to Sensors                    │
├─────────────────────────────────────────┤
│ [sensor-icon] RS-042 -- North Ridge     │
│ Active * Rain Gauge * 0.2mm [Clr][undo]│
│─────────────────────────────────────────│
│  Date: [Mar 1, 2024] to [Mar 31, 2024]│
│  Aggregation: [Daily \/]               │
│─────────────────────────────────────────│
│  Showing 31 datapoints                 │
├─────────────────────────────────────────┤
│  [Chart / data displayed in pop-up]    │
│  (time-series chart renders in a       │
│   floating pop-up on the map, not      │
│   inline in the sidebar — DFT-004)     │
├─────────────────────────────────────────┤
│  [Bookmark Sensor]                      │
└─────────────────────────────────────────┘
```

**Behavior:**
- Back button returns to Level 2 list view; Level 2 filter state is preserved.
- Filter controls use DFT-038 grid but are embedded in `FeatureDetailCard`, not in standalone `FilterSection`.
- Transition between Level 2 and Level 3 uses 150-200ms crossfade (DFT-019).
- Single "Bookmark" button auto-captures current Level 3 filter if active (DFT-020).
- Dendra: chart renders in a floating pop-up on the map with slider for exploration (DFT-004). Sidebar shows filter controls and stats.

---

### State 7: Error State — Toast (Action Failure, DFT-030)

When an action fails (bookmark save, filter apply, etc.), a toast appears at the top of the sidebar.

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [x-icon] Bookmark failed to save.  │ │  ← Toast
│ │          [Try Again]           [x] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (normal Browse tab content below)       │
│                                         │
└─────────────────────────────────────────┘
```

**Toast tokens:**
- Container: `bg-red-50 border-b border-red-200`
- Icon: `w-5 h-5 text-red-500` (Lucide `XCircle`)
- Text: `text-sm text-gray-800`
- Button: `text-sm text-red-600 hover:underline`
- Auto-dismiss: 8 seconds
- Max stacked: 3 (newest on top)

---

### State 8: Error State — Inline (Content Failure, DFT-030)

When content fails to load, an inline error replaces the content area.

```
┌─────────────────────────────────────────┐
│ [icon]  ANiML Camera Traps         [x]  │
│         Source: via ANiML API           │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │       [warning-icon]                │ │
│ │                                     │ │
│ │  Unable to load camera data.        │ │
│ │  The server didn't respond          │ │
│ │  in time.                           │ │
│ │                                     │ │
│ │  [Retry]  [<- Back]  [Details \/]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Inline error tokens:**
- Container: `bg-amber-50 border border-amber-200 rounded-lg p-4`
- Icon: `w-8 h-8 text-amber-500` (Lucide `AlertTriangle`)
- Title: `text-sm font-medium text-gray-800`
- Body: `text-sm text-gray-600`
- "Show Details" expands: endpoint, HTTP status, timestamp, duration.
- Persistent until user acts (Retry, Back, navigate away).
- Tone: utilitarian. "Unable to load camera data." Not "Oops! Something went wrong."

---

### State 9: Browse Tab — Self-Contained Detail View (DFT-044)

When user clicks a `ResultCard` for a **self-contained row** (iNaturalist observation, DataOne dataset), the Browse tab transitions to an expanded detail view. This is NOT a Level 3 drill-down — there is no `FeatureDetailCard`. It uses shared sub-components (`DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`) with purpose-built content per data source.

**iNaturalist example (hero image + flat grid):**

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ [<-] Back to Observations               │  ← DetailBackButton
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        [large species photo]        │ │  ← Hero image (4:3, full width)
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ California Condor                       │  ← Title (bold)
│ Gymnogyps californianus                 │  ← Scientific name (italic)
│                                         │
│─────────────────────────────────────────│
│ Observer          @jane_doe             │  ← DetailMetadataGrid (dl/dt/dd)
│ Date              January 15, 2024      │
│ Location          34.4712, -120.4521    │
│ Quality grade     Research Grade        │
│ ID agreement      5 / 5                 │
│ License           CC-BY-NC              │
│─────────────────────────────────────────│
│                                         │
│ [View on Map]  [Bookmark]  [iNat ->]    │  ← DetailActionRow
│                                         │
└─────────────────────────────────────────┘
```

**DataOne example (multi-section hierarchical):**

```
┌─────────────────────────────────────────┐
│ [icon]  DataOne Research Datasets  [x]  │
│         Source: via DataOne API          │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│ [<-] Back to Datasets                   │  ← DetailBackButton
├─────────────────────────────────────────┤
│                                         │
│ Vegetation Survey: Dangermond           │  ← Title (bold)
│ Preserve 2019-2024                      │
│                                         │
│─── About ──────────────────────────────│
│ Abstract / description text spanning    │  ← Expandable section
│ multiple lines with key findings...     │
│─────────────────────────────────────────│
│                                         │
│─── Details ────────────────────────────│
│ Authors          Smith, J.; Doe, K.     │  ← Metadata section
│ Year             2024                   │
│ Format           CSV, GeoTIFF           │
│ Size             247 MB                 │
│ License          CC-BY 4.0              │
│ DOI              10.xxxx/xxxxx          │
│─────────────────────────────────────────│
│                                         │
│ [Bookmark]  [DataOne ->]                │  ← DetailActionRow
│                                         │
└─────────────────────────────────────────┘
```

**Shared structural template:**
- `DetailBackButton` — always first, returns to filtered list (filter state + scroll preserved)
- Content area — purpose-built per data source (hero image for iNat, multi-section for DataOne)
- `DetailMetadataGrid` — 2-col key-value grid (iNat uses this; DataOne uses custom sectioned layout)
- `DetailActionRow` — action buttons at bottom with consistent styling

**Behavior:**
- Transition: 150-200ms crossfade from list to detail (DFT-019).
- Back button preserves filter state and scroll position.
- Focus moves to back button on entry (DFT-017).
- Screen reader announces "Viewing [item name] details" via `aria-live`.

**Note:** Self-contained row detail views do NOT use `FeatureDetailCard` (that's for pointer rows / Level 3). These are simpler expanded views with no embedded filter controls.

---

### State 10: Browse Tab — ANiML Landing Cards (DFT-003c, DFT-042)

On first visit to the ANiML Browse tab, the user sees a choice between two mental models. This is a **documented exception** to the standard template — ANiML is the only data source with this entry point.

```
┌─────────────────────────────────────────┐
│ [icon]  ANiML Camera Traps         [x]  │
│         Source: via ANiML API           │
├─── Overview ─── Browse ─────────────────┤
├─────────────────────────────────────────┤
│                                         │
│ How would you like to explore?          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [paw-icon]                          │ │
│ │ Animal-First                        │ │
│ │ Search by species, see which        │ │
│ │ cameras captured them.              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [camera-icon]                       │ │
│ │ Camera-First                        │ │
│ │ Browse cameras by location, see     │ │
│ │ what species were detected.         │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Landing Card Tokens:**

| Element | Styling |
|---------|---------|
| Question text | `text-sm font-medium text-gray-700 mb-4` |
| Card container | `bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all duration-150` |
| Card icon | `w-8 h-8 text-gray-500 mb-2` |
| Card title | `text-sm font-semibold text-gray-900` |
| Card description | `text-xs text-gray-500 mt-1` |

**Behavior:**
- User preference stored in `localStorage` key `animl-browse-mode`.
- On return visits, landing cards are skipped — user goes directly to their preferred mode.
- Mode-switch: text link above filter section: `"Switch to [other mode]"` (DFT-042).
  - Styling: `text-xs text-gray-500 hover:text-emerald-600 cursor-pointer`
  - Always visible above `FilterSection`.
  - If filters are active, shows confirmation dialog before switching (DFT-031: custom modal for potentially destructive action).
- Keyboard: Tab focuses cards, Enter/Space selects.
- ARIA: `role="group"` with `aria-label="Choose browse mode"` on container. Each card is `role="button"`.

---

## Interactions

| User Action | Result | Notes |
|-------------|--------|-------|
| Select layer in left sidebar | Sidebar opens to Overview tab | DFT-006 |
| Click "Browse Items -->" CTA | TabBar switches to Browse tab (150-200ms crossfade) | DFT-027 |
| Click Browse tab | Tab switches (crossfade) | DFT-019 |
| Click "Pin Now" (Overview export status) | Pins layer to Map Layers widget | DFT-041 |
| Click "Open Export Builder" (Overview export status) | Opens Export Builder modal from header shopping cart | DFT-041, DFT-002 |
| Click close [x] | Layer deactivated, sidebar closes | |
| Change any filter control | Auto-apply, results update, AbortController cancels previous | DFT-039 |
| Click "Clear All" in filter header | All filters reset, immediate | DFT-038, DFT-031 |
| Click ResultCard (pointer row) | Drill into item detail — Level 3 `FeatureDetailCard` (ANiML camera, Dendra sensor) | DFT-004, DFT-040 |
| Click ResultCard (self-contained row) | Open detail view — expanded view with back button, metadata, actions (iNaturalist, DataOne) | DFT-044 |
| Click "[<-] Back to [Noun]" (Level 3) | Return to Level 2 list view, filter state preserved | DFT-040 |
| Click "[<-] Back to [Noun]" (detail view) | Return to Browse list, filter state + scroll position preserved | DFT-044 |
| Click "Bookmark" button | Single button, auto-captures Level 3 filter if active | DFT-020 |
| Select ANiML landing card | Enter Animal-First or Camera-First mode, preference saved to localStorage | DFT-003c |
| Click "Switch to [other mode]" link | Change ANiML browse mode; confirmation dialog if filters active | DFT-042 |
| Click "View on Map" (detail view) | Map zooms to feature, highlight applied | DFT-044 |
| Click external link (detail view) | Opens source website in new tab (iNaturalist.org, DataOne.org) | DFT-044 |
| Click Previous/Next pagination | Page changes, scroll to top, loading per DFT-018 | |
| Click "Load More" (image grid) | More images appended, scroll maintained | ANiML only |
| Press Escape | Close sidebar (or navigate back one level) | DFT-017 |
| "Edit Filters -->" from widget | Sidebar opens to Browse tab, filter section highlighted | DFT-019 |

---

## Design Decision Summary

- **Two tabs only: Overview | Browse** (DFT-041). Export tab removed. Export status promoted to Overview tab.
- **Fixed 400px width**, not resizable (DFT-033). If content needs more space, use "Expand" modal.
- **Overview tab opens first** when layer selected (DFT-006). Not context-dependent.
- **Overview tab export status section** (DFT-041): Shows pin status, filter count, bookmark count when pinned. Shows "Pin Now" button when unpinned. Links to Export Builder modal.
- **"Browse Items -->"** CTA button on Overview tab, full-width primary (DFT-027). Label uses `TERMINOLOGY` config.
- **SVG/Lucide icons only**, no emojis (DFT-026). In ASCII, text placeholders used.
- **Auto-apply everywhere** — no Apply button in any data source (DFT-039).
- **Shared `FilterSection`** enforces consistent filter anatomy across all Browse tabs (DFT-038).
- **Dual-level data sources** (ANiML, Dendra) use `FeatureDetailCard` at Level 3 (DFT-040). No Level 2 summary bar. Back button is only Level 2 reference.
- **Single "Bookmark" button** for pointer rows. Auto-captures Level 3 filter if active (DFT-020).
- **Skeleton loading** for content, progress bar for multi-query operations, stale results with opacity overlay (DFT-018).
- **Toast at top of sidebar** for action failures. Inline error for content failures (DFT-030).
- **Tab crossfade** 150-200ms (DFT-019). Same transition used for "Edit Filters" navigation from widget.
- **DataOne has NO Level 3 filtering** in V1. Datasets are bookmarked whole.
- **ANiML landing cards** (DFT-003c) are a documented exception — Animal-First vs Camera-First entry on first Browse visit. User preference remembered. Mode-switch link (DFT-042): text link above filter section ("Switch to [other mode]"), always visible, confirmation dialog if filters active, stored in localStorage.
- **Detail views use shared sub-components** (DFT-044): `DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`. Purpose-built detail views for iNaturalist (hero image + flat grid) and DataOne (multi-section hierarchical). Architectural principle: consistent structural template with flexibility for custom content.
- **Dendra Level 3: minimal sidebar** (DFT-043). Filter controls + bookmark only. Stats appear in pop-up footer with chart, not in sidebar. Separation of concerns: sidebar = parametric control, pop-up = visualization + metadata.
- **Zero-result cameras grayed out** (DFT-028). Cameras with 0 matching images show at 40-50% opacity, desaturated. Remain clickable. 300ms ease-out transition.
- **Auto-collapse floating widgets** (DFT-005) when viewing time-series data (Dendra pop-ups) to reduce screen crowding.
- **"Item" terminology** used throughout, per Trisalyn's direction. Configurable via `TERMINOLOGY` config.

---

## Accessibility

- **ARIA:** `role="tablist"` on TabBar, `role="tab"` on each tab, `role="tabpanel"` on TabContent (DFT-017).
- **Keyboard:** Arrow Left/Right cycles tabs, Enter/Space activates tab. Tab key navigates through filter controls.
- **Tab order:** Right sidebar is last in global tab order (after left sidebar, map, floating widgets) (DFT-017).
- **Escape:** Closes sidebar or navigates back one level (DFT-017).
- **Focus management:** When tab switches, focus moves to first interactive element in new tab content. When drilling into Level 3 or detail view, focus moves to back button. When returning from detail/Level 3, focus returns to previously focused card.
- **Screen reader:** Announces "Filter applied" / "Filters cleared" / "Item bookmarked" / "Viewing [item] details" via `aria-live` (DFT-017).
- **Landing cards:** `role="group"` + `aria-label="Choose browse mode"`. Each card is `role="button"` (DFT-003c).
- **ARIA live region:** Announces result count changes in FilterSection.

---

## File Structure

```
src/v2/components/RightSidebar/
  shared/
    SidebarShell.tsx          <- Outer container (400px, scroll)
    TabBar.tsx                <- Overview | Browse
    OverviewTab.tsx           <- Template (accepts metadata props)
    FilterSection.tsx         <- DFT-038 wrapper
    FeatureDetailCard.tsx     <- DFT-040 Level 3 wrapper
    ResultCard.tsx            <- Standard result card
    Pagination.tsx            <- Previous/Next or Load More
    BrowseItemsButton.tsx     <- DFT-027 CTA button
    DetailBackButton.tsx      <- DFT-044 Back navigation for detail views
    DetailActionRow.tsx       <- DFT-044 Action button row for detail views
    DetailMetadataGrid.tsx    <- DFT-044 2-col key-value grid
  iNaturalist/               <- Only content/config, imports shared
    ObservationDetailView.tsx <- Uses DetailBackButton, DetailActionRow, DetailMetadataGrid
  ANiML/                     <- Only content/config + landing cards exception
    LandingCards.tsx         <- DFT-003c Animal-First / Camera-First entry
  Dendra/                    <- Only content/config + chart exception
  DataOne/                   <- Only content/config
    DatasetDetailView.tsx     <- Uses DetailBackButton, DetailActionRow
```

---

## Open Questions

1. **✅ RESOLVED (DFT-042, Feb 6):** ANiML landing cards return path — text link above filter section: "Switch to [other mode]". Always visible, subtle styling (gray-500, hover emerald-500). Confirmation dialog if filters active. Mode preference stored in localStorage (`animl-browse-mode`). See DFT-042 resolution summary.

2. **✅ RESOLVED (DFT-043, Feb 6):** Dendra sidebar content at Level 3 — minimal sidebar (filter controls + bookmark only). Stats appear in pop-up footer with chart. Sidebar contains: back button, sensor header + actions, filter controls, result count, bookmark button. Rationale: separation of concerns (sidebar = control, pop-up = visualization + metadata), spatial proximity (stats with chart), minimalism (Nielsen #8), reduced cognitive load (Miller's Law), reduced split attention, accessibility (logical Tab order), industry conventions. Scored 17 green / 0 yellow / 0 red across 9 UI/UX frameworks. See DFT-043 resolution summary.

3. **✅ RESOLVED (DFT-044, Feb 6):** Self-contained row detail views — no shared detail view component. Extract shared sub-components (`DetailBackButton`, `DetailActionRow`, `DetailMetadataGrid`) + design tokens. Purpose-built views: `iNaturalist/ObservationDetailView.tsx` (hero image + flat grid) and `DataOne/DatasetDetailView.tsx` (multi-section hierarchical). Architectural principle: consistent structural template with flexibility for custom content. See Components 8, 9, 10 above.
