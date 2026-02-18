# Phase 6: TNC ArcGIS — Archived Completed Tasks

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 6 tasks (6.1–6.7, 6.15, 6.16, 6.18, 6.19). Full phase doc: `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md`

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-------------------|-------|
| 6.1 | ✅ | 2026-02-16 13:01 PST | Extend Data Model for Multi-Layer Services | Added multi-layer metadata fields/types and service-group detection in `useCatalogRegistry`; single-layer behavior preserved |
| 6.2 | ✅ | 2026-02-16 13:07 PST | Left Sidebar: Collapsible Service Groups | Added `ServiceGroup` + controls-only child rows, service activation, 300ms expand/collapse, Arrow Left/Right + ARIA attributes |
| 6.3 | ✅ | 2026-02-16 13:11 PST | TNC ArcGIS Service Module | Added `src/v2/services/tncArcgisService.ts` with service URL builder, schema fetch, feature query, and WHERE validation helpers with malformed/network/ArcGIS error handling |
| 6.4 | ✅ | 2026-02-16 13:15 PST | TNC ArcGIS Adapter Shell | Added `tnc-arcgis` adapter + context warm-cache hook, dynamic registry wiring, and map-layer factory support for FeatureServer/MapServer |
| 6.5 | ✅ | 2026-02-16 13:29 PST | Right Sidebar: Service Overview (Multi-Layer) | Added service-level overview in `TNCArcGISOverviewTab` with sub-layer dropdown, layer list, dynamic Browse/Pin actions, pinned badge state, and service sub-layer selection state in `LayerContext` |
| 6.6 | ✅ | 2026-02-16 14:22 PST | Right Sidebar: Generic Filter UI (MVP) | Added `GenericFilterUI` + `TNCArcGISBrowseTab` schema-driven filters, SQL WHERE builder, preview validation, and LayerContext sync for TNC filter metadata |
| 6.7 | ✅ | 2026-02-16 13:42 PST | Map Layer Rendering | Synced TNC `definitionExpression` updates from filter changes and added map z-order sync from Map Layers drag-reorder in `useMapLayers` |
| 6.15 | ✅ | 2026-02-16 18:45 PST | Legend Iconography Parity + Symbol-Aware Filtering | esriPMS (picture marker) symbols extract `imageData` + `contentType` from renderer JSON — resolves broken legend icons for Oil Seeps and PMS layers. LegendSwatch with `onError` fallback. UX refinements: Select All/Clear All in header next to Legend; layer name above items; stable selection box (no layout shift); removed redundant "Selected" text. |
| 6.16 | ✅ | 2026-02-16 19:20 PST | Pinned Layer Opacity Control | Right-sidebar opacity slider (0-100%) for pinned TNC ArcGIS layers; synced ArcGIS layer `opacity` in map behavior; TNC Browse tab hidden so controls stay in right sidebar overview |
| 6.18 | ✅ | 2026-02-16 21:10 PST | TNC Data Catalog Source URL | V2 now resolves friendly TNC Hub catalog URLs by reading ArcGIS `serviceItemId`, querying Hub dataset item metadata, preferring `/datasets/...` (and `/explore?layer=` for layer-aware links), and falling back to raw service URLs when needed |
| 6.19 | ✅ | 2026-02-16 20:05 PST | Overview: Source Actions (Overlay + New Tab) | Moved source URL/actions + overlay iframe from Browse into Overview for both service and layer contexts, removed duplicate Browse source block, and made Overview pin control sync bidirectionally with Map Layers widget (Pin/Unpin toggle via shared LayerContext state) |

---

## Handoff for 6.15 (Legend Iconography Parity) — Task Complete

**Task 6.15 complete (Feb 16, 2026).** esriPMS picture-marker symbols now render correctly in the legend via `imageData` + `contentType` extraction. UX refinements shipped: Select All/Clear All in header, layer name above items, stable selection box (no layout shift), blue highlight only (no redundant "Selected" text).

**Optional future work:** If other layer types (beyond esriPMS) show mismatched legend icons, inspect live ArcGIS layer metadata (`?f=json` → `drawingInfo.renderer`), compare to `parseRendererLegend` expectations, and consider `symbolUtils.getDisplayedSymbol` if the layer instance is available in React context.

---

## Task Details

### 6.1: Extend Data Model for Multi-Layer Services

**Goal:** Update types and catalog hook to detect and represent multi-layer services.

**Implementation:** Added `CatalogLayer` multi-layer fields (`isMultiLayerService`, `parentServiceId`, `siblingLayers`), `ActiveLayer` service activation fields (`isService`, `selectedSubLayerId`), `TNCArcGISViewFilters` type, and `detectMultiLayerServices` in `useCatalogRegistry`. Single-layer services remain flat.

### 6.2: Left Sidebar: Collapsible Service Groups

**Goal:** Render multi-layer TNC services as expandable rows in the left sidebar.

**Implementation:** ServiceGroup component with controls-only child rows. 300ms expand/collapse animation. Click service row activates service (shows overview). Layer pin/eye icons functional. Arrow Right = expand, Arrow Left = collapse. ARIA: `role="tree"`, `aria-expanded`, `aria-level`.

### 6.3: TNC ArcGIS Service Module

**Goal:** Create utility functions for querying TNC ArcGIS services.

**Implementation:** `src/v2/services/tncArcgisService.ts` with `buildServiceUrl`, `fetchLayerSchema`, `queryFeatures`, `validateWhereClause`. Handles FeatureServer/MapServer/ImageServer. Error handling for network failures, malformed responses, ArcGIS errors.

### 6.4: TNC ArcGIS Adapter Shell

**Goal:** Create data source adapter for TNC ArcGIS layers.

**Implementation:** `tnc-arcgis` adapter in `src/v2/dataSources/tnc-arcgis/adapter.tsx`. `warmCache` fetches and caches layer schema. `createMapLayer` renders FeatureLayer with WHERE clause. Context provider caches schemas. Works for FeatureServer and MapServer.

### 6.5: Right Sidebar: Service Overview (Multi-Layer)

**Goal:** Show service-level overview with layer switcher for multi-layer TNC services.

**Implementation:** `TNCArcGISOverviewTab` with layer dropdown, service description from Data Catalog, available layers list, Browse/Pin buttons. Single-layer services skip this pattern (use standard overview).

### 6.6: Right Sidebar: Generic Filter UI (MVP)

**Goal:** Build field/operator/value filter rows for TNC layer queries.

**Implementation:** `GenericFilterUI` + `TNCArcGISBrowseTab` with schema-driven filters, SQL WHERE builder, Preview Results validation, LayerContext sync. Operators: =, ≠, >, <, ≥, ≤, contains, starts with, ends with, in, is null, is not null.

### 6.7: Map Layer Rendering

**Goal:** Render TNC layers on map with filters applied.

**Implementation:** `useMapLayers` reactive WHERE sync + pinned-layer reorder sync. FeatureLayer added when pinned; `definitionExpression` updates when filters change; z-order from Map Layers drag-reorder.

### 6.15: Legend Iconography Parity + Symbol-Aware Filtering

**Goal:** esriPMS picture-marker symbols render correctly in legend. UX refinements for legend header.

**Implementation:** Extract `imageData` + `contentType` from renderer JSON. LegendSwatch with `onError` fallback. Select All/Clear All in header, layer name above items, stable selection box, removed redundant "Selected" text.

### 6.16: Pinned Layer Opacity Control

**Goal:** Allow users to change the opacity of pinned TNC ArcGIS layers on the map.

**Implementation:** Right-sidebar opacity slider (0–100%) for pinned TNC layers. Sync to `FeatureLayer.opacity` / `MapImageLayer.opacity` / `ImageryLayer.opacity`. TNC Browse tab hidden so controls stay in right sidebar overview.

### 6.18: TNC Data Catalog Source URL

**Goal:** Use TNC's user-friendly data catalog URL when available, instead of the raw FeatureServer REST URL.

**Implementation:** Resolve friendly TNC Hub catalog URLs by reading ArcGIS `serviceItemId`, querying Hub dataset item metadata. Prefer `/datasets/...` and `/explore?layer=` for layer-aware links. Fallback to raw service URLs when needed.

### 6.19: Overview: Source Actions (Overlay + New Tab)

**Goal:** Move the overlay iframe and open-in-new-tab buttons from the Browse tab into the Overview tab.

**Implementation:** Source card (URL display, Open Overlay, New Tab) moved from `TNCArcGISBrowseTab` to `TNCArcGISOverviewTab`. Removed duplicate source UI in Browse. Overview pin control syncs bidirectionally with Map Layers widget via shared LayerContext.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md`
- **Master plan:** `docs/master-plan.md`
