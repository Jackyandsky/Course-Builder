'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Cart item interface
export interface CartItem {
  id: string;
  item_type: 'course' | 'book' | 'content';
  item_id: string;
  title: string;
  price: number;
  quantity: number;
  thumbnail_url?: string;
  slug?: string;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalAmount: number;
}

// Cart actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

// Initial state
const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  totalItems: 0,
  totalAmount: 0,
};

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CART_ITEMS':
      const items = action.payload;
      return {
        ...state,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        error: null,
      };
    
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.item_type === action.payload.item_type && item.item_id === action.payload.item_id
      );
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      return {
        ...state,
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        error: null,
      };
    
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0); // Remove items with 0 quantity
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      
      return {
        ...state,
        items: filteredItems,
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
    
    default:
      return state;
  }
}

// Cart context interface
interface CartContextType extends CartState {
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => Promise<void>;
  updateCartItem: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart when user changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user]);

  // Refresh cart from server
  const refreshCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/cart');
      
      if (response.ok) {
        const cartItems = await response.json();
        dispatch({ type: 'SET_CART_ITEMS', payload: cartItems });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Add item to cart
  const addToCart = async (item: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Please sign in to add items to cart' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: item.item_type,
          item_id: item.item_id,
          quantity,
        }),
      });

      if (response.ok) {
        // Refresh the entire cart to get accurate data with product details
        await refreshCart();
        dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous errors
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.error || 'Failed to add item to cart' });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update cart item quantity
  const updateCartItem = async (id: string, quantity: number) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (quantity <= 0) {
        await removeFromCart(id);
        return;
      }

      const response = await fetch(`/api/cart/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity } });
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.error || 'Failed to update cart item' });
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Remove item from cart
  const removeFromCart = async (id: string) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.error || 'Failed to remove item from cart' });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch({ type: 'CLEAR_CART' });
      } else {
        const error = await response.json();
        dispatch({ type: 'SET_ERROR', payload: error.error || 'Failed to clear cart' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}