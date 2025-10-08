# Legend Units of Measurement Feature

## Overview
Added support for displaying units of measurement in legends for ArcGIS layers, particularly ImageServer layers that display continuous raster data like "Land Cover Vulnerability Change 2050".

## Problem
Legends were showing numerical ranges (e.g., "0.4 - 0.5", "0.5 - 0.6") without indicating what those numbers represent, making it difficult for users to interpret the data.

## Solution
Enhanced the legend system to automatically extract and display units of measurement from layer metadata, with intelligent fallbacks when units aren't explicitly defined.

## Implementation

### 1. Unit Extraction Logic (`src/services/tncArcGISService.ts`)

Added `extractUnits()` method that searches for unit information in multiple places:

#### A. Direct Unit Field
```typescript
if (metadata.units) {
  return metadata.units;
}
```
Checks for explicit `units` field in layer metadata (common in ImageServer).

#### B. Description Parsing
Searches the layer description for common unit patterns:
- Units in parentheses: `"Vulnerability (0-1 scale)"`
- Explicit unit declarations: `"units: meters"` or `"unit: kg"`
- Measurement phrases: `"measured in meters"`
- Value descriptions: `"values are meters"` or `"values in kg"`

#### C. Field-Level Units
```typescript
if (metadata.fields && Array.isArray(metadata.fields)) {
  for (const field of metadata.fields) {
    if (field.units) {
      return field.units;
    }
  }
}
```
Checks attribute fields for unit information.

#### D. Intelligent Inference
For ImageServer layers without explicit units, infers units based on description keywords:
- **"index", "score", "ratio"** → `"index value"`
- **"percent"** → `"percent"`
- **"probability", "vulnerability"** → `"0-1 scale"`

### 2. Enhanced Legend Fetching (`fetchLegendInfo()`)

Updated to:
1. Fetch layer metadata first to extract units
2. Pass units through legend transformation pipeline
3. Include units in returned legend data structure
4. Add debug logging to help identify unit sources

```typescript
// Extract units from metadata
const units = this.extractUnits(layerMetadata);

// Include in legend data
return {
  layerId: layerLegend.layerId.toString(),
  layerName: layerLegend.layerName,
  rendererType: ...,
  units: units, // NEW: Add units
  items: [...]
};
```

### 3. Legend Display (`src/components/LayerLegend.tsx`)

#### Updated Interface
```typescript
export interface LayerLegendData {
  layerId: string;
  layerName: string;
  rendererType: 'simple' | 'uniqueValue' | 'classBreaks';
  units?: string | null; // NEW: Units of measurement
  items: LegendItem[];
}
```

#### Visual Display
When units are available, displays them above the legend items:
```tsx
{legend.units && (
  <div className="mb-2 px-1">
    <p className="text-xs text-gray-600 italic">
      Units: <span className="font-medium text-gray-700">{legend.units}</span>
    </p>
  </div>
)}
```

## Examples

### ImageServer (Land Cover Vulnerability)
- **Values:** 0.4-0.5, 0.5-0.6, 0.6-0.7, etc.
- **Units Detected:** "0-1 scale" (inferred from description containing "vulnerability")
- **Display:** "Units: 0-1 scale"

### FeatureServer (Elevation Data)
- **Values:** 0-100, 100-500, 500-1000
- **Units Detected:** "meters" (from field metadata or description)
- **Display:** "Units: meters"

### MapServer (Population Density)
- **Values:** 0-10, 10-50, 50-100
- **Units Detected:** "people per sq km" (from description)
- **Display:** "Units: people per sq km"

## Debug Logging

When a layer is loaded, the console will show:
```javascript
📊 Layer metadata for Land Cover Vulnerability Change 2050: {
  units: null,
  pixelType: "F32",
  description: "This layer displays predictions of relative vulnerability...",
  hasRenderer: true,
  fields: []
}
```

This helps identify:
- Whether the layer has explicit units
- What metadata is available
- How to improve unit extraction

## Benefits

1. **Better Data Interpretation**: Users immediately understand what the numbers represent
2. **Context for Values**: Numbers like "0.4-0.5" are meaningless without knowing if they're percentages, indices, or measurements
3. **Professional Presentation**: Legends include standard cartographic metadata
4. **Automatic Detection**: Works without manual configuration for most layers

## Edge Cases

### No Units Available
- If no units can be detected or inferred, no unit label is displayed
- Legend still functions normally with just the value ranges

### Multiple Interpretations
- The extraction logic prioritizes:
  1. Explicit unit fields (most reliable)
  2. Description parsing (second choice)
  3. Keyword inference (fallback)

### Custom Units
- If a layer has unusual units, they may not be detected automatically
- Can be added to the inference logic in `extractUnits()` method

## Future Enhancements

1. **User Override**: Allow users to specify custom units in the UI
2. **Unit Abbreviations**: Standardize common units (e.g., "m" → "meters")
3. **Multi-Language**: Support for unit translations
4. **Service-Level Defaults**: Configure default units per service type
5. **Unit Conversion**: Display values in alternative units (e.g., meters ↔ feet)

## Files Modified

1. **src/services/tncArcGISService.ts**
   - Added `extractUnits()` method
   - Enhanced `fetchLegendInfo()` to extract and pass units
   - Updated `transformRendererToLegend()` to accept units parameter

2. **src/components/LayerLegend.tsx**
   - Updated `LayerLegendData` interface to include units
   - Added visual display of units above legend items

## Testing

To verify units are being extracted:
1. Load a layer with numeric ranges (e.g., Land Cover Vulnerability)
2. Check the browser console for layer metadata logs
3. Verify "Units: [unit]" appears in the legend panel
4. Inspect console logs to see what metadata was available

---

**Date:** October 7, 2025  
**Author:** AI Assistant  
**Related Issue:** Legend showing numerical values without units of measurement
