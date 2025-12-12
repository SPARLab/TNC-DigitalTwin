# Drone Imagery Data Source - Quick Reference

## 🎯 TL;DR

- **11 drone imagery layers** from DroneDeploy across **6 projects**
- Covers Oct 2019 - May 2025
- Metadata table provides discovery, WMTS item IDs for loading imagery
- Service layer implemented: `src/services/droneImageryService.ts`
- Types defined: `src/types/droneImagery.ts`

## 📊 What You Have Now

### Documentation
| File | Purpose |
|------|---------|
| `DRONE_IMAGERY_INTEGRATION_GUIDE.md` | **START HERE** - Complete integration guide |
| `drone_imagery_metadata_summary.md` | Detailed metadata field analysis |
| `drone_imagery_sample_data.json` | Sample records with readable dates |
| `README_DRONE_IMAGERY.md` | This file - quick reference |

### Code
| File | Purpose |
|------|---------|
| `src/services/droneImageryService.ts` | ✅ **Ready to use** - Query and format metadata |
| `src/types/droneImagery.ts` | TypeScript type definitions |

### Scripts
| Script | Purpose |
|--------|---------|
| `scripts/drone-imagery-eda/explore-metadata.js` | Explore raw metadata table |
| `scripts/drone-imagery-eda/test-service.js` | Test service implementation |

## 🚀 Quick Start

### 1. Test the Service

```bash
# Explore the raw data
node scripts/drone-imagery-eda/explore-metadata.js

# Test the TypeScript service (JS version)
node scripts/drone-imagery-eda/test-service.js
```

### 2. Use in Your App

```typescript
import {
  fetchDroneImageryByProject,
  getDroneImagerySummary,
} from '@/services/droneImageryService';

// Get all projects with their imagery layers
const projects = await fetchDroneImageryByProject();

// Get summary stats
const summary = await getDroneImagerySummary();
console.log(`${summary.totalLayers} layers across ${summary.totalProjects} projects`);
```

### 3. Load WMTS Layer on Map

```typescript
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';

// Get imagery metadata
const projects = await fetchDroneImageryByProject();
const ramajal = projects.find(p => p.projectName === 'Ramajal Field');
const latestImagery = ramajal.imageryLayers[ramajal.imageryLayers.length - 1];

// Create WMTS layer (Note: You'll need to query the item for the service URL)
// The wmts.itemId can be used with Portal API or direct service URL
const layer = new WMTSLayer({
  portalItem: {
    id: latestImagery.wmts.itemId,
    portal: {
      url: 'https://dangermondpreserve-spatial.com/portal'
    }
  },
  title: `${latestImagery.projectName} - ${latestImagery.dateCaptured.toLocaleDateString()}`
});

map.add(layer);
```

## 📦 Data Overview

### Projects Summary

```
Archaeology Sites          1 layer   2019-10-06                        [📦 Collection]
Fish Barrier JA-1          1 layer   2025-05-16                        
JA-2 Bucket Bridge         3 layers  2024-08-28 → 2025-05-16          
JA1                        1 layer   2024-04-24                        [📦 Collection]
Ramajal Field              4 layers  2024-02-15 → 2024-12-14          [📦 Collection] ⭐ Best temporal series
TREX_ArmyCampBurnUnits     1 layer   2024-12-13                        [📦 Collection]
```

### Key Features

- **Temporal Series:** Ramajal Field (4 dates), JA-2 Bucket Bridge (3 dates)
- **Image Collections:** 7 out of 11 layers have associated image collections
- **Coverage:** Infrastructure, restoration, archaeology, prescribed burns
- **Format:** WMTS tile services for fast display

## 🔍 Metadata Fields

```typescript
{
  id: number;                    // Unique ID
  projectName: string;           // "Ramajal Field"
  planName: string;              // "Map #1"
  dateCaptured: Date;           // Capture date as Date object
  wmts: {
    itemId: string;             // ArcGIS item ID for WMTS
    link: string;               // Portal link
  };
  imageCollection?: {           // Optional - 7/11 have this
    itemId: string;
    link: string;
  };
}
```

## 📝 Service API

### `fetchDroneImageryMetadata()`
Returns all imagery layers as flat array

### `fetchDroneImageryByProject()`
Returns projects with nested imagery layers, sorted by date

### `fetchDroneImageryForProject(projectName)`
Returns imagery layers for specific project only

### `getDroneImageryCount()`
Returns total count of imagery layers

### `getDroneImagerySummary()`
Returns summary statistics and project overview

## 🎨 UI Integration Ideas

### 1. Data Catalog Card
```
┌─────────────────────────────────┐
│ 🚁 Drone Imagery                │
│                                  │
│ 11 layers across 6 projects     │
│ Oct 2019 - May 2025             │
│                                  │
│ [View Imagery] →                 │
└─────────────────────────────────┘
```

### 2. Project List View
```
Ramajal Field (4 layers)                    📦
  └─ Feb 14, 2024 - Dec 14, 2024
  
JA-2 Bucket Bridge (3 layers)
  └─ Aug 28, 2024 - May 16, 2025

JA1 (1 layer)                               📦
  └─ Apr 24, 2024
```

### 3. Temporal Comparison (for multi-date projects)
```
Ramajal Field - Temporal View

[◀─────●─────●─────●─────●─────▶]
       Feb   Dec   Dec   Dec
       2024  12    13    14

Before/After Slider
Opacity Control
```

## ⚠️ Important Notes

1. **Date Format:** Stored as Unix timestamps in **milliseconds** (not seconds!)
2. **No Geometry:** Metadata table has no extents - must query WMTS item for bounds
3. **Authentication:** Portal items may require auth for direct access
4. **Future Dates:** Some dates in May 2025 (scheduled flights or test data)

## 🔗 Service Endpoint

```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0
```

## 📚 Related Docs

- [Integration Guide](./DRONE_IMAGERY_INTEGRATION_GUIDE.md) - Complete integration guide
- [Metadata Summary](./drone_imagery_metadata_summary.md) - Field-by-field analysis
- [Sample Data](./drone_imagery_sample_data.json) - Example records

## 🎯 Next Steps

1. ✅ Service layer created and tested
2. ⬜ Create UI component (`DroneImageryView.tsx`)
3. ⬜ Add to Data Catalog
4. ⬜ Implement temporal comparison for multi-date projects
5. ⬜ Query WMTS metadata for extents/preview
6. ⬜ Add Image Collection integration (if needed)

---

**Last Updated:** Dec 5, 2024  
**Data Source:** DroneDeploy via automated pipeline  
**Status:** ✅ Ready for UI integration
