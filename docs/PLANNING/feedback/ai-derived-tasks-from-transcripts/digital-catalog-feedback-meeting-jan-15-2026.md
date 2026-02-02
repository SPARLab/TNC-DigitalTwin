# Digital Catalog Feedback Meeting - January 15, 2026

**Meeting Date:** January 15, 2026  
**Duration:** ~2 hours  
**Participants:** Amy, Trisalyn, Dan, Wil  
**Purpose:** Honest feedback session on the current digital catalog with focus on identifying problems and exploring solutions

---

## Executive Summary

This meeting identified critical UX/UI issues with the current digital catalog. The **core problem** identified is:

### **The Siloing Effect** (Critical Issue)
The navigation paradigm forces users into isolated, narrow views. Once you select a category or data source, you're "funneled into a small room" and can't see across to other data. This prevents:
- Cross-referencing between data sources
- Maintaining multiple query contexts simultaneously  
- Browsing while keeping previous selections visible
- Comparing data layers from different categories

**This is the main complaint** - users feel trapped once they navigate into a specific view. Problems with cross-referencing, inability to save query contexts, and lack of persistent layer visibility are all symptoms of this core siloing issue.

### The Solution
Restructure the left sidebar to be a **persistent, hierarchical layer browser** with pinning functionality. This single change addresses the interconnected problems of siloing, cross-referencing, and query context preservation.

### Key Deadline
- **February 20, 2026:** Need a strong demo ready
- **March 2, 2026:** Present to Jack Dangermond at ESRI
- **PCI Research Symposium:** Need a version ready for public release

### Priority
The **left sidebar reorganization with dropdown/pinning** is the highest priority. This solves the core siloing issue. Custom data viewers (GBIF, MODIS) are lower priority and can be showcased as "coming soon."

---

## Major Problems Identified

### Core Issue: Problems #1, #2, #3 Are Interconnected

**Problems 1 (Siloed Navigation), 2 (No Cross-Referencing), and 3 (Limited Query Context) are all symptoms of the same underlying issue.** The current navigation paradigm forces users into isolated views where they lose access to the broader catalog. These three problems are addressed by the same solution: a persistent left sidebar with hierarchical browsing and pinning functionality.

---

### 1. **Siloed Navigation Paradigm** (CRITICAL - Core Issue)

**The Problem:**
- Selecting a category or data viewer locks you into that view
- Can't easily navigate back to see other data without losing context
- Once you're "in" a data source, you can't see what else is available
- Quote from Amy: "The way it's doing it is like cutting off that bigger picture thinking"
- Users describe feeling "funneled into a small room" with no visibility into other rooms

**Specific Examples:**
- When in Land Cover category and selecting iNaturalist, you only see plants in iNat
- But users want to see everything once they're in iNaturalist (animals, fungi, etc.)
- Can't see cross-domain interactions (e.g., animal-plant interactions)
- Navigation feels like a one-way street

**Impact:**
- Prevents exploratory thinking
- Forces users to back out and start over to see different data
- Kills the ability to compare and analyze across data sources
- Quote from Amy when describing the desired experience: "I'm boxed in. I can only look at Birds... that's an unnecessary step to me"

**This is the primary complaint from the meeting.** All navigation and discoverability issues stem from this siloing effect.

---

### 2. **No Cross-Referencing Between Data Sources** (CRITICAL - Directly Related to #1)

**The Problem:**
- Cannot pin layers from different data sources simultaneously
- When viewing iNaturalist data, cannot keep wildfire layer pinned from map layers
- Quote: "When I go to iNat, my wildfire is no longer pinned"
- Each data viewer creates a fresh slate

**What Users Need:**
- Ability to view multiple data sources together on the map
- Pin layers across different categories and data types
- Example use case: "Show me all iNaturalist plant observations within this burn scar"
- Want to overlay wildlife camera data with fire perimeter data

**Connection to Siloing:**
This problem exists because the current navigation forces you into isolated views. Once you navigate to a specific data source, previous layer selections are lost. Cross-referencing requires persistent layer visibility across navigation.

**Technical Challenge:**
- Different data sources have different filtering paradigms
- Time ranges mean different things in different contexts
  - Remote sensors: time range of actual data collection
  - DataOne: publication date of dataset
  - E-bird/iNaturalist: observation date

---

### 3. **Limited Ability to Save Query Context** (HIGH - Directly Related to #1)

**The Problem:**
- Users build complex queries in one data viewer (e.g., iNaturalist filtered for specific species and time range)
- If they navigate away or select another layer, they lose all that work
- Can't maintain multiple query contexts simultaneously

**What Users Want:**
- Query iNaturalist for plants
- Query Dendra for water sensor data
- See both results on map simultaneously with different filters applied
- Navigate between them without losing work
- Example: "I've got water sensor data and I have plant growth data. I can start to answer this question."

**Connection to Siloing:**
This is another symptom of the siloed navigation. Because each data viewer is isolated, switching to a different view means losing your previous query state. The solution (persistent left sidebar + right sidebar tabs) allows multiple query contexts to remain active.

---

### 4. **Hierarchical Organization Missing** (High)

**The Problem:**
- When you select a category or data type, results appear in alphabetical order only
- No grouping or collapsing of related items
- Hard to understand what belongs together (e.g., all freshwater layers, all infrastructure layers)

**Example:**
- Can't quickly see "what is freshwater?" or "what is infrastructure?" without scanning through alphabetical lists
- Related data layers aren't visually grouped

**Desired State:**
- Collapsible hierarchical structure
- Top-level categories that expand to reveal subcategories and specific layers
- Reference: USGS National Map viewer as example of good hierarchical organization

---

### 5. **Inconsistent and Confusing Filter Behavior** (High)

**The Problem:**
- Top-level filters (data category, spatial filter, time range) apply inconsistently
- Filters have different meanings depending on which data viewer you're in
- Quote from Dan: "Time range in remote sensors does not equal time range in e-bird"

**Examples:**
- Time filter in remote sensors = data collection period
- Time filter in DataOne = publication date
- Time filter in iNaturalist = observation date
- Users reported that changing time filters while in eBird or iNat didn't update results

**Confusion:**
- Is the filter meant to be set first and locked in?
- Or should filters be dynamic and update results in real-time?
- Users unclear about filter behavior

---

### 6. **Poor Data Naming Conventions** (High Priority - But Separate Issue)

**The Problem:**
- Many layer names are cryptic and meaningless to users
- Examples:
  - "jcl1" instead of "Jalama Creek Sensor 1"
  - "CMT" instead of "Coho Marine Terminal"
  - "jldp_oh_[date]" for drone imagery
- Quote: "Nobody knows what jcl1 is right, like they know it's Jalama Creek, whatever sensor number one. But like, if you're Landing there, like, that's just, it's meaningless"

**Why It Matters:**
- Names are the first thing users see
- Bad names prevent discovery and understanding
- Will be even more critical when UI becomes more compact (less room for descriptions)

**Source of Problem:**
- Layers pulled from TNC's ArcGIS Hub with internal naming conventions
- DataOne datasets have inconsistent titles from data publishers
- Dendra sensors use codes instead of descriptive names

**Solution Path:**
- TNC needs to rename public-facing layers in ArcGIS Hub
- Sophia (TNC) is the key person to work with
- May need student help to rename hundreds of layers
- For custom layers (like camera traps), team has control over naming

---

### 7. **Category System Creates Many-to-Many Problems** (Medium)

**The Problem:**
- Data layers can belong to multiple categories
- Example: A freshwater frog survey belongs to both "Species" and "Freshwater"
- Current hierarchy forces data into single categories, making discovery hard
- Dropdown/nested structure breaks when items appear in multiple places

**The Challenge:**
Different people may have different ideas about primary categorization. If developers think "frogs = amphibians" but researchers primarily think "frogs = water-related," there's a mismatch in mental models.

**Current Tension:**
- Categories work well for TNC's parent organization structure
- But don't align with how Jack Dangermond and researchers think about data
- Quote from Amy: "This probably makes a ton of sense for TNC, because this is what their parent organization uses... this part does not make any sense to Jack"

**Proposed Resolution:**
- Assign one "primary category" to each layer for navigation hierarchy
- Keep additional categories as searchable tags
- Allow advanced search to filter by tags across all categories
- **Risk:** Primary category assignment requires understanding user mental models, not just organizational logic

---

### 8. **Missing Spatial Context** (Medium)

**The Problem:**
- Real-time sensors not showing up under "Freshwater" category when they should
- Some layers may not be properly categorized
- Land cover listed under "Soils and Geology" instead of its own category

**Specific Issues:**
- Categorization may be incomplete or incorrect
- Backend metadata issues preventing proper discovery
- Needs alignment between new data layers and catalog categories

---

### 9. **Limited Ability to Save Query Context** (Medium)

**The Problem:**
- Users build complex queries in one data viewer (e.g., iNaturalist filtered for specific species and time range)
- If they navigate away or select another layer, they lose all that work
- Can't maintain multiple query contexts simultaneously

**What Users Want:**
- Query iNaturalist for plants
- Query Dendra for water sensor data
- See both results on map simultaneously with different filters applied
- Navigate between them without losing work
- Example: "I've got water sensor data and I have plant growth data. I can start to answer this question."

---

### 10. **Data Viewers Take Too Much Screen Space** (Lower Priority UI Issue - Well Defined)

**The Problem:**
- Current iNaturalist viewer shows the same image three times (thumbnail, map, detail panel)
- Quote: "Information ratio is high. It's a lot of ink to give a little bit of information"
- Verbose cards take up space that could be used for more data
- Legend can overwhelm the screen

**Impact:**
- Less space for actual data exploration
- Harder to see multiple pieces of information at once
- Screen real estate not used efficiently

---

### 11. **"Clear Filters" Button Exits the Current Viewer** (Usability Issue)

**The Problem:**
- When using "Clear Filters" button, it exits you out of the current data viewer entirely
- Unexpected behavior - users expect clearing filters to reset the view, not navigate away
- Forces users to re-navigate back to where they were

**Expected Behavior:**
- Clear filters should reset filter state but keep user in the current data viewer
- Should not trigger navigation

---

### Additional Problems to Capture

The document now captures 11 major problems identified in the meeting. The transcript may contain additional smaller issues or nuances worth noting in specific implementation details.

---

## Proposed Solutions & Design Direction

### The Core Solution: Navigation Paradigm Shift

**Critical Insight:** Problems 1, 2, and 3 (siloing, cross-referencing, query context) are all solved by the same fundamental change to the left sidebar navigation paradigm.

The meeting converged on restructuring how users navigate and interact with data layers:

#### **Left Sidebar: Persistent Layer Browser**

**Core Concept:**
- Left sidebar becomes a persistent, hierarchical layer browser
- Always visible, never changes based on selected data source
- Functions as an "exploration and layer search" interface

**Structure:**
```
Left Sidebar (Always Visible)
├── Category 1 (collapsible)
│   ├── Layer A
│   ├── Layer B
│   └── Subcategory (collapsible)
│       ├── Layer C
│       └── Layer D
├── Category 2 (collapsible)
│   ├── Layer E
│   └── Layer F
└── [Advanced Search Button]
```

**Key Features:**
- Hierarchical dropdown structure (inspired by USGS National Map viewer)
- All ~82 ArcGIS layers visible in organized structure
- Each layer has eye icon for pinning/visibility toggle
- No second view - everything happens in this one sidebar
- Quote from Amy: "I want all this to happen over here so that I can always see all my layers"

**User Flow:**
1. Land on catalog with all categories collapsed or showing top-level view
2. Expand "Species" category → see iNaturalist, eBird, Cal Flora, GBIF
3. Click eye icon to pin iNaturalist layer to map
4. Expand "Fire" category without leaving iNaturalist
5. Click eye icon to pin fire perimeter layer
6. Both layers now visible and comparable on map

**Benefits:**
- **Solves Siloing (Problem 1):** Always see full catalog structure, never trapped in a narrow view
- **Enables Cross-Referencing (Problem 2):** Pin multiple layers from different categories simultaneously
- **Preserves Query Context (Problem 3):** Pinned layers and queries stay active while browsing
- **Supports Hierarchical Organization (Problem 4):** Collapsible categories and subcategories
- Discovery-friendly: browse before committing to a data source

---

#### **Right Sidebar: Detailed Views and Custom Experiences**

**Core Concept:**
- Right sidebar shows details about selected layer(s)
- Contains custom data viewers as tabs when applicable
- Responsible for data-specific filtering and downloads

**Tab System:**
```
Right Sidebar Tabs (context-dependent)
├── [Layer Details Tab] (always present)
│   ├── Title, description, metadata
│   ├── Tags and categories
│   ├── Download options
│   └── "Explore Deeper" button (if custom viewer available)
├── [iNaturalist Explorer] (opens when requested)
│   ├── Species search and filters
│   ├── Observation list
│   ├── Download custom query
│   └── All current iNat viewer functionality
├── [Dendra Data Viewer] (opens when requested)
│   └── Time series charts, station selection, etc.
```

**Behavior:**
- Default tab: Layer Details (title, summary, tags, download)
- Click "Explore Deeper" for data sources with custom viewers
- New tab opens with specialized interface (iNat species search, Dendra time series, etc.)
- **Tabs persist** - can have multiple query tabs open simultaneously (solving Problem 3)
- Switch between tabs without losing work
- X button to close tabs when done

**Examples:**
- Select iNaturalist layer → see basic layer info in default tab
- Click "Search Individual Species" button
- Opens "iNaturalist Explorer" tab with all filtering options
- Can go back to layer list, select Fire Perimeter layer
- Fire layer details show in default tab
- **iNaturalist Explorer tab still available** - query preserved
- Can have queries for both iNat and Dendra open simultaneously (solving Problem 3)

**This tab system solves Problem 3:** Multiple query contexts can be maintained and switched between without losing work.

---

#### **Advanced Search Option**

**Purpose:**
- For users who want more sophisticated filtering across all data
- Filter by multiple tags, keywords, data types
- Not the default landing experience

**Access:**
- Button in left sidebar: "Advanced Search" or "Filter Layers"
- Opens new view mode in left sidebar

**Features:**
- Text search across all layers
- Multi-select category filters
- Tag filtering
- Results list with pagination
- Returns to standard hierarchical view when cleared

**Philosophy:**
- Don't force exploration users into search mode
- Make search available when users have specific criteria
- Keep visual browsing as primary mode

---

### Sub-Header Changes

**Current State:**
- Sub-header contains: Data Category, Spatial Filter, Time Range
- These filters appear on every page
- Filters mean different things in different contexts

**Proposed Change:**
- **Remove global sub-header filters** (or significantly reduce scope)
- Move category filtering into left sidebar structure
- Move data-specific filters (time range, spatial, species, etc.) into right sidebar tabs
- Each custom data viewer can have its own appropriate filters
- Makes it clear that filters apply to the specific selected layer, not globally

**Rationale:**
- Eliminates confusion about what filters apply to
- Time range can mean different things for different data sources
- Spatial filters are more meaningful in context of specific queries
- Category is now the navigation structure itself

---

### Pinning & Layer Management

**This solves Problems 1, 2, and 3 together:**
- Problem 1 (Siloing): Pinned layers stay visible while navigating
- Problem 2 (Cross-Referencing): Can pin layers from different data sources
- Problem 3 (Query Context): Pinned layers maintain their query state

**Requirements:**
1. Pin multiple layers from different categories simultaneously
2. See what layers are currently pinned
3. Unpin layers individually or all at once
4. Layers stay pinned when navigating catalog

**UI Approach:**
- Eye icon in left sidebar = pin/unpin toggle (standard GIS convention)
- Pinned layers stay visible when selecting other layers
- Order in left sidebar stays consistent (don't reorder based on pinned status)
- Quote from Amy: "Let people get familiar with how it's ordered, so they quickly know okay, I want to turn on the fire layer, that's three from the bottom"

**Layer Legend Widget:**
- Compact widget on map showing pinned layers
- Click to expand and see full legend for each pinned layer
- Unpin button for each layer
- "Clear all" option
- May float on map or be collapsible panel

**Challenges to Solve:**
- How to handle multiple layers with different time ranges?
- Answer: "Let the user decide" - don't force alignment
- Quote: "We often have to make those decisions about, like, our imagery doesn't line up with when field sampling was done... we have to let the user decide"

---

### Dendra-Specific Changes

**Current Problem:**
- Dendra appears as one monolithic data source
- Actually represents many different sensor types
- Each sensor type has multiple stations
- Interface shows all individual sensors, which is overwhelming

**Proposed Solution:**
- Break Dendra into specific feature services by sensor type:
  - Rainfall gauges
  - Water quality sensors  
  - Temperature sensors
  - Wind sensors
  - Etc. (~10-15 different layer types)
- Each becomes its own layer in the catalog hierarchy

**User Experience:**
- User selects "Rainfall Sensors" layer from catalog
- Right sidebar shows rainfall sensor details
- "Explore Time Series Data" button opens custom Dendra viewer tab
- Viewer shows: 
  - All rainfall stations on map
  - Multi-line time series chart (one line per station)
  - Dropdown to filter to specific stations
  - Option to see all stations or subset

**Philosophy:**
- Start with sensor type (what's being measured)
- Then drill down to specific stations if needed
- Don't force users to care about individual stations first
- Quote from Dan: "I don't care about a particular station, I care about the network of stations contributing to a single measurement"

---

### Species Data Consolidation (Future Enhancement)

**Discussion Point:**
- Currently: iNaturalist, eBird, Cal Flora, GBIF are separate
- All are point-based species observation data
- Question: Should they be consolidated into one master database?

**Proposed Approach:**
- Create unified species observation table
- Include source attribution for each record
- Show overlaps and cross-references
- Example: "10 records from GBIF, 2 of those cross-reference with iNat, 1 is in eBird"

**Benefits:**
- Users can see all species data in one view
- Understand which databases have what data
- Download all at once if desired
- Compare coverage across sources

**Status:** Discussion item for future, not immediate priority

---

### Category System Resolution

**The Decision:**
- Every layer gets ONE primary category for navigation structure
- Additional categories become searchable tags
- Left sidebar navigation uses primary categories only
- Advanced search can filter across all tags

**Implementation:**
```
Example Layer: "Freshwater Frog Survey"
├── Primary Category: Species (shows up in Species dropdown)
├── Tags: freshwater, amphibians, survey, ecology
└── Searchable by: all tags + primary category
```

**Benefits:**
- Clean navigation hierarchy (no duplicate listings)
- Still discoverable via multiple pathways
- Tags preserve TNC's existing categorization work
- Aligns with researcher mental models

**Work Required:**
- Review all 82 layers
- Assign primary category to each
- Existing category tags remain as secondary tags
- May need to create custom navigation categories that differ from TNC's system

---

## Timeline & Priorities

### Critical Path (By February 20, 2026)

**Priority 1: Left Sidebar Redesign**
- Hierarchical category structure
- Collapsible dropdowns  
- Persistent layer browser
- Eye icon pin/unpin functionality
- This is "intuitively how everyone in our field wants to look at data"

**Priority 2: Cross-Referencing**
- Pin layers from multiple categories
- Layers stay pinned across navigation
- Basic legend widget showing pinned layers

**Priority 3: Data Naming**
- Work with TNC (Sophia) to rename cryptic layer names
- Offer student help if needed
- Critical for demo quality

**Lower Priority (Demo as "Coming Soon"):**
- GBIF and MODIS custom viewers
- Can show these as discoverable in catalog
- Explain: "We've done this with iNaturalist, and GBIF/MODIS will work similarly"

### Development Approach

**Phase 1: Mockups with Dummy Data**
- Create high-fidelity mockups showing new paradigm
- Use dummy data for quick iteration
- Get feedback and refine before implementing
- Target: Can show compelling vision to Jack Dangermond

**Phase 2: Implementation**
- Real data integration
- May have partial functionality at demo time
- Some data sources work, others in progress
- "If we continue getting funding, we'll complete X, Y, Z"

**Fallback Plan:**
- Keep current working catalog as backup
- Show both versions: "This is live now, this is where we're going"
- Demonstrate all the hard backend work is done
- Show mockups prove UI is the final piece

**Quote from meeting:** "If we can get the left sidebar stuff, that sounds so much better than what he has has. So we have both right... save a copy of this somewhere else... if we're not there yet, show an example of like, this is the data viewer for iNat, and this is what we're envisioning... all of this functionality's already been built, we just need to bring it into this side."

---

## Key Quotes & Context

### On Jack Dangermond's Expectations
- "His tolerance for things taking longer than he thinks they should has shrunk in recent years"
- "He's gotten grumpier about the progress we make"
- "He's been pulling back his money from people that he has decided aren't hitting what he thinks they should be hitting"
- **Stakes:** Need to show strong progress to maintain funding

### On Current Problems
- Amy: "The catalog is really well set up for people that know exactly what they want... but most people like aren't quite at that stage. They're like in this exploratory, like, what do you have"
- Amy: "When I go to land cover and then I click on the iNat... I only see plants in iNat... but once they're in iNat, like they probably want to be able to see everything"
- Amy: "Information ratio is high. It's a lot of ink to give a little bit of information" (referring to redundant display)

### On Desired Experience  
- Amy: "I want this to be a discovery platform"
- Amy: "I want all this to happen over here so that I can always see all my layers. And oh, look at all those birds. I wonder if that one's in the burn scar... and I just go to the right, and I turn on the burn scar"
- Dan: "I just want to be able to find the data sets I'm interested, download, and then I take it to my IDE or my own arcgis Pro"

### On Navigation Philosophy
- Amy on siloing: "I'm boxed in. I can only look at Birds... that's an unnecessary step to me"
- On pinning: "Once you hit the eye, it's on until you hit the eye off"
- On overwhelm: "I'm going to overwhelm myself, but I'm making the decision"

---

## Technical Challenges to Address

### 1. Screen Real Estate Management
- How to compress current left sidebar functionality into right sidebar?
- Especially challenging for data sources with many filters (iNaturalist species search, observation lists, etc.)
- Solution direction: Collapsible sections, dropdown menus, nested tabs

### 2. Multi-Layer State Management
- Tracking multiple pinned layers with different queries
- Each layer might have different:
  - Time ranges
  - Spatial filters  
  - Species filters
  - Display settings
- Need to preserve state when switching between layers

### 3. Legend Complexity
- Multiple pinned layers = multiple legends
- Screen space limited
- Need collapsible/expandable legend widget
- May need to handle overlapping legends gracefully

### 4. Consistent vs. Custom Filters
- General principle: Filters should be context-specific
- But some consistency needed for usability
- Balance between specialized functionality and predictable behavior

### 5. Tab Management in Right Sidebar
- How many tabs can be open simultaneously?
- How to indicate which tabs are active?
- Need clear visual design for tab switching
- X to close tabs vs. persisting tabs

### 6. Performance with Many Layers
- 82+ layers in catalog, potentially more with DataOne
- Need efficient rendering of hierarchical structure
- Pagination vs. infinite scroll for large result sets
- Lazy loading of layer details

### 7. Mobile/Responsive Considerations
- This paradigm is desktop-first
- How does it work on tablets/mobile?
- May need different approach for small screens
- Note: Current UI already has responsive design issues flagged

---

## Open Questions & Design Decisions Needed

### Left Sidebar
1. Should all categories be collapsed by default, or show some expanded?
2. How many levels of nesting are acceptable?
3. Should we show layer count in category headers? (e.g., "Species (12)")
4. Text search in left sidebar or only in advanced search mode?
5. How to indicate which layers are currently pinned in the hierarchical view?

### Right Sidebar  
1. What's the minimum information needed in default "Layer Details" tab?
2. Should tabs auto-close when you select a new layer, or persist?
3. How to indicate relationship between selected layer and open tabs?
4. Should there be a max number of open tabs?
5. Standard name for "drill down" button? ("Explore Deeper," "Search Records," "View Details," etc.)

### Pinning & Legends
1. Where exactly should legend widget live? (floating, docked, collapsible panel?)
2. Show mini-legends in left sidebar next to pinned layers?
3. Should pinning a layer automatically make it active/selected in right sidebar?
4. Visual treatment for pinned vs. unpinned in left sidebar?

### Advanced Search
1. What filters should be available in advanced search?
2. Should it be a modal, a view mode in left sidebar, or a separate page?
3. How to make it clear you're in advanced search vs. browsing mode?
4. Should advanced search results still show hierarchy, or flat list?

### Categories & Tags
1. Who decides the primary category for each layer?
2. What are the top-level categories for navigation? (Use TNC's or create new ones?)
3. How to handle layers that truly don't fit existing categories?
4. Should sub-categories be standardized or flexible?

### DataOne Integration
1. How to handle DataOne's non-spatial data in this paradigm?
2. Should it be a separate section in left sidebar?
3. Does it get same treatment as spatial layers, or different UI?
4. ~1,000 DataOne datasets - how to make discoverable without overwhelming?

---

## Summary: How the Solutions Map to Problems

### Single Solution, Multiple Problems Solved

**The Left Sidebar with Dropdown + Pinning Functionality solves:**
1. ✅ **Problem 1 - Siloed Navigation:** Persistent sidebar means you're never locked into a narrow view
2. ✅ **Problem 2 - No Cross-Referencing:** Pinning allows multiple layers from different sources to be visible simultaneously  
3. ✅ **Problem 3 - Limited Query Context:** Right sidebar tabs preserve query states while you navigate
4. ✅ **Problem 4 - Hierarchical Organization:** Dropdown categories and subcategories provide the needed structure

**Additional Problems Requiring Separate Solutions:**
- **Problem 5 - Inconsistent Filters:** Addressed by moving filters from global sub-header to data-specific right sidebar
- **Problem 6 - Poor Naming:** Requires coordination with TNC (Sophia) to rename layers
- **Problem 7 - Many-to-Many Categories:** Addressed by primary category + tags system
- **Problem 8 - Missing Spatial Context:** Backend categorization fixes needed
- **Problem 9 - ~~Limited Query Context~~:** (Already solved by left sidebar solution - see Problems 1-3)
- **Problem 10 - Screen Space:** Addressed by right sidebar compression and collapsible elements
- **Problem 11 - Clear Filters Button:** Fix button behavior to reset filters without navigation

### Developer Note

Problems 1, 2, and 3 emerged as the critical interconnected issues in the meeting. While initially presented as separate concerns, they're all manifestations of the same navigation paradigm problem. The left sidebar redesign with hierarchical dropdowns and pinning is the core architectural change that addresses the fundamental complaint: **users feel trapped and can't maintain visibility across the catalog while exploring specific data sources.**

The solution isn't just about making things "more organized" - it's about fundamentally changing the interaction model from "navigate into isolated rooms" to "browse a persistent catalog while pinning items of interest."

---

## Meeting Outcomes & Next Steps

### Decisions Made
1. **Prioritize left sidebar redesign over new data viewers**
2. **Focus on cross-referencing/pinning functionality**  
3. **Work with TNC (Sophia) on data naming**
4. **Pause or reduce Diocese project work to focus on digital catalog**
5. **Use mockups with dummy data for rapid iteration**
6. **Keep current version as backup for demo**

### Action Items

**Wil:**
- Transcribe meeting and create problem summary document ✓
- Create mockups of new left sidebar paradigm
- Mock up right sidebar tab system
- Mock up iNaturalist custom viewer in right sidebar
- Show what advanced search would look like

**Dan:**
- Help with front-end development (bandwidth available)
- Think through technical implementation of new paradigm
- Plan Dendra restructuring (sensor-type based layers)

**Amy & Tristan:**
- Review and refine problem document
- Provide feedback on mockups
- Coordinate with TNC (Sophia) on naming issues
- Available for rapid iteration meetings

**TNC Coordination:**
- Share broad feedback with TNC: "Search on the right isn't easy enough, we're rethinking it"
- Request layer renaming help
- Don't go into full 2-hour detail with 15-person team (too many voices, tight timeline)
- Quote: "History has shown that sometimes their decisions on what this should look like have not landed with Jack"

### Follow-Up Meetings
- Plan to meet Monday/Wednesday of following week (after MLK Day)
- Continue feedback sessions through next few Mondays
- Focus work time on catalog, use meeting time to align
- UCSB-TNC aggregators meeting still needed (for naming discussion)

---

## Strategic Context

### Why This Matters
- Jack Dangermond (ESRI founder) is primary funder
- March 2026 meeting is critical for continued funding
- Digital catalog is foundation for broader Digital Twin vision
- Two development tracks after catalog complete:
  1. Enhanced user interface and interactive analysis (Wil)
  2. Foundation models and simulation (Dan)

### Vision Statement (from meeting)
> "Here we have a data catalog. Here's your GIS. This is the first phase of your research bench. And based on this GIS research bench, we are now moving into digital twin territory."

### Success Criteria
- Jack Dangermond is impressed and excited
- Researchers can discover data easily
- Cross-referencing works smoothly
- Professional, polished appearance
- Clear vision for next phases
- Demonstrates all backend work is complete

### Risk Mitigation
- Don't over-promise on timeline
- Have backup (current version) to show
- Show mockups to prove concept even if not fully implemented
- Demonstrate completed functionality (data viewers for iNat/eBird/CalFlora)
- Frame remaining work as "next 6-8 weeks" of refinement

---

## Appendix: Meeting Metadata

**Recording:** Audio recording on Wil's phone  
**Format:** Transcribed from Otter.ai transcript  
**Meeting Style:** Working session with screen sharing  
**Examples Referenced:** USGS National Map viewer, ArcGIS Pro interface  
**Visual Aids:** Whiteboard sketching of interface ideas  

**Tone:** Collaborative, honest feedback, solution-oriented  
**Key Dynamic:** Amy and Tristan as primary users/researchers, Dan and Wil as developers, all contributing to design

**Follow-Up Documentation Needed:**
- Visual mockups of proposed interface
- Technical implementation plan  
- Detailed timeline with milestones
- Category structure proposal
- Layer naming standards document
