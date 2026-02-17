# Phase 6: TNC ArcGIS Feature Services

**Status:** 🟡 In Progress  
**Progress:** 9 / 20 tasks  
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
| **6.1** | 🟢 | 2026-02-16 13:01 PST | Extend Data Model for Multi-Layer Services | Added multi-layer metadata fields/types and service-group detection in `useCatalogRegistry`; single-layer behavior preserved |
| **6.2** | 🟢 | 2026-02-16 13:07 PST | Left Sidebar: Collapsible Service Groups | Added `ServiceGroup` + controls-only child rows, service activation, 300ms expand/collapse, Arrow Left/Right + ARIA attributes |
| **6.3** | 🟢 | 2026-02-16 13:11 PST | TNC ArcGIS Service Module | Added `src/v2/services/tncArcgisService.ts` with service URL builder, schema fetch, feature query, and WHERE validation helpers with malformed/network/ArcGIS error handling |
| **6.4** | 🟢 | 2026-02-16 13:15 PST | TNC ArcGIS Adapter Shell | Added `tnc-arcgis` adapter + context warm-cache hook, dynamic registry wiring, and map-layer factory support for FeatureServer/MapServer |
| **6.5** | 🟢 | 2026-02-16 13:29 PST | Right Sidebar: Service Overview (Multi-Layer) | Added service-level overview in `TNCArcGISOverviewTab` with sub-layer dropdown, layer list, dynamic Browse/Pin actions, pinned badge state, and service sub-layer selection state in `LayerContext` |
| **6.6** | 🟢 | 2026-02-16 14:22 PST | Right Sidebar: Generic Filter UI (MVP) | Added `GenericFilterUI` + `TNCArcGISBrowseTab` schema-driven filters, SQL WHERE builder, preview validation, and LayerContext sync for TNC filter metadata |
| **6.7** | 🟢 | 2026-02-16 13:42 PST | Map Layer Rendering | Synced TNC `definitionExpression` updates from filter changes and added map z-order sync from Map Layers drag-reorder in `useMapLayers` |
| **6.8** | ⚪ | — | Search Enhancement | Match service + layer names; expand parent service when layer matches |
| **6.9** | ⚪ | — | Keyboard Navigation & ARIA | Arrow keys for expand/collapse, ARIA tree structure, focus management |
| **6.10** | ⚪ | — | QA & Edge Cases | Single-layer services, empty results, malformed queries, schema fetch errors |
| **6.11** | 🟡 | 2026-02-16 16:37 PST | Capability-Aware Browse UX | Legend display moved out of right-sidebar Browse and into a floating map widget (bottom-right) for active TNC layers, while preserving V1-style `/legend` → renderer fallback and unique-value selection behavior |
| **6.12** | 🟡 | 2026-02-16 14:01 PST | Terminology + CTA Realignment | Decision locked: remove right-sidebar pin actions for now; keep pinning in left sidebar + Map Layers widget only |
| **6.13** | 🟡 | 2026-02-16 16:15 PST | Multi-Layer Service Discoverability | In progress: added stable left-sidebar scrollbar gutter (`scroll-area-left-sidebar`) to prevent content width shifting when scrollbar appears/disappears; service-group spacing refinements retained |
| **6.14** | 🟡 | 2026-02-16 17:05 PST | Service Reference + External Viewer | WIP: right-sidebar Browse focuses on source actions (overlay iframe + new tab); legend controls live in floating map widget. Legend icon sync (6.15) partially addressed but not fully resolved — see handoff below |
| **6.15** | 🟢 | 2026-02-16 18:45 PST | Legend Iconography Parity + Symbol-Aware Filtering | Complete: esriPMS (picture marker) symbols extract `imageData` + `contentType` from renderer JSON — resolves broken legend icons for Oil Seeps and PMS layers. LegendSwatch with `onError` fallback. UX refinements: Select All/Clear All in header next to Legend; layer name above items; stable selection box (no layout shift); removed redundant "Selected" text. Broader parity audit for other layer types deferred. |
| **6.16** | 🟢 | 2026-02-16 19:20 PST | Pinned Layer Opacity Control | Complete: added right-sidebar opacity slider (0-100%) for pinned TNC ArcGIS layers and synced ArcGIS layer `opacity` in map behavior; TNC Browse tab hidden so controls stay in right sidebar overview |
| **6.17** | ⚪ | — | Generic Layer Table View (Feature Layers) | Add table view for feature layers: button in Browse tab to view layer table (ArcGIS-style feature table); for inspecting columns/schema; generic across all feature layers, not TNC-only |
| **6.18** | ⚪ | — | TNC Data Catalog Source URL | Use TNC user-friendly data catalog URL when available instead of raw FeatureServer URL; research V1 discovery service; current source shows incorrect/technical URL |
| **6.19** | ⚪ | — | Overview: Source Actions (Overlay + New Tab) | Move overlay iframe and open-in-new-tab buttons from Browse tab into Overview tab; both actions live in right-sidebar Overview when layer selected |
| **6.20** | ⚪ | — | Right Sidebar: Layer + Service Hierarchy Communication | Visually communicate: selected layer (e.g., Oil Seeps) is from feature service (e.g., Coastal Marine Data), which is part of TNC ArcGIS catalog; show both layer context and feature service overview |

**Status Legend:**  
⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

### Handoff for 6.15 (Legend Iconography Parity) — Task Complete

**Task 6.15 complete (Feb 16, 2026).** esriPMS picture-marker symbols now render correctly in the legend via `imageData` + `contentType` extraction. UX refinements shipped: Select All/Clear All in header, layer name above items, stable selection box (no layout shift), blue highlight only (no redundant "Selected" text).

**Optional future work:** If other layer types (beyond esriPMS) show mismatched legend icons, inspect live ArcGIS layer metadata (`?f=json` → `drawingInfo.renderer`), compare to `parseRendererLegend` expectations, and consider `symbolUtils.getDisplayedSymbol` if the layer instance is available in React context.

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
- Source actions: Open Overlay, Open in New Tab (Task 6.19)
- Layer → Service → TNC catalog hierarchy display (Task 6.20)

**Browse Tab (Any TNC Layer):**
- Generic filter UI: field/operator/value rows
- "Add Filter" button (adds new row)
- "Preview Results" button (validates query, shows count)
- "View Layer Table" button (Task 6.17) — opens table view for schema/column inspection
- "Pin Layer" button (appears when layer not pinned)
- Result count display
- *Note:* Source actions (Overlay, New Tab) move to Overview tab (Task 6.19)

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
- [x] `CatalogLayer` type extended with multi-layer fields
- [x] `ActiveLayer` type extended with service activation fields
- [x] `TNCArcGISViewFilters` type added
- [x] `useCatalogRegistry` detects multi-layer services and creates nested structure
- [x] Single-layer services remain flat (no nesting)

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
- [x] Multi-layer services render as collapsible groups
- [x] Single-layer services remain flat (unchanged)
- [x] Expand/collapse animation smooth (300ms)
- [x] Clicking service row activates service (shows overview in right sidebar)
- [x] Layer pin/eye icons functional (do NOT activate service)
- [x] Keyboard navigation: Arrow Right = expand, Arrow Left = collapse
- [x] ARIA: `role="tree"`, `aria-expanded`, `aria-level` attributes

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
- [x] `buildServiceUrl` constructs correct URLs for FeatureServer/MapServer/ImageServer
- [x] `fetchLayerSchema` returns field list, geometry type, extent
- [x] `queryFeatures` executes queries with WHERE clause
- [x] `validateWhereClause` detects syntax errors before pin
- [x] Error handling for network failures, malformed responses

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
- [x] Adapter registered in `src/v2/dataSources/registry.ts`
- [x] `warmCache` fetches and caches layer schema
- [x] `createMapLayer` renders FeatureLayer with WHERE clause
- [x] Context provider caches schemas to avoid redundant fetches
- [x] Adapter works for both FeatureServer and MapServer layers

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
- [x] Service overview displays service description from Data Catalog
- [x] Layer dropdown populated from sibling layers
- [x] Changing dropdown updates button labels
- [x] "Browse" button switches to Browse tab with layer pre-selected
- [x] "Pin" button adds selected layer to Map Layers widget
- [x] Single-layer services skip this pattern (use standard overview)

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
- [x] Filter rows support field/operator/value selection
- [x] Field dropdown populated from layer schema
- [x] Operators cover common query patterns (=, >, LIKE, IN, NULL)
- [x] WHERE clause builder generates correct SQL
- [x] "Preview Results" validates query and shows count
- [x] "Clear All" removes all filters
- [x] Error feedback for malformed queries

**Estimated Time:** 6-8 hours

---

### 6.7: Map Layer Rendering

**Goal:** Render TNC layers on map with filters applied.

**Implementation:** Completed integration in `useMapLayers` (reactive WHERE sync + pinned-layer reorder sync).

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
- [x] FeatureLayer added to map when layer pinned
- [x] `definitionExpression` updates when filters change
- [x] Layer visibility controlled by eye toggle in Map Layers widget
- [x] Multiple TNC layers can be pinned simultaneously
- [x] Z-order controlled by Map Layers widget drag-reorder

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

### 6.11: Capability-Aware Browse UX (Feedback Pivot)

**Goal:** Avoid showing SQL-style filtering UI for layer types where it does not match user mental models.

**Problem (User Feedback):**
- Image-focused layers currently show field/operator/value query builder, which feels incorrect and confusing.
- Users expect immediate visual exploration first, not query authoring first.

**New Behavior:**
- **FeatureServer (queryable):** Default to records/table-first exploration. Filters move behind optional "Advanced Filter".
- **MapServer/ImageServer (non-feature-first):** Hide SQL builder; show legend, symbology/source metadata, and view controls.
- Always show a concise capability chip in Overview/Browse: `Feature`, `Map Image`, or `Imagery`.
- For narrow right-sidebar constraints, records view may render as a map-overlay panel/drawer instead of in-sidebar table.

**Decision Notes (Feb 16, 2026):**
- User confirmed table-first records browsing for FeatureServer layers.
- User explicitly called out right-sidebar width constraints; evaluate map-overlay records panel pattern.

**Acceptance Criteria:**
- [ ] Query builder renders only for layers that are feature-query capable
- [ ] Non-feature layers show no field/operator/value controls
- [ ] Capability label is visible and consistent in right sidebar
- [ ] Empty/confusing "Browse" states replaced with clear, layer-type-specific guidance

**Estimated Time:** 4-6 hours

---

### 6.12: Terminology + CTA Realignment (Feedback Pivot)

**Goal:** Align language and actions with established user mental model ("discover in left sidebar, persist in Map Layers").

**Problem (User Feedback):**
- "Browse Features" is ambiguous for non-feature layers.
- Pinning from right sidebar feels inconsistent with learned workflow.

**New Behavior:**
- Replace vague labels (`Browse Features`) with capability-aware labels (e.g., `Explore Layer`, `View Records`, `View Raster Info`).
- Remove right-sidebar pin actions for now; reinforce pinning from left sidebar / Map Layers only.
- Add short helper copy at top of TNC views: "Select and pin layers in the left sidebar. Use this panel to inspect details."

**Decision Notes (Feb 16, 2026):**
- User requested removing right-sidebar pin entirely for this phase and revisiting later.

**Acceptance Criteria:**
- [ ] Right sidebar CTA text is capability-aware and non-ambiguous
- [ ] Primary pinning affordance remains consistent with existing app patterns
- [ ] No duplicate high-emphasis CTAs that compete for the same action
- [ ] First-time users can identify where to pin within 5 seconds (heuristic walkthrough)

**Estimated Time:** 3-5 hours

---

### 6.13: Multi-Layer Service Discoverability (Feedback Pivot)

**Goal:** Make known service groups easy to find and inspect in the left sidebar.

**Problem (User Feedback):**
- Expected services like "Coastal and Marine Data" are hard to locate.
- Search currently feels broken when matching child layers under collapsed parents.

**New Behavior:**
- Search must match service names and child layer names.
- If child layer matches, parent service auto-expands and remains visible.
- Add lightweight path context under search result rows (Category > Service > Layer).
- Ensure service-parent rows are never hidden when any child matches.

**Acceptance Criteria:**
- [ ] Search works for both service and child-layer names
- [ ] Parent service auto-expands for child match
- [ ] No blank category blocks during service/child filtered states
- [ ] "Coastal and Marine Data" (and peers) are discoverable via category OR search

**Status Update (Feb 16, 2026 15:28 PST):**
- ✅ Service containers are now visually identified (`Service`) and treated as non-pinnable.
- ✅ Service containers no longer follow normal Active/Pin map-layer behavior.
- ⚠️ **Not complete yet:** clicking `Coastal and Marine Data` does not consistently render discovered child layer rows in the left sidebar.
- ⚠️ Current behavior still relies on right-sidebar "Available Layers" list for visibility of discovered children in this case.
- 🎯 Remaining requirement: service click in left sidebar must reveal concrete child layer rows there; selecting child rows should drive normal Active -> Pin -> Pinned flow.

**Estimated Time:** 4-6 hours

---

### 6.14: Service Reference + External Viewer (Feedback Pivot)

**Goal:** Restore trusted source navigation from the original workflow.

**Problem (User Feedback):**
- Users expect a service-level website/viewer reference and direct handoff to external map pages.

**New Behavior:**
- Show service reference card in Overview with:
  - source URL label
  - optional embedded iframe preview (if allowed by target)
  - `Open in new tab` action
- If iframe blocked, show graceful fallback with explanatory message.

**Acceptance Criteria:**
- [ ] Service reference card visible for TNC services
- [ ] `Open in new tab` action present and functional
- [ ] iframe fallback handles CSP/X-Frame-Options failures without breaking layout
- [ ] Behavior mirrors legacy app expectations where possible

**Estimated Time:** 3-5 hours

---

### 6.16: Pinned Layer Opacity Control

**Goal:** Allow users to change the opacity of pinned TNC ArcGIS layers on the map.

**Context:** V1 provided an opacity slider when a TNC MAP_LAYER was active. V2 currently lacks this; pinned layers render at full opacity.

**Implementation:**
- Add opacity control to Map Layers widget for pinned TNC ArcGIS layers (and other ArcGIS-backed layers where applicable)
- Slider range: 0–100% (or 0–1)
- Persist opacity in pinned layer state (or session) if desired
- Apply via `FeatureLayer.opacity` / `MapImageLayer.opacity` / `ImageryLayer.opacity` as appropriate

**Acceptance Criteria:**
- [ ] Opacity slider visible for pinned TNC ArcGIS layers in Map Layers widget
- [ ] Slider adjusts layer transparency on map in real time
- [ ] Default opacity is 100%
- [ ] Works for FeatureServer, MapServer, and ImageServer layer types

**Estimated Time:** 2–3 hours

---

### 6.17: Generic Layer Table View (Feature Layers)

**Goal:** Add a table view for feature layers so users (especially backend/data folks) can inspect the layer table—columns, schema, sample rows—similar to ArcGIS websites.

**Context:** TNC Browse tab is not about browsing observations like iNaturalist. Instead, users need a way to inspect the layer’s attribute table. This table view should be **generic** and reusable for all feature layers (TNC, Dendra, etc.), not TNC-only.

**Implementation:**
- Add a "View Layer Table" (or similar) button in the Browse tab for feature layers
- On click, show a table view (inline or overlay) with:
  - Column headers from layer schema
  - Paginated or virtualized rows (query features with `outFields`, `returnGeometry: false`)
  - Optional: export or copy for inspection
- Consider map-overlay panel/drawer pattern if right-sidebar width is too narrow
- Reuse or extend `tncArcgisService.queryFeatures` for data fetch

**Acceptance Criteria:**
- [ ] Button to view layer table present in Browse tab for TNC feature layers
- [ ] Table displays column headers and sample rows from the feature service
- [ ] Table view is usable for schema/column inspection (backend audience)
- [ ] Design allows reuse for other feature-layer data sources (Dendra, etc.)
- [ ] Handles large result sets (pagination or virtualization)

**Estimated Time:** 6–8 hours

---

### 6.18: TNC Data Catalog Source URL

**Goal:** Use TNC’s user-friendly data catalog URL when available, instead of the raw FeatureServer REST URL.

**Context:** TNC has its own website layout for describing feature services (e.g., `https://dangermondpreserve-tnc.hub.arcgis.com/datasets/{itemId}`). The current implementation shows the raw ArcGIS REST URL (e.g., `.../FeatureServer/0`), which is technical and not user-friendly. V1 used the Hub API and had access to item IDs; the new Data Catalog discovery service may not expose this. Research V1’s approach and the Data Catalog schema.

**Implementation:**
- Investigate V1: how it obtained TNC Hub/datasets URLs (e.g., `itemId` from Hub API)
- Check Data Catalog FeatureServer schema for any `hub_url`, `item_id`, `catalog_url`, or equivalent fields
- If available: prefer TNC data catalog URL for "Source" display and for overlay/new-tab actions
- If not available: document as backend enhancement (add field to Data Catalog) and keep raw URL as fallback
- Update `TNCArcGISBrowseTab` and Overview source display to use preferred URL when present

**Acceptance Criteria:**
- [ ] Research completed: V1 source-URL approach documented
- [ ] Data Catalog schema checked for TNC catalog URL fields
- [ ] When TNC catalog URL is available, it is used for Source display and overlay/new-tab links
- [ ] Fallback to raw FeatureServer URL when catalog URL is not available
- [ ] User-facing copy clarifies "TNC Data Catalog" vs "ArcGIS Service" when both are shown

**Estimated Time:** 3–5 hours

---

### 6.19: Overview: Source Actions (Overlay + New Tab)

**Goal:** Move the overlay iframe and open-in-new-tab buttons from the Browse tab into the Overview tab.

**Context:** Source actions (Open Overlay, Open in New Tab) currently live in the Browse tab. The user wants these in the Overview tab so that when a layer is selected, the Overview shows layer info, feature service overview, and source actions together.

**Implementation:**
- Move the Source card (URL display, Open Overlay, New Tab) from `TNCArcGISBrowseTab` to `TNCArcGISOverviewTab`
- Keep overlay iframe behavior (modal/backdrop, close button)
- Ensure both actions work when user is viewing Overview (single-layer or multi-layer with layer selected)
- Remove or simplify duplicate source UI in Browse tab; Browse can focus on filters and table view

**Acceptance Criteria:**
- [ ] Open Overlay and Open in New Tab buttons appear in Overview tab
- [ ] Overlay iframe opens correctly from Overview
- [ ] New Tab link opens correct URL (TNC catalog or raw service, per 6.18)
- [ ] No duplicate source action blocks (Browse tab does not redundantly show same actions)
- [ ] Works for both single-layer and multi-layer services when a layer is selected

**Estimated Time:** 2–3 hours

---

### 6.20: Right Sidebar: Layer + Service Hierarchy Communication

**Goal:** Visually communicate the hierarchy: selected layer → feature service → TNC ArcGIS catalog.

**Context:** Right sidebar currently shows the feature service overview but does not clearly indicate that the user has selected a **layer** from that service. Example: "Oil Seeps" is a layer from the "Coastal Marine Data" feature service, which is part of TNC’s ArcGIS catalog. The UI should make this hierarchy explicit.

**Implementation:**
- In Overview, add a hierarchy breadcrumb or context block, e.g.:
  - "Layer: Oil Seeps"
  - "Service: Coastal Marine Data"
  - "Source: TNC ArcGIS Feature Services"
- Use visual hierarchy (typography, indentation, or chips) to distinguish layer vs service vs catalog
- When a layer is selected (not the service container), show both:
  - The selected layer’s context (name, description if distinct)
  - The parent feature service overview (description, available layers)
- Consider a future task: dedicated view when user clicks the service row (no layer selected); for now, we bypass that and require layer selection first

**Acceptance Criteria:**
- [ ] Overview clearly indicates the selected layer name (e.g., "Oil Seeps")
- [ ] Overview indicates the parent feature service (e.g., "Coastal Marine Data")
- [ ] Overview indicates the catalog source (e.g., "TNC ArcGIS Feature Services")
- [ ] Visual hierarchy is scannable (layer → service → catalog)
- [ ] Single-layer services also show appropriate context (layer = service in that case)

**Estimated Time:** 3–4 hours

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

**Status Update (Feb 16, 2026 feedback):**
- Revisit this assumption for non-feature layers.
- New direction: capability-aware Browse UX (Task 6.11) so Image/Map layers are exploration-first, not SQL-first.

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
| Feb 16, 2026 | 6.15 | Task complete: Legend iconography parity (esriPMS imageData/contentType) + UX refinements (Select All/Clear All in header, layer name above items, stable selection box, removed redundant "Selected" text). | Claude |
| Feb 16, 2026 | - | Created Phase 6 document for TNC ArcGIS Feature Services. Renumbered old Phase 6 (Polish) to Phase 7. | Claude |
| Feb 16, 2026 | 6.3 | Added `src/v2/services/tncArcgisService.ts` with `buildServiceUrl`, `fetchLayerSchema`, `queryFeatures`, and `validateWhereClause`; updated task status and checklist. | Codex |
| Feb 16, 2026 | 6.16–6.20 | Added five broad-change tasks: Pinned Layer Opacity Control, Generic Layer Table View, TNC Data Catalog Source URL, Overview Source Actions (Overlay + New Tab), Right Sidebar Layer+Service Hierarchy Communication. | Claude |

---

## Notes

**Iteration Strategy:** This architecture is a starting point. After implementing, we'll review the UX and iterate based on actual usage. Key questions to revisit:
- Is service-level activation intuitive, or should layer rows also activate?
- Is the layer dropdown in Overview useful, or should we skip straight to Browse?
- Are generic filters sufficient, or do we need smart widgets sooner?

**Current Rendering Clarification (Feb 16, 2026):**
- Multi-layer services are not rendered as "all child layers at once" by default.
- The service row is organizational (activation target for overview), while concrete child layers render when individually pinned/activated.
- If a service has 10 child layers, the system does **not** automatically draw all 10 unless the user explicitly pins/enables those child layers.

**Branch Strategy:** Develop on `v2/tnc-arcgis` branch. Merge to `v2/main` after all 10 tasks complete and QA passes.
