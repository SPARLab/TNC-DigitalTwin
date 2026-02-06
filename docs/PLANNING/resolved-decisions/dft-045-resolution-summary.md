# DFT-045 Resolution Summary: Left Sidebar Taxonomy for DataOne

**Date Resolved:** February 6, 2026  
**Decision Maker:** Will + Claude (via UI/UX design principles analysis)  
**Related DFTs:** None

---

## The Problem

DataOne datasets span multiple scientific domains (species, freshwater, fire, soils, etc.). The left sidebar has 13 TNC domain categories. The question: **Should "Research Datasets" exist as a standalone category, or should DataOne be distributed/cross-referenced across domain categories?**

Three models were evaluated:

1. **Model A (Standalone):** "Research Datasets" as its own top-level category with DataOne as a layer underneath
2. **Model B (Distributed):** DataOne appears as a layer within each domain category (Species, Freshwater, etc.)
3. **Model C (Hybrid):** Standalone category + visual hints/shortcuts in domain categories

---

## The Decision

**Model C (Hybrid) with explicit DataOne-labeled shortcut rows.**

### What It Looks Like

**Left Sidebar — Category Expanded:**
```
┌────────────────────────────────────────────┐
│ v [icon] Species                       (3) │
│      Camera Traps (ANiML)                  │
│      iNaturalist Observations              │
│      eBird Sightings                       │
│      📚 DataOne Datasets (15)              │  ← Special shortcut row
│                                             │
│ v [📚] Research Datasets                (1) │
│      DataOne Datasets                      │  ← Canonical location
└────────────────────────────────────────────┘
```

### How It Works

1. **Canonical Location:**
   - DataOne lives as a layer under "Research Datasets" category
   - Clicking "DataOne Datasets" here opens right sidebar with **no domain pre-filter** (shows all 156+ datasets)

2. **Domain Shortcuts:**
   - When a domain category is expanded, a special row appears at the bottom: `📚 DataOne Datasets (count)`
   - Count shows number of DataOne datasets for that domain (e.g., "15" species datasets)
   - Special row only appears if count > 0 for that domain

3. **Clicking Shortcut Row:**
   - Activates DataOne layer (right sidebar opens to Browse tab)
   - Pre-filters Browse tab category dropdown to that domain (e.g., "Species")
   - Map shows DataOne datasets filtered to that domain
   - Result count updates (e.g., "Showing 15 datasets")

### Visual Specs

**Special Shortcut Row:**
- **Label:** `DataOne Datasets (count)` — explicitly shows source (not generic "Research Datasets")
- **Icon:** Lucide `Library` or `BookOpen` (16×16px, books/library icon)
- **Styling:** `text-sm text-gray-600 italic` (muted, italic signals "shortcut/link")
- **Spacing:** `mt-1.5` (small gap above to visually separate from regular layers)
- **Optional:** 1px `border-top border-gray-200` above row as subtle divider
- **Hover:** `hover:bg-emerald-50` (subtle green tint to match DataOne theme)

**Placement:**
- Always last row within expanded category (after all regular layers)
- Only renders if DataOne has datasets for that domain

---

## Design Rationale

Analyzed through 5 core UI/UX frameworks with strong cross-framework convergence.

### Core Insight

**Model A (standalone only) creates a discoverability cliff.** Researchers exploring "Species" won't discover DataOne datasets without prior knowledge of the "Research Datasets" category. This is especially problematic for Jack Dangermond's demo — we want the app to feel comprehensive, not like it's hiding data in unexpected places.

**Model B (distributed everywhere) creates clutter** and violates the principle that DataOne is conceptually different (curated research vs. live sensors). The sidebar would have 10+ "DataOne Datasets" entries, each with slightly different behavior.

**Model C (hybrid) balances discoverability and clarity.** Special rows guide discovery without cluttering the sidebar or obscuring DataOne's conceptual nature.

### Principle Analysis

| Principle | How Solution Addresses It |
|-----------|--------------------------|
| **Findability (IA)** | Special rows appear exactly where users are looking (domain context) — no need to remember "Research Datasets" exists |
| **Actionable (Norman)** | Shortcut row is clickable with clear affordance — provides direct path to filtered view |
| **Consistency (Nielsen #4)** | Looks like a layer row (familiar pattern), but subtle styling signals difference (muted color, italic, books icon) |
| **Recognition over Recall (Nielsen #6)** | Users don't need to remember DataOne exists — they see it when exploring domains |
| **Progressive Disclosure (IA)** | Only appears when category is expanded — no clutter when collapsed |
| **Efficiency (Fitts's Law)** | Reduces clicks: no need to navigate to Research Datasets → filter by domain |
| **Conceptual Model (Norman)** | DataOne has two access paths: direct (Research Datasets) and contextual (domain shortcuts) |
| **Visual Hierarchy (Design)** | Subtle styling difference (muted/italic) signals "this is a different kind of layer" |
| **Wayfinding (IA)** | Books icon creates consistent visual vocabulary across sidebar |

**Score:** 9/9 principles addressed

### Why Explicit "DataOne" Label?

Initial discussion considered generic "Research Datasets" label for shortcut rows. **Decision: use explicit "DataOne Datasets" label** for three reasons:

1. **Future-proofing:** If we add other repositories (Dryad, Zenodo), we can add more shortcut rows with different icons. Generic label would require submenu logic or combined results UI.
2. **Clarity:** Explicit source name removes ambiguity — users know exactly what they're clicking.
3. **YAGNI:** We don't have other repositories yet. Don't over-engineer for hypothetical future state.

**Future Extension Path:**
```
│      📚 DataOne Datasets (15)              │
│      🗂️ Dryad Datasets (8)                 │  ← Different icon for different repo
```

If multiple shortcuts feel cluttered, we can add flyout/submenu logic in v2.1+. But that's complexity we don't need for v2.0.

---

## Tradeoffs

**What we sacrifice:**
- Slightly more complex left sidebar (special rows add visual elements)
- Small implementation cost (query DataOne for category counts, render shortcut component)

**Why acceptable:**
- Special rows are subtle and only appear when category is expanded
- Implementation cost is low (1-2 hours)
- Dramatically improves discoverability for domain-first users (majority use case)
- Protects against "where did all the research datasets go?" confusion during Jack's demo
- Natural extension path if we add more repositories later

---

## Implementation Details

### Data Loading

On sidebar mount, query DataOne service for category distribution:
```javascript
const categoryBreakdown = await dataOneService.getCategoryCounts();
// Returns: { species: 15, fire: 8, freshwater: 12, ... }
setCategoryCounts(categoryBreakdown);
```

### Rendering Special Rows

When rendering expanded category:
```javascript
{/* Regular layers */}
<LayerRow name="Camera Traps (ANiML)" />
<LayerRow name="iNaturalist Observations" />

{/* Special DataOne shortcut */}
{categoryCounts.species > 0 && (
  <DataOneShortcutRow
    domain="species"
    count={categoryCounts.species}
    onClick={() => activateDataOneWithFilter('species')}
  />
)}
```

### Activation Behavior

When special row is clicked:
```javascript
function activateDataOneWithFilter(domain) {
  // 1. Activate DataOne layer (show in right sidebar)
  activateLayer('dataone-datasets');
  
  // 2. Open Browse tab
  setActiveTab('browse');
  
  // 3. Pre-filter category dropdown
  setDataOneCategoryFilter(domain);
  
  // 4. Fetch filtered results
  fetchDataOneDatasetsForCategory(domain);
}
```

**User experience:**
- Left sidebar: Special row gets active styling (emerald border, bold text)
- Right sidebar: Opens to Browse tab with category dropdown set to "Species"
- Map: Shows DataOne datasets (species-related) as markers
- Result count: "Showing 15 datasets"

### Edge Case: "Research Datasets" Category

When user expands the "Research Datasets" category and clicks the canonical "DataOne Datasets" layer:

**Behavior:**
- Activates DataOne **without** pre-filtering
- Browse tab category dropdown shows "All Categories"
- Shows all 156+ datasets

This is the "canonical" way to access DataOne — no domain pre-filter.

---

## Files Updated

1. **`docs/planning-task-tracker.md`**
   - Updated DFT-045 status to 🟢 Resolved
   - Added full resolution with decision, rationale, implementation specs

2. **`docs/PLANNING/component-specs/left-sidebar.md`**
   - Added State 9: Special DataOne Shortcut Row
   - Updated Design Decision Summary
   - Updated Interactions table (added shortcut row click behavior)
   - Updated terminology note about "Research Datasets" category

3. **`docs/IMPLEMENTATION/phases/phase-4-dataone.md`**
   - Updated Key Paradigm Notes with shortcut row pattern
   - Added Task 4.2 acceptance criteria: implement special shortcut rows
   - Added data loading requirements (query category counts)

4. **`docs/master-plan.md`**
   - Added to Cross-Phase Decisions → UX Decisions table

5. **`docs/PLANNING/resolved-decisions/dft-045-resolution-summary.md`**
   - Created this resolution summary

---

## Verification Checklist

- [x] Planning tracker status changed to 🟢 Resolved
- [x] Resolution documented with full specification
- [x] Design principles cited (9 frameworks analyzed)
- [x] Visual examples provided (ASCII diagrams)
- [x] Implementation details specified (data loading, rendering, activation)
- [x] Tradeoffs analyzed
- [x] Component specs updated (left-sidebar.md)
- [x] Phase document updated (phase-4-dataone.md)
- [x] Cross-references added to master plan
- [x] Resolution summary created

---

## Impact on Implementation

### Phase 0 (Foundation)
- **Task 0.2 (Left Sidebar):** Add special shortcut row component type
- **Data loading:** Query DataOne service for category counts on sidebar mount
- **Rendering logic:** Conditionally render shortcut rows when category count > 0

### Phase 4 (DataOne)
- **Task 4.2:** Implement shortcut row activation behavior (pre-filter by domain)
- **Browse tab:** Ensure category dropdown is controllable via props for pre-filtering
- **Right sidebar:** Handle domain pre-filter when activated from shortcut row vs canonical layer

### Phase 6 (Polish)
- Optional A/B test: subtle divider vs. no divider above shortcut rows
- Optional enhancement: hover tooltip on shortcut row explaining it's a filtered view

---

## Related Decisions

- **Left Sidebar Anatomy (Feb 6, 2026):** 13 TNC domain categories + "Research Datasets" category
- **DataOne Browse Tab (Phase 4):** Category dropdown for domain filtering

---

## Open Questions (None)

All questions resolved. Implementation ready.
