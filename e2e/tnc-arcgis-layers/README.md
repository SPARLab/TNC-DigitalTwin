# TNC ArcGIS Layer Tests

This directory contains E2E tests for TNC ArcGIS layers, organized into:
- **Dynamic tests** (`all-layers-dynamic.spec.ts`) - Auto-generated for all layers
- **Manual tests** - Hand-crafted for specific problem cases

---

## 📁 File Organization

### **Dynamic Tests (Automated)**
- `all-layers-dynamic.spec.ts` - Iterates through all 45 categorized layers from `all-arcgis-layers.json`

### **Manual Tests (Problem Cases)**
These are **reference tests** for layers that revealed issues or edge cases:

- `cattle-guards.spec.ts` - Icon-based layer (visual diff detection)
- `coastal-and-marine-data.spec.ts` - Multiple PNG icons
- `fish-passage-barriers-assessment.spec.ts` - Styled points (geometric shapes)
- `dibblee-geology.spec.ts` - Cryptic legend labels (geological abbreviations)

These manual tests were created to investigate:
1. **False Negatives** (tests fail, but manual QA passes)
2. **False Positives** (tests pass, but manual QA fails)
3. **Hybrid detection behavior** for icon/point layers

---

## 🚀 Running Tests

### **Run All Layers (Dynamic Test)**
```bash
npm run test:e2e
```

### **Run Specific Manual Test**
```bash
# Cattle Guards (icon layer)
npm run test:e2e -- --grep="Cattle Guards"

# Coastal and Marine Data (multiple PNGs)
npm run test:e2e -- --grep="Coastal and Marine Data"

# Fish Passage Barriers (styled points)
npm run test:e2e -- --grep="Fish Passage Barriers Assessment"

# Dibblee Geology (cryptic labels)
npm run test:e2e -- --grep="Dibblee Geology"
```

### **Run All Manual Tests**
```bash
npm run test:e2e -- --grep="ICON LAYER|PNG ICON|STYLED POINT|CRYPTIC LABELS"
```

### **Run Full Checkpoint (All Layers)**
```bash
npm run test:e2e:checkpoint
```

---

## 🧪 What These Manual Tests Verify

### **1. Cattle Guards (`cattle-guards.spec.ts`)**
**Problem:** Icon-based layer, no extractable RGB colors

**What it tests:**
- ✅ Visual diff detection automatically engages
- ✅ Before/after screenshot comparison works
- ✅ Pixel difference > 100 threshold
- ✅ Layer renders visibly despite having no color swatches

**Expected Result:** Layer Load test should **PASS** using visual change detection

---

### **2. Coastal and Marine Data (`coastal-and-marine-data.spec.ts`)**
**Problem:** Multiple small PNG icons, no extractable RGB colors

**What it tests:**
- ✅ Visual diff detection for multiple sublayers with PNG icons
- ✅ Each sublayer tested independently
- ✅ PNG icons render visibly despite having no color swatches

**Expected Result:** All sublayer Load tests should **PASS** using visual change detection

---

### **3. Fish Passage Barriers Assessment (`fish-passage-barriers-assessment.spec.ts`)**
**Problem:** Styled points (10px circle with border), no extractable RGB colors

**What it tests:**
- ✅ Visual diff detection for geometric shapes
- ✅ Styled points render visibly
- ✅ Legend HTML structure (rounded-full, inline styles)

**Expected Result:** Layer Load test should **PASS** using visual change detection

**Legend HTML Example:**
```html
<div class="rounded-full" style="width: 10px; height: 10px; 
     background-color: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 255, 255, 0.8);">
</div>
```

---

### **4. Dibblee Geology (`dibblee-geology.spec.ts`)**
**Problem:** Cryptic legend labels ("Tm", "Tma") - geological abbreviations

**What it tests:**
- ✅ Legend labels are accepted as-is
- ✅ No complex geological interpretation logic needed
- ✅ Test 7 (Legend Labels Descriptive) should PASS

**Decision:** Accept cryptic labels without implementing interpretation logic

**Manual QA Note:** Changed from "Some (See Notes)" to "Yes" in CSV

---

## 📊 Test Results Analysis

### **Before Hybrid Detection:**
| Layer | Layer Load Test | Detection Method | Result |
|-------|----------------|------------------|--------|
| Cattle Guards | ❌ FAIL | Color Detection | False Negative |
| Coastal & Marine | ❌ FAIL | Color Detection | False Negative |
| Fish Passage Barriers | ❌ FAIL | Color Detection | False Negative |

### **After Hybrid Detection:**
| Layer | Layer Load Test | Detection Method | Result |
|-------|----------------|------------------|--------|
| Cattle Guards | ✅ PASS | Visual Diff | True Positive |
| Coastal & Marine | ✅ PASS | Visual Diff | True Positive |
| Fish Passage Barriers | ✅ PASS | Visual Diff | True Positive |

---

## ⏱️ Test Timeouts

### **Dynamic Timeouts (`all-layers-dynamic.spec.ts`)**

The dynamic test suite automatically calculates timeout based on layer complexity:

**Formula:**
```
timeout = base_timeout + (estimated_sublayers × time_per_sublayer)
       = 60s + (sublayers × 5s)
       = capped at 240s (4 min) max
```

**Examples:**
| Layer | Type | Est. Sublayers | Timeout |
|-------|------|----------------|---------|
| Coastal & Marine | Feature Service | 20 | 160s |
| California Fire Perimeters | Feature Service | 10 | 110s |
| Groundwater Wells | Feature Service | 5 | 85s |
| Typical Feature Service | Feature Service | 3 | 75s |
| Image Service | Image Service | 1 | 65s |

**Logged in console:**
```
⏱️  Timeout: 160s (dynamic)
```

### **Manual Test Timeouts**

Manual tests use fixed extended timeouts:

| Test File | Timeout | Reason |
|-----------|---------|--------|
| `coastal-and-marine-data.spec.ts` | 120s | 20 sublayers! |
| `cattle-guards.spec.ts` | 60s | Single sublayer with visual diff |
| `fish-passage-barriers-assessment.spec.ts` | 60s | Single sublayer with visual diff |
| `dibblee-geology.spec.ts` | 60s | Standard multi-test suite |

**Why dynamic timeouts?**
- Visual diff detection: ~700-800ms per sublayer
- Color detection: ~100ms per sublayer
- Plus navigation, download, tooltip, legend tests
- **Prevents timeouts on complex multi-sublayer services**
- **Keeps tests fast for simple single-layer services**

---

## 🔍 How to Investigate Issues

### **View Test Video Recording:**
After running a test, Playwright saves videos to:
```
test-results/[test-name]/video.webm
```

### **View Screenshots:**
Failed tests automatically save screenshots:
```
test-results/[test-name]/test-failed-*.png
```

### **View Detailed Report:**
```bash
npm run test:e2e:report
```

### **Common Issues:**

#### **Timeout Errors**
```
Test timeout of 30000ms exceeded
```
**Solution:** Layer has too many sublayers. Increase timeout in test file:
```typescript
test.setTimeout(120000); // 2 minutes
```

---

## 📈 Next Steps

1. ✅ **DONE:** Implement hybrid layer detection (color detection + visual diff)
2. ✅ **DONE:** Fix False Negatives for icon/point layers
3. ⏳ **TODO:** Update tooltip test for icon/point layers
4. ⏳ **TODO:** Investigate remaining False Positives/Negatives

---

## 📚 Related Documentation

- [Main E2E README](../README.md) - Comprehensive guide covering hybrid detection, checkpoint system, and more
- [E2E Test Helpers](../helpers/tnc-arcgis-test-helpers.ts) - Source code for hybrid detection logic

---

## 🏁 Summary

These manual tests serve as **reference implementations** for:
1. Verifying hybrid detection behavior
2. Debugging specific problem layers
3. Validating expected vs. actual results
4. Demonstrating detection method selection logic

Run them when:
- Investigating test validation issues (TP/TN/FP/FN)
- Debugging hybrid detection logic
- Verifying changes to test helpers
- Understanding how specific layer types are tested

