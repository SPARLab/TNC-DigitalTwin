# TNC Digital Catalog - Documentation

**Last Updated:** February 2, 2026

---

## 🎯 YOUR TWO MAIN FILES

| File | Purpose |
|------|---------|
| **[planning-task-tracker.md](./planning-task-tracker.md)** | What questions do we have? Active discussions, design decisions, feedback items (DFT-XXX) |
| **[master-plan.md](./master-plan.md)** | What are we building? Implementation roadmap, phase status, task breakdowns |

**Everything else is supporting documentation in organized folders.**

---

## ⚡ Quick Workflows

### 🎤 "I have meeting feedback"
1. Store raw transcript in `PLANNING/feedback/transcripts/`
2. AI extracts tasks → `PLANNING/feedback/ai-derived-tasks-from-transcripts/`
3. Incorporate tasks into `planning-task-tracker.md` (add DFT-XXX items)
4. Discuss with AI if needed
5. Mark resolved when decided

### 💭 "I need to make a design decision"
1. Find the DFT-XXX item in `planning-task-tracker.md`
2. Discuss options with AI in Cursor
3. Document decision in tracker
4. Update `master-plan.md` if it affects implementation
5. (Optional) Archive resolved items to `PLANNING/resolved-decisions/` on user request

### 🎨 "I need to create/update a mockup"
1. Make changes to HTML in `/mockups/`
2. Log changes in `PLANNING/mockups-changelog.md` (if needed)
3. Share with team for feedback
4. Feedback → back to `planning-task-tracker.md`

### 🔨 "I'm ready to build something"
1. Check `master-plan.md` for phase status
2. Open phase doc in `IMPLEMENTATION/phases/`
3. Pick a task and build
4. Update phase doc when complete

---

## 🧠 ADHD-Friendly Tips

- **Two files matter most:** `planning-task-tracker.md` and `master-plan.md` (both at root level)
- **Start sessions here:** Open this README first to orient yourself
- **One thing at a time:** Pick one DFT item or one phase task
- **Close loops:** Mark things resolved/complete immediately
- **Archive on request:** User may request archiving resolved items to `PLANNING/resolved-decisions/` to keep tracker manageable

**When in doubt:** Open `planning-task-tracker.md` → Find the next open item → Work on it.

---

## 📁 Folder Structure

```
docs/
├── planning-task-tracker.md ← CORE: Active discussions (DFT-XXX)
├── master-plan.md           ← CORE: Implementation roadmap
│
├── PLANNING/                 ← Level 1: Questions & Decisions
│   ├── feedback/
│   │   ├── transcripts/      ← Raw meeting transcripts (unprocessed)
│   │   └── ai-derived-tasks-from-transcripts/ ← Processed documents & task lists extracted from transcripts
│   └── resolved-decisions/   ← Archived resolved items (on user request)
│
├── IMPLEMENTATION/            ← Level 2: Tasks & Phases
│   ├── phases/               ← Detailed phase documents
│   │   ├── phase-0-foundation.md
│   │   ├── phase-1-inaturalist.md
│   │   └── ...
│   └── archive/              ← Historical implementation plans
│
├── DESIGN-SYSTEM/             ← Design specs (reference)
│   └── design-system.md
│
├── DATA-SOURCES/              ← Data source documentation
├── RESEARCH/                  ← Technical research & findings
└── ARCHIVE/                   ← Historical docs (not actively used)
```

### When to Use Each Folder

| Folder | When to Use |
|--------|-------------|
| **PLANNING/** | Need to log feedback, find active discussions, archive resolved items |
| **IMPLEMENTATION/** | Ready to build, need detailed phase tasks |
| **DESIGN-SYSTEM/** | Need design system specs, component patterns |
| **DATA-SOURCES/** | Need to understand a data source API |

---

## 🔄 The Development Cycle

```
1. GATHER FEEDBACK (meeting, testing, review)
   ↓
2. STORE TRANSCRIPT → PLANNING/feedback/transcripts/
   ↓
3. AI EXTRACTS TASKS → PLANNING/feedback/ai-derived-tasks/
   ↓
4. INCORPORATE INTO planning-task-tracker.md (DFT-XXX items)
   ↓
5. DESIGN ITERATION (discuss with AI, make decision)
   ↓
6. UPDATE master-plan.md (if affects implementation)
   ↓
7. CREATE MOCKUP (if needed)
   ↓
8. IMPLEMENTATION (use IMPLEMENTATION/phases/, code, test, ship)
   ↓
9. (Optional) ARCHIVE resolved items to PLANNING/resolved-decisions/
```

---

## 🤖 AI-Assisted Workflows

### Process Feedback
```
1. Store raw transcript in PLANNING/feedback/transcripts/
2. Ask AI: "Extract feedback items into PLANNING/feedback/ai-derived-tasks-from-transcripts/"
3. AI creates structured task list
4. Incorporate tasks into planning-task-tracker.md as DFT-XXX items
```

### Resolve Feedback Item
```
1. Open DFT-XXX item in planning-task-tracker.md
2. Discuss with AI (explore options, rationale)
3. Make decision
4. AI updates: planning-task-tracker.md, master-plan.md, IMPLEMENTATION/phases/
5. (User may request) Archive to PLANNING/resolved-decisions/
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
- **Location:** `planning-task-tracker.md` (root level)

### Meeting Notes
- **Format:** `[topic]-[date].md`
- **Example:** `digital-catalog-meeting-jan-20-2026.md`
- **Location:** `PLANNING/feedback/transcripts/`

### Resolved Decisions
- **Format:** `dft-XXX-resolution-summary.md`
- **Example:** `dft-001-resolution-summary.md`
- **Location:** `PLANNING/resolved-decisions/` (archived on user request)

### Mockups
- **Format:** `[name]-v[major].[minor].html`
- **Example:** `01-full-layout-v2.1.html`
- **Location:** `/mockups/` (project root)

---

## 📊 Status at a Glance

| Want to know... | Check... |
|----------------|----------|
| What needs attention? | `planning-task-tracker.md` for open DFT items |
| Where are we in development? | `master-plan.md` for phase status |
| Raw meeting transcripts? | `PLANNING/feedback/transcripts/` (unprocessed) |
| Processed meeting docs? | `PLANNING/feedback/ai-derived-tasks-from-transcripts/` |
| Resolved decisions? | `PLANNING/resolved-decisions/` |

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

**Key Changes (Feb 2, 2026):**
- Renamed `task-tracker.md` → `planning-task-tracker.md` (clearer purpose)
- Kept core files at root: `planning-task-tracker.md` and `master-plan.md`
- Created `PLANNING/` folder for questions/decisions (feedback, resolved-decisions)
- Created `IMPLEMENTATION/` folder for tasks/phases
- Consolidated design-system duplicates into `DESIGN-SYSTEM/`
- Clear separation: Planning (questions) vs Implementation (tasks)

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
- Extract feedback from transcripts → `PLANNING/feedback/ai-derived-tasks/`
- Update both `planning-task-tracker.md` and `master-plan.md` when resolving items
- **DO NOT auto-archive** resolved items — only archive when user requests
- Follow the development cycle above

### For Future You (Context Switching)
1. Open this README to orient yourself
2. Check `planning-task-tracker.md` for what's open
3. Pick one thing, work on it, close the loop

---

**Questions?** Start with `planning-task-tracker.md` → Find an open item → Work on it → Mark it done.
