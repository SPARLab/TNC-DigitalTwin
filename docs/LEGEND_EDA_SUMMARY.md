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

1. Remove the built-in ArcGIS Legend widget
2. Create custom `LayerLegend` component with:
   - Support for simple/uniqueValue/classBreaks renderers
   - Color swatch rendering for each symbol type
   - Collapsible UI for large legends
   - Tailwind styling
3. Add legend fetching to `MapView.tsx` when layers load
4. Display legend in `TNCArcGISSidebar.tsx` within expanded layer cards
