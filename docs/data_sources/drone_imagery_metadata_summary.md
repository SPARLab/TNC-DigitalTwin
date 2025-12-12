# DroneDeploy Imagery Metadata Summary

## Overview
The drone imagery data is stored in a Feature Service metadata table that provides discovery and access to WMTS (Web Map Tile Service) layers and Image Collections from DroneDeploy.

**Service URL:** `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0`

## Available Metadata Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `objectid` | OID | Unique object identifier |
| `project_name` | String | Name of the DroneDeploy project (e.g., "JA1", "Ramajal Field") |
| `plan_id` | String | DroneDeploy plan identifier (e.g., "MapPlan:662826c62737ccc0ff6fec7d") |
| `plan_name` | String | Name of the specific map/plan within the project (e.g., "Map #1", "Corridor Plan") |
| `date_captured` | String | Unix timestamp (in milliseconds) of when the imagery was captured |
| `wmts_link` | String | Portal link to the WMTS item page |
| `wmts_item_id` | String | ArcGIS item ID for the WMTS service |
| `collection_link` | String | Portal link to the Image Collection (nullable) |
| `collection_item_id` | String | ArcGIS item ID for the Image Collection (nullable) |
| `last_updated` | String | Unix timestamp (in milliseconds) of when this record was last updated |
| `record_type` | String | Type of record (observed: "plan") |

## Current Dataset (11 records as of Dec 2024)

### Projects Overview
1. **JA1** - 1 imagery layer
2. **JA-2 Bucket Bridge Fish Passage** - 3 imagery layers (different dates/plans)
3. **TREX_ArmyCampBurnUnits_2022** - 1 imagery layer
4. **Fish Barrier JA-1** - 1 imagery layer
5. **Ramajal Field** - 4 imagery layers (temporal series)
6. **Archaeology Sites** - 1 imagery layer

### Detailed Records

| Project Name | Plan Name | Date Captured | WMTS Item ID | Has Collection |
|--------------|-----------|---------------|--------------|----------------|
| JA1 | Map #1 | Apr 24, 2024 | 9616c72d... | ✅ Yes |
| JA-2 Bucket Bridge Fish Passage | Corridor Plan | May 15, 2025 | 33104372... | ❌ No |
| JA-2 Bucket Bridge Fish Passage | Corridor Plan | Dec 11, 2024 | 21103440... | ❌ No |
| JA-2 Bucket Bridge Fish Passage | Map #1 | Aug 28, 2024 | c9bf3741... | ❌ No |
| TREX_ArmyCampBurnUnits_2022 | Map #1 | Dec 12, 2024 | 4e4814c9... | ✅ Yes |
| Fish Barrier JA-1 | Map #1 | May 15, 2025 | 738333df... | ❌ No |
| Ramajal Field | Map #1 | Dec 13, 2024 | 4178e9b3... | ✅ Yes |
| Ramajal Field | Map #1 | Dec 12, 2024 | af821d5b... | ✅ Yes |
| Ramajal Field | Map #1 | Dec 12, 2024 | d3d6310b... | ✅ Yes |
| Ramajal Field | Map #1 | Feb 14, 2024 | dfb72b0b... | ✅ Yes |
| Archaeology Sites | PercosSouth2 | Oct 6, 2019 | 0c5cd289... | ✅ Yes |

## Metadata Limitations & Gaps

### What We Have ✅
- Project names
- Plan names and IDs
- Capture dates (as Unix timestamps)
- Direct links to WMTS services
- Links to Image Collections (when available)
- DroneDeploy plan identifiers

### What We're Missing ❌
- **Geographic extent/bounds** - No geometry or bounding box information
- **Spatial reference** - Not specified in the table
- **Image resolution/GSD** - Ground sample distance not included
- **Sensor information** - No camera/drone metadata
- **Flight altitude** - Not recorded
- **Area coverage** - Hectares/acres covered
- **Processing date** - When the imagery was processed (vs captured)
- **Description/notes** - No text description field
- **Tags/categories** - No categorization system
- **Quality metrics** - No information on image quality, orthomosaic accuracy, etc.

## Usage Notes

### Date Format
The `date_captured` field stores dates as Unix timestamps in **milliseconds** (not seconds). To convert:
- JavaScript: `new Date(parseInt(date_captured))`
- Python: `datetime.fromtimestamp(int(date_captured) / 1000)`

### WMTS Access
Each record has a `wmts_item_id` that can be used to:
1. Query item metadata: `https://dangermondpreserve-spatial.com/portal/sharing/rest/content/items/{wmts_item_id}?f=json`
2. Access the WMTS service directly (URL will be in the item metadata)

### Image Collections
Some records have associated Image Collections (`collection_item_id`), which may provide:
- Individual image access
- Additional metadata
- Image footprints/geometry

## Recommendations for Digital Twin Integration

### Display Strategy
Since geographic extent is not in the table, you'll need to:
1. Query each WMTS item's metadata to get the extent
2. Display imagery layers as discoverable items in a list/catalog view
3. Show temporal information prominently (many projects have multiple dates)

### Grouping Options
- **By Project** - Group all plans within the same project
- **By Date** - Show temporal series for locations with multiple captures
- **By Type** - Could categorize by purpose (infrastructure, archaeology, restoration, etc.)

### Temporal Features
The Ramajal Field project shows a good use case for temporal comparison:
- Feb 2024, Dec 2024 (multiple), highlighting seasonal/change detection opportunities

### UI Considerations
1. **Date Display** - Convert Unix timestamps to readable dates
2. **Preview** - Consider showing thumbnail previews (may need to query WMTS metadata)
3. **Flyto** - Use WMTS extent to fly camera to imagery location
4. **Filter** - Allow filtering by project, date range
5. **Details** - Link to portal pages for more information

## Next Steps

1. **Query WMTS Metadata** - Fetch extent, spatial reference, and additional details from each WMTS service
2. **Create Service Layer** - Build a TypeScript service (e.g., `droneImageryService.ts`) to query and format this data
3. **Design UI Component** - Create a data view component for browsing drone imagery
4. **Integration** - Add to the Data Catalog as a new data type
