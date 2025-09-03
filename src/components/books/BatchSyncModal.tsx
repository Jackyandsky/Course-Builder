'use client';

import { useState } from 'react';
import { RefreshCw, Check, X, AlertCircle, Info } from 'lucide-react';
import { Modal, Button, Checkbox, Spinner, Badge } from '@/components/ui';

interface BatchSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

interface SyncFilters {
  missingDescription: boolean;
  missingAuthor: boolean;
  missingCover: boolean;
  missingPublisher: boolean;
  missingYear: boolean;
  missingISBN: boolean;
  missingLanguage: boolean;
  missingTags: boolean;
}

interface SyncResult {
  bookId: string;
  title: string;
  status: 'updated' | 'no_match' | 'low_confidence' | 'no_updates' | 'error';
  message?: string;
  updatedFields?: string[];
  googleTitle?: string;
  confidence?: number;
}

export function BatchSyncModal({ isOpen, onClose, onSyncComplete }: BatchSyncModalProps) {
  const [filters, setFilters] = useState<SyncFilters>({
    missingDescription: true,
    missingAuthor: true,
    missingCover: true,
    missingPublisher: false,
    missingYear: false,
    missingISBN: false,
    missingLanguage: false,
    missingTags: false,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    totalProcessed: number;
    totalUpdated: number;
    results: SyncResult[];
  } | null>(null);
  const [limit, setLimit] = useState(50);

  const handleFilterChange = (key: keyof SyncFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSync = async () => {
    // Check if at least one filter is selected
    const hasFilters = Object.values(filters).some(v => v);
    if (!hasFilters) {
      alert('Please select at least one missing property filter');
      return;
    }

    setIsSyncing(true);
    setSyncResults(null);

    try {
      const response = await fetch('/api/books/batch-sync-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, limit })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Batch sync failed');
      }

      setSyncResults(data);
      
      // Refresh the books list if any updates were made
      if (data.totalUpdated > 0) {
        setTimeout(() => {
          onSyncComplete();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Batch sync error:', error);
      alert(error.message || 'Failed to sync books');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'updated':
        return <Badge variant="success" size="xs">Updated</Badge>;
      case 'no_match':
        return <Badge variant="danger" size="xs">No Match</Badge>;
      case 'low_confidence':
        return <Badge variant="warning" size="xs">Low Confidence</Badge>;
      case 'no_updates':
        return <Badge variant="secondary" size="xs">No Updates</Badge>;
      case 'error':
        return <Badge variant="danger" size="xs">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Sync with Google Books"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>This will sync books with missing information from Google Books API.</p>
              <p className="mt-1">Select filters to find books with specific missing properties.</p>
              <p className="mt-1 font-medium">Note: ALL missing fields will be synchronized for selected books, not just the filtered ones.</p>
              <p className="mt-1 text-xs">Books that recently failed to sync are automatically excluded for 30 minutes to prevent repeated failures.</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        {!syncResults && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-3">Filter Books by Missing Properties:</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox
                    label="Missing Description"
                    checked={filters.missingDescription}
                    onChange={() => handleFilterChange('missingDescription')}
                  />
                  <Checkbox
                    label="Missing Author"
                    checked={filters.missingAuthor}
                    onChange={() => handleFilterChange('missingAuthor')}
                  />
                  <Checkbox
                    label="Missing Cover Image"
                    checked={filters.missingCover}
                    onChange={() => handleFilterChange('missingCover')}
                  />
                  <Checkbox
                    label="Missing Publisher"
                    checked={filters.missingPublisher}
                    onChange={() => handleFilterChange('missingPublisher')}
                  />
                  <Checkbox
                    label="Missing Publication Year"
                    checked={filters.missingYear}
                    onChange={() => handleFilterChange('missingYear')}
                  />
                  <Checkbox
                    label="Missing ISBN"
                    checked={filters.missingISBN}
                    onChange={() => handleFilterChange('missingISBN')}
                  />
                  <Checkbox
                    label="Missing Language"
                    checked={filters.missingLanguage}
                    onChange={() => handleFilterChange('missingLanguage')}
                  />
                  <Checkbox
                    label="Missing Tags"
                    checked={filters.missingTags}
                    onChange={() => handleFilterChange('missingTags')}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Maximum books to process:</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value={10}>10 books</option>
                <option value={25}>25 books</option>
                <option value={50}>50 books</option>
                <option value={100}>100 books</option>
              </select>
            </div>
          </>
        )}

        {/* Syncing Progress */}
        {isSyncing && (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Syncing books with Google Books API...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Results */}
        {syncResults && !isSyncing && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Processed</p>
                  <p className="text-2xl font-bold">{syncResults.totalProcessed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Successfully Updated</p>
                  <p className="text-2xl font-bold text-green-600">{syncResults.totalUpdated}</p>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div>
              <h3 className="text-sm font-medium mb-2">Detailed Results:</h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Book Title</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncResults.results.map((result, index) => (
                      <tr key={result.bookId} className="border-t">
                        <td className="p-2">
                          <div>
                            <p className="font-medium line-clamp-1">{result.title}</p>
                            {result.googleTitle && result.googleTitle !== result.title && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                Match: {result.googleTitle}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{getStatusBadge(result.status)}</td>
                        <td className="p-2 text-xs text-gray-600">
                          {result.status === 'updated' && result.updatedFields ? (
                            <div>
                              <span className="text-green-600">
                                Updated: {result.updatedFields.join(', ')}
                              </span>
                              {result.confidence && (
                                <span className="ml-2 text-gray-500">
                                  ({Math.round(result.confidence * 100)}% match)
                                </span>
                              )}
                            </div>
                          ) : result.message ? (
                            <span>{result.message}</span>
                          ) : result.confidence ? (
                            <span>({Math.round(result.confidence * 100)}% match)</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        {!syncResults ? (
          <>
            <Button variant="outline" onClick={onClose} disabled={isSyncing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSync}
              loading={isSyncing}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Start Sync
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setSyncResults(null)}
            >
              Sync More
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}