# TNC Digital Catalog - Documentation Structure

**Last Updated:** January 28, 2026

---

## 📂 Full Structure

```
docs/
├── README.md                              ← You are here! Navigation guide
│
├── 00-design-iteration/                   ← ACTIVE DESIGN WORK
│   ├── README.md                          ← Design iteration workflow guide
│   ├── mockups-changelog.md               ← Track mockup versions
│   │
│   ├── design-system/
│   │   ├── design-system.md              ← Core design documentation
│   │   ├── components.md                 ← (Future) Component specs
│   │   ├── patterns.md                   ← (Future) UX patterns
│   │   └── decisions.md                  ← (Future) Design rationale log
│   │
│   └── feedback/
│       ├── design-task-tracker.md                    ← Active feedback (DFT-XXX)
│       ├── _TEMPLATE.md                  ← Template for processing feedback
│       │
│       ├── meeting-notes/                ← Raw transcripts
│       │   ├── data-catalog-ux-paradigm-jan-21-2026.md
│       │   ├── digital-catalog-feedback-meeting-jan-15-2026.md
│       │   ├── digital-catalog-meeting-jan-20-2026.md
│       │   └── mockup-review-email-draft.md
│       │
│       └── resolved/                     ← Archived decisions
│           └── dft-001-resolution-summary.md
│
├── 01-implementation-plan/                ← DEVELOPMENT ROADMAP
│   ├── master-development-plan.md        ← Overall strategy
│   │
│   ├── phases/
│   │   ├── phase-0-foundation.md         ← Core infrastructure
│   │   ├── phase-1-inaturalist.md        ← iNaturalist integration
│   │   ├── phase-2-animl.md              ← ANiML integration
│   │   ├── phase-3-dendra.md             ← Dendra integration
│   │   ├── phase-4-dataone.md            ← DataONE integration
│   │   ├── phase-5-export-builder.md     ← Export functionality
│   │   └── phase-6-polish.md             ← Final polish
│   │
│   └── archive/                          ← Old plans, one-time briefs
│       ├── backend-coworker-brief.md
│       ├── development-roadmap.md
│       ├── IMPLEMENTATION_SUMMARY.md
│       └── v1-pre-feb20th-2026-mockup-development-plan.md
│
├── animl-optimization/                    ← ANiML performance research
│   ├── README.md
│   ├── IMPLEMENTATION_PROMPT.md
│   ├── QUERY_TESTING_GUIDE.md
│   ├── START_IMPLEMENTATION_NOW.md
│   ├── TESTING_START_HERE.md
│   └── archive/                          ← Old optimization attempts
│
├── archive/                               ← General archive
│   └── GROUP_BY_VS_MEMORY_EXPLAINED.md
│
├── data_sources/                          ← Data source documentation
│   ├── animl.md
│   ├── calflora.md
│   ├── dataone.md
│   ├── dendra.md
│   ├── drone-imagery.md
│   ├── ebird.md
│   ├── inaturalist.md
│   ├── lidar.md
│   └── tnc-arcgis.md
│
├── debug_prompts/                         ← Debugging documentation
│   ├── animl_date_filtering_issue.md
│   └── ebird_query_debugging.md
│
├── research_findings/                     ← Technical research
│   ├── dataone-api-exploration.md
│   ├── dataone-metadata-structure.md
│   └── drone-imagery-research.md
│
└── testing/                               ← QA documentation
    └── test-plan.md
```

---

## 🎯 Quick Lookup

### "I have meeting feedback to process"
→ Go to `00-design-iteration/feedback/`
1. Save notes in `meeting-notes/`
2. Use `_TEMPLATE.md` to extract items
3. Add to `design-task-tracker.md`

### "I need to make a design decision"
→ Go to `00-design-iteration/feedback/design-task-tracker.md`
1. Find the DFT-XXX item
2. Discuss with AI in Cursor
3. Document resolution
4. Move full context to `resolved/`

### "I'm ready to implement"
→ Go to `01-implementation-plan/`
1. Check `master-development-plan.md` for phase status
2. Open relevant phase document
3. Pick a task and start coding

### "I need to understand a data source"
→ Go to `data_sources/[source-name].md`

### "I'm debugging an issue"
→ Check `debug_prompts/` or `animl-optimization/`

---

## 🔄 The Development Cycle

```
┌───────────────────────────────────────────────────┐
│ 1. GATHER FEEDBACK                                │
│    • Meeting notes → meeting-notes/               │
│    • Extract items → design-task-tracker.md                   │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│ 2. DESIGN ITERATION                               │
│    • Discuss DFT items in Cursor                  │
│    • Explore alternatives                         │
│    • Make decisions                               │
│    • Document in design-system/                   │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│ 3. CREATE MOCKUPS                                 │
│    • Update mockup HTML                           │
│    • Version it (v2.1, v2.2, etc.)                │
│    • Log in mockups-changelog.md                  │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│ 4. TEAM REVIEW                                    │
│    • Share mockup with team                       │
│    • Gather feedback → Back to step 1             │
│    OR                                             │
│    • Design approved → Continue to step 5         │
└─────────────────┬─────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│ 5. IMPLEMENTATION                                 │
│    • Transfer decisions to implementation-plan/   │
│    • Break into tasks by phase                    │
│    • Code, test, ship                             │
└───────────────────────────────────────────────────┘
```

---

## 📝 File Naming Conventions

### Feedback Items
- **Format:** `DFT-XXX` (Design Feedback Tracker item)
- **Example:** `DFT-001`, `DFT-015`
- **Location:** `design-task-tracker.md`

### Meeting Notes
- **Format:** `[topic]-[date].md`
- **Example:** `digital-catalog-meeting-jan-20-2026.md`
- **Location:** `feedback/meeting-notes/`

### Resolved Decisions
- **Format:** `dft-XXX-resolution-summary.md`
- **Example:** `dft-001-resolution-summary.md`
- **Location:** `feedback/resolved/`

### Mockups
- **Format:** `[name]-v[major].[minor].html`
- **Example:** `01-full-layout-v2.1.html`
- **Location:** `../../mockups/`

---

## 🤖 AI-Assisted Workflows

### Extract Feedback from Transcript
1. Save transcript in `meeting-notes/`
2. Use prompt from `_TEMPLATE.md`
3. AI creates structured DFT entries in `design-task-tracker.md`

### Resolve Feedback Item
1. Open `design-task-tracker.md` item
2. Discuss with AI (explore options, rationale)
3. AI updates:
   - `design-task-tracker.md` (mark resolved)
   - `resolved/dft-XXX-summary.md` (full context)
   - `design-system/` (specs)
   - `mockups-changelog.md` (if mockup updated)

### Update Implementation Plan
1. After design is stable
2. AI transfers decisions to `master-development-plan.md`
3. AI updates phase documents with tasks

---

## 📊 Status at a Glance

### Design Iteration Status
Check `feedback/design-task-tracker.md` for open DFT items

### Implementation Status
Check `01-implementation-plan/master-development-plan.md` for phase progress

### Mockup Versions
Check `mockups-changelog.md` for latest version

---

**Questions?** Check the README in each subfolder for detailed guidance.
