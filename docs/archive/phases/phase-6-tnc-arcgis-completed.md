# Phase 6: TNC ArcGIS — Archived Completed Tasks (Partial)

**Last Updated:** February 18, 2026  
**Purpose:** Archive of completed Phase 6 tasks. Phase has 9 remaining. Add new completions here with timestamp.

---

## Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-----------------|-------|
| 6.1–6.7 | ✅ | Feb 16, 2026 | Data model, sidebar groups, service module, adapter, overview, filter UI, map rendering | |
| 6.15 | ✅ | Feb 16, 2026 | Legend Iconography Parity + Symbol-Aware Filtering | esriPMS imageData extraction |
| 6.16 | ✅ | Feb 16, 2026 | Pinned Layer Opacity Control | |
| 6.18 | ✅ | Feb 16, 2026 | TNC Data Catalog Source URL | Hub catalog URLs |
| 6.19 | ✅ | Feb 16, 2026 | Overview: Source Actions (Overlay + New Tab) | |

---

## Task Details

### 6.1–6.7: Foundation Pipeline

**6.1:** Extended data model for multi-layer services. Service-group detection in useCatalogRegistry. Single-layer behavior preserved.

**6.2:** Left sidebar collapsible service groups. ServiceGroup + controls-only child rows. 300ms expand/collapse. Arrow Left/Right + ARIA.

**6.3:** tncArcgisService.ts — service URL builder, schema fetch, feature query, WHERE validation. Malformed/network/ArcGIS error handling.

**6.4:** tnc-arcgis adapter + context warm-cache hook. Dynamic registry wiring. Map-layer factory for FeatureServer/MapServer.

**6.5:** Right sidebar service overview for multi-layer services. Layer switcher dropdown. Layer list. Browse/Pin actions. Pinned badge state.

**6.6:** GenericFilterUI + TNCArcGISBrowseTab. Schema-driven filters. SQL WHERE builder. Preview validation. LayerContext sync for filter metadata.

**6.7:** Map layer rendering. definitionExpression updates from filter changes. Map z-order sync from Map Layers drag-reorder.

### 6.15: Legend Iconography Parity + Symbol-Aware Filtering

**Goal:** esriPMS (picture-marker) symbols render correctly in legend. Select All/Clear All in header.

**Implementation:** Extract imageData + contentType from renderer JSON. LegendSwatch with onError fallback. Layer name above items. Stable selection box (no layout shift). Removed redundant "Selected" text.

### 6.16: Pinned Layer Opacity Control

**Goal:** Right-sidebar opacity slider (0–100%) for pinned TNC layers. Sync to ArcGIS layer opacity.

**Implementation:** Slider in right sidebar overview. useMapBehavior syncs layer.opacity.

### 6.18: TNC Data Catalog Source URL

**Goal:** Resolve friendly TNC Hub catalog URLs from ArcGIS serviceItemId.

**Implementation:** Query Hub dataset item metadata. Prefer `/datasets/...` and `/explore?layer=` for layer-aware links. Fallback to raw service URLs.

### 6.19: Overview — Source Actions (Overlay + New Tab)

**Goal:** Source URL/actions + overlay iframe in Overview (not Browse). Overview pin control syncs bidirectionally with Map Layers.

**Implementation:** Moved source block from Browse to Overview. Removed duplicate Browse source block. Pin/Unpin toggle via shared LayerContext.

---

## Reference

- **Phase doc:** `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md`
- **Master plan:** `docs/master-plan.md`
