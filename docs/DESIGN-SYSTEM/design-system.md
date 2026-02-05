# Design System - TNC Digital Catalog

**Last Updated:** February 5, 2026 (Added Sidebar Template System — template-driven consistency across all data sources)  
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

## Layout Specifications

### Right Sidebar Width (DFT-033)

**Policy:** Right sidebar uses fixed width of 400px (not user-resizable).

**Specification:**
```css
.right-sidebar {
  width: 400px;
  /* No resize handles or drag behavior */
}
```

**Rationale:**
- **Simplicity serves task:** Users analyze data, not configure UI
- **Cognitive load reduction:** No resize decisions (Hick's Law)
- **Spatial memory:** Consistent width creates predictable layout (Nielsen #4)
- **GIS conventions:** Matches ArcGIS Online and QGIS patterns
- **Accessibility:** No drag handles = keyboard-friendly (WCAG)
- **Optimized content:** 400px accommodates 4-column image grids (ANiML), time-series charts (Dendra), and metadata (iNaturalist)
- **Map space:** Leaves 60%+ screen for map at 1440px viewport width

**Edge Case Handling:**
If specific content needs more space (e.g., detailed chart), use "Expand" button that opens modal/popout overlay. This provides flexibility without persistent UI configuration burden.

**Optional Enhancement (v2.1+):**
Consider binary collapse toggle (hide/show sidebar entirely) as future enhancement, not continuous resize.

**Decision Date:** February 5, 2026  
**Analyzed via:** 9 UI/UX frameworks (Gestalt, Norman, Nielsen, Shneiderman, Cognitive Laws, Visual Fundamentals, Accessibility, Behavioral Science, Information Architecture)

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

## Filter Section Patterns

**Policy (DFT-038):** All Browse tab filter sections follow a shared structural anatomy. Each data source passes its specific controls as children, but the wrapper enforces consistent layout, header convention, result count display, and container styling.

### Structural Skeleton

```
┌─────────────────────────────────────────┐
│ Filter [Plural Noun]         [Clear All]│  ← Header row
│─────────────────────────────────────────│
│                                         │
│  [Control 1: full-width]                │  ← Text search first
│  [Control 2] [Control 3] ← 2-col grid  │  ← Dropdowns paired
│  [Control 4: full-width]                │  ← Date ranges, multi-selects
│  ☐ [Toggle/checkbox option]             │  ← Toggles last
│                                         │
│─────────────────────────────────────────│
│  Showing 47 of 876 [noun]              │  ← Result count footer
└─────────────────────────────────────────┘
```

### Container Styling

```css
.filter-section {
  @apply bg-slate-50 border border-slate-200 rounded-lg p-3;
}
```

**No gradients.** Flat `slate-50` background creates Common Region grouping (Gestalt) without per-data-source decoration. Data-source identity lives in the sidebar header, not the filter controls.

### Grid Layout

```css
.filter-section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px; /* 8-point grid */
}
```

Controls use `col-span-1` (half-width) or `col-span-2` (full-width).

### Control Sizing Rules (within ~368px usable)

| Control Type | Grid Span | Position | Rationale |
|---|---|---|---|
| Text search | `col-span-2` | Always first | Serial Position Effect |
| Single dropdown | `col-span-1` | Pair 2 side-by-side | Compact, scannable |
| Date range (start + end) | `col-span-2` (2-col internal) | After dropdowns | Needs space for readability |
| Multi-select (pills) | `col-span-2` | After dropdowns | Pills need horizontal space |
| Toggle/checkbox | `col-span-2` | End of controls | Low visual weight |

### Section Header Convention

| Context | Pattern | Examples |
|---|---|---|
| Single-level layers | `"Filter [Plural Noun]"` | "Filter Observations", "Filter Datasets" |
| Dual-level, layer scope | `"Filter [Plural Noun]"` | "Filter Cameras", "Filter Sensors" |
| Dual-level, feature scope | `"Filter [Feature Noun]"` | "Filter Images", "Filter Datapoints" |

**Header Design Tokens:**
- Title: `text-[10px] font-semibold text-gray-500 uppercase tracking-wide`
- "Clear All": `text-[10px] text-gray-400 hover:text-red-500 cursor-pointer` (visible only when `hasActiveFilters`)

### Result Count Footer

**Pattern:** `"Showing X of Y [noun]"` where X is filtered count and Y is total.

**Design Tokens:**
- Container: `pt-2 border-t border-slate-200 mt-2`
- Text: `text-[10px] text-gray-600`
- Count: `font-semibold text-emerald-600` (filtered count) / `font-medium` (total)

### Shared Component Interface

```typescript
interface FilterSectionProps {
  label: string;              // "Filter Observations"
  resultCount: number;        // 847
  totalCount: number;         // 12430
  noun: string;               // "observations"
  hasActiveFilters: boolean;  // controls Clear All visibility
  onClearAll: () => void;
  children: React.ReactNode;  // Data-source-specific controls
}
```

**Component location:** `src/v2/components/RightSidebar/FilterSection.tsx`

### Per-Data-Source Control Inventory

| Data Source | Level | Header | Controls |
|---|---|---|---|
| **iNaturalist** | Single | "Filter Observations" | Taxon dropdown, Species dropdown (2-col), Date range (full), Quality grade checkbox |
| **ANiML** | L2 | "Filter Cameras" | Region dropdown, Status dropdown (2-col) |
| **ANiML** | L3 | "Filter Images" | Species multi-select (full), Date range (full), Deployment dropdown |
| **Dendra** | L2 | "Filter Sensors" | Region dropdown, Status dropdown (2-col) |
| **Dendra** | L3 | "Filter Datapoints" | Date range (full), Aggregation dropdown |
| **DataOne** | Single | "Filter Datasets" | Title search (full), Repository dropdown, TNC Category dropdown (2-col), Date range (full) |

### Design Principles Applied

- **Gestalt (Common Region, Proximity, Similarity):** Bounded container, tight grouping, same styling everywhere
- **Norman (Signifiers, Affordances, Feedback):** Headers communicate scope, controls look interactive, result count provides continuous feedback
- **Nielsen #4 (Consistency):** Same anatomy across all Browse tabs — learn once, apply everywhere
- **Nielsen #8 (Minimalism):** No "Optional:" labels, no gradient decoration, no unnecessary visual weight
- **Hick's Law / Miller's Law:** 2-col grid keeps section compact; max ~5 controls per section
- **IA (Wayfinding):** Header + result count = "where am I, what am I filtering, how many results"
- **Fitts's Law:** "Clear All" in header row (near eye focus); full-width inputs maximize target size
- **WCAG (Operable):** Standard form controls, keyboard navigable, labeled inputs

### Filter Apply Behavior (DFT-039)

**Policy:** All filter controls auto-apply — no Apply button in any data source. This ensures consistent behavior across all Browse tabs.

**Universal auto-apply rules:**

| Control Type | Trigger | Timing |
|---|---|---|
| Text search | Keystroke | 500ms debounce, 2+ chars (Enter key bypasses debounce) |
| Single dropdown | Selection change | Immediate |
| Multi-select (pills) | Each toggle | Immediate |
| Date range (each field) | Calendar close / blur | Immediate per field |
| Toggle / checkbox | Click | Immediate |

**Shared infrastructure (all data sources):**
- `AbortController` cancels in-flight requests when new filter state arrives
- Loading feedback per DFT-018 thresholds (stale results with opacity overlay, not blanked)
- Result count in `FilterSection` footer updates continuously
- "Clear All" in filter header fires immediately, resets to unfiltered state
- ARIA live region announces result count changes

**Date range edge case:** Changing one date field fires a query with the new value + existing other field. `AbortController` cancels intermediate queries. Previous results remain visible with opacity overlay.

**Design rationale:** Consistency (Nielsen #4), continuous feedback (Norman), fewer decisions per iteration (Hick's Law), matches ArcGIS Hub conventions (IA: Mental Models). Slight tradeoff on perceived control (Shneiderman #7) — acceptable because all filter changes are independently reversible.

**Decision Date:** February 5, 2026

### Dual-Level Filter Pattern (DFT-040)

**Policy:** ANiML and Dendra have two filter levels (Level 2 = layer scope, Level 3 = feature scope). At Level 3, a condensed `FeatureDetailCard` replaces the standard `FilterSection`.

**Key principles:**
- **No Level 2 summary bar at Level 3.** The back button ("← Back to Cameras/Sensors") is the only Level 2 reference. Level 2 filter state doesn't affect Level 3 content.
- **No separate "Filter [Noun]" header at Level 3.** The feature header card provides scope context.
- **Filter controls embedded in feature detail card** using the same DFT-038 grid layout.

**6-Zone Layout (Level 3 — Feature View):**

```
┌─────────────────────────────────────────┐
│ ← Back to [Cameras/Sensors]            │  1. Navigation breadcrumb
├─────────────────────────────────────────┤
│ [icon] Feature-ID — Location           │
│ Status • Count           [Clear] [↩]  │  2. Feature identity + actions
│─────────────────────────────────────────│
│  [Filter controls — DFT-038 grid]      │  3. Filter controls
│─────────────────────────────────────────│
│  Showing X of Y [noun]                 │  4. Result count
├─────────────────────────────────────────┤
│  [Results]                             │  5. Results
├─────────────────────────────────────────┤
│  [Pagination / Actions]                │  6. Pagination
└─────────────────────────────────────────┘
```

**Component structure:**

| Context | Component | Notes |
|---|---|---|
| Single-level (iNaturalist, DataOne) | `FilterSection` | Standard: header + grid + footer |
| Level 2 (ANiML cameras, Dendra sensors) | `FilterSection` | Standard: "Filter Cameras" / "Filter Sensors" |
| Level 3 (drilled into feature) | `FeatureDetailCard` | Embeds filter controls; no "Filter [Noun]" header |

**`FeatureDetailCard` interface:**

```typescript
interface FeatureDetailCardProps {
  icon: React.ReactNode;
  name: string;                 // "CAM-042" or "RS-042"
  subtitle: string;             // "North Ridge"
  metadata: string;             // "Active • 10,847 images"
  resultCount: number;
  totalCount: number;
  noun: string;                 // "images" or "datapoints"
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  children: React.ReactNode;    // Filter controls (DFT-038 grid)
}
```

**Component location:** `src/v2/components/RightSidebar/FeatureDetailCard.tsx`

**Per-data-source application:**

| Data Source | Feature Header | Filter Controls |
|---|---|---|
| **ANiML** | `📷 CAM-042 — North Ridge` / `Active • 10,847 images` | Species multi-select, Date range, Deployment dropdown |
| **Dendra** | `🌧️ RS-042 — North Ridge` / `Active • Rain Gauge • 0.2mm` | Date range, Aggregation dropdown |

**Design rationale:** Progressive disclosure (DFT-004) means both levels are never fully expanded simultaneously. Level 2 filter state doesn't affect Level 3 content (cameras exist regardless of how the camera list was filtered). The condensed layout maximizes vertical space for results within the 400px sidebar (DFT-033). Analyzed via Gestalt (Proximity, Figure-Ground), Norman (Conceptual Model, Signifiers), Nielsen (#1, #4, #6, #8), Hick's Law, IA (Wayfinding, Progressive Disclosure), Fitts's Law, WCAG.

**Decision Date:** February 5, 2026

### Related Decisions

- ~~**DFT-039:** Filter apply behavior (auto-apply vs explicit Apply button)~~ ✅ Resolved — see above
- ~~**DFT-040:** Visual distinction between Level 2 and Level 3 filter sections~~ ✅ Resolved — see above
- **DFT-037:** Exact spacing values, component library choice, collapse/expand behavior

**Section Established:** February 5, 2026

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

### Map Tooltip Patterns

**Policy (DFT-032):** Use minimal tooltips (ID + Type only) for v2.0 MVP. Defer advanced features until after teammate feedback.

#### MVP Implementation (v2.0)

**Recommended Approach: Native Browser Tooltips**

Use the `title` attribute on map markers for zero development overhead:

```typescript
// Example implementation
marker.setAttribute('title', `${feature.id} • ${feature.type}`);
```

**Pros:**
- Zero implementation overhead (1 line per feature)
- Browser handles timing, positioning, accessibility automatically
- Works with keyboard navigation (focus reveals tooltip)
- Perfect for gathering teammate feedback

**Cons:**
- Cannot customize styling (browser default appearance)
- Cannot control timing/animations
- Less polished than custom tooltips

#### Content Format (v2.0 MVP)

All tooltips follow this format: `"[ID] • [Type]"`

| Data Source | Example |
|-------------|---------|
| **ANiML Cameras** | `"CAM-042 • Camera"` |
| **Dendra Sensors** | `"WL-08 • Water Level Sensor"` |
| **iNaturalist** | `"California Condor • Observation"` |
| **eBird** | `"Spotted Owl • Sighting"` |
| **DataOne** | `"Vegetation Survey 2022 • Dataset"` (truncate title if >40 chars) |
| **TNC Layers** | `"Thomas Fire Perimeter • Fire Perimeter"` |

#### Alternative: Minimal Custom Tooltip

If native tooltips prove insufficient, implement a minimal custom tooltip:

```typescript
// Pseudocode
const MapTooltip = ({ feature }) => (
  <div 
    role="tooltip"
    className="bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm"
  >
    <span className="font-semibold">{feature.id}</span>
    <span className="text-gray-400"> • </span>
    <span>{feature.type}</span>
  </div>
);
```

**Design Tokens:**
- Container: `bg-gray-900 text-white px-3 py-2 rounded shadow-lg`
- ID: `text-sm font-semibold`
- Separator: `text-gray-400`
- Type: `text-sm`

**Timing:**
- Show delay: 200ms (prevents flicker)
- Fade in: 150ms ease-out
- Persist: While hover/focus maintained
- Fade out: 100ms ease-out

#### Future Enhancement (Post-v2.0)

After gathering teammate feedback, consider adding:
- **Filter-aware counts:** "23 mountain lion images" (requires query integration)
- **Additional metadata:** Date, location, latest sensor reading
- **Custom styling:** Animations, positioning, visual polish
- **Advanced accessibility:** Enhanced ARIA support

#### Implementation Notes

**For ArcGIS JS API:**
- Use `MapView.on("pointer-move")` for hover detection
- Use `hitTest()` to identify features under cursor
- Attach tooltip to feature's DOM element

**Accessibility:**
- Native tooltips announce on keyboard focus automatically
- Custom tooltips require `role="tooltip"` and `aria-describedby`
- Ensure tooltip doesn't obscure the feature itself

---

## Drag-and-Drop Patterns

**Policy:** Drag-and-drop reordering must be visually clear, keyboard-accessible, and respect reduced motion preferences.

**Context:** Pinned Layers widget allows users to reorder layers via drag-and-drop. Reordering affects map layer z-order (rendering order), which is critical for GIS workflows—researchers need points visible over polygons.

**Decision:** Resolved DFT-034, February 5, 2026

### Visual Specification

#### 1. Drag Handle

```css
.drag-handle {
  cursor: grab;
  color: #94a3b8;
  transition: color 0.15s ease;
}

.drag-handle:hover {
  color: #64748b;
}

.drag-handle:active {
  cursor: grabbing;
}
```

**Icon:** Lucide `GripVertical` (`⋮⋮`)  
**ARIA:** `aria-label="Drag to reorder layer. Use arrow keys to move up or down."`

#### 2. Dragged Row State

```css
.widget-layer-card.dragging {
  opacity: 0.6;
  transform: scale(0.95) rotate(2deg);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.3);
  cursor: grabbing;
  border: 2px dashed #3b82f6;
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.dragging {
    transform: scale(0.95); /* No rotation */
  }
}
```

**Rationale:**
- 60% opacity, 95% scale = clear lift (Gestalt Figure-Ground)
- 2deg rotation adds dynamism (mimics physical paper)
- Dashed border signals "in motion"
- Respects reduced motion preference

#### 3. Drop Target Indicator

```css
.widget-layer-card.drag-over {
  border-top: 4px solid #3b82f6;
  margin-top: -4px;
  background-color: rgba(59, 130, 246, 0.05);
}

.widget-layer-card.drag-over-bottom {
  border-bottom: 4px solid #3b82f6;
  margin-bottom: -4px;
  background-color: rgba(59, 130, 246, 0.05);
}
```

**Rationale:**
- 4px line meets WCAG contrast requirements
- Background highlight double-encodes drop zone (redundancy for accessibility)
- Margin offset prevents layout shift

#### 4. Drop Animation

```css
.widget-layer-card.just-dropped {
  animation: settle 400ms ease-out;
  background-color: #dcfce7; /* Green = success */
}

@keyframes settle {
  0% { transform: scale(1.02); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .widget-layer-card.just-dropped {
    animation: none;
    background-color: #dcfce7;
  }
}
```

**Rationale:**
- 400ms aligns with DFT-031 (undo button pulse) and DFT-025 (Create New View animation)
- Green highlight provides positive closure (Peak-End Rule)
- Subtle bounce mimics physical settling

### JavaScript Implementation Pattern

```javascript
function handleDrop(e) {
  e.preventDefault();
  
  const card = e.target.closest('.widget-layer-card');
  if (!card) return;
  
  const draggedLayerId = state.draggedLayerId;
  const targetLayerId = card.getAttribute('data-layer-id');
  
  if (draggedLayerId === targetLayerId) return;
  
  // Reorder logic (splice from old position, insert at new position)
  const fromIndex = state.pinnedLayers.indexOf(draggedLayerId);
  let toIndex = state.pinnedLayers.indexOf(targetLayerId);
  const isDropBelow = card.classList.contains('drag-over-bottom');
  
  state.pinnedLayers.splice(fromIndex, 1);
  toIndex = state.pinnedLayers.indexOf(targetLayerId);
  
  if (isDropBelow) {
    state.pinnedLayers.splice(toIndex + 1, 0, draggedLayerId);
  } else {
    state.pinnedLayers.splice(toIndex, 0, draggedLayerId);
  }
  
  // Update UI
  renderPinnedLayers();
  
  // Animate dropped card
  const droppedCard = document.querySelector(`[data-layer-id="${draggedLayerId}"]`);
  droppedCard.classList.add('just-dropped');
  setTimeout(() => droppedCard.classList.remove('just-dropped'), 500);
  
  // Update map z-order
  updateMapLayerOrder(state.pinnedLayers, { animate: true });
}
```

### Map Z-Order Feedback

**Toast Notification Pattern:**

```javascript
function updateMapLayerOrder(layerIds, { animate = false }) {
  // Update ArcGIS map layers...
  
  // Show educational toast
  showToast({
    message: "Map layer order updated",
    duration: 2000,           // Brief, auto-dismiss
    position: "bottom-center" // Near map
  });
}
```

**Rationale:**
- Educates users that widget order = map rendering order (Norman Conceptual Model)
- Non-intrusive (fades after 2s)
- Bottom-center placement near map (Gestalt Proximity)

### Keyboard Support (WCAG 2.1.1 Compliance)

```javascript
dragHandle.addEventListener('keydown', (e) => {
  const layerId = e.target.closest('[data-layer-id]').dataset.layerId;
  const index = state.pinnedLayers.indexOf(layerId);
  
  if (e.key === 'ArrowUp' && index > 0) {
    e.preventDefault();
    // Swap with previous layer
    [state.pinnedLayers[index-1], state.pinnedLayers[index]] = 
      [state.pinnedLayers[index], state.pinnedLayers[index-1]];
    
    renderPinnedLayers();
    
    // Maintain focus
    document.querySelector(`[data-layer-id="${layerId}"] .drag-handle`).focus();
    
    // Announce to screen readers
    announceToScreenReader(
      `${layerMeta[layerId].name} moved up to position ${index} of ${state.pinnedLayers.length}`
    );
    
    updateMapLayerOrder(state.pinnedLayers);
  }
  
  if (e.key === 'ArrowDown' && index < state.pinnedLayers.length - 1) {
    // Similar logic for moving down
  }
  
  if (e.key === 'Home' && e.shiftKey && index !== 0) {
    e.preventDefault();
    // Move to top
    state.pinnedLayers.splice(index, 1);
    state.pinnedLayers.unshift(layerId);
    renderPinnedLayers();
    document.querySelector(`[data-layer-id="${layerId}"] .drag-handle`).focus();
    announceToScreenReader(`${layerMeta[layerId].name} moved to top`);
  }
  
  if (e.key === 'End' && e.shiftKey && index !== state.pinnedLayers.length - 1) {
    // Move to bottom (similar logic)
  }
});
```

**ARIA Live Region:**

```html
<div id="drag-announcements" role="status" aria-live="polite" class="sr-only"></div>
```

```javascript
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('drag-announcements');
  liveRegion.textContent = message;
  setTimeout(() => liveRegion.textContent = '', 1000);
}
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Single pinned layer** | Hide drag handles (nothing to reorder) |
| **Invalid drop** (outside widget) | Card snaps back to origin, brief shake animation (2px, 2 cycles) |
| **Rapid reorders** | Debounce map updates by 300ms to prevent thrashing |

### Design Principles Applied

- **Gestalt:** Figure-ground (lifted row stands out), continuity (drop line guides eye), common fate (dragged row + cursor move together)
- **Norman:** Affordances (handle signals draggability), signifiers (cursor changes), feedback (visual states + toast), mappings (spatial layout = z-order)
- **Nielsen:** Visibility of system status (#1), user control (#3), consistency (#4), recognition over recall (#6)
- **Cognitive Science:** Feedback timing (<100ms instant, 400ms animation), Von Restorff (dragged row is memorable)
- **Accessibility:** Keyboard navigation (WCAG 2.1.1), ARIA announcements, contrast (4px line), reduced motion support

### Animation Timing Standards

| Element | Duration | Easing | Aligns With |
|---------|----------|--------|-------------|
| Settle animation | 400ms | `ease-out` | DFT-025 (Create New View: 250-300ms), DFT-031 (undo pulse: 400ms) |
| Toast auto-dismiss | 2000ms | — | Brief, non-intrusive |
| Debounce map updates | 300ms | — | DFT-025 pattern (prevent animation stacking) |

---

## Sidebar Template System

**Policy:** All right sidebar data source views share a common structural template. Changing the template's styling changes all data sources simultaneously. Individual data sources only customize *content* (which fields, which filters), never *layout or styling* (unless a documented exception exists).

**Why this matters:**
- **Nielsen #4 (Consistency):** Researchers learn one sidebar pattern, apply it across 4+ data sources
- **Development velocity:** 4 parallel Cursor agents building Phases 1-4 produce visually identical layouts
- **Theme-ability:** When the team wants to try different tab styles, card spacing, or color schemes, one change propagates everywhere
- **Mockup fidelity:** DFT-037 mockups define the template once; data-source mockups only show content differences

### Template Architecture

```
SidebarShell (shared)
├── SidebarHeader (data source icon + name + close)
├── TabBar (shared — Overview | Browse | Export)
├── TabContent (scroll area)
│   ├── OverviewTab (shared template, data-source fields as props)
│   ├── BrowseTab (shared template)
│   │   ├── FilterSection (DFT-038, shared)
│   │   ├── ResultsList (shared card layout)
│   │   │   └── ResultCard (shared template, data-source slots)
│   │   └── Pagination (shared)
│   └── ExportTab (shared template)
└── SidebarFooter (optional, shared)
```

**Rule:** If a component appears in the tree above as "(shared)", it lives in `src/v2/components/RightSidebar/shared/` and is imported by every data source. Data sources pass content as props/children. Data sources do NOT create their own versions of shared components.

**Exceptions (documented custom components):**
- ANiML: Landing cards for Animal-First / Camera-First entry (DFT-003c) — unique to ANiML Browse tab
- ANiML/Dendra: `FeatureDetailCard` at Level 3 (DFT-040) — replaces `FilterSection` when drilled into a feature
- Dendra: Pop-up time series chart with slider (DFT-004) — unique to Dendra map interaction

### Component: TabBar

**Location:** `src/v2/components/RightSidebar/shared/TabBar.tsx`

**Visual Specification:**

```
┌──────────────┬──────────────┬──────────────┐
│   Overview   │    Browse    │    Export     │
├──────────────┴──────────────┴──────────────┤
│ ════════════                               │  ← 2px active indicator
```

**Design Tokens:**

| Element | Styling |
|---------|---------|
| Container | `flex w-full border-b border-gray-200` |
| Tab (inactive) | `flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-center cursor-pointer transition-colors duration-150` |
| Tab (active) | `flex-1 py-2.5 text-sm font-semibold text-gray-900 border-b-2 border-emerald-600 text-center` |
| Tab (disabled) | `flex-1 py-2.5 text-sm text-gray-300 cursor-not-allowed text-center` |

**Behavior:**
- Tab click switches content with 150ms crossfade (per DFT-019)
- Active tab indicated by 2px bottom border (emerald-600 — TNC green family)
- Text-only labels (no icons) — 400px sidebar is too narrow for icon+text tabs
- Tab height: 40px total (meets 44px touch target with padding)
- Keyboard: Arrow Left/Right cycles tabs, Enter/Space activates
- ARIA: `role="tablist"`, each tab is `role="tab"` with `aria-selected`

**Rationale:**
- Underline tabs are the strongest convention for in-context navigation (Material, ArcGIS Online, most GIS tools)
- Equal-width columns prevent layout shift when switching
- Emerald accent ties to TNC green without being overwhelming
- Text-only keeps the tab bar clean at narrow widths (Hick's Law — 3 clear choices)

### Component: OverviewTab

**Location:** `src/v2/components/RightSidebar/shared/OverviewTab.tsx`

**Structural Template (all data sources follow this layout):**

```
┌─────────────────────────────────────────┐
│ [Icon]  Data Source Name                │  1. Header
│ Source: via iNaturalist API             │     Source badge
│─────────────────────────────────────────│
│ Brief description of this data source   │  2. Description
│ and what it contains (1-3 sentences).   │     (data-source-specific copy)
│─────────────────────────────────────────│
│ Key Metadata                            │  3. Metadata grid
│ ┌─────────────────┬───────────────────┐ │     (2-col, data-source fields)
│ │ Total records   │ 12,430            │ │
│ │ Date range      │ 2019 – 2025      │ │
│ │ Coverage        │ Dangermond Pres.  │ │
│ │ Last updated    │ Jan 15, 2026     │ │
│ └─────────────────┴───────────────────┘ │
│─────────────────────────────────────────│
│ [Browse Features →]                     │  4. CTA (per DFT-027)
└─────────────────────────────────────────┘
```

**Component Interface:**

```typescript
interface OverviewTabProps {
  icon: React.ReactNode;
  title: string;                    // "iNaturalist Observations"
  sourceBadge: string;              // "via iNaturalist API"
  description: string;              // 1-3 sentence summary
  metadata: { label: string; value: string }[];  // Key-value pairs
  onBrowseClick: () => void;        // Navigate to Browse tab
  browseLabel?: string;             // Default: "Browse Features →"
}
```

**Design Tokens:**

| Element | Styling |
|---------|---------|
| Icon | `w-8 h-8 text-gray-600` (Lucide or data-source SVG) |
| Title | `text-base font-semibold text-gray-900` |
| Source badge | `text-xs text-gray-400 mt-0.5` |
| Description | `text-sm text-gray-600 leading-relaxed` |
| Metadata label | `text-xs text-gray-500 font-medium` |
| Metadata value | `text-sm text-gray-900` |
| Metadata grid | `grid grid-cols-2 gap-x-4 gap-y-2` |
| CTA button | Per DFT-027 (full-width, TNC green, 44px min height) |

**Per-Data-Source Content (layout identical, fields differ):**

| Data Source | Metadata Fields |
|---|---|
| **iNaturalist** | Total observations, Species count, Date range, Quality grades, Coverage area |
| **ANiML** | Total cameras, Total images, Species detected, Date range, Coverage area |
| **Dendra** | Total sensors, Sensor types, Date range, Update frequency, Coverage area |
| **DataOne** | Total datasets, Categories covered, Date range, Sources, Coverage area |

### Component: ResultCard

**Location:** `src/v2/components/RightSidebar/shared/ResultCard.tsx`

**Structural Template:**

```
┌─────────────────────────────────────────┐
│ [Icon/Thumb]  Title Line                │
│               Subtitle / metadata       │
│               [Action] [Action] [Action]│
└─────────────────────────────────────────┘
```

**Component Interface:**

```typescript
interface ResultCardProps {
  icon?: React.ReactNode;           // Lucide icon or thumbnail
  thumbnail?: string;               // Image URL (replaces icon)
  title: string;                    // "CAM-042 — North Ridge"
  subtitle?: string;                // "Active • 847 images"
  metadata?: string;                // Additional line
  actions: { label: string; onClick: () => void; variant: 'primary' | 'secondary' | 'icon' }[];
  isGrayed?: boolean;               // For zero-result cameras (DFT-028)
  onClick?: () => void;             // Card click (drill-down)
}
```

**Design Tokens:**

| Element | Styling |
|---------|---------|
| Container | `bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer` |
| Container (grayed) | `opacity-50 saturate-50` (per DFT-028) |
| Thumbnail | `w-10 h-10 rounded object-cover` |
| Icon | `w-10 h-10 text-gray-400 bg-gray-100 rounded flex items-center justify-center` |
| Title | `text-sm font-medium text-gray-900 truncate` |
| Subtitle | `text-xs text-gray-500` |
| Action (primary) | `text-xs font-medium text-emerald-600 hover:text-emerald-700` |
| Action (secondary) | `text-xs text-gray-500 hover:text-gray-700` |
| Action (icon) | `w-5 h-5 text-gray-400 hover:text-red-500` (for remove/close) |

**Per-Data-Source Content (same card, different slots):**

| Data Source | Icon/Thumb | Title | Subtitle | Actions |
|---|---|---|---|---|
| **iNaturalist** | Species photo | Species name | Observer, Date | View, Bookmark, Open in iNat |
| **ANiML** | Camera icon | CAM-ID — Location | Status, Image count | View Camera, Bookmark |
| **Dendra** | Sensor icon | Sensor-ID — Location | Status, Last reading | View Sensor, Bookmark |
| **DataOne** | Document icon | Dataset title | Authors, Year | Details, Bookmark, Open in DataOne |

### Component: Pagination

**Location:** `src/v2/components/RightSidebar/shared/Pagination.tsx`

**Policy:** All list views use the same pagination pattern. Image grids use "Load More" instead.

**List Pagination (iNaturalist, ANiML cameras, Dendra sensors, DataOne datasets):**

```
┌─────────────────────────────────────────┐
│  [← Previous]    Page 2 of 12   [Next →]│
└─────────────────────────────────────────┘
```

| Element | Styling |
|---------|---------|
| Container | `flex items-center justify-between py-3 border-t border-gray-200` |
| Button (active) | `text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100` |
| Button (disabled) | `text-sm text-gray-300 cursor-not-allowed px-3 py-1.5` |
| Page indicator | `text-xs text-gray-500` |

**Page size:** 20 items per page (consistent with DFT-035 DataOne decision).

**Image Grid Pagination (ANiML images within a camera):**

```
┌─────────────────────────────────────────┐
│  [Load 20 More]  (47 of 847 loaded)    │
└─────────────────────────────────────────┘
```

Images benefit from continuous browsing (researchers scan visually). "Load More" avoids losing scroll position.

**Keyboard:** Previous/Next buttons focusable. Enter activates. ARIA: `aria-label="Go to next page"`.

### Component: LeftSidebar Category Pattern

**Location:** `src/v2/components/LeftSidebar/` (shared across all categories)

**Visual Pattern:**

```
┌──────────────────────────────────────┐
│ Search layers...                     │  Search/filter bar
│──────────────────────────────────────│
│ v  Wildlife Monitoring           (3) │  Category header (collapsible)
│     * Camera Traps (ANiML)           │  ← Active layer (bold + accent)
│       iNaturalist Observations       │
│       eBird Sightings                │
│ >  Environmental Sensors         (2) │  Category (collapsed)
│ v  Research Datasets             (1) │
│       DataOne Datasets               │
│ >  Reference Layers              (5) │
│ >  Fire & Hazards                (3) │
└──────────────────────────────────────┘
```

**Design Tokens:**

| Element | Styling |
|---------|---------|
| Category header | `flex items-center gap-2 py-2 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer` |
| Chevron | `w-4 h-4 text-gray-400 transition-transform duration-150` (rotates on expand) |
| Category icon | `w-4 h-4 text-gray-500` (Lucide icon) |
| Layer count badge | `text-xs text-gray-400 ml-auto` |
| Layer row (inactive) | `py-1.5 px-3 pl-9 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer rounded-sm` |
| Layer row (active) | `py-1.5 px-3 pl-9 text-sm font-semibold text-gray-900 bg-emerald-50 border-l-2 border-emerald-600 rounded-sm` |

**Behavior:**
- Click category header: toggle expand/collapse (chevron rotates)
- Click layer row: make active (right sidebar opens, map highlights)
- Active layer: bold text + emerald left border + subtle green background
- Only ONE layer active at a time (per DFT-021)
- Keyboard: Enter/Space toggles category, Arrow Down navigates layers
- ARIA: `role="tree"` with `role="treeitem"` for layers

### Theme Token System

**Policy:** All shared template components read from a centralized set of theme tokens. Changing these tokens changes the look of every data source simultaneously.

**Token Categories:**

```typescript
// src/v2/theme/tokens.ts
export const sidebarTheme = {
  // Tab bar
  tabActiveColor: 'text-gray-900',
  tabActiveBorder: 'border-emerald-600',
  tabInactiveColor: 'text-gray-500',

  // Cards
  cardBg: 'bg-white',
  cardBorder: 'border-gray-200',
  cardHoverBorder: 'border-gray-300',
  cardRadius: 'rounded-lg',
  cardPadding: 'p-3',

  // Active/accent
  accentColor: 'emerald-600',
  accentBg: 'bg-emerald-50',
  accentBorder: 'border-emerald-600',

  // Typography
  titleSize: 'text-sm',
  titleWeight: 'font-medium',
  subtitleSize: 'text-xs',
  metadataColor: 'text-gray-500',

  // Filter section (inherits DFT-038)
  filterBg: 'bg-slate-50',
  filterBorder: 'border-slate-200',

  // Pagination
  pageSize: 20,

  // Spacing (8-point grid)
  sectionGap: 'gap-4',
  controlGap: 'gap-2',
} as const;
```

**How theming works:**
1. All shared components import from `sidebarTheme`
2. To try a different look: change tokens in one file
3. Mockups define the initial token values; team adjusts during review
4. Data-source-specific colors (if needed later) can override `accentColor` per sidebar instance

**What tokens do NOT control:**
- Content (fields, descriptions, labels) — per-data-source
- Filter controls (which dropdowns, which inputs) — per-data-source via DFT-038 children
- Custom interactions (ANiML landing cards, Dendra chart slider) — documented exceptions

### Shared Component File Structure

```
src/v2/components/RightSidebar/
├── shared/
│   ├── SidebarShell.tsx          ← Outer container (400px, scroll)
│   ├── TabBar.tsx                ← Overview | Browse | Export
│   ├── OverviewTab.tsx           ← Template (accepts metadata props)
│   ├── FilterSection.tsx         ← DFT-038 wrapper
│   ├── FeatureDetailCard.tsx     ← DFT-040 Level 3 wrapper
│   ├── ResultCard.tsx            ← Standard result card
│   ├── Pagination.tsx            ← Previous/Next or Load More
│   └── BrowseFeaturesButton.tsx  ← DFT-027 CTA button
├── iNaturalist/                  ← Only content/config, imports shared
├── ANiML/                        ← Only content/config + landing cards exception
├── Dendra/                       ← Only content/config + chart exception
└── DataOne/                      ← Only content/config
```

### Decision Date

February 5, 2026

### Design Principles Applied

- **Nielsen #4 (Consistency):** Template enforces identical structure across all data sources
- **DRY principle:** One component definition, 4 consumers — changes propagate automatically
- **Gestalt (Similarity):** Same card shapes, tab positions, spacing everywhere
- **Shneiderman (Consistency & Universal Usability):** Novices learn once; experts rely on muscle memory
- **Development efficiency:** Parallel Cursor agents building Phases 1-4 import shared components — no drift

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| Feb 5, 2026 | Added Sidebar Template System — shared structural templates (TabBar, OverviewTab, ResultCard, Pagination, LeftSidebar category pattern) enforced via components. Theme tokens centralized in `sidebarTheme`. All data sources use identical layout; only content varies. Exceptions documented (ANiML landing cards, Dendra chart, Level 3 FeatureDetailCard). Decisions: underline tabs (emerald accent), Previous/Next pagination (20/page), standard result card with icon/title/subtitle/actions slots, left sidebar with collapsible categories and emerald active state | Will + Claude |
| Feb 5, 2026 | Added Filter Apply Behavior (DFT-039) — auto-apply everywhere, no Apply button in any data source. Universal rules: dropdowns immediate, text search 500ms debounce, date fields on calendar close/blur, toggles immediate. `AbortController` cancels in-flight requests. Loading per DFT-018 thresholds. Stale results visible with overlay. Result count updates continuously. ARIA live region announces changes | Will + Claude |
| Feb 5, 2026 | Added Filter Section Patterns (DFT-038) — shared structural anatomy for all Browse tab filter UIs. `FilterSection` component enforces consistent header, 2-col CSS grid, result count footer, and `slate-50` container across all 4 data sources. Control sizing rules, header convention, and per-data-source inventory documented | Will + Claude |
| Feb 5, 2026 | Added Drag-and-Drop Patterns (DFT-034) — enhanced visual treatment, drop animations, keyboard support, ARIA announcements, map z-order feedback via toast. Analyzed through 9 UI/UX frameworks. Keyboard support essential for v2.0 WCAG compliance | Will + Claude |
| Feb 5, 2026 | Added Layout Specifications — Right sidebar fixed width at 400px (DFT-033), not resizable. Rationale documented via 9 UI/UX frameworks | Will + Claude |
| Feb 4, 2026 | Added Map Tooltip Patterns (DFT-032) — minimal MVP approach (ID + Type only), native browser tooltips recommended, defer filter-aware content to post-v2.0 | Will + Claude |
| Feb 4, 2026 | Added Undo Button Pattern (DFT-031) — context-specific buttons in widget headers, always-visible with inactive/active states, 5-action stacks per region, Cmd+Z support in Phase 6 | Will + Claude |
| Feb 4, 2026 | Added Error State Patterns (DFT-030) — severity hierarchy, toast placement (top of right sidebar), inline errors, partial failure banner, utilitarian tone | Will + Claude |
| Feb 3, 2026 | Added Loading State Patterns (DFT-018) — hybrid indicators, timeout thresholds, dynamic ETA, progressive loading | Will + Claude |
| Feb 3, 2026 | Added No Emojis Policy | Will |
| Feb 3, 2026 | Added Terminology Configuration (DFT-015) — configurable "Feature" vs "Item" terminology | Will + Claude |
| Feb 3, 2026 | Added Empty State Patterns (DFT-015) — visual pattern, first-visit vs returning user, widget-specific copy | Will + Claude |
