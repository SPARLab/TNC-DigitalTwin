# Future Enhancements & Feature Backlog

**Purpose:** Track feature requests and enhancements that are out of scope for v2.0 but worth considering for future versions (v2.1+, v3.0, etc.)

**How to use this doc:**
- Features deferred during v2.0 planning get moved here
- Each item retains its DFT-XXX ID for traceability
- Items can be promoted to active development when planning future versions
- This is a *backlog*, not a commitment — features here may never ship

**Status Legend:**
- 🔮 Future — Interesting idea, not prioritized
- 🎯 Planned — Scheduled for a specific future version
- 🔍 Under Review — Being evaluated for inclusion
- ❌ Rejected — Decided not to pursue

**Last Updated:** February 11, 2026

---

## Queued for v2.1

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| DFT-014 | Biodiversity aggregation queries | Low | 🔮 Future | Species counts and proportions per camera trap |
| - | Jupyter Notebook Integration | High | 🔍 Under Review | Connect catalog to Jupyter for advanced users (Python/GIS-savvy researchers) |
| - | Expanded Geographic Extent Toggle | Medium | 🔍 Under Review | User-selectable extent (Preserve / Regional / California) for GBIF, DataOne |
| - | Mobile/Tablet Responsiveness | Medium | 🔮 Future | Deferred from v2.0 (DFT-016) — minimum 1280px viewport required for now |
| - | ~~Widget Terminology Refinement~~ | ~~Medium~~ | ✅ Resolved | Saved Items widget dropped; "Mapped Item Layers" renamed to "Map Layers" (DFT-046) |

---

## Longer-Term Ideas (v3.0+)

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| - | Species Distribution Modeling UI | High | 🔮 Future | Climate scenario picker + species selector, powered by Amy's existing models |
| - | Vegetation Growth Prediction | High | 🔮 Future | Remote sensing + GFMs to model undergrowth, inform fire management |
| - | Water Budget Modeling | Medium | 🔮 Future | Groundwater storage, stream flows, drought planning |
| - | Data Hackathon | Medium | 🎯 Planned | Post-Feb 20, cash prizes, inform future feature priorities |
| - | Bidirectional Map ↔ Widget Highlighting | Low | 🔮 Future | Click map feature → highlight in widget (complement to DFT-036) |
| - | Edge Indicators for Off-Screen Features | Low | 🔮 Future | Directional arrows at screen edge (complement to DFT-036) |

---

## Rejected / Won't Do

| ID | Feature | Reason | Date Rejected |
|----|---------|--------|---------------|
| - | - | - | - |

---

## Detailed Feature Descriptions

### DFT-014: Biodiversity/Aggregation Queries

**Category:** Feature Request  
**Priority:** Low  
**Status:** 🔮 Future  
**Source:** Trisalyn Nelson, Jan 26, 2026  
**Deferred From:** v2.0 planning

**Description:**
> Want to analyze diversity of species per camera trap location:
> - "Are there some where almost all the species are mountain lions?"
> - Unique species count per camera
> - Pie chart symbols showing proportion of each species

**Potential Visualizations:**
1. Simple count badge: "5 species" on each camera icon
2. Proportional pie chart at each location (like bike map hazard breakdown)
3. Heat map of biodiversity index

**Why Deferred:**
- Trisalyn acknowledged this may be "too in the weeds" for v2.0 scope
- Adds significant complexity to map visualization layer
- Requires aggregation queries that don't exist in current data services
- v2.0 focus is on establishing the core paradigm (pin/filter/export)

**Future Considerations:**
- Related to DFT-012 (camera trap clustering) — could extend badge design
- Related to DFT-013 (multiple filtered views) — might enable comparison workflows
- Useful for understanding researcher workflows and informing query architecture

**Estimated Effort:** Medium-High (requires backend aggregation support + new map symbology)

---

### Jupyter Notebook Integration

**Category:** Feature Request  
**Priority:** High  
**Status:** 🔍 Under Review  
**Source:** Feb 11, 2026 meeting — Digital Twin Future Vision  
**Deferred From:** v2.0 planning

**Description:**
> Connect the digital catalog to Jupyter notebooks so advanced users (Python/GIS-savvy researchers) can perform custom analyses on Dangermond data.

**Key Capabilities:**
- Programmatic access to all data sources
- Custom queries and aggregations
- Integration with scientific Python stack (pandas, geopandas, numpy, matplotlib)
- Publish custom geoprocessing models back to catalog

**Why Important:**
- Enables "anything goes" flexibility for technical researchers
- Aligns with target audience (DFT-011: academic researchers, TNC staff)
- Complements widget-based UI for less technical users

**Technical Notes:**
- Dan suggests ArcGIS geoprocessing services could bridge UI ↔ Jupyter
- Example: Species distribution models callable from both environments

**Estimated Effort:** High (requires API development, authentication, documentation)

---

### Expanded Geographic Extent Toggle

**Category:** Feature Request  
**Priority:** Medium  
**Status:** 🔍 Under Review  
**Source:** Feb 11, 2026 meeting — Digital Twin Future Vision  
**Deferred From:** v2.0 planning

**Description:**
> Allow users to expand data query extent beyond Dangermond Preserve boundaries for data sources that support it.

**User-Selectable Extents:**
1. **Dangermond Preserve Only** (default, current behavior)
2. **Surrounding Region** (~100 mile radius for species migration modeling)
3. **California Statewide** (for large-scale comparative studies)

**Which Data Sources Support Expansion:**
- ✅ GBIF (iNaturalist observations) — API accepts any bounding box
- ✅ DataOne (research datasets) — metadata catalog is global
- ❓ Dendra (environmental sensors) — depends on TNC network extent
- ❌ ANiML (camera traps) — preserve-specific deployments
- ❌ Drone Imagery — preserve-specific flights
- ❌ LiDAR — preserve-specific coverage

**Why Important:**
- **Species distribution modeling requires regional context** (species moving INTO Dangermond from north/south)
- Jack Dangermond was "super jazzed" about regional context in October meeting (Sophia's surrounding area data work)
- Enables translocation planning, climate migration studies

**Implementation Notes:**
- UI toggle in left sidebar or filter panel
- Clearly label which data sources support expanded extent
- Map viewport may need to zoom out to accommodate larger extent

**Estimated Effort:** Medium (API parameter changes, UI toggle, documentation)

---

### Species Distribution Modeling UI

**Category:** Predictive Modeling  
**Priority:** High  
**Status:** 🔮 Future  
**Source:** Feb 11, 2026 meeting — Amy's pitch  
**Deferred From:** v2.0 planning

**Description:**
> Interactive widget for exploring species habitat suitability under different climate scenarios.

**Existing Foundation:**
- Amy's class has already built species distribution models
- Models use Chelsea bioclim data + GBIF observations + rigorous cleaning scripts
- Covers early/mid/late century projections
- Multiple climate forcing scenarios (SSP1-2.6, SSP2-4.5, SSP5-8.5)

**Proposed User Workflow:**
1. Select species from dropdown (special status species in three-county area)
2. Select climate scenario (best case, mid case, worst case)
3. Select timeframe (early century, mid century, late century)
4. Click "Run Model" → see habitat suitability map
5. Toggle "Show Dangermond Preserve Boundary" to see overlap
6. Bookmark results, export raster for further analysis

**Key Research Questions:**
- Which species will Dangermond Preserve gain richness for?
- Which species will it lose richness for?
- Is Dangermond a good translocation target for species X?

**Technical Implementation:**
- Publish models as ArcGIS geoprocessing services
- Real-time execution if model runs are fast (<5 seconds)
- Pre-computed results if model runs are slow (cache all combinations)
- Dual interface: UI widget + Jupyter notebook

**Why High Priority:**
- Aligns with core research mission (conservation planning)
- Existing models = low lift to integrate
- Demonstrates "predictive digital twin" concept to Jack Dangermond

**Estimated Effort:** High (6-month project per team discussion)

---

### Vegetation Growth Prediction (Invasive Species)

**Category:** Predictive Modeling  
**Priority:** High  
**Status:** 🔮 Future  
**Source:** Feb 11, 2026 meeting — Dan's pitch  
**Deferred From:** v2.0 planning

**Description:**
> Model vegetation growth patterns based on weather/climate scenarios to inform fire management and restoration planning.

**Proposed User Workflow:**
1. Select climate scenario (El Niño, La Niña, normal rainfall, drought)
2. Select vegetation type / ecosystem (coastal sage scrub, oak woodland, grassland)
3. Select forecast period (current growing season, next year, 5-year projection)
4. Model predicts undergrowth accumulation, invasive species spread
5. Highlights areas for fire fuel reduction intervention

**Key Research Questions:**
- Which areas will have dangerous fuel loads by dry season?
- Where is mustard grass likely to expand given current rainfall patterns?
- What restoration actions are needed to prevent invasive spread?

**Technical Approach:**
- Remote sensing data (Sentinel-2, Landsat, drone imagery)
- Geospatial foundational models (GFMs) — pre-trained on remote sensing tasks
- Weather/climate inputs (NOAA, local weather stations)
- Validation against historical growth patterns

**Why High Priority:**
- Fire management is critical for preserve health
- Invasive species are short-term, observable changes (not 50-year projections)
- GFMs are mature enough for this use case
- Dan identified as "relatively straightforward" compared to water/species modeling

**Estimated Effort:** High (but Dan thinks 6-month deliverable is feasible)

---

### Water Budget Modeling

**Category:** Predictive Modeling  
**Priority:** Medium  
**Status:** 🔮 Future  
**Source:** Feb 11, 2026 meeting — Kelly's recurring pitch  
**Deferred From:** v2.0 planning

**Description:**
> Model groundwater storage, stream flows, and water availability to inform species management and drought planning.

**Proposed User Workflow:**
1. Input expected rainfall patterns (normal, drought, wet year)
2. Input current groundwater levels (from sensors)
3. Model predicts stream flows over time (weekly/monthly resolution)
4. Shows impact on aquatic species (fish populations, riparian habitat)
5. Alerts when stream levels drop below critical thresholds

**Key Research Questions:**
- If we stop getting rain by April, when do streams dry up?
- What happens to steelhead populations under different drought scenarios?
- Should we intervene with fish rescue operations?

**Why Kelly Advocates for This:**
- Water is the "easiest" modeling domain (pure physics, no ecological complexity)
- Most existing "digital twins of nature" focus on water (ocean, flooding)
- Critical for preserve management decisions

**Why Lower Priority:**
- Team consensus: water is "too easy" — not distinctive enough
- Species and vegetation modeling are more unique to Dangermond's role
- Water could be added later once other models are proven

**Estimated Effort:** High (requires hydrological modeling expertise)

---

### Data Hackathon

**Category:** User Engagement / Research  
**Priority:** Medium  
**Status:** 🎯 Planned  
**Source:** Feb 11, 2026 meeting — Amy & Will discussion  
**Deferred From:** Post-v2.0

**Description:**
> Host a weekend hackathon where researchers compete to create the most interesting/useful analysis using the digital catalog.

**Timeline:** After Feb 20 (when catalog is stable)

**Structure:**
- 48-hour event (Friday evening → Sunday evening)
- Cash prizes (significant amounts to incentivize participation)
- Categories: Best visualization, Best scientific insight, Best tool/workflow
- Open to UCSB students, TNC staff, regional researchers

**Goals:**
1. Stress-test the catalog with real users
2. Discover unexpected use cases (inform future features)
3. Build community of practice around Dangermond data
4. Generate publicity / academic interest

**Requirements:**
- Catalog must be stable (no crashes during event)
- Will/Dan on-call for technical support (48-hour commitment)
- Clear judging criteria
- Data export must work flawlessly

**Notes:**
- Amy is enthusiastic about this idea
- Could be combined with in-person workshop (fly in remote participants?)
- Results could inform v2.1 feature priorities

**Estimated Effort:** Medium (event planning, logistics, prize funding)

---

### ~~Widget Terminology Refinement~~ — RESOLVED (DFT-046)

**Category:** UX Polish  
**Priority:** ~~Medium~~ → Resolved  
**Status:** ✅ Resolved  
**Source:** Feb 11, 2026 meeting — Dan's confusion about widget distinction  
**Resolution Date:** February 11, 2026

**Resolution:**
The Saved Items widget was dropped entirely. "Mapped Item Layers" was renamed to **"Map Layers"**. All saved state is unified into a single Map Layers widget. Individual items (cameras, datasets, observations) are saved as filtered views returning one result.

**What Happened:**
Dan's original confusion was validated by the full team — Trisalyn, Amy, and Dan all independently struggled with the two-widget concept. The distinction between "entity references" (bookmarks) and "saved queries" (filtered views) existed in the designer's mental model but not the users'.

**Key Design Principles at Play:**
- Conceptual Model Mismatch (Norman) — users had one category ("saved things"), UI imposed two
- Tesler's Law — separation moved complexity to the user
- Hick's Law — forced a categorization decision users didn't find meaningful

**See:** `docs/PLANNING/resolved-decisions/dft-046-resolution-summary.md`

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 11, 2026 | Added 6 new features from Digital Twin Future Vision meeting | Will + Claude |
| Feb 11, 2026 | ✅ Widget Terminology Refinement resolved: Saved Items dropped, "Mapped Item Layers" → "Map Layers" (DFT-046) | Will + Claude |
| Feb 11, 2026 | Added Widget Terminology Refinement based on Dan's UX feedback | Will + Claude |
| Feb 3, 2026 | Created future enhancements backlog | Will + Claude |
| Feb 3, 2026 | Moved DFT-014 from planning-task-tracker.md | Will + Claude |
