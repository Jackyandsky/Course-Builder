'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Content } from '@/types/content';
import { contentService } from '@/lib/supabase/content';
import { Button, Card, Badge, Spinner, RichTextDisplay } from '@/components/ui';
import { ArrowLeft, Edit, BookOpen, Calendar, User, Package } from 'lucide-react';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;
  const contentId = params.id as string;
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Load content
      const contentData = await contentService.getContentById(contentId);
      setContent(contentData);
      
      // Get all categories to find the matching one
      const categories = await contentService.getProprietaryProductCategories();
      const matchedCategory = categories.find(
        cat => cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
      );
      
      if (matchedCategory) {
        setCategoryName(matchedCategory.name);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [contentId, categorySlug]);

  useEffect(() => {
    if (contentId) {
      loadData();
    }
  }, [contentId, loadData]);

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

  if (!content) {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{content.name}</h1>
          <p className="text-gray-600 mt-2">{categoryName} Details</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/${categorySlug}/${content.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/${categorySlug}`)}
          >
            Back to List
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{content.category?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(content.created_at).toLocaleDateString()}</span>
              </div>
              {content.book && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{content.book.title}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {content.is_public && (
                <Badge variant="success">Public</Badge>
              )}
              {content.featured && (
                <Badge variant="primary">Featured</Badge>
              )}
              <Badge variant="outline">{content.status || 'Active'}</Badge>
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>

            {content.content && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Content</h3>
                <div className="prose max-w-none">
                  <RichTextDisplay content={content.content} />
                </div>
              </div>
            )}

            {/* Generic content data fields */}
            {content.content_data?.usage_instructions && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
                <div className="prose max-w-none">
                  <RichTextDisplay content={content.content_data.usage_instructions} />
                </div>
              </div>
            )}

            {content.content_data?.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <div className="prose max-w-none">
                  <RichTextDisplay content={content.content_data.notes} />
                </div>
              </div>
            )}

            {content.content_data?.price && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Price</h3>
                <p>{content.content_data.price}</p>
              </div>
            )}

            {content.content_data?.duration && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Duration</h3>
                <p>{content.content_data.duration}</p>
              </div>
            )}

            {content.content_data?.level && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Level</h3>
                <Badge variant="outline">{content.content_data.level}</Badge>
              </div>
            )}

            {/* Display multiple books */}
            {(content.content_books && content.content_books.length > 0) ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Associated Books</h3>
                <div className="space-y-3">
                  {content.content_books
                    .sort((a, b) => a.position - b.position)
                    .map((contentBook) => (
                      <Card key={contentBook.id} className="p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {contentBook.is_primary && (
                                <span className="text-blue-600 text-sm mr-2">[Primary]</span>
                              )}
                              {contentBook.book?.title}
                            </h4>
                            {contentBook.book?.author && (
                              <p className="text-sm text-gray-600">by {contentBook.book.author}</p>
                            )}
                            {contentBook.book?.description && (
                              <p className="text-sm text-gray-500 mt-2">{contentBook.book.description}</p>
                            )}
                            {contentBook.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">{contentBook.notes}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ) : content.book ? (
              // Fallback for legacy single book association
              <div>
                <h3 className="text-lg font-semibold mb-2">Associated Book</h3>
                <Card className="p-4 bg-gray-50">
                  <h4 className="font-medium">{content.book.title}</h4>
                  {content.book.author && (
                    <p className="text-sm text-gray-600">by {content.book.author}</p>
                  )}
                  {content.book.description && (
                    <p className="text-sm text-gray-500 mt-2">{content.book.description}</p>
                  )}
                </Card>
              </div>
            ) : null}

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                <p>Created: {new Date(content.created_at).toLocaleString()}</p>
                {content.updated_at && (
                  <p>Last updated: {new Date(content.updated_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}