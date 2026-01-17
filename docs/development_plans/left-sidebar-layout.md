# Left Sidebar Layout Document
## Layer Browser Hierarchy for Digital Catalog

**Created:** January 16, 2026  
**Status:** Draft  
**Related:** [pre-feb20th-2026-mockup-development-plan.md](./pre-feb20th-2026-mockup-development-plan.md)

---

## 1. Overview

This document defines the hierarchical structure of the left sidebar "Layer Browser" - the persistent navigation that replaces the current siloed data source selection.

**Design Principles:**
- **TNC categories as foundation:** Use official TNC category labels (13 categories)
- **Primary category first:** Every layer has ONE home in the navigation hierarchy
- **Tags for secondary discovery:** Additional categories stored as searchable tags
- **Depth limit:** Maximum 3 levels of nesting to prevent overwhelming users
- **Sensor types broken out:** Dendra sensors appear as individual layer types under "Research and Sensor Equipment"

---

## 2. Top-Level Categories (TNC Official)

| Category | Icon | Description | Key Data Sources |
|----------|------|-------------|------------------|
| **Boundaries** | 🌐 | Administrative boundaries, ownership, access | TNC ArcGIS |
| **Infrastructure** | 🏗️ | Roads, structures, utilities, wells | TNC ArcGIS |
| **Research and Sensor Equipment** | 📡 | Monitoring equipment, camera traps, sensors | Animl, Dendra, TNC ArcGIS |
| **Earth Observations** | 🛰️ | Imagery, satellite data, drone flights | Drone Imagery, TNC ArcGIS |
| **Soils and Geology** | 🪨 | Soil types, geology, earthquake faults | TNC ArcGIS |
| **Land Cover** | 🌿 | Vegetation, habitat, conservation areas | TNC ArcGIS, CalFlora, DataONE |
| **Elevation and Bathymetry** | ⛰️ | DEMs, contours, LiDAR terrain | TNC ArcGIS, LiDAR |
| **Weather and Climate** | 🌡️ | Weather sensors, climate data, forecasts | Dendra, TNC ArcGIS, DataONE |
| **Freshwater** | 💧 | Streams, watersheds, water quality | Dendra, TNC ArcGIS, DataONE |
| **Species** | 🦎 | Wildlife observations, species surveys | iNaturalist, eBird, CalFlora, Animl, TNC ArcGIS, DataONE |
| **Threats and Hazards** | ⚠️ | Hazards, oil/gas, risk areas | TNC ArcGIS |
| **Oceans and Coasts** | 🌊 | Marine protected areas, coastal features | TNC ArcGIS, DataONE |
| **Fire** | 🔥 | Fire history, hazard zones, prescribed burns | TNC ArcGIS |

**Note:** These are the official TNC category labels. Additional data sources (iNaturalist, eBird, etc.) are integrated under their most appropriate TNC category.

---

## 3. Full Hierarchy

```
📂 Boundaries
│
├── 📁 Preserve Boundaries
│   ├── 📄 Dangermond Preserve Boundary
│   ├── 📄 Management Units
│   └── 📄 Access Points
│
├── 📁 Administrative
│   ├── 📄 County Boundaries
│   ├── 📄 Land Ownership
│   └── 📄 [Other admin layers]
│
└── 📁 Marine Boundaries
    └── 📄 Marine Protected Area Boundaries

---

📂 Infrastructure
│
├── 📁 Transportation
│   ├── 📄 Roads
│   └── 📄 Trails
│
├── 📁 Structures
│   ├── 📄 Buildings
│   └── 📄 Wells
│
└── 📁 Utilities
    └── 📄 [Utility layers from TNC ArcGIS]

---

📂 Research and Sensor Equipment
│
├── 📄 Camera Traps (Animl)
│   └── [Opens right sidebar with camera locations, animal detections]
│
├── 📁 Weather Sensors (Dendra)
│   ├── 📄 Rain Gauges
│   │   └── [Opens right sidebar with station list, time series]
│   ├── 📄 Wind Sensors
│   │   └── [Opens right sidebar with station list, time series]
│   ├── 📄 Air Temperature
│   │   └── [Opens right sidebar with station list, time series]
│   ├── 📄 Barometric Pressure
│   │   └── [Opens right sidebar with station list, time series]
│   └── 📄 Solar Radiation
│       └── [Opens right sidebar with station list, time series]
│
├── 📁 Water Quality Sensors (Dendra)
│   ├── 📄 Water Temperature
│   │   └── [Opens right sidebar with station list, time series]
│   ├── 📄 Conductivity
│   │   └── [Opens right sidebar with station list, time series]
│   ├── 📄 Dissolved Oxygen
│   │   └── [Opens right sidebar with station list, time series]
│   └── 📄 pH Sensors
│       └── [Opens right sidebar with station list, time series]
│
└── 📁 Soil Sensors (Dendra)
    ├── 📄 Soil Moisture
    │   └── [Opens right sidebar with station list, time series]
    └── 📄 Soil Temperature
        └── [Opens right sidebar with station list, time series]

---

📂 Earth Observations
│
├── 📄 Drone Imagery
│   └── [Opens right sidebar with project list, flight selection]
│
├── 📁 Satellite Imagery
│   ├── 📄 NAIP Aerial Imagery
│   ├── 📄 Sentinel-2
│   └── 📄 [Other imagery layers]
│
└── 📁 Derived Products
    ├── 📄 NDVI Time Series
    └── 📄 [Other analysis products]

---

📂 Soils and Geology
│
├── 📁 Soils
│   ├── 📄 Soil Types
│   ├── 📄 SoilGrids Data
│   └── 📄 [Other soil layers]
│
└── 📁 Geology
    ├── 📄 Geologic Units
    ├── 📄 Earthquake Faults
    └── 📄 [Other geology layers]

---

📂 Land Cover
│
├── 📁 Vegetation Communities
│   ├── 📄 Vegetation Types
│   ├── 📄 Habitat Classification
│   └── 📄 [Other veg layers]
│
├── 📁 Conservation
│   ├── 📄 Oak Restoration Areas
│   ├── 📄 Conserved Lands
│   └── 📄 Conservation Status
│
├── 📄 CalFlora Plant Records
│   └── [Opens right sidebar with plant search, native/invasive filters]
│
└── 📄 DataONE Land Cover Datasets
    └── [Opens right sidebar with dataset search/browse]

---

📂 Elevation and Bathymetry
│
├── 📁 Elevation
│   ├── 📄 Digital Elevation Model (DEM)
│   ├── 📄 Contours
│   └── 📄 LiDAR Terrain
│       └── [Opens 3D viewer or right sidebar]
│
└── 📁 Bathymetry
    └── 📄 [Bathymetry layers from TNC ArcGIS]

---

📂 Weather and Climate
│
├── 📁 Climate Data
│   ├── 📄 Historical Climate
│   ├── 📄 Climate Projections
│   └── 📄 [Other climate layers]
│
├── 📁 Weather Alerts
│   └── 📄 NWS Watches & Warnings
│
└── 📄 DataONE Climate Datasets
    └── [Opens right sidebar with dataset search/browse]

---

📂 Freshwater
│
├── 📁 Surface Water
│   ├── 📄 Streams & Rivers (NHD)
│   ├── 📄 Lakes & Ponds
│   ├── 📄 Watersheds
│   └── 📄 Jalachichi Ponds Restoration
│
├── 📁 Groundwater
│   ├── 📄 Groundwater Basins
│   └── 📄 Wells
│
└── 📄 DataONE Freshwater Datasets
    └── [Opens right sidebar with dataset search/browse]

---

📂 Species
│
├── 📄 iNaturalist Observations
│   └── [Opens right sidebar with species search, filters, browse]
│
├── 📄 eBird Sightings  
│   └── [Opens right sidebar with bird species search, filters]
│
├── 📄 CalFlora Plants
│   └── [Opens right sidebar with plant search, native/invasive filters]
│
├── 📁 Species Surveys (TNC ArcGIS)
│   ├── 📄 Wildlife Species Lists
│   ├── 📄 Ecological Surveys
│   └── 📄 [Other species-related TNC layers]
│
├── 📁 Critical Habitat
│   ├── 📄 Essential Fish Habitat
│   ├── 📄 Endangered Species Habitat
│   └── 📄 [Other habitat designation layers]
│
└── 📄 DataONE Species Datasets
    └── [Opens right sidebar with dataset search/browse]

---

📂 Threats and Hazards
│
├── 📁 Energy Resources
│   ├── 📄 Oil & Gas Wells
│   └── 📄 [Other energy layers]
│
└── 📁 Other Hazards
    └── 📄 [Hazard layers from TNC ArcGIS]

---

📂 Oceans and Coasts
│
├── 📁 Marine Protected Areas
│   ├── 📄 MPAs
│   └── 📄 Conservation Areas
│
├── 📁 Coastal Features
│   ├── 📄 Coastline
│   ├── 📄 Coastal Hazards
│   └── 📄 [Other coastal layers]
│
├── 📁 Ocean Data
│   └── 📄 [Oceanographic layers from TNC ArcGIS]
│
└── 📄 DataONE Marine Datasets
    └── [Opens right sidebar with dataset search/browse]

---

📂 Fire
│
├── 📁 Fire History
│   ├── 📄 Historic Fire Perimeters (California)
│   ├── 📄 Preserve Fire History (2020-2024)
│   └── 📄 [Other historical fire layers]
│
├── 📁 Fire Hazard
│   ├── 📄 Fire Hazard Severity Zones (FHSZ)
│   ├── 📄 Fire Threat Assessment
│   └── 📄 [Other hazard layers]
│
└── 📁 Fire Management
    ├── 📄 Prescribed Burns
    ├── 📄 Control Burns
    └── 📄 Fuel Management

```

**Note on DataONE:** DataONE datasets have been AI-enriched with category assignments. They appear as a layer under each relevant TNC category (e.g., "DataONE Species Datasets" under Species). Naming TBD.

---

## 4. Data Source to Category Mapping

This table shows where each data source primarily lives in the hierarchy:

| Data Source | Primary Category (TNC) | Secondary Appearances | Notes |
|-------------|------------------------|----------------------|-------|
| **iNaturalist** | Species | - | Opens species search interface |
| **eBird** | Species | - | Opens bird sighting search |
| **CalFlora** | Species | Land Cover (via plants) | Opens plant search interface |
| **Animl (Camera Traps)** | Research and Sensor Equipment | Species (via animal detections) | Opens camera/detection view |
| **Dendra (All Sensors)** | Research and Sensor Equipment | - | Weather, water quality, soil sensors |
| **TNC ArcGIS Hub** | All 13 categories | - | ~82 layers distributed by topic |
| **LiDAR** | Elevation and Bathymetry | - | May open 3D viewer |
| **Drone Imagery** | Earth Observations | - | Opens project/flight browser |
| **DataONE** | Distributed by category | Species, Freshwater, Oceans and Coasts, Weather and Climate, Land Cover | ~1000 datasets, AI-categorized |

---

## 5. Dendra Sensor Breakdown

Dendra is broken into these distinct layer types based on measurement variable:

### Weather Sensors
| Layer Name | Variable | Medium | Unit | Station Count |
|------------|----------|--------|------|---------------|
| Rain Gauges | Precipitation | Air | mm | TBD |
| Wind Sensors | Wind Speed / Direction | Air | m/s, degrees | TBD |
| Air Temperature | Temperature | Air | °C | TBD |
| Barometric Pressure | Pressure | Air | hPa | TBD |
| Solar Radiation | Solar Radiation | Air | W/m² | TBD |
| Relative Humidity | Humidity | Air | % | TBD |

### Water Quality Sensors
| Layer Name | Variable | Medium | Unit | Station Count |
|------------|----------|--------|------|---------------|
| Water Temperature | Temperature | Water | °C | TBD |
| Conductivity | Conductivity | Water | µS/cm | TBD |
| Dissolved Oxygen | DO | Water | mg/L | TBD |
| pH Sensors | pH | Water | pH | TBD |
| Turbidity | Turbidity | Water | NTU | TBD |

### Soil Sensors
| Layer Name | Variable | Medium | Unit | Station Count |
|------------|----------|--------|------|---------------|
| Soil Moisture | Volumetric Water Content | Soil | m³/m³ | TBD |
| Soil Temperature | Temperature | Soil | °C | TBD |

**Note:** Actual variable/medium values should be verified against the Dendra datastream table. The categories above are based on common environmental monitoring conventions.

---

## 6. TNC ArcGIS Layer Distribution

The ~82 TNC ArcGIS layers are already organized by TNC's 13 official categories. Each layer should appear under its assigned category.

| TNC Category | Expected Content | Notes |
|--------------|------------------|-------|
| Boundaries | Preserve boundary, admin units, ownership | |
| Infrastructure | Roads, structures, utilities, wells | |
| Research and Sensor Equipment | Monitoring equipment locations | Dendra and Animl also live here |
| Earth Observations | Imagery, satellite data | Drone imagery also lives here |
| Soils and Geology | Soil types, geology, faults | |
| Land Cover | Vegetation, habitat, conservation | CalFlora cross-listed here |
| Elevation and Bathymetry | DEMs, contours, bathymetry | LiDAR also lives here |
| Weather and Climate | Climate data, weather alerts | |
| Freshwater | Streams, watersheds, groundwater | |
| Species | Wildlife surveys, habitat designations | iNaturalist, eBird, CalFlora, Animl live here |
| Threats and Hazards | Oil/gas, hazard zones | |
| Oceans and Coasts | MPAs, coastal features | |
| Fire | Fire history, hazard zones, Rx burns | |

---

## 7. Layer States & Visual Indicators

Each layer in the sidebar has these possible states:

| State | Visual Indicator | Description |
|-------|------------------|-------------|
| **Default** | White background | Layer is available but not pinned |
| **Pinned** | Blue background + filled eye icon | Layer is pinned to map |
| **Selected** | Border highlight | Layer is currently selected, details in right sidebar |
| **Pinned + Selected** | Blue background + border | Both pinned and selected |
| **Loading** | Spinner on eye icon | Layer is loading onto map |
| **Error** | Red eye icon | Layer failed to load |

---

## 8. Nested Structure Rules

1. **Maximum depth:** 3 levels (Category → Subcategory → Layer)
2. **Subcategories are optional:** Some categories may have layers directly under them
3. **Subcategories can have layers and further groupings**
4. **Consistent icons:** Categories use emoji, subcategories use folder icon, layers use document icon
5. **Expand/collapse persists:** User's expanded state should be preserved during session

---

## 9. Advanced Search Mode

When user clicks "Advanced" in search bar, left sidebar switches to search mode:

```
┌──────────────────────────────────┐
│ [← Back to Browse]               │
├──────────────────────────────────┤
│ SEARCH LAYERS                    │
│                                  │
│ Keywords: [________________]     │
│                                  │
│ Data Source:                     │
│ [x] All  [ ] iNaturalist         │
│ [ ] TNC ArcGIS  [ ] Dendra       │
│ [ ] DataONE  [ ] eBird           │
│                                  │
│ Categories:                      │
│ [x] Species  [x] Fire            │
│ [ ] Freshwater  [ ] Land Cover   │
│                                  │
│ [Search]                         │
├──────────────────────────────────┤
│ Results (12 layers):             │
│ 👁 iNaturalist Observations      │
│ 👁 Fire Perimeters 2024          │
│ 👁 Rain Gauges                   │
│ ...                              │
└──────────────────────────────────┘
```

---

## 10. Open Questions

These should be resolved during mockup review:

- [ ] Do we need a "Favorites" or "Recent" section at top?
- [ ] How to handle layers that legitimately belong in multiple categories? (Show in primary, search finds via tags)
- [ ] Should Dendra subcategories be "Weather Stations" or by variable type ("Rain Gauges", "Wind Sensors")?
- [ ] Maximum number of layers visible before scrolling kicks in?
- [ ] Text truncation for long layer names?
- [ ] DataONE layer naming: "DataONE [Category] Datasets" vs something else? (TBD)

---

## 11. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-16 | Initial draft | Cursor |
| 2026-01-16 | Updated to use official TNC category labels (13 categories) | Cursor |
| | | |

---

## Appendix A: TNC Categories - Official Labels

These are the 13 official TNC categories used in this layout:

| # | Category | Description |
|---|----------|-------------|
| 1 | Boundaries | Administrative boundaries, ownership, access |
| 2 | Infrastructure | Roads, structures, utilities |
| 3 | Research and Sensor Equipment | Monitoring equipment, sensors |
| 4 | Earth Observations | Imagery, satellite data |
| 5 | Soils and Geology | Soil types, geology |
| 6 | Land Cover | Vegetation, habitat |
| 7 | Elevation and Bathymetry | DEMs, terrain, depth |
| 8 | Weather and Climate | Weather data, climate |
| 9 | Freshwater | Streams, watersheds |
| 10 | Species | Wildlife, biodiversity |
| 11 | Threats and Hazards | Hazards, risks |
| 12 | Oceans and Coasts | Marine, coastal |
| 13 | Fire | Fire history, hazards |

---

## Appendix B: Icon Reference

Proposed icons for TNC categories (using Lucide icons in the app):

| Category | Icon Name | Emoji Fallback |
|----------|-----------|----------------|
| Boundaries | `Globe` | 🌐 |
| Infrastructure | `Building` or `Landmark` | 🏗️ |
| Research and Sensor Equipment | `Radio` or `Antenna` | 📡 |
| Earth Observations | `Satellite` | 🛰️ |
| Soils and Geology | `Layers` or `Mountain` | 🪨 |
| Land Cover | `Leaf` or `Trees` | 🌿 |
| Elevation and Bathymetry | `Mountain` or `TrendingUp` | ⛰️ |
| Weather and Climate | `Thermometer` or `Cloud` | 🌡️ |
| Freshwater | `Droplet` or `Waves` | 💧 |
| Species | `Bird` or `PawPrint` | 🦎 |
| Threats and Hazards | `AlertTriangle` | ⚠️ |
| Oceans and Coasts | `Waves` | 🌊 |
| Fire | `Flame` | 🔥 |
