# TNC Category Labels Update - Implementation Summary

## Date
January 8, 2025

## Overview
Updated the frontend to use the official 13 TNC data categories, replacing the 11 provisional category labels. The ArcGIS Hub backend was already using the new labels, so no backend changes were needed.

## New Official TNC Categories

1. **Boundaries** - Jurisdictional and ecological boundaries
2. **Infrastructure** - Built features, roads, buildings, wells
3. **Research and Sensor Equipment** - Weather stations, camera traps, well monitors
4. **Earth Observations** - Satellite, aerial, drone imagery
5. **Soils and Geology** - Subsurface materials, soil types, bedrock
6. **Land Cover** - Vegetation types, plant communities, NDVI
7. **Elevation and Bathymetry** - DEMs, slope, hillshade, bathymetry
8. **Weather and Climate** - Atmospheric conditions, precipitation, temperature
9. **Freshwater** - Streams, rivers, wetlands, watershed data
10. **Species** - Flora and fauna distribution data
11. **Threats and Hazards** - Coastal vulnerability, sea level rise, erosion
12. **Oceans and Coasts** - Intertidal, kelp, marine data
13. **Fire** - Wildfire history, prescribed burns, fire hazard zones

## Files Updated

### 1. `src/data-sources/tnc-arcgis/category_mappings.json`
- ✅ Updated `main_categories` array with 13 official TNC labels
- ✅ Updated all `mappings.tags` keys to use new category names
- ✅ Updated all `mappings.categories` keys to use new category names
- ✅ Updated all `mappings.titles` keys to use new category names
- ✅ Merged old tag mappings with new ones from analysis
- ✅ Updated metadata to reflect analysis of 105 items, 306 tags

### 2. `src/utils/constants.ts`
- ✅ Updated `CATEGORY_DATA_SOURCES` object keys from old to new category names
- ✅ Mapped data sources to appropriate new categories:
  - Species: iNaturalist, eBird, Animl, DataONE
  - Land Cover: CalFlora, iNaturalist, DataONE
  - Earth Observations: Drone Imagery
  - Elevation and Bathymetry: LiDAR
  - Research and Sensor Equipment: Dendra Stations, Animl
  - Freshwater, Weather and Climate, Oceans and Coasts: DataONE

### 3. `src/components/FilterSubheader.tsx`
- ✅ Added new icon imports: `Satellite`, `TriangleRight`
- ✅ Updated `getCategoryIcon()` function to map all 13 new category names to appropriate icons
- ✅ Assigned colors to each category icon

### 4. `src/components/DataCatalog.tsx`
- ✅ Updated all `DATA_TYPE_CARDS` default categories:
  - TNC ArcGIS Hub: `'Species'`
  - iNaturalist: `'Species'`
  - eBird: `'Species'`
  - CalFlora: `'Land Cover'`
  - Animl: `'Research and Sensor Equipment'`
  - Dendra: `'Research and Sensor Equipment'`
  - LiDAR: `'Elevation and Bathymetry'`
  - Drone Imagery: `'Earth Observations'`
  - DataONE: `'Species'`

### 5. `src/components/DataView.tsx`
- ✅ Updated all switch case keys to use new category names:
  - `'Species-iNaturalist (Public API)'` (was: Ecological / Biological)
  - `'Land Cover-CalFlora'` (was: Vegetation / habitat)
  - `'Earth Observations-Drone Imagery'` (was: Real-time & Remote Sensing)
  - `'Elevation and Bathymetry-LiDAR'` (was: Land use and land)
  - `'Weather and Climate-TNC ArcGIS Hub'` (was: Climate / weather)
  - `'Freshwater-DataONE'` (was: Hydrological)
  - `'Oceans and Coasts-TNC ArcGIS Hub'` (was: Marine)
  - `'Threats and Hazards-TNC ArcGIS Hub'` (was: Hazards & Resilience)
  - And all other combinations...

### 6. `src/App.tsx`
- ✅ Updated drone imagery cart item category to `'Earth Observations'`

### 7. `scripts/category-analysis/` (New folder)
- ✅ Created analysis script: `analyze-arcgis-tags.js`
- ✅ Generated analysis output: `analysis-output.txt`
- ✅ Generated suggested mappings: `suggested-mappings.json`
- ✅ Created documentation: `README.md`

## Category Name Mapping

| Old Label | New TNC Label |
|-----------|---------------|
| Vegetation / habitat | Land Cover |
| Ecological / Biological (Species?) | Species |
| Real-time & Remote Sensing | Earth Observations / Research and Sensor Equipment |
| Land use and land (geography?) | Boundaries |
| Climate / weather | Weather and Climate |
| Hydrological | Freshwater |
| Topographic | Soils and Geology + Elevation and Bathymetry |
| Marine | Oceans and Coasts |
| Fire | Fire (no change) |
| Infrastructure | Infrastructure (no change) |
| Hazards & Resilience | Threats and Hazards |
| (new) | Research and Sensor Equipment |

## Key Findings from Analysis

- **ArcGIS Hub categories were already correct!** The backend was already using the new TNC labels
- **306 unique tags** found across 105 items in ArcGIS Hub
- **15 categories** in ArcGIS (13 TNC official + 2 status flags: "Beta", "General Availability")
- **DataONE** was already using correct categories per user confirmation

## Testing Notes

- All linter checks pass with no errors
- Category dropdown will now show clean, official TNC category names
- All data source mappings have been updated to match new categories
- Icon mapping covers all 13 new categories

## Next Steps

1. Test the Category dropdown in the UI to ensure all labels display correctly
2. Test filtering by each category to ensure data sources appear/disappear correctly
3. Test the Data Catalog cards to ensure they navigate with correct default categories
4. Verify search functionality works with new category names
5. Update any documentation that references the old category names
6. Consider updating test files (factories.ts, test suites) to use new category names

## Commit Message Suggestion

```
feat(digital-twin): update to official TNC data categories

- Replace 11 provisional categories with 13 official TNC categories
- Update category_mappings.json with fresh analysis of 105 ArcGIS items
- Update all UI components to display new category labels
- Add category analysis script in scripts/category-analysis/
- Update data source mappings in constants.ts
- Map all category switch cases in DataView.tsx

BREAKING CHANGE: Category names have changed from provisional labels
(e.g. "Vegetation / habitat" → "Land Cover", "Ecological / Biological" → "Species")
```

