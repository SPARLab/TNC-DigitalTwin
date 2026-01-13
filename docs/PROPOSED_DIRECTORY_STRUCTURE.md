# Proposed Directory Structure Cleanup

**Status:** Proposal - Not yet implemented  
**Related:** See Task 9.1 in `development_plans/january-2026-ui-improvements.md`

## Current Issues

The repository root directory contains scattered documentation files, one-off scripts, and test files that make the project structure unclear and hard to navigate.

## Proposed Changes

### Root Directory (After Cleanup)

Keep only essential files:
- Configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)
- `README.md`
- `index.html`
- Standard directories (`src/`, `public/`, `docs/`, `scripts/`, `e2e/`, etc.)

### Files to Move

#### Documentation Files → `docs/` subdirectories

| Current Location | Proposed Location | Reason |
|-----------------|-------------------|--------|
| `ANIML_CONTEXT_PROMPT.txt` | `docs/animl-optimization/CONTEXT_PROMPT.txt` | Belongs with Animl docs |
| `ANIML_TESTING_START_HERE.md` | `docs/animl-optimization/TESTING_START_HERE.md` | Belongs with Animl docs |
| `CSV_INTEGRATION_SUMMARY.md` | `docs/data_sources/CSV_INTEGRATION_SUMMARY.md` | Data source documentation |
| `EBIRD_QUERY_DEBUGGING.md` | `docs/debug_prompts/ebird_query_debugging.md` | Debug documentation |
| `GROUP_BY_VS_MEMORY_EXPLAINED.md` | `docs/reference/GROUP_BY_VS_MEMORY.md` or `docs/archive/` | Reference or archive |
| `TESTING_SETUP.md` | `docs/testing/TESTING_SETUP.md` (optional) | Could stay in root or move to docs |

#### Scripts → `scripts/one-off/`

| Current Location | Proposed Location | Reason |
|-----------------|-------------------|--------|
| `check-hubpage-urls.js` | `scripts/one-off/check-hubpage-urls.js` | One-off utility script |
| `explore-hub.js` | `scripts/one-off/explore-hub.js` | One-off utility script |
| `investigate-documents.js` | `scripts/one-off/investigate-documents.js` | One-off utility script |
| `test-animl-queries.html` | `scripts/one-off/test-animl-queries.html` or DELETE | Test file, may be obsolete |
| `test-hub-urls.html` | `scripts/one-off/test-hub-urls.html` or DELETE | Test file, may be obsolete |

#### Assets

| Current Location | Proposed Location | Notes |
|-----------------|-------------------|-------|
| `assets/` (screenshots) | `docs/assets/` | If these are reference images for documentation |
| | OR keep in root | If these are used in production |

## New Directories to Create

### `docs/research_findings/`
Store all research documentation from Task 1.1 and future research:
- `typography-best-practices.md`
- `spacing-best-practices.md`
- `design-system-research-summary.md`

### `docs/archive/`
For historical documentation that's no longer actively used but should be kept for reference:
- Deprecated guides
- Old implementation notes
- Historical context documents

### `docs/reference/`
For reference documentation that doesn't fit other categories:
- Technical explanations
- Architecture decisions
- Best practices guides

### `docs/testing/`
Consolidated testing documentation:
- `TESTING_SETUP.md` (if moved from root)
- Testing strategies
- E2E test documentation

### `scripts/one-off/`
For utility scripts that aren't part of the main build process:
- Data exploration scripts
- One-time migration scripts
- Debug/test utilities

## Benefits

1. **Cleaner Root:** Only essential files in root directory
2. **Better Organization:** Related files grouped together
3. **Easier Navigation:** Clear directory structure
4. **Better Discoverability:** Logical locations for documentation
5. **Scalability:** Room to grow without cluttering root

## Implementation Checklist

See Task 9.1 in `development_plans/january-2026-ui-improvements.md` for full checklist.

- [ ] Create new directories
- [ ] Move files to new locations
- [ ] Update any links in documentation
- [ ] Add README files to new directories
- [ ] Update `.gitignore` if needed
- [ ] Test that no links are broken

## After Cleanup - Proposed Root Structure

```
TNC-DigitalTwin/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── .gitignore
├── docs/
│   ├── README.md (documentation index)
│   ├── research_findings/
│   ├── development_plans/
│   ├── data_sources/
│   ├── animl-optimization/
│   ├── debug_prompts/
│   ├── reference/
│   ├── archive/
│   ├── testing/
│   └── assets/
├── src/
├── public/
├── scripts/
│   ├── animl-eda/
│   ├── category-analysis/
│   ├── drone-imagery-eda/
│   └── one-off/
├── e2e/
├── dist/
└── node_modules/
```

## Notes

- Consider reviewing each file before moving to determine if it's still needed
- Some files might be candidates for deletion rather than archiving
- Update team on new structure after implementation
- Consider adding a CONTRIBUTING.md with links to key documentation

