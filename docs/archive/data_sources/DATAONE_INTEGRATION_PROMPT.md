# DataONE Integration Prompt

Use this prompt to start a new conversation for implementing DataONE integration.

---

## Context

I'm building a TNC Digital Twin application (React + TypeScript + ArcGIS) that integrates multiple environmental data sources. I need to add DataONE as a new data source.

**Goal:** Increase discoverability of DataONE datasets. Users should be able to search/filter datasets, then link out to DataONE to view the full details. We are NOT recreating the DataONE interface.

## DataONE Feature Services

I've created two ArcGIS Feature Services with DataONE metadata:

**Catalog Layer (for fast queries/counts):**
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0
```
Fields: objectid, dataone_id, title, dataset_url, tnc_category, tnc_categories, tnc_confidence, date_uploaded, begin_date, end_date, center_lat, center_lon, datasource

**Detail Layer (for full metadata):**
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0
```
Additional fields: abstract, keywords, authors, site, project, funding, north_bound, south_bound, east_bound, west_bound, date_published, date_modified, data_url, size_bytes, rights_holder

**Stats:** 22,221 datasets across 13 TNC categories. Top categories: Oceans and Coasts (10,395), Freshwater (3,168), Species (2,740).

## Data Model Note

A DataONE "dataset" is actually a collection of files (CSVs, PDFs, images, etc.) bundled with metadata. We only stored dataset-level metadata in the Feature Service, not individual file information. To show file breakdowns would require a separate backend task to query DataONE's API.

## Four Filters Only

1. **Text search** - Search title and keywords fields
2. **Category filter** - Filter by tnc_category 
3. **Time frame filter** - Filter by date_uploaded or begin_date/end_date
4. **Spatial filter** - Filter by preserve boundary or custom extent

## UI Requirements

1. **Data Catalog Card** - Add DataONE to the existing data catalog grid
2. **List View** - Show 10-20 datasets at a time, paginated
3. **Detail View** - Show full metadata + "View on DataONE" external link (and optionally iframe)
4. **Map Layer** - Points with clustering (22k records needs clustering!)

## Existing Patterns to Follow

Look at these files for patterns:
- `src/services/animlService.ts` - Service layer pattern
- `src/services/eBirdService.ts` - Another service example
- `src/components/DataCatalog.tsx` - Data catalog card grid
- `src/components/TNCArcGISList.tsx` - List component pattern
- `src/components/TNCArcGISDetails.tsx` - Details panel pattern
- `src/components/DataView.tsx` - Routing between data views
- `src/utils/constants.ts` - DATA_SOURCES and CATEGORY_DATA_SOURCES

## Implementation Tasks

1. Create `src/services/dataOneService.ts`
   - `countDatasets(options)` - Use Catalog layer
   - `queryDatasets(options)` - Use Catalog layer with pagination
   - `getDatasetDetails(dataoneId)` - Use Detail layer

2. Update `src/utils/constants.ts`
   - Add 'DataONE' to DATA_SOURCES
   - Add DataONE to all categories in CATEGORY_DATA_SOURCES

3. Create UI Components
   - Add DataONE card to DataCatalog.tsx
   - Create DataONEList.tsx (paginated list)
   - Create DataONEDetails.tsx (full info + external link)

4. Update DataView.tsx routing

5. Add map layer with point clustering

## Sample Queries

Count by category:
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0/query?where=tnc_category%3D%27Freshwater%27&returnCountOnly=true&f=json"
```

Get paginated results:
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0/query" \
  --data-urlencode "where=tnc_category='Freshwater'" \
  --data-urlencode "outFields=*" \
  --data-urlencode "resultRecordCount=20" \
  --data-urlencode "resultOffset=0" \
  --data-urlencode "orderByFields=date_uploaded DESC" \
  --data-urlencode "f=json"
```

## Reference

See `docs/data_sources/DATAONE_INTEGRATION_PLAN.md` for the full plan and `docs/data_sources/DATAONE_QUERY_EXAMPLES.md` for query patterns.

---

**Please start by reviewing the existing service patterns in animlService.ts and the DataCatalog.tsx component structure, then propose an implementation approach for the DataONE service layer.**

