import { Book, ContentType } from '@/types/database';

export interface BookFilters {
  search?: string;
  author?: string;
  categoryId?: string;
  contentType?: ContentType;
  language?: string;
  publicationYear?: number;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  // Missing field filters
  missingDescription?: boolean;
  missingAuthor?: boolean;
  missingCover?: boolean;
  missingPublisher?: boolean;
  missingYear?: boolean;
  missingISBN?: boolean;
  missingLanguage?: boolean;
}

export interface CreateBookData {
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  category_id?: string;
  content_type: ContentType;
  file_url?: string;
  cover_image_url?: string;
  total_pages?: number;
  language: string;
  tags?: string[];
  is_public?: boolean;
  price?: number;
  currency?: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free?: boolean;
}

export interface UpdateBookData extends Partial<CreateBookData> {
  id: string;
}

export const bookService = {
  // Get all books with optional filters and pagination
  async getBooks(filters: BookFilters = {}) {
    const params = new URLSearchParams();
    
    // Add filters to query params
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.author) params.set('author', filters.author);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.contentType) params.set('contentType', filters.contentType);
    if (filters.language) params.set('language', filters.language);
    if (filters.publicationYear) params.set('publicationYear', filters.publicationYear.toString());
    if (filters.isPublic !== undefined) params.set('isPublic', filters.isPublic.toString());
    
    const response = await fetch(`/api/admin/books?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const data = await response.json();
    return data.books as Book[];
  },

  // Get books with total count for pagination
  async getBooksWithCount(filters: BookFilters = {}) {
    const params = new URLSearchParams();
    
    // Add all filters to query params
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.author) params.set('author', filters.author);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.contentType) params.set('contentType', filters.contentType);
    if (filters.language) params.set('language', filters.language);
    if (filters.publicationYear) params.set('publicationYear', filters.publicationYear.toString());
    if (filters.isPublic !== undefined) params.set('isPublic', filters.isPublic.toString());
    
    // Missing field filters
    if (filters.missingDescription) params.set('missingDescription', 'true');
    if (filters.missingAuthor) params.set('missingAuthor', 'true');
    if (filters.missingCover) params.set('missingCover', 'true');
    if (filters.missingPublisher) params.set('missingPublisher', 'true');
    if (filters.missingYear) params.set('missingYear', 'true');
    if (filters.missingISBN) params.set('missingISBN', 'true');
    if (filters.missingLanguage) params.set('missingLanguage', 'true');
    
    // Optimize category loading for list views
    if (filters.pageSize && filters.pageSize > 50) {
      params.set('includeCategory', 'false');
    }
    
    const response = await fetch(`/api/admin/books?${params.toString()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Prevent stale data
      },
      signal: AbortSignal.timeout(3000) // Reduced to 3 seconds
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch books`);
    }
    
    return await response.json();
  },

  // Get single book by ID
  async getBook(id: string) {
    const response = await fetch(`/api/admin/books/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch book');
    }
    
    return await response.json() as Book;
  },

  // Create new book
  async createBook(bookData: CreateBookData) {
    // Set default language if not provided
    const dataWithDefaults = {
      ...bookData,
      language: bookData.language || 'en',
      is_public: bookData.is_public || false,
      user_id: 'shared', // Use a shared user ID since authentication is not required
    };

    const response = await fetch('/api/admin/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataWithDefaults),
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create book');
    }
    
    return await response.json() as Book;
  },

  // Update book
  async updateBook({ id, ...bookData }: UpdateBookData) {
    const response = await fetch('/api/admin/books', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...bookData }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update book');
    }
    
    return await response.json() as Book;
  },

  // Delete book
  async deleteBook(id: string) {
    const response = await fetch(`/api/admin/books?id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete book');
    }
  },

  // Get book statistics
  async getBookStats() {
    try {
      const response = await fetch('/api/admin/books?operation=stats', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300' // Cache for 5 minutes
        },
        signal: AbortSignal.timeout(5000) // Increased timeout to 5 seconds
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch book stats: HTTP ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Book stats loaded successfully:', data);
      return data;
    } catch (error) {
      // More detailed error logging
      if (error.name === 'AbortError') {
        console.warn('Book stats request timed out after 5 seconds');
      } else {
        console.warn('Failed to fetch book stats:', error.message);
      }
      
      // Return default stats on failure to prevent UI blocking
      return {
        total: 0,
        text: 0,
        video: 0,
        audio: 0,
        pdf: 0,
        image: 0,
        interactive: 0,
      };
    }
  },

  // Get unique authors
  async getAuthors() {
    const response = await fetch('/api/admin/books?operation=authors', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch authors');
    }
    
    return await response.json();
  },

  // Get unique languages
  async getLanguages() {
    const response = await fetch('/api/admin/books?operation=languages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch languages');
    }
    
    return await response.json();
  },

  // Get content type options
  getContentTypes(): { value: ContentType; label: string; icon?: string }[] {
    return [
      { value: 'text', label: 'Text', icon: '📄' },
      { value: 'pdf', label: 'PDF', icon: '📑' },
      { value: 'video', label: 'Video', icon: '🎥' },
      { value: 'audio', label: 'Audio', icon: '🎧' },
      { value: 'image', label: 'Image', icon: '🖼️' },
      { value: 'interactive', label: 'Interactive', icon: '🎮' },
    ];
  },
};
