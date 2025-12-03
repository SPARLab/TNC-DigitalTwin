import React from 'react';
import { X, Download, Trash2, ShoppingCart } from 'lucide-react';
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
  const totalRecords = cartItems.reduce((sum, item) => sum + (item.estimatedCount || 0), 0);

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
              title="Close cart"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'query' : 'queries'} • {totalRecords.toLocaleString()} total records
          </p>
        </div>

        {/* Cart Items */}
        <div id="cart-items-list" className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 200px)' }}>
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
          <div id="cart-footer" className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50 space-y-2">
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

