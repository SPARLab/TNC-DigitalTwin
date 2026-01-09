# TNC ArcGIS Hub Data Source

This data source integrates with the TNC Dangermond Preserve ArcGIS Hub to provide access to datasets and documents from the preserve's data catalog.

## Overview

The TNC ArcGIS Hub contains 93+ data items (excluding Hub Pages) organized into 13 official TNC categories:

- **Species** - Biodiversity, wildlife, species observations
- **Land Cover** - Vegetation, ecosystems, conservation areas
- **Earth Observations** - Imagery, remote sensing, basemaps
- **Research and Sensor Equipment** - Monitoring stations, sensors, camera traps
- **Boundaries** - Administrative boundaries, ownership, preserve extent
- **Weather and Climate** - Climate data, weather information
- **Freshwater** - Water resources, streams, watersheds
- **Soils and Geology** - Geology, soils, subsurface data
- **Elevation and Bathymetry** - Topography, elevation models, LiDAR
- **Oceans and Coasts** - Marine data, coastal information
- **Fire** - Fire data, hazard zones, prescribed burns
- **Infrastructure** - Transportation, utilities, structures
- **Threats and Hazards** - Energy resources, hazards, conservation emphasis areas

## API Endpoints

The service fetches data from these TNC Hub API endpoints:

- **Datasets**: `https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset/items?limit=100`
- **Documents**: `https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/document/items?limit=100`
- **Apps & Maps** (optional): `https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/appAndMap/items?limit=100`

## UI Patterns

The service automatically categorizes items into three UI patterns based on their data type:

### 1. MAP_LAYER (70+ items - ~75%)
**Data Types**: Feature Service, Image Service, Map Service, Vector Tile Service, Scene Service, WMS, WFS, KML

**UI Behavior**: 
- Toggle checkbox to add/remove layer from map
- Opacity slider when layer is active
- Visual indicator showing layer status

### 2. EXTERNAL_LINK (15+ items - ~16%)
**Data Types**: Web Experience, Dashboard, Web Mapping Application, Operations Dashboard, Insights Workbook, Hub Initiative, Site Application

**UI Behavior**:
- Click to open in new browser tab
- External link icon indicator
- Direct navigation to TNC applications

### 3. MODAL (8+ items - ~9%)
**Data Types**: StoryMap, Web Map, Feature Collection, CSV, Shapefile, File Geodatabase, CAD Drawing, PDF, Microsoft Office documents

**UI Behavior**:
- Click to open modal dialog
- Embedded content for StoryMaps
- Metadata view for other types
- Download/view options

## Category Mapping

The service uses `category_mappings.json` to map TNC's original tags and categories to the main catalog categories. This mapping system:

1. **Tag Mapping**: Matches item tags to main categories using semantic analysis
2. **Category Mapping**: Maps hierarchical category paths (e.g., "/Categories/Environment/Freshwater") to main categories
3. **Multiple Categories**: Items can belong to multiple main categories

## File Structure

```
src/data-sources/tnc-arcgis/
├── README.md                 # This documentation
├── category_mappings.json    # Tag/category mapping configuration
└── (future files)           # Additional configuration or data files
```

## Service Architecture

### TNCArcGISService (`src/services/tncArcGISService.ts`)
- Fetches data from TNC Hub API endpoints
- Applies category mapping using the JSON configuration
- Determines UI patterns based on data types
- Provides filtering and search capabilities
- Handles rate limiting and error management

### TNCArcGISSidebar (`src/components/TNCArcGISSidebar.tsx`)
- Displays items in collapsible category groups
- Provides search and filtering controls
- Handles the three UI patterns (MAP_LAYER, EXTERNAL_LINK, MODAL)
- Shows statistics and item counts
- Manages layer opacity controls and modal dialogs

### TNCArcGISView (`src/components/dataviews/TNCArcGISView.tsx`)
- Wrapper component that connects to the main application
- Passes props between App.tsx and TNCArcGISSidebar
- Handles data flow and state management

## Integration

The TNC ArcGIS data source is integrated into the main application through:

1. **Constants** (`src/utils/constants.ts`): Added new categories and data source
2. **DataView** (`src/components/DataView.tsx`): Routes to TNCArcGISView for TNC categories
3. **App.tsx**: Manages state, API calls, and data export functionality

## Usage

1. **Select Category**: Choose from the TNC-specific categories in the filter
2. **Select Data Source**: Choose "TNC ArcGIS Hub" as the data source
3. **Search**: Click the search button to load TNC data
4. **Interact**: 
   - Toggle map layers on/off
   - Click external links to open TNC applications
   - Click modal items to view detailed information
5. **Export**: Use CSV or GeoJSON export options

## Features

- **Real-time Data**: Fetches live data from TNC Hub API
- **Smart Categorization**: Automatically maps items to relevant categories
- **Multiple UI Patterns**: Handles different data types appropriately
- **Search & Filter**: Full-text search and category filtering
- **Export Options**: CSV and GeoJSON export with comprehensive metadata
- **Error Handling**: Graceful handling of API errors and rate limiting
- **Responsive Design**: Works on desktop and mobile devices

## Future Enhancements

- **Map Integration**: Add actual ArcGIS layer loading for MAP_LAYER items
- **Caching**: Implement client-side caching for better performance
- **Advanced Filters**: Add date range, data type, and owner filters
- **Thumbnails**: Display item thumbnails when available
- **Favorites**: Allow users to bookmark frequently used items
- **Offline Support**: Cache critical data for offline access

## Development Notes

- The service excludes "Hub Page" items as requested
- Rate limiting is implemented with 500ms between requests
- Category mapping is extensible - new mappings can be added to the JSON file
- All items are assigned to the Dangermond Preserve center point for GeoJSON export
- The service is designed to handle the expected ~93 items efficiently

