# Quick Start: Testing Count Display Modes

**5-Minute Guide to Testing the Count Display Feature**

---

## Step 1: Open the App

Navigate to: `http://localhost:5173/?v2`

---

## Step 2: Find the Settings Icon

Look at the **Map Layers** widget (top-left floating widget on the map).

In the header, you'll see several icons:
- 📍 Map Layers icon
- ⟲ Undo button
- ⚙ **Settings icon** ← Click this!
- − Collapse button

---

## Step 3: Open the Dropdown

Click the **⚙ Settings** icon.

A dropdown menu will appear with these options:
- No Counts
- Filter Count Only
- Result Count (Collapsed)
- ✓ **Result Count (Expanded)** ← Default mode
- Result Count (Children)
- Both (Test)

The current mode will have a checkmark (✓). By default, "Result Count (Expanded)" is selected.

---

## Step 4: Try Each Mode

### Current Default: "Result Count (Expanded)"

**You'll see this by default:**
- Collapsed row: **No count visible** (clean)
- Click to expand: **"47 results match your filters"** appears after the filter queries

### Test Other Modes

1. **Try "Filter Count Only"** (previous behavior)
   - You should see: 🔽 3 next to "Camera Traps (ANiML)"
   - This shows how many filters are active

2. **Try "Result Count (Collapsed)"**
   - You should see: "47 results" next to layer name in collapsed state
   - This shows outcome immediately but adds density

3. **Try "Both (Test)"**
   - You should see: 🔽 3 and "47 results" side-by-side
   - Notice if it feels too crowded

4. **Try "No Counts"**
   - All counts disappear
   - Clean, minimal view

5. **Switch back to "Result Count (Expanded)"** (recommended default)
   - Clean collapsed state, count in context when expanded

---

## What to Look For

### Usefulness
- **Which count answers your question?**
  - Filter count: "How filtered is this?"
  - Result count: "What did I get?"

### Space
- **Do long layer names get truncated?**
- **Does adding counts make things feel cramped?**

### Clarity
- **Can you quickly scan and understand the counts?**
- **Is the count in the right place (collapsed vs expanded)?**

### Nested Layers
- **Click "Camera Traps (ANiML)" to see child views**
- **Try "Result Count (Children)" mode**
- **Should child views show counts? Parent? Both?**

---

## Quick Feedback Form

After testing, answer these questions:

1. **Most useful mode:** _______________
2. **Least useful mode:** _______________
3. **Space issues?** Yes / No — (if yes, which mode?)
4. **Filter count or result count?** Filter / Result / Both / Neither
5. **Collapsed or expanded?** Collapsed (immediate) / Expanded (clean)
6. **Other thoughts:** _______________

---

## Common Questions

**Q: Where do these counts come from?**
A: Currently mock data. In production, they'll be real map query results.

**Q: Can I save my preferred mode?**
A: Not yet — this is a testing tool. Once we pick a mode, it'll be the default.

**Q: What if I don't care about counts?**
A: Try "No Counts" mode! If everyone prefers this, we won't add counts.

**Q: Why does "Both" feel cluttered?**
A: It might! That's the point — we're testing if showing both is too much information.

---

## Screenshots to Compare

### Default: Result Count (Expanded)
```
📌 Camera Traps (ANiML)           [collapsed - clean, no count]

---

📌 Camera Traps (ANiML)           [expanded]
   ────────────────────
   species = Mountain Lion
   date > 2024-01-01
   confidence >= 80%
   ────────────────────
   47 results match your filters  ← Count appears after queries
```

### Alternative: Filter Count Only (Previous)
```
📌 Camera Traps (ANiML)       🔽3
```

### Alternative: Result Count (Collapsed)
```
📌 Camera Traps (ANiML)    47 results
```

### Alternative: Both (Test)
```
📌 Camera Traps (ANiML)  🔽3  47 results
```

---

## Need Help?

- **Can't find settings icon?** Look in Map Layers widget header (top-left), between undo and collapse buttons
- **Dropdown won't close?** Click anywhere outside the dropdown
- **Counts not changing?** Make sure you clicked a different mode (current mode has checkmark)
- **No Map Layers widget?** You might be on v1 — add `?v2` to URL

---

## Share Your Feedback

Ping Will with:
1. Your preferred mode
2. Screenshot if you found layout issues
3. Any "aha!" moments or confusion

**Remember:** This is temporary testing code. We'll implement the winner and remove the dropdown before Feb 20.
