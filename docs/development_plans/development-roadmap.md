# TNC Digital Twin Development Roadmap

## Overview

This plan addresses 10+ feature requests and improvements, with strategic prioritization to minimize rework. The **Data Shopping Cart** is Priority 1 since it requires changes to ALL existing data source UIs (CalFlora, iNaturalist, eBird, Dendra, TNC ArcGIS).

## Key Strategic Decisions

1. **Build Shopping Cart FIRST** - It touches every data source's right sidebar, so doing it now prevents rebuilding tests/UIs later
2. **Manual ArcGIS QA in Parallel** - Can work on this incrementally alongside dev work
3. **Defer Comprehensive Playwright Testing** - UI is still evolving; start with 3 representative tests only
4. **ANiML after stabilization** - Major new feature best added after core improvements are done

---

## Phase 1: Data Export & Shopping Cart System (PRIORITY)

**Why First**: Every data source (TNC ArcGIS, Dendra, CalFlora, eBird, iNaturalist, ANiML) needs export functionality. Building this foundation now prevents rework.

### 1.1 Data Cart Infrastructure

**Files to Create**:
- `src/types/index.ts` - Add `CartItem` interface:
  ```typescript
  export interface CartItem {
    id: string;
    dataSource: string;
    title: string;
    query: {
      spatialFilter?: string;
      timeRange?: string;
      customDates?: { start: string; end: string };
      additionalFilters?: Record<string, any>;
    };
    itemCount: number;
    addedAt: number;
  }
  ```

- `src/hooks/useShoppingCart.ts` - Cart state management with localStorage persistence
- `src/components/ShoppingCart/CartButton.tsx` - Floating cart icon (bottom-right) showing item count
- `src/components/ShoppingCart/CartPanel.tsx` - Slide-out panel listing all saved queries
- `src/components/ShoppingCart/CartItemCard.tsx` - Individual cart item with remove/edit actions
- `src/components/ShoppingCart/ExportView.tsx` - Final export page with format selection (CSV, JSON, GeoJSON, ZIP)

### 1.2 "Add to Cart" Buttons for Each Data Source

**Update Files**:
1. **TNCArcGISDetailsSidebar.tsx** - Add "Add Layer to Cart" button (saves layer config + active filters)
2. **DendraDetailsSidebar.tsx** - Add "Add to Cart" for current datastream + time range selection
3. **CalFloraSidebar.tsx** - Add "Add Search to Cart" (saves current spatial + plant type filters)
4. **ObservationsSidebar.tsx** (for iNaturalist/eBird) - Add "Add Results to Cart"
5. **FilterSidebar.tsx** - Generic "Add to Cart" for other sources

**Button Specs**:
- Icon: ShoppingCart from lucide-react
- Tooltip: "Add current selection to export cart"
- Shows confirmation toast: "Added to cart (N items)"
- Disabled if no data loaded

### 1.3 Export Functionality

**Phase A - CSV Export Only** (MVP):
- Combine all cart items into single CSV or separate CSVs per source
- Include metadata header with query parameters
- Download as `tnc-data-export-{timestamp}.csv` or `.zip`

**Phase B - Future Enhancements** (mention in comments):
- Python script generation (dynamically create API call code)
- R script generation
- ZIP file with multiple formats
- Direct upload to user's ArcGIS Online account

### 1.4 UI Integration

**Add to App.tsx**:
- `<CartButton />` - Persistent floating button (bottom-right, z-50)
- `<CartPanel />` - Slide-in from right when cart clicked
- Cart state management in App-level context

**Storage**:
- Use localStorage: `tnc-data-cart`
- Persist across sessions
- Max 50 items (notify user when limit reached)

---

## Phase 2: ArcGIS Layer Quality Assurance (Parallel Work)

**Goal**: Manually verify all 68 ArcGIS layers work correctly in the app.

### 2.1 Testing Checklist (Manual)

For each layer in `KNOWN_ISSUES.md`, verify:
1. **Layer loads** - Check console, map display
2. **Legend displays** - Units present? Labels clear?
3. **Legend filters work** - Checkboxes actually filter features?
4. **Click/hover works** - Can select features? Popup appears?
5. **Source comparison** - If layer fails, test on ArcGIS Hub directly
6. **Image Services** - Note if click-to-filter is possible (may not be for rasters)

### 2.2 Issue Documentation

**Update** `KNOWN_ISSUES.md` with findings:
- **Client-side issues** - Tag with `[FIX]` (we can fix)
- **Server-side issues** - Tag with `[TNC]` (need to report to TNC)
- **Metadata issues** - Tag with `[METADATA]` (request better metadata)

### 2.3 Quick Fixes

**Priority fixes** (from KNOWN_ISSUES.md):
1. **Description parsing** - First paragraph omitted (ISSUE-1)
2. **Error message persistence** - Doesn't clear on layer switch (ISSUE-3)
3. **Legend labels** - Missing units (ISSUE-8)
4. **Base layer visibility** - Add light gray basemap option (ISSUE-4)

**Files to Update**:
- `src/components/TNCArcGISDetailsSidebar.tsx` - Fix description parsing
- `src/components/MapView.tsx` - Clear errors on layer switch, add basemap switcher
- `src/components/LayerLegend.tsx` - Improve unit label parsing

### 2.4 Playwright Testing Strategy

**Recommendation**: Start small (3 tests), expand after UI stabilizes.

**Initial Tests** (from `arcgis-qa-testing-plan.md`):
1. **JLDP Fire Perimeters** - "Passing" test (all checks pass)
2. **FlamMap Burn Probability** - "Known issues" test (legend issues)
3. **USA Offshore Pipelines** - "Authentication" test (requires login)

**Setup**:
- Already have `playwright.config.ts`, `e2e/test-data/arcgis-layers.json`, `e2e/helpers/arcgis-test-helpers.ts`
- Add data-testid attributes to components (see plan Phase 2.2)
- Write 3 complete tests, verify they work
- **Pause expansion** until after Shopping Cart + ANiML are done

---

## Phase 3: ANiML Camera Trap Data Integration

**Endpoint**: `https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer`
- Layer 0: `twin.animl.deployment` (camera trap stations/locations)
- Table 1: `twin.animl.image_labels_view` (images with species categories)

### 3.1 Service & Type Definitions

**Create**:
- `src/services/animlService.ts` - ArcGIS Feature Service queries
- `src/types/index.ts` - Add interfaces:
  ```typescript
  export interface AnimlDeployment {
    OBJECTID: number;
    deployment_id: string;
    name: string;
    latitude: number;
    longitude: number;
    // ... other fields from service
  }
  
  export interface AnimlImage {
    image_id: string;
    deployment_id: string;
    timestamp: number;
    species: string; // e.g., "Snake", "Fox", "Coyote"
    confidence: number;
    image_url: string;
    // CRITICAL: Filter out "Human" species
  }
  ```

### 3.2 Map Display

**Update** `src/components/MapView.tsx`:
- Add camera trap layer (blue camera icons - not Christmas trees!)
- Query Layer 0 for deployment locations
- Render as SimpleMarkerSymbol with camera icon
- Click handler opens deployment in left sidebar

**Icon Color**: Use contrasting blue (e.g., `#2563eb`) instead of green/tree-like colors

### 3.3 Left Sidebar - Two Views

**Create** `src/components/AnimlSidebar.tsx`:

**View 1: All Camera Traps**
- List all deployments from Layer 0
- Searchable/filterable by name
- Click → shows View 2 for that deployment

**View 2: Single Camera Trap Details**
- Header: Deployment name, location
- **Categories section**:
  - Group images by species (Snake, Fox, Coyote, etc.)
  - Show count per category
  - Expandable dropdowns or tabs
  - **CRITICAL FILTER**: `WHERE species != 'Human'` in ALL queries
- **Filtering options**:
  - Date range picker
  - Confidence threshold slider (min confidence to show)
  - Species multi-select

### 3.4 Right Sidebar - Image Details

**Create** `src/components/AnimlDetailsSidebar.tsx`:
- Large image display
- Metadata:
  - Species (label)
  - Confidence score (%)
  - Timestamp (formatted)
  - Deployment name
  - Coordinates
- **Export button**: "Add to Cart" (for future Python script generation)
- Navigation arrows (previous/next image in category)

### 3.5 Data Queries

**Two-stage loading**:
1. Load deployments (Layer 0) - Fast, shows map pins immediately
2. Load image counts per deployment (Table 1) - Background, updates sidebar

**Query Filters**:
- **Always** include: `species != 'Human'` (client-side double-check even if backend filters)
- Support WHERE clauses for date range, species, confidence
- Pagination (2000 records per request max)

### 3.6 Integration with Shopping Cart

**"Add to Cart" actions**:
- Add specific camera trap's images (with filters)
- Add all images from date range
- Export includes: image URLs, metadata CSV

---

## Phase 4: Quick Wins & UX Improvements

### 4.1 First-Time User Modal

**Create** `src/components/WelcomeModal.tsx`:
- Modal with overlay (z-50)
- Welcome message explaining the app
- "Don't show again" checkbox
- Cookie/localStorage: `tnc-welcome-dismissed`
- Auto-show on first visit only

### 4.2 Data Source Icons

**Update** `src/components/FilterSubheader.tsx`:
- Replace generic Database icon in source dropdown
- Fetch actual logos from each data source:
  - CalFlora: Use Leaf icon (lucide-react)
  - iNaturalist: Custom SVG (green/blue)
  - eBird: Bird icon
  - Dendra: Antenna/Radio icon
  - TNC ArcGIS: Globe icon
  - ANiML: Camera icon

### 4.3 LiDAR 3D Positioning Fix

**Update** `src/components/Scene3DView.tsx`:
- Adjust initial camera position to center on Dangermond Preserve
- Current issue: Looking too far right
- Target: Preserve center at `-120.0707, 34.4669`
- Set appropriate zoom level and tilt

**Test**: Verify starting view shows preserve clearly

### 4.4 Dendra Station Icon Redesign

**Update** `src/components/MapView.tsx` (Dendra layer rendering):
- Change from tree icon to blue circle/dot icon
- Use bright blue for visibility: `#3b82f6` or `#2563eb`
- Ensure contrast against satellite basemap
- Size: 12-16px diameter

### 4.5 ArcGIS Download Modal Centering

**Update** `src/components/DatasetDownloadView.tsx`:
- Fix vertical/horizontal centering of subheader above iframe
- Ensure header aligns properly on all screen sizes
- Check Tailwind flex/grid alignment classes

### 4.6 CalFlora Upload Script Fix

**Update** (likely a Python script in data pipeline):
- Modify feature layer creation to set `access: 'public'` instead of `'private'`
- Ensure layers are publicly accessible without authentication
- **Note**: May need TNC admin permissions

### 4.7 eBird Visualization Improvements

**Investigation Task**:
- Current layout: ObservationsSidebar shows eBird data
- **Request feedback**: What's "weird" about it?
- Possible improvements:
  - Better grouping by species
  - Time series chart of observations
  - Heat map view option
  - Sighting rarity indicators

**Defer implementation** until user provides specific feedback

---

## Phase 5: Testing Infrastructure (Minimal)

### 5.1 Add Data-TestIds (for Playwright)

**Update** (as noted in `arcgis-qa-testing-plan.md`):
- ✅ Already done: Many components have IDs
- **Remaining**:
  - Feature tooltips: `data-testid="feature-tooltip"`
  - Shopping cart components

### 5.2 Create 3 Representative Tests

**File**: `e2e/arcgis-layer-quality.spec.ts`

Tests:
1. JLDP Fire Perimeters (passing)
2. FlamMap (known legend issues)
3. USA Offshore Pipelines (auth required)

**Run & Validate**:
```bash
npx playwright test
```

**Defer full 68-layer test suite** until after UI stabilization

---

## Implementation Order

### Week 1-2: Shopping Cart Foundation
1. Cart infrastructure (types, hooks, components)
2. Add to Cart buttons in all sidebars
3. CSV export functionality
4. Testing with each data source

### Week 2-3: ArcGIS QA (Parallel)
1. Manual testing of all 68 layers
2. Document findings in KNOWN_ISSUES.md
3. Fix critical issues (description parsing, error clearing, legend units)
4. Add basemap switcher

### Week 3-4: Quick Wins
1. Welcome modal
2. Data source icons
3. LiDAR positioning fix
4. Dendra icon redesign
5. Download modal centering

### Week 4-6: ANiML Camera Traps
1. Service integration
2. Map layer + icons
3. Dual sidebar views
4. Image details panel
5. Export integration

### Week 6+: Testing & Polish
1. Create 3 Playwright tests
2. Gather eBird feedback
3. CalFlora upload script fix
4. Plan Phase B enhancements (Python scripts, etc.)

---

## Notes & Recommendations

### On Testing Timing
Your concern about Playwright tests becoming obsolete is valid. **Recommendation**:
- Do the 3 representative tests now (proves infrastructure works)
- Defer comprehensive 68-layer testing until after Shopping Cart + ANiML are stable
- UI changes will require test updates anyway; better to do it once

### On Parallel Work
While working on Shopping Cart, you can:
- Manually test ArcGIS layers (no code changes)
- Document issues in KNOWN_ISSUES.md
- Gather eBird feedback
- Plan ANiML data structure

### On Image Services
For ArcGIS Image Services (rasters like NAIP aerial imagery):
- Click-to-filter likely **not possible** - rasters don't have discrete features
- Can still query pixel values at click point
- Legend shows color ramps, not filterable categories
- Document this limitation for users

### On Uncategorized Layers
Some ArcGIS layers aren't categorized (noted in KNOWN_ISSUES.md). Shopping Cart helps here:
- Users can search by keyword regardless of category
- Add "View All" option in TNC ArcGIS sidebar
- Consider adding search-only mode (no category filter required)

## To-dos

- [ ] Build data shopping cart infrastructure (types, hooks, components, localStorage)
- [ ] Add 'Add to Cart' buttons to all data source sidebars (TNC ArcGIS, Dendra, CalFlora, iNaturalist, eBird)
- [ ] Implement CSV export functionality for cart items (with query metadata)
- [ ] Manually test all 68 ArcGIS layers, document findings in KNOWN_ISSUES.md
- [ ] Fix critical ArcGIS issues: description parsing, error clearing, legend units, basemap switcher
- [ ] Create first-time user welcome modal with 'don't show again' option
- [ ] Add proper icons to data source dropdown (replace generic database icon)
- [ ] Fix LiDAR 3D view initial camera position to center on Dangermond Preserve
- [ ] Change Dendra station icons from tree to contrasting blue circle/dot
- [ ] Fix vertical/horizontal centering in ArcGIS download modal subheader
- [ ] Create ANiML service layer: query deployments (Layer 0) and images (Table 1), filter out Humans
- [ ] Add ANiML camera trap layer to map with blue camera icons
- [ ] Build ANiML dual sidebar: View 1 (all cameras) and View 2 (single camera with species categories)
- [ ] Create ANiML image details sidebar with metadata and navigation
- [ ] Create 3 representative Playwright tests (passing, failing, auth) - defer full suite
- [ ] Fix CalFlora upload script to create public (not private) feature layers
- [ ] Gather user feedback on eBird visualization issues, plan improvements

