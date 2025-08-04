'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GenericContentForm } from '@/components/content/GenericContentForm';
import { contentService } from '@/lib/supabase/content';
import { ProprietaryProductCategory } from '@/types/content';
import { Spinner } from '@/components/ui';

export default function NewContentPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [category, setCategory] = useState<ProprietaryProductCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        // Get all proprietary categories
        const categories = await contentService.getProprietaryProductCategories();
        
        // Find the category that matches the slug
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );
        
        setCategory(matchedCategory || null);
      } catch (error) {
        console.error('Failed to load category:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <p className="text-gray-600 mt-2">The requested category does not exist.</p>
      </div>
    );
  }

  return <GenericContentForm categoryName={category.name} categoryId={category.id} />;
}