# DFT-028 Resolution Summary: Zero-Result Camera Behavior

**Date:** February 4, 2026  
**Status:** ✅ Resolved  
**Decision:** Gray out cameras with 0 matching images

---

## The Problem

Per DFT-012, when users apply a species filter (e.g., "mountain lion"), camera trap locations display count badges showing how many matching images exist at each location. This creates spatial awareness of where the filtered species has been observed.

**Edge case:** When a camera has 0 matching images for the active filter, what should happen?

**Options considered:**
1. **Hide cameras with 0 matches** — cleaner map, shows only relevant locations
2. **Show grayed out** — maintains spatial context, shows where species is NOT present
3. **Show with "0" badge** — explicit count, but clutters map
4. **User preference toggle** — toggle to "show all cameras" or "show matching only"

---

## The Solution: Gray Out Cameras with 0 Matches

### Visual Treatment

- **Opacity:** 40-50% (test for contrast with map background)
- **Color:** Desaturated (grayscale or muted version of active color)
- **Badge:** Remove entirely (don't show "0")
- **Accessibility:** Consider subtle pattern overlay (diagonal lines) for colorblind users

### Interaction Behavior

**Clickability:**
- Camera remains **clickable** and **keyboard-focusable**
- Click behavior: Sidebar shows camera metadata + message: "No [species name] images at this location"
- Include "Adjust Filters" button for quick filter modification

**Hover state:**
- Tooltip: "CAM-042: No matching images"

**Keyboard accessibility:**
- ARIA label: "CAM-042: Camera location with no [species name] images"
- Maintains tab order and focus indicators

### Animation Specification

**Filter applied:**
- 300ms ease-out transition from active → grayed
- Stagger by 30ms per camera (subtle wave effect shows system is responding)

**Filter removed:**
- 300ms ease-out transition back to active state
- Same stagger pattern

**Respects user preferences:**
- Honor `prefers-reduced-motion` setting (instant state change)

### Edge Case Handling

**All cameras have zero results:**
- Sidebar shows empty state: "No cameras match your filter"
- Include "Adjust Filters" and "Clear Filters" buttons
- Map still shows all grayed cameras (preserves spatial context)

---

## Why This Decision? (9 Pillars Analysis)

### 1. Perception (Gestalt Principles)

**Continuity & Proximity:**
- Preserves complete spatial configuration of camera network
- Researchers likely know camera locations by heart — sudden disappearance violates continuity
- Graying maintains spatial mental model while using color differentiation to group "has results" vs "no results"

**Figure-Ground:**
- Hidden cameras = complete removal from perceptual field (can't differentiate "filtered out" from "doesn't exist")
- Grayed cameras = clear figure-ground relationship (active results pop forward, empty locations recede)
- "0" badges = maintains figure status but adds visual clutter

### 2. Interaction (Norman's Design Principles)

**Conceptual Model:**
- DFT-012 chose badge counts, implying mental model: "Of all cameras, which have mountain lions?"
- Hiding would contradict this by switching to spotlight model mid-interaction
- Graying maintains consistent model: "Here are all cameras; these have results"

**Feedback:**
- Hidden = absence of feedback ("Did it disappear? Is it broken?")
- Grayed = clear feedback ("Camera exists but has no matching images")
- "0" badge = redundant (gray state already communicates zero)

**Constraints & User Control:**
- Hiding prevents discovery: "Mountain lions have NEVER been seen at CAM-042"
- Graying enables both positive findings (where they ARE) and negative findings (where they AREN'T)
- Researchers may need to bookmark a camera DESPITE zero results (for future monitoring)

### 3. Usability (Nielsen's Heuristics)

**Visibility of System Status:**
- Hidden: Status unclear ("Offline? Deleted? Outside filter bounds?")
- Grayed: Status explicit ("Active camera, no matching results")

**User Control & Freedom:**
- Hidden cameras can't be clicked → removes exploration capability
- Grayed cameras remain interactive → allows verification of "Why no results here?"

**Recognition over Recall:**
- Hiding forces recall ("Was CAM-042 supposed to be here?")
- Graying enables recognition ("Oh right, CAM-042 is here, just no matches")

### 4. Cognitive Science (Laws of UX)

**Fitts's Law:**
- Hidden cameras = infinite target distance (can't click what isn't there)
- Grayed cameras = clickable targets maintained

**Hick's Law:**
- Hiding reduces visible options BUT assumes users only care about positive results
- For researchers, this assumption is questionable
- Graying maintains options while using visual weight to guide attention

**Von Restorff Effect:**
- Grayed cameras make badged cameras stand out dramatically (high contrast)
- Grayed cameras become visual context that enhances memorability of active results
- Hiding removes this contrast opportunity

**Peak-End Rule:**
- Repeated "Where did the cameras go?" confusion = negative peak
- Discovering spatial distribution insights = positive peak
- Graying enables positive discovery; hiding risks negative confusion

### 5. Visual Fundamentals

**Contrast & Hierarchy:**
- Graying creates strong contrast hierarchy: active (colored badge) vs inactive (gray)
- "0" badges create false hierarchy: numbers compete regardless of value
- Hiding creates absence of contrast: nothing to compare against

**Balance:**
- Hiding can create asymmetric visual weight (all cameras on one side)
- Graying maintains structural balance while guiding focus

**White Space:**
- Hiding increases white space at cost of information
- Graying uses color value to create breathing room without removing data

### 6. Accessibility (WCAG - POUR)

**Perceivable:**
- Hidden cameras are imperceivable (no alternative representation)
- Grayed cameras meet color contrast requirements
- Pattern fills (diagonal lines) assist colorblind users

**Operable:**
- Hidden cameras are inoperable (can't tab to them, can't click)
- Grayed cameras remain keyboard-focusable for screen readers

**Understandable:**
- Gray + no badge is conventional pattern for "inactive/no results"
- "0" badge may confuse ("Why show zero?")

### 7. Behavioral Science

**Loss Aversion:**
- Researchers invest effort learning camera locations
- Hiding feels like loss of mental investment
- "Where did my cameras go?" triggers anxiety

**Confirmation Bias:**
- Hiding supports confirmation bias (only see what you're looking for)
- Graying exposes negative evidence — important for scientific inquiry
- Researchers need to report "surveyed 50 cameras, found in 12"

**Scarcity:**
- When filtering rare species, many cameras will be zero-results
- Hiding many cameras might signal "bad filter" or "broken system"
- Graying makes scarcity explicit and expected

### 8. Information Architecture

**Findability:**
- Hidden cameras are unfindable via map (must use sidebar list?)
- Grayed cameras remain findable through visual scan and spatial memory

**Mental Models:**
- Researchers think spatially: "Where are the cameras?" not "Where are the results?"
- Camera network is the frame; results are content within that frame
- Hiding removes the frame, leaving only floating content (disorienting)

**Wayfinding:**
- Grayed cameras provide landmarks ("CAM-042 is near the river bend")
- Hiding removes landmarks, making orientation harder

**Progressive Disclosure:**
- Badge counts already implement progressive disclosure (overview → count → details)
- Hiding is aggressive disclosure (only show results) — breaks overview step
- Graying is proper progressive disclosure (show all, emphasize results, details on click)

### 9. Motion & Time

**Feedback Timing & Continuity:**
- Smooth transition to gray provides clear causation (filter → visual change)
- Instant hiding feels like glitch ("Did they disappear or fail to load?")
- Fade animation establishes continuity between states

**Staging:**
- Badge numbers update → THEN colors fade (sequential attention direction)

---

## Cross-Framework Patterns

Several themes emerged across all frameworks:

1. **Preservation over Removal:** Nearly every principle favors maintaining spatial structure
2. **Negative Evidence Matters:** Scientific workflows need "where species is NOT"
3. **Contrast Creates Clarity:** Graying makes positive results stand out MORE than hiding
4. **Continuity Reduces Confusion:** Consistent spatial structure reduces cognitive load
5. **Accessibility Requires Presence:** Can't make hidden elements accessible

---

## Why NOT the Alternatives?

### Option 1: Hide Zero-Result Cameras

**Rejected because:**
- ❌ Violates continuity (Gestalt)
- ❌ Breaks conceptual model consistency (Norman)
- ❌ Removes negative evidence (scientific workflow requirement)
- ❌ Inaccessible (WCAG)
- ❌ Triggers loss aversion anxiety (Behavioral Science)
- ❌ Removes wayfinding landmarks (Information Architecture)

**Only benefit:** Cleaner visual (insufficient to outweigh costs)

### Option 3: Show "0" Badge

**Rejected because:**
- ❌ Visual clutter (many zeros compete with meaningful counts)
- ❌ Redundant information (gray state already signals zero)
- ❌ Violates data-ink ratio (Tufte principle: maximize data, minimize ink)

**Only benefit:** Explicit feedback (gray state provides this already)

### Option 4: User Preference Toggle

**Rejected because:**
- ❌ Adds UI complexity for edge-case preference
- ❌ Introduces mode errors ("Why can't I see cameras?" → forgot toggle)
- ❌ Most users won't discover or use the toggle

**Defer until:** User research shows strong demand (80/20 rule: solve for common case first)

---

## Implementation Checklist

### Phase 2 (ANiML) - Task 2.5

- [ ] Update camera icon rendering to support grayed state
- [ ] Implement opacity reduction (40-50%) when count = 0
- [ ] Desaturate color for zero-result cameras
- [ ] Remove badge entirely (don't render "0")
- [ ] Maintain click handlers on grayed cameras
- [ ] Add keyboard focus indicators for grayed state
- [ ] Implement hover tooltip: "No matching images"
- [ ] Update ARIA labels to announce zero-result state
- [ ] Add 300ms ease-out transition animation
- [ ] Stagger animation by 30ms per camera
- [ ] Honor `prefers-reduced-motion` preference
- [ ] Handle edge case: all cameras zero results
  - [ ] Show sidebar empty state
  - [ ] Keep grayed cameras visible on map
  - [ ] Provide "Adjust Filters" and "Clear Filters" buttons

### Testing Considerations

**A/B test with researchers:**
- Gray vs hidden vs "0" badge
- Measure: confusion reports, time to understand, task completion

**Accessibility validation:**
- Test contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for UI components)
- Verify keyboard navigation works on grayed cameras
- Test screen reader announcements

**Edge cases:**
- Filter with 100% zero results
- Filter with 1 positive result among 50 cameras
- Very rare species (expect many zero results)
- Network error during filter application

---

## Related Decisions

**DFT-012 (Camera badges):**
- Established numbered badge pattern
- DFT-028 extends this with zero-result behavior

**DFT-029 (Unfiltered badge behavior):**
- Should address: show badges when NO filter applied?
- Recommendation: No badges until filter applied (keeps visual clean, makes badges meaningful)

**DFT-032 (Map tooltip design):**
- Tooltip design should clearly distinguish active vs grayed cameras
- Include context: species name, date range, result count

**DFT-015 (Empty states):**
- Pattern: "Show what's expected, explain why it's empty"
- Graying cameras aligns: show cameras, explain zero matches

---

## Target Audience Context

**Primary audience: Researchers** (per DFT-011)
- Researchers value comprehensive information over minimalism
- Need negative evidence for scientific analysis
- Familiar with camera trap locations (mental map preservation critical)
- May need to bookmark cameras with zero results (for future monitoring)

---

## Future Considerations (v2.1+)

**If user feedback indicates need:**
- Add user preference toggle (after validating demand)
- Track analytics: How often do users click zero-result cameras?
- Consider pattern overlays for additional colorblind support

**Do NOT prematurely optimize for these scenarios.**

---

## Documentation Updated

- ✅ `planning-task-tracker.md` — DFT-028 status → Resolved
- ✅ `master-plan.md` — Added to UX Decisions section
- ✅ `phase-2-animl.md` — Task 2.5 acceptance criteria updated
- ✅ Created this resolution summary

---

## Summary

**Decision:** Gray out cameras with 0 matching images (40-50% opacity, desaturated, no badge), maintain interactivity.

**Core rationale:** Preserves spatial context for negative evidence discovery while maintaining accessibility and reducing cognitive confusion. Analyzed via 9 Pillars framework with strong cross-framework consensus for preservation over removal.

**Implementation target:** Phase 2, Task 2.5 (ANiML camera visualization)
