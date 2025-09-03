import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category?: string;
  description?: string;
  is_sensitive?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export class ConfigService {
  private static instance: ConfigService;
  private supabase = createClientComponentClient<Database>();
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetch = 0;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Get a single setting
  async get(key: string, defaultValue?: any): Promise<any> {
    try {
      // Check cache first
      if (this.cache.has(key) && Date.now() - this.lastFetch < this.cacheExpiry) {
        return this.cache.get(key);
      }

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        return defaultValue;
      }

      this.cache.set(key, data.value);
      return data.value;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return defaultValue;
    }
  }

  // Get multiple settings by category
  async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('key, value')
        .eq('category', category);

      if (error || !data) {
        return {};
      }

      const settings: Record<string, any> = {};
      data.forEach(item => {
        settings[item.key] = item.value;
        this.cache.set(item.key, item.value);
      });

      return settings;
    } catch (error) {
      console.error('Error fetching settings by category:', error);
      return {};
    }
  }

  // Get all settings
  async getAll(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error || !data) {
        return [];
      }

      // Update cache
      data.forEach(item => {
        this.cache.set(item.key, item.value);
      });
      this.lastFetch = Date.now();

      return data as SystemSetting[];
    } catch (error) {
      console.error('Error fetching all settings:', error);
      return [];
    }
  }

  // Set a setting value
  async set(key: string, value: any, category?: string, description?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key,
          value,
          category,
          description
        }, {
          onConflict: 'key'
        });

      if (!error) {
        this.cache.set(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }

  // Bulk update settings
  async bulkUpdate(settings: Array<{ key: string; value: any }>): Promise<boolean> {
    try {
      const updates = settings.map(s => ({
        key: s.key,
        value: s.value
      }));

      const { error } = await this.supabase
        .from('system_settings')
        .upsert(updates, {
          onConflict: 'key'
        });

      if (!error) {
        settings.forEach(s => this.cache.set(s.key, s.value));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      return false;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Helper functions for common settings
export const getSiteName = () => configService.get('site_name', 'Course Builder');
export const getSiteUrl = () => configService.get('site_url', process.env.NEXT_PUBLIC_APP_URL);
export const getAdminEmail = () => configService.get('admin_email', 'admin@coursebuilder.com');
export const getSupportEmail = () => configService.get('support_email', 'support@coursebuilder.com');
export const getTimezone = () => configService.get('timezone', 'America/New_York');
export const getCurrency = () => configService.get('currency', 'USD');
export const isMaintenanceMode = () => configService.get('maintenance_mode', false);
export const getMaintenanceMessage = () => configService.get('maintenance_message', 'We are currently performing maintenance.');