# Phase 5: Export Builder

**Status:** ⚪ Not Started  
**Progress:** 0 / 4 tasks  
**Branch:** `v2/export`  
**Depends On:** Phases 1-4 (all data sources)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach to ensure we're moving in the right direction.

---

## Phase Goal

Implement the Export Builder that brings together all pinned layers and bookmarked features into a unified export workflow.

## Reference Documents

- Master Plan: `docs/development_plans/master-development-plan.md`
- Design System: `docs/development_plans/design-system.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 6 - Export Builder)
- Mockup: `mockups/02f-export-builder.html`

## Key Paradigm Notes

- Export Builder shows ALL pinned layers with their active queries
- Each layer offers: export filtered results, export bookmarked only, or skip
- Bookmarks with Level 3 filters show their filters (editable)
- Export summary aggregates all selections with estimated size
- Two export actions: "Export ZIP" and "Generate Links"

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 5.1 | Create Export Builder modal shell | ⚪ Not Started | | |
| 5.2 | Implement per-layer export sections | ⚪ Not Started | | |
| 5.3 | Implement export summary and size estimation | ⚪ Not Started | | |
| 5.4 | Implement export actions (ZIP / Links) | ⚪ Not Started | | |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 5.1: Create Export Builder Modal Shell

**Goal:** Set up the modal that contains the Export Builder.

**Acceptance Criteria:**
- [ ] Modal opens from "Export All" button in bookmark widget
- [ ] Modal is full-screen or large overlay
- [ ] Header shows count: "You have X pinned layers and Y bookmarked features"
- [ ] Close button works
- [ ] Scrollable content area for many layers
- [ ] Fixed footer with action buttons

**Files to Create:**
- `src/v2/components/ExportBuilder/ExportBuilderModal.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderHeader.tsx`
- `src/v2/components/ExportBuilder/ExportBuilderFooter.tsx`

---

### 5.2: Implement Per-Layer Export Sections

**Goal:** For each pinned layer, show export options.

**Acceptance Criteria:**
- [ ] Each layer gets its own section/card
- [ ] Section shows: layer name, current query summary
- [ ] Radio options: "Export filtered results" / "Export bookmarked only" / "Skip"
- [ ] If bookmarks exist for this layer, show them with checkboxes
- [ ] Bookmarks with Level 3 filters show "Change Filter" button
- [ ] Data-type-specific format options (CSV, GeoJSON, images, etc.)

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
- `src/v2/components/ExportBuilder/BookmarkExportItem.tsx`

---

### 5.3: Implement Export Summary and Size Estimation

**Goal:** Show aggregated summary of what will be exported.

**Acceptance Criteria:**
- [ ] Summary section at bottom of content area
- [ ] Lists all selected features with counts
- [ ] Estimated total size calculated and displayed
- [ ] Updates dynamically as user changes selections

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
- [ ] "Export ZIP" button creates downloadable archive
- [ ] "Generate Links" button creates shareable links (if supported)
- [ ] "Cancel" button closes modal
- [ ] Loading state while export is processing
- [ ] Success/error feedback

**Technical Notes:**
- ZIP generation may require server-side processing
- For V1, "Generate Links" might just copy bookmark URLs
- Consider progressive download for large exports

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

- [ ] Server-side ZIP generation required? Or client-side?
- [ ] Max export size limit?
- [ ] "Generate Links" - what does this actually produce?
- [ ] Authentication required for any exports?

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |

