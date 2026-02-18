# Phase 4: DataOne — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 4 tasks (4.1–4.12). Full phase doc: `docs/IMPLEMENTATION/phases/phase-4-dataone.md`

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|------------------|-------|
| 4.1 | ✅ | Feb 16, 2026 | Query DataOne service to understand attributes | Service schema analyzed (layers 0/1/2), key UI fields selected, category mapping + file-detail strategy documented. |
| 4.2 | ✅ | Feb 16, 2026 | Create DataOne right sidebar shell | DataOne adapter + right sidebar tabs scaffolded (DataOneOverviewTab, DataOneBrowseTab, DatasetListView, DatasetDetailView, provider wiring, external layer registration). DFT-045 left-sidebar shortcut rows deferred. |
| 4.3 | ✅ | Feb 16, 2026 | Implement search and filter UI | Debounced search (500ms, 2+ chars), Enter bypass, category/year/author filters, result count + ARIA live region, empty state clear-all, pagination, stale-results refresh, AbortController cancellation. |
| 4.4 | ✅ | Feb 16, 2026 | Implement dataset list with cards | Dataset cards: title, authors, year, description snippet fallback, DOI badge, file count/types summary, save-view action, details navigation, "Open in DataONE ↗". |
| 4.5 | ✅ | Feb 16, 2026 | Implement dataset detail view | Full drill-down with back nav, abstract/authors/temporal metadata, file list + type descriptions + size summary, spatial coverage with "View on Map", clickable keywords, save-view action, "Open in DataONE", copy DOI/citation actions. |
| 4.6 | ✅ | Feb 16, 2026 | Sync loading indicators (Map Layers ↔ map center ↔ right sidebar) | DataOne loading propagates from shared context to adapter/registry; Map Layers eye-slot spinner, map-center first-load overlay, right-sidebar loading rows synchronized. |
| 4.7 | ✅ | Feb 16, 2026 | Render DataONE datasets as map markers | dataoneLayer.ts, useDataOneMapBehavior, filter-synced markers from center_lat/center_lon, map-click-to-detail flow. |
| 4.8 | ✅ | Feb 16, 2026 | Make full dataset card clickable to open detail | Card click + Enter/Space; card-level hover/focus states; inner action controls stop propagation. |
| 4.9 | ✅ | Feb 16, 2026 | Simplify browse card actions and visual hierarchy | Removed CTA row (Save View, Details, Open in DataONE); metadata as low-contrast inline chips/text. |
| 4.10 | ✅ | Feb 16, 2026 | Add DataONE open modes in detail view (new tab + iframe) | New-tab open + in-app embedded iframe panel with close control, loading state, blocked/error fallback. |
| 4.11 | ✅ | Feb 16, 2026 | Move and wire Save Dataset View in detail flow | Save action in detail only; creates/updates DataONE child views in Map Layers with filter-based auto naming, single-visible-child behavior, restored detail context when selecting saved views. |
| 4.12 | ✅ | Feb 16, 2026 | Reimplement dataset version history exploration (v1 parity) | Browse cards: inline expandable version badge + list + show-all toggle. Detail: collapsible panel with latest/current badges, diff highlight, version switch. De-duplication by dataone_id. |

---

## Task Details

### 4.1: Query DataOne Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the DataOne feature service.

**Implementation:** Queried live FeatureServer layers (Lite/Latest/AllVersions). Documented attribute schema, filter/card/detail field mapping, AI-enriched category fields (tnc_category, tnc_categories, tnc_confidence). Baseline query timings captured. Service Analysis section in phase doc.

### 4.2: Create DataOne Right Sidebar Shell

**Goal:** Set up the component structure for the DataOne browse experience.

**Implementation:** DataOne adapter wired into v2 registry. Right sidebar shell with Overview/Browse tabs, DataOneOverviewTab, DataOneBrowseTab, DatasetListView, DatasetDetailView. External layer in left sidebar. DFT-006 (Overview default), DFT-027 (Browse Features button). DFT-045 shortcut rows deferred.

### 4.3: Implement Search and Filter UI

**Goal:** Create search and filter controls for discovering datasets.

**Implementation:** Per DFT-035: debounced text search (500ms, 2+ chars), Enter bypass, immediate category/year/author dropdowns. Initial state loads all datasets (most recent first). Result count + ARIA live region. Pagination (20 per page). AbortController cancellation. Empty state: "No datasets match your filters" + "Clear all filters" link.

### 4.4: Implement Dataset List with Cards

**Goal:** Display datasets as browseable cards.

**Implementation:** DatasetListView cards with title, authors, year, description snippet fallback, DOI badge (when dataone_id is DOI), file count/types summary, save-view action, details CTA, "Open in DataONE ↗".

### 4.5: Implement Dataset Detail View

**Goal:** When user clicks a dataset, show its full details.

**Implementation:** DatasetDetailView with back navigation, full abstract/authors/temporal metadata, file list + type descriptions + size summary, spatial coverage with "View on Map", clickable keywords (apply browse search), save-view action, "Open in DataONE", copy DOI/citation actions.

### 4.6: Sync Loading Indicators

**Goal:** Synchronize loading indicators across Map Layers widget, map center overlay, and right sidebar.

**Implementation:** DataOne adapter exposes loading via registry. Map Layers eye-slot spinner, MapCenterLoadingOverlay (first-load only), right-sidebar InlineLoadingRow/RefreshLoadingRow. Shared LoadingPrimitives. Same sync pattern as iNaturalist.

### 4.7: Render DataONE Datasets as Map Markers

**Goal:** Show dataset locations on the map as dots (or clusters when many overlap).

**Implementation:** dataoneLayer.ts, useDataOneMapBehavior. GraphicsLayer from center_lat/center_lon. dataone-datasets in IMPLEMENTED_LAYERS. Filter-synced marker population. Map click → activate DataOne + open dataset detail in Browse.

### 4.8: Make Full Dataset Card Clickable to Open Detail

**Goal:** Use the entire dataset card as the drill-down target.

**Implementation:** Card click + Enter/Space opens detail. Card-level hover/focus states. Inner action controls stop propagation. Screen reader semantics for single navigable item.

### 4.9: Simplify Browse Card Actions and Visual Hierarchy

**Goal:** Reduce visual noise by removing oversized card CTA buttons.

**Implementation:** Removed card-level action row (Save View, Details, Open in DataONE). Moved Open in DataONE to detail view only. Re-styled metadata as low-contrast inline chips/text. Card layout remains scannable.

### 4.10: Add DataONE Open Modes in Detail View (New Tab + Iframe)

**Goal:** Offer both external and in-app DataONE viewing from dataset detail.

**Implementation:** DatasetDetailView: "Open in DataONE (New Tab)" (secure window.open) and "Open in DataONE (In App)" (embedded iframe panel). Loading indicator, blocked/embed-failure fallback with new-tab action.

### 4.11: Move and Wire Save Dataset View in Detail Flow

**Goal:** Save behavior detail-contextual; creates meaningful child view in Map Layers.

**Implementation:** Save action in DatasetDetailView only. Creates/updates DataONE child view with filter-based auto naming. Selecting saved child restores browse filters and selected dataset detail. Single-visible-child behavior.

### 4.12: Reimplement Dataset Version History Exploration (v1 Parity)

**Goal:** Reimplement v1 version-history widget in browse and detail views.

**Implementation:** Browse cards: inline expandable version badge (blue styling), version list with emerald selected state, show-all toggle. Detail view: collapsible Version History panel with latest/current badges, file diff highlight, "View this version →" for non-current. Uses dataOneService.queryVersionHistory(seriesId) and getVersionDetails(dataoneId). De-duplication by dataone_id in browse/map/version-history queries.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-4-dataone.md`
- **Master plan:** `docs/master-plan.md`
