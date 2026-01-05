# DataONE Integration Plan

**Date:** January 5, 2026  
**Purpose:** Simple discoverability layer for DataONE datasets

---

## Goal

**Increase discoverability** of DataONE datasets by allowing users to search by:
- Text (title, keywords)
- Category (TNC categories)
- Time frame (date uploaded or data collection dates)
- Spatial extent (preserve boundary or custom area)

We are **NOT** trying to recreate the DataONE interface. We help users **find** datasets, then **link out** to DataONE for the full experience.

---

## What is a DataONE "Dataset"?

A DataONE "data package" is actually a **collection of files**:
- Could contain CSVs, PDFs, images, shapefiles, etc.
- Bundled with EML (Ecological Metadata Language) metadata
- Each package has a unique identifier (DOI, ARK, etc.)

**What we stored:** Dataset-level metadata only (title, abstract, keywords, dates, location, size)

**What we didn't store:** Individual file information (file names, types, counts)

**Future backend task:** Query DataONE API to get file-level details for each dataset (e.g., "3 CSVs, 2 PDFs, 1 shapefile, 100 GB total")

---

## Service Layers

| Layer | Purpose | Use For |
|-------|---------|---------|
| **DataONE_Catalog** | 13 fields, fast queries | Count queries, list views |
| **DataONE_Detail** | 28 fields, full metadata | Detail views (when user clicks a dataset) |

**Strategy:** Use Catalog for searching/counting, Detail for showing full info when selected.

---

## Four Filters

### 1. Text Search
```sql
WHERE title LIKE '%kelp%' OR keywords LIKE '%kelp%'
```

### 2. Category Filter
```sql
WHERE tnc_category = 'Freshwater'
```

### 3. Time Frame Filter
```sql
-- By upload date
WHERE date_uploaded >= timestamp '2020-01-01' AND date_uploaded <= timestamp '2025-12-31'

-- Or by data collection dates
WHERE begin_date >= timestamp '2020-01-01' AND end_date <= timestamp '2025-12-31'
```

### 4. Spatial Filter
```
geometry={xmin:-13182000,ymin:4075000,xmax:-13170000,ymax:4085000}
geometryType=esriGeometryEnvelope
spatialRel=esriSpatialRelIntersects
```

---

## UI Flow

### Data Catalog Card
- Icon: DataONE logo or database icon
- Title: "DataONE"
- Subtitle: "22,000+ scientific datasets"
- Description: "Research datasets from PISCO, LTER, PANGAEA, and more"

### List View (10-20 at a time)
Show for each dataset:
- **Title** (truncated)
- **Category** badge
- **Repository** (e.g., "PISCO", "LTER")
- **Date** (uploaded or published)
- **Size** (if available, e.g., "4.9 KB")

Pagination: "Showing 1-20 of 3,168 Freshwater datasets"

### Detail View (when clicked)
Show:
- Full title
- Abstract
- Keywords (as chips)
- Authors
- Temporal coverage (begin/end dates if available)
- Spatial coverage (bounding box on mini-map)
- Repository source
- File size
- **"View on DataONE" button** → opens `dataset_url` in new tab
- **Optional iframe** embedding the DataONE page

### Map View
- Points at dataset center locations
- **Clustering required** (22k points!)
- Click to select → shows list item / opens details
- Color by category (optional)

---

## Implementation Checklist

### Service Layer
- [ ] Create `src/services/dataOneService.ts`
  - `countDatasets(filters)` → use Catalog layer
  - `queryDatasets(filters, page, pageSize)` → use Catalog layer
  - `getDatasetDetails(dataoneId)` → use Detail layer

### UI Components  
- [ ] Add DataONE card to `DataCatalog.tsx`
- [ ] Create `DataONEList.tsx` (paginated list, 10-20 items)
- [ ] Create `DataONEDetails.tsx` (full metadata + external link/iframe)
- [ ] Add route in `DataView.tsx`

### Constants
- [ ] Add `'DataONE'` to `DATA_SOURCES`
- [ ] Add DataONE to all categories in `CATEGORY_DATA_SOURCES`

### Map
- [ ] Add DataONE layer to map (point clustering)
- [ ] Click handler to select dataset

---

## Query Examples

### Count by Category
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0/query?where=tnc_category%3D%27Freshwater%27&returnCountOnly=true&f=json"
# Returns: {"count": 3168}
```

### Get Page of Results
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0/query" \
  --data-urlencode "where=tnc_category='Freshwater'" \
  --data-urlencode "outFields=objectid,dataone_id,title,tnc_category,date_uploaded,datasource" \
  --data-urlencode "resultRecordCount=20" \
  --data-urlencode "resultOffset=0" \
  --data-urlencode "orderByFields=date_uploaded DESC" \
  --data-urlencode "f=json"
```

### Get Full Details for One Dataset
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=dataone_id='ark:/13030/m5hh6jp2/3/cadwsap-s1910250-002.xml'" \
  --data-urlencode "outFields=*" \
  --data-urlencode "f=json"
```

---

## TypeScript Interfaces

```typescript
// For list view (Catalog layer fields)
export interface DataONEDatasetSummary {
  objectid: number;
  dataone_id: string;
  title: string;
  tnc_category: string;
  tnc_categories: string;
  date_uploaded: number; // epoch ms
  datasource: string;
  center_lat: number;
  center_lon: number;
}

// For detail view (Detail layer fields)
export interface DataONEDatasetDetail extends DataONEDatasetSummary {
  dataset_url: string;
  data_url?: string;
  abstract?: string;
  keywords?: string;
  authors?: string;
  begin_date?: number;
  end_date?: number;
  date_published?: number;
  north_bound?: number;
  south_bound?: number;
  east_bound?: number;
  west_bound?: number;
  size_bytes?: number;
  rights_holder?: string;
}

// Query options
export interface DataONEQueryOptions {
  searchText?: string;
  category?: string;
  startDate?: string; // ISO date
  endDate?: string;
  dateField?: 'date_uploaded' | 'begin_date';
  spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
  pageSize?: number;
  pageOffset?: number;
  orderBy?: string;
}
```

---

## Future Backend Task

To show file-level information (e.g., "This dataset contains 3 CSVs and 2 PDFs"), would need to:

1. Query DataONE API for each dataset's "resource map"
2. Parse the ORE (Object Reuse and Exchange) format
3. Extract file names, types, and sizes
4. Store in a new field or related table

This is **out of scope** for the initial front-end integration. We'll just link to DataONE where users can see the full file list.

---

## Data Statistics

| Metric | Value |
|--------|-------|
| Total datasets | 22,221 |
| Largest category | Oceans and Coasts (10,395) |
| Top repository | PISCO (6,853) |
| Avg confidence | 94.4% (not shown in UI) |

---

## External Links

- **Catalog Service:** `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0`
- **Detail Service:** `https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0`
- **DataONE Search:** `https://search.dataone.org/`

---

## Next Steps

1. ✅ Understand data model (done)
2. ⬜ Create `dataOneService.ts` with simple query functions
3. ⬜ Add DataONE to data catalog
4. ⬜ Create list component (paginated)
5. ⬜ Create details component with external link
6. ⬜ Add map layer with clustering
7. ⬜ Test all four filters

