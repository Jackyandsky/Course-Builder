import { Category } from '@/types/database';
import { SHARED_USER_ID } from '@/lib/constants/shared';

export interface CategoryFilters {
  type?: string;
  parentId?: string | null;
  search?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export const categoryService = {
  // Get all categories with optional filters - uses API route
  async getCategories(filters: CategoryFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.parentId !== undefined) {
        params.append('parentId', filters.parentId === null ? 'null' : filters.parentId);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/categories?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch categories');
      }

      return await response.json() as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get single category by ID - uses API route
  async getCategory(id: string) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch category');
      }

      return await response.json() as Category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  // Create new category - uses API route
  async createCategory(categoryData: CreateCategoryData) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      return await response.json() as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update category - uses API route
  async updateCategory({ id, ...categoryData }: UpdateCategoryData) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      return await response.json() as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category - uses API route
  async deleteCategory(id: string) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Get category types
  getCategoryTypes() {
    return [
      { value: 'course', label: 'Course' },
      { value: 'book', label: 'Book' },
      { value: 'vocabulary', label: 'Vocabulary' },
      { value: 'objective', label: 'Objective' },
      { value: 'method', label: 'Method' },
      { value: 'task', label: 'Task' },
    ];
  },
};
