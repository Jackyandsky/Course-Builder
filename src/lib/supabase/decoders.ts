import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SHARED_USER_ID } from '@/lib/constants/shared';

const supabase = createClientComponentClient();

export interface Decoder {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  book_id: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  book?: {
    id: string;
    title: string;
    author?: string;
    content_type?: string;
  };
  category_data?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface DecoderFilters {
  search?: string;
  book_id?: string;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  limit?: number;
}

export interface CreateDecoderData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  book_id: string;
  is_public?: boolean;
}

export interface UpdateDecoderData extends Partial<CreateDecoderData> {
  id: string;
}

export const decoderService = {
  // Get all decoders with optional filters
  async getDecoders(filters: DecoderFilters = {}) {
    let query = supabase
      .from('decoders')
      .select(`
        *,
        book:books(
          id,
          title,
          author,
          content_type
        ),
        category_data:categories(
          id,
          name,
          color,
          icon
        )
      `)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }
    
    if (filters.book_id) {
      query = query.eq('book_id', filters.book_id);
    }
    
    
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }
    
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Decoder[];
  },

  // Get single decoder by ID
  async getDecoder(id: string) {
    const { data, error } = await supabase
      .from('decoders')
      .select(`
        *,
        book:books(
          id,
          title,
          author,
          content_type,
          description,
          publication_year,
          publisher,
          category:categories(id, name, color, icon)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Decoder;
  },

  // Create new decoder
  async createDecoder(decoderData: CreateDecoderData) {
    const dataWithDefaults = {
      ...decoderData,
      is_public: decoderData.is_public || false,
      user_id: SHARED_USER_ID,
    };

    const { data, error } = await supabase
      .from('decoders')
      .insert(dataWithDefaults)
      .select(`
        *,
        book:books(
          id,
          title,
          author,
          content_type
        ),
        category_data:categories(
          id,
          name,
          color,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    return data as Decoder;
  },

  // Update decoder
  async updateDecoder({ id, ...decoderData }: UpdateDecoderData) {
    const { data, error } = await supabase
      .from('decoders')
      .update({
        ...decoderData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        book:books(
          id,
          title,
          author,
          content_type
        ),
        category_data:categories(
          id,
          name,
          color,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    return data as Decoder;
  },

  // Delete decoder
  async deleteDecoder(id: string) {
    const { error } = await supabase
      .from('decoders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get decoder statistics
  async getDecoderStats() {
    const { data, error } = await supabase
      .from('decoders')
      .select('*', { count: 'exact' });
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      public: data?.filter(d => d.is_public).length || 0,
      private: data?.filter(d => !d.is_public).length || 0,
    };

    return stats;
  },

  // Get categories for decoders
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'decoder')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

};