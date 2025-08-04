import { contentService } from './content';
import { Content, ContentFilters, CreateContentData, UpdateContentData } from '@/types/content';

// Legacy decoder interface for backward compatibility
export interface Decoder {
  id: string;
  name: string;
  description?: string;
  category?: string | null;
  tags?: string[];
  book_id: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  usage_instructions?: string;
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
  category?: string | null;
  tags?: string[];
  book_id: string;
  is_public?: boolean;
  usage_instructions?: string;
}

export interface UpdateDecoderData extends Partial<CreateDecoderData> {
  id: string;
}

// Helper function to convert Content to Decoder format
function contentToDecoder(content: Content): Decoder {
  return {
    id: content.id,
    name: content.name,
    description: content.content || '',
    category: content.content_data?.legacy_category || null,
    tags: content.tags,
    book_id: content.book_id || '',
    is_public: content.is_public,
    user_id: content.user_id,
    created_at: content.created_at,
    updated_at: content.updated_at,
    usage_instructions: content.content_data?.usage_instructions,
    book: content.book,
    category_data: content.category,
  };
}

// Helper function to get decoder category ID
async function getDecoderCategoryId(): Promise<string> {
  const categories = await contentService.getProprietaryProductCategories();
  const decoderCategory = categories.find(cat => cat.name === 'Decoders');
  if (!decoderCategory) {
    throw new Error('Decoder category not found. Please run migrations.');
  }
  return decoderCategory.id;
}

export const decoderService = {
  // Get all decoders with optional filters
  async getDecoders(filters: DecoderFilters = {}) {
    try {
      const decoderCategoryId = await getDecoderCategoryId();
      
      const contentFilters: ContentFilters = {
        category_id: decoderCategoryId,
        search: filters.search,
        book_id: filters.book_id,
        tags: filters.tags,
        is_public: filters.is_public,
        limit: filters.limit || 50,
      };
      
      const contents = await contentService.getContent(contentFilters);
      return contents.map(contentToDecoder);
    } catch (error) {
      console.error('Failed to get decoders:', error);
      throw error;
    }
  },

  // Get single decoder by ID
  async getDecoder(id: string) {
    try {
      const content = await contentService.getContentById(id);
      return contentToDecoder(content);
    } catch (error) {
      console.error('Failed to get decoder:', error);
      throw error;
    }
  },

  // Create new decoder
  async createDecoder(decoderData: CreateDecoderData) {
    try {
      const decoderCategoryId = await getDecoderCategoryId();
      
      const contentData: CreateContentData = {
        name: decoderData.name,
        content: decoderData.description,
        category_id: decoderCategoryId,
        tags: decoderData.tags,
        book_id: decoderData.book_id,
        is_public: decoderData.is_public,
        content_data: {
          type: 'decoder',
          usage_instructions: decoderData.usage_instructions,
          legacy_category: decoderData.category,
        },
      };
      
      const content = await contentService.createContent(contentData);
      return contentToDecoder(content);
    } catch (error) {
      console.error('Failed to create decoder:', error);
      throw error;
    }
  },

  // Update decoder
  async updateDecoder({ id, ...decoderData }: UpdateDecoderData) {
    try {
      const updateData: UpdateContentData = {
        id,
        name: decoderData.name,
        content: decoderData.description,
        tags: decoderData.tags,
        book_id: decoderData.book_id,
        is_public: decoderData.is_public,
      };
      
      // If content_data fields need updating
      if (decoderData.usage_instructions !== undefined || decoderData.category !== undefined) {
        const existing = await contentService.getContentById(id);
        updateData.content_data = {
          ...existing.content_data,
          type: 'decoder',
          usage_instructions: decoderData.usage_instructions ?? existing.content_data?.usage_instructions,
          legacy_category: decoderData.category ?? existing.content_data?.legacy_category,
        };
      }
      
      const content = await contentService.updateContent(updateData);
      return contentToDecoder(content);
    } catch (error) {
      console.error('Failed to update decoder:', error);
      throw error;
    }
  },

  // Delete decoder
  async deleteDecoder(id: string) {
    try {
      await contentService.deleteContent(id);
    } catch (error) {
      console.error('Failed to delete decoder:', error);
      throw error;
    }
  },

  // Get decoder statistics
  async getDecoderStats() {
    try {
      const stats = await contentService.getContentStats();
      const decoderStats = stats.find(s => s.category === 'Decoders');
      
      return {
        total: decoderStats?.total || 0,
        public: decoderStats?.public || 0,
        private: decoderStats?.private || 0,
      };
    } catch (error) {
      console.error('Failed to get decoder stats:', error);
      throw error;
    }
  },

  // Get categories for decoders (legacy support)
  async getCategories() {
    try {
      // Return legacy decoder categories if any exist
      // In the new system, we use the main Decoders category
      return [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  },
};