# Phase 12: Export Code Generation (Python + R)

**Status:** 🟢 Complete  
**Progress:** 3 / 3 tasks (completed tasks archived)  
**Last Archived:** Feb 25, 2026 — see `docs/archive/phases/phase-12-export-code-generation-completed.md`  
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

*Completed tasks (12.1–12.3) archived. See `docs/archive/phases/phase-12-export-code-generation-completed.md`.*

**Archived completed tasks:** `12.1`, `12.2`, and `12.3` moved to `docs/archive/phases/phase-12-export-code-generation-completed.md` on Feb 25, 2026.

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

*Completed task details (12.1–12.3) archived. See `docs/archive/phases/phase-12-export-code-generation-completed.md`.*

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
| Feb 25, 2026 | — | **Archived** completed tasks (12.1–12.3) to `docs/archive/phases/phase-12-export-code-generation-completed.md`. Phase doc trimmed. | — |
