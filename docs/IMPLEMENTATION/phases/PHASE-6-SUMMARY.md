# Phase 6: TNC ArcGIS Services — Quick Summary

**Created:** February 16, 2026  
**Status:** Planning complete, ready for implementation

---

## What Changed

**Phase Restructure:**
- Old Phase 6 (Polish) → renamed to Phase 7
- New Phase 6 inserted: TNC ArcGIS Feature Services
- 10 tasks created (29-43 hours estimated)

---

## Key Architectural Decisions

### 1. Layer-Centric Model (Not Service-Centric)

**What:** Each *layer* within a FeatureService is independently pinnable. The service itself is just an organizational container.

**Example:**
- "Wetlands FeatureService" has 3 layers: Polygons, Points, Transects
- User can pin "Polygons" without pinning "Points"
- Each layer gets its own row in Map Layers widget
- Each layer can have independent filters

**Why:** Maintains consistency with existing paradigm (one pin = one queryable entity).

---

### 2. Service-Level Activation for Multi-Layer Services

**What:** Clicking a multi-layer service row shows a service overview with a layer switcher dropdown.

**Left Sidebar Pattern:**
```
📊 Wetlands (3)              [▼]    ← Click = show service overview
     □ Polygons              [🔵👁] ← Pin/eye only
     □ Points                [  👁]
     □ Transects             [  👁]
```

**Right Sidebar (Service Overview):**
```
Layer:  [Polygons (Layer 0)    ▼]  ← Dropdown to switch layers

[Service description from Data Catalog]

Available Layers:
• Polygons (Layer 0) - Boundary polygons...
• Points (Layer 1) - Monitoring locations...
• Transects (Layer 2) - Survey lines...

[Browse Polygons →]  [📌 Pin Polygons]
```

**Why:** TNC's metadata (description, citations) lives at service level, not per-layer. Avoids duplicating descriptions.

---

### 3. Generic Filter UI (Phase 6 MVP)

**What:** Simple field/operator/value filter rows that work for any TNC layer schema.

**UI:**
```
Field          Operator     Value
[fire_year▼]   [= ▼]       [2024  ]
[acres    ▼]   [> ▼]       [100   ]

[+ Add Filter]  [Clear All]

WHERE fire_year = 2024 AND acres > 100

[Preview Results] → ✓ 42 features match
```

**Operators:** `=`, `≠`, `>`, `<`, `≥`, `≤`, `contains`, `starts with`, `ends with`, `in`, `is null`, `is not null`

**Why:** Scalable to 90+ TNC layers without custom code. Researcher audience (DFT-011) can handle SQL-like filters.

**Future (Phase 7):** Field type introspection → smart widgets (date pickers for date fields, sliders for numeric ranges).

---

### 4. Single-Layer Services = Standard Pattern

**What:** TNC services with only 1 layer skip the service-level activation pattern.

**Behavior:**
- Click layer in left sidebar → Right sidebar shows layer overview (not service overview)
- No layer dropdown (only one layer exists)
- [Browse Features →] and [📌 Pin Layer] buttons
- Works exactly like iNaturalist/ANiML/Dendra

**Why:** No need for complexity when there's only one layer.

---

## Implementation Notes

### Left Sidebar Changes
- Multi-layer services render as collapsible groups
- Service row click → activate service (show overview)
- Layer rows: pin/eye only (not activation targets)
- Expand/collapse animation: 300ms
- ARIA: `role="tree"`, `aria-expanded`, keyboard navigation (Arrow Right = expand, Arrow Left = collapse)

### Right Sidebar Components
1. **Service Overview (Multi-Layer):** Layer dropdown + service description + "Browse {Layer}" + "Pin {Layer}" buttons
2. **Generic Filter UI (Browse Tab):** Field/operator/value rows + "Add Filter" + "Preview Results" + WHERE clause preview

### Data Model Extensions
```typescript
// CatalogLayer additions:
isMultiLayerService?: boolean;
parentServiceId?: string;
siblingLayers?: CatalogLayer[];

// ActiveLayer additions:
isService?: boolean;
selectedSubLayerId?: string;

// New filter type:
TNCArcGISViewFilters {
  whereClause: string;
  fields?: Array<{ field, operator, value }>;
}
```

### Adapter Structure
```
src/v2/dataSources/tnc-arcgis/
  adapter.tsx              ← Main adapter (warmCache, RightSidebarContent, createMapLayer)
  ServiceOverview.tsx      ← Right sidebar service overview (multi-layer)
  GenericFilterUI.tsx      ← Field/operator/value filter builder
  
src/v2/services/tncArcgisService.ts
  buildServiceUrl()        ← Construct FeatureServer/MapServer/ImageServer URLs
  fetchLayerSchema()       ← Get field list, extent, geometry type
  queryFeatures()          ← Execute WHERE clause queries
  validateWhereClause()    ← Test query before pinning
```

---

## Design Principles Compliance

| Principle | Score | Notes |
|-----------|-------|-------|
| **Norman: Conceptual Model** | 🟢 | Layer-centric model consistent with existing paradigm |
| **Nielsen #4: Consistency** | 🟢 | TNC layers behave like iNat/ANiML/Dendra layers |
| **Nielsen #6: Recognition over Recall** | 🟡 | Generic filters require field knowledge; mitigated by tooltips |
| **Hick's Law** | 🟢 | Collapsed services reduce initial choice overload |
| **IA: Findability** | 🟢 | Search matches service + layer names; auto-expands on match |
| **IA: Progressive Disclosure** | 🟢 | 3-level hierarchy (category → service → layer) revealed progressively |
| **WCAG: Operable** | 🟢 | Keyboard nav + ARIA tree structure |

**Overall:** 17/18 green, 1 yellow. Strong cross-framework convergence.

---

## Iteration Strategy

This architecture is a **starting point**. After implementing:
1. Test with real users (researchers)
2. Evaluate: Is service-level activation intuitive? Is layer dropdown useful?
3. Iterate based on feedback

**Key questions to revisit:**
- Should layer rows also activate service (in addition to pin/eye)?
- Is the layer dropdown in Overview useful, or skip straight to Browse?
- Are generic filters sufficient, or need smart widgets sooner?

---

## Next Steps

1. **Merge current branches** (animl, iNaturalist, dendra) to `v2/main`
2. **Complete Task 0.9** (Dynamic Layer Registry) if not done
3. **Start Phase 6** on `v2/tnc-arcgis` branch
4. **Follow task order:** 6.1 (data model) → 6.2 (left sidebar) → 6.3 (service module) → 6.4 (adapter) → 6.5-6.7 (right sidebar + map) → 6.8-6.10 (search + QA) — **6.10 ✅ complete Feb 24, 2026** (manual UI checklist)

---

## Files Updated

- ✅ Created: `docs/IMPLEMENTATION/phases/phase-6-tnc-arcgis.md` (new phase document)
- ✅ Renamed: `phase-6-polish.md` → `phase-7-polish.md`
- ✅ Updated: `docs/master-plan.md` (phase status table, dependencies, phase documents list, change log)
- ✅ Updated: `docs/master-plan.md` (status by phase, change log)

---

## Questions for User (After Implementation)

1. Does service-level activation feel natural when exploring multi-layer services?
2. Is the layer dropdown in Overview tab useful, or would you prefer to skip directly to Browse?
3. Are the generic filters (field/operator/value) sufficient, or do you need smart widgets (date pickers, sliders) immediately?
4. Should clicking a layer row (not just service row) also work for activation?
5. Any confusion about the difference between service-level and layer-level interactions?
