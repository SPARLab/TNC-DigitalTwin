# Phase 11: MOTUS Satellite Imagery

**Status:** ⚪ Not Started  
**Progress:** 0 / 9 tasks  
**Branch:** `v2/motus`  
**Depends On:** Phase 0 (Foundation); Phase 10 (DroneDeploy) recommended first — shares raster imagery patterns  
**Owner:** TBD

---

## Task Status

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 11.1 | ⚪ Not Started | — | Research MOTUS data availability and service endpoints | Determine how MOTUS data is accessed — ArcGIS ImageServer, NASA Earthdata, or pre-processed layers |
| 11.2 | ⚪ Not Started | — | Create MOTUS right sidebar shell | Adapter, Overview/Browse tabs; product-oriented layout |
| 11.3 | ⚪ Not Started | — | Implement product/date browse UI | Browse by MOTUS product (NDVI, LST, etc.), temporal navigation |
| 11.4 | ⚪ Not Started | — | Implement product detail view | Product description, temporal coverage, resolution info, load actions |
| 11.5 | ⚪ Not Started | — | Load MOTUS raster layers on map | Render MOTUS imagery as map overlay (ImageServer or pre-rendered tiles) |
| 11.6 | ⚪ Not Started | — | Implement temporal navigation / time slider | Date picker or slider to navigate MOTUS time series |
| 11.7 | ⚪ Not Started | — | Implement legend and symbology controls | Color ramp legend for NDVI, temperature, etc.; optional ramp switching |
| 11.8 | ⚪ Not Started | — | Sync loading indicators | Same shared loading pattern as other data sources |
| 11.9 | ⚪ Not Started | — | Wire Save View flow | Pin MOTUS layers, save product/date views to Map Layers |

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

Implement the MOTUS satellite imagery browse experience in the right sidebar. MOTUS provides continuous global coverage since 2000. For Dangermond, MOTUS data enables long-term time-series analysis of vegetation health (NDVI), land surface temperature, fire detection, and other environmental variables.

### Data Source Status

**Unknown — needs research in Task 11.1:**
- Is MOTUS data already processed and served via ArcGIS ImageServer on `dangermondpreserve-spatial.com`?
- Or should we access NASA Earthdata / USGS EROS directly?
- Or are there pre-processed MOTUS products already tiled and available?
- Meeting notes mention MOTUS as "planned" alongside GBIF, suggesting it's not yet integrated

### Key Characteristics

- **Data Type:** Raster imagery (satellite), not point features
- **Pin-Only Model:** Like DroneDeploy — raster layers are pinnable, no individual features to bookmark
- **Time Series:** MOTUS has daily/8-day/16-day/monthly composites going back to 2000
- **Multiple Products:** NDVI, EVI, land surface temperature, snow cover, fire detection, etc.
- **Resolution:** 250m–1km (much coarser than drone imagery)
- **Key Value:** Long-term trends that drone and ground observations can't provide

### Common MOTUS Products for Conservation

| Product | Code | Resolution | Frequency | Use Case |
|---------|------|-----------|-----------|----------|
| Vegetation Index (NDVI/EVI) | MOD13Q1 | 250m | 16-day | Vegetation health, drought monitoring, seasonal patterns |
| Land Surface Temperature | MOD11A2 | 1km | 8-day | Microclimate analysis, fire risk assessment |
| Surface Reflectance | MOD09GA | 500m | Daily | General land analysis, custom indices |
| Burned Area | MCD64A1 | 500m | Monthly | Post-fire monitoring, burn severity |
| Land Cover | MCD12Q1 | 500m | Annual | Land cover change detection |
| Snow Cover | MOD10A2 | 500m | 8-day | Hydrological modeling (less relevant for coastal CA) |

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- DFT-015 (pin-only model): MOTUS, like Drone/LiDAR, is pin-only
- Phase 10 (DroneDeploy): shares raster imagery patterns, temporal comparison concepts
- Meeting feedback: `docs/PLANNING/feedback/ai-derived-tasks-from-transcripts/digital-catalog-feedback-meeting-jan-15-2026.md` (MOTUS mentioned as "planned" / "coming soon")

## Key Paradigm Notes

- **Row Type:** Raster imagery layer (satellite product for a date/period)
- **Pin-Only:** No bookmarkable individual items — pinning loads a raster overlay
- **Save/View Options:** Save product + date configuration as view
- **Category Placement:** Earth Observations (primary), potentially cross-listed under Weather and Climate, Land Cover
- **Browse Pattern:** Browse by product type → select date/period → load on map. Very different from point-observation search.
- **Shared Patterns with DroneDeploy:** Raster overlay loading, opacity controls, temporal navigation. Consider building shared raster-imagery components during Phase 10 that Phase 11 can reuse.

---

## Task Details

### 11.1: Research MOTUS Data Availability and Service Endpoints

**Goal:** This is the critical path task. Determine how MOTUS data is or will be served for the digital catalog.

**Acceptance Criteria:**
- [ ] Check `dangermondpreserve-spatial.com` for any existing MOTUS layers/services
- [ ] If ArcGIS ImageServer exists: document URL, available products, temporal range, resolution
- [ ] If no existing service: evaluate options:
  - [ ] NASA Earthdata API (`https://appeears.earthdatacloud.nasa.gov/`)
  - [ ] USGS EROS / EarthExplorer
  - [ ] ArcGIS Living Atlas MOTUS layers
  - [ ] Pre-processed and hosted on `dangermondpreserve-spatial.com`
- [ ] Document which MOTUS products are most relevant for Dangermond
- [ ] Assess temporal coverage (how far back? how current?)
- [ ] Document spatial resolution and how it looks at Dangermond scale (~24,000 acres)
- [ ] Recommend service approach for v2

**Questions to Answer:**
- Is MOTUS data already processed for the Dangermond extent?
- Which MOTUS products do researchers most want? (NDVI is likely #1)
- How is time-series data served — individual dates or time-enabled layers?
- What's the data volume? (250m MOTUS for Dangermond is a small area — very manageable)
- Can we leverage ArcGIS Living Atlas MOTUS layers directly?

**Output:** Add findings to "Service Analysis" section below.

---

### 11.2: Create MOTUS Right Sidebar Shell

**Goal:** Set up the component structure for MOTUS browse experience.

**Acceptance Criteria:**
- [ ] MOTUS adapter registered in v2 data source registry
- [ ] Component renders when MOTUS layer is selected
- [ ] Tabs: Overview | Browse (no Export tab initially)
- [ ] Overview tab: available products summary, temporal range, "Browse Products →" button
- [ ] Component can show product list OR product detail (drill-down)

**Files to Create:**
- `src/v2/dataSources/motus/adapter.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSSidebar.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSBrowseTab.tsx`
- `src/v2/components/RightSidebar/MOTUS/MOTUSOverviewTab.tsx`
- `src/v2/components/RightSidebar/MOTUS/ProductListView.tsx`
- `src/v2/components/RightSidebar/MOTUS/ProductDetailView.tsx`

---

### 11.3: Implement Product/Date Browse UI

**Goal:** Browse MOTUS imagery organized by product with temporal navigation.

**Acceptance Criteria:**
- [ ] Product cards: product name, description, resolution, frequency, available date range
- [ ] Product selection → reveal date/period picker for that product
- [ ] Date picker appropriate to product frequency (16-day for NDVI, 8-day for LST, etc.)
- [ ] Calendar or slider UI for date selection
- [ ] "Latest available" quick action
- [ ] Seasonal presets (optional): "Show all January composites" for seasonal comparison
- [ ] "Load on Map" button from browse (no drill-down required)

---

### 11.4: Implement Product Detail View

**Goal:** Show detailed information about a specific MOTUS product.

**Acceptance Criteria:**
- [ ] "← Back to Products" navigation
- [ ] Product name, code, and full description
- [ ] Spatial resolution and coverage area
- [ ] Temporal coverage (earliest → latest available date)
- [ ] Composite frequency (daily, 8-day, 16-day, monthly, annual)
- [ ] Currently selected date and "Change Date" action
- [ ] "Load on Map" / "Remove from Map" toggle
- [ ] Opacity slider (if loaded)
- [ ] Color ramp preview (what the colors mean)
- [ ] Data source attribution (NASA, USGS)
- [ ] External link to product documentation

---

### 11.5: Load MOTUS Raster Layers on Map

**Goal:** Render MOTUS imagery as a map overlay.

**Acceptance Criteria:**
- [ ] Create `motusLayer.ts` appropriate to service type (ImageryLayer, WMTSLayer, or TileLayer)
- [ ] Load MOTUS raster for selected product + date
- [ ] Layer renders correctly at Dangermond extent
- [ ] Default opacity: 70% (adjustable — MOTUS should be semi-transparent over basemap)
- [ ] Handle time-enabled layers (if using ArcGIS time-enabled ImageServer)
- [ ] Add to `IMPLEMENTED_LAYERS` registry

---

### 11.6: Implement Temporal Navigation / Time Slider

**Goal:** Navigate through MOTUS time series to see changes over time. This is the core value proposition for MOTUS.

**Acceptance Criteria:**
- [ ] Time slider widget for scrubbing through available dates
- [ ] Play/pause animation for temporal sequence
- [ ] Speed control for animation
- [ ] Current date label prominently displayed
- [ ] Works with selected MOTUS product
- [ ] Optional: "Compare two dates" split-view (reuse DroneDeploy temporal comparison if built)

**Reference:** ArcGIS TimeSlider widget, v1 DroneDeploy carousel concepts

**Note:** This is where the shared raster-imagery temporal components from DroneDeploy (Phase 10) would pay off. Consider building generic temporal comparison UI in Phase 10 that Phase 11 reuses.

---

### 11.7: Implement Legend and Symbology Controls

**Goal:** MOTUS raster layers need clear legends to be interpretable (unlike point observations which are self-describing).

**Acceptance Criteria:**
- [ ] Color ramp legend for active MOTUS layer
- [ ] Legend shows value range with units (e.g., NDVI: -1.0 to 1.0, LST: °C/°F)
- [ ] Legend auto-updates when product changes
- [ ] Optional: color ramp selector (different visualization schemes)
- [ ] Legend position: floating widget or within right sidebar
- [ ] Accessible: values labeled, contrast sufficient

---

### 11.8: Sync Loading Indicators

**Goal:** Loading indicators for raster layer loading.

**Acceptance Criteria:**
- [ ] MOTUS adapter exposes `loading` via registry
- [ ] Map Layers widget shows spinner while imagery loads
- [ ] Right sidebar shows loading state during product queries
- [ ] Uses shared loading primitives

---

### 11.9: Wire Save View Flow

**Goal:** Save MOTUS product/date configurations to Map Layers.

**Acceptance Criteria:**
- [ ] Pin creates a MOTUS parent layer in Map Layers
- [ ] Saved views encode product + date selection
- [ ] Selecting a saved view restores product and date
- [ ] Auto-naming: "{Product} — {Date}" (e.g., "NDVI — 2024-06-10")
- [ ] Follows shared child-view conventions from `LayerContext`

---

## Service Analysis

> Fill this out during Task 11.1

### Data Source (TBD)
- ArcGIS service URL: TBD
- NASA Earthdata API: TBD
- ArcGIS Living Atlas: TBD

### Available Products
| Product | Service Type | Temporal Range | Resolution | Notes |
|---------|-------------|----------------|------------|-------|
| (to be documented in 11.1) | | | | |

### Query/Loading Performance
| Operation | Avg Time | Notes |
|-----------|----------|-------|
| (to be documented in 11.1) | | |

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Pin-only model (no bookmarkable items) | Feb 3, 2026 | DFT-015: Satellite imagery is raster; no individual features to bookmark |
| Recommended after DroneDeploy | Feb 16, 2026 | Phases 10 and 11 share raster patterns; DroneDeploy-first enables shared component reuse |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Is MOTUS data already available via ArcGIS on `dangermondpreserve-spatial.com`?
- [ ] Which MOTUS products are highest priority for Dangermond researchers?
- [ ] Should MOTUS share temporal comparison UI with DroneDeploy (build generic)?
- [ ] At 250m–1km resolution, how useful is MOTUS at the preserve scale? (The entire preserve is ~24,000 acres / ~97 km2 — a ~10x10 km area gets roughly 40x40 MOTUS pixels at 250m)
- [ ] Should we show MOTUS alongside drone imagery for multi-scale comparison (satellite vs drone)?
- [ ] Is there value in MOTUS trends (20+ years) beyond just current snapshots?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | — | Created phase document | Will + Claude |
| Feb 16, 2026 | — | Renamed from MODIS to MOTUS | — |
