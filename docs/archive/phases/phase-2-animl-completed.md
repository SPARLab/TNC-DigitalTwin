# Phase 2: ANiML — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 2 tasks (2.1–2.17). Full phase doc: `docs/IMPLEMENTATION/phases/phase-2-animl.md`

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 2.1 | ✅ | Feb 12, 2026 | Query ANiML service to understand attributes | animlService.ts (1,512 lines) documents attributes |
| 2.2 | ✅ | Feb 12, 2026 | Create ANiML adapter, context, map layer, sidebar shell | AnimlFilterContext, adapter, map layer, sidebar tabs, legend widget |
| 2.3 | ✅ | Feb 13, 2026 | Design decision: Browse tab interaction flow | DFT-043–047; expandable filter sections, multi-select |
| 2.4 | ✅ | Feb 13, 2026 | Implement Browse tab interaction flow | FilterSection, selectedCameras, ImageList, live counts |
| 2.5 | ✅ | Feb 13, 2026 | Implement camera list with filtered image counts | Cameras in FilterSection; map badges (DFT-012, 028, 029) |
| 2.6 | ✅ | Feb 13, 2026 | Implement camera detail drill-down | Unified filter+result view; no separate detail for MVP |
| 2.7 | ✅ | Feb 13, 2026 | Investigate and decide on caching strategy | Marked done; deferred; service/context caching in place |
| 2.8 | ✅ | Feb 16, 2026 | Use v1 SVG icons for map markers and animal tags | Replaced emoji; Lucide Camera, Tag icons |
| 2.9 | ✅ | Feb 13, 2026 | Map Layers widget sync with browse filters | Edit Filters hydration; syncAnimlFilters; child-view support |
| 2.10 | ✅ | Feb 13, 2026 | Right sidebar scrollbar — prevent content shift | scrollbar-gutter: stable |
| 2.11 | ✅ | Feb 13, 2026 | Add date/time frame filter above Species and Cameras | DateFilterSection, presets, startDate/endDate |
| 2.12 | ✅ | Feb 13, 2026 | Image list pagination (Prev/Next Page) | Page/range indicators; expand-to-fill |
| 2.13 | ✅ | Feb 13, 2026 | Expanded image view on click | ImageExpandedView, lightbox in sidebar |
| 2.14 | ✅ | Feb 13, 2026 | Arrow key navigation in expanded view | Auto-pagination across pages (DFT-049) |
| 2.15 | ✅ | Feb 13, 2026 | Image click → highlight camera on map | focusedDeploymentId, layerView.highlight() |
| 2.16 | ✅ | Feb 16, 2026 | Camera badges: numbered icons for query results | Dynamic badges when filter active; 0-result = no badge |
| 2.17 | ✅ | Feb 16, 2026 | iNaturalist-style loading indicators for ANiML | MapCenterLoadingOverlay, EyeSlotLoadingSpinner, InlineLoadingRow |
| 2.17b | ✅ | Feb 13, 2026 | Species/Camera counts sync with date filter | dateScopedCountLookups; Option D lazy fetch |

---

## Task Details

### 2.1: Query ANiML Service to Understand Attributes

**Goal:** Before building UI, understand what data is available from the ANiML feature services.

**Implementation:** Existing `animlService.ts` (1,512 lines) documents attributes. Feature service URLs, camera/image attributes, query performance baseline in phase doc Service Analysis.

### 2.2: Create ANiML Right Sidebar Shell

**Goal:** Set up the component structure for the ANiML browse experience.

**Implementation:** AnimlFilterContext, adapter, map layer, map behavior hook, sidebar shell (Overview + Browse tabs), legend widget. DFT-003c (landing cards), DFT-006 (Overview default), DFT-027 (Browse Features button), DFT-042 (mode-switch).

### 2.3–2.6: Multi-Dimensional Filter System

**Goal:** Researchers select multiple species AND cameras. Expandable FilterSections with Select All/Clear All. Live result count. ImageList.

**Implementation:** FilterSection.tsx (expandable, multi-select). AnimlFilterContext: selectedCameras, toggleCamera, clearCameras, selectAllAnimals, selectAllCameras, filteredImageCount. AnimlBrowseTab: Species + Cameras FilterSections, debounced image fetch.

### 2.7: Caching Strategy Investigation

**Goal:** Investigate and decide on caching strategy for ANiML.

**Implementation:** Marked done for now. Service/context caching in place. Formal investigation deferred.

### 2.9: Map Layers Widget Sync with Browse Filters

**Goal:** Map Layers widget row for "Camera Traps (ANiML)" reflects active query state (filter summary, count updates).

**Implementation:** ANiML filter sync contract with Map Layers widget (mirrors iNaturalist). AnimlBrowseTab hydrates filters from pinned layer/view on "Edit Filters"; syncs active species/cameras/date + result count to Map Layers metadata. `syncAnimlFilters` in LayerContext with child-view support and custom-name preservation.

### 2.8: SVG Icons for Map Markers + Tag Rows

**Goal:** Replace emoji camera markers with SVG icons. Add icon rows in legend and browse filter lists.

**Implementation:** Replaced emoji in animlLayer.ts (base, badge, muted states). Added SVG camera symbols. Icon rows in AnimlLegendWidget and AnimlBrowseTab FilterSection.

### 2.10: Right Sidebar Scrollbar — Prevent Content Shift

**Goal:** Scrollbar should not move content when it appears (e.g., selecting species + camera).

**Implementation:** `scrollbar-gutter: stable` on right sidebar scroll area.

### 2.11: Date/Time Frame Filter

**Goal:** Add date filter above Species and Cameras. Presets: Last 30d, 6mo, This Year, Last Year.

**Implementation:** DateFilterSection component. AnimlFilterContext: startDate/endDate. Passes to queryImageLabelsCached. Count fix: use actual `images.length` when fetched (not countLookups) so date-filtered counts match.

### 2.12: Image List — Pagination (Prev/Next Page)

**Goal:** Replace "Load More" with page-based Prev/Next navigation.

**Implementation:** Scrollable list + Prev/Next underneath. Page indicator (Page X of Y), range (1-20 of N). Expand-to-fill, visible scrollbar.

### 2.13: Image — Expanded View on Click

**Goal:** Click thumbnail → larger view in sidebar with metadata, Back to list.

**Implementation:** ImageExpandedView.tsx. medium_url, metadata (species, date, camera). Auto-pagination across pages when crossing boundaries (20→21).

### 2.14: Expanded View — Arrow Key Navigation

**Goal:** Left/right arrow keys navigate between images. Auto-paginate across page boundaries.

**Implementation:** Arrow keys + Prev/Next buttons. Esc to close. Stays in expanded view when crossing page boundary.

### 2.15: Image Click → Highlight Camera on Map

**Goal:** Clicking image should highlight corresponding camera on map.

**Implementation:** AnimlFilterContext: focusedDeploymentId, focusDeployment(), clearFocusedDeployment(). ImageList: onImageFocus callback. useAnimlMapBehavior: ArcGIS layerView.highlight(). animlLayer: getAnimlCameraGraphicByDeploymentId().

### 2.16: Camera Badges — Numbered Icons for Query Results

**Goal:** Dynamic map badge symbols showing filtered image counts. No badge when no filter. 0-result cameras show muted icon.

**Implementation:** updateAnimlCameraBadges() in map behavior lifecycle. Count lookups from AnimlFilterContext.

### 2.17: Species/Camera Counts Sync with Date Filter

**Goal:** Species/Cameras/Legend counts reflect active date range. No all-time fallback when date filter active.

**Implementation:** Date-scoped count lookups in AnimlFilterContext.

### Loading (Task 34 propagation): iNaturalist-Style Loading Indicators

**Goal:** Map, Map Layers widget, and legend show loading when ANiML is loading. Use shared LoadingPrimitives.

**Implementation:** MapCenterLoadingOverlay ("Loading camera trap data..."). EyeSlotLoadingSpinner in Map Layers. AnimlLegendWidget uses InlineLoadingRow. All from loadingTheme.ts / LoadingPrimitives.tsx.

---

## Manual Testing Checklist

- [ ] **Layer activation:** Click Camera Traps → right sidebar shows Overview/Browse
- [ ] **Map markers:** Camera deployments appear on map
- [ ] **Filters:** Species + Cameras FilterSections; Select All/Clear All; date presets
- [ ] **Image list:** Pagination (Prev/Next), page indicator, scrollable list
- [ ] **Image click:** Thumbnail → expanded view with metadata, Back to list
- [ ] **Arrow keys:** Left/right in expanded view; auto-pagination across pages
- [ ] **Image → map highlight:** Click image → camera highlighted on map

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-2-animl.md`
- **Master plan:** `docs/master-plan.md`
