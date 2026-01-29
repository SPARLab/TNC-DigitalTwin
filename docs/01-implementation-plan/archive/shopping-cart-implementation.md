# Shopping Cart & Data Export Implementation Plan

**Focus**: iNaturalist, Dendra, CalFlora, eBird (excluding TNC ArcGIS for now)

**Key Principle**: Minimal disruption to existing test infrastructure

---

## Overview

Build a shopping cart system that allows users to save search queries/data selections and export them in multiple formats. This will be implemented in a way that **extends** existing components without requiring major refactors.

---

## Phase 1: Shopping Cart Infrastructure

### 1.1 Type Definitions

**File**: `src/types/index.ts`

Add the following interfaces:

```typescript
export interface CartItem {
  id: string;                    // unique ID (timestamp + source)
  dataSource: 'inaturalist' | 'dendra' | 'calflora' | 'ebird';
  title: string;                 // user-friendly description
  query: {
    // Spatial filters
    spatialFilter?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;      // GeoJSON string if custom
    
    // Time range
    timeRange?: string;           // e.g., "Last 30 days"
    startDate?: string;
    endDate?: string;
    
    // Data source-specific filters
    additionalFilters?: Record<string, any>;
  };
  itemCount: number;             // number of records in this query
  addedAt: number;               // timestamp when added
  previewData?: any[];           // first 5-10 records for preview
}

export interface ExportFormat {
  format: 'csv' | 'json' | 'geojson';
  filename: string;
  data: any[];
}
```

### 1.2 Shopping Cart Hook

**File**: `src/hooks/useShoppingCart.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { CartItem } from '../types';

const STORAGE_KEY = 'tnc-data-cart';
const MAX_CART_ITEMS = 50;

export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>) => {
    if (cartItems.length >= MAX_CART_ITEMS) {
      return { success: false, error: 'Cart is full (max 50 items)' };
    }

    const newItem: CartItem = {
      ...item,
      id: `${Date.now()}-${item.dataSource}`,
      addedAt: Date.now()
    };

    setCartItems(prev => [newItem, ...prev]);
    return { success: true, item: newItem };
  }, [cartItems.length]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartCount = useCallback(() => cartItems.length, [cartItems]);

  const getTotalRecordCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.itemCount, 0);
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount,
    getTotalRecordCount
  };
}
```

### 1.3 Shopping Cart UI Components

#### A. Cart Button (Floating)

**File**: `src/components/ShoppingCart/CartButton.tsx`

```typescript
import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export const CartButton: React.FC<CartButtonProps> = ({ itemCount, onClick }) => {
  return (
    <button
      id="shopping-cart-button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 active:scale-95"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span 
          id="cart-badge"
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};
```

#### B. Cart Panel (Slide-out)

**File**: `src/components/ShoppingCart/CartPanel.tsx`

```typescript
import React from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import { CartItemCard } from './CartItemCard';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onExport: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onExport
}) => {
  const totalRecords = cartItems.reduce((sum, item) => sum + item.itemCount, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          id="cart-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        id="cart-panel"
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div id="cart-header" className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Data Export Cart</h2>
            <button
              id="close-cart-button"
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'query' : 'queries'} • {totalRecords.toLocaleString()} total records
          </p>
        </div>

        {/* Cart Items */}
        <div id="cart-items-list" className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div id="empty-cart" className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">
                Add data searches to export later
              </p>
            </div>
          ) : (
            cartItems.map(item => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div id="cart-footer" className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <button
              id="export-all-button"
              onClick={onExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Export All Data
            </button>
            <button
              id="clear-cart-button"
              onClick={onClearCart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};
```

#### C. Cart Item Card

**File**: `src/components/ShoppingCart/CartItemCard.tsx`

```typescript
import React from 'react';
import { Trash2, Calendar, MapPin } from 'lucide-react';
import { CartItem } from '../../types';

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
}

const dataSourceIcons: Record<string, string> = {
  inaturalist: '🔍',
  dendra: '📡',
  calflora: '🌱',
  ebird: '🐦'
};

const dataSourceLabels: Record<string, string> = {
  inaturalist: 'iNaturalist',
  dendra: 'Dendra',
  calflora: 'CalFlora',
  ebird: 'eBird'
};

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onRemove }) => {
  return (
    <div
      id={`cart-item-${item.id}`}
      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{dataSourceIcons[item.dataSource]}</span>
            <span className="text-xs font-medium text-gray-600">
              {dataSourceLabels[item.dataSource]}
            </span>
          </div>
          <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
        </div>
        <button
          id={`remove-item-${item.id}`}
          onClick={onRemove}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Remove from cart"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        {item.query.timeRange && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{item.query.timeRange}</span>
          </div>
        )}
        {item.query.spatialFilter && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{item.query.spatialFilter === 'preserve-only' ? 'Dangermond Preserve' : 'Expanded Area'}</span>
          </div>
        )}
        <div className="font-medium text-blue-600">
          {item.itemCount.toLocaleString()} records
        </div>
      </div>
    </div>
  );
};
```

---

## Phase 2: "Add to Cart" Integration

### 2.1 iNaturalist (ObservationsSidebar)

**Update**: `src/components/ObservationsSidebar.tsx`

**Changes**:
1. Add new prop: `onAddToCart?: () => void`
2. Add button next to existing Export buttons (lines 254-275)

```typescript
// Add this button alongside Export CSV/GeoJSON
{onAddToCart && (
  <button
    id="observations-add-to-cart-btn"
    onClick={onAddToCart}
    className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
    title="Add current search to export cart"
  >
    <ShoppingCart className="w-3 h-3" />
    Add to Cart
  </button>
)}
```

**Parent Integration** (in `App.tsx`):
```typescript
const handleAddInatToCart = () => {
  const result = addToCart({
    dataSource: 'inaturalist',
    title: `iNaturalist: ${iNatObservations.length} observations`,
    query: {
      spatialFilter: currentInatFilters.searchMode,
      timeRange: currentInatFilters.timeRange,
      startDate: currentInatFilters.startDate,
      endDate: currentInatFilters.endDate,
      additionalFilters: {
        qualityGrade: currentInatFilters.qualityGrade,
        iconicTaxa: currentInatFilters.iconicTaxa
      }
    },
    itemCount: iNatObservations.length,
    previewData: iNatObservations.slice(0, 10)
  });

  if (result.success) {
    // Show toast notification
    showToast(`Added ${iNatObservations.length} observations to cart`);
  }
};
```

### 2.2 Dendra (DendraDetailsSidebar)

**Create**: `src/components/DendraDetailsSidebar.tsx` (if doesn't exist)

Or **Update existing details view** to add:

```typescript
<button
  id="dendra-add-to-cart-btn"
  onClick={onAddToCart}
  className="w-full mt-3 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center gap-2"
>
  <ShoppingCart className="w-4 h-4" />
  Add Datastream to Cart
</button>
```

### 2.3 CalFlora (CalFloraSidebar)

**Update**: `src/components/CalFloraSidebar.tsx`

Add button alongside existing export buttons (lines 190-207):

```typescript
{onAddToCart && (
  <button
    id="calflora-add-to-cart-btn"
    onClick={onAddToCart}
    className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
  >
    <ShoppingCart className="w-3 h-3" />
    Add to Cart
  </button>
)}
```

### 2.4 eBird (ObservationsSidebar - shared with iNaturalist)

Already handled by iNaturalist implementation above, but with eBird-specific handler in App.tsx.

---

## Phase 3: Export Functionality

### 3.1 Export Modal

**File**: `src/components/ShoppingCart/ExportModal.tsx`

```typescript
import React, { useState } from 'react';
import { Download, X, FileText, Braces, Map } from 'lucide-react';
import { CartItem } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cartItems
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'geojson'>('csv');
  const [exportMode, setExportMode] = useState<'combined' | 'separate'>('combined');

  const handleExport = () => {
    if (exportMode === 'combined') {
      exportCombined(selectedFormat);
    } else {
      exportSeparate(selectedFormat);
    }
  };

  const exportCombined = (format: string) => {
    // Combine all cart items into single file
    const allData = cartItems.flatMap(item => item.previewData || []);
    downloadFile(allData, format, `tnc-data-export-${Date.now()}`);
  };

  const exportSeparate = (format: string) => {
    // Create separate files for each data source
    cartItems.forEach((item, index) => {
      const filename = `${item.dataSource}-${Date.now()}-${index}`;
      downloadFile(item.previewData || [], format, filename);
    });
  };

  const downloadFile = (data: any[], format: string, filename: string) => {
    let content: string;
    let mimeType: string;
    
    switch (format) {
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'geojson':
        content = convertToGeoJSON(data);
        mimeType = 'application/geo+json';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs font-medium">CSV</span>
            </button>
            <button
              onClick={() => setSelectedFormat('json')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'json'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Braces className="w-5 h-5" />
              <span className="text-xs font-medium">JSON</span>
            </button>
            <button
              onClick={() => setSelectedFormat('geojson')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'geojson'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="text-xs font-medium">GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Export Mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={exportMode === 'combined'}
                onChange={() => setExportMode('combined')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Single combined file
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={exportMode === 'separate'}
                onChange={() => setExportMode('separate')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Separate files per data source
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3.2 Export Utilities

**File**: `src/utils/exportUtils.ts`

```typescript
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item =>
    headers.map(header => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

export function convertToGeoJSON(data: any[]): string {
  const features = data
    .filter(item => item.geometry && item.geometry.coordinates)
    .map(item => ({
      type: 'Feature',
      properties: { ...item, geometry: undefined },
      geometry: item.geometry
    }));

  return JSON.stringify({
    type: 'FeatureCollection',
    features
  }, null, 2);
}
```

---

## Phase 4: iNaturalist Icon Matching

### Problem
Map icons for iNaturalist observations should match the emoji icons used in the sidebar.

### Current Sidebar Icons (ObservationsSidebar.tsx, lines 154-171)
```typescript
'aves': '🐦',
'mammalia': '🦌',
'reptilia': '🦎',
'amphibia': '🐸',
'actinopterygii': '🐟',
'insecta': '🦋',
'arachnida': '🕷️',
'plantae': '🌱',
'mollusca': '🐚',
'animalia': '🐾',
'fungi': '🍄'
```

### Solution

**Update**: `src/components/MapView.tsx`

Find the section where iNaturalist observations are rendered as map graphics and change from generic SimpleMarkerSymbol to PictureMarkerSymbol using the same emoji/icon system.

**Implementation**:
```typescript
// Helper function to get emoji as data URI for map markers
function getEmojiDataUri(emoji: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 16, 16);
  }
  
  return canvas.toDataURL();
}

// When creating graphics for iNaturalist observations:
const iconicTaxon = obs.taxon?.iconic_taxon_name?.toLowerCase() || 'unknown';
const emojiIcon = getIconForTaxon(iconicTaxon); // reuse sidebar function

const symbol = new PictureMarkerSymbol({
  url: getEmojiDataUri(emojiIcon),
  width: '20px',
  height: '20px'
});
```

---

## Integration Summary

### App.tsx Updates

```typescript
import { useShoppingCart } from './hooks/useShoppingCart';
import { CartButton } from './components/ShoppingCart/CartButton';
import { CartPanel } from './components/ShoppingCart/CartPanel';
import { ExportModal } from './components/ShoppingCart/ExportModal';

function App() {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartCount
  } = useShoppingCart();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // ... existing state ...

  return (
    <div>
      {/* ... existing UI ... */}
      
      {/* Floating Cart Button */}
      <CartButton
        itemCount={getCartCount()}
        onClick={() => setIsCartOpen(true)}
      />
      
      {/* Cart Panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onClearCart={() => {
          if (confirm('Clear all items from cart?')) {
            clearCart();
          }
        }}
        onExport={() => {
          setIsExportModalOpen(true);
        }}
      />
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        cartItems={cartItems}
      />
    </div>
  );
}
```

---

## Testing Strategy

### Minimal Impact on Existing Tests

Since you're building a testing framework for iNaturalist:

1. **Shopping cart is additive** - it adds new buttons but doesn't modify existing data flow
2. **Existing tests remain valid** - all current iNaturalist functionality works identically
3. **New tests needed** (optional):
   - Test "Add to Cart" button appears when data is loaded
   - Test cart badge updates correctly
   - Test cart persistence across page reloads

### Example Test Addition

```typescript
// In ObservationsSidebar.test.tsx (if it exists)
it('shows Add to Cart button when onAddToCart prop is provided', () => {
  const mockAddToCart = vi.fn();
  render(
    <ObservationsSidebar
      observations={mockObservations}
      loading={false}
      hasSearched={true}
      onAddToCart={mockAddToCart}
    />
  );
  
  const addButton = screen.getByRole('button', { name: /add to cart/i });
  expect(addButton).toBeInTheDocument();
});
```

---

## Implementation Order

1. **Week 1**: Infrastructure
   - [ ] Create type definitions
   - [ ] Build useShoppingCart hook
   - [ ] Create CartButton, CartPanel, CartItemCard components
   - [ ] Test localStorage persistence

2. **Week 2**: Integration
   - [ ] Add "Add to Cart" to ObservationsSidebar (iNaturalist)
   - [ ] Add "Add to Cart" to CalFloraSidebar
   - [ ] Add "Add to Cart" to DendraSidebar
   - [ ] Wire up handlers in App.tsx

3. **Week 3**: Export & Polish
   - [ ] Build ExportModal component
   - [ ] Implement CSV/JSON/GeoJSON export
   - [ ] Add toast notifications
   - [ ] Fix iNaturalist map icon matching
   - [ ] User testing

---

## Notes

- **No breaking changes** to existing components
- **Props are optional** - components work with or without cart functionality
- **Storage is client-side** - no backend changes needed
- **Icons match** - iNaturalist map and sidebar will use same visual system
- **Testing framework safe** - all changes are additive

---

**Next Steps**: Review this plan and let me know if you'd like me to start implementing!

