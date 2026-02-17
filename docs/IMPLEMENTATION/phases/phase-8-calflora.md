# Phase 8: Calflora Plant Observations

**Status:** ⚪ Not Started  
**Progress:** 0 / 9 tasks  
**Branch:** `v2/calflora`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 8.1 | ⚪ Not Started | — | Query CalFlora service to understand v2 attributes | v1 service exists at `calFloraService.ts`; need to audit fields for v2 card/detail anatomy |
| 8.2 | ⚪ Not Started | — | Create CalFlora right sidebar shell | Adapter, Overview/Browse/Export tabs, DatasetListView, DetailView |
| 8.3 | ⚪ Not Started | — | Implement search and filter UI | Text search (species name), native status filter, family filter, date range, Cal-IPC rating |
| 8.4 | ⚪ Not Started | — | Implement observation list with cards | Card anatomy: species name, common name, native status badge, family, location, date, Cal-IPC rating |
| 8.5 | ⚪ Not Started | — | Implement observation detail view | Full observation metadata, photo (if available), spatial coverage, external links |
| 8.6 | ⚪ Not Started | — | Sync loading indicators (Map Layers ↔ map center ↔ right sidebar) | Same shared loading pattern as iNaturalist/DataONE |
| 8.7 | ⚪ Not Started | — | Render CalFlora observations as map markers | Point geometry from `location` field, filter-synced, click-to-detail |
| 8.8 | ⚪ Not Started | — | Wire Save View flow in detail | Save filtered view as child in Map Layers, restore on reactivation |
| 8.9 | ⚪ Not Started | — | Port and validate v1 CalFlora features | Audit v1 CalFloraSidebar/CalFloraDetailsSidebar for any features that need v2 parity |

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
| (to be documented in 8.1) | | | |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| (to be documented in 8.1) | | |

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

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
| Feb 16, 2026 | — | Created phase document | Will + Claude |
