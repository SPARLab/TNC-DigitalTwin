# Component Spec: Right Sidebar — iNaturalist Variant

**Date:** February 6, 2026  
**DFTs Referenced:** DFT-006, DFT-015, DFT-020, DFT-027, DFT-038, DFT-039  
**Parent Template:** `right-sidebar-template.md`  
**Status:** Draft — pending review

---

## How This Document Works

This document shows how iNaturalist **specializes** the shared right sidebar template. It does NOT redefine shared components (TabBar, Pagination, etc.) — those live in `right-sidebar-template.md`. This document only shows:

1. What content fills the template's slots (metadata, filters, card content)
2. Any iNaturalist-specific states or behaviors
3. Where iNaturalist differs from the generic template (it mostly doesn't)

**Key characteristic:** iNaturalist is the **simplest** data source. Observations are **self-contained rows** (no Level 3 related data, no dual-level filtering, no landing cards).

---

## Terminology

- **Observation** = a single iNaturalist record (species sighting with photo, location, date, observer).
- **Self-contained row** = the observation IS the data. No related data to drill into.
- **Bookmark** = simple bookmark only. No "Bookmark with Filter" option (no Level 3 exists).

---

## Overview Tab Content

iNaturalist fills the shared `OverviewTab` template with these specific props:

```
┌─────────────────────────────────────────┐
│ [binoculars-icon]                       │
│ iNaturalist Observations           [x]  │
│ Source: via iNaturalist API             │
├─── Overview === Browse ─── Export ──────┤
├─────────────────────────────────────────┤
│                                         │
│ Research-grade community science        │
│ observations from the Dangermond        │
│ Preserve region. Includes verified      │
│ species sightings with photos,          │
│ locations, and observer information.    │
│                                         │
│─────────────────────────────────────────│
│ Total observations     12,430           │
│ Species count          847              │
│ Date range             2019 - 2025      │
│ Quality grades         Research Grade,  │
│                        Needs ID         │
│ Coverage               Dangermond       │
│                        Preserve         │
│─────────────────────────────────────────│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │        Browse Items -->             │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Props Passed to OverviewTab

```typescript
{
  icon: <BinocularsIcon />,            // or Lucide 'Binoculars'
  title: "iNaturalist Observations",
  sourceBadge: "via iNaturalist API",
  description: "Research-grade community science observations from the Dangermond Preserve region. Includes verified species sightings with photos, locations, and observer information.",
  metadata: [
    { label: "Total observations", value: "12,430" },
    { label: "Species count",      value: "847" },
    { label: "Date range",         value: "2019 - 2025" },
    { label: "Quality grades",     value: "Research Grade, Needs ID" },
    { label: "Coverage",           value: "Dangermond Preserve" },
  ],
  onBrowseClick: () => switchTab('browse'),
}
```

---

## Browse Tab — Filter Controls

iNaturalist uses a single-level `FilterSection` (no dual-level complexity).

### Filter Section

```
┌─────────────────────────────────────────┐
│ FILTER OBSERVATIONS          [Clear All]│
│─────────────────────────────────────────│
│                                         │
│  Taxon:   [All \/]   Species: [All \/] │  ← 2-col: col-span-1 each
│  Date: [2024-01-01]  to  [2024-12-31]  │  ← full-width: col-span-2
│  [ ] Research grade only                │  ← full-width: col-span-2
│                                         │
│─────────────────────────────────────────│
│  Showing 847 of 12,430 observations    │
└─────────────────────────────────────────┘
```

### Control Inventory

| Control | Type | Grid Span | Position | Behavior |
|---|---|---|---|---|
| Taxon | Single dropdown | `col-span-1` | Row 1, left | Fires immediately on change. Filters Species dropdown options. |
| Species | Single dropdown (filtered by Taxon) | `col-span-1` | Row 1, right | Fires immediately on change. Options depend on Taxon selection. |
| Date range | Date picker pair (start + end) | `col-span-2` | Row 2 | Each field fires on calendar close / blur. |
| Research grade only | Checkbox | `col-span-2` | Row 3 (last) | Fires immediately on click. |

### Props Passed to FilterSection

```typescript
{
  label: "Filter Observations",
  resultCount: 847,
  totalCount: 12430,
  noun: "observations",
  hasActiveFilters: true,        // at least one non-default filter
  onClearAll: () => clearAllFilters(),
  children: (
    <>
      <TaxonDropdown className="col-span-1" />
      <SpeciesDropdown className="col-span-1" filteredByTaxon={taxon} />
      <DateRangePicker className="col-span-2" />
      <Checkbox className="col-span-2" label="Research grade only" />
    </>
  )
}
```

### Filter Dependency: Taxon --> Species

When the user selects a Taxon (e.g., "Mammals"), the Species dropdown filters to show only species within that taxon. Changing Taxon:
1. Resets Species to "All" (within new taxon)
2. Fires auto-apply query immediately
3. Species dropdown repopulates from available species in new taxon

If no Taxon selected ("All"), the Species dropdown shows all species.

---

## Browse Tab — ResultCard for iNaturalist

Each observation renders as a `ResultCard` with iNaturalist-specific content.

### Populated Card

```
┌─────────────────────────────────────────┐
│ [species-photo]  California Condor      │
│                  @jane_doe * Jan 15 '24 │
│                  [View] [Bkmk] [iNat->] │
└─────────────────────────────────────────┘
```

### Card with No Photo

```
┌─────────────────────────────────────────┐
│ [leaf-icon]  Coast Live Oak             │
│              @botanist22 * Mar 8, 2024  │
│              [View] [Bkmk] [iNat ->]    │
└─────────────────────────────────────────┘
```

### Props Passed to ResultCard

```typescript
{
  thumbnail: observation.photoUrl || undefined,
  icon: observation.photoUrl ? undefined : <LeafIcon />,
  title: observation.speciesName,       // "California Condor"
  subtitle: `@${observation.observer} * ${observation.date}`,
  actions: [
    { label: "View",     onClick: () => viewOnMap(observation), variant: 'primary' },
    { label: "Bookmark", onClick: () => bookmark(observation),  variant: 'secondary' },
    { label: "iNat ->",  onClick: () => openInINat(observation), variant: 'secondary' },
  ],
  onClick: () => drillIntoDetail(observation),
}
```

### Action Details

| Action | Behavior |
|--------|----------|
| **View** | Zooms map to observation location. Highlights feature on map. |
| **Bookmark** | Adds to Bookmarked Items widget. Simple bookmark — no Level 3 filter (self-contained row). Toast: "Bookmarked: California Condor". |
| **iNat -->** | Opens `iNaturalist.org/observations/{id}` in new tab. External link icon. |
| **Card click** | Navigates to observation detail view (State: Detail View below). |

---

## Browse Tab — Observation Detail View

When user clicks a ResultCard, the Browse tab transitions to a detail view for that observation. This is NOT a Level 3 drill-down (no `FeatureDetailCard`). It's a simple expanded view within the Browse tab.

```
┌─────────────────────────────────────────┐
│ [icon]  iNaturalist Observations   [x]  │
│         Source: via iNaturalist API     │
├─── Overview ─── Browse === Export ──────┤
├─────────────────────────────────────────┤
│ [<-] Back to Observations               │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        [large species photo]        │ │  ← Larger photo display
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ California Condor                       │  ← Species name (bold)
│ Gymnogyps californianus                 │  ← Scientific name (italic)
│                                         │
│─────────────────────────────────────────│
│ Observer          @jane_doe             │
│ Date              January 15, 2024      │
│ Location          34.4712, -120.4521    │
│ Quality grade     Research Grade        │
│ ID agreement      5 / 5                 │
│ License           CC-BY-NC              │
│─────────────────────────────────────────│
│                                         │
│ [View on Map]  [Bookmark]  [iNat ->]    │
│                                         │
└─────────────────────────────────────────┘
```

### Behavior

- **Back button:** `[<-] Back to Observations` returns to the filtered list. Filter state and scroll position are preserved.
- **Photo:** Larger display (~full sidebar width, `aspect-ratio: 4/3`, `object-cover`, `rounded-lg`).
- **Scientific name:** `text-sm text-gray-500 italic`.
- **Metadata grid:** Same 2-col layout as OverviewTab metadata grid, but with observation-specific fields.
- **Actions:** Same as ResultCard but laid out as full-width buttons.
- **Transition:** 150-200ms crossfade from list view to detail view (DFT-019).

### Metadata Fields

| Field | Source | Notes |
|---|---|---|
| Observer | `observation.user.login` | Prefixed with `@` |
| Date | `observation.observed_on` | Formatted as full date |
| Location | `observation.geojson.coordinates` | Lat/lng, truncated to 4 decimals |
| Quality grade | `observation.quality_grade` | "Research Grade", "Needs ID", "Casual" |
| ID agreement | `observation.identifications` count | "5 / 5" format |
| License | `observation.license_code` | CC license abbreviation |

---

## iNaturalist-Specific States

### State: First Load (No Filters Applied)

When the user first navigates to the Browse tab, all filters are at default ("All") and the full observation set loads.

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ FILTER OBSERVATIONS                │ │  ← No "Clear All" (no active filters)
│ │─────────────────────────────────────│ │
│ │ Taxon:  [All \/]  Species: [All \/]│ │
│ │ Date: [         ] to [           ] │ │  ← Empty = no date filter
│ │ [ ] Research grade only             │ │
│ │─────────────────────────────────────│ │
│ │ Showing 12,430 of 12,430 obs.     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (ResultCards for most recent            │
│  observations, sorted by date desc)    │
│                                         │
│ [<- Previous]  Page 1 of 622  [Next ->] │
└─────────────────────────────────────────┘
```

**Notes:**
- "Clear All" is hidden (no filters active, `hasActiveFilters: false`).
- Default sort: most recent observations first.
- Full count shows: "Showing 12,430 of 12,430 observations".

---

### State: Species Filter Applied

User has selected a taxon and species. Results update automatically (DFT-039).

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ FILTER OBSERVATIONS     [Clear All]│ │  ← "Clear All" visible
│ │─────────────────────────────────────│ │
│ │ Taxon: [Birds\/]  Species:[Condor\/]│ │
│ │ Date: [         ] to [           ] │ │
│ │ [ ] Research grade only             │ │
│ │─────────────────────────────────────│ │
│ │ Showing 23 of 12,430 observations │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [photo] California Condor          │ │
│ │         @jane_doe * Jan 15, 2024   │ │
│ │         [View] [Bkmk] [iNat ->]    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [photo] California Condor          │ │
│ │         @field_bio * Dec 3, 2023   │ │
│ │         [View] [Bkmk] [iNat ->]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [<- Previous]   Page 1 of 2   [Next ->] │
└─────────────────────────────────────────┘
```

**Notes:**
- "Clear All" appears because `hasActiveFilters: true`.
- Result count updates: "Showing 23 of 12,430 observations".
- Species dropdown was filtered to show only Birds when Taxon: Birds was selected.

---

### State: Loading After Filter Change

User just changed a filter. Previous results visible with opacity overlay.

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ FILTER OBSERVATIONS     [Clear All]│ │
│ │─────────────────────────────────────│ │
│ │ Taxon: [Reptiles\/]  Species:[All\/]│ │  ← Just changed
│ │ Date: [2024-01-01] to [2024-12-31] │ │
│ │ [ ] Research grade only             │ │
│ │─────────────────────────────────────│ │
│ │ Showing ... of 12,430 observations │ │  ← Updating
│ └─────────────────────────────────────┘ │
│                                    0.5x │  ← Opacity overlay on stale results
│ ┌─────────────────────────────────────┐ │
│ │ [photo] California Condor  (stale) │ │
│ │         @jane_doe * Jan 15, 2024   │ │
│ │         [View] [Bkmk] [iNat ->]    │ │
│ └─────────────────────────────────────┘ │
│ (previous results visible but dimmed)   │
└─────────────────────────────────────────┘
```

**Behavior (DFT-018):**
- Previous results remain visible with opacity overlay (`opacity: 0.5`), not blanked.
- Result count shows `"..."` while loading.
- `AbortController` cancels the previous in-flight request when new filter fires.
- If load takes >300ms, subtle loading indicator appears.
- Once new results arrive, overlay fades and new results render.

---

## What iNaturalist Does NOT Have

These template features are not used by iNaturalist:

| Feature | Why Not |
|---------|---------|
| Level 3 drill-down (`FeatureDetailCard`) | Self-contained rows — no related data |
| "Bookmark with Filter" | No Level 3 filter to capture |
| Landing cards (DFT-003c) | ANiML-only exception |
| Dual-level filtering | Single filter level only |
| Image grid pagination ("Load More") | Uses standard list pagination |
| Pop-up chart | Dendra-only exception |
| Grayed-out zero-result cards (DFT-028) | No map badge / filter count system |

---

## Interactions (iNaturalist-Specific)

| User Action | Result | Notes |
|-------------|--------|-------|
| Select Taxon dropdown | Species dropdown filters to show species within that taxon. Query fires immediately. | Cascading filter |
| Clear Taxon | Species dropdown shows all species. Query fires immediately. | |
| Click ResultCard | Navigate to observation detail view (150-200ms crossfade) | |
| Click "[<-] Back to Observations" | Return to filtered list. Filter state and scroll position preserved. | |
| Click "Bookmark" on observation | Simple bookmark added. Toast: "Bookmarked: [species name]". No Level 3 filter. | DFT-020 |
| Click "iNat -->" | Opens iNaturalist.org in new tab | External link |
| Click "View on Map" (detail view) | Map zooms to observation, feature highlighted | |

---

## Design Decision Summary (iNaturalist-Specific)

- **Simplest data source.** No Level 3, no dual-level filtering, no special entry points.
- **Cascading Taxon --> Species filter.** Species dropdown is dependent on Taxon selection.
- **Self-contained row bookmark.** Single "Bookmark" button, no filter captured. iNaturalist bookmarks in the Bookmarked Items widget show `[View] [x]` only (no "Edit Filter").
- **Observation detail view** is a simple expanded view, not a `FeatureDetailCard`. Uses back button + metadata grid + larger photo.
- **No map badges.** iNaturalist observations don't show count badges on map (no multi-level data to count).
- **Standard list pagination.** 20 observations per page, Previous/Next.

---

## Open Questions

1. **Taxon dropdown values:** What are the available taxon categories from the iNaturalist feature service? Need to query the service (Phase 1, Task 1.1) to determine options. Likely: Birds, Mammals, Reptiles, Amphibians, Fish, Insects, Plants, Fungi, etc.

2. **Photo fallback:** When an observation has no photo, what icon should represent it? Proposal: Lucide `Leaf` for plants, `Bug` for insects, `Bird` for birds, or a generic `Eye` icon. Could also use the iNaturalist iconic taxon icons. Needs service analysis.

3. **Observation detail view scroll position:** When the user clicks "Back to Observations" from the detail view, should the list scroll to the observation they were viewing, or scroll to the top? Proposal: restore previous scroll position (matches browser back-button expectations).

4. **Research grade toggle vs multi-select:** Current spec shows a single checkbox for "Research grade only." Should this be a multi-select (Research Grade, Needs ID, Casual) so users can see Needs ID observations too? Depends on service analysis.
