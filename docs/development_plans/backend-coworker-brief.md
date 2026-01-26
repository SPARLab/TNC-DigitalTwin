# Backend Coworker Brief: Data Source Requirements

**Created:** January 23, 2026  
**For:** Dan  
**Purpose:** Gather user requirements AND performance baselines for the V2 dashboard

---

## Overview

We're building a new dashboard layout with a significantly different UX paradigm. Before building the right sidebar for each data source, we need two things from you:

1. **User Wishlist:** As someone who will USE this dashboard for research, what do you want to see?
2. **Performance Testing:** Run queries against our feature services and tell us how fast they are.

Please fill out both sections for each data source.

---

## Part 1: User Wishlist

> *"For each data source below, imagine you're using the website to do actual research. What information, charts, and interactions would be most valuable to you?"*

### ANiML Camera Traps

**When browsing the camera list, what summary info helps you decide which cameras to look at?**
- (your answer)

**When looking at a specific camera, what do you need to see?**
- (your answer)

**What filters would help you find what you're looking for?**
- (your answer)

**How would you want to browse images? (grid? timeline? map clusters?)**
- (your answer)

**Any charts or visualizations that would be useful?**
- (your answer)

---

### Dendra Sensors

**What time aggregations matter most? (hourly, daily, weekly?)**
- (your answer)

**What summary stats per sensor are useful?**
- (your answer)

**Multi-sensor comparison - important or not? If yes, how?**
- (your answer)

**Any specific charts or visualizations?**
- (your answer)

---

### iNaturalist Observations

**What groupings/summaries help? (by species? by month? by observer?)**
- (your answer)

**Detail view for a single observation - what's essential?**
- (your answer)

**What filters are most important?**
- (your answer)

---

### DataOne Datasets

**What metadata fields help you decide if a dataset is useful?**
- (your answer)

**Spatial preview - how important?**
- (your answer)

**File preview - important, or just link to DataOne?**
- (your answer)

---

## Part 2: Performance Testing

> *"For each data source, please run test queries against our existing feature services and record the response times."*

### Instructions

1. Use the browser network tab or a tool like Postman
2. Run each query 3 times and note the average
3. Note the payload size (KB/MB)
4. Flag anything over 3 seconds as a concern

### ANiML Queries

| Query | Expected Use | Target Time | Actual Time | Payload Size | Notes |
|-------|--------------|-------------|-------------|--------------|-------|
| Get all cameras (no images) | Initial layer load | <1s | | | |
| Get all cameras + basic stats | Layer load with counts | <2s | | | |
| Get all tags for 1 camera | Camera detail view | <500ms | | | |
| Get images for 1 camera, all time | Drill-down (unfiltered) | <2s | | | |
| Get images for 1 camera, 1 species | Filtered drill-down | <1s | | | |
| Get summary counts by species (all cameras) | Global stats | <2s | | | |
| Current "load everything" query | What we do now | ? | **8-12s** | | This is the problem |

**What exactly makes the current query slow?**
- (your analysis)

**Could we defer image loading until drill-down?**
- Yes / No / Partially - explain:

**Would pre-computed summary counts eliminate the slow query?**
- Yes / No - explain:

---

### Dendra Queries

| Query | Expected Use | Target Time | Actual Time | Payload Size | Notes |
|-------|--------------|-------------|-------------|--------------|-------|
| Get all sensors | Initial layer load | <1s | | | |
| Get datastream for 1 sensor (1 week) | Recent data | <1s | | | |
| Get datastream for 1 sensor (1 month) | Short range | <1s | | | |
| Get datastream for 1 sensor (1 year) | Long range | <2s | | | |
| Get datastream for 1 sensor (all time) | Full history | <5s | | | |

**Any performance concerns?**
- (your notes)

---

### iNaturalist Queries

| Query | Expected Use | Target Time | Actual Time | Payload Size | Notes |
|-------|--------------|-------------|-------------|--------------|-------|
| Get all observations (no filter) | Initial layer load | <2s | | | |
| Get observations filtered by taxon | Taxon filter | <1s | | | |
| Get observations filtered by date range | Date filter | <1s | | | |
| Get single observation detail | Detail view | <500ms | | | |

**Any performance concerns?**
- (your notes)

---

### DataOne Queries

| Query | Expected Use | Target Time | Actual Time | Payload Size | Notes |
|-------|--------------|-------------|-------------|--------------|-------|
| Get all datasets (metadata only) | Initial layer load | <2s | | | |
| Search by keyword | Text search | <1s | | | |
| Filter by category | Category filter | <1s | | | |
| Get single dataset detail | Detail view | <500ms | | | |

**Any performance concerns?**
- (your notes)

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

