# Backend Coworker Brief: Data Source Requirements

**Created:** January 23, 2026  
**For:** Dan  
**Purpose:** Gather user requirements AND performance baselines for the V2 dashboard

---

## Overview

We're building a new dashboard layout with a significantly different UX paradigm. Before building, we need your input as both:

1. **A researcher** — What features would actually help you do research?
2. **A backend advisor** — What queries would those features require, and how should we structure/index the data to support them?

The goal is to think about performance *before* we build, so we can structure our feature layers appropriately.

---

## How This Document Works

For each data source, we'll walk through:

1. **Feature Wishlist:** What would be useful to you as a researcher?
2. **Query Implications:** What queries does each feature require? (We'll fill this in together)
3. **Performance Testing:** How fast are those queries today? What needs optimization?

This creates a feedback loop: **Features → Queries → Indexing → Performance**

---

## Context: The New UX Paradigm

The new dashboard has a three-level data hierarchy:

1. **Layer** — A data source (e.g., "ANiML Camera Traps")
2. **Feature** — An individual item within that layer (e.g., a specific camera trap)
3. **Related Data** — Data nested under a feature (e.g., images from that camera)

Users can:
- **Filter at the layer level:** "Show me only cameras that have mountain lion images"
- **Drill into a feature:** "Show me Camera CAM-042's details"
- **Filter related data:** "Show me only the mountain lion images from CAM-042"

This means we need queries that support both **aggregate views** (layer-level summaries) and **drill-down views** (feature-level detail).

---

## Part 1: Feature Wishlist → Query Requirements

> *For each data source, imagine you're using this dashboard for actual research. What would help you? For each feature you want, we'll identify what query it implies.*

### ANiML Camera Traps

#### Scenario 1: Browsing Cameras

When you see the map with camera trap locations, what summary info **on each marker** helps you decide which cameras to investigate?

| Summary Info You Want | Query This Implies | Your Priority (High/Med/Low) |
|-----------------------|--------------------|-----------------------------|
| Total image count | `COUNT images WHERE camera_id = X` | |
| Species breakdown (pie chart or list) | `COUNT images GROUP BY species WHERE camera_id = X` | |
| Date range of activity | `MIN/MAX date WHERE camera_id = X` | |
| Most recent detection | `MAX date WHERE camera_id = X` | |
| (other — please add) | | |

---

#### Scenario 2: Filtered Layer View (Clustering)

**Trisalyn mentioned wanting this:** When you filter for a species (e.g., "mountain lions"), the map shows numbered icons at each camera location — like Google Maps cycling icons. The number shows how many matching images are at that camera.

**Example workflow:**
1. Filter ANiML layer for "mountain lion"
2. Map shows ~15 camera icons, each with a count (e.g., "23")
3. Click an icon → see gallery of those 23 mountain lion images

**Is this useful to you?**
- [ ] Yes, this is exactly what I'd want
- [ ] Somewhat — with modifications: ___
- [ ] Not really — I'd prefer: ___

**Query this implies:**
```
SELECT camera_id, COUNT(*) as image_count
FROM images
WHERE species = 'mountain lion'
GROUP BY camera_id
```

---

#### Scenario 3: Predator-Prey / Multi-Query Analysis

**Trisalyn also mentioned:** "I might want to pin my map of mountain lions AND bring up my map of deer to look at predator-prey interaction."

This means multiple filtered views on the same layer, toggleable independently.

**Is this a workflow you'd use?**
- [ ] Yes — please describe a specific example: ___
- [ ] Maybe for certain analyses: ___
- [ ] No, not relevant to my work

**Query implications:**
- Need efficient per-species filtering
- Possibly need to serve two filtered results simultaneously
- Could benefit from species-indexed tables

---

#### Scenario 4: Biodiversity Analysis (Future Scope)

**Trisalyn mentioned (as a "maybe too in the weeds" idea):** Showing diversity metrics per camera — unique species count, or even a mini pie chart showing species proportions at each location.

**Is this useful to you?**
- [ ] Yes — I'd analyze camera locations by biodiversity
- [ ] Maybe, but lower priority than species-specific queries
- [ ] Not really

**Query this implies:**
```
SELECT camera_id, COUNT(DISTINCT species) as species_count
FROM images
GROUP BY camera_id
```

---

#### Scenario 5: Drill-Down to Single Camera

**When you click a specific camera and see its details, what do you need?**

| Info You Want | Query This Implies | Priority |
|---------------|--------------------|-----------------------------|
| All images (paginated gallery) | `SELECT * FROM images WHERE camera_id = X LIMIT 50` | |
| Images filtered by species | `SELECT * FROM images WHERE camera_id = X AND species = Y` | |
| Images filtered by date range | `SELECT * FROM images WHERE camera_id = X AND date BETWEEN A AND B` | |
| Activity timeline / heatmap | `COUNT images GROUP BY date WHERE camera_id = X` | |
| (other — please add) | | |

---

#### Open Questions for ANiML

1. **How many cameras are there total?** ___
2. **How many images per camera on average?** ___
3. **How many total images?** ___
4. **Are there existing indexes on `camera_id`, `species`, `date`?** ___

---

### Dendra Sensors

#### Scenario 1: Browsing Sensors

**When viewing the map of sensors, what summary info helps you decide which to explore?**

| Summary Info You Want | Query This Implies | Priority |
|-----------------------|--------------------|-----------------------------|
| Sensor type / what it measures | (likely already in feature attributes) | |
| Date range of data | `MIN/MAX timestamp WHERE sensor_id = X` | |
| Latest reading | `SELECT value WHERE sensor_id = X ORDER BY timestamp DESC LIMIT 1` | |
| Data completeness (gaps?) | More complex — data quality query | |
| (other — please add) | | |

---

#### Scenario 2: Time Series Drill-Down

**When viewing a specific sensor, what time ranges matter most?**

| Time Range | Your Use Case | Query Size Concern? |
|------------|---------------|---------------------|
| Last 7 days | Quick recent check | Probably fine |
| Last 30 days | Short-term trends | Probably fine |
| Last year | Seasonal patterns | May get large |
| All time | Historical analysis | Could be huge |

**What time aggregations would you want?**
- [ ] Raw data points
- [ ] Hourly averages
- [ ] Daily averages
- [ ] Weekly averages
- [ ] (other): ___

---

#### Scenario 3: Multi-Sensor Comparison

**Would you compare multiple sensors side-by-side?**
- [ ] Yes — same metric at different locations
- [ ] Yes — different metrics at same location
- [ ] No, I'd analyze sensors individually

**If yes, how many sensors at once?** ___

---

#### Open Questions for Dendra

1. **What's the data frequency?** (readings per hour/day) ___
2. **How much historical data per sensor?** ___
3. **Is pre-aggregated data available (daily/weekly averages)?** ___

---

### iNaturalist Observations

#### Scenario 1: Browsing Observations

**What groupings/summaries help you explore the observations layer?**

| Grouping | Useful? | Query This Implies |
|----------|---------|-------------------|
| By species/taxon | | `GROUP BY taxon_id` |
| By observer | | `GROUP BY observer_id` |
| By month/season | | `GROUP BY MONTH(date)` |
| By location cluster | | Spatial aggregation |
| (other) | | |

---

#### Scenario 2: Filters

**What filters are most important?**

| Filter | Priority | Query This Implies |
|--------|----------|-------------------|
| Species/taxon | | `WHERE taxon_id = X` |
| Date range | | `WHERE date BETWEEN A AND B` |
| Research grade only | | `WHERE quality_grade = 'research'` |
| Has photo | | `WHERE photos IS NOT NULL` |
| (other) | | |

---

### DataOne Datasets

#### Scenario 1: Browsing Datasets

**What metadata helps you decide if a dataset is worth investigating?**

| Metadata Field | Priority | Notes |
|----------------|----------|-------|
| Title + description | | |
| Date range | | |
| Spatial extent | | |
| File types included | | |
| Size (MB/GB) | | |
| Keywords/tags | | |
| (other) | | |

---

#### Scenario 2: Dataset Detail View

**What level of preview is useful?**
- [ ] Just metadata — link to DataOne for actual files
- [ ] File list with sizes
- [ ] Spatial footprint preview on map
- [ ] Sample data preview (first few rows of CSV, etc.)

---

## Part 2: Performance Testing

> *Now that we've identified the queries implied by the wishlist features, let's test how fast they actually are today.*

### Instructions

1. Use the browser network tab or a tool like Postman
2. Run each query 3 times and note the average
3. Note the payload size (KB/MB)
4. Flag anything over 3 seconds as a concern
5. **Add any queries from Part 1 that aren't listed here**

---

### ANiML Queries

| Query | Use Case | Target Time | Actual Time | Payload Size | Notes |
|-------|----------|-------------|-------------|--------------|-------|
| Get all cameras (no images) | Initial layer load | <1s | | | |
| Get image count per camera | Summary badges on markers | <2s | | | |
| Get species breakdown per camera | Pie chart or species list per marker | <2s | | | |
| Filter cameras by species (e.g., has mountain lion) | Layer-level filter | <1s | | | |
| Get image count per camera for 1 species | Clustering view (Scenario 2) | <2s | | | |
| Get images for 1 camera, all time | Drill-down view | <2s | | | |
| Get images for 1 camera, filtered by species | Filtered drill-down | <1s | | | |
| Get distinct species count per camera | Biodiversity metric (Scenario 4) | <3s | | | |
| Current "load everything" query | What we do now | ? | **8-12s** | | Known problem |

**Analysis Questions:**

1. **What exactly makes the current query slow?**
   - [ ] Too many joins
   - [ ] No index on frequently filtered columns
   - [ ] Returning too much data (images blob, etc.)
   - [ ] Network latency
   - [ ] Other: ___

2. **Which columns should be indexed for common filter patterns?**
   - [ ] `camera_id` (for drill-down)
   - [ ] `species` (for species filtering)
   - [ ] `date` (for time filtering)
   - [ ] Compound index on `camera_id + species`?
   - [ ] Other: ___

3. **Could pre-computed aggregates help?**
   
   Example: A `camera_stats` table with columns:
   - `camera_id`
   - `total_images`
   - `species_counts` (JSON: `{"mountain lion": 23, "deer": 45, ...}`)
   - `date_min`, `date_max`
   
   Would this eliminate the slow aggregate queries? Y/N: ___

---

### Dendra Queries

| Query | Use Case | Target Time | Actual Time | Payload Size | Notes |
|-------|----------|-------------|-------------|--------------|-------|
| Get all sensors | Initial layer load | <1s | | | |
| Get latest reading per sensor | Summary badges | <1s | | | |
| Get datastream for 1 sensor (7 days) | Quick view | <1s | | | |
| Get datastream for 1 sensor (30 days) | Short-term trends | <1s | | | |
| Get datastream for 1 sensor (1 year) | Seasonal patterns | <2s | | | |
| Get datastream for 1 sensor (all time) | Full history | <5s | | | |
| Get daily averages for 1 sensor (1 year) | Aggregated view | <1s | | | |

**Analysis Questions:**

1. **Is pre-aggregated data (hourly/daily averages) already available?** Y/N: ___
2. **If not, would creating aggregate tables be feasible?** ___
3. **What's the max data points we'd ever need to return for a chart?** ___

---

### iNaturalist Queries

| Query | Use Case | Target Time | Actual Time | Payload Size | Notes |
|-------|----------|-------------|-------------|--------------|-------|
| Get all observations (points only) | Initial layer load | <2s | | | |
| Get observations filtered by taxon | Taxon filter | <1s | | | |
| Get observations filtered by date range | Date filter | <1s | | | |
| Get single observation detail | Detail view | <500ms | | | |
| Get observation counts by taxon | Summary stats | <2s | | | |

---

### DataOne Queries

| Query | Use Case | Target Time | Actual Time | Payload Size | Notes |
|-------|----------|-------------|-------------|--------------|-------|
| Get all datasets (metadata only) | Initial layer load | <2s | | | |
| Search by keyword | Text search | <1s | | | |
| Filter by category | Category filter | <1s | | | |
| Get single dataset detail | Detail view | <500ms | | | |

---

## Part 3: Caching Discussion

Based on your performance testing, let's discuss caching needs.

### Questions

**Which queries are too slow for acceptable UX?**
- (list them)

**For slow queries, what's the bottleneck?**
- [ ] Network latency to ArcGIS/API
- [ ] Query complexity on the service
- [ ] Volume of data being returned
- [ ] Client-side processing after data arrives
- [ ] Other: ___

**Could any of these be solved with:**

| Solution | Applicable? | Notes |
|----------|-------------|-------|
| Smarter queries (fewer fields, pagination) | | |
| Pre-computed aggregates (nightly job) | | |
| Client-side caching (React Query) | | |
| Server-side caching (Redis/Table Storage) | | |
| Different data structure | | |

**If we need server-side caching, what's your comfort level building:**
- [ ] Azure Function that writes to Blob Storage
- [ ] Azure Function with Table Storage cache
- [ ] Azure Cache for Redis
- [ ] Other: ___

**Cost concerns - what's the budget constraint?**
- (your notes)

---

## Return Instructions

Please fill this out and either:
1. Commit it back to the repo, OR
2. Send it to Will directly

Timeline: Ideally by **Monday, January 27** so we can incorporate into development planning.

---

## Questions?

If any of this is unclear or you need more context, let Will know.

