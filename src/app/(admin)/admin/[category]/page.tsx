'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ContentPageSkeleton } from '@/components/ui/ContentSkeleton';
import { categoryCache } from '@/lib/cache/category-cache';

// Lazy load the heavy component
const GenericContentList = lazy(() => 
  import('@/components/content/GenericContentList').then(mod => ({
    default: mod.GenericContentList
  }))
);

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        // Try cache first
        let rootCategories = categoryCache.get<any[]>('content-categories');
        let allCats: any[] = [];
        
        if (rootCategories) {
          // Use cached data
          allCats = [...rootCategories];
          
          // Get cached subcategories
          for (const rootCat of rootCategories) {
            const cached = categoryCache.get<any[]>(`subcategories-${rootCat.id}`);
            if (cached) {
              allCats.push(...cached);
            }
          }
        } else {
          // Fetch fresh data
          const response = await fetch('/api/categories?type=content');
          rootCategories = await response.json();
          
          if (!response.ok) {
            throw new Error('Failed to fetch categories');
          }
          
          categoryCache.set('content-categories', rootCategories);
          
          // Fetch all subcategories in parallel
          allCats = rootCategories ? [...rootCategories] : [];
          const subCategoryPromises = rootCategories ? rootCategories.map(async (rootCat) => {
            try {
              const subResponse = await fetch(`/api/categories?parent_id=${rootCat.id}`);
              if (subResponse.ok) {
                const subData = await subResponse.json();
                categoryCache.set(`subcategories-${rootCat.id}`, subData);
                return subData;
              }
            } catch (e) {
              console.warn('Failed to fetch subcategories for', rootCat.name);
            }
            return [];
          }) : [];
          
          const subCategoryArrays = await Promise.all(subCategoryPromises);
          subCategoryArrays.forEach(subCats => {
            if (subCats) allCats.push(...subCats);
          });
        }
        
        const categories = allCats;
        
        // First try exact slug matching
        let matchedCategory = categories.find(
          (cat: any) => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );
        
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
          if (expectedCategoryName) {
            matchedCategory = categories.find((cat: any) => 
              cat.name.toLowerCase() === expectedCategoryName.toLowerCase()
            );
          }
        }
        
        if (matchedCategory) {
          setCategoryName(matchedCategory.name);
          setCategoryId(matchedCategory.id);
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
    return <ContentPageSkeleton />;
  }

  if (error || !categoryName) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <p className="text-gray-600 mt-2">The requested category does not exist.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<ContentPageSkeleton />}>
      <GenericContentList categoryName={categoryName} categoryId={categoryId || undefined} />
    </Suspense>
  );
}