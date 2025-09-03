import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type Content = Database['public']['Tables']['content']['Row'];
type ContentInsert = Database['public']['Tables']['content']['Insert'];
type ContentUpdate = Database['public']['Tables']['content']['Update'];

export class ContentService extends BaseService<Content> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'content');
  }

  /**
   * Get content by category
   */
  async getContentByCategory(categoryId: string) {
    const { data, error } = await this.supabase
      .from('content')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_public', true)
      .order('name');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(limit = 8) {
    const { data, error } = await this.supabase
      .from('content')
      .select('*')
      .eq('featured', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get content for homepage
   */
  async getHomepageContent(limit = 8) {
    const { data, error } = await this.supabase
      .from('content')
      .select('*')
      .eq('show_on_homepage', true)
      .eq('is_public', true)
      .order('homepage_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get content for menu
   */
  async getMenuContent() {
    const { data, error } = await this.supabase
      .from('content')
      .select('id, name, content, public_slug, category_id')
      .eq('show_on_menu', true)
      .eq('is_public', true)
      .order('menu_order', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get content by type (for proprietary products)
   */
  async getContentByType(type: string) {
    // Map type to category names
    const categoryMapping: { [key: string]: string } = {
      'decoders': 'Decoders',
      'standardizers': 'Standardizers',
      'complete-study-packages': 'Complete Study Packages',
      'lex': 'LEX'
    };

    const categoryName = categoryMapping[type];
    if (!categoryName) {
      throw new Error(`Invalid content type: ${type}`);
    }

    // First get the category
    const { data: category, error: categoryError } = await this.supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (categoryError) throw categoryError;

    // Then get content for that category
    return this.getContentByCategory(category.id);
  }

  /**
   * Search content
   */
  async searchContent(searchTerm: string, filters?: {
    categoryId?: string;
    featured?: boolean;
    priceMin?: number;
    priceMax?: number;
  }) {
    let query = this.supabase
      .from('content')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_public', true);

    // Apply search term
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    }

    // Apply filters
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters?.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters?.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get content with book relationship
   */
  async getContentWithBook(contentId: string) {
    const { data, error } = await this.supabase
      .from('content')
      .select(`
        *,
        book_id,
        books (
          id,
          title,
          author,
          isbn,
          cover_image_url
        )
      `)
      .eq('id', contentId)
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get content by book
   */
  async getContentByBook(bookId: string) {
    const { data, error } = await this.supabase
      .from('content')
      .select('*')
      .eq('book_id', bookId)
      .eq('is_public', true)
      .order('name');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Bulk create content from PDF or other sources
   */
  async bulkCreateContent(items: ContentInsert[]) {
    const { data, error } = await this.supabase
      .from('content')
      .insert(items)
      .select();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Update content visibility settings
   */
  async updateContentVisibility(contentId: string, visibility: {
    is_public?: boolean;
    show_on_homepage?: boolean;
    show_on_menu?: boolean;
    homepage_order?: number;
    menu_order?: number;
  }) {
    const { data, error } = await this.supabase
      .from('content')
      .update(visibility)
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }
}