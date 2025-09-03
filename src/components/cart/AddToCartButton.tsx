'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Plus, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AddToCartButtonProps {
  item: {
    id: string;
    type: 'course' | 'book' | 'content';
    title: string;
    price: number;
    currency?: string;
    thumbnail_url?: string;
    slug?: string;
  };
  quantity?: number;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AddToCartButton({
  item,
  quantity = 1,
  variant = 'primary',
  size = 'md',
  className = ''
}: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addToCart, items, loading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if item is already in cart
  const isInCart = items.some(cartItem => 
    cartItem.item_type === item.type && cartItem.item_id === item.id
  );

  const handleAddToCart = async () => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsAdding(true);
    
    try {
      await addToCart({
        item_type: item.type,
        item_id: item.id,
        title: item.title,
        price: item.price,
        thumbnail_url: item.thumbnail_url,
        slug: item.slug
      }, quantity);

      // Show success state briefly
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const getVariantClasses = () => {
    if (variant === 'icon') {
      return 'p-2 rounded-full';
    }
    
    switch (variant) {
      case 'secondary':
        return 'bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-300';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  // If item is free, show different button
  if (item.price === 0) {
    return (
      <Link href={`/${item.type === 'content' ? 'store' : item.type === 'course' ? 'courses' : 'library'}/${item.slug || item.id}`}>
        <Button
          className={`${getSizeClasses()} ${getVariantClasses()} transition-colors ${className}`}
        >
          <span>Access Free</span>
        </Button>
      </Link>
    );
  }

  if (!user) {
    return (
      <Link href={`/login?return=${encodeURIComponent(window.location.pathname)}`}>
        <Button
          className={`${getSizeClasses()} ${getVariantClasses()} transition-colors ${className}`}
        >
          {variant === 'icon' ? (
            <ShoppingCart className="h-4 w-4" />
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </Link>
    );
  }

  if (isInCart) {
    return (
      <Link href="/cart">
        <Button
          className={`${getSizeClasses()} bg-green-600 text-white hover:bg-green-700 transition-colors ${className}`}
        >
          {variant === 'icon' ? (
            <Check className="h-4 w-4" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              In Cart
            </>
          )}
        </Button>
      </Link>
    );
  }

  if (justAdded) {
    return (
      <Button
        className={`${getSizeClasses()} bg-green-600 text-white transition-colors ${className}`}
        disabled
      >
        {variant === 'icon' ? (
          <Check className="h-4 w-4" />
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Added!
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || loading}
      className={`${getSizeClasses()} ${getVariantClasses()} transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isAdding ? (
        variant === 'icon' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        )
      ) : (
        variant === 'icon' ? (
          <Plus className="h-4 w-4" />
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </>
        )
      )}
    </Button>
  );
}