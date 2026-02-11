// ============================================================================
// V2Header — Minimal header with TNC branding + shopping cart + v1 toggle
// ============================================================================

import { ShoppingCart } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
// NOTE: useBookmarks removed — Saved Items widget merged into Map Layers (Feb 11 decision)

export function V2Header() {
  const { pinnedLayers } = useLayers();
  const cartCount = pinnedLayers.length;

  const switchToV1 = () => {
    window.location.search = '';
  };

  return (
    <header
      id="v2-header"
      className="h-12 flex items-center justify-between px-4
                 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600
                 border-b border-emerald-900/20 flex-shrink-0"
    >
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">
          Dangermond Preserve Data Catalog
        </h1>
        <span className="text-[10px] font-medium text-emerald-100 bg-white/15 border border-white/25 px-1.5 py-0.5 rounded">
          v2.0
        </span>
      </div>

      {/* Right: cart + version toggle */}
      <div className="flex items-center gap-3">
        {/* Shopping cart (DFT-002) */}
        <button
          id="export-cart-button"
          className="relative p-2 rounded-md hover:bg-white/10 transition-colors"
          title={`Export cart: ${cartCount} items`}
          aria-label={`Export cart with ${cartCount} items`}
        >
          <ShoppingCart className="w-5 h-5 text-amber-300" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-gray-900 text-[9px] font-bold
                             rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {/* V1 toggle */}
        <button
          onClick={switchToV1}
          className="text-xs text-emerald-200 hover:text-white transition-colors"
        >
          Switch to v1
        </button>
      </div>
    </header>
  );
}
