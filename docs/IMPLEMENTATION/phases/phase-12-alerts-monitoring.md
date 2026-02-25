# Phase 12: Alerts and Monitoring

**Status:** ⚪ Not Started  
**Progress:** 0 / 8 tasks  
**Branch:** `v2/alerts-monitoring`  
**Depends On:** Phase 0 (Foundation); Phase 2 (ANiML); Phase 4 (DataONE); Phase 1 (iNaturalist)  
**Owner:** TBD

---

## Quick Task Summary

| ID | Status | Last Updated (Timestamp) | Task Description | Notes |
|----|--------|---------------------------|------------------|-------|
| 12.1 | ⚪ Not Started | Feb 25, 2026 | Define alert taxonomy and mock payload schema | Standardize alert types: camera novelty, water threshold breach, iNaturalist range anomaly |
| 12.2 | ⚪ Not Started | Feb 25, 2026 | Add header notification bell and badge shell | Bell icon in app header with unread count badge and clear empty state |
| 12.3 | ⚪ Not Started | Feb 25, 2026 | Build alerts panel mock-up (list + detail) | Right-side panel or popover with severity, source, time, and quick actions |
| 12.4 | ⚪ Not Started | Feb 25, 2026 | Mock camera trap novelty alerts | Simulate detections for previously unseen species from camera traps |
| 12.5 | ⚪ Not Started | Feb 25, 2026 | Mock water-level threshold alerts | Simulate values outside expected min/max ranges and severity tiers |
| 12.6 | ⚪ Not Started | Feb 25, 2026 | Mock iNaturalist out-of-range alerts | Simulate observations outside expected species range envelope |
| 12.7 | ⚪ Not Started | Feb 25, 2026 | Alert state handling (read/unread, dedupe, sort) | Add deterministic client-side store for demo reliability |
| 12.8 | ⚪ Not Started | Feb 25, 2026 | QA + UX polish + handoff notes | Validate interaction quality, accessibility, and future backend integration points |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Before starting implementation, please review the tasks, acceptance criteria, and approach.

---

## Phase Goal

Create a mock alerts and monitoring experience in the app header using a notification bell icon. The initial release is intentionally front-end first: alerts are simulated from representative conservation events so the team can validate UX patterns before wiring production alert streams.

### Mock Alert Scenarios in Scope

1. **Camera Trap Novelty Alert:** a camera trap detects an animal not previously seen by that camera or site profile.
2. **Water Threshold Alert:** water level is outside expected range (too low / too high).
3. **iNaturalist Range Anomaly Alert:** observation appears outside species' expected range for the preserve context.

### Why This Phase Exists

- Establishes a reusable alert UI pattern that can later accept real events from multiple data sources.
- Gives field and science teams a quick way to notice potential anomalies without opening each data source manually.
- Creates a foundation for future escalation workflows (triage, acknowledgment, assignment, and notification routing).

---

## Reference Documents

- Master Plan: `docs/master-plan.md`
- ANiML phase (camera trap context): `docs/IMPLEMENTATION/phases/phase-2-animl.md`
- DataONE phase (sensor context): `docs/IMPLEMENTATION/phases/phase-4-dataone.md`
- iNaturalist phase (observation context): `docs/IMPLEMENTATION/phases/phase-1-inaturalist.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`

---

## UX Direction (Mock-Up First)

### Core Interaction Pattern

- Header bell icon is always visible.
- Unread badge appears only when unread count > 0.
- Clicking bell opens alerts panel with newest alerts first.
- Clicking an alert opens detail context and marks alert as read.
- Optional quick actions: "Mark read", "Mark all read", "View source layer".

### Principle Check (UI/UX)

| Principle | Why It Matters | Direction |
|----------|----------------|-----------|
| Nielsen: Visibility of System Status | Users need to know if there are new alerts at a glance | Bell badge + relative timestamps |
| Nielsen: Recognition Rather Than Recall | Alert cards should be understandable without memory load | Source icon + concise title + severity tag |
| Gestalt: Proximity and Similarity | Fast scan across mixed alert types | Consistent card anatomy and grouped metadata |
| Hick's Law | Reduce decision overhead in triage | Default filters: `All`, `Unread`, `High` only |
| Norman: Feedback and Signifiers | Interactions must feel clear and reversible | Read/unread state changes immediately with visual confirmation |
| Accessibility (WCAG/POUR) | Alerting UI must remain usable for keyboard and screen readers | Focus management, ARIA labels, status text, contrast-safe severity colors |

---

## Alert Data Model (Mock)

Define a shared mock schema so all three sources render through one UI:

- `id`: stable unique alert identifier
- `type`: `camera_novelty | water_threshold | inat_range_anomaly`
- `severity`: `info | warning | critical`
- `title`: concise one-line summary
- `description`: detail text for panel/detail view
- `source`: source name (`ANiML`, `Water Sensor`, `iNaturalist`)
- `sourceEntityId`: optional source-specific id (camera id, station id, observation id)
- `detectedAt`: ISO timestamp
- `status`: `unread | read | dismissed`
- `locationLabel`: optional human-readable location
- `metrics`: optional structured values (water level, expected min/max, confidence)

---

## Task Details

### 12.1: Define Alert Taxonomy and Mock Payload Schema

**Goal:** Align alert categories, severities, and fields so all mock events use one rendering contract.

**Acceptance Criteria:**
- [ ] Three alert types are documented and represented in TypeScript types/interfaces
- [ ] Severity mapping rules are documented per alert type
- [ ] Example payloads exist for each type
- [ ] UI components can consume one normalized alert shape

**Out of Scope:**
- Real backend event ingestion
- Persistent storage beyond local/session mock state

---

### 12.2: Add Header Notification Bell and Badge Shell

**Goal:** Introduce a bell icon in the app header that indicates unread alert count.

**Acceptance Criteria:**
- [ ] Bell icon appears in header and matches design system spacing
- [ ] Unread badge count shown when unread > 0
- [ ] Zero state does not display numeric badge
- [ ] Button has keyboard and screen-reader support

**Implementation Notes:**
- Start with static count, then wire to mock store in Task 12.7.

---

### 12.3: Build Alerts Panel Mock-Up (List + Detail)

**Goal:** Provide a usable panel for browsing and triaging alerts.

**Acceptance Criteria:**
- [ ] Bell click opens and closes panel consistently
- [ ] List displays source, severity, title, and relative time
- [ ] Selecting an alert reveals expanded detail text and key metadata
- [ ] Empty state copy is clear and non-blocking
- [ ] Mobile and narrow widths remain readable

**UI Notes:**
- Keep list row design compact and scannable.
- Use clear color/token mapping for severity states.

---

### 12.4: Mock Camera Trap Novelty Alerts

**Goal:** Simulate camera-based novelty events that are meaningful for monitoring workflows.

**Acceptance Criteria:**
- [ ] Mock event includes camera/site context and species name
- [ ] Alert title clearly communicates novelty condition
- [ ] Detail includes confidence and last-seen context when available
- [ ] Severity defaults to `warning` (or configurable)

**Example Alert:**
- "New camera-trap species detected at Ramajal East: Gray Fox (first detection in 90 days)."

---

### 12.5: Mock Water-Level Threshold Alerts

**Goal:** Simulate threshold breaches from water monitoring signals.

**Acceptance Criteria:**
- [ ] Mock payload includes observed value, expected range, and unit
- [ ] Severity escalates based on distance from threshold
- [ ] Alert detail includes station/location and timestamp
- [ ] Multiple threshold events sort correctly by time and severity

**Example Alert:**
- "Water level high at San Antonio Creek sensor: 2.3 m (expected 0.8-1.6 m)."

---

### 12.6: Mock iNaturalist Out-of-Range Alerts

**Goal:** Simulate species-range anomalies from iNaturalist observations.

**Acceptance Criteria:**
- [ ] Payload includes species, observed location label, and anomaly reason
- [ ] Detail can show optional confidence score and observer timestamp
- [ ] Alert links to source context path (placeholder navigation accepted)
- [ ] Severity defaults to `info` or `warning` based on confidence

**Example Alert:**
- "Out-of-range observation: California newt reported in non-typical dry-zone sector."

---

### 12.7: Alert State Handling (Read/Unread, Dedupe, Sort)

**Goal:** Add deterministic client-side alert state management for mock reliability.

**Acceptance Criteria:**
- [ ] Store supports add/update/read/dismiss operations
- [ ] Unread count reacts instantly in header badge
- [ ] Sorting is stable (newest first, severity tie-break optional)
- [ ] Dedupe logic prevents duplicate cards for same source event id
- [ ] State reset utility exists for local demo/testing

**Notes:**
- Readability-first implementation is preferred over micro-optimizations.

---

### 12.8: QA, UX Polish, and Handoff Notes

**Goal:** Validate usability and prepare for future real-data integration.

**Acceptance Criteria:**
- [ ] Manual QA checklist executed for keyboard, focus, and screen-reader labels
- [ ] Severity colors and labels pass contrast and clarity checks
- [ ] Panel behavior verified across desktop and narrower layouts
- [ ] Integration notes documented: expected backend contract and webhook/event-stream touchpoints

**Deliverable:**
- Short implementation note in this phase file capturing final decisions and known follow-ups.

---

## Risks and Open Questions

- **Range-anomaly validity:** How strict should "outside normal range" be for iNaturalist without a formal ecological model?
- **Alert fatigue risk:** Too many low-confidence alerts can reduce trust in the panel.
- **Severity calibration:** Threshold values for warning/critical need domain sign-off.
- **Navigation behavior:** Should clicking an alert always move map/sidebar context, or remain non-navigational in v1 mock?

---

## Suggested Implementation Sequence

1. Task 12.1 (taxonomy/schema)
2. Task 12.2 (header bell shell)
3. Task 12.3 (panel UI)
4. Tasks 12.4-12.6 (source-specific mock generators)
5. Task 12.7 (state + dedupe + unread)
6. Task 12.8 (QA/polish/handoff)

---

## Definition of Done (Phase-Level)

- Bell icon + unread badge are in the header.
- Alerts panel is usable with realistic mock events from all three sources.
- Read/unread and sorting behavior are stable and demo-ready.
- Team has documented integration assumptions for future backend alerts pipeline.
