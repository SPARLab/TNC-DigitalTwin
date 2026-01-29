# TNC Digital Catalog - Documentation

**Last Updated:** January 28, 2026

---

## 🎯 YOUR TWO MAIN FILES

| File | Purpose |
|------|---------|
| **[task-tracker.md](./task-tracker.md)** | What needs to be done? All feedback items, design decisions, discussion points (DFT-XXX) |
| **[master-plan.md](./master-plan.md)** | What are we building? Overall strategy, phase status, implementation roadmap |

**Everything else is supporting documentation in organized folders.**

---

## ⚡ Quick Workflows

### 🎤 "I have meeting feedback"
1. Open `task-tracker.md`
2. Add new DFT-XXX item (or use AI to extract from notes)
3. Discuss with AI if needed
4. Mark resolved when decided

### 💭 "I need to make a design decision"
1. Find the DFT-XXX item in `task-tracker.md`
2. Discuss options with AI in Cursor
3. Document decision in tracker
4. Update `master-plan.md` if it affects implementation

### 🎨 "I need to create/update a mockup"
1. Make changes to HTML in `/mockups/`
2. Log changes in `00-design-iteration/mockups-changelog.md`
3. Share with team for feedback
4. Feedback → back to task-tracker.md

### 🔨 "I'm ready to build something"
1. Check `master-plan.md` for phase status
2. Open phase doc in `01-implementation-plan/phases/`
3. Pick a task and build
4. Update phase doc when complete

---

## 🧠 ADHD-Friendly Tips

- **Two files matter most:** `task-tracker.md` and `master-plan.md`
- **Start sessions here:** Open this README first to orient yourself
- **One thing at a time:** Pick one DFT item or one phase task
- **Close loops:** Mark things resolved/complete immediately
- **Archive liberally:** Move old stuff out of sight (resolved/, archive/)

**When in doubt:** Open `task-tracker.md` → Find the next open item → Work on it.

---

## 📁 Folder Structure

```
docs/
├── task-tracker.md          ← What needs attention?
├── master-plan.md           ← What's the big picture?
│
├── 00-design-iteration/     ← Design specs & resolved decisions
│   ├── design-system/
│   ├── feedback/
│   │   ├── meeting-notes/
│   │   ├── resolved/
│   │   └── _TEMPLATE.md
│   └── mockups-changelog.md
│
├── 01-implementation-plan/  ← Phase tasks & archived plans
│   ├── phases/
│   │   ├── phase-0-foundation.md
│   │   ├── phase-1-inaturalist.md
│   │   └── ...
│   └── archive/
│
├── animl-optimization/      ← ANiML performance research
├── data_sources/            ← Data source documentation
├── research_findings/       ← Technical research
└── testing/                 ← QA documentation
```

### When to Use Each Folder

| Folder | When to Use |
|--------|-------------|
| **00-design-iteration/** | Need design system specs, resolved decisions, meeting notes |
| **01-implementation-plan/** | Ready to build, need detailed phase tasks |
| **animl-optimization/** | Working on ANiML-specific optimization |
| **data_sources/** | Need to understand a data source API |

---

## 🔄 The Development Cycle

```
1. GATHER FEEDBACK (meeting, testing, review)
   ↓
2. ADD TO task-tracker.md as DFT-XXX item
   ↓
3. DESIGN ITERATION (discuss with AI, make decision)
   ↓
4. UPDATE master-plan.md (if needed)
   ↓
5. CREATE MOCKUP (if needed, log in mockups-changelog.md)
   ↓
6. IMPLEMENTATION (use phase docs, code, test, ship)
```

---

## 🤖 AI-Assisted Workflows

### Process Feedback
```
1. Paste meeting notes into Cursor
2. Ask AI: "Extract feedback items into task-tracker.md using the template"
3. AI creates structured DFT-XXX entries
```

### Resolve Feedback Item
```
1. Open DFT-XXX item in task-tracker.md
2. Discuss with AI (explore options, rationale)
3. Make decision
4. AI updates: task-tracker.md, resolved/, design-system/, master-plan.md
```

### Create Mockup
```
1. Design decision made
2. Update HTML in /mockups/
3. Version it: mockup-v2.1.html (don't overwrite!)
4. Log in 00-design-iteration/mockups-changelog.md
5. Share with team → feedback → back to task-tracker.md
```

---

## 📝 Naming Conventions

### Task Tracker Items
- **Format:** `DFT-XXX` (Design Feedback Tracker item)
- **Example:** `DFT-001`, `DFT-015`
- **Location:** `task-tracker.md`

### Meeting Notes
- **Format:** `[topic]-[date].md`
- **Example:** `digital-catalog-meeting-jan-20-2026.md`
- **Location:** `00-design-iteration/feedback/meeting-notes/`

### Resolved Decisions
- **Format:** `dft-XXX-resolution-summary.md`
- **Example:** `dft-001-resolution-summary.md`
- **Location:** `00-design-iteration/feedback/resolved/`

### Mockups
- **Format:** `[name]-v[major].[minor].html`
- **Example:** `01-full-layout-v2.1.html`
- **Location:** `/mockups/` (project root)

---

## 📊 Status at a Glance

| Want to know... | Check... |
|----------------|----------|
| What needs attention? | `task-tracker.md` for open DFT items |
| Where are we in development? | `master-plan.md` for phase status |
| Latest mockup version? | `00-design-iteration/mockups-changelog.md` |

---

## 📚 Related Resources

- **Mockups:** `/mockups/` folder (HTML prototypes)
- **Source Code:** `/src/` folder (actual implementation)
- **Feedback Template:** `00-design-iteration/feedback/_TEMPLATE.md` (for AI extraction)

---

## 🔄 What Changed (Reorganization Notes)

**Goals:**
1. Separate design iteration from implementation planning
2. Put primary working documents at top level
3. Create templates for AI-assisted processing
4. Make everything ADHD-friendly

**Key Changes:**
- Moved `task-tracker.md` and `master-plan.md` to docs root (was buried in subfolders)
- Created `00-design-iteration/` for design work
- Renamed `development_plans/` to `01-implementation-plan/`
- Added templates, READMEs, and workflows
- Organized meeting notes and resolved decisions into subfolders

**Philosophy:**
- **Two primary files** at eye level (task-tracker, master-plan)
- **Everything else** organized but out of the way
- **Single responsibility** for each file/folder
- **Close loops** immediately (mark resolved/complete)

---

## 🎓 For Your Team

### For New Team Members
1. Read this README
2. Open `task-tracker.md` to see active discussions
3. Check `master-plan.md` to understand the roadmap

### For AI Agents Working on This Project
- Extract feedback using `00-design-iteration/feedback/_TEMPLATE.md`
- Update both `task-tracker.md` and `master-plan.md` when resolving items
- Follow the development cycle above

### For Future You (Context Switching)
1. Open this README to orient yourself
2. Check `task-tracker.md` for what's open
3. Pick one thing, work on it, close the loop

---

**Questions?** Start with `task-tracker.md` → Find an open item → Work on it → Mark it done.
