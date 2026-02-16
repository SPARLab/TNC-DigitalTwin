# Phase 4: DataOne Right Sidebar

**Status:** 🟡 In Progress  
**Progress:** 11 / 12 tasks  
**Branch:** `v2/dataone`  
**Depends On:** Phase 0 (Foundation)  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 4.1 | 🟢 Complete | Feb 16, 2026 | Query DataOne service to understand attributes | Service schema analyzed (layers 0/1/2), key UI fields selected, category mapping + file-detail strategy documented below. |
| 4.2 | 🟢 Complete | Feb 16, 2026 | Create DataOne right sidebar shell | DataOne adapter + right sidebar tabs scaffolded in v2 (`DataOneOverviewTab`, `DataOneBrowseTab`, `DatasetListView`, `DatasetDetailView`, provider wiring, external layer registration). Left-sidebar shortcut rows (DFT-045) deferred to future task. |
| 4.3 | 🟢 Complete | Feb 16, 2026 | Implement search and filter UI | Debounced search (500ms, 2+ chars), Enter bypass, category/year/author filters, result count + ARIA live region, empty state clear-all, pagination, stale-results refresh, `AbortController` cancellation. Service extended with `author` filter and `signal` support. |
| 4.4 | 🟢 Complete | Feb 16, 2026 | Implement dataset list with cards | Dataset cards now include title, authors, year, description snippet fallback, DOI badge (when `dataone_id` is DOI), file count/types summary, save-view action button, details navigation, and "Open in DataONE ↗" external action. |
| 4.5 | 🟢 Complete | Feb 16, 2026 | Implement dataset detail view | Added full dataset detail drill-down with back navigation, full abstract/authors/temporal metadata, file list + type descriptions + size summary, spatial coverage with "View on Map", clickable keywords (apply browse search), save-view action, primary "Open in DataONE", and copy DOI/citation actions. |
| 4.6 | 🟢 Complete | Feb 16, 2026 | Sync loading indicators (Map Layers widget ↔ map center ↔ right sidebar) | DataOne loading now propagates from shared context to adapter/registry, so Map Layers eye-slot spinner, map-center first-load overlay, and right-sidebar loading rows stay synchronized. |
| 4.7 | 🟢 Complete | Feb 16, 2026 | Render DataONE datasets as map markers (dots or clusters) | Added DataONE map layer + map behavior with filter-synced marker population from `center_lat`/`center_lon`, wired registry/layer factory (`dataone-datasets`), and map-click-to-detail flow (marker click activates DataONE + opens dataset detail in Browse). |
| 4.8 | 🟢 Complete | Feb 16, 2026 | Make full dataset card clickable to open detail | Browse cards now open detail on card click + Enter/Space with card-level hover/focus states; inner action controls stop propagation so card navigation does not depend on the Details button. |
| 4.9 | 🟢 Complete | Feb 16, 2026 | Simplify browse card actions and visual hierarchy | Removed browse card CTA row (`Save View`, `Details`, `Open in DataONE`) and shifted metadata to low-contrast, secondary inline chips/text for cleaner scanning. |
| 4.10 | 🟢 Complete | Feb 16, 2026 | Add DataONE open modes in detail view (new tab + iframe) | Added detail-only dual open actions: secure new-tab open and in-app embedded iframe panel with close control, loading state, and blocked/error fallback that routes users to new-tab open. |
| 4.11 | 🟢 Complete | Feb 16, 2026 | Move and wire Save Dataset View in detail flow | Save action now lives in detail view only and creates/updates DataONE child views in Map Layers with filter-based auto naming, single-visible-child behavior, and restored detail context when selecting saved views. |
| 4.12 | ⚪ Not Started | Feb 16, 2026 | Reimplement dataset version history exploration (v1 parity) | Add version history widget to browse cards and detail view; preserve v1 styling (inline expandable in browse, collapsible panel in detail). See v1: `DataONEView.tsx`, `DataONEDetailsSidebar.tsx`. |

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

Implement the DataOne dataset browse experience in the right sidebar. This data source has:
- **Pointer rows** (datasets point to files)
- **No Level 3 filtering** (datasets are saved as whole views, not filtered)
- **Cross-category nature** (datasets span all TNC categories)
- **No bookmarking workflow** moving forward (use save/view language and behavior)

## Feature Service (Inspect DataONE Layer)

The DataONE datasets are served from an ArcGIS Feature Service. Use these URLs to inspect metadata and layer schemas:

| Resource | URL |
|----------|-----|
| **Service metadata** (list layers) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer?f=json` |
| **Layer 0 (Lite)** — lightweight fields, fast list load (~12k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/0?f=json` |
| **Layer 1 (Latest)** — full metadata including abstracts | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/1?f=json` |
| **Layer 2 (AllVersions)** — all versions for history lookup (~22k records) | `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer/2?f=json` |

Append `?f=json` to any URL to get ArcGIS REST metadata (layers, fields, types). Used by `src/services/dataOneService.ts` and `src/types/dataone.ts`.

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 10 - Cross-Category)
- Mockup: `mockups/02e-browse-dataone.html`

## Key Paradigm Notes

- **Row Type:** Pointer (dataset points to files)
- **Save/View Options:** Only "Save Dataset View" (no filter-specific save path)
- **No Level 3:** Datasets are saved as whole views, not filtered by individual files
- **Cross-Category:** DataOne appears under "Research Datasets (All Categories)" with category filter in right sidebar
- **Left Sidebar Shortcuts (DFT-045):** Special shortcut rows appear in domain categories (Species, Fire, etc.) labeled "DataOne Datasets (count)". Clicking activates DataOne with that domain pre-filtered. Improves discoverability for domain-first users.

## Task Details

### 4.1: Query DataOne Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the DataOne feature service.

**Acceptance Criteria:**
- [ ] Document dataset feature service attributes
- [ ] Identify which attributes are useful for search/filtering
- [ ] Identify which attributes should display in dataset cards
- [ ] Note the category mapping (AI-enriched categories)

**Questions to Answer:**
- What metadata fields exist? (title, authors, abstract, DOI, keywords)
- How are TNC categories assigned? (AI-enriched field?)
- Are file lists included in the feature service or fetched separately?
- What's the bounding box / spatial coverage format?

**Output:** Add findings to "Service Analysis" section below.

---

### 4.2: Create DataOne Right Sidebar Shell

**Goal:** Set up the component structure for the DataOne browse experience.

**Decision (Feb 2, 2026):** Resolved DFT-006 — Overview tab opens first when layer is selected, with prominent "Browse Features →" button.
**Decision (Feb 4, 2026):** Resolved DFT-027 — "Browse Features →" button design specification: full-width primary button (TNC green, white text, min 44px height), bottom of Overview content, inline arrow (→), hover effects (color shift + 1.02x scale), 2px focus outline, 150-200ms ease-out transition.

**Acceptance Criteria:**
- [ ] Component renders when DataOne layer is selected
- [ ] Tabs exist: Overview | Browse | Export
- [ ] **Overview tab is the default/active tab**
- [ ] Overview tab includes prominent "Browse Features →" button to navigate to Browse tab
  - [ ] Button is full-width within sidebar content area
  - [ ] Button uses primary styling: TNC green background (`#2e7d32`), white text
  - [ ] Button minimum height: 44px (accessibility/Fitts's Law)
  - [ ] Button label: "Browse Features →" (arrow inline with text, Unicode U+2192 or SVG)
  - [ ] Placement: bottom of Overview tab content (or top if Overview is minimal < 3 sentences)
  - [ ] Hover state: slight color shift + subtle scale (1.02x)
  - [ ] Focus state: 2px outline for keyboard navigation
  - [ ] Click behavior: navigates to Browse tab with 150-200ms ease-out crossfade transition
- [ ] Component can show dataset list OR dataset detail (drill-down pattern)
- [ ] Header clearly indicates "Research data across all categories"
- [ ] **Left sidebar shortcuts (DFT-045):**
  - [ ] Query DataOne service for category distribution on sidebar mount
  - [ ] Render special shortcut rows in expanded domain categories (if count > 0)
  - [ ] Shortcut rows labeled "DataOne Datasets (count)" with books icon
  - [ ] Clicking shortcut row activates DataOne with domain pre-filter applied

**Files to Create:**
- `src/v2/components/RightSidebar/DataOne/DataOneSidebar.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneOverviewTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DataOneExportTab.tsx`
- `src/v2/components/RightSidebar/DataOne/DatasetListView.tsx`
- `src/v2/components/RightSidebar/DataOne/DatasetDetailView.tsx`

---

### 4.3: Implement Search and Filter UI

**Goal:** Create search and filter controls for discovering datasets.

**Decision (Feb 5, 2026):** Resolved DFT-035 — Debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Enter key bypasses debounce. Initial state loads all datasets (most recent first), eliminating v1 "pre-search" dead state. Pagination with Previous/Next (20 per page). `AbortController` cancels in-flight requests.

**Acceptance Criteria:**
- [ ] Text search box with 500ms debounce (2+ character minimum)
- [ ] Enter key bypasses debounce and fires immediately
- [ ] Category dropdown (all 13 TNC categories) fires immediately on change
- [ ] Year range picker fires immediately on change
- [ ] Author filter (optional) fires immediately on change
- [ ] Filter count shows "Showing X of Y datasets" (updates live)
- [ ] Initial state loads all datasets (most recent first), no "pre-search" empty state
- [ ] `AbortController` cancels in-flight requests when filters change
- [ ] Loading feedback per DFT-018 thresholds (inline spinner, stale results with overlay)
- [ ] Empty results show "No datasets match your filters" + "Clear all filters" link
- [ ] ARIA live region announces result count changes
- [ ] Filters persist when navigating to detail and back

**Reference:** 
- Mockup `02e-browse-dataone.html` "Search & Filter" section
- DFT-035 resolution in `planning-task-tracker.md`

---

### 4.4: Implement Dataset List with Cards

**Goal:** Display datasets as browseable cards.

**Acceptance Criteria:**
- [ ] Cards show: title, authors, year, description snippet
- [ ] DOI badge (if available)
- [ ] File count/types shown (e.g., "3 files: CSV, PDF, XML")
- [ ] "Save View" button (simple, no filter option)
- [ ] "Details →" button navigates to detail view
- [ ] "Open in DataOne ↗" external link

**Reference:** Mockup `02e-browse-dataone.html` dataset cards

---

### 4.5: Implement Dataset Detail View

**Goal:** When user clicks a dataset, show its full details.

**Acceptance Criteria:**
- [x] "← Back to Datasets" navigation
- [x] Full title and author list
- [x] Complete abstract (not truncated)
- [x] Files list with sizes and descriptions
- [x] Spatial coverage (bounding box, "View on Map" button)
- [x] Keywords as clickable tags
- [x] Temporal coverage
- [x] "Save Dataset View" button
- [x] "Open in DataOne ↗" primary action
- [x] "Copy DOI" and "Cite" buttons

**Reference:** 
- Mockup `02e-browse-dataone.html` detail section
- Existing `DataONEDetailsSidebar.tsx` component (may have reusable code)

---

### 4.6: Sync Loading Indicators (Map Layers Widget ↔ Map Center ↔ Right Sidebar)

**Goal:** Synchronize loading indicators across Map Layers widget, map center overlay, and right sidebar while DataONE datasets are loading. Use the same shared primitives/synchronization contract as iNaturalist.

**Acceptance Criteria:**
- [x] DataOne adapter exposes `loading` via registry (same pattern as iNaturalist adapter)
- [x] Map Layers widget shows loading spinner for DataOne layer when datasets are loading (via `cacheStatusByDataSource`)
- [x] Map center shows `MapCenterLoadingOverlay` when DataOne is active and loading on first load only (`!dataLoaded`)
- [x] Right sidebar Browse tab shows `InlineLoadingRow` / `RefreshLoadingRow` when loading (initial vs. filter refresh)
- [x] Use shared components from `src/v2/components/shared/loading/LoadingPrimitives.tsx` (e.g., `EyeSlotLoadingSpinner`, `InlineLoadingRow`, `RefreshLoadingRow`, `MapCenterLoadingOverlay`)
- [x] Same synchronization logic as iNaturalist: single source of truth (DataOne context/adapter) → registry → MapLayersWidget, MapContainer, RightSidebar

**Reference:** 
- iNaturalist pattern: `src/v2/dataSources/inaturalist/adapter.tsx`, `INaturalistFilterContext.tsx`, `MapLayersWidget.tsx` (loadingByLayerId), `MapContainer.tsx` (MapCenterLoadingOverlay), `INaturalistBrowseTab.tsx` (InlineLoadingRow, RefreshLoadingRow)

---

### 4.7: Render DataONE Datasets as Map Markers (Dots or Clusters)

**Goal:** When the DataOne layer is active or pinned, show dataset locations on the map as dots (or clustered dots when many overlap). Currently no map markers appear for DataONE datasets.

**Acceptance Criteria:**
- [ ] Create `dataoneLayer.ts` (or equivalent) with GraphicsLayer populated from DataOne datasets
- [ ] Use `center_lat` / `center_lon` from the feature service for point geometry (see Service Analysis)
- [ ] Add `dataone-datasets` to `IMPLEMENTED_LAYERS` in `layers/index.ts`
- [ ] Implement `createDataOneLayer` and wire into `createMapLayer` switch
- [ ] Create `useDataOneMapBehavior` hook (pattern: `useINaturalistMapBehavior`)
- [ ] Populate layer from datasets when layer is on map (pinned or active). Data source: extend DataOneFilterContext to expose datasets with geometry, or consume same filtered query as Browse tab.
- [ ] Respect sidebar filters (category, year, search) — only show datasets matching current filter
- [ ] **Clustering (optional but recommended):** When many points overlap at same zoom, show grouped/clustered symbols; expand on zoom or click
- [ ] Map click on marker: activate DataOne layer and open dataset detail view (same pattern as iNaturalist observation click)
- [ ] Uncomment and wire `useDataOneMapBehavior` in `src/v2/dataSources/registry.ts`

**Reference:**
- iNaturalist pattern: `src/v2/dataSources/inaturalist/useMapBehavior.ts`, `src/v2/components/Map/layers/inaturalistLayer.ts`
- Service Analysis: `center_lat`, `center_lon` fields for map point geometry
- ArcGIS clustering: `@arcgis/core/layers/support/FeatureReductionCluster` (if using FeatureLayer) or client-side clustering for GraphicsLayer

---

### 4.8: Make Full Dataset Card Clickable to Open Detail

**Goal:** Use the entire dataset card as the drill-down target so browse interactions are direct and low-friction.

**Acceptance Criteria:**
- [ ] Clicking anywhere on a dataset card opens that dataset detail view
- [ ] Keyboard activation works on the card container (`Enter` and `Space`)
- [ ] Card has clear hover and focus-visible styling to signify clickability
- [ ] Inner interactive controls no longer block full-card navigation behavior
- [ ] Screen reader semantics reflect card as a single navigable item

**Notes:**
- Aligns with recognition-over-recall and reduced-choice UX principles (single primary action in browse state).

---

### 4.9: Simplify Browse Card Actions and Visual Hierarchy

**Goal:** Reduce visual noise in browse by removing oversized card CTA buttons and minimizing attention-grabbing non-primary metadata.

**Acceptance Criteria:**
- [ ] Remove card-level action row with `Save View`, `Details`, and `Open in DataONE`
- [ ] Remove explicit `Details` button from card (covered by full-card click behavior)
- [ ] Move `Open in DataONE` affordance out of browse cards (detail view only)
- [ ] Re-style or relocate high-contrast identifier/link chips so they no longer dominate browse scanning
- [ ] Card layout remains readable and scannable after action-row removal
 
**Completed (Feb 16, 2026):**
- [x] Remove card-level action row with `Save View`, `Details`, and `Open in DataONE`
- [x] Remove explicit `Details` button from card (covered by full-card click behavior)
- [x] Move `Open in DataONE` affordance out of browse cards (detail view only)
- [x] Re-style or relocate high-contrast identifier/link chips so they no longer dominate browse scanning
- [x] Card layout remains readable and scannable after action-row removal

**Notes:**
- This task is browse-only simplification. Functional actions are preserved in detail view (Task 4.10/4.11).

---

### 4.10: Add DataONE Open Modes in Detail View (New Tab + Iframe)

**Goal:** Keep users in flow by offering both external and in-app DataONE viewing from dataset detail.

**Acceptance Criteria:**
- [ ] `DatasetDetailView` includes two explicit actions:
  - [ ] `Open in DataONE (New Tab)`
  - [ ] `Open in DataONE (In App)`
- [ ] In-app option opens a bounded iframe experience in the app (modal or panel), not a full app navigation away
- [ ] New-tab option uses secure external-link behavior (`noopener,noreferrer`)
- [ ] Loading/error/blocked iframe states are handled gracefully with fallback to new-tab open
- [ ] Browse cards no longer expose DataONE-open actions directly

**Notes:**
- If DataONE blocks iframe embedding (`X-Frame-Options`/CSP), keep UI option but provide immediate fallback messaging and new-tab action.

---

### 4.11: Move and Wire Save Dataset View in Detail Flow

**Goal:** Make save behavior detail-contextual and ensure it creates a meaningful child view in Map Layers.

**Acceptance Criteria:**
- [x] Remove browse-card `Save View` button
- [x] Keep `Save Dataset View` action in `DatasetDetailView` only
- [x] Save action creates/updates a DataONE child view in Map Layers (filtered view model)
- [x] Saved child view is visible in widget hierarchy with consistent naming contract
- [x] Selecting saved child view restores associated DataONE query/filter/detail context
- [x] Include implementation notes for follow-up test coverage in DataONE right-sidebar and Map Layers integration tests

**Notes:**
- Use existing cross-layer child-view conventions from `LayerContext` (manual rename persistence + non-destructive sync).
- Follow-up test coverage should include: (1) `DataOneBrowseTab` hydrate from saved child view (`activeLayer.viewId`), (2) detail-save flow creates new child when no active child exists, (3) detail-save flow updates active child without overriding custom renamed child label, (4) selecting saved child restores both browse filters and selected dataset detail.

---

### 4.12: Reimplement Dataset Version History Exploration (v1 Parity)

**Goal:** DataONE datasets can have multiple versions (same `series_id`). The v1 app lets users explore old versions with a version-history widget. Reimplement this in v2, preserving the v1 styling that the user prefers.

**Reference (v1 implementation):**
- **Browse list:** `src/components/dataviews/DataONEView.tsx` — inline expandable version history under each dataset row
- **Detail view:** `src/components/DataONEDetailsSidebar.tsx` — collapsible "Version History" section

**Browse list (DataONEView pattern):**
- Version count badge: `bg-blue-50 text-blue-700` with History icon; clickable when `versionCount > 1` to expand; shows "X versions" or "1 version" (non-clickable when single)
- Expanded section: `bg-gray-50 border-t border-gray-100 px-4 py-3` below the dataset row
- Version list: each version shows `v{versionNumber}`, `(latest)` for index 0, date, file summary
- Selected version: `bg-emerald-100 text-emerald-800`; others: `hover:bg-gray-100 text-gray-600`
- "Show all X versions" / "Show less" toggle when `versions.length > 3`
- Uses `dataOneService.queryVersionHistory(seriesId)` and `getVersionDetails(dataoneId)`; on version click, call `onVersionSelect` / equivalent to switch to that version

**Detail view (DataONEDetailsSidebar pattern):**
- Collapsible panel: `border border-gray-200 rounded-lg overflow-hidden`
- Header button: `bg-gray-50 hover:bg-gray-100`, History icon (`text-blue-600`), "Version History (X versions)", ChevronUp/ChevronDown
- Version cards: `p-2 rounded-lg border`; current = `bg-emerald-50 border-emerald-200`; others = `bg-white border-gray-100 hover:border-gray-200`
- Each card: `v{versionNumber}`, "latest" badge (emerald), "current" badge (blue), date, file summary; amber highlight when file info differs from current
- "View this version →" button for non-current versions

**Acceptance Criteria:**
- [ ] Browse cards: version count badge (blue styling) when `versionCount > 1`; click expands inline version history
- [ ] Browse: expanded section matches v1 styling (`bg-gray-50`, version list with emerald selected state, show-all toggle)
- [ ] Browse: clicking a version loads that version's details and updates the selected dataset (or opens detail for that version)
- [ ] Detail view: collapsible "Version History" section when `versionCount > 1`
- [ ] Detail: version cards with current/latest badges, file diff highlight, "View this version →" for non-current
- [ ] Detail: selecting a version updates the detail view to that version (no full navigation away)
- [ ] Use existing `dataOneService.queryVersionHistory(seriesId)` and `getVersionDetails(dataoneId)`
- [ ] `DataOneDataset` already has `seriesId` and `versionCount` from feature service

**Files to modify:**
- `src/v2/components/RightSidebar/DataOne/DatasetListView.tsx` — add version badge + inline expandable version history to cards
- `src/v2/components/RightSidebar/DataOne/DatasetDetailView.tsx` — add collapsible Version History section
- `src/v2/components/RightSidebar/DataOne/DataOneBrowseTab.tsx` — wire version-select callback so selecting a version updates `selectedDatasetId` and/or opens detail

---

## Service Analysis

> Fill this out during Task 4.1

### Feature Service URL
`https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer` — see "Feature Service (Inspect DataONE Layer)" above for layer URLs.

### Dataset Attributes
| Attribute | Type | Useful For | Notes |
|-----------|------|------------|-------|
| `dataone_id` | string | Unique ID, display, links | DOI-like identifier used as canonical dataset identity (example: `doi:10...`). |
| `title` | string | Card + detail display, text search | Primary search/display field in layer 0/1/2. |
| `authors` | semicolon-delimited string | Card + detail display, optional filter | Needs parsing to array in UI (`;` delimiter). |
| `abstract` | string | Detail display, text search (optional) | Available in layers 1/2 only (not layer 0). |
| `keywords` | delimiter-separated string | Detail display, optional search expansion | Available in layers 1/2 only; can be long. |
| `tnc_category` | string | Primary category filter | AI-enriched primary category. |
| `tnc_categories` | semicolon-delimited string | Multi-category chips/filter matching | Supports cross-category tagging; includes secondary categories. |
| `tnc_confidence` | number | QA/debug info | AI category confidence score (0-1). |
| `date_uploaded` | epoch ms | Sort, recency display | Good default sort: `date_uploaded DESC`. |
| `begin_date`, `end_date` | epoch ms | Year/temporal filters | Supports temporal range filtering. |
| `files_summary` | JSON string | Card file counts/types | Contains `total`, `by_ext`, `size_bytes`; parse in client. |
| `dataset_url` | string | "Open in DataONE" action | DataONE landing page URL. |
| `data_url` | string | Advanced/download action | Data resolver URL (layers 1/2). |
| `external_url` | string nullable | External source link fallback | Used for metadata-only datasets. |
| `center_lat`, `center_lon` | number | Map point geometry | Reliable map plotting fallback if feature geometry omitted. |
| `north_bound`, `south_bound`, `east_bound`, `west_bound` | number | Spatial coverage in detail | Bounding box fields available in layers 1/2. |
| `series_id`, `version_count`, `is_latest_version` | string/int/bool-ish | Version history UX | Supports "latest vs all versions" views. |

### Query Performance
| Query Type | Avg Response Time | Notes |
|------------|-------------------|-------|
| All datasets (`Layer 0`, `returnCountOnly`) | ~216 ms | Count observed: 1231 latest datasets. |
| Filtered by category (`tnc_category='Species'`) | ~177 ms | Count observed: 124. |
| Search by keyword (`Layer 1`, `keywords LIKE '%kelp%'`) | ~173 ms | Count observed: 4. |

### Layer Usage Recommendation

- **Layer 0 (`Lite`) for browse list + count queries:** fastest payload, includes core fields needed for cards/filtering.
- **Layer 1 (`Latest`) for detail view:** includes abstract, keywords, authors, bbox fields, `data_url`, and richer metadata.
- **Layer 2 (`AllVersions`) for version history only:** use when user explicitly requests historical versions.

### Category Mapping (AI-Enriched)

Observed distinct primary `tnc_category` values from Layer 0:

- Earth Observations
- Elevation and Bathymetry
- Freshwater
- Land Cover
- Oceans and Coasts
- Soils and Geology
- Species
- Threats and Hazards
- Weather and Climate

Notes:
- `tnc_category` is the primary AI-enriched category for dropdown filtering.
- `tnc_categories` is a multi-label string (semicolon-delimited) and may include additional values beyond the primary category.
- Example includes `Research and Sensor Equipment` as a secondary category in `tnc_categories`.

### Answers to Task 4.1 Questions

- **What metadata fields exist?** Yes: title, authors, abstract, keywords, dates, categories, links, rights holder, spatial bounds, and versioning metadata are available (layer-dependent).
- **How are TNC categories assigned?** AI-enriched fields are present as `tnc_category` (primary), `tnc_categories` (multi-label), and `tnc_confidence` (confidence score).
- **Are file lists included in the feature service?** Not as full per-file rows. Feature service provides `files_summary` aggregate JSON; detailed file-level info should be fetched separately (DataONE API / resolver flow).
- **What's the bounding box / spatial coverage format?** Numeric scalar fields (`north_bound`, `south_bound`, `east_bound`, `west_bound`) plus center point (`center_lat`, `center_lon`).

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

### Integration Note for Merge

- **Shared Sync Dependency (from iNaturalist):** After merging iNaturalist Task 25/26/27, follow the canonical sync contract in `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md` ("Shared Sync Contract (Canonical)").
- **What this enables in Phase 4:** DataOne query/search filters can plug into existing child-view synchronization patterns rather than inventing a new widget-sidebar contract.
- **Phase 4 verification:** Confirm DataOne filter/search state hydrates from "Edit Filters," child query params update from sidebar edits, and custom child names remain stable after query changes.
- DataOne branch should adopt shared Map Layers child-view rename semantics: manual rename persists as custom and is not overwritten by sync.
- Provide DataOne-specific auto naming for non-custom views (query/category/year driven labels), while preserving shared child `viewId` navigation/edit flows.

---

## Open Questions

- [ ] Should we reuse code from existing `DataONEDetailsSidebar.tsx`?
- [ ] How to handle datasets with many files?
- [ ] Keyword click behavior - filter by that keyword?
- [ ] Preview capability vs. link to DataOne?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 4.12 | **Added Task 4.12:** Reimplement dataset version history exploration (v1 parity). User requested reimplementation of v1 version-history widget in browse and detail views, preserving v1 styling. Reference: `DataONEView.tsx`, `DataONEDetailsSidebar.tsx`. | Codex |
| Feb 16, 2026 | 4.11 | **Task 4.11 complete:** Wired `Save Dataset View` in `DatasetDetailView` to create or update DataONE filtered child views in Map Layers via `LayerContext`, including DataONE-specific filter model (`search/category/year/author + selectedDatasetId`), auto naming for non-custom views, and parent/child visibility synchronization. Added one-shot hydrate + continuous sync in `DataOneBrowseTab` so selecting a saved child view restores DataONE query filters and opens the saved dataset detail context. | Codex |
| Feb 16, 2026 | 4.10 | **Task 4.10 complete:** Added two detail-only DataONE open modes in `DatasetDetailView`: `Open in DataONE (New Tab)` using secure `window.open` (`noopener,noreferrer`) and `Open in DataONE (In App)` using a bounded embedded iframe panel. Added loading indicator, blocked/embed-failure fallback messaging, and direct fallback action to open in new tab. | Codex |
| Feb 16, 2026 | 4.9 | **Task 4.9 complete:** Simplified DataONE browse cards by removing the full CTA action row (`Save View`, `Details`, `Open in DataONE`) and de-emphasizing metadata treatment (subtle category pill + low-contrast file/DOI text) to improve scanability and reduce visual noise. | Codex |
| Feb 16, 2026 | 4.8-4.11 | Added follow-up task set based on UI feedback: full-card click-to-detail behavior, browse action-row removal + visual hierarchy cleanup, detail-only DataONE open modes (new tab + iframe), and detail-only Save Dataset View wiring to Map Layers child views. Updated phase status to In Progress (7/11). | Codex |
| Feb 16, 2026 | 4.7 | **Task 4.7 complete:** Implemented `dataoneLayer.ts` and `useDataOneMapBehavior` to render DataONE dataset markers on the v2 map from `center_lat`/`center_lon`. Wired `dataone-datasets` into `IMPLEMENTED_LAYERS` + `createMapLayer`, enabled DataONE map behavior in registry, synced marker queries to active sidebar filters (search/category/year/author), and added map marker click behavior to activate DataONE + open dataset detail in the right sidebar. | Codex |
| Feb 16, 2026 | 4.6 | **Task 4.6 complete:** Synced DataOne loading state across right-sidebar browse requests and shared cache status so Map Layers eye-slot loading, map-center first-load overlay, and sidebar loading rows are coordinated from one source of truth. Updated map overlay to only show on first-load (`!dataLoaded`). | Claude |
| Feb 16, 2026 | 4.4 | **Task 4.4 complete:** Implemented `DatasetListView` card anatomy for browse results. Added author + year row, description snippet fallback, DOI badge display (from `dataone_id`), file count/type summary, visible save-view action button, details CTA, and "Open in DataONE ↗" external link treatment. | Claude |
| Feb 16, 2026 | 4.7 | **Added Task 4.7:** Render DataONE datasets as map markers (dots or clusters). No map markers currently appear for DataONE; task covers `dataoneLayer.ts`, `useDataOneMapBehavior`, filter sync, optional clustering, and map-click-to-detail. | Claude |
| Feb 16, 2026 | 4.2, 4.3 | **Tasks 4.2 and 4.3 complete.** DataOne adapter wired into v2 registry; right-sidebar shell (Overview/Browse) with `DataOneOverviewTab`, `DataOneBrowseTab`, `DatasetListView`, `DatasetDetailView`; DataOne external layer enabled in left sidebar; browse search/filter UX per DFT-035 (debounced text, immediate dropdowns, result count, ARIA live region, pagination, empty-state clear-all, `AbortController`). DFT-045 shortcut rows deferred. | Claude |
| Feb 16, 2026 | 4.1 | Completed service analysis against live DataONE FeatureServer. Documented layer schemas (Lite/Latest/AllVersions), UI-relevant attributes, AI-enriched category mapping (`tnc_category` / `tnc_categories` / `tnc_confidence`), file-detail strategy (`files_summary` vs DataONE API), and baseline query timings. | Claude |
| Feb 5, 2026 | 4.3 | Resolved DFT-035: DataOne search behavior — debounced instant search (500ms, 2+ chars) with immediate dropdown filters. Enter key bypass for power users. Initial state loads all datasets, eliminating "pre-search" state. `AbortController` for race condition prevention. See planning-task-tracker.md | Will + Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 2, 2026 | 4.2 | Resolved DFT-006: Overview tab opens first when layer is selected, with prominent "Browse Features →" button | Will + Claude |
| Feb 4, 2026 | 4.2 | Resolved DFT-027: "Browse Features →" button design specification (full-width primary, TNC green, inline arrow, hover/focus states, 150-200ms transition) | Will + Claude |

