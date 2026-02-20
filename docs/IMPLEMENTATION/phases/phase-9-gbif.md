# Phase 9: GBIF Species Occurrences

**Status:** 🟡 In Progress  
**Progress:** 10 / 12 tasks  
**Branch:** `v2/gbif`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

**Suggested next task (new chat):** 9.8 Wire Save View flow (deferred) — or 9.12 Backend GBIF map aggregation (deferred to v2.1+).

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| TF-09 | ⚪ Not Started | Feb 20, 2026 | Implement grouping/clustering strategy for 328k data points to improve map performance | Medium priority; Will and Dan already discussing approach. Source: Trisalyn QA Feb 20 |
| 9.1 | 🟢 Complete | 2026-02-19T17:30:00-08:00 | Research GBIF data source and API/service availability | Confirmed ArcGIS FeatureServer in Data Catalog: `dataset-178` → `Dangermond_Preserve_Species_Occurrences/FeatureServer/0`; GBIF direct API not required for v2.0 |
| 9.2 | 🟢 Complete | 2026-02-19T17:30:00-08:00 | Create GBIF right sidebar shell | Added GBIF adapter override for `dataset-178`, overview + browse/detail flow in right sidebar |
| 9.3 | 🟢 Complete | 2026-02-19T17:30:00-08:00 | Implement search and filter UI | Server-side filters: text search, taxonomy (kingdom/class/family), basis of record, dataset, date range (year-bounded); `order` filter deferred due ArcGIS reserved-field query error |
| 9.4 | 🟢 Complete | 2026-02-19T18:00:00-08:00 | Implement occurrence list with cards | iNaturalist-style cards with species naming, basis badge, date, dataset/source action; card thumbnails from `primary_image_url` when present |
| 9.5 | 🟢 Complete | 2026-02-19T17:30:00-08:00 | Implement occurrence detail view | Added detail metadata, taxonomy string, quality issue count, map focus CTA, external GBIF link |
| 9.6 | 🟢 Complete | 2026-02-19T17:30:00-08:00 | Sync loading indicators (Map Layers ↔ map center ↔ right sidebar) | Integrated cache/loading status via adapter + shared loading primitives in browse |
| 9.7 | 🟢 Complete | 2026-02-19T19:00:00-08:00 | Render GBIF occurrences as map markers | Explicit `createGBIFLayer`; green circles + clustering; zoom-based cluster sizing; compact K/M/B labels; `outFields: ['id']` for lighter payload; filter-synced via `useGBIFMapBehavior`; map-click opens detail |
| 9.8 | ⚪ Not Started | — | Wire Save View flow in detail | Deferred; requires `LayerContext` GBIF filter persistence + view naming wiring |
| 9.9 | ⚪ Not Started | — | Evaluate geographic extent expansion | Deferred to follow-up after preserve-only stability and stakeholder review |
| 9.10 | 🟢 Complete | 2026-02-19T18:00:00-08:00 | Fix map rendering + add card thumbnails | Map: explicit `gbifLayer.ts` + `dataset-178` in `createMapLayer` switch (bypasses TNC registration); Cards: show `primary_image_url` when present |
| 9.11 | 🟢 Complete | 2026-02-19T17:00:00-08:00 | Improve GBIF map visual performance | Client-side: viewport SQL bounds + zoom-level sampling (`MOD(id, n)`); fixed webMercatorUtils import. Backend pre-aggregation recommended for smooth 323k+ scale — see 9.12 |
| 9.12 | ⚪ Deferred | — | Backend GBIF map aggregation | For buttery zoom/pan at ~323k+ occurrences: pre-aggregated clusters by zoom, vector tiles, or viewport-capped queries. Deferred to v2.1+ |

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

### 9.11: Improve GBIF Map Visual Performance

**Goal:** At ~300k+ occurrences, client-side clustering can feel sluggish during zoom/pan. Improve perceived responsiveness and reduce render load.

**Acceptance Criteria:**
- [ ] Evaluate options: backend pre-aggregation (zoom-level bins), vector tiles, viewport-based query limits
- [ ] Implement chosen approach so zoomed-out views show fewer, larger clusters; zoomed-in views load only relevant points
- [ ] Cluster click queries only the clicked area for detail rows (lazy load)
- [ ] Smooth zoom/pan without visible lag or stutter

**Notes:** Current frontend optimizations (zoom-bucketed cluster radius, compact K/M/B labels, minimal `outFields`) help but have a ceiling. Backend aggregation is the recommended path for buttery interaction at full dataset scale.

**Implementation (2026-02-19):**
- Viewport SQL bounds using `decimal_longitude` / `decimal_latitude` from map extent (20% buffer)
- Zoom-bucket sampling via `MOD(id, n)` for far-zoomed views
- Backend pre-aggregation deferred to task 9.12 (v2.1+)

---

### 9.5 Enhancement: GBIF API Media Fallback (2026-02-19)

**Goal:** Show photos when ArcGIS `primary_image_url` is null — many specimen records lack images in the FeatureServer.

**Implementation:**
- `gbifService.getMediaUrlsByGbifKey(gbifKey)` fetches from `api.gbif.org/v1/occurrence/{gbifKey}`
- Detail view: if no `primaryImageUrl` but `gbifKey` exists, fetches media; shows loading state; multi-image thumbnail strip when available
- Files: `gbifService.ts`, `GBIFOccurrenceDetailView.tsx`

---

### 9.10: Fix Map Rendering + Add Card Thumbnails

**Goal:** Resolve GBIF points not appearing on map; add photo thumbnails to occurrence cards when available.

**Acceptance Criteria:**
- [x] GBIF occurrences render on map when layer is active
- [x] Explicit `createGBIFLayer` for `dataset-178` in layer factory (bypasses TNC registration)
- [x] Card thumbnails from `primary_image_url` when present; Database icon fallback otherwise
- [x] Exclude `gbif_key` from FeatureLayer `outFields` to avoid big-integer warning

**Files Changed:**
- `src/v2/components/Map/layers/gbifLayer.ts` (new)
- `src/v2/components/Map/layers/index.ts` (explicit case for `dataset-178`)
- `src/v2/components/RightSidebar/GBIF/GBIFOccurrenceCard.tsx` (thumbnail support)

---

## Service Analysis

> Fill this out during Task 9.1

### Data Source (Task 9.1)
- ArcGIS FeatureServer URL: `https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Species_Occurrences/FeatureServer/0`
- GBIF API endpoint: `https://api.gbif.org/v1/occurrence/search`
- Data Catalog mapping: `dataset-178` (`GBIF Species Occurrence Records`)
- v2.0 recommendation: ArcGIS FeatureServer first (already curated, no extra API auth/rate-limit complexity)

### Occurrence Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `id` | number | Stable feature identity | Used for map click → detail state |
| `gbif_key` | string | External GBIF deep-linking | Build `gbif.org/occurrence/{gbif_key}` |
| `scientific_name` / `species` | string | Primary card/detail naming | Fallback logic if one is null |
| `kingdom` / `taxonomic_class` / `order` / `family` / `genus` | string | Taxonomy filters + metadata | Supports iNaturalist-like taxonomic drill context |
| `basis_of_record` | string | Record-type filtering | Includes observation/specimen style values |
| `dataset_name` | string | Source attribution + filter | Visible on cards/details |
| `recorded_by` | string | Provenance metadata | Included in detail |
| `event_date_json` | string | Temporal filtering + display | Parsed to normalized date string for UI |
| `primary_image_url` | string | Detail hero media | Often null for specimen/fossil records |
| `issues_json` | string | Quality flags | Parsed to issue count in detail view |
| Geometry (`x`, `y`) | point | Map marker placement | ArcGIS point geometry |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| Catalog dataset discovery | < 1s | Found GBIF row in Data Catalog table 1 |
| GBIF layer metadata fetch | < 1s | Confirms layer 0: `GBIF Occurrences` |
| Count query (`returnCountOnly=true`) | < 1s | Current count observed: ~323k records |
| Paginated query (20 rows) | < 1s | Suitable for server-side browse pagination |

### iNaturalist Overlap Assessment
Record-level overlap with iNaturalist is still unquantified in this phase implementation. Current approach keeps all records and surfaces dataset/source attribution (`dataset_name`) in cards/details. A follow-up task can add explicit overlap flags if needed.

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Use ArcGIS FeatureServer (`dataset-178`) instead of direct GBIF API for v2.0 | 2026-02-19 | Already cataloged in app infrastructure, supports map + SQL filtering + pagination without new API integration risk |
| Use server-side filtering/pagination for GBIF browse | 2026-02-19 | Record volume (~323k) is too large for iNaturalist-style full client cache |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| GBIF browse/detail mirrors iNaturalist card + detail anatomy (with GBIF-specific fields) | 2026-02-19 | Preserves cross-source consistency and recognition-over-recall while handling distinct data semantics | No (phase-local styling parity) |

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
| Feb 19, 2026 | 9.1-9.7 | Implemented GBIF ArcGIS integration: adapter override for `dataset-178`, overview/browse/detail UI, server-side filters/pagination, map click-to-detail behavior | Cursor |
| Feb 19, 2026 | 9.10 | Fixed map rendering (explicit `gbifLayer.ts` + `dataset-178` in `createMapLayer`); added card thumbnails from `primary_image_url` | Cursor |
| Feb 19, 2026 | 9.7, 9.11 | Enhanced clustering: zoom-bucketed radius, compact K/M/B labels, minimal outFields; added task 9.11 for backend aggregation / visual performance | Cursor |
| Feb 19, 2026 | 9.11 | Started viewport-based performance pass: map extent-limited SQL + scale-based sampling (`MOD(id, n)`) in GBIF map behavior | Cursor |
| Feb 19, 2026 | 9.11 | Complete: viewport + sampling in place; fixed webMercatorUtils import; added task 9.12 for backend aggregation (deferred) | Cursor |
| Feb 19, 2026 | 9.5 | GBIF API media fallback: fetch occurrence media when ArcGIS lacks primary_image_url; hero + thumbnail strip in detail view | Cursor |
