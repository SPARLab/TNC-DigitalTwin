# Phase 6: Polish & Consistency

**Status:** ⚪ Not Started  
**Progress:** 0 / ? tasks (TBD after other phases)  
**Branch:** `v2/polish`  
**Depends On:** Phases 0-5 (all complete)  
**Owner:** TBD

---

> **⚠️ NOTE: PLEASE REVIEW THIS AND PROVIDE FEEDBACK**  
> This phase document is a draft. Tasks will be added after other phases reveal what needs polishing.

---

## Phase Goal

Final consistency pass to ensure all components look and behave consistently. Fix any styling issues, ensure design system is followed, integrate TNC brand identity, and prepare for demo.

## Reference Documents

- Master Plan: `docs/master-plan.md`
- Design System: `docs/DESIGN-SYSTEM/design-system.md`
- All mockups: `mockups/02a-02f`

---

## Task Status

> Tasks will be added after Phases 1-5 are complete, based on discovered inconsistencies.

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 6.1 | Integrate TNC brand fonts (Barlow, Chronicle) | ⚪ Not Started | | DFT-008, DFT-009 |
| 6.2 | Add TNC theme variants (Official, Soft) | ⚪ Not Started | | DFT-008, DFT-009 |
| 6.3 | Design system audit | ⚪ Not Started | | |
| 6.4 | Cross-component consistency check | ⚪ Not Started | | |
| 6.5 | Responsive design check | ⚪ Not Started | | |
| 6.6 | Performance audit | ⚪ Not Started | | |
| 6.7 | Accessibility check | ⚪ Not Started | | |
| (more TBD) | | | | |

**Status Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## Task Details

### 6.1: Integrate TNC Brand Fonts

**Goal:** Add TNC's brand fonts (Barlow, Chronicle) to the design system.

**Implementation:**
- Import Barlow and Chronicle from Google Fonts in `src/index.css`
- Update `tailwind.config.js` to define font families
- Set Barlow as primary UI font (replaces Inter)
- Use Chronicle for section headers/special emphasis

**Acceptance Criteria:**
- [ ] Fonts imported and rendering correctly
- [ ] Barlow used for body text, labels, buttons
- [ ] Chronicle used for section headers (optional - test readability)
- [ ] Typography remains readable and clean

**Estimated Time:** 1-2 hours

---

### 6.2: Add TNC Theme Variants

**Goal:** Create 2-3 new theme options using TNC brand colors.

**TNC Brand Colors:**
- Parrot Green: `#05641c` (dark, rich green)
- Leaf Green: `#49a842` (bright, medium green)
- Benthic Blue: `#06063d` (very dark navy - text color)

**Themes to Create:**
1. **"TNC Official"** - Bold brand identity
   - Header: Parrot Green → Leaf Green gradient
   - Subheader: Light gray (current approach)
   - Set as default theme

2. **"TNC Soft"** (optional) - Muted brand version
   - Header: Lighter tints of brand greens
   - For users who prefer lower contrast

**Implementation:**
- Add theme definitions to `src/utils/themes.ts`
- Keep all existing themes (users can experiment and choose)

**Acceptance Criteria:**
- [ ] "TNC Official" theme added and set as default
- [ ] "TNC Soft" theme added (optional)
- [ ] Theme switcher shows new options
- [ ] All existing themes still work

**Estimated Time:** 30-60 minutes

**Note:** Experimentation encouraged - let users/designers try different themes and provide feedback on which works best.

---

### 6.3: Design System Audit

**Goal:** Ensure all components follow the design system.

**Acceptance Criteria:**
- [ ] All colors match design system palette
- [ ] All typography follows design system specs
- [ ] All spacing is consistent
- [ ] No hardcoded values that should be tokens

---

### 6.4: Cross-Component Consistency Check

**Goal:** Ensure similar patterns look the same across data sources.

**Areas to Check:**
- [ ] All layer cards have consistent structure
- [ ] All feature cards have consistent structure
- [ ] All filter UIs have consistent layout
- [ ] All detail views have consistent navigation
- [ ] All buttons have consistent styling
- [ ] All icons are consistent (Lucide, not emojis)

---

### 6.5: Responsive Design Check

**Goal:** Ensure layout works at different screen sizes.

**Breakpoints to Check:**
- [ ] Desktop (1280px+)
- [ ] Laptop (1024-1279px)
- [ ] Tablet (768-1023px) - if supported
- [ ] Mobile (<768px) - may not support for V2

---

### 6.6: Performance Audit

**Goal:** Ensure acceptable load times and smooth interactions.

**Areas to Check:**
- [ ] Initial page load time
- [ ] Layer pin/unpin responsiveness
- [ ] Sidebar transitions smooth
- [ ] No janky scrolling
- [ ] Map performance with multiple layers

---

### 6.7: Accessibility Check

**Decision (Feb 3):** Resolved DFT-017 — Baseline accessibility principles established. This task focuses on auditing and refining the implementation.

**Goal:** Audit and refine accessibility implementation based on baseline principles.

**Baseline Principles (from DFT-017):**
1. **Tab Order:** Natural DOM order (Left sidebar → Map → Floating widgets → Right sidebar)
2. **Escape Key:** Closes most recently opened element (modal, expanded row, panel, popup)
3. **Focus Management:** Focus moves to first interactive element when container expands
4. **Screen Reader:** Announce significant actions only (filter applied, layer pinned, errors)

**Areas to Check:**
- [ ] Keyboard navigation works across all components (verify tab order follows principle)
- [ ] Focus states visible and consistent (verify focus styling on all interactive elements)
- [ ] Sufficient color contrast (WCAG 2.1 AA minimum: 4.5:1 for normal text, 3:1 for large text)
- [ ] ARIA labels where needed (forms, icon buttons, dynamic content)
- [ ] Escape key behavior consistent (test modals, expanded panels, popups)
- [ ] Focus management on expand/collapse (verify focus moves correctly)
- [ ] Screen reader announcements appropriate (test with VoiceOver/NVDA/JAWS)
- [ ] No keyboard traps (user can always navigate away)
- [ ] Skip links for main content areas (optional enhancement)

**Testing Tools:**
- Chrome DevTools Lighthouse accessibility audit
- axe DevTools browser extension
- Keyboard-only navigation test (unplug mouse)
- Screen reader test (at least one: VoiceOver, NVDA, or JAWS)

**Note:** Full WCAG 2.1 AA compliance deferred to post-v2.0 if needed. Focus on usability for keyboard/screen reader users.

---

## Discovered Issues

> Add issues discovered during other phases that need fixing in polish.

| Issue | Discovered In | Priority | Notes |
|-------|---------------|----------|-------|
| (none yet) | | | |

---

## Change Log

| Date | Task | Change | By |
|------|------|--------|-----|
| Jan 23, 2026 | - | Created phase document | Will + Claude |
| Feb 3, 2026 | 6.1, 6.2 | Added TNC brand integration tasks (fonts + theme variants). Resolved DFT-008, DFT-009 | Will + Claude |
| Feb 3, 2026 | 6.7 | Updated accessibility check with DFT-017 baseline principles. Added specific testing checklist and tools | Will + Claude |

