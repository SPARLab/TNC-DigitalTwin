# January 2026 UI Improvements Development Plan

**Created:** January 13, 2026  
**Status:** Draft - Awaiting Iteration  
**Owner:** Team

---

## Instructions for AI Assistants

**READ THIS FIRST before working on any task in this plan:**

### Before Starting a Task

1. **Context Gathering:**
   - Read through the relevant parts of the codebase to understand the current implementation
   - Review any related components, utilities, and configuration files
   - Check for existing patterns and conventions in the codebase
   - Look for any dependencies or related tasks that may have been completed

2. **Clarifying Questions:**
   - Before implementing, ask the user clarifying questions to ensure alignment
   - Confirm your understanding of the requirements
   - Ask about edge cases, preferences, or any ambiguities
   - Get approval on your approach before proceeding with significant changes

3. **Implementation:**
   - Follow the task requirements as specified
   - Adhere to existing code patterns and conventions
   - Use the design system tokens and Tailwind utilities as specified in earlier tasks
   - Test your changes at relevant breakpoints

### After Completing a Task

When you've finished implementing a task, you MUST:

1. **Announce Completion:**
   - State clearly that the task is complete
   - Provide a summary of what was changed

2. **Manual Verification Instructions:**
   - Use this EXACT heading: **"How to Manually Verify Completeness"**
   - Provide step-by-step instructions for the user to verify your work
   - Include specific things to check, test, or look for
   - List the files that were modified
   - Suggest specific breakpoints or scenarios to test

3. **Wait for Confirmation:**
   - Wait for the user to say "okay this task is complete" or similar confirmation
   - If the user reports issues, fix them before marking complete

4. **Mark Task Complete:**
   - Once the user confirms completion, update this document
   - Check off the task in the "Task Execution Checklist" section
   - Update the task's detailed section if needed with notes about implementation
   - Add any context notes that future AI assistants might need (under "Implementation Notes")
   - Update the Change Log with the completion date

### Adding Context for Future Tasks

When completing a task, if future tasks will need to know about decisions made or patterns established:

- Add an **"Implementation Notes"** subsection to the task
- Document any important decisions, patterns, or gotchas
- Note any deviations from the original plan and why
- Reference specific token names, component patterns, or utilities created

**Example:**
```markdown
### Task 3 — Define Design System Tokens (🔴 HIGH)
[...task description...]

**Implementation Notes:**
- Created tokens: `text-title-base`, `text-title-lg`, `text-title-2xl`
- Decided to use 1.2 line-height for titles, 1.6 for body text
- Added custom spacing scale: `spacing-compact-*`, `spacing-default-*`
- Token names follow pattern: `[category]-[variant]-[breakpoint]`
```

---

## Overview

This development plan addresses responsive design issues, establishes a consistent design system, and improves the overall user experience across the Dangermond Preserve Data Catalog. The plan prioritizes establishing industry-standard responsive patterns before making component-specific adjustments.

---

## Task Execution Checklist

**Tasks are numbered in execution order. Check off as completed.**

### Phase 1: Preparation & Foundation (Week 1-2)
- [ ] **Task 1** — Organize root directory files (🟡 MEDIUM)
- [ ] **Task 2** — Research industry best practices for typography/spacing (🔵 RESEARCH)
- [ ] **Task 3** — Define semantic design system tokens in Tailwind (🔴 HIGH)
- [ ] **Task 4** — Document design system (🔴 HIGH)

### Phase 2: Core Layout (Week 3-4)
- [ ] **Task 5** — Apply design system to Header component (🔴 HIGH)
- [ ] **Task 6** — Apply design system to FilterSubheader component (🔴 HIGH)
- [ ] **Task 7** — Fix header and subheader height consistency (🔴 HIGH)
- [ ] **Task 8** — Locate and update Footer component (🔴 HIGH)
- [ ] **Task 9** — Implement consistent sidebar widths (🔴 HIGH)
- [ ] **Task 10** — Align left sidebar with subheader (🔴 HIGH)
- [ ] **Task 11** — Fix Clear Filters button alignment (🟡 MEDIUM)

### Phase 3: Component Updates (Week 5-6)
- [ ] **Task 12** — Apply design system to DataView and cards (🟡 MEDIUM)
- [ ] **Task 13** — Apply design system to sidebars (beyond width) (🟡 MEDIUM)
- [ ] **Task 14** — Apply design system to map legends (🟡 MEDIUM)
- [ ] **Task 15** — Scale map legends for screen sizes (🟡 MEDIUM)
- [ ] **Task 16** — Apply design system to remaining components (🟡 MEDIUM)

### Phase 4: Data Source Refinements (Week 6-7)
- [ ] **Task 17** — Fix ArcGIS card sizing (🟡 MEDIUM)
- [ ] **Task 18** — Fix Dendra card margins (🟡 MEDIUM)
- [ ] **Task 19** — Replace Dendra "Christmas tree" icons (🟡 MEDIUM)
- [ ] **Task 20** — eBird image loading improvements (🟡 MEDIUM - Backend)

### Phase 5: Progressive Disclosure (Week 7-8)
- [ ] **Task 21** — Identify eye icon locations (🟡 MEDIUM)
- [ ] **Task 22** — Implement tooltip solution (🟡 MEDIUM)
- [ ] **Task 23** — Add hover tooltips for eye icons (🟡 MEDIUM)

### Phase 6: Research & Documentation (Ongoing/Lower Priority)
- [ ] **Task 24** — Research ArcGIS tags formatting (🔵 RESEARCH → 🟢 LOW)
- [ ] **Task 25** — Create documentation index (🟢 LOW)
- [ ] **Task 26** — Document responsive design patterns (🟢 LOW)

### Testing & Validation (Ongoing)
- [ ] Test on mobile devices (iPhone SE, iPhone 12/13/14)
- [ ] Test on tablet devices (iPad, iPad Pro)
- [ ] Test at ~1200px breakpoint (laptop screens)
- [ ] Test on large desktop (1920px+)
- [ ] Test in Chrome/Edge, Firefox, Safari

---

## Priority Legend

- **🔴 HIGH:** Critical for responsive functionality and user experience
- **🟡 MEDIUM:** Important improvements that enhance usability
- **🟢 LOW:** Nice-to-have enhancements for future consideration
- **🔵 RESEARCH:** Requires investigation and decision-making

---

## Task Details

### Task 1 — Organize Root Directory Files (🟡 MEDIUM)
**Goal:** Clean up messy root directory with scattered documentation and scripts

**Files to Organize:**

Move to `docs/` subdirectories:
- [ ] `ANIML_CONTEXT_PROMPT.txt` → `docs/animl-optimization/`
- [ ] `ANIML_TESTING_START_HERE.md` → `docs/animl-optimization/`
- [ ] `CSV_INTEGRATION_SUMMARY.md` → `docs/data_sources/`
- [ ] `EBIRD_QUERY_DEBUGGING.md` → `docs/debug_prompts/`
- [ ] `GROUP_BY_VS_MEMORY_EXPLAINED.md` → `docs/archive/`

Move to `scripts/one-off/`:
- [ ] `check-hubpage-urls.js`
- [ ] `explore-hub.js`
- [ ] `investigate-documents.js`
- [ ] `test-animl-queries.html` (or delete if obsolete)
- [ ] `test-hub-urls.html` (or delete if obsolete)

**Tasks:**
- [ ] Create directory structure: `docs/archive/`, `docs/research_findings/`, `scripts/one-off/`
- [ ] Move files to appropriate locations
- [ ] Update any broken links in documentation

---

### Task 2 — Research Industry Best Practices (🔵 RESEARCH)
**Goal:** Establish evidence-based responsive design standards

**Tasks:**
- [ ] Research industry best practices for responsive typography across device sizes
- [ ] Identify standard font sizes for different text categories across breakpoints
- [ ] Research optimal spacing/padding/margin standards for different screen sizes
- [ ] Document ideal ratios between different font size categories

**Deliverables:**
- `docs/research_findings/typography-best-practices.md`
- `docs/research_findings/spacing-best-practices.md`
- `docs/research_findings/design-system-research-summary.md`

**Notes:**
- Focus on mobile (iPhone), tablet (~1200px), and desktop breakpoints
- Consider accessibility standards (WCAG)
- Look at Material Design, Apple HIG, and other design systems for guidance

---

### Task 3 — Define Design System Tokens (🔴 HIGH)
**Goal:** Create a consistent, Tailwind-based design system with 4-5 font size categories

**Tasks:**
- [ ] Update `tailwind.config.js` with semantic font size tokens
  - Categories: `title`, `subtitle`, `header`, `section-label`, `body`, `description`
  - Responsive variants for each (base, sm, md, lg, xl, 2xl)
- [ ] Define spacing tokens for padding and margins
- [ ] Create visual reference showing all tokens

**Technical Approach:**
```javascript
fontSize: {
  'title': ['24px', { lineHeight: '1.2' }],
  'title-sm': ['20px', { lineHeight: '1.2' }],
  'title-lg': ['32px', { lineHeight: '1.2' }],
  'body': ['14px', { lineHeight: '1.6' }],
  // ... etc
}
```

**Files to Modify:**
- `tailwind.config.js`

---

### Task 4 — Document Design System (🔴 HIGH)
**Goal:** Create comprehensive documentation for design system usage

**Tasks:**
- [ ] Create design system documentation at `docs/design-system/design-tokens.md`
- [ ] Create visual style guide at `docs/design-system/visual-reference.md`
- [ ] Document usage patterns and examples

---

### Task 5 — Apply Design System to Header (🔴 HIGH)
**Goal:** Update Header component with design system tokens

**Tasks:**
- [ ] Replace all font sizes with semantic tokens
  - Site title: use `title` token
  - Navigation links: use `body` or `nav` token
  - Theme button text: match navigation links
- [ ] Replace spacing with semantic tokens
- [ ] Remove any hardcoded responsive values
- [ ] Test across all breakpoints

**Files to Modify:**
- `src/components/Header.tsx`

---

### Task 6 — Apply Design System to FilterSubheader (🔴 HIGH)
**Goal:** Update FilterSubheader component with design system tokens

**Tasks:**
- [ ] Replace label font sizes (DATA CATEGORY, SPATIAL FILTER, TIME RANGE) with `label` token
- [ ] Replace button text with appropriate body token
- [ ] Update spacing tokens
- [ ] Test dropdown layouts at all breakpoints

**Current Issues:**
- At ~1200px and smaller, label font sizes are too large
- Button text should match header navigation link sizes

**Files to Modify:**
- `src/components/FilterSubheader.tsx`

---

### Task 7 — Fix Header and Subheader Height Consistency (🔴 HIGH)
**Goal:** Ensure header and subheader have identical heights across all screen sizes

**Tasks:**
- [ ] Adjust padding/height to match across header and subheader
- [ ] Ensure vertical rhythm is consistent
- [ ] Test at all breakpoints (especially ~1200px and below)

**Acceptance Criteria:**
- Header and subheader have identical heights at all breakpoints
- Browse, Save Searches, Export Queue have same font size as DATA CATEGORY, SPATIAL FILTER, TIME RANGE

**Files to Modify:**
- `src/components/Header.tsx`
- `src/components/FilterSubheader.tsx`

---

### Task 8 — Locate and Update Footer Component (🔴 HIGH)
**Goal:** Ensure footer font sizes match header/subheader

**Tasks:**
- [ ] Locate footer component (if exists)
- [ ] Apply design system tokens
- [ ] Ensure font sizes match header navigation links
- [ ] Test across all breakpoints

---

### Task 9 — Implement Consistent Sidebar Widths (🔴 HIGH)
**Goal:** Ensure left and right sidebars have identical widths at all screen sizes

**Tasks:**
- [ ] Define sidebar width breakpoints in `tailwind.config.js`
  - Example: `sidebar-sm: '280px'`, `sidebar-md: '320px'`, `sidebar-lg: '360px'`
- [ ] Update left sidebar to use width tokens
- [ ] Update right sidebar to use width tokens
- [ ] Test across all breakpoints to ensure widths match

**Files to Modify:**
- `tailwind.config.js`
- Left sidebar component
- Right sidebar component

---

### Task 10 — Align Left Sidebar with Subheader (🔴 HIGH)
**Goal:** Align right edge of left sidebar with midpoint between Category and Spatial Filter buttons

**Tasks:**
- [ ] Calculate required alignment values
- [ ] Adjust sidebar width tokens to achieve alignment
- [ ] Test alignment at all breakpoints
- [ ] Document calculation methodology

**Technical Notes:**
- May require adjusting subheader button widths and gaps
- Consider using CSS Grid or Flexbox for precise alignment

**Files to Modify:**
- `tailwind.config.js`
- Left sidebar component
- `src/components/FilterSubheader.tsx`

---

### Task 11 — Fix Clear Filters Button Alignment (🟡 MEDIUM)
**Goal:** Fix vertical alignment of Clear Filters button

**Current Issue:**
- Clear Filters button is center-aligned in its container but not aligned with the filter dropdown buttons

**Tasks:**
- [ ] Adjust FilterSubheader layout to align Clear Filters button with filter buttons
- [ ] Consider using flexbox baseline alignment
- [ ] Test across different screen sizes

**Files to Modify:**
- `src/components/FilterSubheader.tsx`

---

### Task 12 — Apply Design System to DataView and Cards (🟡 MEDIUM)
**Goal:** Update data catalog cards to use design system tokens

**Tasks:**
- [ ] Apply design system tokens to DataView component
- [ ] Update all card components with semantic font sizes
- [ ] Update spacing using semantic tokens
- [ ] Test across all breakpoints

**Files to Modify:**
- `src/components/DataView.tsx`
- Card components for each data source

---

### Task 13 — Apply Design System to Sidebars (🟡 MEDIUM)
**Goal:** Update sidebar styling beyond width adjustments

**Tasks:**
- [ ] Apply typography tokens to left sidebar content
- [ ] Apply typography tokens to right sidebar content
- [ ] Update spacing/padding with semantic tokens
- [ ] Test sidebar content at all breakpoints

---

### Task 14 — Apply Design System to Map Legends (🟡 MEDIUM)
**Goal:** Update map legend styling with design system

**Tasks:**
- [ ] Identify all legend components
- [ ] Apply typography tokens to legend text
- [ ] Update spacing tokens
- [ ] Test legend rendering

---

### Task 15 — Scale Map Legends for Screen Size (🟡 MEDIUM)
**Goal:** Ensure map legends are appropriately sized for all screen sizes

**Current Issue:**
- Legends are too large for small screen sizes

**Tasks:**
- [ ] Scale legend icon sizes based on breakpoints
- [ ] Adjust legend container sizing
- [ ] Consider collapsible legends for small screens
- [ ] Test legend readability across devices

---

### Task 16 — Apply Design System to Remaining Components (🟡 MEDIUM)
**Goal:** Ensure all components use design system consistently

**Tasks:**
- [ ] Audit remaining components not yet updated
- [ ] Apply design system tokens systematically
- [ ] Remove any remaining hardcoded styles
- [ ] Document any necessary overrides

---

### Task 17 — Fix ArcGIS Card Sizing (🟡 MEDIUM)
**Goal:** Reduce card size in left sidebar for ArcGIS feature services

**Current Issues:**
- Cards are too large
- Height expanded due to presence of four tags per card

**Tasks:**
- [ ] Apply design system tokens to ArcGIS cards
- [ ] Test smaller font sizes for smaller screen widths
- [ ] Ensure cards are still readable and usable

---

### Task 18 — Fix Dendra Card Margins (🟡 MEDIUM)
**Goal:** Fix incorrect card margins for Dendra data streams

**Current Issue:**
- Card margins are incorrect even at large screen sizes

**Tasks:**
- [ ] Apply design system spacing tokens to Dendra cards
- [ ] Test margins at all breakpoints
- [ ] Verify consistency with other data source cards

---

### Task 19 — Replace Dendra Christmas Tree Icons (🟡 MEDIUM)
**Goal:** Replace icons that resemble Christmas trees

**Current Issue:**
- Current icons for Dendra weather stations look like Christmas trees (user feedback)

**Tasks:**
- [ ] Research alternative icon options:
  - Weather station/meteorology icons
  - Sensor/telemetry icons (`Gauge`, `Radio`, `Antenna`, `Thermometer`)
- [ ] Select and implement new icon
- [ ] Test visual consistency

---

### Task 20 — eBird Image Loading Improvements (🟡 MEDIUM - Backend)
**Goal:** Improve image loading reliability and speed

**Current Issues:**
- Images load slowly
- Some bird species don't have images
- Currently using iNaturalist API

**Tasks:**
- [ ] Research alternative image APIs or caching strategies
- [ ] Implement backend API for serving bird images
- [ ] Ensure all species have fallback images
- [ ] Consider image optimization (compression, lazy loading, thumbnails)

**Notes:**
- Primarily backend work
- May require infrastructure changes

---

### Task 21 — Identify Eye Icon Locations (🟡 MEDIUM)
**Goal:** Locate all components using eye icons for progressive disclosure

**Tasks:**
- [ ] Search codebase for eye icon usage
- [ ] Document all locations using progressive disclosure pattern
- [ ] Identify what descriptive text should be shown in tooltips

**Deliverables:**
- List of components with eye icons and their tooltip content

---

### Task 22 — Implement Tooltip Solution (🟡 MEDIUM)
**Goal:** Select and implement tooltip library or component

**Tasks:**
- [ ] Evaluate tooltip options (`react-tooltip`, `@radix-ui/react-tooltip`, custom)
- [ ] Install and configure chosen solution
- [ ] Create reusable tooltip component wrapper
- [ ] Test tooltip behavior on desktop and mobile

**Technical Notes:**
- Ensure accessibility (keyboard navigation, ARIA labels)
- Test on touch devices (tap to show)
- Consider bundle size impact

---

### Task 23 — Add Hover Tooltips for Eye Icons (🟡 MEDIUM)
**Goal:** Show descriptive text on hover for eye icons at smaller screen sizes

**Tasks:**
- [ ] Add hover tooltips to all identified eye icon locations
- [ ] Show the full descriptive text that appears on larger screens
- [ ] Ensure tooltips work on touch devices
- [ ] Test across devices and screen sizes

**Components Affected:**
- Map layers component (specifically mentioned)
- Other components using eye icons (from Task 21)

---

### Task 24 — Research ArcGIS Tags Formatting (🔵 RESEARCH → 🟢 LOW)
**Goal:** Decide whether to keep, remove, or reformat tags in ArcGIS cards

**Current Issues:**
- Four tags per card increase height significantly
- Potential discoverability concerns

**Tasks:**
- [ ] Analyze tag usage and discoverability
- [ ] Consider alternative layouts (horizontal tags, collapsed tags, etc.)
- [ ] Create mockups of alternative approaches
- [ ] Gather user feedback if possible
- [ ] Make decision: keep, remove, or reformat

**Notes:**
- Lower priority due to need for discussion and iteration

---

### Task 25 — Create Documentation Index (🟢 LOW)
**Goal:** Make documentation discoverable and navigable

**Tasks:**
- [ ] Create or update `docs/README.md` with directory structure explanation
- [ ] Document purpose of each subdirectory
- [ ] Create index of all major documentation files

---

### Task 26 — Document Responsive Design Patterns (🟢 LOW)
**Goal:** Create reference for future responsive development

**Tasks:**
- [ ] Document responsive design patterns established in this project
- [ ] Create examples of proper Tailwind usage
- [ ] Document common pitfalls and solutions
- [ ] Create onboarding guide for new developers

---

## Feature Status Tracking

Instead of implementing complex download features now, track the current status of features across data sources. **This will be maintained in `README.md` under a "Feature Status" section.**

See `README.md` → Feature Status section for current state of:
- Download functionality per data source
- Add to cart functionality per data source
- Filtering capabilities
- Map visualization

**Future Work:** Iterate on feature completeness as needed, tracking progress in README.md.

---

## Testing Checklist

### Breakpoints to Test
- [ ] Mobile (< 640px) - iPhone SE, iPhone 12/13/14
- [ ] Tablet (640px - 1024px) - iPad, iPad Pro
- [ ] Small Desktop (~1200px) - Laptop screens
- [ ] Large Desktop (1920px+) - Desktop monitors

### Browsers to Test
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS and iOS)

### Specific Test Cases
- [ ] Header and subheader heights match at all breakpoints
- [ ] Left and right sidebar widths are identical at all breakpoints
- [ ] Font sizes follow design system consistently
- [ ] All interactive elements are appropriately sized for touch (min 44x44px)
- [ ] Text remains legible at all sizes
- [ ] No horizontal scrolling at any breakpoint
- [ ] Hover states work (desktop) and touch states work (mobile)
- [ ] All tooltips display properly on hover and touch

---

## Open Questions & Decisions Needed

1. **Design System Tokens:** What specific font sizes should we use for each category at each breakpoint?
   - Requires research (Task 2)

2. **ArcGIS Tags:** Should we keep, remove, or reformat tags in ArcGIS cards?
   - Requires discussion (Task 24)

3. **eBird Images:** What is our budget/infrastructure for image hosting?
   - Requires technical architecture discussion

4. **Sidebar Alignment:** What is the exact alignment specification between sidebar and subheader?
   - May need design mockups to clarify

5. **Progressive Disclosure:** Should we use tooltips, popovers, or expandable sections for small screens?
   - Requires UX pattern decision

---

## Success Metrics

- [ ] All components use Tailwind responsive utilities (no custom media queries)
- [ ] Consistent font sizes across similar UI elements
- [ ] Header and subheader have matching heights
- [ ] Left and right sidebars have matching widths
- [ ] All text is legible on mobile devices (minimum 12px)
- [ ] All interactive elements meet touch target size minimums (44x44px)
- [ ] No visual regressions reported

---

## Future Considerations

Out of scope for this plan but tracked for future work:

- Dark mode support across entire application
- Accessibility audit (WCAG 2.1 AA compliance)
- Animation and transition polish
- Advanced filtering UI improvements
- Bulk actions for cart items
- User preferences persistence
- Print stylesheets
- Offline functionality
- Complete download implementation for all data sources

---

## Development Guidelines

- **Use Tailwind utilities exclusively** — No custom media queries
- **Semantic tokens over hardcoded values** — Use design system tokens
- **Mobile-first approach** — Start with smallest breakpoint, scale up
- **Test on real devices** — Not just browser resize
- **Document overrides** — If design system tokens don't work, document why
- **Maintain consistency** — Prefer consistent design over preserving edge cases
- **Check off completed tasks** — Update the Task Execution Checklist as you go

---

## Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2026-01-13 | Initial draft created | Team |
| 2026-01-13 | Reorganized by execution order, added task checklist summary | Team |
| 2026-01-13 | Added Task 9 for repository/documentation cleanup | Team |
| 2026-01-13 | Removed duplicates, renumbered tasks sequentially, simplified feature tracking | Team |

---

## Appendix

### Current Tailwind Responsive Breakpoints

```javascript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### Example Usage of Design System Tokens

```tsx
// Before (hardcoded values)
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>

// After (design system tokens)
<h1 className="text-title md:text-title-md lg:text-title-lg">Title</h1>
```
