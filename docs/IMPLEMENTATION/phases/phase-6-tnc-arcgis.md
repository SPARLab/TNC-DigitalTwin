# Phase 6: TNC ArcGIS Feature Services

**Status:** ⚪ Not Started  
**Progress:** 0 / 10 tasks  
**Branch:** `v2/tnc-arcgis`  
**Depends On:** Phase 0 (Foundation) — Task 0.9 (Dynamic Layer Registry)  
**Owner:** TBD

---

## Phase Goal

Create a generic adapter for TNC ArcGIS Feature Services and Map/Image Services that works for any layer in the Data Catalog. This phase handles the ~90+ TNC-hosted layers (wetlands, vegetation, fire perimeters, etc.) that are not covered by specialized adapters (iNaturalist, ANiML, Dendra, DataOne).

**Key Architectural Decision:** Each *layer* within a FeatureService is independently pinnable. Multi-layer services (e.g., "Wetlands" with Polygons/Points/Transects sub-layers) render as collapsible groups in the left sidebar. Clicking the service row shows a service-level overview with a layer switcher dropdown. Single-layer services behave like iNaturalist/ANiML (flat activation).

---

## Reference Documents

- **Master Plan:** `docs/master-plan.md`
- **Design Rationale:** See planning conversation (Feb 16, 2026) — service-level activation pattern for multi-layer TNC FeatureServices
- **Map Layers Widget Spec:** `docs/PLANNING/component-specs/map-layers-widget.md`
- **Data Catalog Hook:** `src/v2/hooks/useCatalogRegistry.ts`

---

## Task Status Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|--------------------------|-------------------|-------|
| **6.1** | ⚪ | — | Extend Data Model for Multi-Layer Services | Update `CatalogLayer`, `ActiveLayer` types; detect multi-layer services in catalog hook |
| **6.2** | ⚪ | — | Left Sidebar: Collapsible Service Groups | Render multi-layer services as expandable rows; layer rows show pin/eye only |
| **6.3** | ⚪ | — | TNC ArcGIS Service Module | Service URL builder, schema fetch, field list query |
| **6.4** | ⚪ | — | TNC ArcGIS Adapter Shell | Create adapter skeleton with warmCache, RightSidebarContent, createMapLayer |
| **6.5** | ⚪ | — | Right Sidebar: Service Overview (Multi-Layer) | Show service description, layer dropdown, "Browse {Layer}" and "Pin {Layer}" buttons |
| **6.6** | ⚪ | — | Right Sidebar: Generic Filter UI (MVP) | Field/Operator/Value rows, "Add Filter", "Preview Results", WHERE clause builder |
| **6.7** | ⚪ | — | Map Layer Rendering | Add FeatureLayer/MapImageLayer to map with definition expression from filters |
| **6.8** | ⚪ | — | Search Enhancement | Match service + layer names; expand parent service when layer matches |
| **6.9** | ⚪ | — | Keyboard Navigation & ARIA | Arrow keys for expand/collapse, ARIA tree structure, focus management |
| **6.10** | ⚪ | — | QA & Edge Cases | Single-layer services, empty results, malformed queries, schema fetch errors |

**Status Legend:**  
⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## Architecture Overview

### Data Model Hierarchy

```
TNC FeatureService (e.g., "Wetlands")
  ├─ Layer 0: Polygons       ← Pinnable, filterable
  ├─ Layer 1: Points         ← Pinnable, filterable
  └─ Layer 2: Transects      ← Pinnable, filterable
```

**Key Principle:** Each **layer** is the atomic unit. Layers can be pinned/filtered independently. The FeatureService is an organizational container (not pinnable itself).

### Left Sidebar Patterns

**Single-layer TNC service (flat row):**
```
│ 📄 Fire Perimeter 2024         [🔵👁] │ ← Click = activate layer
```

**Multi-layer TNC service (collapsible group):**
```
│ 📊 Wetlands (3)                [▼]    │ ← Click = activate service (show overview)
│      □ Polygons                [🔵👁] │ ← Pin/eye only (not activation target)
│      □ Points                  [  👁] │
│      □ Transects               [  👁] │
```

### Right Sidebar Patterns

**Service Overview (Multi-Layer):**
- Layer switcher dropdown
- Service description (from Data Catalog)
- List of available layers with descriptions
- "Browse {Layer} →" button (switches to Browse tab)
- "Pin {Layer}" button (adds selected layer to Map Layers widget)

**Browse Tab (Any TNC Layer):**
- Generic filter UI: field/operator/value rows
- "Add Filter" button (adds new row)
- "Preview Results" button (validates query, shows count)
- "Pin Layer" button (appears when layer not pinned)
- Result count display

---

## Task Details

### 6.1: Extend Data Model for Multi-Layer Services

**Goal:** Update types and catalog hook to detect and represent multi-layer services.

**Type Changes (`src/v2/types/index.ts`):**

```typescript
interface CatalogLayer {
  id: string;
  name: string;
  categoryId: string;
  dataSource: DataSource;
  icon?: string;
  catalogMeta?: {
    datasetId: number;
    serverBaseUrl: string;
    servicePath: string;
    hasFeatureServer: boolean;
    hasMapServer: boolean;
    hasImageServer: boolean;
    description?: string;
    layerIdInService?: number;
    // NEW:
    isMultiLayerService?: boolean;    // True if service has 2+ layers
    parentServiceId?: string;         // If this is a sub-layer
    siblingLayers?: CatalogLayer[];   // Other layers in same service
  };
}

interface ActiveLayer {
  id: string;
  layerId: string;
  name: string;
  dataSource: DataSource;
  isPinned: boolean;
  viewId?: string;
  featureId?: string | number;
  // NEW:
  isService?: boolean;                // True if activated service (multi-layer TNC)
  selectedSubLayerId?: string;        // Which layer selected in dropdown
}

// NEW: Filter state for TNC layers
interface TNCArcGISViewFilters {
  whereClause: string;                // SQL WHERE clause (e.g., "fire_year = 2024 AND acres > 100")
  fields?: Array<{                    // Parsed filter components (for UI)
    field: string;
    operator: string;
    value: string;
  }>;
}

// Add to PinnedLayer:
interface PinnedLayer {
  // ... existing fields ...
  tncArcgisFilters?: TNCArcGISViewFilters;
}
```

**Catalog Hook Changes (`src/v2/hooks/useCatalogRegistry.ts`):**

```typescript
// After fetching datasets, group by service to detect multi-layer services:
function detectMultiLayerServices(datasets: RawDataset[]): Map<string, RawDataset[]> {
  const serviceGroups = new Map<string, RawDataset[]>();
  
  for (const d of datasets) {
    const serviceKey = `${d.server_base_url}/${d.service_path}`;
    const layers = serviceGroups.get(serviceKey) ?? [];
    layers.push(d);
    serviceGroups.set(serviceKey, layers);
  }
  
  return serviceGroups;
}

// When creating CatalogLayer, check if service has multiple layers:
const serviceGroups = detectMultiLayerServices(rawDatasets);
const serviceKey = `${d.server_base_url}/${d.service_path}`;
const serviceLayers = serviceGroups.get(serviceKey) ?? [];

if (serviceLayers.length > 1) {
  // Multi-layer service: create parent + children
  const parentId = toLayerId(serviceLayers[0].id); // Use first layer's dataset ID as service ID
  const children: CatalogLayer[] = serviceLayers.map(sl => ({
    id: `${parentId}-layer-${sl.layer_id}`,
    name: `${d.service_name} — ${sl.display_title}`,
    categoryId,
    dataSource: 'tnc-arcgis',
    icon: 'Map',
    catalogMeta: {
      datasetId: sl.id,
      serverBaseUrl: sl.server_base_url,
      servicePath: sl.service_path,
      layerIdInService: sl.layer_id,
      parentServiceId: parentId,
      isMultiLayerService: true,
    },
  }));
  
  // Store parent + children relationship
  // ...
}
```

**Acceptance Criteria:**
- [ ] `CatalogLayer` type extended with multi-layer fields
- [ ] `ActiveLayer` type extended with service activation fields
- [ ] `TNCArcGISViewFilters` type added
- [ ] `useCatalogRegistry` detects multi-layer services and creates nested structure
- [ ] Single-layer services remain flat (no nesting)

**Estimated Time:** 2-3 hours

---

### 6.2: Left Sidebar: Collapsible Service Groups

**Goal:** Render multi-layer TNC services as expandable rows in the left sidebar.

**UI Pattern:**

```
┌────────────────────────────────────────┐
│ 🔥 Fire                        [v]     │
│   📄 Fire Perimeter 2024       [🔵👁] │  ← Single-layer (flat)
│   📊 Wetlands (3)              [▼]    │  ← Multi-layer service (collapsed)
│      □ Polygons (Layer 0)     [🔵👁] │  ← Sub-layer
│      □ Points (Layer 1)       [  👁] │
│      □ Transects (Layer 2)    [  👁] │
│   🗺️ Vegetation Communities    [🔵👁] │  ← Single-layer (flat)
└────────────────────────────────────────┘
```

**Styling:**

| Element | Styling |
|---------|---------|
| Service row (parent) | `bg-gray-50`, `font-medium`, chevron icon, count badge `(3)` |
| Layer rows (children) | Indented 16px, `bg-white`, normal font weight |
| Connectors (optional) | CSS `::before` pseudo-element, `1px solid #e2e8f0` |
| Collapse animation | `max-height` transition, 300ms ease-out |

**Interactions:**

| User Action | Result |
|-------------|--------|
| Click service name/chevron | Expand/collapse layer list |
| Click service row (not chevron) | Activate service → right sidebar shows overview |
| Hover layer row | Show pin/eye icons |
| Click layer pin icon | Add layer to Map Layers widget (not service) |
| Click layer eye icon | Toggle layer visibility on map |

**Component Structure:**

```typescript
// src/v2/components/LeftSidebar/ServiceGroup.tsx
interface ServiceGroupProps {
  service: CatalogLayer;           // Parent service
  layers: CatalogLayer[];          // Child layers
  isExpanded: boolean;
  onToggleExpand: () => void;
  onActivateService: () => void;   // Click service row → show overview
  onPinLayer: (layer: CatalogLayer) => void;
  onToggleLayerVisibility: (layer: CatalogLayer) => void;
}
```

**Acceptance Criteria:**
- [ ] Multi-layer services render as collapsible groups
- [ ] Single-layer services remain flat (unchanged)
- [ ] Expand/collapse animation smooth (300ms)
- [ ] Clicking service row activates service (shows overview in right sidebar)
- [ ] Layer pin/eye icons functional (do NOT activate service)
- [ ] Keyboard navigation: Arrow Right = expand, Arrow Left = collapse
- [ ] ARIA: `role="tree"`, `aria-expanded`, `aria-level` attributes

**Estimated Time:** 4-6 hours

---

### 6.3: TNC ArcGIS Service Module

**Goal:** Create utility functions for querying TNC ArcGIS services.

**File:** `src/v2/services/tncArcgisService.ts`

**Functions:**

```typescript
/** Build full service URL from catalog metadata */
export function buildServiceUrl(meta: CatalogLayer['catalogMeta']): string {
  const base = meta.serverBaseUrl.replace(/\/$/, '');
  const path = meta.servicePath.replace(/^\//, '');
  const type = meta.hasFeatureServer ? 'FeatureServer' : 
               meta.hasMapServer ? 'MapServer' : 
               'ImageServer';
  const layerId = meta.layerIdInService ?? 0;
  return `${base}/rest/services/${path}/${type}/${layerId}`;
}

/** Fetch layer schema (fields, extent, geometry type) */
export async function fetchLayerSchema(url: string): Promise<LayerSchema> {
  const res = await fetch(`${url}?f=json`);
  if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`);
  const json = await res.json();
  return {
    fields: json.fields ?? [],
    geometryType: json.geometryType,
    extent: json.extent,
    description: json.description,
    copyrightText: json.copyrightText,
  };
}

/** Query features with WHERE clause */
export async function queryFeatures(url: string, where: string, options?: {
  outFields?: string[];
  returnGeometry?: boolean;
  returnCountOnly?: boolean;
}): Promise<FeatureQueryResult> {
  const params = new URLSearchParams({
    where,
    outFields: options?.outFields?.join(',') ?? '*',
    returnGeometry: String(options?.returnGeometry ?? true),
    returnCountOnly: String(options?.returnCountOnly ?? false),
    f: 'json',
  });
  
  const res = await fetch(`${url}/query?${params}`);
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  const json = await res.json();
  
  if (json.error) {
    throw new Error(`ArcGIS error: ${json.error.message}`);
  }
  
  return {
    features: json.features ?? [],
    count: json.count ?? json.features?.length ?? 0,
  };
}

/** Validate WHERE clause by running count-only query */
export async function validateWhereClause(url: string, where: string): Promise<{
  valid: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const result = await queryFeatures(url, where, { returnCountOnly: true });
    return { valid: true, count: result.count };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
```

**Acceptance Criteria:**
- [ ] `buildServiceUrl` constructs correct URLs for FeatureServer/MapServer/ImageServer
- [ ] `fetchLayerSchema` returns field list, geometry type, extent
- [ ] `queryFeatures` executes queries with WHERE clause
- [ ] `validateWhereClause` detects syntax errors before pin
- [ ] Error handling for network failures, malformed responses

**Estimated Time:** 3-4 hours

---

### 6.4: TNC ArcGIS Adapter Shell

**Goal:** Create data source adapter for TNC ArcGIS layers.

**File:** `src/v2/dataSources/tnc-arcgis/adapter.tsx`

**Adapter Interface:**

```typescript
export const tncArcgisAdapter: DataSourceAdapter = {
  id: 'tnc-arcgis',
  
  warmCache: async (layer, context) => {
    const url = buildServiceUrl(layer.catalogMeta!);
    const schema = await fetchLayerSchema(url);
    return { schema, extent: schema.extent };
  },
  
  RightSidebarContent: TNCArcGISRightSidebar,
  
  createMapLayer: (view, layer, filters) => {
    const url = buildServiceUrl(layer.catalogMeta!);
    const whereClause = filters?.whereClause ?? '1=1';
    
    return new FeatureLayer({
      url,
      definitionExpression: whereClause,
      outFields: ['*'],
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          color: [59, 130, 246], // blue
          size: 6,
        },
      },
    });
  },
  
  LegendWidget: null, // No legend for TNC layers (use map's default legend)
};
```

**Context Provider:**

```typescript
// src/v2/context/TNCArcGISContext.tsx
interface TNCArcGISContextValue {
  schemas: Map<string, LayerSchema>;  // Cached schemas per layer
  loadSchema: (layer: CatalogLayer) => Promise<void>;
}
```

**Acceptance Criteria:**
- [ ] Adapter registered in `src/v2/dataSources/registry.ts`
- [ ] `warmCache` fetches and caches layer schema
- [ ] `createMapLayer` renders FeatureLayer with WHERE clause
- [ ] Context provider caches schemas to avoid redundant fetches
- [ ] Adapter works for both FeatureServer and MapServer layers

**Estimated Time:** 3-4 hours

---

### 6.5: Right Sidebar: Service Overview (Multi-Layer)

**Goal:** Show service-level overview with layer switcher for multi-layer TNC services.

**Component:** `src/v2/components/RightSidebar/TNCArcGIS/ServiceOverview.tsx`

**UI Layout:**

```
┌────────────────────────────────────────┐
│ Overview | Browse                      │
├────────────────────────────────────────┤
│ 📊 Wetlands FeatureService             │
│                                        │
│ Layer:  [Polygons (Layer 0)    ▼]     │ ← Dropdown
│                                        │
│ ─────────────────────────────────────  │
│                                        │
│ Description                            │
│ This dataset contains wetland mapping  │
│ data for the Dangermond Preserve...   │
│                                        │
│ Available Layers                       │
│ • Polygons (Layer 0)                   │
│   Wetland boundary polygons...         │
│                                        │
│ • Monitoring Points (Layer 1)          │
│   Field monitoring locations...        │
│                                        │
│ • Transects (Layer 2)                  │
│   Vegetation survey transects...       │
│                                        │
│ Source                                 │
│ [server URL]                           │
│                                        │
├────────────────────────────────────────┤
│ [Browse Polygons →]  [📌 Pin Polygons] │
└────────────────────────────────────────┘
```

**Behavior:**
- Layer dropdown shows all layers in service
- Changing dropdown updates action button labels ("Browse **Polygons**" → "Browse **Points**")
- **[Browse {Layer} →]** button switches to Browse tab, pre-selects layer
- **[📌 Pin {Layer}]** button adds selected layer to Map Layers widget
- If layer already pinned, show "Pinned ✓" label instead of button

**Single-Layer Override:**

If TNC service has only 1 layer, skip the service overview pattern entirely:
- Activate layer directly (like iNaturalist)
- Show layer overview (not service overview)
- No layer dropdown
- [Browse Features →] and [📌 Pin Layer] buttons

**Acceptance Criteria:**
- [ ] Service overview displays service description from Data Catalog
- [ ] Layer dropdown populated from sibling layers
- [ ] Changing dropdown updates button labels
- [ ] "Browse" button switches to Browse tab with layer pre-selected
- [ ] "Pin" button adds selected layer to Map Layers widget
- [ ] Single-layer services skip this pattern (use standard overview)

**Estimated Time:** 4-5 hours

---

### 6.6: Right Sidebar: Generic Filter UI (MVP)

**Goal:** Build field/operator/value filter rows for TNC layer queries.

**Component:** `src/v2/components/RightSidebar/TNCArcGIS/GenericFilterUI.tsx`

**UI Layout:**

```
┌────────────────────────────────────────┐
│ Overview | Browse                      │
├────────────────────────────────────────┤
│ Filter Fire Perimeters                 │
│                                        │
│ Field          Operator     Value      │
│ [fire_year▼]   [= ▼]       [2024  ]   │
│ [acres    ▼]   [> ▼]       [100   ]   │
│                                        │
│ [+ Add Filter]  [Clear All]            │
│                                        │
│ ─────────────────────────────────────  │
│                                        │
│ WHERE fire_year = 2024 AND acres > 100 │ ← SQL preview
│                                        │
│ [Preview Results]                      │
│ ✓ 42 features match                    │
│                                        │
├────────────────────────────────────────┤
│ [📌 Pin Layer]                         │
└────────────────────────────────────────┘
```

**Filter Row Operators:**

| Operator | SQL | Use Case |
|----------|-----|----------|
| `=` | `field = value` | Exact match |
| `≠` | `field <> value` | Not equal |
| `>` | `field > value` | Greater than |
| `<` | `field < value` | Less than |
| `≥` | `field >= value` | Greater or equal |
| `≤` | `field <= value` | Less or equal |
| `contains` | `field LIKE '%value%'` | Text substring |
| `starts with` | `field LIKE 'value%'` | Text prefix |
| `ends with` | `field LIKE '%value'` | Text suffix |
| `in` | `field IN (value1, value2)` | Multiple values (comma-separated) |
| `is null` | `field IS NULL` | Null check (no value input) |
| `is not null` | `field IS NOT NULL` | Not null check (no value input) |

**Field Dropdown:**
- Populated from layer schema (`fetchLayerSchema` in warmCache)
- Show field alias if available (e.g., `fire_year` → "Fire Year")
- Tooltip shows field type (esriFieldTypeInteger, esriFieldTypeString, etc.)

**WHERE Clause Builder:**

```typescript
function buildWhereClause(filters: FilterRow[]): string {
  const clauses = filters.map(f => {
    const { field, operator, value } = f;
    
    switch (operator) {
      case '=': return `${field} = ${value}`;
      case '!=': return `${field} <> ${value}`;
      case '>': return `${field} > ${value}`;
      case '<': return `${field} < ${value}`;
      case '>=': return `${field} >= ${value}`;
      case '<=': return `${field} <= ${value}`;
      case 'contains': return `${field} LIKE '%${value}%'`;
      case 'starts with': return `${field} LIKE '${value}%'`;
      case 'ends with': return `${field} LIKE '%${value}'`;
      case 'in': return `${field} IN (${value})`;
      case 'is null': return `${field} IS NULL`;
      case 'is not null': return `${field} IS NOT NULL`;
      default: return `${field} = ${value}`;
    }
  });
  
  return clauses.join(' AND ') || '1=1';
}
```

**Preview Results:**
- Button runs `validateWhereClause` (count-only query)
- Shows green checkmark + count if valid: "✓ 42 features match"
- Shows red error if invalid: "⚠ SQL error: invalid field name 'fire_yeaar'"

**Acceptance Criteria:**
- [ ] Filter rows support field/operator/value selection
- [ ] Field dropdown populated from layer schema
- [ ] Operators cover common query patterns (=, >, LIKE, IN, NULL)
- [ ] WHERE clause builder generates correct SQL
- [ ] "Preview Results" validates query and shows count
- [ ] "Clear All" removes all filters
- [ ] Error feedback for malformed queries

**Estimated Time:** 6-8 hours

---

### 6.7: Map Layer Rendering

**Goal:** Render TNC layers on map with filters applied.

**Implementation:** Already in adapter (Task 6.4), but needs integration testing.

**Map Behavior:**

| State | Map Display |
|-------|-------------|
| Layer pinned, no filters | All features visible |
| Layer pinned, filters applied | Only matching features visible (via `definitionExpression`) |
| Layer eye toggled OFF | Layer hidden (opacity 0 or removed) |
| Multiple TNC layers pinned | All visible with independent filters |

**Styling:**

- Default: Simple renderer (blue circles for points, blue lines for polylines, blue fill for polygons)
- Future (Phase 7): Smart symbology based on field values (e.g., color by fire year)

**Acceptance Criteria:**
- [ ] FeatureLayer added to map when layer pinned
- [ ] `definitionExpression` updates when filters change
- [ ] Layer visibility controlled by eye toggle in Map Layers widget
- [ ] Multiple TNC layers can be pinned simultaneously
- [ ] Z-order controlled by Map Layers widget drag-reorder

**Estimated Time:** 2-3 hours

---

### 6.8: Search Enhancement

**Goal:** Make left sidebar search match both service names and layer names.

**Current Behavior:**
- Search matches layer names only

**New Behavior:**
- Search matches **service name OR layer name**
- If layer matches but service is collapsed, auto-expand service to show layer
- Highlight matched text in search results

**Example:**

User types "wetlands" → Results:
- ✅ **Wetlands** (service name) — shows all 3 layers
- ✅ **Vegetation Communities** (contains "Wetland" in description — optional)

User types "polygons" → Results:
- ✅ Wetlands → **Polygons** (layer name) — auto-expands service, highlights layer

**Implementation:**

```typescript
function searchLayers(query: string, categories: Category[]): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const cat of categories) {
    for (const layer of cat.layers) {
      // Match service name
      if (layer.name.toLowerCase().includes(lowerQuery)) {
        results.push({ layer, matchType: 'service' });
      }
      
      // Match layer names (if multi-layer service)
      if (layer.catalogMeta?.siblingLayers) {
        for (const sibling of layer.catalogMeta.siblingLayers) {
          if (sibling.name.toLowerCase().includes(lowerQuery)) {
            results.push({ layer: sibling, matchType: 'layer', parentService: layer });
          }
        }
      }
    }
  }
  
  return results;
}
```

**Acceptance Criteria:**
- [ ] Search matches service names
- [ ] Search matches layer names within services
- [ ] Matching layers auto-expand parent service
- [ ] Highlight matched text in results
- [ ] Clear search restores collapsed state

**Estimated Time:** 2-3 hours

---

### 6.9: Keyboard Navigation & ARIA

**Goal:** Ensure TNC service groups are keyboard accessible.

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| Tab | Navigate between service rows and layer rows |
| Arrow Right | Expand service (if collapsed) |
| Arrow Left | Collapse service (if expanded) |
| Arrow Down | Move to next row |
| Arrow Up | Move to previous row |
| Enter/Space | Activate service or toggle layer pin |

**ARIA Structure:**

```html
<div role="tree" aria-label="Data Catalog Layers">
  <div role="treeitem" aria-level="1" aria-expanded="false">
    <!-- Service row -->
  </div>
  <div role="group">
    <div role="treeitem" aria-level="2">
      <!-- Layer row -->
    </div>
    <div role="treeitem" aria-level="2">
      <!-- Layer row -->
    </div>
  </div>
</div>
```

**Screen Reader Announcements:**

- Expand service: "Wetlands service expanded, 3 layers"
- Collapse service: "Wetlands service collapsed"
- Pin layer: "Wetlands Polygons layer pinned"
- Unpin layer: "Wetlands Polygons layer unpinned"

**Acceptance Criteria:**
- [ ] Arrow keys navigate between service/layer rows
- [ ] Arrow Right/Left expand/collapse services
- [ ] Tab order follows visual hierarchy (service → layers)
- [ ] `role="tree"` and `aria-level` attributes correct
- [ ] Screen reader announces expand/collapse/pin actions
- [ ] Focus visible on all interactive elements

**Estimated Time:** 3-4 hours

---

### 6.10: QA & Edge Cases

**Goal:** Test edge cases and error states.

**Test Scenarios:**

| Scenario | Expected Behavior |
|----------|-------------------|
| Service with 1 layer | Renders as flat row (not collapsible group) |
| Service with 10+ layers | Scrollable layer list, performance OK |
| Invalid WHERE clause | Error toast: "SQL error: [message]" |
| Service schema fetch fails | Error toast: "Failed to load layer schema" |
| No features match filter | "0 features match" (not error) |
| User pins same layer twice | Second pin attempt shows "Already pinned" |
| User switches layers in dropdown | Actions update (Browse/Pin buttons) |
| User collapses service while layer pinned | Pinned layer remains in Map Layers widget |
| Search with no matches | "No layers found" empty state |
| Malformed service URL in catalog | Error: "Invalid service URL" |

**Error Handling:**

- Network errors: Show toast with retry option
- SQL errors: Show inline error under WHERE preview
- Schema fetch errors: Disable filter UI, show "Schema unavailable" message
- Empty results: Not an error — show "0 features match" (allow user to adjust filters)

**Acceptance Criteria:**
- [ ] All edge cases tested and handled gracefully
- [ ] Error messages are actionable (e.g., "Retry", "Edit Query")
- [ ] No crashes from malformed data
- [ ] Performance acceptable with 10+ layers in service
- [ ] Single-layer services work correctly (flat pattern)

**Estimated Time:** 4-6 hours

---

## Design Decisions Summary

### Why Service-Level Activation?

**Problem:** TNC services have metadata (description, citations) at the service level, not per-layer.

**Solution:** Click service row → right sidebar shows overview with layer switcher. User reads overview, then picks layer to browse/pin.

**Rationale:**
- Matches TNC's actual data structure (service = container with shared metadata)
- Avoids duplicating descriptions 3x (once per layer)
- Supports exploration workflow: "What is this service?" → read overview → "I want this layer" → browse/pin

### Why Layer-Centric Pinning?

**Problem:** Multi-layer services could be pinned as groups (all layers share one row in Map Layers widget) or individually (each layer gets own row).

**Solution:** Each **layer** is independently pinnable. Service is organizational only.

**Rationale:**
- Maintains consistency with existing paradigm (one pin = one queryable entity)
- Allows independent filters per layer (Polygons filtered by year, Points filtered by status)
- Fits within current Map Layers widget (no modifications needed)

### Why Generic Filter UI?

**Problem:** Custom filters (like iNaturalist's taxon picker) don't scale to 90+ TNC layers with diverse schemas.

**Solution:** Generic field/operator/value rows that work for any schema.

**Rationale:**
- Scalable to any TNC layer without custom code
- Target audience is researchers (DFT-011) — comfortable with SQL-like filters
- Phase 7 can add smart widgets (date pickers, sliders) via field type introspection

### Why Collapsible Service Groups?

**Problem:** Multi-layer services multiply item count in left sidebar (90+ layers → 150+ with sub-layers).

**Solution:** Services with 2+ layers render as collapsible groups. Collapsed by default.

**Rationale:**
- Reduces initial choice overload (Hick's Law)
- Progressive disclosure — expand only services of interest
- Search provides alternate findability path (bypasses hierarchy)

---

## Tradeoffs & Accepted Risks

| Tradeoff | Risk | Mitigation |
|----------|------|------------|
| **Service-level overview = new pattern** | Inconsistent with iNat/ANiML (always layer-level activation) | Only applies to multi-layer TNC services. Single-layer TNC services use standard pattern. |
| **Generic filters less discoverable** | Users must know field names (`fire_year`) | Tooltips show field aliases. "Preview Results" validates before pin. Phase 7 can add smart widgets. |
| **Text-only values = syntax errors** | User typos break queries (`'2024'` vs `2024`) | "Preview Results" button catches errors before pin. Show clear error feedback. |
| **3-level hierarchy** | More clicks to reach layers | Search bypasses hierarchy. Collapsed-by-default reduces clutter. |
| **No custom UI per layer** | Less polished than iNat taxon picker | Acceptable for Phase 6 MVP. Researcher audience can handle generic filters (DFT-011). |

---

## Future Enhancements (Phase 7+)

- **Field type introspection:** Detect date/numeric/string fields from schema, render smart widgets (date pickers, sliders, coded-value dropdowns)
- **Smart symbology:** Color polygons by attribute (e.g., fire year gradient), size points by numeric field
- **Advanced queries:** Support OR logic, spatial filters (within extent, intersects polygon)
- **Batch pin:** Select multiple layers from service, pin all at once
- **Service-level bookmarks:** Save service + layer selection as reusable preset

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | - | Created Phase 6 document for TNC ArcGIS Feature Services. Renumbered old Phase 6 (Polish) to Phase 7. | Claude |

---

## Notes

**Iteration Strategy:** This architecture is a starting point. After implementing, we'll review the UX and iterate based on actual usage. Key questions to revisit:
- Is service-level activation intuitive, or should layer rows also activate?
- Is the layer dropdown in Overview useful, or should we skip straight to Browse?
- Are generic filters sufficient, or do we need smart widgets sooner?

**Branch Strategy:** Develop on `v2/tnc-arcgis` branch. Merge to `v2/main` after all 10 tasks complete and QA passes.
