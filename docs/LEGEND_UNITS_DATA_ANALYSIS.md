# Legend Units Data Analysis

## Summary of Available Data Sources

### Land Cover Vulnerability Change 2050 - Country

#### 1. **Legend Endpoint** (`/ImageServer/legend?f=json`)
```json
{
  "layerName": "Land_Cover_Vulnerability_2050",
  "legendType": "Unique Values",
  "legend": [
    {"label": "0 - 0.1", "imageData": "...", ...},
    {"label": "0.1 - 0.2", "imageData": "...", ...},
    ...
    {"label": "0.9 - 1.0", "imageData": "...", ...}
  ]
}
```
**✅ Available**: Legend labels showing value ranges  
**❌ NOT Available**: Any `units` field

#### 2. **Layer Metadata** (`/ImageServer?f=json`)
```json
{
  "serviceDescription": "Land_Cover_Vulnerability_2050",
  "name": "Land_Cover_Vulnerability_2050",
  "description": "",  // EMPTY!
  "pixelType": "U16",
  "minValues": [0],
  "maxValues": [1000],  // Stored as 0-1000 internally
  "fields": [
    {"name": "OBJECTID", ...},
    {"name": "Shape", ...},
    {"name": "Name", ...}
    // NO fields with "units" property
  ]
}
```
**✅ Available**: Pixel value range (0-1000 internally)  
**❌ NOT Available**: Description, units in any field

#### 3. **Hub Catalog** (from CSV)
```
description: "Use this country model layer when performing analysis within a 
single country. This layer displays predictions within each country of relative 
vulnerability to modification by humans by the year 2050."
```
**✅ Available**: Contextual description  
**❌ NOT Available**: Explicit units

---

### Oak Restoration Areas (for comparison)

#### Layer Metadata
```json
{
  "name": "jldp_oak_restoration_areas_TYPE",
  "description": "jldp_oak_restoration_areas_TYPE",  // Just repeats name
  "fields": [
    {"name": "FID", "alias": "FID"},
    {"name": "Type", "alias": "Type"},
    {"name": "density2", "alias": "density2"}
    // NO "units" property in any field
  ],
  "drawingInfo": {
    "renderer": {
      "type": "uniqueValue",
      "field1": "Type",
      "uniqueValueInfos": [
        {"value": "1-gallon or smaller", "label": "1-gallon or smaller", ...},
        {"value": "3-gallon or smaller", "label": "3-gallon or smaller", ...},
        {"value": "acorns", "label": "acorns", ...}
      ]
    }
  }
}
```
**✅ Available**: Categorical legend labels  
**❌ NOT Available**: Units in metadata or fields

---

## Key Findings

### ❌ **NOT Available in ArcGIS Services:**
1. **No explicit `units` field** in layer metadata
2. **No `units` property** in field definitions
3. **Descriptions are often empty** or just repeat the service name
4. **No standard metadata** for what values represent

### ✅ **Consistently Available:**
1. **Legend labels** - Always present, shows displayed values
2. **Value ranges** - Can be parsed from legend labels ("0 - 0.1" → range 0-1)
3. **Field names** - Give hints about data type ("density2", "Type", etc.)
4. **Hub catalog descriptions** - Provide context but not always units

---

## Recommended Approach

Given the lack of explicit unit information in ArcGIS services, our current implementation is optimal:

### 1. **Parse Legend Labels** (Primary Method)
```typescript
// Extract numeric ranges from labels
"0 - 0.1", "0.1 - 0.2" → range: 0-1
"100-200", "200-300" → range: 100-300
```

### 2. **Display Generic Scale** (No Interpretation)
```typescript
range 0-1 → "scale 0-1"
range 0-100 → "scale 0-100"
range 100-500 → "scale 100-500"
```

### 3. **Let Context Come from Elsewhere**
- Hub catalog descriptions (already in sidebar)
- Layer titles/names
- User knowledge of the data

### 4. **Only Show Explicit Units When Found**
```typescript
if (metadata.units) return metadata.units;              // e.g., "meters"
if (field.units) return field.units;                    // e.g., "kg/hectare"
if (description.match(/units: (\w+)/)) return match;    // e.g., "degrees"
```

---

## Why This Approach Works

### ✅ **Advantages:**
1. **Truly data-driven** - No hardcoded assumptions
2. **Works for all layer types** - ImageServer, FeatureServer, MapServer
3. **Handles future layers** - No maintenance needed when TNC adds new layers
4. **Clear and honest** - Shows "scale 0-1" instead of making up meaning
5. **No false interpretations** - Doesn't assume 0=low and 1=high

### ❌ **Disadvantages:**
1. **Generic labels** - "scale 0-1" isn't as descriptive as "vulnerability (0=low, 1=high)"
2. **Requires user knowledge** - Users need to read descriptions to understand meaning

### 💡 **Mitigation:**
- Hub catalog descriptions already provide context in the sidebar
- Users can see layer title and description right next to the legend
- The generic "scale X-Y" tells users the range without misleading them

---

## Alternative Approaches Considered

### ❌ **Approach 1: Hardcode by Layer Name**
```typescript
if (layerName.includes('vulnerability')) {
  return 'vulnerability (0-1, where 1 = most vulnerable)';
}
```
**Problems:**
- Breaks when TNC renames layers
- Makes wrong assumptions (maybe 0 is high, not low)
- Doesn't work for new layers

### ❌ **Approach 2: Parse Hub Descriptions with AI/NLP**
```typescript
// Parse "relative vulnerability" from Hub description
```
**Problems:**
- Hub descriptions vary in format
- May not mention units at all
- Expensive/complex for simple task

### ✅ **Approach 3: Current Implementation**
```typescript
// Parse legend labels → "scale 0-1"
// Parse description patterns → "meters", "kg/hectare"
// Show nothing if not found
```
**Benefits:**
- Simple, fast, reliable
- No false information
- Works for all layers

---

## Conclusion

**The ArcGIS REST API simply doesn't provide unit information in most cases.**

Our implementation correctly:
1. ✅ Extracts value ranges from legend labels
2. ✅ Shows generic "scale X-Y" descriptions
3. ✅ Looks for explicit units in metadata/descriptions
4. ✅ Shows nothing if units can't be determined

This is the **best possible solution** given the data available from the services.

The **context/interpretation** is appropriately left to:
- Hub catalog descriptions (in sidebar)
- Layer titles and tags
- User domain knowledge

---

**Date:** October 7, 2025  
**Analysis By:** AI Assistant  
**Data Source:** TNC ArcGIS Hub Services
