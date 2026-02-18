# Digital Twin Future Vision Discussion

**Date:** February 11, 2026  
**Attendees:** Speaker 1 (Trisalyn?), Speaker 2 (Will), Speaker 3, Speaker 4 (Dan), Speaker 5, Speaker 6, Speaker 7 (Amy)  
**Topic:** Brainstorming interactive/predictive features for digital twin evolution  
**Context:** Looking ahead to March 2026 Jack Dangermond demo — what makes this a "digital twin" vs just a data catalog?

---

## Key Themes

### 1. Interactive + Predictive + Dynamic
- Current catalog shows **state** (static data layers)
- Dendra shows **process** (real-time data streams)
- Need to add **prediction** (modeling, scenarios)

### 2. Target Audience Reaffirmed
- **Primary:** Research community (NOT general public)
- **Use Cases:** 
  - Advanced researchers with GIS/Python skills → Jupyter notebooks
  - Curriculum/education (first-year GIS students) → interactive scenario tools
  - TNC staff (land management decisions)

### 3. Proposed Predictive Use Cases

#### A. Vegetation Growth & Invasive Species (Dan's pitch)
- **What:** Model vegetation growth patterns based on weather/climate scenarios
- **Why:** Inform fire fuel reduction, restoration planning
- **Data:** Remote sensing + foundational models (already have access)
- **Timeline:** Could be 6-month deliverable (not immediate)

**Example workflow:**
1. User selects climate scenario (El Niño, La Niña, drought)
2. Model predicts undergrowth accumulation by ecosystem
3. Highlights areas for fire management intervention

**Technical approach:** Remote sensing + GFMs (foundation models good at this)

#### B. Species Distribution Under Climate Change (Amy's pitch)
- **What:** Model which species can thrive at Dangermond under future climate
- **Why:** Translocation planning, conservation strategy
- **Data:** Already have models built (Amy's class data)
- **Key Question:** "What species should we be prepared to receive?"

**Example workflow:**
1. Select species + climate scenario + timeframe (early/mid/late century)
2. Model shows habitat suitability at Dangermond Preserve
3. Outputs: gaining richness vs losing richness

**Status:** Models already exist (Chelsea bioclim data, GBIF observations, rigorous cleaning scripts)

**Technical note:** Can likely be implemented as ArcGIS geoprocessing service (Dan suggests this could work in both Jupyter notebook AND UI widget)

#### C. Water Budget / Hydrology (Kelly's recurring pitch)
- **What:** Model groundwater storage, stream flows, water availability
- **Why:** Species management (fish populations), drought planning
- **Challenge:** Water modeling is the "easiest" from a physics perspective (pure physical models, no complex ecological interactions)

**Example workflow:**
1. Input: rainfall patterns, groundwater levels
2. Model: water budget over time
3. Output: stream flow predictions, impact on aquatic species

**Note:** This is what most existing "digital twins of nature" focus on (ocean, flooding)

---

## Technical Implementation Discussion

### Jupyter Notebook Integration
- **Purpose:** Support advanced researchers who want to do custom analysis
- **Status:** Not built yet, but high priority
- **Benefit:** Enables "anything goes" flexibility for technical users

### Geoprocessing Models
- Dan believes species distribution models could be published as ArcGIS geoprocessing services
- Would enable BOTH:
  - Widget-based UI (pick species, pick scenario, see result)
  - Jupyter notebook access (programmable)

### Geographic Extent Problem
- **Current scope:** Dangermond Preserve only
- **Problem for modeling:** Species distribution requires regional context (100+ miles)
  - Species moving INTO Dangermond from the north
  - Cannot model migration with preserve-only data
- **Proposed solution:** User-selectable extent toggle
  - "Just Dangermond" vs "Surrounding Region" vs "California Statewide"
  - Some data sources (GBIF, DataOne) can easily expand extent
  - Others (drone imagery, Dendra sensors) are preserve-specific

**Jack's stance (from October meeting):** He was "super jazzed" about Sophia's surrounding area data mining work. Clearly wants regional context.

---

## Survey Results Review (Amy shared)

**Key findings from 70 respondents:**

1. **Data access methods:** 
   - Most use spreadsheets + shapefiles (tabular + vector inputs)
   - Comfortable with GIS tools

2. **Decision-making priorities:**
   - Invasive species management
   - Restoration planning
   - Fire management
   - Stream flow / hydrology
   - Fauna / species planning

3. **User skill level:** 
   - Mostly "regular" GIS users (not beginners, not experts)
   - Want spatial analysis tools, not just data download

---

## Design Principles Discussion

### Generalizability vs Specificity
- **Challenge:** Need specific examples to prototype, but must build generalizable structure
- Will's guidance: "Depth-first, then extract patterns"
  - Come up with 20-30 specific research questions
  - Identify commonalities
  - Build flexible system that supports all of them

### Output Data Types
- **Rasters:** Most model outputs will be rasters (continuous surfaces)
- **Tabular:** Some outputs will be tables/spreadsheets
- **Vectors:** Few models will create new polygons/points

**Implication:** Can standardize visualization patterns by output type

### UI Complexity for Different User Levels
- **Advanced users:** Jupyter notebooks (full control)
- **Intermediate users:** Widget-based scenario tools (10-15 scenarios pre-built)
- **Beginners:** Educational widgets with guided workflows

---

## Action Items (Future Work)

1. **Expand digital catalog extent** (DFT item)
   - Add "surrounding region" toggle for GBIF, DataOne, other API-based sources
   - Document which data sources can/cannot expand beyond preserve

2. **Species distribution model integration** (6-month project)
   - Publish Amy's existing models as geoprocessing services
   - Build UI widget: species picker + climate scenario selector
   - Integrate with Jupyter notebooks

3. **Foundational models exploration**
   - Research use cases for GFMs (geospatial foundation models)
   - Focus on remote sensing applications (vegetation, land cover)

4. **Hackathon planning**
   - Host data hackathon AFTER catalog is stable (post-Feb 20)
   - Cash prizes to incentivize creative use cases
   - Will inform what predictive features to prioritize

5. **User research with Chad**
   - Schedule follow-up conversation
   - Get his input on "whiz-bang" interface ideas rooted in research goals

6. **Gemini analysis of survey responses**
   - Amy to run full survey through Gemini to extract patterns
   - Share structured summary with team

---

## Notes for Jack Dangermond Demo (March 2026)

### What Will Impress Him
- **Working features over perfect features** (breadth signals momentum)
- Multiple live data sources on one map (digital twin feel)
- Professional, polished UI (not a student project)
- Integration with ArcGIS ecosystem (he'll recognize good platform use)
- Movement toward predictive capability (even if early-stage)

### What Will NOT Impress Him
- Unfinished scaffolding with placeholder text
- Single data source working perfectly while others show nothing
- Over-designed micro-interactions on an app that can't show data yet
- Lots of design docs but nothing to click

### Calibration
Will's note: "We don't know exactly what will impress him. But 'working software that feels professional and shows multiple data sources on a map' is a safe bet."

---

## Deferred to v2.1+ (Future Enhancements)

- Species distribution modeling UI
- Vegetation growth prediction (invasive species tracking)
- Water budget modeling
- Jupyter notebook integration
- Expanded geographic extent (regional context)
- Hackathon-derived use cases

---

## Related Documents

- `docs/PLANNING/future-enhancements.md` — Backlog for v2.1+ features
- `docs/master-plan.md` — Current v2.0 scope and timeline
- Survey results spreadsheet (Amy to share cleaned version)
