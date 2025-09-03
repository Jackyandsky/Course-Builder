'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface Book {
  id: string;
  title: string;
  author: string;
}

interface Sentence {
  id?: string;
  function: string;
  text: string;
  position_order?: number;
}

interface Paragraph {
  id?: string;
  type: string;
  position_order?: number;
  sentences: Sentence[];
}

interface Essay {
  id: string;
  title: string;
  book_id: string;
  book_title: string;
  book_author: string;
  thesis_statement: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  paragraphs: Paragraph[];
}

// Searchable Book Selector Component
const SearchableBookSelector = ({ 
  books, 
  selectedBook, 
  onChange, 
  placeholder,
  required = false
}: {
  books: Book[];
  selectedBook: string;
  onChange: (bookId: string) => void;
  placeholder: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search books when query changes
  useEffect(() => {
    const searchBooks = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/books?search=${encodeURIComponent(searchQuery)}&limit=50`);
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(searchBooks, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use search results when searching, otherwise show all books
  const filteredBooks = searchQuery.trim() ? searchResults : books;

  // Get selected book details from both books and search results
  const allAvailableBooks = [...books, ...searchResults];
  const selectedBookDetails = allAvailableBooks.find((book, index, self) => 
    book.id === selectedBook && 
    self.findIndex(b => b.id === book.id) === index // Remove duplicates
  );

  return (
    <div className="relative">
      <div 
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          {!selectedBook ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <div className="text-sm">
              <div className="font-medium">{selectedBookDetails?.title}</div>
              {selectedBookDetails?.author && (
                <div className="text-gray-500">{selectedBookDetails.author}</div>
              )}
            </div>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredBooks.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No books found</div>
            ) : (
              filteredBooks.map(book => (
                <div
                  key={book.id}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    selectedBook === book.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(book.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="text-sm font-medium">{book.title}</div>
                  {book.author && (
                    <div className="text-xs text-gray-500">{book.author}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const paragraphTypes = [
  { type: 'introduction', label: 'Introduction', position: 1 },
  { type: 'body1', label: 'Body Paragraph 1', position: 2 },
  { type: 'body2', label: 'Body Paragraph 2', position: 3 },
  { type: 'body3', label: 'Body Paragraph 3', position: 4 },
  { type: 'conclusion', label: 'Conclusion', position: 5 }
];

const getSentenceLabel = (func: string | undefined | null): string => {
  const labels: { [key: string]: string } = {
    'hook': 'Hook',
    'lead-in': 'Lead-in',
    'thesis': 'Thesis',
    'elaboration': 'Elaboration',
    'roadmap': 'Roadmap',
    'topic': 'Topic Sentence',
    'evidence': 'Evidence/Quote',
    'interpretation': 'Interpretation',
    'transition': 'Transition',
    'implication': 'Implication',
    'restatement': 'Restatement',
    'summary': 'Summary',
    'closing': 'Closing Thought',
    'universality': 'Universality',
    'resonance': 'Resonance'
  };
  return labels[func || ''] || func || 'Sentence';
};

export default function EditEssayPage() {
  const router = useRouter();
  const params = useParams();
  const essayId = params.id as string;
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState('');
  const [thesisStatement, setThesisStatement] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isPublished, setIsPublished] = useState(false);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [currentEssayBook, setCurrentEssayBook] = useState<Book | null>(null);

  // Load essay and books on mount
  useEffect(() => {
    loadEssay();
    loadBooks();
  }, [essayId]);

  // After both essay and books are loaded, ensure the essay's book is in the books list
  useEffect(() => {
    if (currentEssayBook && books.length > 0) {
      const bookExists = books.some(book => book.id === currentEssayBook.id);
      if (!bookExists) {
        setBooks(prev => [currentEssayBook, ...prev]);
      }
    }
  }, [currentEssayBook, books]);

  const loadEssay = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/essays/${essayId}`);
      if (response.ok) {
        const essay: Essay = await response.json();
        setTitle(essay.title);
        setBookId(essay.book_id);
        setThesisStatement(essay.thesis_statement);
        setDifficultyLevel(essay.difficulty_level);
        setIsPublished(essay.is_published);
        setParagraphs(essay.paragraphs || []);
        
        // Store the current essay's book for later addition to books list
        if (essay.book_id) {
          if (essay.book_title) {
            // Use book data from essay if available
            const essayBook: Book = {
              id: essay.book_id,
              title: essay.book_title,
              author: essay.book_author || ''
            };
            setCurrentEssayBook(essayBook);
          } else {
            // Fetch book details if not stored in essay
            fetchBookDetails(essay.book_id);
          }
        }
      } else {
        setError('Failed to load essay');
      }
    } catch (error) {
      console.error('Failed to load essay:', error);
      setError('An error occurred while loading the essay');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const fetchBookDetails = async (bookId: string) => {
    try {
      // First try to find it in the existing books list
      const existingBook = books.find(b => b.id === bookId);
      if (existingBook) {
        setCurrentEssayBook(existingBook);
        return;
      }
      
      // If not found, fetch all books and look for it
      const response = await fetch('/api/books?limit=1000');
      if (response.ok) {
        const allBooks = await response.json();
        const book = allBooks.find((b: Book) => b.id === bookId);
        if (book) {
          setCurrentEssayBook(book);
          // Also update the books list to include this book
          setBooks(prev => [book, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch book details:', error);
    }
  };

  const updateSentence = (paragraphIndex: number, sentenceIndex: number, text: string) => {
    const updatedParagraphs = [...paragraphs];
    if (updatedParagraphs[paragraphIndex] && updatedParagraphs[paragraphIndex].sentences[sentenceIndex]) {
      updatedParagraphs[paragraphIndex].sentences[sentenceIndex].text = text;
      setParagraphs(updatedParagraphs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Get selected book details
      const selectedBook = books.find(b => b.id === bookId);
      
      const essayData = {
        id: essayId,
        title,
        book_id: bookId,
        book_title: selectedBook?.title || '',
        book_author: selectedBook?.author || '',
        thesis_statement: thesisStatement,
        difficulty_level: difficultyLevel,
        is_published: isPublished,
        metadata: {}
      };

      const response = await fetch('/api/essays', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(essayData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/tools/essay-builder');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update essay');
      }
    } catch (error) {
      console.error('Error updating essay:', error);
      setError('An error occurred while updating the essay');
    } finally {
      setSaving(false);
    }
  };

  const countWords = () => {
    return paragraphs.reduce((total, p) => {
      return total + p.sentences.reduce((pTotal, s) => {
        return pTotal + (s.text ? s.text.split(' ').filter(w => w).length : 0);
      }, 0);
    }, 0);
  };

  const countCompletedSentences = () => {
    return paragraphs.reduce((total, p) => {
      return total + p.sentences.filter(s => s.text && s.text.trim()).length;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading essay...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-xl font-semibold">Essay Updated Successfully!</h2>
          <p className="mt-2 text-gray-600">Redirecting to essay list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/tools/essay-builder" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Essay List
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Essay</h1>
        <p className="mt-1 text-sm text-gray-600">
          Modify essay details and content
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {countCompletedSentences()} sentences (15-25 expected) • {countWords()} words
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((countCompletedSentences() / 15) * 100, 100)}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Essay Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Essay Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter essay title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book <span className="text-red-500">*</span>
              </label>
              <SearchableBookSelector
                books={books}
                selectedBook={bookId}
                onChange={setBookId}
                placeholder="Select a book..."
                required={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={isPublished ? 'published' : 'draft'}
                onChange={(e) => setIsPublished(e.target.value === 'published')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thesis Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={thesisStatement}
                onChange={(e) => setThesisStatement(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the main thesis statement..."
              />
            </div>
          </div>
        </div>

        {/* Paragraphs */}
        {paragraphs.map((paragraph, pIndex) => (
          <div key={pIndex} className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {paragraphTypes.find(pt => pt.type === paragraph.type || pt.position === paragraph.position_order)?.label || `Paragraph ${pIndex + 1}`}
            </h2>
            
            <div className="space-y-3">
              {paragraph.sentences.map((sentence, sIndex) => (
                <div key={sIndex}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {sIndex + 1}. {getSentenceLabel(sentence.function)}
                  </label>
                  <textarea
                    value={sentence.text || ''}
                    onChange={(e) => updateSentence(pIndex, sIndex, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${getSentenceLabel(sentence.function).toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Submit Buttons */}
        <div className="flex justify-between items-center">
          <Link href="/admin/tools/essay-builder">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}