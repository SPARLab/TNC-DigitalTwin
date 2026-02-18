# DroneDeploy Metadata Table - Enrichment Request

## Executive Summary

The current `DroneDeploy_Metadata` table provides basic discovery metadata (project names, dates, item IDs) but lacks critical information needed for effective UI integration. Additional metadata is available from WMTS services, Image Collections, and Portal items that would significantly improve the user experience if added to the metadata table.

**TL;DR:** Adding spatial extent, thumbnails, descriptions, and technical metadata to the table would eliminate the need for ~2-5 additional API calls per imagery layer when displaying in the UI.

---

## Current State

### What We Have Now (11 fields)

| Field | Type | Purpose |
|-------|------|---------|
| `objectid` | Integer | Unique record ID |
| `project_name` | String | Project name (e.g., "Ramajal Field") |
| `plan_id` | String | DroneDeploy plan ID |
| `plan_name` | String | Plan name within project |
| `date_captured` | String | Unix timestamp (ms) of capture date |
| `wmts_link` | String | Portal URL to WMTS item |
| `wmts_item_id` | String | ArcGIS item ID for WMTS |
| `collection_link` | String | Portal URL to Image Collection (nullable) |
| `collection_item_id` | String | ArcGIS item ID for collection (nullable) |
| `last_updated` | String | Unix timestamp (ms) of last update |
| `record_type` | String | Type of record ("plan") |

### What's Missing

- **No spatial information** - Can't show where imagery is located without loading WMTS
- **No thumbnails** - Can't preview imagery in UI
- **No descriptions** - No context about what the imagery shows
- **No technical specs** - No resolution, coverage area, or quality info
- **No WMTS service URLs** - Have to query Portal item to get actual service URL

---

## Available Metadata Sources

### 1. WMTS Service Metadata

**Access Pattern:**
```
GET https://dangermondpreserve-spatial.com/server/rest/services/.../MapServer/WMTS/1.0.0/WMTSCapabilities.xml
```

Or via REST API JSON:
```
GET https://dangermondpreserve-spatial.com/server/rest/services/.../MapServer?f=json
```

**Available Metadata:**

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| **Spatial Extent** | BoundingBox | xmin, ymin, xmax, ymax in WGS84 | 🔴 **CRITICAL** |
| **Spatial Reference** | WKID/WKT | Coordinate system (usually 3857 or 4326) | 🟡 High |
| **WMTS Service URL** | String | Direct service URL for loading tiles | 🔴 **CRITICAL** |
| **Tile Scheme** | TileMatrixSet | Zoom levels, scales, resolutions | 🟢 Low |
| **Min/Max Scale** | Numbers | Scale range for display | 🟢 Low |
| **Copyright** | String | Attribution text if any | 🟢 Low |

**Why This Matters:**
- **Spatial extent** lets us show imagery location on map without loading the layer
- **Service URL** eliminates need to query Portal item before loading
- **Spatial reference** ensures proper projection handling

### 2. Image Collection Metadata

**Access Pattern:**
```
GET https://dangermondpreserve-spatial.com/server/rest/services/.../ImageServer?f=json
GET https://dangermondpreserve-spatial.com/server/rest/services/.../ImageServer/query?where=1=1&outFields=*&f=json
```

**Available Metadata:**

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| **Image Count** | Integer | Number of individual images in collection | 🟡 High |
| **Total Area** | Number | Coverage area (sq meters or hectares) | 🟡 High |
| **Average GSD** | Number | Ground sample distance (cm/pixel) | 🟡 High |
| **Image Footprints** | Geometry | Spatial footprints of each image | 🟢 Low |
| **Overlap Stats** | Numbers | Average overlap percentage | 🟢 Low |
| **Processing Date** | Date | When imagery was processed | 🟢 Low |

**Why This Matters:**
- **Image count** and **area** give users sense of dataset size
- **GSD** indicates image resolution/quality
- **Footprints** could show coverage gaps (though probably overkill for metadata table)

### 3. Portal Item Metadata

**Access Pattern:**
```
GET https://dangermondpreserve-spatial.com/portal/sharing/rest/content/items/{item_id}?f=json
```

**Available Metadata:**

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| **Title** | String | Display name for item | 🟡 High |
| **Description** | String | Detailed description/context | 🔴 **CRITICAL** |
| **Snippet** | String | Brief summary | 🟡 High |
| **Thumbnail URL** | String | URL to preview image | 🔴 **CRITICAL** |
| **Tags** | Array[String] | Categorization tags | 🟡 High |
| **Access** | String | "public", "private", "org" | 🟢 Low |
| **Owner** | String | Who created/owns the item | 🟢 Low |
| **Size** | Integer | File size in bytes | 🟢 Low |
| **Views** | Integer | Number of times viewed | 🟢 Low |

**Why This Matters:**
- **Description** provides essential context (what area, why captured, etc.)
- **Thumbnail** lets users preview imagery before loading
- **Title** may be better formatted than project_name + plan_name
- **Tags** enable filtering/categorization in UI

### 4. DroneDeploy API Metadata (if accessible)

If your pipeline has access to DroneDeploy's API, additional metadata might include:

| Field | Type | Description | Priority |
|-------|------|-------------|----------|
| **Flight Altitude** | Number | Drone altitude in meters | 🟡 High |
| **Camera Model** | String | Camera/sensor used | 🟢 Low |
| **Flight Duration** | Number | Minutes of flight time | 🟢 Low |
| **Weather Conditions** | String | Weather during capture | 🟢 Low |
| **Processing Status** | String | Quality/completion status | 🟢 Low |
| **Annotations Count** | Integer | Number of annotations/labels | 🟢 Low |

---

## Recommended Enrichment Fields

### 🔴 **CRITICAL (Must Have)**

These fields eliminate API calls and enable core functionality:

```sql
-- Spatial extent (4 fields)
extent_xmin          DOUBLE        -- Western boundary (longitude)
extent_ymin          DOUBLE        -- Southern boundary (latitude)
extent_xmax          DOUBLE        -- Eastern boundary (longitude)
extent_ymax          DOUBLE        -- Northern boundary (latitude)

-- Direct service URL
wmts_service_url     VARCHAR(500)  -- Direct WMTS service URL for loading

-- Display information
description          VARCHAR(8000) -- What this imagery shows, context, purpose
thumbnail_url        VARCHAR(500)  -- URL to preview thumbnail image
```

**Impact:** 
- Enables "fly to" functionality without loading layer
- Shows imagery location on map immediately
- Provides preview images in UI
- Gives context for decision-making

**Estimated API calls saved:** 2 calls per layer (Portal item + extent query)

---

### 🟡 **HIGH PRIORITY (Should Have)**

These fields significantly improve UX:

```sql
-- Spatial info
spatial_reference    VARCHAR(100)  -- WKID (e.g., "3857", "4326")

-- Display metadata
title                VARCHAR(500)  -- Formatted display title
snippet              VARCHAR(1000) -- Brief summary for cards
tags                 VARCHAR(2000) -- Comma-separated tags for filtering

-- Image quality
ground_sample_dist   DOUBLE        -- Resolution in cm/pixel (GSD)
coverage_area_ha     DOUBLE        -- Coverage area in hectares

-- Image collection stats (if available)
image_count          INTEGER       -- Number of images in collection
```

**Impact:**
- Better filtering and categorization
- Quality indicators for users
- Coverage metrics for planning
- Proper titles instead of raw project names

**Estimated API calls saved:** 1-2 calls per layer

---

### 🟢 **NICE TO HAVE (Optional)**

These fields provide additional context but aren't critical:

```sql
-- Technical metadata
flight_altitude_m    DOUBLE        -- Drone altitude in meters
camera_model         VARCHAR(200)  -- Camera/sensor used
min_scale            DOUBLE        -- Minimum display scale
max_scale            DOUBLE        -- Maximum display scale

-- Administrative metadata
owner                VARCHAR(200)  -- Who owns/created the item
access_level         VARCHAR(50)   -- "public", "private", "org"
view_count           INTEGER       -- Portal view count
file_size_bytes      BIGINT        -- Total size of imagery

-- Processing metadata
date_processed       BIGINT        -- When processed (Unix timestamp ms)
processing_status    VARCHAR(100)  -- Quality/status indicator
```

**Impact:**
- Useful for admin/management
- Interesting stats for power users
- Technical details for GIS specialists

---

## Implementation Approach

### Option 1: Enrich During Pipeline Sync (Recommended)

When the DroneDeploy pipeline syncs new imagery:

1. **Query WMTS service** for spatial extent and service URL
2. **Query Portal item** for description, thumbnail, tags, title
3. **Query Image Collection** (if exists) for GSD, area, image count
4. **Store enriched data** in metadata table

**Pros:**
- Data readily available in frontend
- No runtime API calls needed
- Consistent, fast UI performance
- Can cache/update on schedule

**Cons:**
- Slightly more complex pipeline
- Need to handle failures gracefully
- Storage size increases (minimal)

### Option 2: Lazy Loading with Caching

Frontend queries additional metadata on demand:

**Pros:**
- Simpler pipeline
- Always fresh data

**Cons:**
- 2-5 API calls per layer on first load
- Slower UI, loading states needed
- More frontend complexity
- Cache management required

**Recommendation:** **Option 1** - Enrich during pipeline sync

---

## Proposed Schema Changes

### Minimal Enhancement (Critical Fields Only)

```sql
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_xmin DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_ymin DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_xmax DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_ymax DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN wmts_service_url VARCHAR(500);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN description VARCHAR(8000);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN thumbnail_url VARCHAR(500);
```

### Full Enhancement (Critical + High Priority)

```sql
-- Spatial extent
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_xmin DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_ymin DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_xmax DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN extent_ymax DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN spatial_reference VARCHAR(100);

-- Service URLs
ALTER TABLE DroneDeploy_Metadata ADD COLUMN wmts_service_url VARCHAR(500);

-- Display metadata
ALTER TABLE DroneDeploy_Metadata ADD COLUMN title VARCHAR(500);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN description VARCHAR(8000);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN snippet VARCHAR(1000);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE DroneDeploy_Metadata ADD COLUMN tags VARCHAR(2000);

-- Image quality/stats
ALTER TABLE DroneDeploy_Metadata ADD COLUMN ground_sample_dist DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN coverage_area_ha DOUBLE;
ALTER TABLE DroneDeploy_Metadata ADD COLUMN image_count INTEGER;
```

---

## Example Queries for Enrichment

### 1. Get WMTS Service Extent

```javascript
// Query WMTS service metadata
const serviceUrl = `${baseUrl}/MapServer?f=json`;
const response = await fetch(serviceUrl);
const metadata = await response.json();

const extent = {
  xmin: metadata.fullExtent.xmin,
  ymin: metadata.fullExtent.ymin,
  xmax: metadata.fullExtent.xmax,
  ymax: metadata.fullExtent.ymax,
  spatialReference: metadata.spatialReference.latestWkid || metadata.spatialReference.wkid
};
```

### 2. Get Portal Item Metadata

```javascript
// Query Portal item
const itemUrl = `https://dangermondpreserve-spatial.com/portal/sharing/rest/content/items/${wmts_item_id}?f=json`;
const response = await fetch(itemUrl);
const item = await response.json();

const portalMetadata = {
  title: item.title,
  description: item.description,
  snippet: item.snippet,
  thumbnail_url: item.thumbnail ? `${portalUrl}/content/items/${item.id}/info/${item.thumbnail}` : null,
  tags: item.tags.join(',')
};
```

### 3. Get Image Collection Stats

```javascript
// Query Image Collection service
const collectionUrl = `${baseUrl}/ImageServer?f=json`;
const response = await fetch(collectionUrl);
const collection = await response.json();

const collectionMetadata = {
  image_count: collection.properties?.rasterCount || null,
  ground_sample_dist: collection.properties?.PixelSizeX ? collection.properties.PixelSizeX * 100 : null, // Convert to cm
  coverage_area_ha: collection.properties?.areaInSqMeters ? collection.properties.areaInSqMeters / 10000 : null
};
```

---

## Benefits Summary

### Without Enrichment (Current State)
```
User clicks "Ramajal Field imagery"
  ↓
1. Query Portal item for thumbnail (300ms)
2. Query Portal item for description (300ms)
3. Query WMTS service for extent (400ms)
4. Query WMTS service for service URL (400ms)
5. Finally show preview and load button (1.4s total)
```

### With Enrichment
```
User clicks "Ramajal Field imagery"
  ↓
1. Show thumbnail, description, extent immediately (0ms)
2. User clicks "Load on Map"
3. Load WMTS layer directly (200ms)
```

**Performance Improvement:** ~1.2 seconds faster, 4 fewer API calls per layer

### UI Improvements Enabled

1. **Map preview** - Show coverage areas before loading
2. **Imagery browser** - Gallery view with thumbnails
3. **Smart filtering** - By date, area, quality, tags
4. **Temporal slider** - Preview before/after for multi-date projects
5. **Info cards** - Rich context without clicking

---

## Questions for Implementation

1. **Authentication** - Does the pipeline have credentials to query Portal REST API?
2. **Frequency** - How often does the metadata need to refresh? (Daily? On-demand?)
3. **Failure handling** - What if Portal/WMTS queries fail during sync?
4. **Nullable fields** - Should all new fields be nullable for backwards compatibility?
5. **Existing records** - Backfill enrichment for existing 11 layers?

---

## Recommendation

**Implement the "Full Enhancement" schema** with the following fields:

✅ **Must have (7 fields):**
- `extent_xmin`, `extent_ymin`, `extent_xmax`, `extent_ymax`
- `wmts_service_url`
- `description`
- `thumbnail_url`

✅ **Should have (6 fields):**
- `spatial_reference`
- `title`, `snippet`, `tags`
- `ground_sample_dist`
- `coverage_area_ha`

❓ **Optional (consider if easy):**
- `image_count`

This provides the maximum benefit for UI integration with minimal additional storage (~150 bytes per record).

---

## Appendix: REST API Endpoints Reference

### WMTS Service Metadata
```
GET {base_url}/MapServer?f=json
```

### Portal Item Metadata
```
GET https://dangermondpreserve-spatial.com/portal/sharing/rest/content/items/{item_id}?f=json
```

### Image Collection Metadata
```
GET {collection_base_url}/ImageServer?f=json
```

### Thumbnail URL Pattern
```
https://dangermondpreserve-spatial.com/portal/content/items/{item_id}/info/{thumbnail_filename}
```

---

**Contact:** [Your name/email]  
**Date:** December 5, 2024  
**Status:** Awaiting backend implementation
