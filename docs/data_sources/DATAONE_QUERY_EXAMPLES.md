# DataONE Query Examples

## Basic Count Query
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json"
```

Result: `{"count":22221}`

---

## Query by Category
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query?where=tnc_category%3D%27Freshwater%27&returnCountOnly=true&f=json"
```

---

## Query with Spatial Filter (Preserve boundary example)
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=1=1" \
  --data-urlencode "geometry={xmin:-13182000,ymin:4075000,xmax:-13170000,ymax:4085000}" \
  --data-urlencode "geometryType=esriGeometryEnvelope" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "returnCountOnly=true" \
  --data-urlencode "f=json"
```

---

## Query with Date Range
```bash
# Datasets uploaded in 2023
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=date_uploaded >= timestamp '2023-01-01 00:00:00' AND date_uploaded <= timestamp '2023-12-31 23:59:59'" \
  --data-urlencode "returnCountOnly=true" \
  --data-urlencode "f=json"
```

---

## Text Search (Title contains keyword)
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=title LIKE '%water%' OR keywords LIKE '%water%'" \
  --data-urlencode "returnCountOnly=true" \
  --data-urlencode "f=json"
```

---

## Full Query with Pagination
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=tnc_category='Freshwater'" \
  --data-urlencode "outFields=*" \
  --data-urlencode "returnGeometry=true" \
  --data-urlencode "resultRecordCount=10" \
  --data-urlencode "resultOffset=0" \
  --data-urlencode "orderByFields=date_uploaded DESC" \
  --data-urlencode "f=json"
```

---

## Query Statistics (Group by Category)
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=1=1" \
  --data-urlencode "outStatistics=[{\"statisticType\":\"count\",\"onStatisticField\":\"objectid\",\"outStatisticFieldName\":\"count\"}]" \
  --data-urlencode "groupByFieldsForStatistics=tnc_category" \
  --data-urlencode "f=json"
```

---

## High Confidence Datasets Only
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=tnc_confidence >= 0.9" \
  --data-urlencode "returnCountOnly=true" \
  --data-urlencode "f=json"
```

---

## Query by Multiple Categories (Using OR)
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=tnc_category IN ('Freshwater', 'Threats and Hazards')" \
  --data-urlencode "returnCountOnly=true" \
  --data-urlencode "f=json"
```

---

## Query Specific Dataset by ID
```bash
curl -G "https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0/query" \
  --data-urlencode "where=dataone_id='ark:/13030/m5hh6jp2/3/cadwsap-s1910250-002.xml'" \
  --data-urlencode "outFields=*" \
  --data-urlencode "returnGeometry=true" \
  --data-urlencode "f=json"
```

---

## TypeScript Service Function Examples

Based on these queries, here are example service functions:

```typescript
// Count datasets by category
export async function countDataONEDatasets(
  category?: string,
  spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number }
): Promise<number> {
  let where = '1=1';
  if (category) {
    where = `tnc_category='${category}'`;
  }
  
  const params: Record<string, string> = {
    where,
    returnCountOnly: 'true',
    f: 'json'
  };
  
  if (spatialExtent) {
    params.geometry = JSON.stringify(spatialExtent);
    params.geometryType = 'esriGeometryEnvelope';
    params.spatialRel = 'esriSpatialRelIntersects';
  }
  
  const response = await fetch(buildQueryUrl(params));
  const data = await response.json();
  return data.count;
}

// Query datasets with pagination
export async function queryDataONEDatasets(
  options: DataONEQueryOptions
): Promise<DataONEDataset[]> {
  const whereClauses: string[] = ['1=1'];
  
  if (options.category) {
    whereClauses.push(`tnc_category='${options.category}'`);
  }
  
  if (options.minConfidence) {
    whereClauses.push(`tnc_confidence >= ${options.minConfidence}`);
  }
  
  if (options.searchText) {
    const searchPattern = `%${options.searchText}%`;
    whereClauses.push(
      `(title LIKE '${searchPattern}' OR keywords LIKE '${searchPattern}' OR abstract LIKE '${searchPattern}')`
    );
  }
  
  const params: Record<string, string> = {
    where: whereClauses.join(' AND '),
    outFields: '*',
    returnGeometry: 'true',
    resultRecordCount: String(options.maxResults || 50),
    resultOffset: String(options.resultOffset || 0),
    orderByFields: options.orderByFields || 'date_uploaded DESC',
    f: 'json'
  };
  
  if (options.spatialExtent) {
    params.geometry = JSON.stringify(options.spatialExtent);
    params.geometryType = 'esriGeometryEnvelope';
    params.spatialRel = 'esriSpatialRelIntersects';
  }
  
  const response = await fetch(buildQueryUrl(params));
  const data = await response.json();
  return data.features.map(transformFeature);
}

// Get category statistics
export async function getDataONECategoryStats(): Promise<
  Array<{ category: string; count: number }>
> {
  const params = {
    where: '1=1',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'objectid',
        outStatisticFieldName: 'count'
      }
    ]),
    groupByFieldsForStatistics: 'tnc_category',
    f: 'json'
  };
  
  const response = await fetch(buildQueryUrl(params));
  const data = await response.json();
  return data.features.map((f: any) => ({
    category: f.attributes.tnc_category,
    count: f.attributes.count
  }));
}
```

