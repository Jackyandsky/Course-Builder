'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Essay {
  id: string;
  title: string;
  book_title: string;
  book_author: string;
  thesis_statement: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  word_count: number;
  is_published: boolean;
  created_at: string;
  paragraph_count?: number;
  sentence_count?: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
}

// Generic Searchable Book Selector Component
const SearchableBookSelector = ({ 
  books, 
  selectedBooks, 
  onChange, 
  placeholder,
  maxSelections = 3 
}: {
  books: Book[];
  selectedBooks: string[];
  onChange: (books: string[]) => void;
  placeholder: string;
  maxSelections?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter books based on search query
  const filteredBooks = searchQuery.trim() 
    ? books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  const toggleBook = (bookId: string) => {
    if (selectedBooks.includes(bookId)) {
      onChange(selectedBooks.filter(id => id !== bookId));
    } else if (selectedBooks.length < maxSelections) {
      onChange([...selectedBooks, bookId]);
    }
  };

  // Get selected book details
  const selectedBookDetails = books.filter(book => selectedBooks.includes(book.id));

  return (
    <div className="relative">
      <div 
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          {selectedBooks.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedBookDetails.map(book => (
                <Badge key={book.id} className="bg-blue-100 text-blue-700">
                  {book.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredBooks.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No books found</div>
            ) : (
              filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBook(book.id);
                  }}
                >
                  <div>
                    <div className="text-sm font-medium">{book.title}</div>
                    {book.author && (
                      <div className="text-xs text-gray-500">{book.author}</div>
                    )}
                  </div>
                  {selectedBooks.includes(book.id) && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              ))
            )}
          </div>
          {selectedBooks.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                  setIsOpen(false);
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function EssayBuilderPage() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [expandedEssayId, setExpandedEssayId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load essays and books
  useEffect(() => {
    loadEssays('', []);
    loadBooks();
  }, []);

  // Reload essays when filters change
  useEffect(() => {
    if (!loading) {
      loadEssays(searchTerm, selectedBooks);
    }
  }, [selectedBooks, searchTerm]);

  const loadEssays = async (search: string = '', bookIds: string[] = []) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (bookIds.length > 0) {
        params.append('bookIds', bookIds.join(','));
      }
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/essays?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEssays(data);
      } else {
        console.error('Failed to load essays:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load essays:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      // Simply load all books, sorted alphabetically
      const response = await fetch('/api/books?limit=500');
      if (response.ok) {
        const data = await response.json();
        // Sort books alphabetically by title
        const sortedBooks = data.sort((a: Book, b: Book) => 
          a.title.localeCompare(b.title)
        );
        setBooks(sortedBooks);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this essay? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/essays?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setEssays(essays.filter(e => e.id !== id));
        showSuccess('Essay deleted successfully');
      } else {
        console.error('Failed to delete essay');
      }
    } catch (error) {
      console.error('Failed to delete essay:', error);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const response = await fetch(`/api/essays/${id}`);
      if (response.ok) {
        const essay = await response.json();
        
        // Format the essay content for copying
        let essayText = `${essay.title}\n\n`;
        essayText += `Book: ${essay.book_title}${essay.book_author ? ' by ' + essay.book_author : ''}\n`;
        essayText += `Thesis: ${essay.thesis_statement}\n\n`;
        
        // Add paragraphs
        if (essay.paragraphs && essay.paragraphs.length > 0) {
          essay.paragraphs.forEach((paragraph: any) => {
            const paragraphType = paragraph.type || '';
            const label = paragraphType.charAt(0).toUpperCase() + paragraphType.slice(1).replace(/\d+/, ' $&');
            essayText += `${label}:\n`;
            
            if (paragraph.sentences && paragraph.sentences.length > 0) {
              paragraph.sentences.forEach((sentence: any) => {
                if (sentence.text) {
                  essayText += `${sentence.text} `;
                }
              });
              essayText += '\n\n';
            }
          });
        }
        
        // Copy to clipboard
        await navigator.clipboard.writeText(essayText);
        showSuccess('Essay copied to clipboard');
      } else {
        console.error('Failed to fetch essay for copying');
      }
    } catch (error) {
      console.error('Failed to copy essay:', error);
      // Fallback error message
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('Clipboard access denied. Please enable clipboard permissions.');
      }
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/essays/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !currentStatus
        })
      });
      
      if (response.ok) {
        setEssays(essays.map(e => 
          e.id === id ? { ...e, is_published: !currentStatus } : e
        ));
        showSuccess(currentStatus ? 'Essay unpublished' : 'Essay published successfully');
      } else {
        console.error('Failed to update publish status');
      }
    } catch (error) {
      console.error('Failed to update publish status:', error);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Use essays directly since filtering is done server-side
  const filteredEssays = essays;


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Essay Builder</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage 5/5/5 essay examples for books in your library
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/tools/essay-builder/review">
              <Button variant="outline" className="flex items-center gap-2">
                <AcademicCapIcon className="h-4 w-4" />
                Review Student Essays
              </Button>
            </Link>
            <Link href="/admin/tools/essay-builder/new">
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                New Essay
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 max-w-3xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search essays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <SearchableBookSelector
              books={books}
              selectedBooks={selectedBooks}
              onChange={setSelectedBooks}
              placeholder="Filter by books (up to 3)..."
            />
          </div>
        </div>
      </div>

      {/* Essays List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading essays...</p>
        </div>
      ) : filteredEssays.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No essays found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedBooks.length > 0 
              ? 'Try adjusting your filters' 
              : 'Get started by creating a new essay'}
          </p>
          {!searchTerm && selectedBooks.length === 0 && (
            <div className="mt-6">
              <Link href="/admin/tools/essay-builder/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Essay
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Essay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Structure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEssays.map((essay) => (
                <React.Fragment key={essay.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {essay.title}
                        </div>
                        <button
                          onClick={() => setExpandedEssayId(
                            expandedEssayId === essay.id ? null : essay.id
                          )}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {expandedEssayId === essay.id ? (
                            <>
                              <ChevronDownIcon className="h-3 w-3" />
                              Hide thesis
                            </>
                          ) : (
                            <>
                              <ChevronRightIcon className="h-3 w-3" />
                              Show thesis
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{essay.book_title}</div>
                      <div className="text-xs text-gray-500">{essay.book_author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {essay.paragraph_count || 5} paragraphs
                      </div>
                      <div className="text-xs text-gray-500">
                        {essay.sentence_count || 25} sentences • {essay.word_count} words
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {essay.is_published ? (
                        <Badge className="bg-green-100 text-green-700">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tools/essay-builder/${essay.id}`}>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </Link>
                        <Link href={`/admin/tools/essay-builder/${essay.id}/edit`}>
                          <button
                            className="text-blue-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleCopy(essay.id)}
                          className="text-blue-400 hover:text-blue-600"
                          title="Copy to Clipboard"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handlePublishToggle(essay.id, essay.is_published)}
                          className="text-gray-400 hover:text-gray-600"
                          title={essay.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {essay.is_published ? (
                            <XCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(essay.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedEssayId === essay.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-3 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          <strong>Thesis Statement:</strong>
                          <p className="mt-1 italic">{essay.thesis_statement}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}