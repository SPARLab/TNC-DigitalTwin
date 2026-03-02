# Phase 6: TNC ArcGIS Feature Services

**Status:** 🟢 Complete  
**Progress:** 0 active tasks; 46 completed tasks (CON-FEB25-10 complete Feb 27)  
**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-6-tnc-arcgis-completed.md`  
**Branch:** `v2/tnc-arcgis`  
**Depends On:** Phase 0 (Foundation) — Task 0.9 (Dynamic Layer Registry) ✅ complete  
**Owner:** TBD

---

## Phase Goal

Create a generic adapter for TNC ArcGIS Feature Services and Map/Image Services that works for any layer in the Data Catalog. This phase handles the ~90+ TNC-hosted layers (wetlands, vegetation, fire perimeters, etc.) that are not covered by specialized adapters (iNaturalist, ANiML, Dendra, DataOne).

**Key Architectural Decision:** Each *layer* within a FeatureService is independently pinnable. Multi-layer services (e.g., "Wetlands" with Polygons/Points/Transects sub-layers) render as collapsible groups in the left sidebar. Clicking the service row shows a service-level overview with a layer switcher dropdown. Single-layer services behave like iNaturalist/ANiML (flat activation).

---

## Reference Documents

- **Master Plan:** `docs/master-plan.md`
- **Design Rationale:** See planning conversation (Feb 16, 2026) — service-level activation pattern for multi-layer TNC FeatureServices
- **Map Layers Widget Spec:** `docs/PLANNING/component-specs/map-layers-widget.md`
- **Data Catalog Hook:** `src/v2/hooks/useCatalogRegistry.ts`

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-FEB25-05 | 🟢 Complete | Feb 27, 2026 | Visually differentiate category, subcategory, and feature service in left sidebar | Tiered backgrounds, Service→Group rename, header-only hover, layer row hover border. Polish: right-edge divider as structural layer; only hovered rows overlay divider. |
| CON-FEB25-10 | 🟢 Complete | Feb 27, 2026 | TNC ArcGIS Overview description: See more/See less, paragraph spacing, CSS transition | 5-line clamp when collapsed; split on newlines for consistent single blank-line gap (space-y-4); max-height transition (300ms); fade gradient in collapsed state. OverviewDescriptionSection. |

*All completed tasks (6.1–6.20, CON-ARCGIS-01–17, CON-FEB25-05, CON-FEB25-10, D20-02, D20-02a, D20-10, D20-11, TF-11, TF-13) archived. See `docs/archive/phases/phase-6-tnc-arcgis-completed.md`.*

**Status Legend:**  
⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## CON-ARCGIS-07 Audit (Feb 20, 2026)

### Scope

- Audited `useCatalogRegistry` runtime service discovery behavior.
- Verified actual ArcGIS `FeatureServer?f=json` metadata for visible TNC ArcGIS feature services.
- Checked current UX differentiation paths for service containers vs layer targets.

### Current Codepath Findings

- `useCatalogRegistry` treats every visible TNC ArcGIS dataset row as its own service key today (catalog currently has one row per service path).
- Runtime discovery is attempted for all visible single-row FeatureServer rows (cap removed Feb 20 per TF-13; `layer_id !== null` gate removed Feb 23 so services like Coastal_and_Marine with layer_id=2 are discovered).
- Service-container UX logic already exists once a service is classified as multi-layer:
  - left sidebar: service rows are non-pinnable containers, child rows are pinnable layers.
  - right sidebar Browse: resolves target layer from selected child when active row is a service parent.

### Live Runtime Verification Results

- Total visible FeatureServer services audited: **90**
- Multi-layer services (`layers.length > 1`): **12**
- Single-layer services (`layers.length = 1`): **75**
- Unreadable/zero-layer responses: **3** (token-required, timeout, or metadata-only)
- Single-layer services with non-zero layer IDs: **14**
- Multi-layer services without layer `0`: **4**

Confirmed multi-layer examples:

- `Coastal_and_Marine` (`Coastal and Marine Data`): **20 layers**, IDs **2..21** (no layer `0`)
- `DP_COASTAL` (`Coastal Data for at Natures Crossroads Story Map`): **3 layers**, IDs **0..2**
- `NWS_Watches_Warnings_v1`: **11 layers**, IDs **1..12**
- `Wild_Coast_Project_WebMap_WFL1`: **6 layers**, IDs **1..6**

### Risk / Gap (resolved Feb 23, 2026)

- ~~Because discovery is capped to top-priority 12 candidates~~ — cap removed Feb 20.
- ~~Timeout (1200ms) too short for slow services~~ — increased to 3s + 5s retry Feb 23.
- ~~`layer_id !== null` excluded Coastal_and_Marine~~ — gate removed Feb 23.

### Recommended Next Step (implementation)

1. Replace fixed top-12 cap with a broader strategy:
   - either discover all visible single-row FeatureServer candidates,
   - or discover on-demand when user activates an unclassified service, then cache result.
2. Keep current service/container UX behavior unchanged, but feed it fuller runtime classification data.
3. Add lightweight instrumentation in dev mode to log service classification outcome (`single`, `multi`, `unreadable`) for QA.

---

## TF-13: Multi-Layer Detection Implementation

**Task:** Implement the recommended next steps from the CON-ARCGIS-07 audit so all multi-layer services get proper service-container UX.

**Findings (from audit above):**

- **Coastal and Marine Data** (`Coastal_and_Marine`): **20 layers**, IDs 2..21. Confirmed multi-layer.
- **DP_COASTAL** (`Coastal Data for at Natures Crossroads Story Map`): **3 layers**, IDs 0..2.
- **12 multi-layer services** total; runtime discovery is capped at 12 candidates, so ordering can cause some to render as single-layer.
- **14 single-layer services** use non-zero layer IDs (e.g., Shrub at 8, Tree at 7); TF-11 runtime fallback already handles these.

**Implementation checklist (complete Feb 20, 2026):**

- [x] Remove `MAX_SERVICE_DISCOVERY_CANDIDATES` cap in `useCatalogRegistry.ts` so all eligible visible single-row FeatureServer candidates are discovered.
- [x] Verify service-container UX for all 12 multi-layer services — left sidebar shows Service/Layer badges; right sidebar Browse resolves target layer correctly.
- [x] Add dev-mode logging for service classification (`single` / `multi` / `unreadable`) for QA.

**Follow-up fixes (Feb 23, 2026):** Discovery regression caused Coastal and Marine to render as single-layer. Root causes: (1) `SERVICE_DISCOVERY_TIMEOUT_MS` (1200ms) too short — Coastal_and_Marine metadata fetch ~1.4s; (2) candidate filter excluded rows with `layer_id !== null`, so Coastal (layer_id=2) never entered discovery. Fixes: timeout 3s + 5s retry on timeout-only; remove `layer_id !== null` gate so single-row services with non-zero layer_id are discovered.

**Files:** `src/v2/hooks/useCatalogRegistry.ts`

---

## CON-ARCGIS-16: Loading Indicators (Sync Map Layers ↔ Right Sidebar)

**Task:** Align TNC ArcGIS loading indicators with Task 34 / DFT-018 (Unified loading indicator strategy). Same anatomy as iNaturalist, ANiML, GBIF, Dendra.

**Implementation (complete Feb 23, 2026):**

- [x] `TNCArcGISContext` tracks `layerView.updating`, `FeatureLayerView.dataUpdating`, and `view.updating` via `reactiveUtils.watch`; derives `isLayerRendering` and `renderPhase` (fetching-data, rendering-features, updating-view, idle).
- [x] `useTNCArcGISCacheStatus` includes `isLayerRendering` in its `loading` / `dataLoaded` signals so the Map Layers widget shows `EyeSlotLoadingSpinner` during layer fetch/render.
- [x] Right sidebar Overview and Browse tabs show phase-based status (Fetching imagery…, Fetching features…, Rendering features…, Ready).
- [x] Imagery layers (e.g., USA Annual NLCD Land Cover): `layerView.updating` aligns with when imagery is visually rendered; no extended compositing phase.

**Files:** `src/v2/context/TNCArcGISContext.tsx`, `src/v2/dataSources/tnc-arcgis/adapter.tsx`, `src/v2/components/RightSidebar/TNCArcGIS/TNCArcGISOverviewTab.tsx`, `src/v2/components/RightSidebar/TNCArcGIS/TNCArcGISBrowseTab.tsx`

---

## CON-ARCGIS-17: Feature Service Expand/Collapse Toggle (Left Sidebar)

**Task:** Make feature service rows in the left sidebar toggle expand/collapse on repeated clicks. First click expands; second click collapses.

**Implementation (complete Feb 23, 2026):**

- [x] `ServiceGroup.handleHeaderClick`: when `isExpanded`, short-circuit to `onToggleExpand()` only (no re-activation), avoiding upstream auto-expand effects that prevented collapse.
- [x] When collapsed, click still expands and activates service as before.

**Files:** `src/v2/components/LeftSidebar/ServiceGroup.tsx`

---

## Architecture Overview

### Data Model Hierarchy

```
TNC FeatureService (e.g., "Wetlands")
  ├─ Layer 0: Polygons       ← Pinnable, filterable
  ├─ Layer 1: Points         ← Pinnable, filterable
  └─ Layer 2: Transects      ← Pinnable, filterable
```

**Key Principle:** Each **layer** is the atomic unit. Layers can be pinned/filtered independently. The FeatureService is an organizational container (not pinnable itself).

### Left Sidebar Patterns

**Single-layer TNC service (flat row):**
```
│ 📄 Fire Perimeter 2024         [🔵👁] │ ← Click = activate layer
```

**Multi-layer TNC service (collapsible group):**
```
│ 📊 Wetlands (3)                [▼]    │ ← Click = expand/collapse toggle; when collapsed, click also activates
│      □ Polygons                [🔵👁] │ ← Pin/eye only (not activation target)
│      □ Points                  [  👁] │
│      □ Transects               [  👁] │
```

### Right Sidebar Patterns

**Service Overview (Multi-Layer):**
- Context block: Feature Service (bold name), Current Layer (CON-ARCGIS-10)
- Section: "Feature Service Overview" with service description (CON-ARCGIS-11)
- Single scrollable layer list with "N layers" header, highlighted selection, click-to-switch (CON-ARCGIS-12)
- "Browse {Layer} →" button (switches to Browse tab)
- "Pin {Layer}" button (adds selected layer to Map Layers widget)
- Source actions: Open Overlay, Open in New Tab (Task 6.19)

**Browse Tab (Any TNC Layer):**
- "Inspect Current Layer" card: row count, column count, column preview; "Open Table Overlay" button (Task 6.17)
- ArcGIS FeatureTable overlay: floating panel over map area; auto-populates columns and rows from FeatureServer
- Generic filter UI: field/operator/value rows (future)
- "Pin Layer" button (appears when layer not pinned)
- *Note:* Source actions (Overlay, New Tab) move to Overview tab (Task 6.19)

---

## Task Details

*Completed task details (6.8–6.20, CON-ARCGIS-01–17, D20-02, D20-02a, D20-10, D20-11, TF-11, TF-13) are archived. See `docs/archive/phases/phase-6-tnc-arcgis-completed.md`.*

---

## Design Decisions Summary

### Why Service-Level Activation?

**Problem:** TNC services have metadata (description, citations) at the service level, not per-layer.

**Solution:** Click service row → right sidebar shows overview with layer switcher. User reads overview, then picks layer to browse/pin.

**Rationale:**
- Matches TNC's actual data structure (service = container with shared metadata)
- Avoids duplicating descriptions 3x (once per layer)
- Supports exploration workflow: "What is this service?" → read overview → "I want this layer" → browse/pin

### Why Layer-Centric Pinning?

**Problem:** Multi-layer services could be pinned as groups (all layers share one row in Map Layers widget) or individually (each layer gets own row).

**Solution:** Each **layer** is independently pinnable. Service is organizational only.

**Rationale:**
- Maintains consistency with existing paradigm (one pin = one queryable entity)
- Allows independent filters per layer (Polygons filtered by year, Points filtered by status)
- Fits within current Map Layers widget (no modifications needed)

### Why Generic Filter UI?

**Problem:** Custom filters (like iNaturalist's taxon picker) don't scale to 90+ TNC layers with diverse schemas.

**Solution:** Generic field/operator/value rows that work for any schema.

**Rationale:**
- Scalable to any TNC layer without custom code
- Target audience is researchers (DFT-011) — comfortable with SQL-like filters
- Phase 7 can add smart widgets (date pickers, sliders) via field type introspection

**Status Update (Feb 16, 2026 feedback):**
- Revisit this assumption for non-feature layers.
- New direction: capability-aware Browse UX (Task 6.11) so Image/Map layers are exploration-first, not SQL-first.

### Why Collapsible Service Groups?

**Problem:** Multi-layer services multiply item count in left sidebar (90+ layers → 150+ with sub-layers).

**Solution:** Services with 2+ layers render as collapsible groups. Collapsed by default.

**Rationale:**
- Reduces initial choice overload (Hick's Law)
- Progressive disclosure — expand only services of interest
- Search provides alternate findability path (bypasses hierarchy)

---

## Tradeoffs & Accepted Risks

| Tradeoff | Risk | Mitigation |
|----------|------|------------|
| **Service-level overview = new pattern** | Inconsistent with iNat/ANiML (always layer-level activation) | Only applies to multi-layer TNC services. Single-layer TNC services use standard pattern. |
| **Generic filters less discoverable** | Users must know field names (`fire_year`) | Tooltips show field aliases. "Preview Results" validates before pin. Phase 7 can add smart widgets. |
| **Text-only values = syntax errors** | User typos break queries (`'2024'` vs `2024`) | "Preview Results" button catches errors before pin. Show clear error feedback. |
| **3-level hierarchy** | More clicks to reach layers | Search bypasses hierarchy. Collapsed-by-default reduces clutter. |
| **No custom UI per layer** | Less polished than iNat taxon picker | Acceptable for Phase 6 MVP. Researcher audience can handle generic filters (DFT-011). |

---

## Future Enhancements (Phase 7+)

- **Field type introspection:** Detect date/numeric/string fields from schema, render smart widgets (date pickers, sliders, coded-value dropdowns)
- **Smart symbology:** Color polygons by attribute (e.g., fire year gradient), size points by numeric field
- **Advanced queries:** Support OR logic, spatial filters (within extent, intersects polygon)
- **Batch pin:** Select multiple layers from service, pin all at once
- **Service-level bookmarks:** Save service + layer selection as reusable preset

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 27, 2026 | CON-FEB25-10 | **Complete.** TNC ArcGIS Overview description: See more/See less toggle (5-line clamp when collapsed); split on newlines for consistent single blank-line gap (space-y-4); max-height CSS transition (300ms); fade gradient in collapsed state. File: `TNCArcGISOverviewSections.tsx` OverviewDescriptionSection. | Cursor |
| Feb 27, 2026 | POL-SELECT-CLEAR | **Legend Select All/Clear All.** TNC ArcGIS legend now uses shared `SelectAllClearAllActions` primitive; styling matches iNaturalist (emerald text, separator, disabled states). File: `TNCArcGISLegendWidget.tsx`. | Cursor |
| Feb 27, 2026 | CON-FEB25-05 | **Polish.** Right-edge divider as absolute structural layer (z-10); only hovered category/subcategory/group rows overlay it (hover:z-[20]). Divider visible by default; hovered row border/shadow paints over divider. Files: LeftSidebar.tsx, CategoryGroup.tsx, ServiceGroup.tsx. | Cursor |
| Feb 26, 2026 | CON-FEB25-05 | **Complete.** Left sidebar hierarchy styling: tiered backgrounds (category slate-200, subcategory slate-100, children slate-50); "Service"→"Group" rename for multi-layer feature services; header-only hover (bg+border) scoped to header div (no bleed into expanded content); layer row hover border gray-400. Files: CategoryGroup.tsx, ServiceGroup.tsx, LayerRow.tsx. | Cursor |
| Feb 25, 2026 | — | **Archived** all completed tasks (6.8–6.20, CON-ARCGIS-01–17, D20-02, D20-02a, D20-10, D20-11, TF-11, TF-13) to `docs/archive/phases/phase-6-tnc-arcgis-completed.md`. Trimmed Task Details from phase doc. | — |
| Feb 23, 2026 | 6.14 | **Complete.** Added explicit iframe-block fallback for Source overlay viewer (timeout + error detection), with graceful fallback panel and `Open in New Tab` + `Retry Embed` actions. Updated task row/checklist to complete. Files: `src/v2/components/RightSidebar/TNCArcGIS/TNCArcGISOverviewTab.tsx`, `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md`. | Codex |
| Feb 20, 2026 | TF-11 | **Complete.** Runtime fallback for non-zero FeatureServer layer IDs (schema, query, legend, map load). QA passed. | Codex |
| Feb 20, 2026 | TF-11 | **In progress (scope expanded after QA screenshot).** Confirmed additional affected services where valid FeatureServer layer IDs are non-zero (`Shrub_Vegetation`=8, `Tree_Dominated_Vegetation`=7, `jldp_sensitive_vegcommunites`=3). Patched legend renderer fallback to retry with discovered valid layer IDs (instead of hard failing on `/0`) and fixed map-layer recovery guard to run even when only one static candidate exists. Files: `src/v2/services/tncArcgisService.ts`, `src/v2/components/Map/layers/tncArcgisLayer.ts`. | Codex |
| Feb 20, 2026 | TF-11 | **In progress (investigation + hardening patch).** Confirmed Coastal_and_Marine FeatureServer exposes layers 2–21 (no layer 0). Added runtime fallback for layer-scoped schema/query requests: when a target layer URL fails, service metadata is fetched and requests retry across discovered layer IDs. Added map `FeatureLayer` load fallback to probe discovered service layer URLs after static candidates fail. Files: `src/v2/services/tncArcgisService.ts`, `src/v2/components/Map/layers/tncArcgisLayer.ts`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **Complete.** Root cause: `renderer: undefined` passed explicitly in FeatureLayer constructor overrode service default renderer for non-GBIF layers. Fixed via conditional spread so renderer/featureReduction omitted when not GBIF; ArcGIS auto-fetches service symbology. Removed diagnostic logging from useMapLayers. Files: `tncArcgisLayer.ts`, `useMapLayers.ts`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **In progress (handoff update).** Added FeatureLayer URL fallback loading in map layer factory and isolated table overlay lifecycle to dedicated FeatureLayer instances; regression still unresolved and requires fresh-window investigation with runtime map-layer diagnostics. Files: `src/v2/components/Map/layers/tncArcgisLayer.ts`, `src/v2/components/FloatingWidgets/TNCArcGISTableOverlay/TNCArcGISTableOverlay.tsx`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **In progress.** Root cause identified and patched: single-layer services now resolve to `/FeatureServer/0` (and `/MapServer` sublayer `0`) unless explicitly marked multi-layer; legend lookup now follows same layer-ID rule. Files: `src/v2/services/tncArcgisService.ts`, `src/v2/components/Map/layers/tncArcgisLayer.ts`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **Added.** Bug: fix feature service layer rendering — legend loads but layers (JLDP invasives ice plant mats, tree-dominated vegetation, oil seeps, most land cover) not drawing on map. | — |
| Feb 19, 2026 | CON-ARCGIS-03, 6.17 | **Complete.** ArcGIS FeatureTable overlay for TNC layers. Browse "Inspect Current Layer" card with row/column summary + Open Table Overlay; hover-revealed Inspect on Overview layer rows; TNCArcGISTableOverlay + fallback FeatureLayer for MapServer layers. | — |
| Feb 23, 2026 | 6.12 | **Complete.** Terminology + CTA Realignment: removed right-sidebar pin actions from TNCArcGISOverviewTab (inline pin icons, Pin/Unpin CTAs). Pinning only in left sidebar + Map Layers widget per user decision. File: `TNCArcGISOverviewTab.tsx`. | — |
| Feb 19, 2026 | CON-ARCGIS-14 | **Complete.** Unified Service Workspace: service/layer click auto-selects sublayer; map + Map Layers widget sync with resolved sublayer; right-sidebar layer list with amber active highlight, pin/eye icons, inline pin/unpin; "Inspect Current Layer" CTA. (Note: 6.12 later removed right-sidebar pin actions.) Files: ServiceGroup, useMapLayers, MapLayersWidget, TNCArcGISOverviewTab, LayerContext. | — |
| Feb 19, 2026 | CON-ARCGIS-14 | Added task: Unified Service Workspace — service/layer click behavior, auto-select sublayer on service click, layer list state chips (pinned/visible counts). | — |
| Feb 19, 2026 | CON-ARCGIS-10, 11, 12 | Implemented right sidebar hierarchy relabel (Feature Service, Current Layer), section rename to "Feature Service Overview", single scrollable layer list (dropdown + helper text removed). | — |
| Feb 19, 2026 | CON-ARCGIS-01, 02, 04, 05, 6.20 | Marked complete. Added CON-ARCGIS-08–12 from user feedback: left sidebar scrollbar pill, row clipping fix, right sidebar relabeling, section rename, layer list simplification. | — |
| Feb 18, 2026 | — | Archived completed tasks 6.1–6.7, 6.15, 6.16, 6.18, 6.19 to `docs/archive/phases/phase-6-tnc-arcgis-completed.md`. Phase doc trimmed for new tasks. | Claude |
| Feb 16, 2026 | 6.15 | Task complete: Legend iconography parity (esriPMS imageData/contentType) + UX refinements (Select All/Clear All in header, layer name above items, stable selection box, removed redundant "Selected" text). | Claude |
| Feb 16, 2026 | - | Created Phase 6 document for TNC ArcGIS Feature Services. Renumbered old Phase 6 (Polish) to Phase 7. | Claude |
| Feb 16, 2026 | 6.3 | Added `src/v2/services/tncArcgisService.ts` with `buildServiceUrl`, `fetchLayerSchema`, `queryFeatures`, and `validateWhereClause`; updated task status and checklist. | Codex |
| Feb 16, 2026 | 6.16–6.20 | Added five broad-change tasks: Pinned Layer Opacity Control, Generic Layer Table View, TNC Data Catalog Source URL, Overview Source Actions (Overlay + New Tab), Right Sidebar Layer+Service Hierarchy Communication. | Claude |

---

## Notes

**Iteration Strategy:** This architecture is a starting point. After implementing, we'll review the UX and iterate based on actual usage. Key questions to revisit:
- Is service-level activation intuitive, or should layer rows also activate?
- Is the layer dropdown in Overview useful, or should we skip straight to Browse?
- Are generic filters sufficient, or do we need smart widgets sooner?

**Current Rendering Clarification (Feb 16, 2026):**
- Multi-layer services are not rendered as "all child layers at once" by default.
- The service row is organizational (activation target for overview), while concrete child layers render when individually pinned/activated.
- If a service has 10 child layers, the system does **not** automatically draw all 10 unless the user explicitly pins/enables those child layers.

**Branch Strategy:** Develop on `v2/tnc-arcgis` branch. Merge to `v2/main` after all 10 tasks complete and QA passes.
