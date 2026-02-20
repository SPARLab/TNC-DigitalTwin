# Phase 6: TNC ArcGIS Feature Services

**Status:** 🟡 In Progress  
**Progress:** 14 / 22 tasks (CON-ARCGIS-01, 02, 03, 04, 05, 08, 09, 10, 11, 12, 14, 15, 6.17, 6.20 complete; 6.1–6.7, 6.15, 6.16, 6.18, 6.19 archived)  
**Last Archived:** Feb 18, 2026 — see `docs/archive/phases/phase-6-tnc-arcgis-completed.md`  
**Branch:** `v2/tnc-arcgis`  
**Depends On:** Phase 0 (Foundation) — Task 0.9 (Dynamic Layer Registry) ✅ complete  
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
| D20-02 | ⚪ Not Started | Feb 20, 2026 | Add back button in right sidebar for ArcGIS feature service inspect/browse view | When user is in browse tab via "Inspect", show back button to return to overview. Source: Dan Meeting Feb 20 |
| D20-10 | ⚪ Not Started | Feb 20, 2026 | Replace static layer overview text with actual ArcGIS feature service description text | Apply to all ArcGIS feature service layers. Feature service already has proper descriptions set by Kelly. Source: Dan Meeting Feb 20 |
| D20-11 | ⚪ Not Started | Feb 20, 2026 | Fix legend-as-filter functionality for TNC ArcGIS feature service layers | Clicking legend items should filter polygons; Amy flagged it's broken. Source: Dan Meeting Feb 20 |
| D20-B04 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Reorder ArcGIS Enterprise layer categories per Amy's survey feedback | Order: Boundaries → Infrastructure → Species → Land Cover → Sensor Equipment → rest. Dan handling in layer management app. Source: Dan Meeting Feb 20 |
| D20-B05 | ⚪ Not Started (Dan) | Feb 20, 2026 | **[Dan]** Re-categorize layer sub-buckets per Amy's feedback — all layers in own bucket, no nested sub-buckets | e.g., Fire has layers across nested sub-buckets; Amy wants them all in one flat bucket. Source: Dan Meeting Feb 20 |
| TF-11 | ⚪ Not Started | Feb 20, 2026 | Fix intermittent "layer zero not found" error for Coastal Marine Data feature service in right sidebar/legend | High priority; intermittent, needs repro + investigation. Source: Trisalyn QA Feb 20 |
| TF-12 | ⚪ Not Started | Feb 20, 2026 | Expand "Open Table Overlay" to all TNC ArcGIS feature service layers (currently only Oil Seeps) | Medium priority; Trisalyn reacted very positively — "this is how the GIS brain thinks." Source: Trisalyn QA Feb 20 |
| CON-ARCGIS-01 | 🟢 Complete | Feb 19, 2026 | Right sidebar shows service overview and layer-specific info with progressive disclosure | Hierarchy context, layer selector, sync |
| CON-ARCGIS-02 | 🟢 Complete | Feb 19, 2026 | Clarify feature service vs category hierarchy in left sidebar | Service/Layer badges, active-state styling |
| CON-ARCGIS-03 | 🟢 Complete | Feb 19, 2026 | Add "See table" button to open tabular layer/table view | Implemented via 6.17: Browse "Open Table Overlay" + ArcGIS FeatureTable |
| CON-ARCGIS-04 | 🟢 Complete | Feb 19, 2026 | Bidirectional sync between right sidebar layer selection and left sidebar | LayerContext + Overview selector |
| CON-ARCGIS-05 | 🟢 Complete | Feb 19, 2026 | Fix iframe to show user-friendly TNC Hub page instead of raw service page | Hub search URL preferred; REST fallback |
| CON-ARCGIS-06 | ⚪ Not Started | Feb 18, 2026 | Bug: fix Union Pacific Railroad layer (layer ID 0 not found) | Medium priority bug |
| CON-ARCGIS-07 | ⚪ Not Started | Feb 18, 2026 | Design multi-layer feature service UX follow-up | Low priority / follow-up |
| CON-ARCGIS-15 | 🟢 Complete | Feb 19, 2026 | Bug: fix feature service layer rendering — layers not drawing on map | Root cause: `renderer: undefined` in FeatureLayer constructor overrode service default; fixed via conditional spread so non-GBIF layers omit renderer/featureReduction and use service symbology |
| **CON-ARCGIS-08** | 🟢 Complete | Feb 19, 2026 | Left sidebar: hover-visible scrollbar pill | Implemented: custom overlay thumb (no gutter); visible on scroll/hover |
| **CON-ARCGIS-09** | 🟢 Complete | Feb 19, 2026 | Left sidebar: fix layer row clipping | ServiceGroup: w-full→mx-1 min-w-0; consistent right margin |
| **CON-ARCGIS-10** | 🟢 Complete | Feb 19, 2026 | Right sidebar: relabel hierarchy block | Feature Service (bold name); Current Layer; remove "Catalog: TNC ArcGIS…" |
| **CON-ARCGIS-11** | 🟢 Complete | Feb 19, 2026 | Right sidebar: rename section to "Feature Service Overview" | Replace "TNC ArcGIS Service" with user-facing label |
| **CON-ARCGIS-12** | 🟢 Complete | Feb 19, 2026 | Right sidebar: simplify layer list UX | Remove dropdown + helper text; single scrollable list (~5 rows); "N layers" header; highlight selected |
| **CON-ARCGIS-13** | ⚪ | Feb 19, 2026 | Left sidebar: align feature service + child layer right edges | Feature service box and child layer boxes share same right margin as other layers (mr-1); child right edge aligns with parent; scrollbar overlay fits naturally |
| **CON-ARCGIS-14** | 🟢 Complete | Feb 19, 2026 | Unified Service Workspace: service/layer click behavior + layer list state chips | Auto-select sublayer on service click; one right-sidebar layout; layer list header (N pinned • N visible); amber active highlight; pin/eye icons; inline pin/unpin; Map Layers widget sync |
| **6.8** | ⚪ | — | Search Enhancement | Match service + layer names; expand parent service when layer matches |
| **6.9** | ⚪ | — | Keyboard Navigation & ARIA | Arrow keys for expand/collapse, ARIA tree structure, focus management |
| **6.10** | ⚪ | — | QA & Edge Cases | Single-layer services, empty results, malformed queries, schema fetch errors |
| **6.11** | 🟡 | Feb 16, 2026 | Capability-Aware Browse UX | Legend display moved out of right-sidebar Browse and into a floating map widget (bottom-right) for active TNC layers |
| **6.12** | 🟡 | Feb 16, 2026 | Terminology + CTA Realignment | Decision locked: remove right-sidebar pin actions for now; keep pinning in left sidebar + Map Layers widget only |
| **6.13** | 🟡 | Feb 16, 2026 | Multi-Layer Service Discoverability | In progress: stable left-sidebar scrollbar gutter; service-group spacing refinements retained |
| **6.14** | 🟡 | Feb 16, 2026 | Service Reference + External Viewer | WIP: right-sidebar Browse focuses on source actions; legend controls live in floating map widget |
| **6.17** | 🟢 Complete | Feb 19, 2026 | Generic Layer Table View (Feature Layers) | ArcGIS FeatureTable overlay on map; Browse shows row/column summary + Open Table Overlay |
| **6.20** | 🟢 Complete | Feb 19, 2026 | Right Sidebar: Layer + Service Hierarchy Communication | Implemented via CON-ARCGIS-01/02 (Current Context block) |

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
- Context block: Feature Service (bold name), Current Layer (CON-ARCGIS-10)
- Section: "Feature Service Overview" with service description (CON-ARCGIS-11)
- Single scrollable layer list with "N layers" header, highlighted selection, click-to-switch (CON-ARCGIS-12)
- "Browse {Layer} →" button (switches to Browse tab)
- "Pin {Layer}" button (adds selected layer to Map Layers widget)
- Source actions: Open Overlay, Open in New Tab (Task 6.19)

**Browse Tab (Any TNC Layer):**
- "Inspect Current Layer" card: row count, column count, column preview; "Open Table Overlay" button (Task 6.17)
- ArcGIS FeatureTable overlay: floating panel over map area; auto-populates columns and rows from FeatureServer
- Generic filter UI: field/operator/value rows (future)
- "Pin Layer" button (appears when layer not pinned)
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
- [x] Button to view layer table present in Browse tab for TNC feature layers
- [x] Table displays column headers and sample rows from the feature service
- [x] Table view is usable for schema/column inspection (backend audience)
- [x] Design allows reuse for other feature-layer data sources (Dendra, etc.)
- [x] Handles large result sets (pagination or virtualization via ArcGIS FeatureTable)

**Resolution (Feb 19, 2026):** Implemented via ArcGIS SDK `FeatureTable` widget. Browse tab shows "Inspect Current Layer" card with row count, column count, and column preview; "Open Table Overlay" opens a floating panel over the map. Panel uses ArcGIS FeatureTable bound to map layer or fallback FeatureLayer from service URL. TNCArcGISTableOverlay component; TNCArcGISContext state for open/close; adapter FloatingPanel. Hover-revealed "Inspect" action on Overview layer rows switches to Browse and opens table overlay.

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

### CON-ARCGIS-08: Left Sidebar — Hover-Visible Scrollbar Pill

**Goal:** Replace the always-visible gray scroll track with a thin scrollbar that appears on hover/scroll.

**Context:** User feedback (Feb 19, 2026): "There's like this gray bar that I think is like the scroll track for the scroll pill. I think what we just need to do is we just need to have like one of those scroll pills that hovers, like becomes visible in the left sidebar when you hover your mouse over and begin scrolling."

**Implementation:**
- Target: `#left-sidebar-scroll-area` (or equivalent scroll container in LeftSidebar)
- Use CSS `scrollbar-gutter` and/or `::-webkit-scrollbar` with `width: thin`; show scrollbar thumb only on `:hover` or when actively scrolling
- Ensure keyboard/trackpad scroll still works; scrollbar is overlay-style (does not shift content)

**Acceptance Criteria:**
- [ ] Gray scroll track not always visible
- [ ] Thin scrollbar appears when hovering over left sidebar and scrolling
- [ ] Scrollbar visible during active scroll (mouse wheel, trackpad)
- [ ] No layout shift when scrollbar appears/disappears

**Estimated Time:** 30–60 min

---

### CON-ARCGIS-09: Left Sidebar — Fix Layer Row Clipping

**Goal:** Fix layer names and badges getting cut off at the right edge of the left sidebar.

**Context:** User feedback (Feb 19, 2026): "The layers are getting cut off in the left sidebar."

**Implementation:**
- Adjust `LayerRow` and `ServiceGroup` flex layout: name text uses `truncate` with `min-w-0`; badges (Service/Layer pills) use `flex-shrink-0`
- Ensure row padding and container width allow full visibility; verify at 280px sidebar width
- Test with long layer names (e.g., "Coastal and Marine Data", "Deep Sea Corals & Sponges")

**Acceptance Criteria:**
- [x] Layer names truncate with ellipsis instead of hard cutoff
- [x] Service/Layer badges fully visible
- [x] No content clipped at right edge of sidebar
- [x] Works at 280px sidebar width

**Resolution (Feb 19, 2026):** ServiceGroup row wrapper changed from `w-full ml-1 mr-1` to `mx-1 min-w-0` to prevent width overflow that pushed the SERVICE badge and content too far right. Keeps consistent right margin with other layer rows (e.g., Water Pressure Level Sensors). Child layer rows already use `mr-1` (flat) or `mr-0` (indented); truncation via `truncate min-w-0 flex-1` on name span.

**Estimated Time:** 30–60 min

---

### CON-ARCGIS-10: Right Sidebar — Relabel Hierarchy Block

**Goal:** Replace internal jargon with user-facing labels: Feature Service (bold name), Current Layer.

**Context:** User feedback (Feb 19, 2026): "I don't think saying catalog TNC ArcGIS feature services really makes a ton of sense. I don't really know what people are gonna do with that. I feel like that's an internal label."

**Implementation:**
- Replace "Current Context" block with:
  - **Feature Service:** `{service name}` (bold, prominent)
  - **Current Layer:** `{layer name}`
- Remove "Catalog: TNC ArcGIS Feature Services" line entirely

**Acceptance Criteria:**
- [x] "Feature Service" label + bold service name visible
- [x] "Current Layer" label + layer name visible
- [x] "Catalog: TNC ArcGIS Feature Services" removed

**Resolution (Feb 19, 2026):** Implemented in TNCArcGISOverviewTab. Replaced amber "Current Context" card with gray context block showing Feature Service (bold) and Current Layer. Catalog line removed.

**Estimated Time:** 15–30 min

---

### CON-ARCGIS-11: Right Sidebar — Rename Section to "Feature Service Overview"

**Goal:** Use "Feature Service Overview" as the section title instead of "TNC ArcGIS Service".

**Context:** User feedback (Feb 19, 2026): "Overview of Feature service, like feature service overview, and then you would actually put in the overview."

**Implementation:**
- Change section title from "TNC ArcGIS Service" to "Feature Service Overview"
- Apply to both service-overview and single-layer overview states

**Acceptance Criteria:**
- [x] Section titled "Feature Service Overview"
- [x] Consistent across multi-layer and single-layer views

**Resolution (Feb 19, 2026):** Section heading changed from "TNC ArcGIS Service" to "Feature Service Overview" in both service-overview and single-layer paths.

**Estimated Time:** 10–15 min

---

### CON-ARCGIS-12: Right Sidebar — Simplify Layer List UX

**Goal:** Remove redundant dropdown and helper text; use a single scrollable list with limited height.

**Context:** User feedback (Feb 19, 2026): "I don't want this text which says pick a layer here or in the left sidebar selection stays synced both ways. I don't think that's necessary. I don't currently like the dropdown where it says oil seeps... why do we have those two widgets? It's just taking up a lot of vertical space. I want a scrollable section that just tells me like, you have 20 layers, and then we just have the currently selected layer highlighted, but then it's like a scrollable section with like a limited height, like shows five layers at a time."

**Implementation:**
- Remove layer dropdown selector
- Remove "Pick a layer here or in the left sidebar. Selection stays synced both ways." helper text
- Add "N layers" header (e.g., "20 layers")
- Single scrollable list with `max-height` ~5 rows; visible scrollbar
- Highlight currently selected layer in list
- List items remain clickable to change selection (bidirectional sync preserved)

**Acceptance Criteria:**
- [x] Dropdown removed
- [x] Helper text removed
- [x] "N layers" header present
- [x] Scrollable list with ~5 visible rows, limited height
- [x] Selected layer highlighted
- [x] Clicking list item updates selection (sync with left sidebar)

**Resolution (Feb 19, 2026):** Replaced dropdown + helper text with single scrollable list (max-h-56). "N layers" header, clickable list items with emerald highlight for selected layer. Bidirectional sync via setActiveServiceSubLayer preserved.

**Estimated Time:** 45–90 min

---

### CON-ARCGIS-15: Fix Feature Service Layer Rendering (Layers Not Drawing on Map)

**Goal:** Fix TNC ArcGIS feature service layers so they render on the map. Currently the legend loads but the layer geometry does not draw.

**Context (User Feedback, Feb 19, 2026):**
- **Land Cover:** JLDP invasives ice plant mats — legend loads, layer does not
- **Land Cover:** Tree-dominated vegetation — not working
- **Land Cover:** Most layers not working
- **Oil Seeps:** Not rendering on the map
- **General:** Feature service layers in general are not rendering correctly

**Investigation Areas:**
- Layer view creation / FeatureLayer instantiation for TNC feature services
- Map layer add order, visibility, or extent issues
- Possible mismatch between service URL, layer ID, or sublayer resolution
- Symbology/renderer application (legend loads → renderer may be correct; geometry fetch may fail)
- CORS, authentication, or network errors when fetching features

**Acceptance Criteria:**
- [x] JLDP invasives ice plant mats (Land Cover) renders on map
- [x] Tree-dominated vegetation (Land Cover) renders on map
- [x] Oil seeps (Coastal Marine Data) renders on map
- [x] Other land cover and feature service layers render as expected
- [x] Legend and layer geometry stay in sync

**Implementation Notes (Feb 19, 2026):**
- Root cause: many single-row FeatureServer catalog rows contain non-zero `layer_id` values that do not map to a real sublayer endpoint, causing `FeatureLayer` load/layerview failures (e.g., `/FeatureServer/14` when service exposes layer `0`).
- Fix applied in URL resolution: for non-multi-layer services, force layer endpoint `/0`; for explicit multi-layer services, continue honoring `layerIdInService`.
- Legend target layer ID now uses the same rule so legend + map geometry stay aligned.
- Additional hardening applied: map-layer factory now attempts fallback FeatureServer URLs when initial layer load fails (`preferred`, explicit sublayer, `/0`) and logs recovery attempts.
- Table overlay isolation applied: `TNCArcGISTableOverlay` always uses a dedicated throwaway `FeatureLayer` for `FeatureTable` to avoid mutating/destroying live map layer instances.

**Resolution (Feb 19, 2026):**
- **Actual root cause:** GBIF layer customization introduced `renderer: isGbifLayer ? {...} : undefined` and `featureReduction: isGbifLayer ? {...} : undefined` in the FeatureLayer constructor. For non-GBIF layers, passing `renderer: undefined` explicitly overrides the ArcGIS service default renderer, so features load but draw with no symbology.
- **Fix:** Use conditional spread `...(isGbifLayer ? { renderer, featureReduction } : {})` so non-GBIF layers omit these properties entirely; ArcGIS then auto-fetches the service default renderer.
- **Files:** `src/v2/components/Map/layers/tncArcgisLayer.ts`

**Estimated Time:** 4–8 hours (investigation-dependent)

---

### CON-ARCGIS-13: Left Sidebar — Align Feature Service + Child Layer Right Edges

**Goal:** Ensure feature service box and child layer boxes share the same right margin as other left-sidebar layers (e.g., Fire, Land Cover), so the overlay scrollbar fits naturally and visual alignment is consistent.

**Context:** User feedback (Feb 19, 2026): Feature service rows (e.g., "Coastal and Marine") and their child layers should have right edges aligned with each other and with top-level layers. Child rows are indented from the left (correct); their right edge should align with the feature service box. Both should have the same distance from the right edge of the sidebar as other layers (mr-1 spacing where scrollbar overlay fits naturally).

**Implementation:**
- Feature service row: same right margin as top-level layers (mr-1)
- Child layer rows: right edge aligns with feature service row (no extra right margin; indentation from left indicates hierarchy)
- Verify alignment with category headers and flat layer rows (e.g., "Wind Sensors", "Land Cover")

**Acceptance Criteria:**
- [ ] Feature service box right edge matches other layer row right edges (consistent mr-1)
- [ ] Child layer boxes right edge aligns with feature service box right edge
- [ ] Left indentation of children preserved; hierarchy clear
- [ ] Overlay scrollbar fits naturally in right margin across all row types

**Estimated Time:** 30–45 min

---

### CON-ARCGIS-14: Unified Service Workspace — Service/Layer Click Behavior + Layer List State Chips

**Goal:** One consistent right-sidebar model for multi-layer TNC services. Clicking the service row or a child layer row both show the same layout; the difference is which layer is "Current Layer" (active inspect target). Resolve confusion where clicking the service shows no map content and clicking a layer shows different sidebar content.

**Context (User Feedback, Feb 19, 2026):**
- Clicking the feature service in the left sidebar shows overview but nothing on the map.
- Clicking a child layer shows different right-sidebar content and doesn't clearly communicate "this layer is part of this feature service."
- User wants: (1) service click to auto-select a current layer so something appears on map; (2) same right-sidebar layout whether clicking service or layer; (3) layer list widget to show pinned/visible counts and which layer is active; (4) Browse CTA to inspect the current layer's table.

**Implementation:**

1. **Service row click (left sidebar):**
   - Set service as active context.
   - Auto-select sublayer: use last-active sublayer for this service if available; otherwise first layer.
   - Activate that layer as the inspect target (Current Layer).
   - Map: the selected layer becomes visible (if not already pinned, show it as active-only; if pinned, ensure it's visible).

2. **Child layer row click (left sidebar):**
   - Same right-sidebar layout as service click.
   - Update Current Layer to the clicked layer.
   - No layout switch — only the active highlight and context block update.

3. **Right sidebar — layer list widget:**
   - Header: e.g. `20 layers • 6 pinned • 4 visible` (or similar compact summary).
   - Each row: show state indicators (Active, Pinned, Visible/Hidden) — keep density readable; if too many icons, at minimum highlight Active and optionally show a small pin badge for pinned layers.
   - One selected/active highlight.
   - Optional: per-row pin/eye affordances only if layout remains clean.

4. **Browse CTA:**
   - Label: "Inspect Current Layer" or "Browse Selected Layer" (clarify it acts on Current Layer).
   - Always opens Browse tab for the layer shown in the context block.

**Acceptance Criteria:**
- [x] Clicking service row auto-selects a sublayer (last-active or first) and shows it on map
- [x] Clicking child layer row updates Current Layer; same right-sidebar layout
- [x] Layer list header shows pinned/visible counts (e.g. "N layers • X pinned • Y visible")
- [x] Layer list rows show Active highlight; pinned/visible state visible where feasible
- [x] Browse CTA always inspects Current Layer

**Completed (Feb 19, 2026):** ServiceGroup auto-selects sublayer (last-active or first); useMapLayers resolves concrete active sublayer for map visibility; MapLayersWidget resolves service-selected sublayer for Active section sync; TNCArcGISOverviewTab unified layout with amber active highlight, pin/eye icons (right-aligned), inline pin/unpin toggle; LayerContext.isLayerVisible treats service-selected sublayer as visible; Browse CTA relabeled "Inspect Current Layer".

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
| Feb 19, 2026 | CON-ARCGIS-15 | **Complete.** Root cause: `renderer: undefined` passed explicitly in FeatureLayer constructor overrode service default renderer for non-GBIF layers. Fixed via conditional spread so renderer/featureReduction omitted when not GBIF; ArcGIS auto-fetches service symbology. Removed diagnostic logging from useMapLayers. Files: `tncArcgisLayer.ts`, `useMapLayers.ts`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **In progress (handoff update).** Added FeatureLayer URL fallback loading in map layer factory and isolated table overlay lifecycle to dedicated FeatureLayer instances; regression still unresolved and requires fresh-window investigation with runtime map-layer diagnostics. Files: `src/v2/components/Map/layers/tncArcgisLayer.ts`, `src/v2/components/FloatingWidgets/TNCArcGISTableOverlay/TNCArcGISTableOverlay.tsx`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **In progress.** Root cause identified and patched: single-layer services now resolve to `/FeatureServer/0` (and `/MapServer` sublayer `0`) unless explicitly marked multi-layer; legend lookup now follows same layer-ID rule. Files: `src/v2/services/tncArcgisService.ts`, `src/v2/components/Map/layers/tncArcgisLayer.ts`. | Codex |
| Feb 19, 2026 | CON-ARCGIS-15 | **Added.** Bug: fix feature service layer rendering — legend loads but layers (JLDP invasives ice plant mats, tree-dominated vegetation, oil seeps, most land cover) not drawing on map. | — |
| Feb 19, 2026 | CON-ARCGIS-03, 6.17 | **Complete.** ArcGIS FeatureTable overlay for TNC layers. Browse "Inspect Current Layer" card with row/column summary + Open Table Overlay; hover-revealed Inspect on Overview layer rows; TNCArcGISTableOverlay + fallback FeatureLayer for MapServer layers. | — |
| Feb 19, 2026 | CON-ARCGIS-14 | **Complete.** Unified Service Workspace: service/layer click auto-selects sublayer; map + Map Layers widget sync with resolved sublayer; right-sidebar layer list with amber active highlight, pin/eye icons, inline pin/unpin; "Inspect Current Layer" CTA. Files: ServiceGroup, useMapLayers, MapLayersWidget, TNCArcGISOverviewTab, LayerContext. | — |
| Feb 19, 2026 | CON-ARCGIS-14 | Added task: Unified Service Workspace — service/layer click behavior, auto-select sublayer on service click, layer list state chips (pinned/visible counts). | — |
| Feb 19, 2026 | CON-ARCGIS-10, 11, 12 | Implemented right sidebar hierarchy relabel (Feature Service, Current Layer), section rename to "Feature Service Overview", single scrollable layer list (dropdown + helper text removed). | — |
| Feb 19, 2026 | CON-ARCGIS-01, 02, 04, 05, 6.20 | Marked complete. Added CON-ARCGIS-08–12 from user feedback: left sidebar scrollbar pill, row clipping fix, right sidebar relabeling, section rename, layer list simplification. | — |
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
