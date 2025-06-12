'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, BookOpen, FileText, Video, 
  Headphones, Image as ImageIcon, Gamepad2, Grid, List 
} from 'lucide-react';
import { Book, ContentType } from '@/types/database';
import { bookService, BookFilters } from '@/lib/supabase/books';
import { categoryService } from '@/lib/supabase/categories';
import { 
  Button, Card, Badge, SearchBox, FilterPanel, Spinner, Select 
} from '@/components/ui';
import { cn } from '@/lib/utils';

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  interactive: <Gamepad2 className="h-4 w-4" />,
};

const contentTypeColors: Record<ContentType, string> = {
  text: 'default',
  pdf: 'danger',
  video: 'primary',
  audio: 'warning',
  image: 'success',
  interactive: 'info',
};

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookFilters>({});
  const [stats, setStats] = useState({
    total: 0,
    text: 0,
    video: 0,
    audio: 0,
    pdf: 0,
    other: 0,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authors, setAuthors] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // State to control the visibility of the filter panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBooks();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [authorsData, languagesData, categoriesData, statsData] = await Promise.all([
        bookService.getAuthors(),
        bookService.getLanguages(),
        categoryService.getCategories({ type: 'book' }),
        bookService.getBookStats(),
      ]);
      
      setAuthors(authorsData);
      setLanguages(languagesData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks(filters);
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters({ ...filters, [filterId]: value });
  };

  const contentTypes = bookService.getContentTypes();

  const filterGroups = [
    {
      id: 'contentType',
      label: 'Content Type',
      type: 'checkbox' as const,
      options: contentTypes.map(type => ({
        value: type.value,
        label: type.label,
        icon: contentTypeIcons[type.value],
      })),
    },
    {
      id: 'author',
      label: 'Author',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Authors' },
        ...authors.map(author => ({ value: author, label: author })),
      ],
    },
    {
      id: 'language',
      label: 'Language',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Languages' },
        ...languages.map(lang => ({ value: lang, label: lang.toUpperCase() })),
      ],
    },
    {
      id: 'categoryId',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Categories' },
        ...categories.map(cat => ({ value: cat.id, label: cat.name })),
      ],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book Library</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your books and learning materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => router.push('/books/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Book
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.total}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        {Object.entries(contentTypeIcons).slice(0, 5).map(([type, icon]) => (
          <Card key={type} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {type}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats[type as keyof typeof stats] || 0}
                </p>
              </div>
              <div className="text-gray-400">{icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBox
              placeholder="Search by title, author, or description..."
              onSearch={handleSearch}
              fullWidth
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {isFilterPanelOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <FilterPanel
                  filters={filterGroups}
                  values={filters}
                  onChange={handleFilterChange}
                  onReset={() => setFilters({})}
                  collapsible={false}
              />
          </div>
        )}
      </div>


      {/* Books Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : books.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No books found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start building your library by adding your first book.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/books/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Book
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {books.map((book) => {
            const vocabGroups = book.vocabulary_group_books?.map(vgb => vgb.vocabulary_group).filter(Boolean) || [];
            return (
              <Card
                key={book.id}
                className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/books/${book.id}`)}
              >
                {book.cover_image_url ? (
                  <div className="h-32 overflow-hidden bg-gray-100">
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <Card.Content className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                      {book.title}
                    </h3>
                    <Badge
                      variant={contentTypeColors[book.content_type] as any}
                      size="sm"
                      className="ml-1 text-xs"
                    >
                      {contentTypeIcons[book.content_type]}
                    </Badge>
                  </div>
                  
                  {book.author && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                      by {book.author}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    {book.publication_year && (
                      <span>{book.publication_year}</span>
                    )}
                    {book.language && (
                      <span className="uppercase">{book.language}</span>
                    )}
                  </div>
                  
                  {vocabGroups.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Vocabulary Groups ({vocabGroups.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {vocabGroups.slice(0, 2).map((group) => group && (
                          <Badge
                            key={group.id}
                            variant="outline"
                            className="text-xs px-1 py-0.5"
                            title={group.name}
                          >
                            {group.name.length > 12 ? `${group.name.substring(0, 12)}...` : group.name}
                          </Badge>
                        ))}
                        {vocabGroups.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            +{vocabGroups.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {book.category && (
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: book.category.color ? `${book.category.color}20` : undefined,
                          color: book.category.color || undefined,
                        }}
                      >
                        {book.category.name}
                      </span>
                    </div>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book) => {
            const vocabGroups = book.vocabulary_group_books?.map(vgb => vgb.vocabulary_group).filter(Boolean) || [];
            return (
              <Card
                key={book.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/books/${book.id}`)}
              >
                <Card.Content className="p-4">
                  <div className="flex items-start gap-4">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {book.author}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={contentTypeColors[book.content_type] as any}
                          size="sm"
                        >
                          {book.content_type}
                        </Badge>
                      </div>
                      
                      {book.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        {book.publisher && <span>Publisher: {book.publisher}</span>}
                        {book.publication_year && <span>{book.publication_year}</span>}
                        {book.total_pages && <span>{book.total_pages} pages</span>}
                        {book.language && <span className="uppercase">{book.language}</span>}
                      </div>
                      
                      {vocabGroups.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Vocabulary Groups ({vocabGroups.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {vocabGroups.slice(0, 4).map((group) => group && (
                              <Badge
                                key={group.id}
                                variant="outline"
                                className="text-xs"
                                title={group.name}
                              >
                                {group.name}
                              </Badge>
                            ))}
                            {vocabGroups.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{vocabGroups.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2">
                        {book.category && (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: book.category.color ? `${book.category.color}20` : undefined,
                              color: book.category.color || undefined,
                            }}
                          >
                            {book.category.name}
                          </span>
                        )}
                        {book.tags && book.tags.length > 0 && (
                          <>
                            {book.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {book.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{book.tags.length - 3}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}