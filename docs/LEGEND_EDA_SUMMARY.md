# ArcGIS Legend Data Structures - EDA Summary

## Key Findings

After analyzing real TNC ArcGIS FeatureServer layers, we found **two main renderer types** that we need to support for custom legends:

### 1. **Simple Renderer** (Single Symbol)
All features use the same symbol/color. Example: Habitat Areas, County boundaries.

**Data Structure:**
```json
{
  "type": "simple",
  "label": "Layer Name",
  "symbol": {
    "type": "esriSFS",  // Polygon
    "color": [222, 252, 201, 255],  // RGBA
    "outline": {
      "color": [110, 110, 110, 255],
      "width": 0.6
    }
  }
}
```

**Legend Display:**
- Show single color swatch + label
- Simple, minimal UI

---

### 2. **Unique Value Renderer** (Categorical)
Different symbols for different categories. Example: Vegetation types (50 categories), Weather warnings (123 event types).

**Data Structure:**
```json
{
  "type": "uniqueValue",
  "field": "VegClass",  // The attribute field used for categorization
  "uniqueValueInfos": [
    {
      "value": "Agricultural Areas",
      "label": "Agricultural Areas",
      "symbol": {
        "type": "esriSFS",
        "color": [110, 110, 110, 255],
        "outline": { "color": [104, 104, 104, 255], "width": 0.6 }
      }
    },
    {
      "value": "Coast Live Oak Woodland",
      "label": "Coast Live Oak Woodland", 
      "symbol": {
        "type": "esriSFS",
        "color": [219, 190, 61, 255],
        "outline": { "color": [104, 104, 104, 255], "width": 0.6 }
      }
    }
    // ... 48 more categories
  ]
}
```

**Legend Display:**
- Scrollable list of categories
- Color swatch + label for each
- Can have 10-123+ categories!

---

### 3. **Class Breaks Renderer** (Graduated/Numeric Ranges)
NOT found in current TNC data, but should support for completeness.

**Data Structure:**
```json
{
  "type": "classBreaks",
  "field": "Population",
  "classBreakInfos": [
    {
      "classMinValue": 0,
      "classMaxValue": 100,
      "label": "0 - 100",
      "symbol": { /* ... */ }
    },
    {
      "classMinValue": 100.01,
      "classMaxValue": 500,
      "label": "101 - 500", 
      "symbol": { /* ... */ }
    }
    // ...
  ]
}
```

**Legend Display:**
- Graduated color ramp
- Show min-max ranges

---

## Symbol Types Found

### `esriSFS` - Simple Fill Symbol (Polygons)
```json
{
  "type": "esriSFS",
  "style": "esriSFSSolid",  // or "esriSFSHorizontal" for hatching
  "color": [R, G, B, A],    // Fill color
  "outline": {
    "type": "esriSLS",
    "color": [R, G, B, A],  // Outline color  
    "width": 0.6            // Line width
  }
}
```

### `esriPFS` - Picture Fill Symbol (Textured Polygons)
```json
{
  "type": "esriPFS",
  "url": "https://...",       // URL to image
  "imageData": "base64...",   // OR base64 encoded image
  "contentType": "image/png",
  "width": 20,
  "height": 20,
  "xoffset": 0,
  "yoffset": 0,
  "angle": 0
}
```

### `esriSLS` - Simple Line Symbol (Lines)
```json
{
  "type": "esriSLS",
  "style": "esriSLSSolid",
  "color": [R, G, B, A],
  "width": 2
}
```

### `esriSMS` - Simple Marker Symbol (Points)
```json
{
  "type": "esriSMS",
  "style": "esriSMSCircle",
  "color": [R, G, B, A],
  "size": 8,
  "outline": {
    "color": [R, G, B, A],
    "width": 1
  }
}
```

### `esriPMS` - Picture Marker Symbol (Icon Points)
**Used for stock ponds, stream crossings, and other custom icons**
```json
{
  "type": "esriPMS",
  "url": "https://...",       // URL to icon image
  "imageData": "base64...",   // OR base64 encoded icon
  "contentType": "image/png",
  "width": 20,
  "height": 20,
  "xoffset": 0,               // Horizontal offset
  "yoffset": 0,               // Vertical offset
  "angle": 0                  // Rotation angle in degrees
}
```

---

## Statistics from TNC Data

- **Total services analyzed:** 3 FeatureServers
- **Total layers:** 13
- **Layers with renderers:** 13 (100%)
- **Renderer types:**
  - Unique Value (categorical): 7 layers (54%)
  - Simple (single symbol): 6 layers (46%)
  - Class Breaks: 0 layers (not used in current data)

**Largest legends:**
- Weather warnings: 123 categories
- Vegetation communities: 50 categories

---

## Implementation Recommendations

### Custom Legend Component Structure

```typescript
interface LegendData {
  layerId: string;
  layerName: string;
  rendererType: 'simple' | 'uniqueValue' | 'classBreaks';
  items: LegendItem[];
}

interface LegendItem {
  label: string;
  symbol: {
    type: 'polygon' | 'line' | 'point';
    fillColor?: [number, number, number, number];
    outlineColor?: [number, number, number, number];
    outlineWidth?: number;
    size?: number;  // for points
  };
  value?: string | number;  // for uniqueValue
  minValue?: number;        // for classBreaks
  maxValue?: number;        // for classBreaks
}
```

### UI Design Considerations

1. **For Simple Renderer:**
   - Single row: `[color swatch] Layer Name`
   - Minimal space needed

2. **For Unique Value (Categorical):**
   - Scrollable list with max height
   - Collapsible sections for layers with 10+ categories
   - Search/filter for 50+ categories
   - Virtual scrolling for 100+ categories

3. **Layout Options:**
   - **Option A:** In sidebar below each layer card (next to opacity slider)
   - **Option B:** Dedicated legend panel in bottom-right corner
   - **Option C:** Expandable "Show Legend" button in layer card

### How to Fetch Legend Data

```typescript
// For FeatureServer layers:
const layerUrl = `${serviceUrl}/${layerId}?f=json`;
const response = await fetch(layerUrl);
const data = await response.json();
const renderer = data.drawingInfo?.renderer;

// Transform renderer to our legend format
const legend = transformRendererToLegend(renderer);
```

---

## Next Steps

1. ✅ Remove the built-in ArcGIS Legend widget
2. ✅ Create custom `LayerLegend` component with:
   - ✅ Support for simple/uniqueValue/classBreaks renderers
   - ✅ Color swatch rendering for each symbol type (including picture markers)
   - ✅ Collapsible UI for large legends
   - ✅ Tailwind styling
3. ✅ Add legend fetching to `MapView.tsx` when layers load
4. ✅ Display legend in floating panel in bottom-right corner

## Recent Updates (October 2025)

### Picture Marker Symbol Support
Added support for `esriPMS` (Picture Marker Symbol) and `esriPFS` (Picture Fill Symbol) to display actual icon images in legends instead of generic color squares.

**Changes made:**
- Updated `tncArcGISService.transformSymbol()` to extract image URLs and base64 data from picture marker symbols
- Enhanced `LayerLegend.tsx` to render images with proper dimensions and rotation
- Added support for symbol rotation (`angle` property) in legend display
- Added debug logging to track picture marker symbol detection

**Affected layers:**
- Stock Ponds (water well icons)
- Stream Crossings (custom icons)
- Any other layers using custom SVG/PNG icons

**Technical details:**
- Picture markers can provide either a `url` (HTTP link to icon) or `imageData` (base64-encoded image)
- Icons can be rotated using the `angle` property
- Icons can have custom dimensions (`width`, `height`) and offsets (`xoffset`, `yoffset`)
- The legend now dynamically displays the same icons that appear on the map
