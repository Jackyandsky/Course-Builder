'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import ProductDetail from '@/components/products/ProductDetail';

export default function StoreProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSingletonSupabaseClient();

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          category:categories!category_id(
            id,
            name,
            type
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Define features based on product category
  let features: string[] = [];
  const categoryName = product.category?.name || product.category;
  switch (categoryName) {
    case 'Decoders':
      features = [
        'Comprehensive vocabulary analysis',
        'Context-based learning approach',
        'Progressive difficulty levels',
        'Practice exercises included'
      ];
      break;
    case 'Complete Study Packages':
      features = [
        'Full curriculum coverage',
        'Multiple learning resources',
        'Assessment materials included',
        'Teacher guides available',
        'Progress tracking tools'
      ];
      break;
    case 'Standardizers':
      features = [
        'Aligned with standard curricula',
        'Grade-specific content',
        'Regular updates included',
        'Practice tests available'
      ];
      break;
    case 'LEX':
      features = [
        'Advanced vocabulary builder',
        'Etymology and word roots',
        'Usage examples',
        'Memory techniques included'
      ];
      break;
  }

  return (
    <ProductDetail
      id={product.id}
      title={product.name}
      author={product.metadata?.author || 'IGPS'}
      description={product.content?.substring(0, 300) + '...' || ''}
      longDescription={product.content}
      price={product.price}
      imageUrl={product.metadata?.image_url}
      category={categoryName}
      type="store"
      publisher="GRAMMATICOS PLATFORM SOLUTION"
      publishDate={new Date(product.created_at).toLocaleDateString()}
      language="English"
      features={features}
      rating={4.5}
      reviewCount={Math.floor(Math.random() * 50) + 10}
    />
  );
}