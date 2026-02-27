# Phase 8: Calflora Plant Observations

**Status:** 🟡 In Progress  
**Progress:** 1 active task remaining (8 completed tasks archived)  
**Branch:** `v2/calflora`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

> **Catalog visibility:** CalFlora layer is temporarily hidden from the left-sidebar catalog (CON-INAT-11, Feb 27, 2026) due to licensing ambiguity. Custom sidebar/map/adapter logic remains in codebase. Re-enable by uncommenting `calflora-observations` in `layerRegistry.ts` after implementing CON-INAT-13 (licensing-safe media filter).

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 8.9 | ⚪ Not Started | — | Port and validate v1 CalFlora features | Audit v1 CalFloraSidebar/CalFloraDetailsSidebar for any features that need v2 parity |

**Archived completed tasks:** `8.1` through `8.8` moved to `docs/archive/phases/phase-8-calflora-completed.md` on Feb 25, 2026.

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the CalFlora plant observation browse experience in the right sidebar. CalFlora provides botanical observation data for the Dangermond Preserve — native plants, invasive species, and vegetation mapping. This data source is structurally similar to iNaturalist (point observations with species metadata) but focused on plant biodiversity.

### v1 Assets Available

The v1 codebase includes working CalFlora components that can inform (but not directly reuse) the v2 implementation:

| v1 File | Purpose | v2 Relevance |
|---------|---------|--------------|
| `src/services/calFloraService.ts` | ArcGIS FeatureServer queries, rate limiting, field mapping | Service patterns, endpoint URLs, field names |
| `src/components/CalFloraSidebar.tsx` | Browse/search UI | Filter design, card anatomy reference |
| `src/components/CalFloraDetailsSidebar.tsx` | Observation detail view | Detail layout, field display reference |
| `src/components/CalFloraPlantModal.tsx` | Plant photo/info modal | May inform detail view design |
| `src/components/MapView/loaders/calFloraLoader.ts` | Map marker rendering | Symbology, clustering patterns |

## Feature Service

| Resource | URL |
|----------|-----|
| **CalFlora Observations** | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/CalFlora_Dangermond_Observations_Clean/FeatureServer/0` |

Append `?f=json` to inspect fields and metadata.

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- v1 CalFlora Service: `src/services/calFloraService.ts`
- v1 CalFlora Sidebar: `src/components/CalFloraSidebar.tsx`

## Key Paradigm Notes

- **Row Type:** Observation (individual plant observation at a point)
- **Save/View Options:** Save filtered views (species, native status, date range)
- **Category Placement:** Species (primary), Land Cover (secondary cross-listing)
- **Similar Pattern To:** iNaturalist — point observations with species taxonomy, map markers, search/filter/detail flow

### Known Data Fields (from v1 `CalFloraPlant` interface)

| Field | Type | Notes |
|-------|------|-------|
| `scientificName` | string | Primary identifier |
| `commonName` | string (nullable) | Display-friendly name |
| `family` | string (nullable) | Taxonomic family |
| `nativeStatus` | enum | `native`, `non-native`, `invasive`, `unknown` |
| `calIpcRating` | string (nullable) | Cal-IPC invasiveness rating |
| `location` | [lon, lat] | Point geometry |
| `county` | string (nullable) | County name |
| `quad` | string (nullable) | USGS quadrangle |
| `elevation` | number (nullable) | Elevation in meters |
| `observationDate` | string (nullable) | Date of observation |
| `lastUpdated` | string | Last metadata update |
| `dataSource` | enum | `calflora-invasive`, `calflora-native`, `calflora-vegetation`, `calflora-dangermond` |

---

## Task Details

### 8.1: Query CalFlora Service to Understand v2 Attributes

**Goal:** Audit the live Feature Service against v1 field mappings. Document any new fields, confirm field types, and plan card/detail anatomy for v2.

**Acceptance Criteria:**
- [ ] Query FeatureServer `?f=json` and document all available fields
- [ ] Compare against v1 `CalFloraPlant` interface — note additions/removals
- [ ] Identify which attributes are useful for search/filtering in v2
- [ ] Identify which attributes should display in observation cards vs detail view
- [ ] Document query performance baselines (count, filtered, text search)

**Output:** Add findings to "Service Analysis" section below.

---

### 8.2: Create CalFlora Right Sidebar Shell

**Goal:** Set up the component structure for the CalFlora browse experience following the standard v2 adapter pattern.

**Acceptance Criteria:**
- [ ] CalFlora adapter registered in v2 data source registry
- [ ] Component renders when CalFlora layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] Overview tab is the default/active tab with "Browse Features →" button
- [ ] Component can show observation list OR observation detail (drill-down pattern)
- [ ] Header clearly indicates data source context

**Files to Create:**
- `src/v2/dataSources/calflora/adapter.tsx`
- `src/v2/components/RightSidebar/CalFlora/CalFloraSidebar.tsx`
- `src/v2/components/RightSidebar/CalFlora/CalFloraBrowseTab.tsx`
- `src/v2/components/RightSidebar/CalFlora/CalFloraOverviewTab.tsx`
- `src/v2/components/RightSidebar/CalFlora/ObservationListView.tsx`
- `src/v2/components/RightSidebar/CalFlora/ObservationDetailView.tsx`

---

### 8.3: Implement Search and Filter UI

**Goal:** Create search and filter controls for discovering plant observations.

**Acceptance Criteria:**
- [ ] Text search (species name — scientific and common) with debounce
- [ ] Native status filter dropdown (`native`, `non-native`, `invasive`, `unknown`)
- [ ] Family filter dropdown (populated from service)
- [ ] Cal-IPC rating filter (if data present)
- [ ] Date range picker
- [ ] Result count ("Showing X of Y observations")
- [ ] Initial state loads all observations (most recent first)
- [ ] `AbortController` cancels in-flight requests on filter change
- [ ] Empty results state with "Clear all filters" link
- [ ] ARIA live region announces result count changes
- [ ] Filters persist when navigating to detail and back

---

### 8.4: Implement Observation List with Cards

**Goal:** Display plant observations as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: scientific name, common name, native status badge, family
- [ ] Native status badge color-coded (green=native, red=invasive, yellow=non-native, gray=unknown)
- [ ] Observation date displayed
- [ ] Elevation shown if available
- [ ] Full card clickable to open detail (per DataONE pattern)
- [ ] Pagination (20 per page)

---

### 8.5: Implement Observation Detail View

**Goal:** Show full observation details when a card is clicked.

**Acceptance Criteria:**
- [ ] "← Back to Observations" navigation
- [ ] Full species name (scientific + common)
- [ ] Taxonomic info (family, native status, Cal-IPC rating)
- [ ] Location details (county, quad, elevation, coordinates)
- [ ] Observation date and last updated
- [ ] Data source attribution
- [ ] "View on Map" button to center map on observation
- [ ] Save View action
- [ ] External link to CalFlora source (if available)

---

### 8.6: Sync Loading Indicators

**Goal:** Synchronize loading indicators using the same shared pattern as iNaturalist and DataONE.

**Acceptance Criteria:**
- [ ] CalFlora adapter exposes `loading` via registry
- [ ] Map Layers widget shows spinner for CalFlora layer when loading
- [ ] Map center shows overlay on first load only
- [ ] Right sidebar shows inline/refresh loading rows
- [ ] Uses shared loading primitives from `LoadingPrimitives.tsx`

---

### 8.7: Render CalFlora Observations as Map Markers

**Goal:** Show plant observation locations on the map as colored markers.

**Acceptance Criteria:**
- [ ] Create `calFloraLayer.ts` with GraphicsLayer from observation coordinates
- [ ] Add `calflora-observations` to `IMPLEMENTED_LAYERS`
- [ ] Wire into `createMapLayer` switch
- [ ] Create `useCalFloraMapBehavior` hook
- [ ] Respect sidebar filters — only show matching observations
- [ ] Color-code markers by native status (or configurable symbology)
- [ ] Map click on marker opens observation detail in right sidebar
- [ ] ArcGIS popup/tooltip on marker click (plant, county, date)
- [ ] Clustering for dense areas (optional)

---

### 8.8: Wire Save View Flow in Detail

**Goal:** Save filtered CalFlora views as child views in Map Layers.

**Acceptance Criteria:**
- [ ] Save action in detail view creates/updates CalFlora child view
- [ ] Auto-naming based on active filters (species, native status, date range)
- [ ] Selecting saved child view restores CalFlora filters + selected observation
- [ ] Follows shared child-view conventions from `LayerContext`

---

### 8.9: Port and Validate v1 CalFlora Features

**Goal:** Audit v1 CalFlora components for any features not covered by tasks 8.1–8.8 and ensure v2 parity.

**Acceptance Criteria:**
- [ ] Review `CalFloraSidebar.tsx` for any unique filter/display logic
- [ ] Review `CalFloraDetailsSidebar.tsx` for detail fields not in 8.5
- [ ] Review `CalFloraPlantModal.tsx` for photo display or modal patterns
- [ ] Review `calFloraLoader.ts` for map symbology decisions worth preserving
- [ ] Document any gaps as follow-up tasks

---

## Service Analysis

> Fill this out during Task 8.1

### Feature Service URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/CalFlora_Dangermond_Observations_Clean/FeatureServer/0`

### Observation Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `objectid` | OID | stable feature id | Used for detail routing and map click sync |
| `id` | string | external link key | Maps to `https://www.calflora.org/occ/entry/{id}.html` |
| `plant` | string | search + card title | Primary taxonomy field (species text) |
| `county` | string | county filter + card metadata | Currently always `Santa Barbara` in dataset |
| `date_` | string (`YYYY-MM-DD`) | date-range filtering + sort | Stored as string, not ArcGIS Date type |
| `photo` | string | "Has photo" filter + detail media | 31 / 81 records currently have non-empty value |
| `observer` | string | detail metadata | Good coverage in recent records |
| `elevation` | string | detail metadata | Mostly empty in current sample |
| `associated_species` | string | detail metadata | Optional contextual species notes |
| `habitat` | string | detail metadata | Optional habitat notes |
| `notes` | string | detail metadata | Optional free text |
| `citation` | string | detail metadata | Optional citation text |
| `location_quality` | string | detail metadata | e.g., `high` |
| geometry (`x`,`y`) | point | map rendering + "View on map" | Works with `outSR=4326` in v2 queries |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| `returnCountOnly` (`where=1=1`) | ~164 ms | Total observations = 81 |
| page query (20 records) | ~141 ms | `orderByFields=date_ DESC, objectid DESC` |
| text search (`plant` LIKE `%QUERCUS%`) | ~142 ms | Returns 1 match in current dataset |
| photo-only count | ~136 ms | 31 records with non-empty `photo` |
| date range count (`date_ >= '2020-01-01'`) | ~134 ms | 38 records in sample date window |

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| CalFlora v2 first pass uses `plant` as primary taxonomy field | Feb 23, 2026 | Service lacks normalized family/native status/Cal-IPC attributes; implementation should avoid fabricating taxonomy fields and instead expose available data reliably. |
| CalFlora Browse tab includes `search + county + date + has photo` for MVP | Feb 23, 2026 | These are the highest-signal fields available directly from service without brittle client-side inference. |
| CalFlora layer soft-hidden from catalog (CON-INAT-11) | Feb 27, 2026 | Licensing ambiguity re: displaying raw data and downloadable media. Layer removed from EXTERNAL_LAYERS; all implementation code retained. Re-enable after CON-INAT-13 (Phase 1) implements licensing-safe media filter. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Does CalFlora service have photos/images for observations?
- [ ] Should native status color-coding match any existing CalFlora or botanical convention?
- [ ] Is there overlap between CalFlora and iNaturalist plant observations? If so, how to handle?
- [ ] Should CalFlora support the expanded geographic extent toggle (future enhancement)?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 27, 2026 | CON-INAT-11 | CalFlora layer soft-hidden from left-sidebar catalog (Phase 1 task). Implementation code retained; re-enable after CON-INAT-13 (licensing-safe media filter). See phase-1-inaturalist.md. | — |
| Feb 23, 2026 | 8.4, 8.7 | UX polish: card photo thumbnails; removed list-level "View on map" (card click drives async map pan/zoom); CalFlora map legend widget; ArcGIS popup on marker click; casing-safe objectId extraction for map→detail sync. | Cursor |
| Feb 23, 2026 | 8.2–8.8 | Marked complete. Full CalFlora vertical slice shipped: sidebar shell, search/filter UI (plant, county, date, has photo), observation cards, detail view, loading sync, map markers, Save View flow. Native status/family/Cal-IPC deferred (service lacks fields). | Cursor |
| Feb 23, 2026 | 8.8 | Added first-pass CalFlora Save View flow: `syncCalFloraFilters` + `createOrUpdateCalFloraFilteredView` in `LayerContext`; CalFlora Browse hydrates filters from active child view and Save View in detail now creates/selects child views. | Cursor |
| Feb 23, 2026 | 8.1, 8.2 | Completed live service audit (field schema + performance baseline) and shipped initial v2 CalFlora vertical slice: external layer registration, adapter/provider wiring, Overview + Browse tabs, observation list/detail, map markers, marker click-to-detail sync. | Cursor |
| Feb 16, 2026 | — | Created phase document | Will + Claude |
