# Phase 12: Export Code Generation (Python + R)

**Status:** 🟢 Complete  
**Progress:** 3 / 3 tasks  
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
| 12.1 | 🟢 Complete | Feb 25, 2026 | Define export code-generation contract for Export Builder | Contract in doc; types, mappers, templates, module boundaries implemented |
| 12.2 | 🟢 Complete | Feb 25, 2026 | Implement iNaturalist + Dendra Python/R snippet generation | Per-layer codegen, Dangermond bbox, smooth animation, error-only feedback |
| 12.3 | 🟢 Complete | Feb 25, 2026 | Validate UX and quality for demo readiness | UI review fixes: layer card figure-ground, scrollbar, step indicator, success feedback, semantic naming |

---

## Task Status

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 12.1 | Define code-generation contract and template architecture | 🟢 Complete | | Contract narrow to iNaturalist + Dendra for MVP |
| 12.2 | Build Python/R generators for iNaturalist and Dendra | 🟢 Complete | | Per-layer UI, pandas/readr-first snippets |
| 12.3 | Integrate UI actions + testing + demo verification | 🟢 Complete | | UX validation: principled review fixes, overlay scrollbar, transient success feedback |

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
| Export Builder scroll area: hover-only overlay scrollbar, no track, `scrollbar-gutter: stable` | Feb 25, 2026 | Avoids content shift; thumb appears on hover; no visible track per user request | Yes |
| Layer card figure-ground: `bg-slate-50` ground, white cards with `shadow-sm` | Feb 25, 2026 | Layer cards (export targets) stand out as figures; Gestalt Common Region | Yes |
| "Import code" → "Code generation"; "Size unavailable" → "Estimate pending" / em-dash | Feb 25, 2026 | Resolves export/import semantic contradiction; reduces repetitive negative copy | Yes |

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Feb 25, 2026 | - | Created Phase 12 document for Export Code Generation MVP (iNaturalist + Dendra, Python + R) | Codex |
| Feb 25, 2026 | 12.1 | Marked task in progress and added draft code-generation contract (types, payload mapping, guardrails, module boundaries) | Codex |
| Feb 25, 2026 | 12.2 | Added codegen modules (`codegen/`) and wired Export Builder footer actions for "Get Python Code" and "Get R Code" with source guardrails | Codex |
| Feb 25, 2026 | 12.2 | Updated code-generation UX to render generated Python/R in a modal code block with explicit copy action instead of auto-downloading files | Codex |
| Feb 25, 2026 | 12.2 | Updated iNaturalist templates to include Dangermond expanded bbox params and fixed Python params syntax comma issue | Codex |
| Feb 25, 2026 | 12.2 | Updated preview UX to render separate code blocks per data source with per-block copy actions plus a copy-all action | Codex |
| Feb 25, 2026 | 12.2 | Moved code actions into each layer section so Python/R generation and preview are per-layer (instead of one master bundle panel) | Codex |
| Feb 25, 2026 | 12.2 | Fixed per-layer codegen bug: selected views with no explicit filter payload now generate using source defaults instead of blocking with query-state error | Codex |
| Feb 25, 2026 | 12.2 | Added smooth expand/collapse animation for per-layer generated code preview panel in Export Builder | Codex |
| Feb 25, 2026 | 12.2 | Suppressed success toasts in Export Builder; feedback banner now appears only for errors | Codex |
| Feb 25, 2026 | 12.1, 12.2 | Marked tasks complete; 12.3 (UX validation + tests) remains | Codex |
| Feb 25, 2026 | 12.3 | UI/UX principled review fixes: layer card figure-ground, Export outputs container, step indicator, success feedback, scrollbar (hover-only overlay, no track), semantic naming, size text | Codex |
| Feb 25, 2026 | 12.3 | Marked task complete; Phase 12 complete | Codex |
