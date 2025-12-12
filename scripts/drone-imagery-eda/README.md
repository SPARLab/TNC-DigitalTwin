# Drone Imagery EDA Scripts

Exploratory data analysis scripts for the DroneDeploy imagery metadata.

## Quick Start

```bash
# Run the metadata explorer
node scripts/drone-imagery-eda/explore-metadata.js
```

## What's Available

- **explore-metadata.js** - Query and explore the DroneDeploy_Metadata table
  - Shows all projects and their imagery layers
  - Displays temporal coverage
  - Lists available metadata fields
  - Groups by project for easy viewing

## Service Information

**Metadata Service:** `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0`

This service provides a discovery table for drone imagery from DroneDeploy, including:
- Project and plan names
- Capture dates
- Links to WMTS services (tile layers)
- Links to Image Collections (when available)

## Next Steps

1. **Query WMTS Service Metadata** - For each `wmts_item_id`, fetch the actual WMTS service URL, extent, and spatial reference
2. **Build Service Layer** - Create `droneImageryService.ts` to wrap these queries
3. **UI Integration** - Add to Data Catalog and create a dedicated view component

## Notes

- Date fields are Unix timestamps in **milliseconds** (divide by 1000 for standard Unix time)
- Not all imagery has associated Image Collections
- WMTS items may require authentication for direct portal access
- No geographic extent data in the metadata table - must be fetched from WMTS item metadata
