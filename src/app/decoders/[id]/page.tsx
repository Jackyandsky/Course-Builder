'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Decoder, decoderService } from '@/lib/supabase/decoders';
import { Button, Card, Badge, Spinner, RichTextDisplay, RichTextTruncate } from '@/components/ui';
import { ArrowLeft, Edit, Key, BookOpen, Calendar, User } from 'lucide-react';

export default function DecoderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const decoderId = params.id as string;
  const [decoder, setDecoder] = useState<Decoder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecoder = useCallback(async () => {
    try {
      const data = await decoderService.getDecoder(decoderId);
      setDecoder(data);
    } catch (error) {
      console.error('Failed to load decoder:', error);
      setError('Failed to load decoder');
    } finally {
      setLoading(false);
    }
  }, [decoderId]);

  useEffect(() => {
    if (decoderId) {
      loadDecoder();
    }
  }, [decoderId, loadDecoder]);

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Decoder
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!decoder) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Decoder Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The decoder you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="mb-4"
            >
              Back
            </Button>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {decoder.name}
                  </h1>
                  {decoder.is_public && (
                    <Badge variant="outline" size="lg">
                      Public
                    </Badge>
                  )}
                </div>
                {decoder.description && (
                  <RichTextTruncate
                    content={decoder.description}
                    maxLength={200}
                    maxLines={2}
                    className="mt-2 text-lg"
                    showReadMore={false}
                  />
                )}
              </div>
              <Button
                onClick={() => router.push(`/decoders/${decoder.id}/edit`)}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Decoder Description/Content */}
              {decoder.description && (
                <Card>
                  <Card.Header>
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Decoder Content</h2>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <RichTextDisplay
                      content={decoder.description}
                      size="md"
                    />
                  </Card.Content>
                </Card>
              )}

              {/* Bottom Section - Book and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Associated Book */}
                {decoder.book && (
                  <Card>
                    <Card.Header>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Associated Book</h2>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{decoder.book.title}</h3>
                          {decoder.book.author && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              by {decoder.book.author}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {decoder.book.content_type && (
                              <Badge variant="outline" className="text-xs">
                                {decoder.book.content_type}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/books/${decoder.book?.id}`)}
                          >
                            View Book
                          </Button>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Details */}
                <Card>
                  <Card.Header>
                    <h2 className="text-lg font-semibold">Details</h2>
                  </Card.Header>
                  <Card.Content className="space-y-4">
                    {decoder.category_data && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-4 w-4 rounded" 
                          style={{ backgroundColor: decoder.category_data.color || '#6b7280' }}
                        />
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">{decoder.category_data.name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded bg-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Visibility</p>
                        <p className="font-medium">{decoder.is_public ? 'Public' : 'Private'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium">
                          {new Date(decoder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Updated</p>
                        <p className="font-medium">
                          {new Date(decoder.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              {/* Tags */}
              {decoder.tags && decoder.tags.length > 0 && (
                <Card>
                  <Card.Header>
                    <h2 className="text-lg font-semibold">Tags</h2>
                  </Card.Header>
                  <Card.Content>
                    <div className="flex flex-wrap gap-2">
                      {decoder.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Card.Content>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}