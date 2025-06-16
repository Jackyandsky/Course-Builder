import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Book, ContentType } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

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
}

export interface UpdateBookData extends Partial<CreateBookData> {
  id: string;
}

export const bookService = {
  // Get all books with optional filters
  async getBooks(filters: BookFilters = {}) {
    let query = supabase
      .from('books')
      .select(`
        *,
        category:categories(id, name, color, icon),
        vocabulary_group_books(
          vocabulary_group:vocabulary_groups(
            id,
            name,
            difficulty
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.author) {
      query = query.ilike('author', `%${filters.author}%`);
    }
    
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.contentType) {
      query = query.eq('content_type', filters.contentType);
    }
    
    if (filters.language) {
      query = query.eq('language', filters.language);
    }
    
    if (filters.publicationYear) {
      query = query.eq('publication_year', filters.publicationYear);
    }
    
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Book[];
  },

  // Get single book by ID
  async getBook(id: string) {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        category:categories(id, name, color, icon),
        course_books(
          id,
          course_id,
          is_required,
          notes,
          position,
          course:courses(id, title, status)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Book;
  },

  // Create new book
  async createBook(bookData: CreateBookData) {
    // Set default language if not provided
    const dataWithDefaults = {
      ...bookData,
      language: bookData.language || 'en',
      is_public: bookData.is_public || false,
      user_id: SHARED_USER_ID, // Use a shared user ID since authentication is not required
    };

    const { data, error } = await supabase
      .from('books')
      .insert(dataWithDefaults)
      .select()
      .single();
    
    if (error) throw error;
    return data as Book;
  },

  // Update book
  async updateBook({ id, ...bookData }: UpdateBookData) {
    const { data, error } = await supabase
      .from('books')
      .update({
        ...bookData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Book;
  },

  // Delete book
  async deleteBook(id: string) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get book statistics
  async getBookStats() {
    const { count: totalCount, error: totalError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;

    // Get count by content type
    const { data, error } = await supabase
      .from('books')
      .select('content_type');
    
    if (error) throw error;

    const stats = {
      total: totalCount || 0,
      text: data?.filter(b => b.content_type === 'text').length || 0,
      video: data?.filter(b => b.content_type === 'video').length || 0,
      audio: data?.filter(b => b.content_type === 'audio').length || 0,
      pdf: data?.filter(b => b.content_type === 'pdf').length || 0,
      other: data?.filter(b => ['image', 'interactive'].includes(b.content_type)).length || 0,
    };

    return stats;
  },

  // Get unique authors
  async getAuthors() {
    const { data, error } = await supabase
      .from('books')
      .select('author')
      .not('author', 'is', null);
    
    if (error) throw error;

    // Extract unique authors
    const authorsSet = new Set(data?.map(book => book.author).filter(Boolean));
    const authors = Array.from(authorsSet).sort();
    return authors;
  },

  // Get unique languages
  async getLanguages() {
    const { data, error } = await supabase
      .from('books')
      .select('language');
    
    if (error) throw error;

    // Extract unique languages
    const languagesSet = new Set(data?.map(book => book.language).filter(Boolean));
    const languages = Array.from(languagesSet).sort();
    return languages;
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
