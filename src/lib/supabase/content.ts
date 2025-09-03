import { SHARED_USER_ID } from '@/lib/constants/shared';
import { 
  Content, 
  ContentFilters, 
  CreateContentData, 
  UpdateContentData,
  ProprietaryProductCategory 
} from '@/types/content';

export const contentService = {
  // Get all content with optional filters
  async getContent(filters: ContentFilters & { sortField?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.parent_category_id) params.append('parent_category_id', filters.parent_category_id);
      if (filters.book_id) params.append('book_id', filters.book_id);
      if (filters.sortField) params.append('sortField', filters.sortField);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const response = await fetch(`/api/admin/content?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch content:', error);
      return [];
    }
  },

  // Get total count of content items with filters
  async getContentCount(filters: ContentFilters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('operation', 'count');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.parent_category_id) params.append('parent_category_id', filters.parent_category_id);
      if (filters.book_id) params.append('book_id', filters.book_id);
      
      const response = await fetch(`/api/admin/content?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content count');
      }
      
      const result = await response.json();
      return result.count || 0;
    } catch (error) {
      console.error('Failed to fetch content count:', error);
      return 0;
    }
  },

  // Get content by category name (e.g., "Decoders", "Study Packages")
  async getContentByCategory(categoryName: string, filters: ContentFilters & { sortField?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('category_name', categoryName);
      
      if (filters.search) params.append('search', filters.search);
      if (filters.sortField) params.append('sortField', filters.sortField);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const response = await fetch(`/api/admin/content?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content by category');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch content by category:', error);
      return [];
    }
  },

  // Get single content item by ID
  async getContentById(id: string) {
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      return await response.json() as Content;
    } catch (error) {
      console.error('Failed to fetch content by ID:', error);
      throw error;
    }
  },

  // Create new content
  async createContent(contentData: CreateContentData) {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contentData,
          is_public: contentData.is_public || false,
          status: contentData.status || 'active',
          user_id: SHARED_USER_ID,
          tags: contentData.tags || [],
          content_data: contentData.content_data || {},
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create content');
      }
      
      const newContent = await response.json();
      
      // If book_ids are provided, create content_books relationships
      if (contentData.book_ids && contentData.book_ids.length > 0) {
        await fetch('/api/admin/content/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_id: newContent.id,
            book_ids: contentData.book_ids
          }),
          signal: AbortSignal.timeout(5000)
        }).catch(error => {
          console.error('Failed to create content-book relationships:', error);
        });
      }
      
      // Return the content with its relationships
      return this.getContentById(newContent.id);
    } catch (error) {
      console.error('Failed to create content:', error);
      throw error;
    }
  },

  // Update content
  async updateContent({ id, ...contentData }: UpdateContentData) {
    try {
      const { book_ids, ...dataWithoutBookIds } = contentData;
      
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...dataWithoutBookIds,
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      
      // If book_ids are provided, update content_books relationships
      if (book_ids !== undefined) {
        await fetch('/api/admin/content/books', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_id: id,
            book_ids
          }),
          signal: AbortSignal.timeout(5000)
        }).catch(error => {
          console.error('Failed to update content-book relationships:', error);
        });
      }
      
      // Return the content with its relationships
      return this.getContentById(id);
    } catch (error) {
      console.error('Failed to update content:', error);
      throw error;
    }
  },

  // Delete content
  async deleteContent(id: string) {
    try {
      const response = await fetch(`/api/admin/content?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
      throw error;
    }
  },

  // Get proprietary product categories (subcategories under "Proprietary Products")
  async getProprietaryProductCategories(): Promise<ProprietaryProductCategory[]> {
    try {
      const response = await fetch('/api/admin/content?operation=categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch proprietary product categories');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch proprietary product categories:', error);
      return [];
    }
  },

  // Create a new proprietary product category
  async createProprietaryProductCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryData,
          type: 'content',
          parent_name: 'Proprietary Products',
          user_id: SHARED_USER_ID
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      
      return await response.json() as ProprietaryProductCategory;
    } catch (error) {
      console.error('Failed to create proprietary product category:', error);
      throw error;
    }
  },

  // Get content statistics by category
  async getContentStats() {
    try {
      const response = await fetch('/api/admin/content?operation=stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch content stats:', error);
      return [];
    }
  },

  // Delete a proprietary product category
  async deleteProprietaryProductCategory(categoryId: string) {
    try {
      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete proprietary product category:', error);
      throw error;
    }
  },

  // Check if content name already exists
  async checkDuplicateName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('operation', 'check_duplicate');
      params.append('name', name);
      if (excludeId) params.append('exclude_id', excludeId);
      
      const response = await fetch(`/api/admin/content?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to check duplicate name');
      }
      
      const result = await response.json();
      return result.exists || false;
    } catch (error) {
      console.error('Failed to check duplicate name:', error);
      throw error;
    }
  },

  // Migrate decoder to content (for backwards compatibility)
  async migrateDecoderToContent(decoder: any): Promise<Content> {
    const contentData = {
      name: decoder.name,
      content: decoder.description,
      content_data: {
        type: 'decoder' as const,
        usage_instructions: decoder.usage_instructions,
        legacy_category: decoder.category,
      },
      category_id: '', // Will be set after getting decoder category
      tags: decoder.tags || [],
      book_id: decoder.book_id,
      is_public: decoder.is_public || false,
    };
    
    // Get decoder category from API
    try {
      const response = await fetch('/api/categories?type=content&name=Decoders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch decoder category');
      }
      
      const categories = await response.json();
      const category = categories.find((c: any) => c.name === 'Decoders');
      
      if (!category) {
        throw new Error('Decoder category not found');
      }
      
      contentData.category_id = category.id;
      
      return this.createContent(contentData);
    } catch (error) {
      console.error('Failed to migrate decoder to content:', error);
      throw error;
    }
  },
};