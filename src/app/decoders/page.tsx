'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Search, Globe, Shield, BookOpen } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, Badge, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Decoder, decoderService } from '@/lib/supabase/decoders';

export default function DecodersPage() {
  const router = useRouter();
  const [decoders, setDecoders] = useState<Decoder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDecoders();
  }, []);

  const loadDecoders = async () => {
    try {
      const data = await decoderService.getDecoders();
      setDecoders(data);
    } catch (error) {
      console.error('Failed to load decoders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecoders = decoders.filter(decoder =>
    decoder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (decoder.description && decoder.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Content Decoders
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Analyze and decode educational content patterns and complexity
              </p>
            </div>
            <Button
              onClick={() => router.push('/decoders/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New Decoder
            </Button>
          </div>

          {/* Search */}
          <Card>
            <Card.Content className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search decoders..."
                  className="pl-10"
                />
              </div>
            </Card.Content>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{decoders.length}</p>
                    <p className="text-sm text-gray-600">Total Decoders</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Globe className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {decoders.filter(decoder => decoder.is_public).length}
                    </p>
                    <p className="text-sm text-gray-600">Public</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {decoders.filter(decoder => !decoder.is_public).length}
                    </p>
                    <p className="text-sm text-gray-600">Private</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card>
              <Card.Content className="p-4">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(decoders.map(d => d.category_data?.name).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Decoders Grid */}
          {filteredDecoders.length === 0 ? (
            <Card>
              <Card.Content className="p-12 text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No decoders found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery ? 
                    'Try adjusting your search terms.' : 
                    'Get started by creating your first content decoder.'
                  }
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => router.push('/decoders/new')}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create First Decoder
                  </Button>
                )}
              </Card.Content>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecoders.map((decoder) => (
                <Card key={decoder.id} className="hover:shadow-md transition-shadow">
                  <Card.Content className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {decoder.name}
                          </h3>
                          {decoder.is_public && (
                            <Badge variant="outline" size="sm">
                              Public
                            </Badge>
                          )}
                        </div>
                        {decoder.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {decoder.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {decoder.category_data && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: decoder.category_data.color || '#6b7280' }}
                          />
                          <span>{decoder.category_data.name}</span>
                        </div>
                      )}
                      
                      {decoder.book && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <BookOpen className="h-4 w-4 mr-2" />
                          <span className="truncate">
                            {decoder.book.title}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Created {new Date(decoder.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/decoders/${decoder.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/decoders/${decoder.id}/edit`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}