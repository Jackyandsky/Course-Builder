import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

// Get description for each setting
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    stripe_mode: 'Stripe environment mode (test or live)',
    stripe_test_publishable_key: 'Stripe test mode publishable key',
    stripe_test_secret_key: 'Stripe test mode secret key',
    stripe_live_publishable_key: 'Stripe live mode publishable key', 
    stripe_live_secret_key: 'Stripe live mode secret key',
    stripe_webhook_secret: 'Stripe webhook endpoint secret',
    payment_methods: 'Enabled payment methods',
    currency: 'Default currency for payments',
    tax_enabled: 'Whether tax calculation is enabled',
    tax_percentage: 'Default tax percentage',
    auto_tax: 'Use Stripe Tax for automatic calculation'
  };
  return descriptions[key] || '';
}

// Simple encryption for storing sensitive keys
function encrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return as-is if encryption fails
  }
}

function decrypt(text: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return as-is if decryption fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get payment settings from database
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'payment');

    // Convert to object and decrypt sensitive keys
    const settingsObj: any = {
      stripe_mode: 'test',
      stripe_test_publishable_key: '',
      stripe_test_secret_key: '',
      stripe_live_publishable_key: '',
      stripe_live_secret_key: '',
      stripe_webhook_secret: '',
      payment_methods: ['card'],
      currency: 'CAD',
      tax_enabled: false,
      tax_percentage: 0,
      auto_tax: false
    };

    if (settings) {
      settings.forEach((setting: any) => {
        // The value field is JSONB, so it can store any type
        const value = setting.value;
        
        if (setting.is_sensitive && value) {
          // Decrypt sensitive values that were encrypted as strings
          try {
            settingsObj[setting.key] = typeof value === 'string' ? decrypt(value) : value;
          } catch (e) {
            // If decryption fails, use the value as-is
            settingsObj[setting.key] = value;
          }
        } else {
          settingsObj[setting.key] = value;
        }
      });
    }

    // Also check environment variables (read-only)
    const envSettings = {
      stripe_mode: process.env.STRIPE_MODE || settingsObj.stripe_mode,
      stripe_test_publishable_key: process.env.STRIPE_TEST_PUBLISHABLE_KEY || settingsObj.stripe_test_publishable_key,
      stripe_live_publishable_key: process.env.STRIPE_LIVE_PUBLISHABLE_KEY || settingsObj.stripe_live_publishable_key,
      currency: process.env.PAYMENT_CURRENCY || settingsObj.currency
    };

    // Merge env settings (env takes precedence)
    Object.keys(envSettings).forEach(key => {
      if (envSettings[key as keyof typeof envSettings]) {
        settingsObj[key] = envSettings[key as keyof typeof envSettings];
      }
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error loading payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to load payment settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await request.json();

    // Prepare settings for database storage
    const settingsToStore = [];
    
    for (const [key, value] of Object.entries(settings)) {
      let storedValue = value;
      let isSensitive = false;
      
      // Encrypt sensitive keys
      if (key.includes('secret') || key.includes('key')) {
        storedValue = value ? encrypt(String(value)) : '';
        isSensitive = true;
      }

      settingsToStore.push({
        key,
        value: storedValue, // JSONB field can store any type
        category: 'payment',
        is_sensitive: isSensitive,
        description: getSettingDescription(key),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_public: false
      });
    }

    // Upsert settings to database
    for (const setting of settingsToStore) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(setting, { 
          onConflict: 'key',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Error saving setting:', setting.key, error);
        return NextResponse.json(
          { error: `Failed to save setting: ${setting.key}`, details: error.message },
          { status: 500 }
        );
      }
    }

    // Note: In production, environment variables should be updated through your hosting provider's dashboard
    // This is stored in the database for runtime access
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment settings saved successfully. Note: For production use, update environment variables in your hosting provider.'
    });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to save payment settings' },
      { status: 500 }
    );
  }
}