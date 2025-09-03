'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import { 
  ArrowLeft, FileText, Download, Clock, Calendar, 
  BookOpen, Eye, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface ContentData {
  id: string;
  title: string;
  description?: string;
  content?: string;
  file_url?: string;
  content_type?: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  categories?: {
    id: string;
    name: string;
    description?: string;
  };
  purchase?: {
    purchased_at: string;
    is_active: boolean;
    access_type: string;
  };
}

export default function ContentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchContent();
    }
  }, [user, id]);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/account/library/content/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Content not found');
        } else if (response.status === 403) {
          setError('You do not have access to this content');
        } else {
          throw new Error('Failed to fetch content');
        }
        return;
      }

      const data = await response.json();
      setContent(data);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/account/library">
              <Button variant="primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Not Found</h2>
            <p className="text-gray-600 mb-4">This content could not be found.</p>
            <Link href="/account/library">
              <Button variant="primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/account/library">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        
        {content.file_url && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(content.file_url, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      {/* Content Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {content.title}
            </h1>
            
            {content.description && (
              <p className="text-gray-600 mb-4">{content.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {content.categories && (
                <Badge variant="secondary">
                  {content.categories.name}
                </Badge>
              )}
              
              {content.purchase && (
                <>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Purchased {formatDate(content.purchase.purchased_at)}</span>
                  </div>
                  
                  {content.purchase.access_type && (
                    <Badge variant="success" size="sm">
                      {content.purchase.access_type === 'lifetime' ? 'Lifetime Access' : 'Active'}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
          
          {content.thumbnail_url && (
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-24 h-24 object-cover rounded-lg ml-4"
            />
          )}
        </div>
      </Card>

      {/* Main Content */}
      <Card className="p-6">
        <div className="prose prose-lg max-w-none">
          {content.content ? (
            <RichTextDisplay content={content.content} />
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No content available</p>
              {content.file_url && (
                <p className="text-sm text-gray-400 mt-2">
                  You can download the file using the download button above.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link href="/account/library">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        
        {content.file_url && (
          <Button
            variant="primary"
            onClick={() => window.open(content.file_url, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Original File
          </Button>
        )}
      </div>
    </div>
  );
}