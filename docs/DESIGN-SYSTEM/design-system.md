# Design System - TNC Digital Catalog

**Last Updated:** February 3, 2026  
**Purpose:** Single source of truth for styling decisions, component patterns, and design policies that affect multiple phases.

---

## Icon Policy

### ❌ No Emojis Policy

**Policy:** Do not use emojis in the UI. Use SVG icons instead.

**Rationale:**
- Emojis render inconsistently across different browsers and operating systems
- SVG icons provide consistent visual appearance across all platforms
- SVG icons can be styled with CSS (color, size, etc.)
- SVG icons are more accessible and can be optimized for performance

**Implementation:**
- All icons must be SVG files stored in `src/components/icons/` or `public/icons/`
- Use React components for SVG icons (see existing examples: `DroneIcon.tsx`, `LidarIcon.tsx`)
- For icon libraries, prefer Lucide React (already in use) or similar SVG-based icon libraries
- When adding new icons, search for existing SVG icons first before creating custom ones

**Existing Icon Locations:**
- Component icons: `src/components/icons/`
- Data source icons: `src/utils/dataSourceIcons.tsx`
- Public assets: `public/icons/`

**For AI Agents:**
- When you encounter a need for an icon, automatically search for appropriate SVG icons
- Check existing icon components first (`src/components/icons/`, `src/utils/dataSourceIcons.tsx`)
- If no suitable icon exists, search for SVG icons from reputable sources (Lucide, Heroicons, etc.)
- Create a new icon component following the pattern of existing icons
- Never suggest or use emoji characters in code or UI

---

## Terminology Configuration

**Policy:** All UI terminology referencing the parent-child relationship (layers → features/items) must use a centralized config to allow team testing.

**Implementation:** `src/config/terminology.ts`

```typescript
// src/config/terminology.ts
export const TERMINOLOGY = {
  childNoun: "Feature",        // or "Item" — team toggle for testing
  childNounPlural: "Features", // or "Items"
  
  // Derived labels
  get pinnedWidgetTitle() { return `Pinned ${this.childNoun} Layers`; },
  get bookmarkedWidgetTitle() { return `Bookmarked ${this.childNounPlural}`; },
  
  // Empty state copy
  get pinnedEmptyFirstVisit() { return `Pin layers from the left sidebar to save them here.`; },
  get pinnedEmptyReturning() { return `Pinned layers appear here.`; },
  get bookmarkedEmptyFirstVisit() { 
    return `Bookmarks save specific ${this.childNounPlural.toLowerCase()} within layers (cameras, sensors, observations). Bookmark ${this.childNounPlural.toLowerCase()} from the right sidebar.`; 
  },
  get bookmarkedEmptyReturning() { return `Bookmarked ${this.childNounPlural.toLowerCase()} appear here.`; },
};
```

**Rationale:**
- "Feature" aligns with GIS terminology (Nielsen's "match between system and real world")
- "Item" is a fallback if team feedback suggests "feature" is confusing for non-GIS users
- Centralized config ensures consistency across all UI components
- Team can toggle between values during development without code changes

**Usage:**
- All widget titles, empty state messages, button labels, and tooltips must import from this config
- Never hardcode "Feature" or "Item" in UI components

---

## Empty State Patterns

**Policy (DFT-015):** All empty states follow a consistent pattern with differentiation between first-visit (educational) and returning-user (laconic) states.

### Visual Pattern

**Container:**
```css
.empty-state {
  @apply flex flex-col items-center justify-center text-center px-6 py-8;
}
```

**Design Tokens:**
| Element | Tailwind Classes |
|---------|------------------|
| Icon | `w-12 h-12 text-gray-300` |
| Title | `text-sm font-medium text-gray-700` |
| Body | `text-sm text-gray-500` |
| Action link | `text-sm text-emerald-600 hover:underline` |

**Tone:** Utilitarian (professional, no warmth or friendliness)

### First-Visit vs Returning User

| State | Behavior | Copy Length |
|-------|----------|-------------|
| First visit | Show expanded widget with educational copy | 2-3 sentences explaining what goes here and how |
| Returning (empty) | Show expanded widget with laconic copy | 1 sentence reminder |
| Collapsed | Header includes parenthetical hint | Short hint in parentheses |

### Tracking First Visit

- Use localStorage to track whether user has ever pinned a layer or bookmarked a feature
- Key: `hasEverPinnedLayer`, `hasEverBookmarkedFeature`
- First visit = key doesn't exist or is false
- Returning = key is true (even if currently empty)

### Widget-Specific Empty States

**Pinned Layers Widget:**
- First visit: "No layers pinned. Pin layers from the left sidebar to save them here."
- Returning: "Pinned layers appear here."
- Collapsed: "(pin layers from the left)"

**Bookmarked Features Widget:**
- First visit: "No {features/items} bookmarked. Bookmarks save specific {features/items} within layers (cameras, sensors, observations). Bookmark {features/items} from the right sidebar."
- Returning: "Bookmarked {features/items} appear here."
- Collapsed: "(bookmark {features} from the right)"

**Right Sidebar (no layer selected):**
- "Click any {feature/item} layer in the left sidebar to view its details here."

**Browse Tab (zero filter results):**
- Dynamic: "No {feature_label_plural} match your filters."
- Include suggestions specific to active filters
- Filters remain visible via UI controls

**DataOne Search (no results):**
- Echo search query
- Actionable suggestions
- "Clear Search" button

### Team Design Toggle

**Widget initial state is configurable:**
- Default: Expanded (educational)
- Option: Collapsed (with instructive header)
- Team can toggle to test both before finalizing

**Implementation:** Environment variable or localStorage flag (not user-facing in v2.0)

---

## Loading State Patterns

**Policy (DFT-018):** Loading states use a hybrid approach — skeletons for content regions, spinners for actions, progress bars for deterministic multi-step operations.

### Key Principles

1. **Region-specific, non-blocking:** Loading happens in the region where content will appear. User can navigate away or interact with other regions.
2. **Escapable:** Right sidebar loading is dismissable — user can click elsewhere to cancel.
3. **Dynamic ETA for long loads:** Show estimated time for multi-query operations (e.g., ANiML camera queries).
4. **Progressive loading:** Show available data immediately, load more via infinite scroll + background pre-fetch.

### Indicator Selection Rules

| Context | Indicator | Notes |
|---------|-----------|-------|
| Sidebar content loading | Skeleton UI | Shows expected structure |
| ANiML camera queries | Progress bar | "Querying cameras: 12/47" |
| Image grid loading | Skeleton → waterfall | First 10 images, then infinite scroll |
| Map markers loading | Subtle spinner overlay | Only if >300ms delay |
| Search/filter in progress | Inline spinner | Inside search box or filter control |
| Save/bookmark action | Button spinner | Replaces button content |

### Timeout Thresholds

| Threshold | Indicator | User Communication |
|-----------|-----------|-------------------|
| 0-300ms | None | (Feels instant) |
| 300ms-3s | Spinner/skeleton | None needed |
| 3s-15s | Skeleton + text | "Loading... ~X seconds" |
| 15s+ | Skeleton + warning | "Taking longer than usual. [Cancel]" |
| 30s | Auto-timeout | Error state: "Request timed out. [Retry]" |

### Dynamic ETA Formula

For multi-query operations (e.g., ANiML camera count queries):

```typescript
const estimatedSeconds = Math.ceil(queriesRemaining / queriesPerSecond);
// Display: "Querying 47 cameras... ~12 seconds remaining"
```

Update ETA dynamically as queries complete.

### Visual Pattern (Right Sidebar Loading)

```
┌─────────────────────────────────────┐
│ ANiML Cameras                    ✕  │  ← Dismissable
├─────────────────────────────────────┤
│                                     │
│   Querying 47 cameras...            │
│   ████████████░░░░░░░░  12/47       │  ← Progress bar
│   ~8 seconds remaining              │  ← Dynamic ETA
│                                     │
│   [Cancel]                          │  ← Escapable
│                                     │
└─────────────────────────────────────┘
```

### Error States (Related to Loading)

| Error Type | Pattern |
|------------|---------|
| Content load failed | Inline in region + "Retry" button |
| Action failed | Toast with "Try Again" |
| Timeout | Inline: "Request timed out. The server may be busy. [Retry]" |
| Partial failure | Show loaded content, inline error for failed portion |

**Tone:** Utilitarian (matches empty state tone). No apologetic language.

### Design Principles Applied

- **Nielsen #1 (Visibility of system status):** Dynamic ETA, progress bars, escapable loading
- **Nielsen #3 (User control and freedom):** Cancel/dismiss loading at any time
- **Nielsen #4 (Consistency):** Same patterns across all data sources
- **Norman (Feedback):** Continuous feedback throughout loading process
- **Gestalt (Continuity):** Skeleton shapes match final content layout

---

## Error State Patterns

**Policy (DFT-030):** Error handling follows a severity-based hierarchy with consistent patterns across all data sources.

### Key Principles

1. **Regional containment:** Errors appear in the region where the failure occurred
2. **Always actionable:** Every error offers Retry, Go Back, or Dismiss
3. **Ephemeral vs. Persistent:** Toasts auto-dismiss (8s), inline errors persist until resolved
4. **Utilitarian tone:** Direct, professional, no apologies (matches DFT-015 empty states)

### Error Severity Matrix

| Severity | Example | Pattern | Lifespan | Placement |
|----------|---------|---------|----------|-----------|
| **Critical** | Total API outage | Modal | Persistent (blocks app) | Full-screen overlay |
| **Regional** | Sidebar content failed | Inline | Persistent | In affected region |
| **Partial** | 3 of 47 cameras failed | Banner | Persistent | Above loaded content |
| **Action** | Bookmark save failed | Toast | 8s auto-dismiss | Top of right sidebar |

### Toast Notifications (Action Failures)

**Placement:** Top of right sidebar, full-width
- `position: absolute; top: 0; right: 0; left: 0;`
- Stacked if multiple (newest on top, max 3 visible)

**Visual Pattern:**
```
┌────────────────────────────────────────────────────┐
│  [✕ Icon]  Bookmark failed to save. [Try Again]  ✕│
└────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Container: `bg-red-50 border-b border-red-200`
- Icon: `w-5 h-5 text-red-500` (Lucide `XCircle`)
- Text: `text-sm text-gray-800`
- Button: `text-sm text-red-600 hover:underline`

**Behavior:**
- Auto-dismiss after 8 seconds
- Dismissible via ✕
- "Try Again" retries action and dismisses toast

**Use cases:** Bookmark save failed, pin failed, export failed, filter apply failed

**Rationale:** Top of right sidebar avoids map legend conflict, maintains proximity to action context (most errors from sidebar), consistent location.

### Inline Errors (Content Failures)

**Placement:** In the region where content should load

**Visual Pattern:**
```
┌─────────────────────────────────────────────────────┐
│  [⚠ Icon]                                           │
│  Unable to load camera data                         │
│  The server didn't respond in time.                 │
│                                                     │
│  [Retry]  [← Back to Layer List]  [Show Details ▼] │
└─────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Container: `bg-amber-50 border border-amber-200 rounded-lg p-4`
- Icon: `w-8 h-8 text-amber-500` (Lucide `AlertTriangle`)
- Title: `text-sm font-medium text-gray-800`
- Body: `text-sm text-gray-600`

**Behavior:**
- Persistent until user acts (Retry, Go Back, navigate away)
- "Show Details" expands technical info (collapsed by default)
- "Go Back" provides contextual navigation

**Use cases:** Right sidebar content failed, camera list failed, search failed

### Partial Failure Banner

**Pattern:** Show loaded content, banner for failures

```
┌─────────────────────────────────────────────────────┐
│ [⚠] 3 cameras failed to load. [Retry Failed] [✕]   │
└─────────────────────────────────────────────────────┘
│  Successfully loaded content appears below...        │
```

**Behavior:**
- "Retry Failed" only retries failed items
- Don't throw away successfully loaded data

### Color Tokens

| Severity | Background | Border | Icon/Text |
|----------|------------|--------|-----------|
| Warning/Recoverable | `amber-50` | `amber-200` | `amber-500` |
| Error/Failed | `red-50` | `red-200` | `red-500` |

### Error Message Tone

**Utilitarian** (consistent with DFT-015):
- Direct, professional, factual
- No apologetic language ("Oops!", "Sorry!")
- Explain causality ("The server didn't respond" not "Something went wrong")

**Examples:**
- ✓ "Unable to load camera data"
- ✓ "Request timed out after 30 seconds"
- ✓ "Bookmark failed to save"
- ✗ "Oops! Something went wrong"

### "Show Details" Expansion

Standardized pattern for technical debugging:
- Collapsed by default
- Shows: Request endpoint, HTTP status, timestamp, duration
- Target audience (researchers) may need for debugging queries

### Timeout Behavior

- 0-30s: Show loading state (per DFT-018)
- 30s: Auto-timeout → inline error with [Retry]
- Instant failure: Immediate error display

### Accessibility

- Focus management: Move focus to error container
- ARIA: `role="alert"` for toasts, `aria-live="polite"` for inline
- Color independence: Icons + text + color
- Keyboard: All actions focusable

### Animation

- Appear: Fade in 200ms + subtle shake (2px)
- Dismiss: Fade out 300ms
- Reduced motion: Use border pulse instead of shake

---

## Undo Button Pattern

**Policy (DFT-031):** All destructive actions execute immediately without confirmation dialogs. Each widget/region has a persistent undo button to reverse recent actions.

### Key Principles

1. **Norman's Reversibility Hierarchy:** Undo > Confirmation > Irreversible. Undo is the gold standard.
2. **Context-specific:** Each region maintains its own undo stack (5 actions per region)
3. **Always visible:** Button is always present, grayed when inactive (reduces anxiety)
4. **No deadline pressure:** Unlike toasts with 8-second windows, undo persists until next action
5. **Proximity:** Button is spatially near where actions occur (Gestalt principle)

### Visual Pattern

**Button Placement:** Widget header, right side (before collapse/close buttons)

```
┌──────────────────────────────────────────────────┐
│  Pinned Feature Layers        [↶]  [−]  [✕]     │
│  ↑ title                      ↑undo ↑collapse ↑close
├──────────────────────────────────────────────────┤
│  [≡] [👁] ANiML Cameras (mt. lion) [🌪️3]  [✕]  │
│  [≡] [👁] iNaturalist                       [✕]  │
└──────────────────────────────────────────────────┘
```

### Button States (Always Present Pattern)

| State | Styling | Tooltip | Behavior |
|-------|---------|---------|----------|
| **Inactive** | Gray, 40% opacity | "No actions to undo" | Disabled (not clickable) |
| **Active** | Full opacity, emerald-600 | "Undo: [action description]" | Click undoes most recent |

### Design Tokens

**Icon:**
- Component: Lucide `Undo2` or `RotateCcw`
- Size: `w-5 h-5` (20px)

**Colors:**
- Active: `text-emerald-600 hover:text-emerald-700 cursor-pointer`
- Inactive: `text-gray-400 opacity-40 cursor-not-allowed`

**Transitions:**
- Opacity: `transition-opacity duration-200 ease-out`

**Animation (on activation):**
- Subtle pulse: 1 cycle, 400ms, `ease-in-out`
- Respects `prefers-reduced-motion` (no pulse, just opacity change)

```css
@keyframes undo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.undo-button-active {
  animation: undo-pulse 400ms ease-in-out 1;
}

@media (prefers-reduced-motion: reduce) {
  .undo-button-active {
    animation: none;
  }
}
```

### Undo Button Placement by Region

| Region | Undo Button | Actions Covered |
|--------|-------------|-----------------|
| **Left Sidebar** | Header, right side | Layer activation/selection (if needed) |
| **Pinned Layers Widget** | Header, right side | Unpin layer, delete filtered view, clear filters |
| **Bookmarked Features Widget** | Header, right side | Remove bookmark, remove multiple bookmarks |
| **Right Sidebar** | Optional — header | Bookmark actions (if separate from widget) |

**Total:** 2-3 undo buttons across the interface

### Undo Stack Implementation

**Stack Size:** 5 actions per region (single-level for v2.0, multi-level in v2.1+)

**State Structure:**
```typescript
interface UndoAction {
  type: 'unpin' | 'remove-bookmark' | 'clear-filters' | 'delete-view';
  timestamp: number;
  data: Record<string, any>; // Context-specific restoration data
}
```

**Hook Pattern:**
```typescript
const { canUndo, undo, addAction } = useUndoStack({
  context: 'pinned-layers',
  maxSize: 5,
});
```

### Keyboard Support

**Per-region navigation:**
- Tab: Focus undo button (part of natural tab order)
- Enter/Space: Undo most recent action
- Escape: No effect (button is not a modal)

**Global keyboard shortcut (Phase 6):**
- Cmd+Z / Ctrl+Z: Undo in most recently active region
- Requires tracking "active region" state

### Accessibility

**ARIA:**
- `role="button"`
- `aria-label="Undo: [dynamic action description]"`
- Inactive: `aria-disabled="true"`
- Active: `aria-disabled="false"`

**Screen Reader:**
- Inactive: "Undo button, disabled, no actions to undo"
- Active: "Undo button, undo [action description]"

**Touch Targets:**
- Min 44px touch target (WCAG 2.5.5)
- Use padding to expand hit area if icon is smaller

**Visual:**
- Color + icon + tooltip (not color alone)
- Consistent with WCAG color independence principle

### Edge Cases

**Rapid actions:**
- Only most recent action is undoable in v2.0 (single-level)
- Multi-level undo deferred to v2.1+ based on user feedback

**Navigating away:**
- Undo button remains functional even if user switches contexts
- Example: Unpin layer, switch to different layer → undo still works

**Stack persistence:**
- Undo history does NOT persist across sessions (resets on refresh)
- Rationale: Refreshing is a "commit" action; KISS principle

### Tone & Messaging

**Utilitarian** (consistent with empty states and error patterns):
- Tooltip describes what will be undone specifically
- Examples:
  - "Undo: Unpinned ANiML Cameras"
  - "Undo: Removed bookmark for Camera A1"
  - "Undo: Deleted 'Mountain Lion' view"
  - "Undo: Cleared 3 filters"

### Component Files

**Implementation:**
- `src/v2/components/UndoButton/UndoButton.tsx` — Button component
- `src/v2/hooks/useUndoStack.ts` — Per-region undo stack hook
- `src/v2/types/undo.ts` — UndoAction type definitions

### Design Principles Applied

- **Norman:** Undo is superior to confirmation (no workflow interruption)
- **Nielsen #3:** User control & freedom (clearly marked emergency exit)
- **Nielsen #7:** Flexibility & efficiency (no confirmation dialogs slowing workflow)
- **Gestalt Proximity:** Button near action context
- **Behavioral Science:** No confirmation fatigue, reduced anxiety, encourages exploration
- **Target Audience (DFT-011):** Researchers expect efficiency, not hand-holding

---

## Styling Decisions

> **Note:** This section tracks styling decisions that affect multiple phases. Component-specific styling should be documented in component files.

### Color Palette

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| Overall color palette | ⚪ TBD | - | Mockups use emojis/colors - need to tone down |
| Data source accent colors | ⚪ TBD | - | |

### Typography

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| Font system | ✅ Decided | - | See `docs/research_findings/typography-best-practices.md` |
| Responsive typography scale | ✅ Decided | - | See `docs/research_findings/typography-best-practices.md` |

### Spacing

| Decision | Status | Date | Details |
|----------|--------|------|---------|
| 8-point grid system | ✅ Decided | - | See `docs/research_findings/spacing-best-practices.md` |
| Responsive spacing tokens | ✅ Decided | - | See `docs/research_findices/spacing-best-practices.md` |

### Components

| Component | Decision | Status | Date | Details |
|-----------|----------|--------|------|---------|
| Right sidebar header | ⚪ TBD | - | |
| Card component | ⚪ TBD | - | |

---

## Cross-Phase Patterns

### Widget Patterns

| Pattern | Status | Date | Details |
|---------|--------|------|---------|
| Widget card styling | ✅ Decided | - | See phase-0-foundation.md task 0.5 |

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 4, 2026 | Added Undo Button Pattern (DFT-031) — context-specific buttons in widget headers, always-visible with inactive/active states, 5-action stacks per region, Cmd+Z support in Phase 6 | Will + Claude |
| Feb 4, 2026 | Added Error State Patterns (DFT-030) — severity hierarchy, toast placement (top of right sidebar), inline errors, partial failure banner, utilitarian tone | Will + Claude |
| Feb 3, 2026 | Added Loading State Patterns (DFT-018) — hybrid indicators, timeout thresholds, dynamic ETA, progressive loading | Will + Claude |
| Feb 3, 2026 | Added No Emojis Policy | Will |
| Feb 3, 2026 | Added Terminology Configuration (DFT-015) — configurable "Feature" vs "Item" terminology | Will + Claude |
| Feb 3, 2026 | Added Empty State Patterns (DFT-015) — visual pattern, first-visit vs returning user, widget-specific copy | Will + Claude |
