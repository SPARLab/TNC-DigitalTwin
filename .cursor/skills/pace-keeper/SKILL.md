---
name: pace-keeper
description: Lightweight schedule monitor for active development. Calculates task completion pace, flags if behind schedule, and estimates whether the current trajectory meets the Feb 20 deadline. Use at the start of any development task, when completing a task, or when the user asks about progress or schedule. Designed to be minimal — do not load urgency-aware-pm alongside this unless planning work is needed.
---

# Pace Keeper

## Quick Context

**Deadlines:** Feb 20, 2026 (team review) · March 2026 (Jack Dangermond demo)
**Source of truth:** `docs/master-plan.md` (phase status table)
**DO NOT re-read** master-plan if already in context.

## When to Run

- At the **start** of a dev task: quick status line so the user knows where they stand
- When a task is **completed**: update the math, flag if pace changed
- When user asks about **progress or schedule**

## Protocol

### 1. Count tasks

Read the phase status table in `master-plan.md`. Calculate:
- **Done:** total tasks marked 🟢 across all phases
- **Remaining:** total tasks marked ⚪ or 🟡
- **Days left:** business days until Feb 20 (exclude weekends)

### 2. Calculate pace

```
needed_per_day = remaining / days_left
```

### 3. Output (keep it to 2-3 lines)

```
**Pace:** [done]/[total] tasks done · [remaining] left · [days_left] business days to Feb 20
**Need:** ~[N] tasks/day to finish on time
[Optional: "On track" / "Behind — was [X]/day yesterday, need [Y]/day" / "Ahead of schedule"]
```

### 4. Flag rules

| Situation | Response |
|-----------|----------|
| `needed_per_day` <= 2 | "On track." No further commentary needed |
| `needed_per_day` 3-4 | "Tight but doable. Stay focused on P0/P1 work." |
| `needed_per_day` 5+ | "Behind schedule. Consider: cutting P2+ tasks, deferring to v2.1, or parallelizing across branches." |
| `needed_per_day` 8+ | "At risk. Recommend replanning — run urgency-aware-pm skill to re-triage and cut scope." |

### 5. Don't over-talk

This skill exists to give the user a quick pulse check, not a planning session. If deeper planning is needed (re-triage, branch strategy, scope cuts), tell the user to invoke `urgency-aware-pm` instead. Don't do both jobs.

## Tracking Pace Over Time (Optional)

If the user wants to track velocity, suggest they add a line to `master-plan.md`:

```markdown
## Velocity Log
| Date | Tasks Done (cumulative) | Tasks Remaining | Notes |
|------|------------------------|-----------------|-------|
```

This is optional. Don't create it unless asked.
