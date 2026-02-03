# Future Enhancements & Feature Backlog

**Purpose:** Track feature requests and enhancements that are out of scope for v2.0 but worth considering for future versions (v2.1+, v3.0, etc.)

**How to use this doc:**
- Features deferred during v2.0 planning get moved here
- Each item retains its DFT-XXX ID for traceability
- Items can be promoted to active development when planning future versions
- This is a *backlog*, not a commitment — features here may never ship

**Status Legend:**
- 🔮 Future — Interesting idea, not prioritized
- 🎯 Planned — Scheduled for a specific future version
- 🔍 Under Review — Being evaluated for inclusion
- ❌ Rejected — Decided not to pursue

**Last Updated:** February 3, 2026

---

## Queued for v2.1

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| DFT-014 | Biodiversity aggregation queries | Low | 🔮 Future | Species counts and proportions per camera trap |

---

## Longer-Term Ideas (v3.0+)

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| - | - | - | - | *None yet* |

---

## Rejected / Won't Do

| ID | Feature | Reason | Date Rejected |
|----|---------|--------|---------------|
| - | - | - | - |

---

## Detailed Feature Descriptions

### DFT-014: Biodiversity/Aggregation Queries

**Category:** Feature Request  
**Priority:** Low  
**Status:** 🔮 Future  
**Source:** Trisalyn Nelson, Jan 26, 2026  
**Deferred From:** v2.0 planning

**Description:**
> Want to analyze diversity of species per camera trap location:
> - "Are there some where almost all the species are mountain lions?"
> - Unique species count per camera
> - Pie chart symbols showing proportion of each species

**Potential Visualizations:**
1. Simple count badge: "5 species" on each camera icon
2. Proportional pie chart at each location (like bike map hazard breakdown)
3. Heat map of biodiversity index

**Why Deferred:**
- Trisalyn acknowledged this may be "too in the weeds" for v2.0 scope
- Adds significant complexity to map visualization layer
- Requires aggregation queries that don't exist in current data services
- v2.0 focus is on establishing the core paradigm (pin/bookmark/export)

**Future Considerations:**
- Related to DFT-012 (camera trap clustering) — could extend badge design
- Related to DFT-013 (multiple filtered views) — might enable comparison workflows
- Useful for understanding researcher workflows and informing query architecture

**Estimated Effort:** Medium-High (requires backend aggregation support + new map symbology)

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 3, 2026 | Created future enhancements backlog | Will + Claude |
| Feb 3, 2026 | Moved DFT-014 from planning-task-tracker.md | Will + Claude |
