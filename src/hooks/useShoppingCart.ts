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
    return cartItems.reduce((sum, item) => sum + (item.estimatedCount || 0), 0);
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

