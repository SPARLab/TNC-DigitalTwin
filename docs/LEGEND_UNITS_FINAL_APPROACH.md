# Legend Units - Final Approach

## Philosophy

**Show only what's explicitly provided. Don't infer or interpret.**

---

## What We Show

### ✅ **Explicit Units Only**

1. **`metadata.units` field** - Direct unit field in service metadata
   - Example: `"units": "meters"`

2. **Field-level units** - `field.units` property in field definitions
   - Example: `{"name": "elevation", "units": "meters"}`

3. **Units in descriptions** - Explicit patterns like:
   - `"units: meters"`
   - `"measured in kilograms"`
   - `"Elevation (meters)"` (in parentheses at end)

---

## What We DON'T Show

### ❌ **No Inference or Interpretation**

- ❌ "scale 0-1" (inferred from legend labels)
- ❌ "vulnerability index" (interpreted from layer name)
- ❌ "0-1, where 1 = most vulnerable" (assumption about meaning)
- ❌ Any made-up or assumed information

**If explicit units aren't found → Show nothing**

---

## Where Users Get Context

### 1. **Layer Title**
In the sidebar card header:
```
Land Cover Vulnerability Change 2050 - Country
```

### 2. **Layer Description**
In the sidebar card body:
```
Use this country model layer when performing analysis within a single 
country. This layer displays predictions within each country of relative 
vulnerability to modification by humans by the year 2050.
```

### 3. **Legend Labels**
In the legend panel:
```
0 - 0.1
0.1 - 0.2
0.2 - 0.3
...
```
Users can see the value ranges directly.

### 4. **User Knowledge**
Domain experts understand their data and can interpret values in context.

---

## Implementation

```typescript
private extractUnits(metadata: any, legendLayer?: any): string | null {
  // 1. Check metadata.units
  if (metadata?.units) return metadata.units;
  
  // 2. Check field-level units
  for (const field of metadata?.fields || []) {
    if (field.units) return field.units;
  }
  
  // 3. Parse description for explicit unit patterns
  const description = metadata?.description || metadata?.serviceDescription || '';
  const patterns = [
    /units?:\s*([^\n,;.]+)/i,
    /measured in\s+([^\n,;.]+)/i,
    /\(([^)]+)\)\s*$/
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  
  // 4. No explicit units found
  return null;
}
```

---

## Example Outcomes

### Land Cover Vulnerability Change 2050
- **Units shown:** `null` (nothing displayed)
- **Why:** No explicit units in metadata or description
- **User sees:**
  - Title: "Land Cover Vulnerability Change 2050 - Country"
  - Description: Full context in sidebar
  - Legend: Value ranges (0-0.1, 0.1-0.2, etc.)

### Oak Restoration Areas (TYPE)
- **Units shown:** `null` (nothing displayed)
- **Why:** No explicit units
- **User sees:**
  - Legend labels: "1-gallon or smaller", "3-gallon or smaller", "acorns"
  - These ARE the units (categorical, self-describing)

### Hypothetical Elevation Layer
- **Units shown:** `"meters"`
- **Why:** Explicit in metadata or description: `"units: meters"`
- **User sees:**
  - Legend header: "Units: meters"
  - Clear, explicit information

---

## Benefits

### ✅ Advantages
1. **Honest** - Never shows made-up information
2. **Accurate** - Only displays verified data
3. **Maintainable** - No layer-specific logic
4. **Future-proof** - Works for any new layers
5. **Clear expectations** - Users know to check descriptions for context

### 🎯 User Experience
- **For layers with units:** Clear unit label above legend
- **For layers without units:** Context available in sidebar description
- **For categorical legends:** Labels are self-describing (e.g., "1-gallon or smaller")

---

## Next Steps for TNC

To improve unit visibility, TNC should:

1. **Add `units` field** to service metadata where applicable
2. **Include units in descriptions** using patterns like:
   - `"units: [unit name]"`
   - `"measured in [unit name]"`
   - `"Layer Name ([unit name])"`
3. **Add units to field definitions** for numeric fields
4. **Standardize descriptions** to include data interpretation

---

**Date:** October 7, 2025  
**Status:** Final implementation  
**Philosophy:** Show only what's there, don't invent context
