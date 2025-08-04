'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GenericContentForm } from '@/components/content/GenericContentForm';
import { contentService } from '@/lib/supabase/content';
import { Content } from '@/types/content';
import { Spinner, Card, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;
  const contentId = params.id as string;
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load content first
        const contentData = await contentService.getContentById(contentId);
        setContent(contentData);
        
        // Then get all categories to find the matching one
        const categories = await contentService.getProprietaryProductCategories();
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );
        
        if (matchedCategory) {
          setCategoryName(matchedCategory.name);
        } else {
          setError('Category not found');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      loadData();
    }
  }, [contentId, categorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={() => router.push(`/admin/${categorySlug}`)}>
              Back to {categoryName}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!content || !categoryName) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Content not found</p>
            <Button onClick={() => router.push(`/admin/${categorySlug}`)}>
              Back to {categoryName || 'List'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <GenericContentForm 
      initialData={content} 
      categoryName={categoryName} 
      categoryId={content.category_id || ''} 
    />
  );
}