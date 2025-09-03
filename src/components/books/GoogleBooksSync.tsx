'use client';

import { useState } from 'react';
import { RefreshCw, Check, X, Search, BookOpen, Calendar, User, FileText, Hash, Globe, AlertCircle } from 'lucide-react';
import { Button, Modal, Spinner, Badge } from '@/components/ui';
import { GoogleBookInfo } from '@/lib/services/google-books';

interface GoogleBooksSyncProps {
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  hasDescription: boolean;
  onSyncComplete: () => void;
}

export default function GoogleBooksSync({ 
  bookId, 
  bookTitle, 
  bookAuthor,
  hasDescription,
  onSyncComplete 
}: GoogleBooksSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleBookInfo[]>([]);
  const [selectedBook, setSelectedBook] = useState<GoogleBookInfo | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/books/sync-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          action: 'sync'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      if (data.requiresManualSelection) {
        // Show manual selection modal
        setSearchResults(data.results || []);
        setShowModal(true);
      } else {
        // Sync successful
        setSyncResult(data);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setSyncResult(null);
        }, 3000);
        if (data.updatedFields && data.updatedFields.length > 0) {
          setTimeout(() => {
            onSyncComplete();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch('/api/books/sync-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          action: 'search'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.results || []);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = async (book: GoogleBookInfo, replaceAll: boolean = false) => {
    setSelectedBook(book);
    setIsSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/books/sync-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          googleBookId: book.id,
          action: replaceAll ? 'sync-with-replacement' : 'sync'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResult(data);
      setShowModal(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setSyncResult(null);
      }, 3000);
      
      if (data.updatedFields && data.updatedFields.length > 0) {
        setTimeout(() => {
          onSyncComplete();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
      setSelectedBook(null);
    }
  };

  const formatAuthors = (authors?: string[]) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    return authors.join(', ');
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).getFullYear().toString();
    } catch {
      return date;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoSync}
          loading={isSyncing}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Auto Sync
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearch}
          loading={isSearching}
          leftIcon={<Search className="h-4 w-4" />}
        >
          Manual Search
        </Button>
      </div>

      {/* Toast Notification */}
      {showToast && syncResult && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`p-3 rounded-lg shadow-lg border ${
            syncResult.updatedFields?.length > 0 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          } max-w-sm`}>
            <div className="flex items-center gap-2">
              {syncResult.updatedFields?.length > 0 ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <p className="text-sm font-medium">
                {syncResult.updatedFields?.length > 0 
                  ? `Updated ${syncResult.updatedFields.length} field${syncResult.updatedFields.length > 1 ? 's' : ''}`
                  : 'No fields needed updating'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="p-3 rounded-lg shadow-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 max-w-sm">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Selection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Select Matching Book from Google Books"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Searching for: <strong>{bookTitle}</strong>
              {bookAuthor && bookAuthor !== 'nan' && <> by <strong>{bookAuthor}</strong></>}
            </p>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No results found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => !isSyncing && setSelectedBook(book)}
                >
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      {book.imageLinks?.smallThumbnail ? (
                        <img 
                          src={book.imageLinks.smallThumbnail} 
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {book.title}
                        {book.subtitle && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            : {book.subtitle}
                          </span>
                        )}
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        {book.authors && book.authors.length > 0 && (
                          <Badge variant="outline" size="xs">
                            <User className="h-3 w-3 mr-1" />
                            {formatAuthors(book.authors)}
                          </Badge>
                        )}
                        {book.publishedDate && (
                          <Badge variant="outline" size="xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(book.publishedDate)}
                          </Badge>
                        )}
                        {book.publisher && (
                          <Badge variant="outline" size="xs">
                            {book.publisher}
                          </Badge>
                        )}
                        {book.isbn && (
                          <Badge variant="outline" size="xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {book.isbn}
                          </Badge>
                        )}
                        {book.language && (
                          <Badge variant="outline" size="xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {book.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {book.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {book.description}
                        </p>
                      )}

                      {book.categories && book.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.categories.slice(0, 3).map((cat, idx) => (
                            <Badge key={idx} size="xs" variant="secondary">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      {selectedBook?.id === book.id && isSyncing ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBook(book, false);
                            }}
                            disabled={isSyncing}
                          >
                            Sync Missing
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBook(book);
                              setShowConfirmReplace(true);
                            }}
                            disabled={isSyncing}
                          >
                            Replace All
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowModal(false)}
            disabled={isSyncing}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Confirm Replace Modal */}
      <Modal
        isOpen={showConfirmReplace}
        onClose={() => setShowConfirmReplace(false)}
        title="Confirm Replace All Information"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Warning:</strong> This will replace ALL book information with data from Google Books, 
              including the title and any existing descriptions.
            </p>
          </div>
          
          {selectedBook && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium mb-1">{selectedBook.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                by {formatAuthors(selectedBook.authors)}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to replace all information for this book?
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowConfirmReplace(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (selectedBook) {
                handleSelectBook(selectedBook, true);
                setShowConfirmReplace(false);
              }
            }}
            loading={isSyncing}
          >
            Replace All
          </Button>
        </div>
      </Modal>
    </>
  );
}