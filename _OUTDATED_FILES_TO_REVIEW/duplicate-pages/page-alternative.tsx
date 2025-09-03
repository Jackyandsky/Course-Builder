'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductListing from '@/components/products/ProductListing';

interface TransformedProduct {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  imageUrl: string | undefined;
  category: string;
  type: string;
}

export default function StorePage() {
  const [products, setProducts] = useState<TransformedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    loadProducts();
  }, [categoryParam]);

  // Reset products when loading
  useEffect(() => {
    setLoading(true);
  }, [categoryParam]);

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryParam) {
        params.append('category', categoryParam);
      }
      
      const response = await fetch(`/api/store/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Decoders', 'Complete Study Packages', 'Standardizers', 'LEX'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProductListing
      products={products}
      type="store"
      title="Store"
      subtitle="Premium educational materials and study resources"
      categories={categories}
      initialCategory={categoryParam || undefined}
    />
  );
}