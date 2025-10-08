# Exploratory Analysis Prompt: Finding Units of Measurement in ArcGIS Layers

## Goal
Analyze multiple TNC ArcGIS layers to identify patterns and best practices for extracting units of measurement. Determine what logic should be implemented to dynamically detect and display units in map legends.

---

## Context

We have a React + TypeScript application that displays ArcGIS layers from TNC's Hub. Currently, we only show units of measurement when they are explicitly provided in:
1. `metadata.units` field
2. `field.units` property in field definitions
3. Description text patterns like "units: meters", "measured in X", or "Name (units)"

However, most TNC layers don't provide explicit units, so legends often have no unit information displayed.

---

## Your Task

### Phase 1: Data Collection
For each layer listed below, fetch and extract:

1. **Layer Metadata** (`/FeatureServer/0?f=json` or `/ImageServer?f=json`)
   - `name` field
   - `description` field
   - `serviceDescription` field
   - `units` field (if present)
   - All `fields` with their properties (especially `units` property)
   - `pixelType`, `minValues`, `maxValues` (for ImageServers)
   - `drawingInfo.renderer` type and configuration

2. **Legend Endpoint** (`/legend?f=json`)
   - Legend labels
   - Legend type (Unique Values, Classified, etc.)
   - Number of legend items

3. **Hub Catalog Metadata** (from CSV)
   - Full description text
   - Tags
   - Categories

### Phase 2: Analysis Questions

For each layer, document:

1. **Does it have explicit units?** Where are they located?
2. **What are the legend labels?** (e.g., "0-0.1", "High/Medium/Low", "meters")
3. **Are units implied in the legend labels themselves?** (e.g., "1-gallon or smaller")
4. **Does the description contain unit information?** What patterns?
5. **What is the data type?** (continuous numeric, categorical, raster, etc.)
6. **Could units be inferred from context?** How reliable would that be?

### Phase 3: Pattern Identification

Identify patterns across all layers:

1. **Common locations** where units are found
2. **Common patterns** in descriptions that indicate units
3. **Layer types** that typically have/lack units
4. **Self-describing labels** that don't need separate units
5. **Missing unit scenarios** that can't be reliably determined

### Phase 4: Recommendations

Provide:

1. **Recommended logic** for unit extraction (ordered by reliability)
2. **Edge cases** to handle
3. **When to show nothing** vs. when to infer
4. **Whether TNC should update their metadata** and how

---

## Layers to Analyze

### Priority Layers (Analyze First)

```
1. Land Cover Vulnerability Change 2050 - Country
   URL: https://env1.arcgis.com/arcgis/rest/services/Land_Cover_Vulnerability_2050/ImageServer
   Type: ImageServer
   Known Issue: Empty description, no units field, legend shows "0-0.1" ranges

2. Oak Restoration Areas (TYPE)
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_oak_restoration_areas_(Public)/FeatureServer/0
   Type: FeatureServer
   Known Issue: No units, but labels are self-describing ("1-gallon or smaller")

3. Oak Restoration Areas (DENSITY)
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_oak_restoration_areas_(Public)/FeatureServer/1
   Type: FeatureServer
   Known Issue: Categorical labels (High/Medium/Low)

4. Stock Ponds
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_water_stock_ponds/FeatureServer/0
   Type: FeatureServer
   Known Issue: Uses picture marker symbols, unclear if units apply

5. Stream Crossings
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/stream_crossings/FeatureServer/0
   Type: FeatureServer
```

### Additional Layers (If Time Permits)

```
6. Sensitive Vegetation Communities
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_vegetation_communities/FeatureServer/0

7. Pasture Boundaries
   URL: https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_pasture_boundaries/FeatureServer/0

8. NAIP 2005 1m California (for comparison - external layer)
   URL: https://map.dfg.ca.gov/ArcGIS/rest/services/Base_Remote_Sensing/NAIP_2005/ImageServer

9. USA NLCD Land Cover (for comparison - ESRI layer)
   URL: https://landscape10.arcgis.com/arcgis/rest/services/USA_NLCD_Land_Cover/ImageServer

10. World Soils 250m pH (for comparison - has units)
    URL: https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/WorldSoils250m_pH1/ImageServer
```

---

## Data Collection Template

For each layer, provide:

```markdown
### Layer: [Name]

**Service URLs:**
- Metadata: [URL]
- Legend: [URL]

**Metadata Analysis:**
- `name`: [value]
- `description`: [value or "empty"]
- `serviceDescription`: [value or N/A]
- `units` field: [value or "not present"]
- `pixelType`: [value or N/A]
- `minValues/maxValues`: [values or N/A]
- Fields with units: [list or "none"]

**Legend Analysis:**
- Legend type: [Unique Values/Classified/etc.]
- Number of items: [count]
- Sample labels: [first 3-5 labels]
- Label pattern: [describe pattern]

**Hub Description:**
[Full description text from CSV]

**Units Assessment:**
- ✅/❌ Explicit units found: [where/why not]
- ✅/❌ Units in description: [pattern/none]
- ✅/❌ Self-describing labels: [yes/no]
- ✅/❌ Could be inferred: [how/why not]
- Recommendation: [show units/show nothing/infer from X]
```

---

## Commands to Run

### Fetch Layer Metadata:
```bash
curl -s "https://env1.arcgis.com/arcgis/rest/services/Land_Cover_Vulnerability_2050/ImageServer?f=json" | python3 -m json.tool > layer_metadata.json
```

### Fetch Legend:
```bash
curl -s "https://env1.arcgis.com/arcgis/rest/services/Land_Cover_Vulnerability_2050/ImageServer/legend?f=json" | python3 -m json.tool > layer_legend.json
```

### Extract Specific Fields:
```bash
# Check for units field
curl -s "[URL]?f=json" | python3 -c "import sys, json; data=json.load(sys.stdin); print('units:', data.get('units', 'NOT FOUND'))"

# Check description
curl -s "[URL]?f=json" | python3 -c "import sys, json; data=json.load(sys.stdin); print('description:', data.get('description', 'EMPTY')[:500])"

# Check fields for units
curl -s "[URL]?f=json" | python3 -c "import sys, json; data=json.load(sys.stdin); print([f for f in data.get('fields', []) if 'units' in f])"
```

---

## Expected Deliverable

### Summary Report Format:

```markdown
# Units of Measurement Analysis - TNC ArcGIS Layers

## Executive Summary
- Total layers analyzed: [count]
- Layers with explicit units: [count] ([percentage]%)
- Layers with inferable units: [count] ([percentage]%)
- Layers with self-describing labels: [count] ([percentage]%)
- Layers with no unit information: [count] ([percentage]%)

## Findings by Category

### 1. Layers with Explicit Units
[List layers and where units were found]

### 2. Layers with Inferable Units
[List layers and what patterns could be used]

### 3. Layers with Self-Describing Labels
[List layers where labels provide context]

### 4. Layers with No Unit Information
[List layers where units cannot be determined]

## Common Patterns Identified

### Pattern 1: [Name]
- **Frequency:** [count] layers
- **Example:** [example]
- **Reliability:** High/Medium/Low
- **Implementation:** [how to detect]

### Pattern 2: [Name]
[...]

## Recommended Implementation

### Priority 1: Explicit Unit Checks
[Code logic with examples]

### Priority 2: Pattern Matching
[Code logic with examples]

### Priority 3: Fallback Behavior
[What to show when nothing is found]

## Edge Cases & Special Handling

### Case 1: [Description]
- **Scenario:** [when it occurs]
- **Current behavior:** [what happens now]
- **Recommended:** [what should happen]

## Recommendations for TNC

1. [Specific metadata improvements needed]
2. [Suggested standard patterns to follow]
3. [Layers that should be updated]
```

---

## Success Criteria

You have succeeded when you can answer:

1. **What percentage of TNC layers have explicit units?**
2. **What are the top 3 patterns for finding units?**
3. **Which layers need metadata updates from TNC?**
4. **What's the most reliable logic to implement?**
5. **When should we show nothing vs. infer units?**

---

## Additional Notes

- Be thorough but practical - focus on implementable solutions
- Consider reliability/accuracy over coverage
- Document false positives if pattern matching is too aggressive
- Flag any layers with inconsistent or confusing metadata
- Consider user experience - sometimes showing nothing is better than guessing

---

**Start with the Priority Layers (1-5) first. Provide your analysis and recommendations before moving to additional layers.**

