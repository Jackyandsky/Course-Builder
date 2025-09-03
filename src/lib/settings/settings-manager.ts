/**
 * Unified Settings Manager
 * 
 * Single source of truth for all application settings using system_settings table
 * Handles both sensitive and non-sensitive settings with proper encryption
 */

import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

// Encryption utilities
export function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

export function decrypt(text: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text;
  }
}

// Setting categories
export enum SettingCategory {
  GENERAL = 'general',
  PAYMENT = 'payment',
  COMPANY = 'company',
  REGIONAL = 'regional',
  SYSTEM = 'system',
  EMAIL = 'email',
  SECURITY = 'security',
  FEATURES = 'features'
}

// Setting interface
export interface Setting {
  key: string;
  value: any; // JSONB can store any type
  category: string;
  description?: string;
  is_sensitive?: boolean;
  is_public?: boolean;
  updated_by?: string;
  updated_at?: string;
}

/**
 * Get settings by category or all settings
 */
export async function getSettings(category?: string): Promise<Setting[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  let query = supabase
    .from('system_settings')
    .select('*')
    .order('category')
    .order('key');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching settings:', error);
    return [];
  }
  
  // Decrypt sensitive values
  return (data || []).map(setting => {
    if (setting.is_sensitive && setting.value && typeof setting.value === 'string') {
      try {
        setting.value = decrypt(setting.value);
      } catch (e) {
        // If decryption fails, return as-is
      }
    }
    return setting;
  });
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<any> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', key)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  let value = data.value;
  
  // Decrypt if sensitive
  if (data.is_sensitive && value && typeof value === 'string') {
    try {
      value = decrypt(value);
    } catch (e) {
      // If decryption fails, return as-is
    }
  }
  
  return value;
}

/**
 * Update or create a setting
 */
export async function upsertSetting(setting: Setting): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser();
  
  let value = setting.value;
  
  // Encrypt sensitive values
  if (setting.is_sensitive && value && typeof value === 'string') {
    value = encrypt(value);
  }
  
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: setting.key,
      value: value,
      category: setting.category || SettingCategory.GENERAL,
      description: setting.description,
      is_sensitive: setting.is_sensitive || false,
      is_public: setting.is_public || false,
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });
  
  if (error) {
    console.error('Error upserting setting:', error);
    return false;
  }
  
  return true;
}

/**
 * Bulk update settings
 */
export async function bulkUpsertSettings(settings: Setting[]): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser();
  
  const preparedSettings = settings.map(setting => {
    let value = setting.value;
    
    // Encrypt sensitive values
    if (setting.is_sensitive && value && typeof value === 'string') {
      value = encrypt(value);
    }
    
    return {
      key: setting.key,
      value: value,
      category: setting.category || SettingCategory.GENERAL,
      description: setting.description,
      is_sensitive: setting.is_sensitive || false,
      is_public: setting.is_public || false,
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    };
  });
  
  const { error } = await supabase
    .from('system_settings')
    .upsert(preparedSettings, {
      onConflict: 'key'
    });
  
  if (error) {
    console.error('Error bulk upserting settings:', error);
    return false;
  }
  
  return true;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { error } = await supabase
    .from('system_settings')
    .delete()
    .eq('key', key);
  
  if (error) {
    console.error('Error deleting setting:', error);
    return false;
  }
  
  return true;
}

/**
 * Get public settings (for non-authenticated users)
 */
export async function getPublicSettings(): Promise<Record<string, any>> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_public', true)
    .eq('is_sensitive', false);
  
  if (error || !data) {
    return {};
  }
  
  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Check if admin user
 */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return profile?.role === 'admin';
}