# Feedback Template

Use this template to extract structured feedback from meeting notes or user testing sessions.

---

## Meeting Information

**Type:** Team Meeting | User Testing | Stakeholder Review | Email Feedback  
**Date:** YYYY-MM-DD  
**Attendees:** [Names]  
**Duration:** [Time]  
**Context:** [Purpose of meeting/session]

---

## Raw Notes / Transcript

[Paste full transcript or raw notes here]

---

## Extracted Feedback Items

### FBK-001: [One-line summary]

**Category:** UI/UX | Feature Request | Performance | Bug | Design Decision  
**Priority:** High | Medium | Low  
**Source:** [Name of person who provided feedback]

**Quote/Context:**
> "[Exact words if from transcript, or summary if from observation]"

**Problem Statement:**
[What is the actual problem? Distinguish from proposed solution]

**Action:**
- [ ] Create DFT-XXX entry in design-task-tracker.md
- [ ] Add to Phase X implementation plan
- [ ] Archive / note for future
- [ ] Needs prototype / mockup
- [ ] Quick fix / immediate action

**Notes:**
[Any additional context, related feedback, or dependencies]

---

### FBK-002: [Next item]

[Repeat structure above]

---

## Summary

**Total Items Extracted:** X  
**High Priority:** X  
**Medium Priority:** X  
**Low Priority:** X

**Next Steps:**
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

---

## AI Processing Prompt

Copy this into Cursor along with your meeting notes:

```
I have meeting notes below. Please extract feedback items using this template.

For each item:
1. Assign sequential FBK number (FBK-001, FBK-002, etc.)
2. Write clear one-line summary
3. Categorize appropriately
4. Assign priority based on:
   - High: Blocks usage, causes confusion, or critical UX issue
   - Medium: Improves experience but not blocking
   - Low: Nice-to-have, polish, or future enhancement
5. Extract relevant quote or observation
6. Identify the underlying problem (not just the suggested solution)
7. Recommend action (create DFT, add to plan, prototype, etc.)

Then, for each HIGH priority item, create a DFT-XXX entry in design-task-tracker.md.

[Paste your meeting notes below this line]
```

---

**File saved as:** `docs/00-design-iteration/feedback/_TEMPLATE.md`
