// ============================================================================
// V2Header — Minimal header with TNC branding + shopping cart + v1 toggle
// ============================================================================

import { ShoppingCart } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import { useBookmarks } from '../../context/BookmarkContext';

export function V2Header() {
  const { pinnedLayers } = useLayers();
  const { totalCount: bookmarkCount } = useBookmarks();
  const cartCount = pinnedLayers.length + bookmarkCount;

  const switchToV1 = () => {
    window.location.search = '';
  };

  return (
    <header
      id="v2-header"
      className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0"
    >
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-gray-900">
          Dangermond Preserve Data Catalog
        </h1>
        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
          v2.0
        </span>
      </div>

      {/* Right: cart + version toggle */}
      <div className="flex items-center gap-3">
        {/* Shopping cart (DFT-002) */}
        <button
          id="export-cart-button"
          className="relative p-2 rounded-md hover:bg-amber-50 transition-colors"
          title={`Export cart: ${cartCount} items`}
          aria-label={`Export cart with ${cartCount} items`}
        >
          <ShoppingCart className="w-5 h-5 text-amber-600" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold
                             rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {/* V1 toggle */}
        <button
          onClick={switchToV1}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Switch to v1
        </button>
      </div>
    </header>
  );
}
