'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { user } = useAuth();
  const { items, totalItems, totalAmount, removeFromCart } = useCart();
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const formatPrice = (price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getItemUrl = (item: any) => {
    if (item.slug) {
      return `/${item.item_type === 'content' ? 'store' : item.item_type === 'course' ? 'courses' : 'library'}/${item.slug}`;
    }
    return `/${item.item_type === 'content' ? 'store' : item.item_type === 'course' ? 'courses' : 'library'}/${item.item_id}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Cart Panel */}
      <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)]">
        <div
          ref={cartRef}
          className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({totalItems})
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!user ? (
            <div className="p-6 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">Sign in to view your cart</p>
              <Link href="/login" onClick={onClose}>
                <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Link href="/courses" onClick={onClose}>
                <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={getItemUrl(item)}
                          onClick={onClose}
                          className="block"
                        >
                          <h4 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                            {item.title}
                          </h4>
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 capitalize">
                            {item.item_type} × {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity, item.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                        title="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {items.length > 5 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">
                        +{items.length - 5} more items
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link href="/cart" onClick={onClose} className="block">
                    <Button className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300 py-2 rounded-lg">
                      View Cart
                    </Button>
                  </Link>
                  <Link href="/checkout" onClick={onClose} className="block">
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-lg">
                      Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}