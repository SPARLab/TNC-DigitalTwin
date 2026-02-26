# Phase 12: Export Code Generation — Archived Completed Tasks

**Archived:** Feb 25, 2026  
**Purpose:** Archive of completed Phase 12 Export Code Generation tasks (12.1–12.3). Full details preserved for reference.  
**Source:** `docs/IMPLEMENTATION/phases/phase-12-export-code-generation.md`

---

## Quick Task Summary (Archived)

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 12.1 | 🟢 Complete | Feb 25, 2026 | Define export code-generation contract for Export Builder | Contract in doc; types, mappers, templates, module boundaries implemented |
| 12.2 | 🟢 Complete | Feb 25, 2026 | Implement iNaturalist + Dendra Python/R snippet generation | Per-layer codegen, Dangermond bbox, smooth animation, error-only feedback |
| 12.3 | 🟢 Complete | Feb 25, 2026 | Validate UX and quality for demo readiness | UI review fixes: layer card figure-ground, scrollbar, step indicator, success feedback, semantic naming |

---

## Task Status (Archived)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 12.1 | Define code-generation contract and template architecture | 🟢 Complete | | Contract narrow to iNaturalist + Dendra for MVP |
| 12.2 | Build Python/R generators for iNaturalist and Dendra | 🟢 Complete | | Per-layer UI, pandas/readr-first snippets |
| 12.3 | Integrate UI actions + testing + demo verification | 🟢 Complete | | UX validation: principled review fixes, overlay scrollbar, transient success feedback |

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
