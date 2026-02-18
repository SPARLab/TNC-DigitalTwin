# Phase 5: Export Builder — Archived Completed Tasks

**Archived:** February 18, 2026  
**Purpose:** Archive of completed Phase 5 tasks (5.1–5.10). Full details preserved for reference. Add new tasks to `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`.

**Source:** `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`

---

## Quick Task Summary (Archived)

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 5.1 | 🟢 Complete | 2026-02-16 14:05 PT | Create Export Builder modal shell | Modal shell wired to global header cart button with scrollable body and fixed footer |
| 5.2 | 🟢 Complete | 2026-02-16 14:05 PT | Implement per-layer export sections | Added `LayerExportSection`; wired per-layer filter summary, result count, and source-specific format options |
| 5.3 | 🟢 Complete | 2026-02-16 14:05 PT | Implement export summary and size estimation | Added `ExportSummary`; dynamic total estimate is wired |
| 5.4 | 🟢 Complete | 2026-02-16 14:05 PT | Implement export actions (ZIP / Links) | Added client-side ZIP package generation, link generation, and feedback states |
| 5.5 | 🟢 Complete | 2026-02-16 14:48 PT | Reduce copy density and clarify modal hierarchy | Replaced verbose intro blocks with compact step chips and clearer section headings |
| 5.6 | 🟢 Complete | 2026-02-16 14:48 PT | Align Export Builder hierarchy to Map Layers model | Layer cards now show child filtered views with active/default selection behavior |
| 5.7 | 🟢 Complete | 2026-02-16 14:48 PT | Add per-layer size estimation | Added per-view estimates, per-layer subtotal, and unknown-estimate handling |
| 5.8 | 🟢 Complete | 2026-02-16 14:48 PT | Support multi-view export per layer | Multi-select filtered views per layer; ZIP now exports view subfolders; size warning for large multi-view exports |
| 5.9 | 🟢 Complete | 2026-02-16 14:48 PT | Add query/filter definition export option | Added per-layer query-definition toggle; outputs include `query-definition.json` and link payload support |
| 5.10 | 🟢 Complete | 2026-02-16 14:48 PT | Unify visual tokens and card affordances | Removed off-system purple accent, standardized with slate/emerald tokenized hierarchy |

---

## Task Details (Archived)

### 5.1: Create Export Builder Modal Shell

**Goal:** Set up the modal that contains the Export Builder.

**Design Decision (Jan 29, 2026):** Resolved DFT-002 — Modal opens from shopping cart button in global header (top-right), not from bookmark widget.

**Acceptance Criteria:**
- [x] Modal opens from "Export All" shopping cart button in global header
- [x] Modal is full-screen or large overlay
- [x] Header shows export context count for pinned layers
- [x] Close button works
- [x] Scrollable content area for many layers
- [x] Fixed footer with action buttons

**Files Created:**
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderHeader.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderFooter.tsx`

---

### 5.2: Implement Per-Layer Export Sections

**Goal:** For each pinned layer, show filtered export context and format options.

**Acceptance Criteria:**
- [x] Each layer gets its own section/card
- [x] Section shows: layer name, current query summary
- [x] Show filtered-results-only export mode (no bookmarked-only / skip options)
- [x] Show matching result count for current filter state
- [x] Remove bookmark-specific controls from export sections
- [x] Data-type-specific format options (CSV, GeoJSON, images, etc.)

**Per-Layer Content:**
| Data Source | Format Options | Special Considerations |
|-------------|----------------|------------------------|
| iNaturalist | CSV, GeoJSON | Simple export |
| ANiML | Metadata, Images, Thumbnails only | Dual-level filter shown |
| Dendra | Metadata, Datastream CSV | Time range shown |
| DataOne | Metadata, File links, Download files | May be large |

**Reference:** Mockup `02f-export-builder.html` per-layer sections

**Files Created:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`

---

### 5.3: Implement Export Summary and Size Estimation

**Goal:** Show aggregated summary of what will be exported.

**Acceptance Criteria:**
- [x] Summary section at bottom of content area
- [x] Lists all selected features with counts
- [x] Estimated total size calculated and displayed
- [x] Updates dynamically as user changes selections

**Example Summary:**
```
• 847 bird observations (CSV)
• 8 cameras: 127 mountain lion images (48 MB)
• 1 sensor: 90 data points (CSV)
• 1 DataOne dataset (metadata + links)

Estimated total: ~52 MB
```

**Files Created:**
- `src/v2/components/ExportBuilder/ExportSummary.tsx`

---

### 5.4: Implement Export Actions

**Goal:** Allow user to export their selections.

**Acceptance Criteria:**
- [x] "Export ZIP" button creates downloadable archive
- [x] "Generate Links" button creates shareable links (if supported)
- [x] "Cancel" button closes modal
- [x] Loading state while export is processing
- [x] Success/error feedback

**Technical Notes:**
- ZIP generation may require server-side processing
- For V1, "Generate Links" can encode active query/filter state per pinned layer
- Consider progressive download for large exports

---

### 5.5: Reduce Copy Density and Clarify Modal Hierarchy

**Goal:** Reduce cognitive load by trimming redundant text and using clearer section structure.

**Acceptance Criteria:**
- [x] Header copy is reduced to one short sentence plus optional context badge/chip
- [x] Redundant explanatory blocks are removed or collapsed behind contextual "Learn more" affordance
- [x] A clear visual divider and heading separates "Export setup context" from "Layer export list"
- [x] Layer cards are scannable in under 3 seconds (name, selected views, estimated size, selected outputs)
- [x] Empty/edge states (no pinned layers, no matching results) remain understandable without verbose prose

**UX Notes:**
- Emphasize recognition over recall (Nielsen) by showing state labels instead of narrative text.
- Use progressive disclosure (Hick + IA) for advanced details.

**Files Updated:**
- `src/v2/components/ExportBuilder/ExportBuilderHeader.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`

---

### 5.6: Align Export Builder Hierarchy to Map Layers Model

**Goal:** Match the user mental model established in Map Layers: Layer -> Filtered Views -> Export Outputs.

**Acceptance Criteria:**
- [x] Each pinned layer clearly renders as a parent node/container
- [x] Saved filtered views render as children under the parent layer
- [x] Active filtered view is visually distinguished and preselected
- [x] Child view naming matches Map Layers naming contract (`isNameCustom` respected)
- [x] Export interactions preserve structure in generated package metadata

**UX Notes:**
- Supports conceptual-model consistency (Norman) and hierarchy/proximity (Gestalt).

**Files Updated:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/context/LayerContext.tsx`

---

### 5.7: Add Per-Layer Size Estimation

**Goal:** Show size impact where decisions are made, not only in the final summary.

**Acceptance Criteria:**
- [x] Each layer block shows estimated size based on selected outputs
- [x] If multiple filtered views are selected, show per-view size and per-layer subtotal
- [x] Layer estimates update immediately when include options change
- [x] Total estimate in `ExportSummary` remains authoritative and consistent with subtotals
- [x] Unknown estimates degrade gracefully (e.g., "Size unavailable")

**UX Notes:**
- Follows immediate feedback principles (Norman + Shneiderman) and reduces memory load.

**Files Updated:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportSummary.tsx`
- `src/v2/components/ExportBuilder/utils/sizeEstimator.ts` (new helper if needed)

---

### 5.8: Support Multi-View Export Per Layer

**Goal:** Allow exporting one or many saved filtered views for the same layer.

**Acceptance Criteria:**
- [x] Active filtered view is selected by default for each layer
- [x] User can include additional saved filtered views
- [x] Export package groups each selected view into its own subfolder path
- [x] UI clearly shows selected view count per layer
- [x] Large multi-view selections trigger warning when estimated size crosses threshold

**UX Notes:**
- Progressive disclosure keeps basic path simple while enabling power workflows.

**Files Updated:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/exportActions.ts`
- `src/v2/components/ExportBuilder/types.ts`

---

### 5.9: Add Query/Filter Definition Export Option

**Goal:** Include reproducible query definitions with exported data.

**Acceptance Criteria:**
- [x] Per-layer toggle to include query/filter definitions in output package
- [x] Export includes machine-readable query payload (JSON) for each selected view
- [x] Manifest maps data artifacts to originating query/view identifiers
- [x] Option works for both ZIP export and generated links output
- [x] Sensitive/internal fields are excluded from exported query payload

**Files Updated:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/exportActions.ts`
- `src/v2/components/ExportBuilder/types.ts`

---

### 5.10: Unify Visual Tokens and Card Affordances

**Goal:** Remove off-system visual cues (for example ad-hoc purple borders) and improve scanability for many-layer scenarios.

**Acceptance Criteria:**
- [x] Replace ad-hoc accent colors with approved design tokens from `design-system.md`
- [x] Parent layer containers and child filtered-view rows have consistent visual hierarchy
- [x] Selection state does not rely on color alone (iconography/text/state label included)
- [x] Borders/backgrounds/dividers are consistent with existing v2 component language
- [x] Contrast meets WCAG AA for text and state indicators

**Files Updated:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `docs/DESIGN-SYSTEM/design-system.md` (if new token usage is standardized)

---

## Change Log (Archived)

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 5.5-5.10 | Implemented Export Builder hierarchy and UX refinements in app code: compact header/context copy, Layer -> Filtered Views structure, per-view + per-layer size estimation, multi-view selection with large-export warning, per-layer query-definition toggle, and ZIP/link payload updates with Layer -> Views folder structure | Claude |
| Feb 16, 2026 | 5.5-5.10 | Added post-MVP refinement tasks based on UI/UX review: copy-density reduction, map-widget hierarchy alignment (Layer -> Filtered Views), per-layer size estimates, multi-view export, query-definition export, and visual token consistency updates | Claude |
| Feb 16, 2026 | 5.4 | Implemented export actions end-to-end: wired "Export ZIP" and "Generate Links" in `ExportBuilderModal`; added loading/disabled states in `ExportBuilderFooter`; added `exportActions.ts` for ZIP packaging (manifest + per-layer JSON + links file) and share-link text generation with clipboard + download fallback | Claude |
| Feb 16, 2026 | 5.3 | Implemented export summary + size estimation: added `ExportSummary` component and wired dynamic per-layer summary rows with estimated total size based on selected formats and current filtered result counts | Claude |
| Feb 16, 2026 | 5.2 | Revised 5.2 to filtered-only model: removed bookmark export mode and bookmark item controls from `ExportBuilderModal`; sections now focus on active query summary, result count, and format options | Claude |
| Feb 16, 2026 | 5.1 | Implemented Export Builder modal shell (`ExportBuilderModal`, `ExportBuilderHeader`, `ExportBuilderFooter`) and wired shopping cart button in `V2Header` to open/close modal in `V2App` | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Jan 29, 2026 | 5.1 | Updated with DFT-002 resolution (modal opens from global header button) | Will + Claude |
