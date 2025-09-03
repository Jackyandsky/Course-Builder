import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResponse } from './base.service';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export class UserService extends BaseService<UserProfile> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'user_profiles');
  }

  async getTeachers(): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('available_for_booking', true)
        .order('full_name', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch teachers' };
    }
  }

  async getAdmins(): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'admin')
        .order('full_name', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch admins' };
    }
  }

  async getUserByEmail(email: string): Promise<ServiceResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch user' };
    }
  }

  async updateProfile(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<ServiceResponse<UserProfile>> {
    return this.update(userId, updates);
  }

  async getStudents(): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch students' };
    }
  }

  async searchUsers(searchTerm: string): Promise<ServiceResponse<UserProfile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true })
        .limit(20);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error: any) {
      return { error: error.message || 'Failed to search users' };
    }
  }
}