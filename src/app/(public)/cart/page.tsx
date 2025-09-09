'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

// Optimized CartItem with local state for instant UI updates
const CartItem = memo(function CartItem({ 
  item: initialItem, 
  onQuantityChange, 
  onRemove 
}: {
  item: any;
  onQuantityChange: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [item, setItem] = useState(initialItem);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when prop changes (from server)
  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  const formatPrice = useCallback((price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }, []);

  const getItemUrl = useCallback((item: any) => {
    if (item.slug) {
      return `/${item.item_type === 'content' ? 'store' : item.item_type === 'course' ? 'courses' : 'library'}/${item.slug}`;
    }
    return `/${item.item_type === 'content' ? 'store' : item.item_type === 'course' ? 'courses' : 'library'}/${item.item_id}`;
  }, []);

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Optimistic update - instantly update UI
    setItem((prev: any) => ({ ...prev, quantity: newQuantity }));
    setIsUpdating(true);

    try {
      // Background server sync
      await onQuantityChange(item.id, newQuantity);
    } catch (error) {
      // Revert on error
      setItem((prev: any) => ({ ...prev, quantity: item.quantity }));
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [item.id, item.quantity, onQuantityChange]);

  const handleRemove = useCallback(async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsUpdating(false);
    }
  }, [item.id, onRemove]);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <Link href={getItemUrl(item)} className="group block">
            <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {item.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {item.item_type === 'content' ? 'Complete Study Package' : item.item_type === 'book' ? 'Book' : 'Course'}
          </p>
        </div>

        {/* Simple Quantity Display & Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          
          <span className="w-8 text-center font-medium text-sm text-gray-700">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating}
            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Item Total & Remove */}
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-900 min-w-[4rem] text-right">
            {formatPrice(item.price * item.quantity, item.currency)}
          </span>
          
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="w-7 h-7 rounded-md text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default function CartPage() {
  const { user } = useAuth();
  const { items, loading, totalItems, totalAmount, updateCartItem, removeFromCart } = useCart();

  const handleQuantityChange = useCallback(async (itemId: string, newQuantity: number) => {
    await updateCartItem(itemId, newQuantity);
  }, [updateCartItem]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    await removeFromCart(itemId);
  }, [removeFromCart]);

  const formatPrice = useCallback((price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600 mb-8">Please sign in to view your cart.</p>
            <Link href="/login">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 font-medium text-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading cart...</span>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Discover our courses, books, and educational content.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/courses">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-200 font-medium text-sm">
                  Browse Courses
                </button>
              </Link>
              <Link href="/store">
                <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 transition-all duration-200 font-medium text-sm">
                  Browse Store
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-6 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Items ({items.length})</span>
                    <span>{formatPrice(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link href="/checkout" className="w-full">
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-all duration-200 font-medium text-sm">
                      Checkout
                    </button>
                  </Link>
                  
                  <Link href="/store" className="w-full">
                    <button className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition-all duration-200 font-medium text-sm">
                      Continue Shopping
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}