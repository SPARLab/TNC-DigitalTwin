# Animl Data Source Implementation Plan

## Overview
Add Animl (camera trap/animal detection) data as a new data source, following the iNaturalist data source pattern with **dual viewing modes**:

### Two Perspectives on the Same Data:

1. **Camera-Centric View** ("What animals did this camera trap capture?")
   - Browse by camera trap/deployment
   - Filter by specific cameras
   - See all animals captured by selected camera(s)
   - Export grouped by camera

2. **Animal/Tag-Centric View** ("Where did we capture mountain lions?")
   - Browse by animal species/label
   - Filter by specific animals (e.g., "mountain lion")
   - See all detections across all cameras
   - Export grouped by animal tag

This enables users to:
- Switch between camera-centric and animal-centric perspectives
- View observations in a sidebar similar to iNaturalist (with mode switching)
- See context-aware detail views based on selected item
- Add queries to the shopping cart (in either mode)
- Export data (CSV, GeoJSON) grouped appropriately

## Data Source Information

### Endpoint
- **FeatureServer URL**: `https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer`

### Layers/Tables
1. **Layer 0: `twin.animl.deployment`** (Deployments/Camera Traps)
   - `id` (ObjectID)
   - `animl_dp_id` (String)
   - `name` (String)

2. **Table 1: `twin.animl.image_labels_view`** (Image Labels/Observations)
   - `id` (Integer)
   - `animl_image_id` (String)
   - `deployment_id` (Integer)
   - `timestamp` (Date)
   - `label` (String) - Animal species/classification
   - `medium_url` (String)
   - `small_url` (String)

## Implementation Components

### 1. Service Layer (`src/services/animlService.ts`)
Create a service to query the ArcGIS FeatureServer, following the pattern of `tncINaturalistService.ts`:

**Key Functions:**
- `queryImageLabels(options)` - Query image labels with filters
- `getDeployments()` - Get deployment information
- `getImageLabelDetails(id)` - Get details for a specific image label
- `queryImageLabelsCount(options)` - Get total count for pagination

**Query Options:**
- `startDate` / `endDate` - Filter by timestamp
- `deploymentIds` - Filter by deployment(s)
- `labels` - Filter by animal species/labels
- `spatialExtent` - Spatial filtering
- `searchMode` - 'preserve-only' | 'expanded' | 'custom'
- `customPolygon` - Custom spatial filter
- `maxResults` - Limit results
- `pageSize` / `resultOffset` - Pagination

**Response Interfaces:**
```typescript
interface AnimlDeployment {
  id: number;
  animl_dp_id: string;
  name: string;
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Aggregated stats
  totalObservations?: number;
  uniqueAnimals?: string[];
  firstObservation?: string;
  lastObservation?: string;
}

interface AnimlImageLabel {
  id: number;
  animl_image_id: string;
  deployment_id: number;
  deployment_name?: string; // Joined from deployment table
  deployment_location?: [number, number]; // From deployment geometry
  timestamp: string;
  label: string;
  medium_url: string | null;
  small_url: string | null;
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface AnimlAnimalTag {
  label: string;
  totalObservations: number;
  uniqueCameras: number;
  firstObservation: string;
  lastObservation: string;
  recentObservations: AnimlImageLabel[]; // Latest 5-10 for preview
}
```

### 2. Type Definitions (`src/types/index.ts`)
Add Animl-specific types:

**AnimlCustomFilters:**
```typescript
export interface AnimlCustomFilters {
  /** View mode: 'camera-centric' or 'animal-centric' */
  viewMode: 'camera-centric' | 'animal-centric';
  
  /** Filter by deployment IDs (camera-centric view) */
  deploymentIds?: number[];
  
  /** Filter by animal species/labels (animal-centric view) */
  labels?: string[];
  
  /** Filter by image presence */
  hasImages?: boolean;
}
```

**View Mode Selection:**
- Stored in cart item to preserve user's perspective
- Affects how data is grouped and exported
- Determines which sidebar view is shown

**Update CartItem:**
- Add `'animl'` to `dataSource` union type
- Add `animl?: AnimlCustomFilters` to `customFilters`

### 3. Component: Main Sidebar (`src/components/AnimlSidebar.tsx`)
Follow the pattern of `INaturalistSidebar.tsx` with **dual view modes**:

**Features:**
- **View Mode Toggle** at top: Switch between "Camera Traps" and "Animal Tags"
- **Conditional Rendering** based on view mode:
  - **Camera-Centric Mode**: `CameraTrapListView` component
  - **Animal-Centric Mode**: `AnimalTagListView` component
- Search functionality (context-aware)
- Pagination
- Click to view details (triggers appropriate detail view)

**Interface:**
```typescript
type AnimlViewMode = 'camera-centric' | 'animal-centric';

interface AnimlSidebarProps {
  // View mode
  viewMode: AnimlViewMode;
  onViewModeChange: (mode: AnimlViewMode) => void;
  
  // Camera-centric data
  deployments?: AnimlDeployment[];
  selectedDeploymentId?: number | null;
  onDeploymentClick?: (deployment: AnimlDeployment) => void;
  
  // Animal-centric data
  animalTags?: AnimlAnimalTag[];
  selectedAnimalLabel?: string | null;
  onAnimalTagClick?: (tag: AnimlAnimalTag) => void;
  
  // Common
  loading: boolean;
  dateRangeText: string;
  hasSearched?: boolean;
  
  // For camera-centric: show observations for selected camera
  // For animal-centric: show all observations for selected animal
  observations?: AnimlImageLabel[];
  selectedObservationId?: number | null;
  onObservationClick?: (observation: AnimlImageLabel) => void;
}
```

**Sub-Components:**

**3a. CameraTrapListView** (used in camera-centric mode):
- List of camera traps with:
  - Camera name
  - Total observation count
  - Preview of unique animals detected
  - Date range of observations
- Search by camera name
- Click camera → shows observations for that camera
- Selected camera highlighted

**3b. AnimalTagListView** (used in animal-centric mode):
- List of animal tags with:
  - Animal label (e.g., "Mountain Lion")
  - Total observation count
  - Number of cameras that detected it
  - Preview of recent observations
- Search by animal label
- Click animal → shows all observations for that animal
- Selected animal highlighted

### 4. Component: Details Sidebar (`src/components/AnimlDetailsSidebar.tsx`)
Follow the pattern of `INaturalistDetailsSidebar.tsx` with **context-aware detail views**:

**Features:**
- Two tabs: "Details" and "Export All"
- **Details Tab**: Context-sensitive based on what's selected
  - **If camera trap selected (camera-centric mode)**:
    - Camera trap details (name, ID, location)
    - Summary statistics (total observations, unique animals, date range)
    - List/grid of animals detected by this camera
    - Click animal → switch to animal-centric view for that animal
  - **If animal tag selected (animal-centric mode)**:
    - Large image display (medium_url) of selected observation
    - Animal label/species name
    - Observation details (timestamp, location, camera trap name)
    - Recent sightings section (other recent detections of same animal)
    - Link to view all detections of this animal
- **Export All Tab**: Export based on current view mode
  - **Camera-centric export**: Grouped by camera trap
  - **Animal-centric export**: Grouped by animal tag
  - Filters, export options, add to cart

**Interface:**
```typescript
interface AnimlDetailsSidebarProps {
  // View mode
  viewMode: 'camera-centric' | 'animal-centric';
  
  // Selected items (context-aware)
  selectedDeployment?: AnimlDeployment | null;
  selectedAnimalTag?: AnimlAnimalTag | null;
  selectedObservation?: AnimlImageLabel | null;
  
  // Data for display
  deployments?: AnimlDeployment[];
  animalTags?: AnimlAnimalTag[];
  observations?: AnimlImageLabel[];
  
  // Export & cart
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: (filteredCount: number) => void;
  onClose: () => void;
  hasSearched: boolean;
  dateRangeText: string;
}
```

**Export Tab Filters:**
- View mode indicator (read-only, shows current mode)
- Deployment selection (if camera-centric mode)
- Animal label filter (if animal-centric mode)
- Date range (from core filters)
- Image presence filter

### 5. Component: Data View (`src/components/dataviews/WildlifeAnimlView.tsx`)
Wrapper component following `WildlifeINaturalistView.tsx` pattern:

```typescript
interface WildlifeAnimlViewProps {
  imageLabels: AnimlImageLabel[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  hasSearched?: boolean;
  onImageLabelClick?: (label: AnimlImageLabel) => void;
  selectedImageLabelId?: number | null;
  selectedDeployments?: number[];
  onDeploymentChange?: (deploymentIds: number[]) => void;
}
```

### 6. Shopping Cart Integration

**Update `src/services/cartQueryExecutor.ts`:**
- Add `case 'animl':` handler
- Implement `executeAnimlQuery(item: CartItem)`

**Update `src/hooks/useShoppingCart.ts`:**
- No changes needed (already supports any data source)

### 7. App Integration

**Update `src/utils/constants.ts`:**
- Add `'Animl'` to `DATA_SOURCES` array
- Add Animl to appropriate categories in `CATEGORY_DATA_SOURCES`:
  - `'Ecological / Biological (Species?)'`: Add `'Animl'`
  - `'Real-time & Remote Sensing'`: Add `'Animl'` (optional)

**Update `src/components/DataView.tsx`:**
- Add case for `'Ecological / Biological (Species?)-Animl'`
- Add case for `'Real-time & Remote Sensing-Animl'` (if applicable)
- Pass appropriate props to `WildlifeAnimlView`

**Update `src/App.tsx`:**
- Add state for Animl data:
  - `animlViewMode: 'camera-centric' | 'animal-centric'`
  - `animlDeployments: AnimlDeployment[]`
  - `animlImageLabels: AnimlImageLabel[]`
  - `animlAnimalTags: AnimlAnimalTag[]`
  - `animlLoading: boolean`
  - `selectedAnimlDeployment: AnimlDeployment | null`
  - `selectedAnimlAnimalTag: AnimlAnimalTag | null`
  - `selectedAnimlObservation: AnimlImageLabel | null`
- Add handlers:
  - `handleAnimlSearch`
  - `handleAnimlViewModeChange`
  - `handleAnimlDeploymentClick`
  - `handleAnimlAnimalTagClick`
  - `handleAnimlObservationClick`
  - `handleAnimlExportCSV`
  - `handleAnimlExportGeoJSON`
  - `handleAnimlAddToCart`
- Wire up to FilterSubheader and DataView

**Update `src/components/MapView.tsx`:**
- Add Animl layers based on view mode:
  - **Camera-Centric Mode**: Display camera trap locations as points
  - **Animal-Centric Mode**: Display observation locations as points
- Handle clicks to select items:
  - Camera click → selects camera, shows camera details
  - Observation click → selects observation, shows observation details
- Add popup content:
  - Camera popup: Name, total observations, unique animals, date range
  - Observation popup: Animal label, timestamp, camera name, image thumbnail
- Color-code observations by animal label (similar to iNaturalist taxon colors)
- Show/hide layers based on selected filters

### 8. Export Utilities

**CSV Export (Camera-Centric Mode):**
- Grouped by camera trap
- Headers: Camera Name, Camera ID, Location, Total Observations, Unique Animals
- Then: Observation rows with: id, animl_image_id, timestamp, label, medium_url, small_url
- Include coordinates if available

**CSV Export (Animal-Centric Mode):**
- Grouped by animal tag
- Headers: Animal Label, Total Observations, Cameras Detected
- Then: Observation rows with: id, animl_image_id, deployment_name, timestamp, medium_url, small_url
- Include coordinates if available

**GeoJSON Export:**
- **Camera-Centric**: Point features at camera trap locations with properties including total observations and unique animals
- **Animal-Centric**: Point features at observation locations with properties from image labels
- Include full metadata in both cases

### 9. Data View Integration Pattern

Following the iNaturalist pattern with dual-view support:

**Initial Search:**
1. User selects category + "Animl" source
2. User sets spatial and time filters
3. User clicks search
4. `App.tsx` calls:
   - `animlService.queryDeployments()` - Get all camera traps
   - `animlService.queryImageLabels()` - Get all observations
   - `animlService.aggregateAnimalTags()` - Group by animal label
5. Results displayed in `WildlifeAnimlView` → `AnimlSidebar`
6. User selects view mode (camera-centric or animal-centric)

**Camera-Centric Flow:**
1. Left sidebar shows list of camera traps
2. User clicks camera → shows observations for that camera
3. Right sidebar (Details) shows camera info + animals detected
4. User can click animal → switch to animal-centric view for that animal
5. Export: Grouped by camera trap

**Animal-Centric Flow:**
1. Left sidebar shows list of animal tags
2. User clicks animal → shows all observations for that animal
3. Right sidebar (Details) shows large image + observation details + recent sightings
4. User can click camera name → switch to camera-centric view for that camera
5. Export: Grouped by animal tag

**Shopping Cart:**
- User can add query to cart in either mode
- Cart stores: view mode, filters, date range, spatial extent
- Export executes query fresh, maintains grouping based on stored view mode

## Implementation Steps

### Phase 1: Service & Types
1. ✅ Create `animlService.ts` with query functions
2. ✅ Add types to `types/index.ts`
3. ✅ Test service with sample queries

### Phase 2: Components
4. ✅ Create `AnimlSidebar.tsx` with view mode toggle
5. ✅ Create `CameraTrapListView.tsx` (sub-component)
6. ✅ Create `AnimalTagListView.tsx` (sub-component)
7. ✅ Create `AnimlDetailsSidebar.tsx` with context-aware details
8. ✅ Create `WildlifeAnimlView.tsx` wrapper

### Phase 3: Integration
7. ✅ Update `constants.ts` to add Animl as data source
8. ✅ Update `DataView.tsx` to route to Animl view
9. ✅ Update `App.tsx` to handle Animl state and handlers
10. ✅ Update `MapView.tsx` to display Animl observations

### Phase 4: Shopping Cart
11. ✅ Update `cartQueryExecutor.ts` to support Animl queries
12. ✅ Test adding Animl queries to cart
13. ✅ Test exporting from cart

### Phase 5: Testing & Refinement
14. ✅ Test all filters and search functionality
15. ✅ Test export formats (CSV, GeoJSON)
16. ✅ Test cart integration
17. ✅ Polish UI/UX

## Key Considerations

### Spatial Data
- The `twin.animl.image_labels_view` table may not have explicit geometry fields
- May need to join with deployment table to get location
- Or query deployments separately and match by `deployment_id`

### Image Display
- Use `small_url` for thumbnails in list view
- Use `medium_url` for detail view
- Handle missing/null URLs gracefully

### Deployment Filtering
- Fetch available deployments on search
- Allow multi-select of deployments
- Show deployment names, not just IDs

### Label Filtering
- The `label` field contains species/classification
- Support search by label text
- May want to show unique labels for filtering

### Date Filtering
- Use `timestamp` field for date range filtering
- Format dates consistently with other data sources

## Testing Checklist

### Service & Data
- [ ] Service queries return expected data
- [ ] Deployment queries work
- [ ] Image label queries work
- [ ] Animal tag aggregation works
- [ ] Pagination works correctly
- [ ] Spatial filtering works (preserve-only, expanded, custom)
- [ ] Date filtering works

### Camera-Centric View
- [ ] Camera trap list displays correctly
- [ ] Clicking camera shows its observations
- [ ] Camera details sidebar shows correct info
- [ ] Map displays camera locations
- [ ] Clicking camera on map selects it
- [ ] Export grouped by camera works

### Animal-Centric View
- [ ] Animal tag list displays correctly
- [ ] Clicking animal shows all observations
- [ ] Animal details sidebar shows large image
- [ ] Recent sightings section works
- [ ] Map displays observation locations
- [ ] Clicking observation on map selects it
- [ ] Export grouped by animal works

### View Mode Switching
- [ ] Toggle between camera and animal views works
- [ ] State persists when switching modes
- [ ] Clicking animal from camera view switches to animal view
- [ ] Clicking camera from animal view switches to camera view

### Export & Cart
- [ ] Export CSV works (both modes)
- [ ] Export GeoJSON works (both modes)
- [ ] Add to cart works (both modes)
- [ ] Cart query execution works
- [ ] Cart export maintains grouping

## User Experience Flow Examples

### Example 1: "What animals did Camera Trap X capture?"
1. User selects Animl data source
2. Sets time range and spatial filter
3. Clicks search
4. **View Mode**: Camera-Centric (default or user selects)
5. Left sidebar shows list of camera traps
6. User clicks "Camera Trap X"
7. Left sidebar now shows observations for that camera
8. Right sidebar (Details) shows:
   - Camera name, location, ID
   - Summary: "23 observations, 8 unique animals"
   - List of animals detected: Mountain Lion (5), Deer (12), Coyote (6)
9. User clicks "Mountain Lion" → switches to animal-centric view
10. User can export all observations from Camera Trap X

### Example 2: "Where did we capture Mountain Lions?"
1. User selects Animl data source
2. Sets time range and spatial filter
3. Clicks search
4. **View Mode**: Animal-Centric (user selects)
5. Left sidebar shows list of animal tags
6. User searches/clicks "Mountain Lion"
7. Left sidebar shows all Mountain Lion observations
8. Right sidebar (Details) shows:
   - Large image of selected observation
   - Observation details: timestamp, camera trap name, location
   - Recent sightings: "5 other Mountain Lion detections in past 30 days"
9. User can click camera name to see what else that camera captured
10. User can export all Mountain Lion observations

## Future Enhancements

- Heatmap view of detections
- Time-lapse view of camera trap data
- Species detection statistics
- Deployment performance metrics
- Image gallery view
- Advanced filtering by detection confidence (if available)
- Cross-referencing: "Show me cameras that captured both Mountain Lion and Deer"
- Temporal analysis: "Show me when this animal is most active"

