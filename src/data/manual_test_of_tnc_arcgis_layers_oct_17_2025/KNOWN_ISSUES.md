# Known Issues from Manual Testing (October 17, 2025)

This document catalogs all issues found during manual QA testing of 68 ArcGIS Feature Services and Image Services.

## Issue Categories

### Client-Side Fixes (We Can Fix)

#### ISSUE-1: Description Parsing - First Paragraph Omitted
**Priority**: P0 - Critical  
**Affected Layers**:
- CalFire Fire Hazard Severity Zones 2023
- California Historical Fire Perimeters
- Coastal and Marine Data

**Description**: Right sidebar description doesn't match the website description. The first paragraph is being omitted. In some cases, the right sidebar shows a different paragraph (e.g., second-to-last paragraph instead of the full description).

**Action**: Fix description parsing logic in `TNCArcGISDetailsSidebar.tsx` to include the complete description text.

---

#### ISSUE-2: Description HTML Parsing
**Priority**: P0 - Critical  
**Affected Layers**:
- Habitat Areas of Particular Concern

**Description**: Some layer descriptions contain HTML tags that need to be parsed/rendered properly.

**Action**: Add HTML sanitization and rendering for descriptions.

---

#### ISSUE-3: "Layer failed to load" Error Persistence
**Priority**: P0 - Critical  
**Affected Layers**:
- Point Conception Offshore Geology (and affects layer switching behavior)

**Description**: When a layer fails to load and user switches to a new layer, the "Layer failed to load" error message persists even though the new layer loads successfully.

**Action**: Clear error state when switching layers in `MapView.tsx`.

---

#### ISSUE-4: Base Layer Visibility - Satellite Imagery
**Priority**: P1 - High  
**Affected Layers**:
- Cattle Guards
- National Hydrography Dataset Plus High Resolution
- Sensitive Vegetation Communities
- Union Pacific Railroad
- jldp_oak_restoration_plantings_SURVEYJOIN_view-ACTIVE

**Description**: Many layers are hard to see on satellite imagery basemap. Features don't "pop" against the dark/busy satellite background. Need a light gray or white basemap option.

**Action**: Add basemap switcher or provide a light-colored alternative basemap for better feature visibility.

---

#### ISSUE-5: Boundary Layer Styling - Color Coordination
**Priority**: P2 - Medium  
**Affected Layers**:
- National Hydrography Dataset Plus High Resolution
- Major Watersheds (should be blue, not red)

**Description**: Dangermond Preserve boundary should be blue for water-related layers instead of white. Water-related layers should use blue color scheme.

**Action**: Implement conditional styling based on layer category in `MapView.tsx`.

---

#### ISSUE-6: Associated Tables Cannot Be Rendered
**Priority**: P1 - High  
**Affected Layers**:
- Groundwater Wells (Water Well Quality table)

**Description**: The "Water Well Quality" is an associated table, not a feature layer. We cannot draw it on the map. Need to handle associated tables differently.

**Action**: Detect associated tables and provide alternative UI (e.g., table view in sidebar instead of map rendering).

---

#### ISSUE-7: Zoom Level Suggestions
**Priority**: P2 - Medium  
**Affected Layers**:
- USA Weather Watches and Warnings

**Description**: Some layers have data outside the default view extent. Users should be prompted to zoom out to see features.

**Action**: Detect when layer extent is outside current view and show zoom suggestion UI.

---

#### ISSUE-8: Legend Labels Missing Units
**Priority**: P1 - High  
**Affected Layers**:
- FlamMap Burn Probability Based on 500 Random Ignitions

**Description**: Legend labels show numeric ranges without units (e.g., "0-2" with no indication of what's being measured).

**Action**: Enhance legend metadata parsing to include units from field information. Consider showing field name + units.

---

#### ISSUE-9: Legend Labels Unclear
**Priority**: P1 - High  
**Affected Layers**:
- Dibblee Geology (labels are unclear/cryptic)
- Dangermond Preserve Boundary (WGS) (label says "Wgs")
- Habitat Areas of Particular Concern (label says "Nationwide Hapc B")

**Description**: Legend labels are cryptic abbreviations or technical codes that don't help users understand the data.

**Action**: Attempt better metadata parsing. If source metadata is poor, document which layers need TNC to improve their metadata.

---

#### ISSUE-10: Layer Description UI Enhancement
**Priority**: P2 - Medium  
**Affected Layers**:
- Oak Restoration Areas (and multi-layer services)

**Description**: For Feature Services with multiple layers, users want to see both the full service description and individual layer descriptions.

**Action**: Add UI to show "Full Service Description" vs "Selected Layer Description" toggle.

---

#### ISSUE-11: Point Styling Issues
**Priority**: P2 - Medium  
**Affected Layers**:
- jldp_oak_restoration_plantings_SURVEYJOIN_view-ACTIVE

**Description**: Points are not styled correctly. Hard to see on the map.

**Action**: Review point symbol rendering logic in `MapView.tsx` for default styling.

---

#### ISSUE-12: Remove Boundary Layer Toggle
**Priority**: P2 - Medium  
**Affected Layers**:
- Coastal and Marine Data (and other services)

**Description**: Users want ability to temporarily hide the Dangermond Preserve boundary layer for better visibility of data layers.

**Action**: Add boundary layer toggle button in map controls.

---

### Server-Side Issues (Require TNC Fix)

#### ISSUE-13: Authentication Required
**Priority**: P0 - Critical (for detection)  
**Affected Layers**:
- USA Offshore Pipelines
- Chlorophyll-a
- USA Annual NLCD Land Cover

**Description**: These layers require authentication/login credentials. App should detect this and inform users gracefully rather than showing broken layers.

**Action**: 
1. Implement authentication detection in `tncArcGISService.ts`
2. Show user-friendly message: "This layer requires authentication"
3. Provide link to source if user has credentials

---

#### ISSUE-14: Server Errors
**Priority**: P3 - Low (not our issue)  
**Affected Layers**:
- Point Conception Offshore Geology

**Description**: Layer fails to load on TNC's server as well. This is a server-side issue.

**Action**: Detect server errors gracefully. Document and report to TNC.

---

#### ISSUE-15: Performance - Slow Loading
**Priority**: P1 - High (needs investigation)  
**Affected Layers**:
- NAIP 2005 1m California
- USA NLCD Land Cover

**Description**: These layers load slowly in our app but seem to load faster on ArcGIS's native viewer. May be a client implementation issue.

**Action**: 
1. Investigate our image service rendering approach
2. Compare with ArcGIS REST API best practices
3. Consider implementing progressive loading or tiling optimizations

---

#### ISSUE-16: Legend Filters Don't Work
**Priority**: P1 - High (needs investigation)  
**Affected Layers**:
- FlamMap Burn Probability Based on 500 Random Ignitions
- CalFire FRAP Fire Threat 2019 (filters marked as "No")

**Description**: Legend filter checkboxes don't properly filter map features.

**Action**: 
1. Investigate if this is metadata issue or implementation issue
2. Test filters with other layers to identify pattern
3. Fix filter logic in `LayerLegend.tsx` if client-side issue

---

### Enhancement Requests

#### ENHANCEMENT-1: Color Scheme Improvements
**Priority**: P3 - Low  
**Request**: Major Watersheds should use blue color (water = blue) instead of red.

**Action**: Implement category-based color theming system.

---

#### ENHANCEMENT-2: Time Component UI
**Priority**: P3 - Low  
**Affected Layers**:
- USA NLCD Land Cover (has time-enabled data)

**Description**: Some services have temporal data that could be visualized with a time slider.

**Action**: Research time-enabled services and consider implementing time slider UI for future enhancement.

---

## Issue Summary by Priority

**P0 - Critical (Must Fix Soon)**:
- ISSUE-1: Description parsing (first paragraph omitted)
- ISSUE-2: HTML description parsing
- ISSUE-3: Error message persistence
- ISSUE-13: Authentication detection

**P1 - High (Important)**:
- ISSUE-4: Base layer visibility
- ISSUE-6: Associated tables
- ISSUE-8: Legend labels missing units
- ISSUE-9: Legend labels unclear
- ISSUE-15: Performance investigation
- ISSUE-16: Legend filters don't work

**P2 - Medium (Nice to Have)**:
- ISSUE-5: Boundary layer color coordination
- ISSUE-7: Zoom suggestions
- ISSUE-10: Layer description UI enhancement
- ISSUE-11: Point styling
- ISSUE-12: Boundary toggle button

**P3 - Low (Future)**:
- ISSUE-14: Server errors (not our fault)
- ENHANCEMENT-1: Color scheme improvements
- ENHANCEMENT-2: Time component UI

---

## Layers with No Issues Found

The following layers passed all manual QA checks:
- CalFire FRAP Fire Threat 2019 (except filter issue)
- Cattle Pastures
- Contours (2m)
- Dangermond Preserve Simple Boundary
- Fish Passage Barriers Assessment
- Jalama Watershed Outline
- JLDP Fire Perimeters ✅ **Use for passing test**
- JLDP Prescribed Burns
- Major Watersheds (except color suggestion)
- Minor Watersheds
- NOAA Marine Protected Areas Inventory 2024
- Oak Restoration Areas (except description enhancement request)
- Peregrine Falcon Observations
- Restoration Areas
- Springs
- Stock Ponds
- Stream Crossings
- Streams
- TREX Burn Units
- TREX Burn Units Vegetation Classes
- Water Tanks

---

## Testing Notes

**Layers Not Tested** (marked as uncategorized with no test data):
- Coastal Data for at Natures Crossroads Story Map
- Dangermond Data Stories
- Generalized Management Zones
- Herbaceous Vegetation
- Historic Farming Areas
- JDLP Pastures RDM Annual Averages
- JLDP Invasives Eucalyptus groves
- JLDPInvasives Ice plant mats
- Jalama Watershed Flowlines
- MARINe MultiAgency Rocky Intertidal Network Research Sites
- Natural Limits to Anadromy
- Offshore Oil and Natural Gas Platforms
- Perennial Flow
- Roads
- Shrub Vegetation
- Soils
- Tree Dominated Vegetation
- Vegetation
- Vegetation Communities (both versions)
- Wild Coast Project Feature Layer

**Action**: These layers should be tested in future QA rounds.

