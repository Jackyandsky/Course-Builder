'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const supabase = createClientComponentClient();
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
      // Base query for store products with category join
      let query = supabase
        .from('content')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            type
          )
        `);

      // Filter by store content categories
      const storeCategories = ['Decoders', 'Complete Study Packages', 'Standardizers', 'LEX'];
      
      // If a category is specified in URL, filter by that specific category
      if (categoryParam) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryParam)
          .single();
          
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      } else {
        // Otherwise, load all store product categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id')
          .in('name', storeCategories);
          
        if (categoriesData && categoriesData.length > 0) {
          const categoryIds = categoriesData.map(cat => cat.id);
          query = query.in('category_id', categoryIds);
        }
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      // Transform content data to match ProductListing format
      const transformedProducts = data?.map(product => ({
        id: product.id,
        title: product.name,
        author: product.metadata?.author || 'IGPS Education',
        description: product.content?.substring(0, 200) + '...' || '',
        price: product.metadata?.price || 29.99, // Default price if not set
        imageUrl: product.metadata?.image_url || undefined,
        category: product.category?.name || 'Uncategorized',
        type: 'store'
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
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