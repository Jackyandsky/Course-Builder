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
        
        // Then get all categories to find the matching one (including subcategories)
        const response = await fetch('/api/categories?type=content');
        const rootCategories = await response.json();
        
        // Manually fetch subcategories for each root category
        console.log('Debug - Fetching subcategories manually for', rootCategories.length, 'root categories');
        const allCats = [...rootCategories];
        for (const rootCat of rootCategories) {
          try {
            console.log('Debug - Fetching subcategories for', rootCat.name, 'ID:', rootCat.id);
            const subResponse = await fetch(`/api/categories?parent_id=${rootCat.id}`);
            if (subResponse.ok) {
              const subCategories = await subResponse.json();
              console.log('Debug - Found', subCategories.length, 'subcategories for', rootCat.name, ':', subCategories.map((s: any) => s.name));
              allCats.push(...subCategories);
            } else {
              console.log('Debug - Failed to fetch subcategories for', rootCat.name, 'Status:', subResponse.status);
            }
          } catch (e) {
            console.warn('Failed to fetch subcategories for', rootCat.name, e);
          }
        }
        console.log('Debug - Total categories after fetching subcategories:', allCats.length);
        const categories = allCats;
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        console.log('Debug - categorySlug:', categorySlug);
        console.log('Debug - categories found:', categories.length);
        categories.forEach((cat: any) => {
          const convertedSlug = cat.name.toLowerCase().replace(/\s+/g, '-');
          console.log(`Debug - "${cat.name}" -> "${convertedSlug}" (match: ${convertedSlug === categorySlug})`);
        });
        
        // First try exact slug matching
        let matchedCategory = categories.find(
          (cat: any) => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );
        
        console.log('Debug - exact match result:', matchedCategory?.name || 'NOT FOUND');
        
        // If no exact match, try flexible matching like the header does
        if (!matchedCategory) {
          // Map of common URL slugs to category name patterns
          const slugToCategoryMap: { [key: string]: string } = {
            'standardizers': 'Standardizers',
            'complete-study-packages': 'Complete Study Packages',
            'decoders': 'Decoders',
            'lex': 'LEX'
          };
          
          const expectedCategoryName = slugToCategoryMap[categorySlug];
          console.log('Debug - expected category name:', expectedCategoryName);
          
          if (expectedCategoryName) {
            matchedCategory = categories.find((cat: any) => 
              cat.name.toLowerCase() === expectedCategoryName.toLowerCase()
            );
            console.log('Debug - flexible match result:', matchedCategory?.name || 'NOT FOUND');
          }
        }
        
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