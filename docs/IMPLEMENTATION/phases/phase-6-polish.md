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

**Goal:** Ensure basic accessibility.

**Areas to Check:**
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Sufficient color contrast
- [ ] ARIA labels where needed

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

