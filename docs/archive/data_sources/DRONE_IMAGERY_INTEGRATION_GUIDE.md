# Drone Imagery Integration Guide

## Overview

This guide covers the DroneDeploy imagery dataset available for the Dangermond Preserve Digital Twin. The imagery consists of high-resolution drone/UAV captures stored as WMTS (Web Map Tile Service) layers and Image Collections.

## 🎯 Quick Summary

- **Service Type:** ArcGIS Feature Service (metadata table)
- **Total Imagery Layers:** 11 layers across 6 projects
- **Date Range:** October 2019 - May 2025
- **Format:** WMTS tile layers + optional Image Collections
- **Update Frequency:** Automatically updated by DroneDeploy pipeline

## 📊 Dataset Details

### Service Endpoint
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0
```

### Available Projects

| Project | Layers | Date Range | Has Collections | Notes |
|---------|--------|------------|-----------------|-------|
| **Ramajal Field** | 4 | Feb 2024 - Dec 2024 | ✅ | Best temporal series example |
| **JA-2 Bucket Bridge Fish Passage** | 3 | Aug 2024 - May 2025 | ❌ | Infrastructure monitoring |
| **JA1** | 1 | Apr 2024 | ✅ | - |
| **Fish Barrier JA-1** | 1 | May 2025 | ❌ | Infrastructure |
| **TREX_ArmyCampBurnUnits_2022** | 1 | Dec 2024 | ✅ | Prescribed burn monitoring |
| **Archaeology Sites** | 1 | Oct 2019 | ✅ | Oldest imagery |

### Metadata Fields

```typescript
{
  objectid: number;              // Unique ID
  project_name: string;          // Project name
  plan_id: string;               // DroneDeploy plan ID
  plan_name: string;             // Plan name within project
  date_captured: string;         // Unix timestamp (ms)
  wmts_link: string;             // Portal link to WMTS item
  wmts_item_id: string;          // ArcGIS item ID for WMTS
  collection_link: string;       // Portal link to Image Collection (nullable)
  collection_item_id: string;    // Item ID for collection (nullable)
  last_updated: string;          // Unix timestamp (ms)
  record_type: string;           // "plan"
}
```

## 🔍 What You Need to Know

### ✅ What We Have
- Project and plan names
- Capture dates (Unix timestamps in milliseconds)
- Direct WMTS item IDs for loading imagery
- Links to Image Collections (7 out of 11 layers)
- DroneDeploy plan identifiers

### ❌ What We're Missing
- **Geographic extent** - Must query WMTS item metadata to get bounds
- **Spatial reference** - Must query WMTS metadata
- **Image resolution/GSD** - Not in metadata table
- **Coverage area** - Not specified (acres/hectares)
- **Sensor/drone info** - Not included
- **Flight altitude** - Not recorded
- **Descriptions** - No text descriptions in table

### 📦 Image Collections vs WMTS

**WMTS Layers (all 11 have these):**
- Pre-rendered tile pyramids
- Fast display at any zoom level
- Good for basemap/overlay use
- No individual image access

**Image Collections (7 have these):**
- Access to individual source images
- Image footprints/geometry
- More detailed metadata
- Useful for analysis/downloads

## 🛠️ Getting Started

### 1. Explore the Data

Run the exploration script:
```bash
node scripts/drone-imagery-eda/explore-metadata.js
```

This will show you:
- All projects and their layers
- Temporal coverage
- Which layers have Image Collections
- Available metadata fields

### 2. Query the Metadata Table

Basic query for all records:
```javascript
const url = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0/query';
const params = {
  where: '1=1',
  outFields: '*',
  returnGeometry: false,
  f: 'json'
};

const response = await fetch(`${url}?${new URLSearchParams(params)}`);
const data = await response.json();
```

### 3. Working with Dates

Dates are stored as Unix timestamps in **milliseconds**:

```typescript
// Convert to Date object
const dateCaptured = new Date(parseInt(record.date_captured));

// Format for display
const dateString = dateCaptured.toISOString().split('T')[0]; // "2024-04-24"
```

### 4. Load WMTS Layers

Each record has a `wmts_item_id`. To load the imagery:

```typescript
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';

// Option 1: If you have the direct WMTS service URL
const layer = new WMTSLayer({
  url: wmtsServiceUrl,
  title: `${record.project_name} - ${formatDate(record.date_captured)}`
});

// Option 2: Use ArcGIS Portal item (may need auth)
const layer = new WMTSLayer({
  portalItem: {
    id: record.wmts_item_id,
    portal: {
      url: 'https://dangermondpreserve-spatial.com/portal'
    }
  }
});
```

## 📁 Files Created for You

### Documentation
- `docs/data_sources/drone_imagery_metadata_summary.md` - Detailed metadata analysis
- `docs/data_sources/drone_imagery_sample_data.json` - Sample records with readable dates
- `docs/data_sources/DRONE_IMAGERY_INTEGRATION_GUIDE.md` - This file

### Code
- `src/types/droneImagery.ts` - TypeScript type definitions
- `scripts/drone-imagery-eda/explore-metadata.js` - Data exploration script
- `scripts/drone-imagery-eda/README.md` - EDA scripts documentation

## 🎨 UI/UX Recommendations

### Display Strategy

Since geographic extent is not in the metadata table, consider:

1. **List/Grid View** - Show imagery as cards/list items
   - Group by project
   - Sort by date (newest first)
   - Show capture date prominently
   - Indicate if Image Collection available

2. **Temporal View** - For projects with multiple dates
   - Timeline slider for Ramajal Field (4 dates)
   - Before/after comparison for JA-2 (3 dates)

3. **Map Integration** - Once loaded
   - Fly to extent when user clicks layer
   - Show as semi-transparent overlay
   - Toggle visibility
   - Layer opacity control

### Grouping Options

```
📁 By Project
  └─ Ramajal Field (4 layers)
      ├─ Feb 2024 📦
      ├─ Dec 12, 2024 📦
      ├─ Dec 13, 2024 📦
      └─ Dec 14, 2024 📦
  └─ JA-2 Bucket Bridge (3 layers)
  ...

📅 By Date
  └─ 2024
      ├─ February (1 layer)
      ├─ April (1 layer)
      ├─ August (1 layer)
      └─ December (5 layers)
  └─ 2025
      └─ May (2 layers)

🏷️ By Type (if categorized in future)
  └─ Infrastructure
  └─ Restoration
  └─ Archaeology
  └─ Prescribed Burns
```

### Key Features to Include

- [x] **Date Display** - Convert timestamps to readable format
- [ ] **Thumbnails** - Fetch from WMTS or portal item
- [ ] **Extent Preview** - Show bounding box on map
- [ ] **Flyto Action** - Navigate to imagery location
- [ ] **Temporal Comparison** - Swipe/slider for time series
- [ ] **Layer Visibility Toggle** - Show/hide on map
- [ ] **Opacity Control** - Adjust layer transparency
- [ ] **Metadata Panel** - Show project details, capture date, etc.
- [ ] **Download Link** - Link to Image Collection if available
- [ ] **Portal Link** - Direct link to ArcGIS portal page

## 🚀 Next Steps for Integration

### Phase 1: Service Layer (Immediate)
1. Create `src/services/droneImageryService.ts`
   - Query metadata table
   - Parse dates
   - Group by project
   - Format for UI consumption

2. Add to existing service patterns
   - Follow `tncINaturalistService.ts` pattern
   - Handle errors gracefully
   - Cache results if appropriate

### Phase 2: UI Component (Short-term)
1. Create `src/components/dataviews/DroneImageryView.tsx`
   - List/grid display of imagery layers
   - Group by project
   - Show dates, layer count
   - Click to load on map

2. Add to Data Catalog
   - New data type: "Drone Imagery" or "Aerial Imagery"
   - Icon/thumbnail
   - Count badge showing 11 layers

### Phase 3: Advanced Features (Long-term)
1. **Temporal Comparison**
   - Slider for projects with multiple dates
   - Side-by-side comparison
   - Change detection highlighting

2. **Image Collections Integration**
   - Access individual images
   - Image footprints on map
   - Download capabilities

3. **Metadata Enhancement**
   - Query WMTS item metadata for extents
   - Add descriptions/tags
   - Categorize by purpose/area

## 💡 Use Cases

### 1. Infrastructure Monitoring
- **JA-2 Bucket Bridge** (3 dates over 9 months)
- Track construction progress
- Document before/after conditions

### 2. Prescribed Burn Monitoring
- **TREX_ArmyCampBurnUnits_2022**
- Post-burn imagery
- Vegetation recovery tracking

### 3. Restoration Tracking
- **Ramajal Field** (4 dates across 10 months)
- Seasonal changes
- Habitat restoration progress
- Best example for temporal comparison features

### 4. Cultural Resource Documentation
- **Archaeology Sites** (2019 baseline)
- Historical record
- Site condition monitoring

## 🔗 Related Resources

- [DroneDeploy Metadata Service](https://dangermondpreserve-spatial.com/portal/home/item.html?id=111c0de6c17042c28ea4d0b113204492)
- [ArcGIS WMTS Layer Documentation](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-WMTSLayer.html)
- [Exploration Script](../../scripts/drone-imagery-eda/explore-metadata.js)

## 📝 Notes

- Dates in table are Unix timestamps in **milliseconds** (not seconds!)
- WMTS items may require authentication for portal access
- Some future dates (May 2025) suggest planned flights or test data
- Pipeline auto-updates metadata when new imagery processed
- No geometry in metadata table - just a discovery/index table
