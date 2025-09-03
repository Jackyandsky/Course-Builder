'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, BookOpen, Calendar, 
  Eye, Loader2, AlertCircle, FileText
} from 'lucide-react';
import Link from 'next/link';

interface BookData {
  id: string;
  title: string;
  description?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  published_date?: string;
  cover_image_url?: string;
  file_url?: string;
  content_type?: string;
  pages?: number;
  language?: string;
  created_at?: string;
  updated_at?: string;
  purchase?: {
    purchased_at: string;
    is_active: boolean;
    access_type: string;
    purchase_price?: number;
  };
}

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchBook();
    }
  }, [user, id]);

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/account/library/book/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Book not found');
        } else if (response.status === 403) {
          setError('You do not have access to this book');
        } else {
          throw new Error('Failed to fetch book');
        }
        return;
      }

      const data = await response.json();
      setBook(data);
    } catch (err) {
      console.error('Error fetching book:', err);
      setError('Failed to load book');
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

  const handleViewBook = () => {
    if (book?.file_url) {
      // Always open in modal viewer
      setPdfViewerOpen(true);
    }
  };

  // Prevent print keyboard shortcut when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pdfViewerOpen) {
        // Prevent Ctrl+P (print) and Ctrl+S (save)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    if (pdfViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Disable right-click context menu when modal is open
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [pdfViewerOpen]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading book...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-4">This book could not be found.</p>
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/account/library">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
      </div>

      {/* Book Details */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-48 h-64 object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-48 h-64 bg-gray-100 rounded-lg shadow-md flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {book.title}
            </h1>
            
            {book.author && (
              <p className="text-lg text-gray-700 mb-4">
                by <span className="font-medium">{book.author}</span>
              </p>
            )}
            
            {book.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                {book.description}
              </p>
            )}
            
            {/* Book Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {book.isbn && (
                <div>
                  <p className="text-sm text-gray-500">ISBN</p>
                  <p className="font-medium text-gray-900">{book.isbn}</p>
                </div>
              )}
              
              {book.publisher && (
                <div>
                  <p className="text-sm text-gray-500">Publisher</p>
                  <p className="font-medium text-gray-900">{book.publisher}</p>
                </div>
              )}
              
              {book.published_date && (
                <div>
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="font-medium text-gray-900">{formatDate(book.published_date)}</p>
                </div>
              )}
              
              {book.pages && (
                <div>
                  <p className="text-sm text-gray-500">Pages</p>
                  <p className="font-medium text-gray-900">{book.pages}</p>
                </div>
              )}
              
              {book.language && (
                <div>
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="font-medium text-gray-900">{book.language}</p>
                </div>
              )}
              
              {book.content_type && (
                <div>
                  <p className="text-sm text-gray-500">Format</p>
                  <p className="font-medium text-gray-900">
                    {book.content_type === 'application/pdf' ? 'PDF' : book.content_type}
                  </p>
                </div>
              )}
            </div>
            
            {/* Purchase Info */}
            {book.purchase && (
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Purchased {formatDate(book.purchase.purchased_at)}</span>
                </div>
                
                {book.purchase.access_type && (
                  <Badge variant="success">
                    {book.purchase.access_type === 'lifetime' ? 'Lifetime Access' : 'Active'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PDF Viewer Modal */}
      {pdfViewerOpen && book.file_url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{book.title}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfViewerOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {/* Overlay to prevent right-click */}
              <div 
                className="absolute inset-0 z-10"
                onContextMenu={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none' }}
              />
              <iframe
                src={`${book.file_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`}
                className="w-full h-full"
                title={book.title}
                style={{ pointerEvents: 'auto' }}
                onLoad={(e) => {
                  // Attempt to inject CSS to hide download/print buttons if they appear
                  try {
                    const frame = e.target as HTMLIFrameElement;
                    if (frame.contentDocument) {
                      const style = frame.contentDocument.createElement('style');
                      style.textContent = `
                        #download { display: none !important; }
                        #print { display: none !important; }
                        #secondaryDownload { display: none !important; }
                        #secondaryPrint { display: none !important; }
                        .download { display: none !important; }
                        .print { display: none !important; }
                        [id*="download"] { display: none !important; }
                        [id*="print"] { display: none !important; }
                      `;
                      frame.contentDocument.head.appendChild(style);
                      
                      // Disable print functionality
                      frame.contentWindow!.print = () => {
                        alert('Printing is disabled for this document');
                        return false;
                      };
                    }
                  } catch (error) {
                    // Cross-origin restrictions may prevent this, which is fine
                    console.log('Could not modify iframe content due to cross-origin restrictions');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <Card className="p-6">
        <div className="flex justify-center">
          {book.file_url ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleViewBook}
              className="px-8"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Start Reading
            </Button>
          ) : (
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No file available for this book</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}