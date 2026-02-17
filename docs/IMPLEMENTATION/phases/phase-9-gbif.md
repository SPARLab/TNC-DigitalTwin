# Phase 9: GBIF Species Occurrences

**Status:** ⚪ Not Started  
**Progress:** 0 / 9 tasks  
**Branch:** `v2/gbif`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 9.1 | ⚪ Not Started | — | Research GBIF data source and API/service availability | Determine if GBIF data is served via ArcGIS FeatureServer or GBIF API; document fields and query patterns |
| 9.2 | ⚪ Not Started | — | Create GBIF right sidebar shell | Adapter, Overview/Browse/Export tabs, OccurrenceListView, OccurrenceDetailView |
| 9.3 | ⚪ Not Started | — | Implement search and filter UI | Species search, taxonomy filters, date range, dataset source, basis of record |
| 9.4 | ⚪ Not Started | — | Implement occurrence list with cards | Card anatomy: species, taxonomy, date, location, dataset, basis of record |
| 9.5 | ⚪ Not Started | — | Implement occurrence detail view | Full metadata, media, external GBIF link, citation |
| 9.6 | ⚪ Not Started | — | Sync loading indicators (Map Layers ↔ map center ↔ right sidebar) | Same shared loading pattern as other data sources |
| 9.7 | ⚪ Not Started | — | Render GBIF occurrences as map markers | Point geometry, filter-synced, click-to-detail |
| 9.8 | ⚪ Not Started | — | Wire Save View flow in detail | Save filtered view as child in Map Layers |
| 9.9 | ⚪ Not Started | — | Evaluate geographic extent expansion | GBIF supports any bounding box; consider preserve-only vs regional toggle |

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

Implement the GBIF (Global Biodiversity Information Facility) species occurrence browse experience in the right sidebar. GBIF aggregates biodiversity occurrence records from thousands of institutions worldwide. For Dangermond, this provides a complementary species observation layer beyond iNaturalist and CalFlora — potentially including museum specimens, research collections, and other observation networks.

### Data Source Status

**Unknown — needs research in Task 9.1:**
- Is GBIF data already ingested into an ArcGIS FeatureServer on `dangermondpreserve-spatial.com`?
- Or should we query the GBIF API directly (`api.gbif.org`)?
- Meeting notes mention "GBIF Species Occurrences" as a "notable dataset" in the Data Catalog service, suggesting it may already be in ArcGIS.

### Key Characteristics

- **Row Type:** Occurrence (individual species observation/collection at a point)
- **Cross-Category:** Primarily Species, but could span others depending on taxon
- **Geographic Extent:** GBIF supports any bounding box — candidate for expanded extent toggle (Preserve → Regional → California)
- **Overlap Consideration:** Some GBIF records originate from iNaturalist; de-duplication or source attribution may be needed

## Feature Service (TBD)

| Resource | URL |
|----------|-----|
| **GBIF Occurrences (if ArcGIS)** | TBD — discover during Task 9.1 |
| **GBIF API (if direct)** | `https://api.gbif.org/v1/occurrence/search` |

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Future Enhancements (expanded extent): `docs/PLANNING/future-enhancements.md`
- Meeting notes (GBIF mentions): `docs/PLANNING/feedback/meeting-notes/2026-02-11-digital-twin-future-vision.md`

## Key Paradigm Notes

- **Similar Pattern To:** iNaturalist — species occurrences on a map with taxonomy-based filtering
- **Save/View Options:** Save filtered views (species, date range, taxonomy filters)
- **Category Placement:** Species (primary)
- **Extent Expansion:** GBIF is explicitly called out as supporting expanded geographic extent (Preserve / Regional / California) in future enhancements doc. Phase 9 should implement preserve-only initially with architecture that supports future expansion.
- **De-duplication:** Some iNaturalist observations may appear in GBIF; consider flagging source or linking cross-references

### Expected GBIF Fields (standard GBIF schema — confirm in 9.1)

| Field | Type | Notes |
|-------|------|-------|
| `species` | string | Binomial species name |
| `vernacularName` | string | Common name |
| `kingdom` / `phylum` / `class` / `order` / `family` / `genus` | string | Full taxonomy |
| `decimalLatitude` / `decimalLongitude` | number | Point coordinates |
| `eventDate` | string | Observation/collection date |
| `basisOfRecord` | enum | `HUMAN_OBSERVATION`, `PRESERVED_SPECIMEN`, `MACHINE_OBSERVATION`, etc. |
| `datasetName` | string | Contributing dataset |
| `institutionCode` | string | Contributing institution |
| `catalogNumber` | string | Specimen/record ID |
| `media` | array | Photos/audio if available |
| `issues` | array | Data quality flags |

---

## Task Details

### 9.1: Research GBIF Data Source and API/Service Availability

**Goal:** Determine how GBIF data should be accessed for v2. This is the critical path decision for the entire phase.

**Acceptance Criteria:**
- [ ] Check `dangermondpreserve-spatial.com` Data Catalog service for GBIF layers
- [ ] If ArcGIS FeatureServer exists: document URL, fields, record count, query performance
- [ ] If no FeatureServer: evaluate GBIF API (`api.gbif.org`) for Dangermond bounding box queries
- [ ] Document available fields and compare to expected GBIF schema above
- [ ] Identify unique GBIF value vs iNaturalist (museum specimens, different observation networks, etc.)
- [ ] Assess record volume — how many GBIF occurrences exist within Dangermond bounds?
- [ ] Recommend approach: ArcGIS service vs GBIF API vs hybrid

**Questions to Answer:**
- Does an ArcGIS FeatureServer for GBIF already exist?
- What's the record count for the Dangermond Preserve bounding box?
- How much overlap exists with iNaturalist observations?
- What `basisOfRecord` types are represented?
- Are media (photos) available for Dangermond GBIF records?

**Output:** Add findings to "Service Analysis" section below.

---

### 9.2: Create GBIF Right Sidebar Shell

**Goal:** Set up the component structure following the standard v2 adapter pattern.

**Acceptance Criteria:**
- [ ] GBIF adapter registered in v2 data source registry
- [ ] Component renders when GBIF layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] Overview tab is default with "Browse Features →" button
- [ ] Component can show occurrence list OR detail (drill-down pattern)

**Files to Create:**
- `src/v2/dataSources/gbif/adapter.tsx`
- `src/v2/components/RightSidebar/GBIF/GBIFSidebar.tsx`
- `src/v2/components/RightSidebar/GBIF/GBIFBrowseTab.tsx`
- `src/v2/components/RightSidebar/GBIF/GBIFOverviewTab.tsx`
- `src/v2/components/RightSidebar/GBIF/OccurrenceListView.tsx`
- `src/v2/components/RightSidebar/GBIF/OccurrenceDetailView.tsx`

---

### 9.3: Implement Search and Filter UI

**Goal:** Create search and filter controls for GBIF occurrences.

**Acceptance Criteria:**
- [ ] Text search (species name — scientific and common) with debounce
- [ ] Taxonomy filters (kingdom, class, order, family — cascading or independent)
- [ ] Basis of record filter (human observation, preserved specimen, machine observation, etc.)
- [ ] Date range picker
- [ ] Dataset/institution filter (if enough variety)
- [ ] Result count ("Showing X of Y occurrences")
- [ ] Initial state loads all occurrences (most recent first)
- [ ] `AbortController` for request cancellation
- [ ] Empty results state with clear-all link
- [ ] ARIA live region for result count changes

---

### 9.4: Implement Occurrence List with Cards

**Goal:** Display GBIF occurrences as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: species name, common name (if available), basis of record badge, date, dataset name
- [ ] Basis of record badge color-coded (observation=blue, specimen=amber, machine=gray)
- [ ] Source attribution visible (institution/dataset)
- [ ] Full card clickable to open detail
- [ ] Pagination (20 per page)

---

### 9.5: Implement Occurrence Detail View

**Goal:** Show full occurrence details.

**Acceptance Criteria:**
- [ ] "← Back to Occurrences" navigation
- [ ] Full species name + common name
- [ ] Complete taxonomy (kingdom → genus)
- [ ] Location details (coordinates, locality description)
- [ ] Observation/collection date
- [ ] Basis of record
- [ ] Dataset name + institution
- [ ] Media display (photos if available)
- [ ] Data quality issues/flags (if any)
- [ ] "View on Map" button
- [ ] "Open in GBIF" external link (`gbif.org/occurrence/{id}`)
- [ ] Citation information
- [ ] Save View action

---

### 9.6: Sync Loading Indicators

**Goal:** Same shared loading pattern as other data sources.

**Acceptance Criteria:**
- [ ] GBIF adapter exposes `loading` via registry
- [ ] Map Layers widget, map center, and right sidebar all synchronized
- [ ] Uses shared loading primitives

---

### 9.7: Render GBIF Occurrences as Map Markers

**Goal:** Show GBIF occurrence locations on the map.

**Acceptance Criteria:**
- [ ] Create `gbifLayer.ts` with GraphicsLayer
- [ ] Add `gbif-occurrences` to `IMPLEMENTED_LAYERS`
- [ ] Wire into `createMapLayer` and registry
- [ ] Create `useGBIFMapBehavior` hook
- [ ] Respect sidebar filters
- [ ] Symbology: consider differentiating by basis of record or taxonomy
- [ ] Map click on marker opens occurrence detail
- [ ] Clustering for dense areas

---

### 9.8: Wire Save View Flow

**Goal:** Save filtered GBIF views as child views in Map Layers.

**Acceptance Criteria:**
- [ ] Save action creates/updates GBIF child view
- [ ] Auto-naming based on active filters (species, taxonomy, date)
- [ ] Selecting saved child view restores filters + selected occurrence

---

### 9.9: Evaluate Geographic Extent Expansion

**Goal:** GBIF is a prime candidate for the expanded geographic extent feature. Evaluate and optionally prototype.

**Acceptance Criteria:**
- [ ] Document how extent toggle would work for GBIF queries
- [ ] If implementing: add extent selector to filter UI (Preserve / Regional / California)
- [ ] If deferring: document architecture decisions that keep future expansion easy
- [ ] Note: this may be deferred to future enhancements (v2.1+) per `future-enhancements.md`

---

## Service Analysis

> Fill this out during Task 9.1

### Data Source (TBD)
- ArcGIS FeatureServer URL: TBD
- GBIF API endpoint: `https://api.gbif.org/v1/occurrence/search`

### Occurrence Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| (to be documented in 9.1) | | | |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| (to be documented in 9.1) | | |

### iNaturalist Overlap Assessment
> Document during 9.1: how many GBIF records are sourced from iNaturalist? Should we filter them out or flag them?

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

- [ ] Is GBIF data already in an ArcGIS FeatureServer, or do we need to query the GBIF API?
- [ ] How much overlap exists with iNaturalist? Should we de-duplicate or show source attribution?
- [ ] Should GBIF be the first data source to implement the expanded geographic extent toggle?
- [ ] Are museum specimen records (preserved specimens) valuable for Dangermond researchers?
- [ ] Should GBIF and iNaturalist share any UI components (similar data shapes)?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | — | Created phase document | Will + Claude |
