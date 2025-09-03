import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  count?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export abstract class BaseService<T = any> {
  protected supabase: SupabaseClient<Database>;
  protected tableName: string;

  constructor(supabase: SupabaseClient<Database>, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  async getAll(
    options?: PaginationOptions & { filters?: FilterOptions }
  ): Promise<ServiceResponse<T[]>> {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination
      if (options?.page && options?.limit) {
        const start = (options.page - 1) * options.limit;
        const end = start + options.limit - 1;
        query = query.range(start, end);
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection === 'asc' 
        });
      }

      const { data, error, count } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data: data || [], count: count || 0 };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async getById(id: string): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async create(input: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(input)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async update(id: string, input: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { data: true };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('id', id);
    
    return (count || 0) > 0;
  }
}