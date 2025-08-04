'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GenericContentList } from '@/components/content/GenericContentList';
import { contentService } from '@/lib/supabase/content';
import { ProprietaryProductCategory } from '@/types/content';
import { Spinner } from '@/components/ui';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        // Get all proprietary categories
        const categories = await contentService.getProprietaryProductCategories();
        
        // Find the category that matches the slug
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );
        
        if (matchedCategory) {
          setCategoryName(matchedCategory.name);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !categoryName) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <p className="text-gray-600 mt-2">The requested category does not exist.</p>
      </div>
    );
  }

  return <GenericContentList categoryName={categoryName} />;
}