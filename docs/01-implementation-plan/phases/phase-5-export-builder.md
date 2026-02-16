# Phase 5: Export Builder

**Status:** 🟡 In Progress  
**Progress:** 4 / 10 tasks  
**Branch:** `v2/export-builder`  
**Depends On:** Phases 1-4 (all data sources)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the Export Builder that brings together all pinned layers and their active filter state into a unified export workflow.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/00-design-iteration/design-system/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 6 - Export Builder)
- Mockup: `mockups/02f-export-builder.html`

## Key Paradigm Notes

- Export Builder shows ALL pinned layers with their active queries
- Each layer exports filtered results only (no bookmark export mode)
- Per-layer section shows active filter summary, matching result count, and format options
- Export summary aggregates all selections with estimated size
- Two export actions: "Export ZIP" and "Generate Links"

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 5.1 | 🟢 Complete | 2026-02-16 14:05 PT | Create Export Builder modal shell | Modal shell wired to global header cart button with scrollable body and fixed footer |
| 5.2 | 🟢 Complete | 2026-02-16 14:05 PT | Implement per-layer export sections | Added `LayerExportSection`; wired per-layer filter summary, result count, and source-specific format options |
| 5.3 | 🟢 Complete | 2026-02-16 14:05 PT | Implement export summary and size estimation | Added `ExportSummary`; dynamic total estimate is wired |
| 5.4 | 🟢 Complete | 2026-02-16 14:05 PT | Implement export actions (ZIP / Links) | Added client-side ZIP package generation, link generation, and feedback states |
| 5.5 | ⚪ Not Started | 2026-02-16 14:05 PT | Reduce copy density and clarify modal hierarchy | Remove redundant helper text and add clearer section boundaries |
| 5.6 | ⚪ Not Started | 2026-02-16 14:05 PT | Align Export Builder hierarchy to Map Layers model | Represent Layer -> Filtered Views -> Export Outputs hierarchy directly |
| 5.7 | ⚪ Not Started | 2026-02-16 14:05 PT | Add per-layer size estimation | Show estimate at each layer/filter-view block and keep total summary at bottom |
| 5.8 | ⚪ Not Started | 2026-02-16 14:05 PT | Support multi-view export per layer | Default to active view, optional export of all saved views as subfolders |
| 5.9 | ⚪ Not Started | 2026-02-16 14:05 PT | Add query/filter definition export option | Include machine-readable query definitions in ZIP manifest structure |
| 5.10 | ⚪ Not Started | 2026-02-16 14:05 PT | Unify visual tokens and card affordances | Replace ad-hoc purple with design-system accents and stronger grouping cues |

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 5.1 | Create Export Builder modal shell | 🟢 Complete | Claude | Modal shell wired to global header cart button with scrollable body + fixed footer |
| 5.2 | Implement per-layer export sections | 🟢 Complete | Claude | Added `LayerExportSection`; wired per-layer filter summary, result count, and source-specific format options into `ExportBuilderModal` (filtered-only model) |
| 5.3 | Implement export summary and size estimation | 🟢 Complete | Claude | Added `ExportSummary`; wired dynamic per-layer selection summary + heuristic total size estimate into `ExportBuilderModal` |
| 5.4 | Implement export actions (ZIP / Links) | 🟢 Complete | Claude | Added client-side ZIP package generation, shareable link generation, loading states, and success/error feedback in Export Builder modal |
| 5.5 | Reduce copy density and clarify modal hierarchy | ⚪ Not Started | TBD | Remove redundant helper text, reduce repeated explanatory copy, and introduce stronger visual grouping/dividers |
| 5.6 | Align Export Builder hierarchy to Map Layers model | ⚪ Not Started | TBD | Mirror Layer -> Filtered Views structure used by Map Layers widget |
| 5.7 | Add per-layer size estimation | ⚪ Not Started | TBD | Add size estimate per layer (and per filtered view where possible), with total remaining in Export Summary |
| 5.8 | Support multi-view export per layer | ⚪ Not Started | TBD | Default-selected active view plus optional multi-select for saved filtered views, exported as subfolders |
| 5.9 | Add query/filter definition export option | ⚪ Not Started | TBD | Export selected query definitions alongside data payloads and links |
| 5.10 | Unify visual tokens and card affordances | ⚪ Not Started | TBD | Replace off-system purple and improve section affordances for faster scanning with many layers |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

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

**Files to Create:**
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

**Files to Create:**
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

**Files to Create:**
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
- [ ] Header copy is reduced to one short sentence plus optional context badge/chip
- [ ] Redundant explanatory blocks are removed or collapsed behind contextual "Learn more" affordance
- [ ] A clear visual divider and heading separates "Export setup context" from "Layer export list"
- [ ] Layer cards are scannable in under 3 seconds (name, selected views, estimated size, selected outputs)
- [ ] Empty/edge states (no pinned layers, no matching results) remain understandable without verbose prose

**UX Notes:**
- Emphasize recognition over recall (Nielsen) by showing state labels instead of narrative text.
- Use progressive disclosure (Hick + IA) for advanced details.

**Files to Update:**
- `src/v2/components/ExportBuilder/ExportBuilderHeader.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`

---

### 5.6: Align Export Builder Hierarchy to Map Layers Model

**Goal:** Match the user mental model established in Map Layers: Layer -> Filtered Views -> Export Outputs.

**Acceptance Criteria:**
- [ ] Each pinned layer clearly renders as a parent node/container
- [ ] Saved filtered views render as children under the parent layer
- [ ] Active filtered view is visually distinguished and preselected
- [ ] Child view naming matches Map Layers naming contract (`isNameCustom` respected)
- [ ] Export interactions preserve structure in generated package metadata

**UX Notes:**
- Supports conceptual-model consistency (Norman) and hierarchy/proximity (Gestalt).

**Files to Update:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/context/LayerContext.tsx`

---

### 5.7: Add Per-Layer Size Estimation

**Goal:** Show size impact where decisions are made, not only in the final summary.

**Acceptance Criteria:**
- [ ] Each layer block shows estimated size based on selected outputs
- [ ] If multiple filtered views are selected, show per-view size and per-layer subtotal
- [ ] Layer estimates update immediately when include options change
- [ ] Total estimate in `ExportSummary` remains authoritative and consistent with subtotals
- [ ] Unknown estimates degrade gracefully (e.g., "Size unavailable")

**UX Notes:**
- Follows immediate feedback principles (Norman + Shneiderman) and reduces memory load.

**Files to Update:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportSummary.tsx`
- `src/v2/components/ExportBuilder/utils/sizeEstimator.ts` (new helper if needed)

---

### 5.8: Support Multi-View Export Per Layer

**Goal:** Allow exporting one or many saved filtered views for the same layer.

**Acceptance Criteria:**
- [ ] Active filtered view is selected by default for each layer
- [ ] User can include additional saved filtered views
- [ ] Export package groups each selected view into its own subfolder path
- [ ] UI clearly shows selected view count per layer
- [ ] Large multi-view selections trigger warning when estimated size crosses threshold

**UX Notes:**
- Progressive disclosure keeps basic path simple while enabling power workflows.

**Files to Update:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/exportActions.ts`
- `src/v2/components/ExportBuilder/types.ts`

---

### 5.9: Add Query/Filter Definition Export Option

**Goal:** Include reproducible query definitions with exported data.

**Acceptance Criteria:**
- [ ] Per-layer toggle to include query/filter definitions in output package
- [ ] Export includes machine-readable query payload (JSON) for each selected view
- [ ] Manifest maps data artifacts to originating query/view identifiers
- [ ] Option works for both ZIP export and generated links output
- [ ] Sensitive/internal fields are excluded from exported query payload

**Files to Update:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/exportActions.ts`
- `src/v2/components/ExportBuilder/types.ts`

---

### 5.10: Unify Visual Tokens and Card Affordances

**Goal:** Remove off-system visual cues (for example ad-hoc purple borders) and improve scanability for many-layer scenarios.

**Acceptance Criteria:**
- [ ] Replace ad-hoc accent colors with approved design tokens from `design-system.md`
- [ ] Parent layer containers and child filtered-view rows have consistent visual hierarchy
- [ ] Selection state does not rely on color alone (iconography/text/state label included)
- [ ] Borders/backgrounds/dividers are consistent with existing v2 component language
- [ ] Contrast meets WCAG AA for text and state indicators

**Files to Update:**
- `src/v2/components/ExportBuilder/LayerExportSection.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `docs/00-design-iteration/design-system/design-system.md` (if new token usage is standardized)

---

## Discoveries / Decisions Made

> When working on this phase, document any decisions that might affect other phases.

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| (none yet) | | |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Open Questions

- [ ] Should header helper text collapse to a compact info row once user has at least one pinned layer?
- [ ] How should we cap multi-view selection per layer before warning or hard limits apply?
- [ ] Do we estimate image payload size from sampled file metadata, configured heuristics, or service-side hints?
- [ ] What query definition schema is stable enough for downstream reproducibility workflows?
- [ ] Should generated links include per-view query payloads directly or reference a manifest resource?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 16, 2026 | 5.5-5.10 | Added post-MVP refinement tasks based on UI/UX review: copy-density reduction, map-widget hierarchy alignment (Layer -> Filtered Views), per-layer size estimates, multi-view export, query-definition export, and visual token consistency updates | Claude |
| Feb 16, 2026 | 5.4 | Implemented export actions end-to-end: wired "Export ZIP" and "Generate Links" in `ExportBuilderModal`; added loading/disabled states in `ExportBuilderFooter`; added `exportActions.ts` for ZIP packaging (manifest + per-layer JSON + links file) and share-link text generation with clipboard + download fallback | Claude |
| Feb 16, 2026 | 5.3 | Implemented export summary + size estimation: added `ExportSummary` component and wired dynamic per-layer summary rows with estimated total size based on selected formats and current filtered result counts | Claude |
| Feb 16, 2026 | 5.2 | Revised 5.2 to filtered-only model: removed bookmark export mode and bookmark item controls from `ExportBuilderModal`; sections now focus on active query summary, result count, and format options | Claude |
| Feb 16, 2026 | 5.1 | Implemented Export Builder modal shell (`ExportBuilderModal`, `ExportBuilderHeader`, `ExportBuilderFooter`) and wired shopping cart button in `V2Header` to open/close modal in `V2App` | Claude |
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Jan 29, 2026 | 5.1 | Updated with DFT-002 resolution (modal opens from global header button) | Will + Claude |

