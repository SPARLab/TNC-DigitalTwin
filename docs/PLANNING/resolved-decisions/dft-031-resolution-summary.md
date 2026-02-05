# DFT-031 Resolution Summary: Confirmation Dialog Strategy

**Date:** February 4, 2026  
**Status:** ✅ Resolved  
**Decision:** Hybrid approach — undo for single-item actions, confirmation for bulk operations

---

## The Problem

The TNC Digital Catalog allows several destructive user actions:
- Unpin layer (removes from Pinned Layers widget)
- Remove bookmark (removes from Bookmarks widget)  
- Clear filters (resets all filters on a layer)
- Clear cart (removes all items from export cart)
- Remove cart item (removes single item)

**Question:** Which actions require confirmation dialogs vs. relying on undo mechanisms?

**Tension:** Error prevention vs. workflow efficiency. Confirmations protect against mistakes but slow down research workflows. Overuse leads to "confirmation blindness" where users click through without reading.

---

## The Solution: Hybrid Approach

### Decision Matrix

| Action | Confirmation? | Undo? | Rationale |
|--------|---------------|-------|-----------|
| **Unpin single layer** | ❌ No | ✅ Yes | Frequent action; easy to re-pin |
| **Remove single bookmark** | ❌ No | ✅ Yes | Frequent action; easy to re-bookmark |
| **Clear filters on layer** | ❌ No | ✅ Yes | Filters shown in expanded panel; undo restores |
| **Remove single cart item** | ❌ No | ✅ Yes | Similar to removing bookmarks |
| **Clear entire cart** | ✅ Yes | ✅ Yes* | Bulk action affecting multiple queries |
| **Clear all filters (future)** | ✅ Yes | ✅ Yes* | If applied across multiple layers |
| **Delete custom view** | ❌ No | ✅ Yes | User can recreate filters easily |

*Post-confirmation actions still support undo as safety net.

---

## Confirmation Decision Tree

```
Is this a bulk action (>1 item)?
├─ YES → Does it affect user-generated content?
│         ├─ YES → CONFIRM + UNDO
│         └─ NO  → CONFIRM + UNDO
└─ NO  → Is it easily reversible?
          ├─ YES → NO CONFIRM, UNDO ONLY
          └─ NO  → CONFIRM + UNDO
```

**Examples Applied:**
- Clear cart (12 items) → Bulk → **CONFIRM**
- Unpin layer → Single item → Easily reversible → **NO CONFIRM**
- Delete user annotation (future) → Single item → NOT easily reversible → **CONFIRM**

---

## Implementation Patterns

### Single-Item Actions (No Confirmation)

**Pattern:** Immediate action + toast with undo

```typescript
// Example: Unpin layer
const handleUnpinLayer = (layerId: string) => {
  const previousState = captureLayerState(layerId);
  
  unpinLayer(layerId);
  
  toast.success('Layer unpinned', {
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: () => restoreLayerState(previousState)
    }
  });
};
```

**Visual Pattern:**
- Action executes immediately (no interruption)
- Toast appears: "Layer unpinned" [Undo]
- Undo window: 5 seconds (standard), 10 seconds (complex actions)

**Rationale:**
- No workflow interruption (maintains research flow)
- Users can explore confidently (undo safety net)
- Frequent actions remain fast (no confirmation fatigue)

---

### Bulk Actions (With Confirmation)

**Pattern:** Custom modal + undo after confirmation

```typescript
// Example: Clear cart
const handleClearCart = async () => {
  const confirmed = await showDialog({
    title: 'Clear cart?',
    message: `Remove all ${cartItems.length} queries from your export cart?`,
    confirmLabel: 'Clear Cart',
    confirmVariant: 'destructive',
    cancelLabel: 'Cancel'
  });
  
  if (confirmed) {
    const previousCart = [...cartItems];
    clearCart();
    
    toast.success('Cart cleared', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => restoreCart(previousCart)
      }
    });
  }
};
```

**Modal Design Specifications:**
- **Title:** "[Action]?" (e.g., "Clear cart?")
- **Message:** Specific count of affected items
- **Buttons:** 
  - Cancel (secondary styling, left-aligned)
  - Action verb (destructive styling, right-aligned)
- **Component:** Custom modal (not native `window.confirm()`)

**Rationale:**
- Bulk operations have higher cost if mistaken
- Custom modal provides better UX than browser alert
- Undo after confirmation provides extra safety layer

---

## Visual Hierarchy for Destructive Actions

### Single-Item Removal (× Icon)

Small, subtle icon that signals "this is reversible":

```tsx
<button className="text-slate-400 hover:text-red-500 transition-colors">
  <X className="w-4 h-4" />
</button>
```

### Bulk Removal Button

Prominent button with warning styling:

```tsx
<button className="px-4 py-2 bg-white border-2 border-red-500 text-red-600 
                   hover:bg-red-50 font-medium rounded-lg flex items-center gap-2">
  <Trash2 className="w-4 h-4" />
  Clear All
</button>
```

**Design Principle:** The border and color signal severity—users pause naturally without needing a confirmation dialog for single items.

---

## Why This Works: 9 Pillars Analysis

### 1. Cognitive Science (Laws of UX)

**Hick's Law (Decision Time):**
Each confirmation dialog adds decision points. For frequent actions (unpin, unbookmark), this creates cumulative cognitive tax. Undo eliminates pre-action decision, moving it to post-action (only if needed).

**Peak-End Rule:**
Research workflows involve many micro-actions. Constant interruptions create negative "peaks" in experience. Smooth flow with undo option creates better overall experience.

**Miller's Law (Working Memory):**
Undo reduces mental burden—users don't need to maintain "am I sure?" state before each action. They can act and correct if needed.

---

### 2. Interaction Design (Norman)

**Norman's Reversibility Hierarchy:**
```
Undo > Confirmation > Irreversible
```

Undo is the gold standard because:
- Doesn't interrupt workflow
- Allows confident exploration
- Teaches through doing (not through warnings)

**Feedback:**
Post-action toast provides immediate feedback without pre-action interruption. System responds, user maintains control.

---

### 3. Usability (Nielsen's Heuristics)

**#3 - User Control & Freedom:**
"Users often perform actions by mistake. They need a clearly marked 'emergency exit.'"
→ Undo button provides this without pre-action friction.

**#5 - Error Prevention:**
Confirmation dialogs are strongest when:
- Action affects **multiple items** (bulk operations)
- Data is **hard/impossible to recreate**
- Action has **irreversible consequences**

Single-item removals fail these criteria.

**#7 - Flexibility & Efficiency:**
Power users will find repetitive dialogs frustrating. Undo allows efficiency while maintaining safety.

---

### 4. Behavioral Science

**Loss Aversion:**
Users fear losing work. Undo provides *perception* of safety without *friction* of confirmations.

**Confirmation Fatigue:**
Excessive confirmations train users to click through without reading. Strategic use (bulk only) maintains effectiveness.

**Progressive Commitment:**
Small actions (one item) don't need confirmation. Large actions (clear all) warrant explicit consent.

---

### 5. Gestalt Principles

**Proximity:**
Undo button lives in widget header, near where actions occur. Spatial proximity reinforces mental connection.

**Similarity:**
All single-item × buttons look similar across the app. Consistency builds mental model: "small × = quick removal with undo."

---

### 6. Accessibility (WCAG)

**3.2 - Understandable:**
Predictable behavior reduces cognitive load. If × buttons never confirm, they're predictable.

**2.1 - Operable:**
Keyboard users benefit from quick actions. Confirmation dialogs require additional tab/enter sequences.

---

### 7. Visual Fundamentals

**Contrast & Hierarchy:**
Destructive actions use visual weight to signal severity:
- **× icon (gray)** = single-item, low severity
- **"Clear All" button (red border)** = bulk action, high severity

The visual hierarchy itself provides warning—confirmation may be redundant for single items.

---

## Edge Cases

### 1. Layer with Complex Filters (10+ conditions)

**Scenario:** User unpins a layer with extensive custom filters.

**Decision:** Still no confirmation, but undo duration = 10 seconds (vs 5 seconds standard)

**Rationale:** User invested time building filters; give more recovery window.

---

### 2. User Unpins Last Remaining Layer

**Scenario:** User has only one pinned layer and unpins it.

**Decision:** No confirmation (consistent with single-item pattern)

**Feedback:** "All layers unpinned" toast with undo

**Rationale:** Consistency over special-casing. Empty state has educational copy to guide recovery.

---

### 3. Cart Has 1 Item, User Clicks "Clear Cart"

**Scenario:** Edge case where bulk action affects single item.

**Decision:** Still show confirmation (button label implies bulk action)

**Alternative:** Dynamically change button to "Remove" when count = 1 (deferred to Phase 6 polish)

**Rationale:** Button affordance ("Clear All") creates expectation of confirmation.

---

### 4. User Clicks "Clear Filters" But No Filters Applied

**Scenario:** No-op action.

**Decision:** Button disabled/grayed when no filters exist

**Rationale:** Avoids confusing confirmation for action that does nothing.

---

## Current Implementation vs. Target

### Current State (App.tsx)

```typescript
// Line 3374 (current implementation)
onClearCart={() => {
  if (window.confirm('Clear all items from cart?')) {
    clearCart();
  }
}}
```

**Issues:**
- Uses native `window.confirm()` (poor UX, not styled)
- No undo support after confirmation
- Inconsistent with design system

### Target State

```typescript
onClearCart={async () => {
  const confirmed = await showConfirmDialog({
    title: 'Clear cart?',
    message: `Remove all ${cartItems.length} queries from your export cart?`,
    confirmLabel: 'Clear Cart',
    confirmVariant: 'destructive'
  });
  
  if (confirmed) {
    const snapshot = [...cartItems];
    clearCart();
    
    toast.success('Cart cleared', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => restoreCart(snapshot)
      }
    });
  }
}}
```

**Implementation Tasks:**
- [ ] Create `ConfirmDialog` component
- [ ] Replace `window.confirm()` in App.tsx
- [ ] Add undo support to cart operations
- [ ] Add undo support to Pinned Layers widget
- [ ] Add undo support to Bookmarks widget

---

## Cross-Framework Patterns

Three consistent themes across all 9 design principle frameworks:

1. **Reversibility > Confirmation for frequent single-item actions**
2. **Confirmation justified for bulk operations**
3. **Visual hierarchy + undo = better UX than confirmation dialogs**

---

## Comparison to Analogous UIs

| Pattern | Example | Lesson |
|---------|---------|--------|
| **Browser tabs** | Click × to close tab → closes immediately, Cmd+Shift+T to undo | No confirmation for single tab close |
| **Gmail** | Archive email → immediate, undo toast appears | Frequent actions use undo, not confirm |
| **Figma** | Delete element → immediate, Cmd+Z to undo | Design tools favor undo (exploration encouraged) |
| **macOS Trash** | Move to trash → immediate; empty trash → confirm | Bulk destructive action gets confirmation |

---

## Documentation Updated

1. **Planning Tracker** (`docs/planning-task-tracker.md`)
   - DFT-031 marked resolved
   - Full decision matrix and rationale added

2. **Design System** (`docs/DESIGN-SYSTEM/design-system.md`)
   - Undo Button Pattern section documents confirmation strategy
   - Already completed as part of DFT-031 resolution

3. **Master Plan** (`docs/master-plan.md`)
   - Added to UX Decisions table
   - Change log updated

4. **Resolution Summary** (this document)
   - `docs/PLANNING/resolved-decisions/dft-031-resolution-summary.md`

---

## Next Steps

**For implementation (Phase 0, Task 0.5):**
1. Create `ConfirmDialog` component (`src/v2/components/ConfirmDialog/`)
2. Create `useUndoStack` hook (`src/v2/hooks/useUndoStack.ts`)
3. Replace `window.confirm()` in App.tsx (line 3374)
4. Add undo buttons to Pinned Layers widget header
5. Add undo buttons to Bookmarks widget header
6. Test with researchers for validation

**For team review:**
- Present decision matrix to Amy/Trisalyn
- Validate 5-second vs 10-second undo window timing
- Confirm visual hierarchy (× icons vs "Clear All" buttons)

---

**Status:** Ready for implementation (Phase 0, Task 0.5)
