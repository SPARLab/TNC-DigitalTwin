# Phase 12: Export Code Generation (Python + R)

**Status:** 🟡 In Progress  
**Progress:** 0 / 3 tasks  
**Branch:** `v2/export-code-generation`  
**Depends On:** Phase 5 (Export Builder modal/actions)  
**Owner:** TBD

---

## Phase Goal

Demonstrate the forward direction of Export Builder by generating copy/paste-ready Python and R import code for selected exports, starting with iNaturalist and Dendra only.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Export Builder phase: `docs/IMPLEMENTATION/phases/phase-5-export-builder.md`
- Archived Export Builder implementation details: `docs/archive/phases/phase-5-export-builder-completed.md`
- Paradigm: `docs/feedback/data-catalog-ux-paradigm-jan-21-2026.md` (Part 6 - Export Builder)

## Scope (MVP for Demo)

- In scope:
  - iNaturalist code generation (Python + R)
  - Dendra code generation (Python + R)
  - Export Builder UI actions to copy/download generated code
- Out of scope (follow-up):
  - DataOne, TNC ArcGIS, Calflora, GBIF, MOTUS, DroneDeploy, and ANiML code generation
  - Fully generalized code templates across all adapters
  - Advanced SDK-specific optimizations

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 12.1 | 🟡 In Progress | Feb 25, 2026 | Define export code-generation contract for Export Builder | Contract draft added in this doc (types, payload mapping, unsupported-source behavior) |
| 12.2 | 🟡 In Progress | Feb 25, 2026 | Implement iNaturalist + Dendra Python/R snippet generation | Codegen modules added and footer actions wired; pending UX validation and tests |
| 12.3 | ⚪ Not Started | Feb 25, 2026 | Validate UX and quality for demo readiness | Ensure copy/download flows work, snippets are readable, and add targeted tests |

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 12.1 | Define code-generation contract and template architecture | 🟡 In Progress | | Keep contract narrow to iNaturalist + Dendra for MVP |
| 12.2 | Build Python/R generators for iNaturalist and Dendra | 🟡 In Progress | | Prefer pandas/readr-first snippets; no SDK lock-in for MVP |
| 12.3 | Integrate UI actions + testing + demo verification | ⚪ Not Started | | Include fallback behavior for unsupported formats/data sources |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Acceptance Criteria (MVP)

- Export Builder exposes clear actions to generate Python and R code.
- Generated snippets are copy/paste-ready and include:
  - Required imports
  - Data loading steps
  - Minimal transformation notes
- iNaturalist and Dendra layer/view selections produce deterministic code from current selection state.
- Unsupported data sources are either hidden or clearly labeled "coming soon."
- Basic tests cover generator output for iNaturalist and Dendra.

---

## Task 12.1: Export Code-Generation Contract (Draft)

This contract extends the existing Export Builder payload (`ExportActionLayer` and `ExportActionView`) with a small, deterministic generator interface for Python and R snippets.

### 12.1A Template Input / Output Types

```ts
type ExportCodeLanguage = 'python' | 'r';

type SupportedCodegenSource = 'inaturalist' | 'dendra';
type UnsupportedCodegenSource =
  | 'animl'
  | 'dataone'
  | 'gbif'
  | 'calflora'
  | 'tncArcGIS'
  | 'droneDeploy'
  | 'motus';

interface ExportCodegenRequest {
  language: ExportCodeLanguage;
  layer: ExportActionLayer;
  view: ExportActionView;
  generatedAtIso: string;
  sourceUrl: string;
}

interface ExportCodegenResult {
  ok: boolean;
  language: ExportCodeLanguage;
  fileExtension: 'py' | 'R';
  fileName: string;
  title: string;
  snippet: string;
  warnings?: string[];
  metadata: {
    dataSource: DataSource;
    layerId: string;
    viewId: string;
  };
}

interface ExportCodegenUnsupportedResult {
  ok: false;
  language: ExportCodeLanguage;
  reason: 'UNSUPPORTED_SOURCE' | 'MISSING_QUERY_DEFINITION' | 'INVALID_VIEW';
  message: string;
  dataSource: DataSource;
}
```

### 12.1B Per-Layer Payload Mapping

Use `view.queryDefinition` as the canonical source of filter state and keep mapping deterministic (same input payload always produces identical snippet body except timestamp comments).

| Data Source | Required Query Payload | Optional Query Payload | Notes |
|-------------|------------------------|------------------------|-------|
| `inaturalist` | `queryDefinition.inaturalistFilters` | `queryDefinition.filterSummary`, `view.filteredResultCount` | Build URL/query params from iNaturalist filter object; include taxon/place/date/quality fields when present. |
| `dendra` | `queryDefinition.dendraFilters` | `queryDefinition.filterSummary`, `view.filteredResultCount` | Build request params from Dendra time/filter object; include site/sensor/time-range fields when present. |

### 12.1C Guardrails for Unsupported Sources

- If `layer.dataSource` is not `inaturalist` or `dendra`, return `UNSUPPORTED_SOURCE` and do not attempt best-effort template generation.
- If supported source is selected but required filter payload is missing, return `MISSING_QUERY_DEFINITION`.
- If `view` is absent/invalid for selected layer, return `INVALID_VIEW`.
- UI behavior in Export Builder:
  - "Get Python Code" and "Get R Code" actions are visible only for supported sources in MVP.
  - If unsupported sources are present in cart, show a clear "coming soon" note and keep existing non-code export actions available.

### 12.1D File/Module Boundaries (Planned for 12.2)

- `src/v2/components/ExportBuilder/codegen/types.ts`: shared request/result types.
- `src/v2/components/ExportBuilder/codegen/mappers.ts`: source-specific payload normalization.
- `src/v2/components/ExportBuilder/codegen/pythonTemplates.ts`: Python snippet templates.
- `src/v2/components/ExportBuilder/codegen/rTemplates.ts`: R snippet templates.
- `src/v2/components/ExportBuilder/codegen/index.ts`: `generateExportCode(request)` dispatch + guardrails.

---

## Open Questions

- [ ] Should generated code default to loading downloaded files, direct URLs, or both?
- [ ] Should snippets be per-layer only, or include a bundled multi-layer script option in MVP?
- [ ] Should we include explicit package install comments (`pip install`, `install.packages`) in MVP output?

---

## Discoveries / Decisions Made

### Architectural Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Export code-generation contract uses strict source gating (`inaturalist` and `dendra` only) for MVP | Feb 25, 2026 | Keeps demo scope deterministic and avoids brittle "partial support" snippets for data sources that lack finalized payload mappings. |
| Export Builder code actions generate bundled snippets per selected view with clipboard + file download | Feb 25, 2026 | Preserves existing Export Builder mental model (multi-view cart) while delivering copy/paste-ready code with minimal user friction. |

### Styling Decisions

| Decision | Date | Rationale | Added to design-system.md? |
|----------|------|-----------|---------------------------|
| (none yet) | | | |

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 25, 2026 | - | Created Phase 12 document for Export Code Generation MVP (iNaturalist + Dendra, Python + R) | Codex |
| Feb 25, 2026 | 12.1 | Marked task in progress and added draft code-generation contract (types, payload mapping, guardrails, module boundaries) | Codex |
| Feb 25, 2026 | 12.2 | Added codegen modules (`codegen/`) and wired Export Builder footer actions for "Get Python Code" and "Get R Code" with source guardrails | Codex |
