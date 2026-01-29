# Documentation Structure

This folder contains all documentation for the TNC Digital Catalog project, organized by development phase.

## 📋 Quick Navigation

| Folder | Purpose | When to Use |
|--------|---------|-------------|
| **00-design-iteration/** | Active design work | When gathering feedback, exploring options, making UX decisions |
| **01-implementation-plan/** | Implementation roadmap | When ready to build, tracking development progress |
| **animl-optimization/** | ANiML performance research | Domain-specific technical investigations |
| **data_sources/** | Data source documentation | Understanding data APIs and schemas |
| **testing/** | Testing strategy | QA planning and test documentation |

---

## 🎨 00-design-iteration/

**Purpose:** Iterative design process from feedback to decision.

```
00-design-iteration/
├── design-system/           ← Component specs, patterns, design decisions
├── feedback/
│   ├── design-task-tracker.md          ← Active feedback items (DFT-XXX)
│   ├── meeting-notes/      ← Raw transcripts and notes
│   └── resolved/           ← Archived decisions with full context
└── mockups-changelog.md    ← (To be created) Track mockup versions
```

**Workflow:**
1. Meeting/feedback → Add to `design-task-tracker.md`
2. Discuss with AI → Resolve and document decision
3. Update `design-system/` with specs
4. Create/update mockups → Log in `mockups-changelog.md`
5. Once stable → Transfer to implementation plan

---

## 🚀 01-implementation-plan/

**Purpose:** Development roadmap and task tracking.

```
01-implementation-plan/
├── master-development-plan.md    ← Overall strategy, phase status
├── phases/
│   ├── phase-0-foundation.md    ← Core infrastructure
│   ├── phase-1-inaturalist.md   ← Data source integrations
│   └── ...
└── archive/                     ← Old plans, one-time briefs
```

**When to Use:**
- Design is stable and ready for implementation
- Tracking development progress
- Coordinating with backend team

---

## 🔄 The Flow

```
Feedback → Design Iteration → Implementation

┌─────────────────────┐
│ Team Meeting        │
│ User Testing        │
│ Stakeholder Review  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 00-design-iteration/            │
│ • design-task-tracker.md (DFT-XXX)          │
│ • AI discussion in Cursor       │
│ • Resolve & document decision   │
│ • Update design-system/         │
│ • Create mockup                 │
└──────────┬──────────────────────┘
           │
           ▼ (design stable)
┌─────────────────────────────────┐
│ 01-implementation-plan/         │
│ • Break down into tasks         │
│ • Assign to phases              │
│ • Track development             │
└─────────────────────────────────┘
```

---

## 📝 Document Types

### Feedback Items (DFT-XXX)
**Location:** `00-design-iteration/feedback/design-task-tracker.md`

Each item captures a design question or decision point from user feedback.

**Lifecycle:**
- 🟡 Open → Under discussion
- 🔵 In Discussion → Active exploration
- 🟢 Resolved → Decision made, documented
- ⚪ Deferred → Future consideration

Once resolved, full context moves to `resolved/` folder.

### Design Decisions
**Location:** `00-design-iteration/design-system/`

Rationale and specs for UX patterns, components, and interactions.

### Implementation Tasks
**Location:** `01-implementation-plan/phases/`

Concrete, actionable development tasks with acceptance criteria.

---

## 🤖 AI-Assisted Workflow

### Processing Feedback
1. Paste meeting transcript into Cursor
2. Use prompt: "Extract feedback items using the template in feedback/design-task-tracker.md"
3. AI creates structured DFT-XXX entries

### Resolving Feedback
1. Open tracker item in Cursor
2. Discuss options with AI
3. Make decision
4. AI updates: design-task-tracker.md, design-system/, and (if needed) implementation-plan/

### Creating Mockups
1. After design decision, update mockup
2. Version mockups: `mockup-v2.html`, `mockup-v2.1.html`
3. Log changes in `mockups-changelog.md`

---

## 📚 Related Resources

- **Mockups:** `/mockups/` folder (visual prototypes)
- **Source Code:** `/src/` folder (implementation)
- **Scripts:** `/scripts/` folder (automation, data processing)

---

**Last Updated:** January 28, 2026
