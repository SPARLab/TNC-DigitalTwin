# Design Iteration

This folder contains active design work: feedback processing, design decisions, and component specifications.

## 📁 Structure

```
00-design-iteration/
├── design-system/              ← Component specs and design decisions
│   ├── design-system.md       ← Core design system documentation
│   ├── components.md          ← (Future) Component library specs
│   ├── patterns.md            ← (Future) UX pattern documentation
│   └── decisions.md           ← (Future) Design decision log
│
├── feedback/
│   ├── design-task-tracker.md             ← Active feedback items (DFT-XXX)
│   ├── meeting-notes/         ← Raw meeting transcripts
│   ├── resolved/              ← Archived decisions with full context
│   └── _TEMPLATE.md           ← (To be created) Template for new feedback
│
└── mockups-changelog.md       ← (To be created) Track mockup versions
```

---

## 🔄 Workflow

### 1. Capture Feedback
**Input:** Meeting notes, user testing, team reviews

**Process:**
1. Add raw notes to `feedback/meeting-notes/`
2. Extract specific items using AI (see prompts below)
3. Add to `design-task-tracker.md` as DFT-XXX entries

### 2. Discuss & Decide
**Input:** DFT-XXX item from tracker

**Process:**
1. Open tracker in Cursor
2. Discuss options with AI
3. Explore alternatives, consider trade-offs
4. Make decision

### 3. Document
**Input:** Resolved decision

**Process:**
1. Update `design-task-tracker.md` with resolution
2. Move detailed summary to `feedback/resolved/`
3. Update `design-system/` with specs/rationale
4. Update mockups if needed

---

## 📋 Feedback Tracker (design-task-tracker.md)

### Status Indicators

| Status | Meaning | Next Step |
|--------|---------|-----------|
| 🟡 Open | Needs discussion | Schedule design review |
| 🔵 In Discussion | Actively exploring | Continue iterating |
| 🟢 Resolved | Decision made | Document & implement |
| ⚪ Deferred | Future consideration | Archive for later |

### Priority Levels

| Priority | Criteria |
|----------|----------|
| **High** | Blocks usage, causes confusion, or critical to UX |
| **Medium** | Improves experience but not blocking |
| **Low** | Nice-to-have, polish, or future enhancement |

---

## 🤖 AI Prompts

### Extract Feedback from Meeting Notes

```
I have a meeting transcript. Please extract feedback items and create DFT-XXX entries in design-task-tracker.md.

For each item:
1. Assign next available DFT number
2. Write one-line summary
3. Categorize (UI/UX, Feature Request, Performance, etc.)
4. Assign priority:
   - High: Blocks usage or causes confusion
   - Medium: Improves experience
   - Low: Nice-to-have
5. Extract relevant quote from transcript
6. Identify action needed (discuss, prototype, build, etc.)

Format using the structure in design-task-tracker.md.

[Paste transcript here]
```

### Resolve Feedback Item

```
We've decided on [solution] for DFT-XXX. Please:

1. Update design-task-tracker.md with resolution
2. Move full context to feedback/resolved/dft-XXX-summary.md
3. Update design-system/ with relevant specs
4. If implementation is needed, add note to 01-implementation-plan/master-development-plan.md
5. Update mockups-changelog.md if mockup changes are needed

Decision details:
[Explain decision and rationale]
```

---

## 🎨 Design System Folder

### What Goes Here

- **Component specifications:** Button variants, input styles, card layouts
- **UX patterns:** Navigation flows, modal behaviors, state transitions
- **Design decisions:** Rationale for choices (colors, typography, spacing)
- **Visual examples:** Code snippets, screenshots, design tokens

### When to Update

- After resolving a DFT item that affects a component
- When creating a new reusable pattern
- When documenting the "why" behind a design choice

---

## 📊 Mockups Changelog

**Purpose:** Track mockup versions and link them to feedback decisions.

**Format:**
```markdown
## v2.1 - Jan 27, 2026
**Mockup:** `mockups/01-full-layout-v2.1.html`

**Changes:**
- Resolved DFT-001: Pin vs visibility behavior
- Removed eyeball from left sidebar
- Added Active Layer section to widget
- Added filter indicators (funnel emoji)

**Feedback Items:** DFT-001

---

## v2.0 - Jan 23, 2026
**Mockup:** `mockups/01-full-layout-v2.html`

**Changes:**
- Initial v2 paradigm with left/right sidebar split
- Floating widgets for pinned layers and bookmarks

**Feedback Items:** Initial mockup, no DFT items yet
```

---

## 📝 Tips for Effective Design Iteration

1. **Be specific:** "Button is confusing" → "Save button doesn't indicate what gets saved"
2. **Capture context:** Who said it? In what situation? What were they trying to do?
3. **Distinguish problems from solutions:** User says "add a tooltip" → Problem is "user doesn't understand icon"
4. **Version mockups:** Don't overwrite. Save as v2, v2.1, etc. for comparison.
5. **Close the loop:** After implementing, note in tracker that it's shipped

---

## 🔗 Related

- **Implementation Plan:** `../01-implementation-plan/` (when design is stable)
- **Mockups:** `../../mockups/` (visual prototypes)
- **Source Code:** `../../src/` (actual implementation)

---

**Last Updated:** January 28, 2026
