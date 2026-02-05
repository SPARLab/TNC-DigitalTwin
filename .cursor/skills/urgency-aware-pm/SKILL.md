---
name: urgency-aware-pm
description: Evaluates tasks against project timeline and deadlines, prioritizes work based on urgency and stakeholder importance, suggests task reordering, and recommends deferring non-critical items to future versions. Use when the user proposes a task, asks about priorities, or when evaluating what work should be done next. Critical for projects with hard deadlines and high-stakes stakeholder reviews.
---

# Urgency-Aware PM

## Context

**Key docs (DO NOT re-read if already in context from another skill or earlier in this conversation):**
- `docs/master-plan.md` — phase status, blocking issues, cross-phase decisions
- `docs/planning-task-tracker.md` — open DFT items, resolution status
- `docs/PLANNING/future-enhancements.md` — what's already deferred to v2.1+
- `docs/IMPLEMENTATION/phases/phase-0-foundation.md` — Phase 0 tasks (blocks everything)

Only read what you need. If another skill already loaded the above documents, skip it.

## Timeline

| Date | Milestone | Stakes |
|------|-----------|--------|
| **Feb 20, 2026** | v2.0 internal team review | Must be functional and reviewable by team (Amy, Trisalyn, Dan, Sophia, Kelly) |
| **March 2026** | Demo for Jack Dangermond | The demo that matters. See "Stakeholder Awareness" below |

**Today minus Feb 20 = your runway.** Count the days. Say them out loud in your triage.

## Stakeholder Awareness

**Jack Dangermond** — founder of Esri, billionaire funder of this project via the Dangermond Preserve grant at UCSB. He's software-savvy (he *made* ArcGIS). He wants this to become a **digital twin**, not just a data catalog.

**What likely impresses him:**
- Professional, polished UI that feels like real software (not a student project)
- Working features over perfect features — breadth of capability signals momentum
- Movement toward "digital twin" — multiple live data sources on one map, spatial analysis feel
- Integration with ArcGIS ecosystem (he'd recognize good use of his platform)
- Smooth interactions, clear information hierarchy, GIS conventions respected

**What likely doesn't impress him:**
- Unfinished scaffolding with placeholder text
- A single data source working perfectly while others show nothing
- Over-designed micro-interactions on an app that can't show data yet
- Lots of design docs but nothing to click

**Calibration:** We don't know exactly what will impress him. But "working software that feels professional and shows multiple data sources on a map" is a safe bet. When in doubt, optimize for **visible capability breadth**.

## Triage Protocol

When the user proposes a task or asks what to work on next:

### Step 1: Read current state (if not already in context)
Check `master-plan.md` for phase status and blocking issues. **Skip if already loaded** by a prior skill or earlier tool call.

### Step 2: Classify the proposed task

| Tier | Criteria | Action |
|------|----------|--------|
| **P0 — Ship-blocking** | Phase 0 tasks, anything that blocks other phases, core functionality that must work for the demo | Do it now |
| **P1 — Demo-critical** | Features Jack will see: data sources on map, sidebar interactions, professional UI, export flow | Do it soon |
| **P2 — Team-review quality** | Polish, edge cases, empty states, loading states, error handling | Do it if time permits before Feb 20 |
| **P3 — Nice-to-have** | Micro-interactions, accessibility fine-tuning, animation polish | Defer to v2.1 unless trivial (<30 min) |
| **P4 — Scope creep** | New features not in any phase doc, research tangents, over-engineering | Push back. Suggest adding to `future-enhancements.md` |

### Step 3: Compare against open work

If the proposed task is P2 or lower, check: **are there unfinished P0 or P1 tasks?** If yes, say so directly.

Format your triage like this:

```
**Triage:** [P0/P1/P2/P3/P4] — [one sentence why]
**Runway:** [X days to Feb 20] · [Y days to March demo]
**Recommendation:** [Do it now / Do it after X / Defer to v2.1 / Add to backlog]
[If recommending against: list 2-3 higher-priority items to do instead]
```

### Step 4: Be direct, not anxious

- Don't catastrophize. Just state facts about the timeline.
- If the user is doing the right thing, confirm it fast and move on.
- If they're drifting into P3/P4 territory, flag it clearly but respectfully.
- It's fine to say: "This is valuable work but it won't matter if Phase 0 isn't done."

## Deferral Guidance

When recommending a deferral:
1. Suggest adding the item to `docs/PLANNING/future-enhancements.md`
2. Note the DFT-XXX ID if it has one
3. Briefly explain why it's safe to defer (won't block demo, won't block team review)

## Phase Priority Order (for reference)

1. **Phase 0: Foundation** — blocks literally everything
2. **Phases 1-4: Data Sources** — these are what Jack sees (parallelize if possible)
3. **Phase 5: Export Builder** — impressive but depends on 1-4
4. **Phase 6: Polish** — only if time remains

Within data sources, prioritize whichever shows the most "digital twin" feel — multiple live data layers visible on the map simultaneously.

## When NOT to Triage

- If the user says they're just exploring or thinking, let them think.
- If the task is clearly P0, skip the triage ceremony and just help them build.
- Don't re-triage work already in progress unless the user asks.
