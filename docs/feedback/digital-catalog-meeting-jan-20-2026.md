# Digital Catalog Meeting Summary - January 20, 2026

## Meeting Overview
Discussion focused on integrating DataOne datasets into the new catalog paradigm and resolving categorization challenges. Key breakthrough: "saved queries" feature that transforms the catalog from a viewer into a research workspace.

---

## Core Discussion Points

### 1. **DataOne Integration Strategy** 🎯 *[PRIMARY FOCUS]*

**The Problem:** How to integrate 876+ DataOne research datasets into the new digital catalog without overwhelming users.

**Current Thinking:**
- DataOne as a **layer on the left sidebar** showing aggregate point locations (254+ datasets visible on map)
- Click the layer → opens **right sidebar "browse" view** with searchable/filterable dataset list
- Individual datasets can be **bookmarked** (not necessarily pinned to map since locations are often centroid approximations)
- Link out to DataOne for actual data download
- Display should be dynamic/zoom-dependent on map

**User Need:** Discoverability of archival research data, especially for grad students doing literature review

**Quote (Speaker 1):**
> "Making it discoverable, even if right now people aren't really like going there for that purpose... I think the purpose that, like, in this framework, data one solves is just like the intensity of research that's been done in sort of like the breadth and the depth and certain disciplines. And it's kind of your archival record of what's been done in many ways."

---

### 2. **Many-to-Many Categorization Problem**

**The Problem:** Some layers logically belong in multiple categories (e.g., "Wells" could be Infrastructure OR Freshwater)

**Use Case Example:**
- **Stewardship team:** Looks for wells under "Infrastructure" (permitting purposes)
- **Researcher:** Looks for wells under "Freshwater" (sensor data purposes)

**Decision:** **Allow strategic duplication** rather than forcing single categorization
- Minimize duplication but permit it when user mental models diverge
- When visibility toggled, all duplicates toggle together
- Avoid trying to control how users think about data

**Quote (Speaker 2):**
> "Instead of trying to force that user to think about that data, the way that we think about that data, we should just allow some situations for there to be layers where it shows up under multiple subcategories."

---

### 3. **Saved Queries / "Pinned Features" Concept** 💡 *[BREAKTHROUGH INNOVATION]*

**The Innovation:** Users can save filtered queries as **nested layers** under parent layers

**How It Works:**
- User queries iNaturalist for "rattlesnakes, 2020-2023" → saves query
- Appears as **nested layer** under "iNaturalist Observations" in the floating widget
- Can toggle parent layer vs. filtered query layer independently
- Users can name their saved queries (e.g., "Rattlesnakes Q1 2023")
- Can set custom symbology for saved queries
- Extends to **all layers, including DataOne datasets**

**Technical Implementation:**
- Saved as graphic layers or service references with custom queries
- Nested UI structure in left sidebar widget
- Each saved query can be viewed alongside or instead of full parent layer

**Benefits:**
- Transforms catalog into a true research workspace, not just a viewer
- Enables cross-referencing (e.g., "show me cameras where rattlesnakes were seen")
- Supports iterative research workflows
- Exportable as part of "shopping cart"

**Quote (Speaker 3):**
> "If I were Jack, I'd be happy with that because there's not really platforms that, like, get that deep into it... you're really like digging into the data. Adding subsets of the data onto the map and then looking at different data sets."

---

### 4. **Bookmark vs. Pin Distinction**

**Clarification of Concepts:**
- **Pin = layers** shown on map (currently in floating widget)
- **Bookmark/Saved Query = filtered features/datasets** for reference
- **Universal pin** vs. **filtered pin** distinction

**DataOne-Specific:**
- DataOne datasets get **bookmarked** (not pinned to map) since map locations are often centroid approximations or inaccurate
- Still want to save/reference datasets for download later
- Can view bookmarked datasets in a list/panel view

**Quote (Speaker 3):**
> "Being able to pin it. And just like... look at it alongside others, even if it's not on the map. Because, like these layers are not mapped at this point... but like being able to like reference it."

---

### 5. **Subcategory Question** 🤔

**The Uncertainty:** Do we even need subcategories?

**Current Status:**
- 81 layers in ArcGIS Hub
- Many have 2-3 categories assigned
- Unknown if flat category structure would be overwhelming

**Action Items:**
1. Dan to create **flat visualization** showing all 81 layers organized only by primary categories (allowing duplication)
2. Review whether any category becomes unwieldy without subcategorization
3. If flat structure works, skip subcategories entirely to reduce complexity
4. If categories are too crowded, implement subcategory system

**Decision Philosophy:**
> "Maybe it's just fine... And if it's fine, then why are we adding work for ourselves?" - Speaker 2

---

### 6. **UI Consistency Requirements**

**The Problem:** Previous version had inconsistent UI patterns across data types (layers vs. DataOne vs. Dendra)

**Consistency Requirements:**
- **Search bar location** must be consistent
  - Universal search: left sidebar (for finding layers)
  - Dataset-specific search: right sidebar (for filtering within a layer)
- **Action buttons** (download, add to cart, pin, bookmark) must appear in same screen positions regardless of data type
- **Navigation pattern:** Left sidebar always for layers; right sidebar always for dataset details/browsing

**Quote (Speaker 1):**
> "I think what was disjointing in this previous version was just like you had a different data type that you clicked. And then, like, what was displayed on the left and the right hand panel were different across the data types."

---

### 7. **Attribution & Metadata Display**

**Requirement:** Need clear attribution for all aggregated data sources (iNaturalist, eBird, CalFlora, etc.)

**Proposed Solution:**
- Add to **Overview tab** in right sidebar
- Include: credits, attribution, use limitations
- Can pull directly from ArcGIS API metadata
- Possibly a separate "Data Sources" tab/page listing all primary sources with citation info

**Quote (Speaker 1):**
> "Having some sort of like... an attribution page for all of the underlying data sources. So, being like... we have these species things, but you know, I naturalist data. Here's the original Source. Here's how you would cite it."

---

### 8. **Table-Based Categorization System** (Dan's Backend Work)

**System Architecture:**
- **Two-table system:**
  1. `hub_categories`: Defines categories and subcategories with unique IDs
  2. `dataset_assignments`: Maps each layer to category ID(s)
- Uses **ID-based references** (not string matching) to allow label changes without breaking assignments
- Display names can differ from source data names

**Workflow:**
1. Front-end queries tables to build left sidebar structure
2. New layers detected → check for categorization
3. If uncategorized → automated email alert to Sophia

**Concerns:**
- Requires manual categorization work (81+ layers)
- Need to validate table structure works on front-end before doing manual work
- Can use AI (Cursor/OpenAI) to auto-suggest categories, then manually review

**Status:**
- Tables built and ready
- Primary categories auto-assigned (alphabetically) as placeholder
- Awaiting front-end validation before finalizing categorization

---

### 9. **Dendra Data Restructuring**

**Current Status:**
- Dendra metadata tags ~99% complete
- Currently organized by station

**Planned Changes:**
- Will be **split by sensor type** (not by station)
- Estimated 5-6 new layers from current remote sensors layer
- May need new tag taxonomy to align with categorization system

---

### 10. **Timeline & Presentation Pressure**

**Context:**
- Team wants to "nail it" for **Jack Dangermond presentation**
- High urgency for next iteration
- Emphasis on honest, rapid feedback

**Deliverables:**
- Multiple HTML mockup options for DataOne integration
- Interactive prototypes (single HTML files, double-click to open)
- Test different variations of left/right sidebar integration

---

## Design Options to Mock Up

### Option A: DataOne Layer → Right Sidebar Browse
- Left sidebar: "DataOne Research Datasets" layer (shows 254+ points on map)
- Click layer → right sidebar shows browse/filter interface
- Right sidebar tabs: Overview | Browse | Export
- Browse tab: searchable list of datasets with filtering by category/keyword
- Click dataset → detail view in right sidebar

### Option B: Merged Left/Right Sidebar
- Combine current left sidebar (layers) with right sidebar (details) into single adaptive panel
- Two views: Layer List view vs. Dataset Browse view
- Toggle between views or use breadcrumb navigation

### Option C: Separate Bookmarks Widget
- Add third widget (below floating layers widget) for "Bookmarked Datasets"
- Keeps DataOne bookmarks separate from pinned map layers
- Could extend to other bookmarkable items

---

## Open Questions

1. **How to handle DataOne in Advanced Search?**
   - Should DataOne datasets appear in advanced search results alongside feature layers?
   - If yes, how to distinguish them visually?

2. **Saved Queries: Where do they live?**
   - Nested under parent layer in floating widget? ✓ (consensus)
   - Separate section?
   - How to indicate a layer has saved queries?

3. **Subcategories: Yes or No?**
   - Pending Dan's flat visualization
   - Decision gate before proceeding

4. **Export functionality scope:**
   - Export pinned layers only?
   - Export pinned layers + bookmarked datasets?
   - What format? (Links? Metadata? Downloads?)

---

## Next Steps (Priority Order)

1. **Speaker 2 (UI/UX):** Create 2-3 DataOne integration mockup variations (HTML prototypes)
2. **Dan (Backend):** Generate flat category visualization to test if subcategories needed
3. **Team:** Test if table-based system works on front-end before manual categorization begins
4. **Decision gate:** Subcategories yes/no based on flat visualization review
5. **Dan:** Finalize Dendra restructuring by sensor type

---

## Key Quotes & Insights

**On the many-to-many problem:**
> "We want to minimize the amount of duplication... but like allowing for it in some instances." - Speaker 2

**On saved queries innovation:**
> "What is a data set but a row within a table layer, right... What if we say, you know what? Like, you get to pin layers. You get to pin features if you will." - Speaker 2

**On DataOne's purpose:**
> "Making it discoverable... it's kind of your archival record of what's been done in many ways, like the project at the project level." - Speaker 1

**On keeping it simple:**
> "Maybe it's just fine... if it's fine, then why are we adding work for ourselves, or we're stressing ourselves out for something that we don't need to be stressed out about?" - Speaker 2

---

## Technical Considerations

**DataOne Integration:**
- Currently 876 datasets, shown as 254+ points (likely overlapping)
- Point locations may be inaccurate (centroids, preserve boundaries)
- No actual spatial rendering of data (it's in Excel, not shapefiles)
- Primary value: discoverability, not mapping

**Saved Queries Implementation:**
- ArcGIS JavaScript API supports graphic layers for custom queries
- Can reference services with custom query parameters
- Need UI for naming/managing saved queries
- Symbology customization per saved query

**Table System:**
- RESTful endpoints for category tables
- ID-based for flexibility
- Needs validation with front-end before Dan invests in manual categorization

---

## Meeting Participants
- **Speaker 1:** Amy (TNC team)
- **Speaker 2:** Will/Overby (UI/UX lead)
- **Speaker 3:** Dan (Backend/data management)
- **Additional:** Kelly, Sophia, Marin (TNC team members)

---

## Related Documents
- Previous feedback: `digital-catalog-feedback-meeting-jan-15-2026.md`
- Current mockup: `mockups/01-full-layout-overview.html`
- Development plan: TBD (to be created based on this summary)
