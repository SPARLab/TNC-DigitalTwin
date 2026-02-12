# Count Display Modes — Visual Reference

Quick visual guide to the 6 count display modes available for testing.

---

## Mode 1: No Counts

```
┌────────────────────────────────────┐
│ 📍 Map Layers     [⟲] [−] [⚙]    │
├────────────────────────────────────┤
│ PINNED LAYERS  4                   │
│                                    │
│ 📌 Camera Traps (ANiML)            │
│ 📌 iNaturalist Observations        │
│ 📌 Fire Perimeters                 │
│ 📌 Water Level Sensors (De...      │
└────────────────────────────────────┘
```
**Notes:** Clean, minimal. No information about filters or results.

---

## Mode 2: Filter Count Only (Current)

```
┌────────────────────────────────────┐
│ 📍 Map Layers     [⟲] [−] [⚙]    │
├────────────────────────────────────┤
│ PINNED LAYERS  4                   │
│                                    │
│ 📌 Camera Traps (ANiML)       🔽3  │
│ 📌 iNaturalist Observations        │
│ 📌 Fire Perimeters                 │
│ 📌 Water Level Sensors (De... 🔽2  │
└────────────────────────────────────┘
```
**Notes:** Shows "how filtered" each layer is. Doesn't tell you outcome.

---

## Mode 3: Result Count (Collapsed)

```
┌────────────────────────────────────┐
│ 📍 Map Layers     [⟲] [−] [⚙]    │
├────────────────────────────────────┤
│ PINNED LAYERS  4                   │
│                                    │
│ 📌 Camera Traps (ANiML)    47 results│
│ 📌 iNaturalist Observations 342 results│
│ 📌 Fire Perimeters         8 results│
│ 📌 Water Level Sensors (De... 12 results│
└────────────────────────────────────┘
```
**Notes:** Immediate answer to "how many features?" Denser layout.

---

## Mode 4: Result Count (Expanded Only)

```
[COLLAPSED STATE]
┌────────────────────────────────────┐
│ 📌 Camera Traps (ANiML)            │ ← No count visible
└────────────────────────────────────┘

[EXPANDED STATE]
┌────────────────────────────────────┐
│ 📌 Camera Traps (ANiML)            │
├────────────────────────────────────┤
│ 47 results match your filters      │ ← Count appears here
│                                    │
│ species = Mountain Lion            │
│ date > 2024-01-01                  │
│ confidence >= 80%                  │
│                                    │
│ [+ New View]     [Edit Filters >]  │
└────────────────────────────────────┘
```
**Notes:** Clean collapsed state. Result count in context with filters.

---

## Mode 5: Result Count (Children)

```
┌────────────────────────────────────┐
│ 📌 Camera Traps (ANiML)            │ ← No count on parent
│   └─ mountain lion       47 results│ ← Count on child
│   └─ deer               128 results│ ← Count on child
└────────────────────────────────────┘
```
**Notes:** Focuses on child-level filtering. Parent stays clean.

---

## Mode 6: Both (Test)

```
┌────────────────────────────────────┐
│ 📍 Map Layers     [⟲] [−] [⚙]    │
├────────────────────────────────────┤
│ PINNED LAYERS  4                   │
│                                    │
│ 📌 Camera Traps (ANiML)  🔽3  47 results│
│ 📌 iNaturalist Observations  342 results│
│ 📌 Fire Perimeters           8 results│
│ 📌 Water Level Sensors  🔽2  12 results│
└────────────────────────────────────┘
```
**Notes:** Shows both input (filters) and output (results). Likely too dense.

---

## Recommendations by Use Case

### If you prioritize **system status visibility**:
→ Use **Mode 3 (Results Collapsed)** or **Mode 4 (Results Expanded)**

### If you prioritize **clean UI with progressive disclosure**:
→ Use **Mode 4 (Results Expanded)**

### If you have **nested multi-view layers**:
→ Consider **Mode 5 (Results Children)** to focus on child-level filtering

### If you want to **compare both metrics**:
→ Try **Mode 6 (Both)** but expect cognitive load

### If users don't care about counts:
→ Use **Mode 1 (None)**

---

## User Testing Script

1. Show Mode 2 (current): "This shows how many filters are active"
2. Show Mode 3: "This shows how many results you got"
3. Ask: "Which is more useful to you?"
4. Show Mode 4: "This keeps the collapsed state clean, shows count when expanded"
5. Ask: "Do you prefer immediate (collapsed) or on-demand (expanded)?"
6. Show Mode 6: "This shows both — is it too much?"

**Key insight:** Filter count = process metadata. Result count = outcome data. Most users care more about outcome.
