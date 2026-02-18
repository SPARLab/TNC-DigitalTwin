# Phase 6: TNC ArcGIS Feature Services

**Status:** 🟡 In Progress  
**Progress:** 0 / 16 tasks (completed tasks 6.1–6.7, 6.15, 6.16, 6.18, 6.19 archived)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-6-tnc-arcgis-completed.md`  
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

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| CON-ARCGIS-01 | ⚪ Not Started | Feb 18, 2026 | Right sidebar shows service overview and layer-specific info with progressive disclosure | High priority; resolved interaction model |
| CON-ARCGIS-02 | ⚪ Not Started | Feb 18, 2026 | Clarify feature service vs category hierarchy in left sidebar | High priority |
| CON-ARCGIS-03 | ⚪ Not Started | Feb 18, 2026 | Add "See table" button to open tabular layer/table view | Medium priority |
| CON-ARCGIS-04 | ⚪ Not Started | Feb 18, 2026 | Bidirectional sync between right sidebar layer selection and left sidebar | Medium priority |
| CON-ARCGIS-05 | ⚪ Not Started | Feb 18, 2026 | Fix iframe to show user-friendly TNC Hub page instead of raw service page | Medium priority |
| CON-ARCGIS-06 | ⚪ Not Started | Feb 18, 2026 | Bug: fix Union Pacific Railroad layer (layer ID 0 not found) | Medium priority bug |
| CON-ARCGIS-07 | ⚪ Not Started | Feb 18, 2026 | Design multi-layer feature service UX follow-up | Low priority / follow-up |
| **6.8** | ⚪ | — | Search Enhancement | Match service + layer names; expand parent service when layer matches |
| **6.9** | ⚪ | — | Keyboard Navigation & ARIA | Arrow keys for expand/collapse, ARIA tree structure, focus management |
| **6.10** | ⚪ | — | QA & Edge Cases | Single-layer services, empty results, malformed queries, schema fetch errors |
| **6.11** | 🟡 | Feb 16, 2026 | Capability-Aware Browse UX | Legend display moved out of right-sidebar Browse and into a floating map widget (bottom-right) for active TNC layers |
| **6.12** | 🟡 | Feb 16, 2026 | Terminology + CTA Realignment | Decision locked: remove right-sidebar pin actions for now; keep pinning in left sidebar + Map Layers widget only |
| **6.13** | 🟡 | Feb 16, 2026 | Multi-Layer Service Discoverability | In progress: stable left-sidebar scrollbar gutter; service-group spacing refinements retained |
| **6.14** | 🟡 | Feb 16, 2026 | Service Reference + External Viewer | WIP: right-sidebar Browse focuses on source actions; legend controls live in floating map widget |
| **6.17** | ⚪ | — | Generic Layer Table View (Feature Layers) | Add table view for feature layers: button in Browse tab to view layer table; generic across all feature layers |
| **6.20** | ⚪ | — | Right Sidebar: Layer + Service Hierarchy Communication | Visually communicate: selected layer → feature service → TNC ArcGIS catalog hierarchy |

*Completed tasks 6.1–6.7, 6.15, 6.16, 6.18, 6.19 have been archived. See `docs/archive/phases/phase-6-tnc-arcgis-completed.md`.*

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
| Feb 18, 2026 | — | Archived completed tasks 6.1–6.7, 6.15, 6.16, 6.18, 6.19 to `docs/archive/phases/phase-6-tnc-arcgis-completed.md`. Phase doc trimmed for new tasks. | Claude |
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
