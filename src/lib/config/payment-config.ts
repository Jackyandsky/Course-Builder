/**
 * Payment Configuration Management
 * 
 * This module demonstrates the hybrid approach for managing sensitive configurations:
 * - Critical secrets come from environment variables
 * - Business settings come from database
 * - Database values can override non-sensitive defaults
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export interface PaymentConfig {
  // From environment variables (critical secrets)
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  
  // From database (public/configurable)
  stripePublishableKey: string;
  stripeMode: 'test' | 'live';
  currency: string;
  taxEnabled: boolean;
  taxPercentage: number;
  paymentMethods: string[];
}

/**
 * Get payment configuration with proper security separation
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  
  // 1. Get critical secrets from environment variables ONLY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeSecretKey || !stripeWebhookSecret) {
    throw new Error('Critical payment secrets not configured in environment variables');
  }
  
  // 2. Get business settings from database
  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('category', 'payment')
    .in('key', [
      'stripe_publishable_key',
      'stripe_mode', 
      'currency',
      'tax_enabled',
      'tax_percentage',
      'payment_methods'
    ]);
  
  // 3. Build configuration with proper defaults
  const dbSettings = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>) || {};
  
  return {
    // Critical secrets - NEVER from database
    stripeSecretKey,
    stripeWebhookSecret,
    
    // Public/configurable settings - safe in database
    stripePublishableKey: dbSettings.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    stripeMode: dbSettings.stripe_mode || 'test',
    currency: dbSettings.currency || 'CAD',
    taxEnabled: dbSettings.tax_enabled || false,
    taxPercentage: dbSettings.tax_percentage || 0,
    paymentMethods: dbSettings.payment_methods || ['card']
  };
}

/**
 * Update non-sensitive payment settings
 * NEVER accepts or stores secret keys
 */
export async function updatePaymentSettings(settings: {
  stripePublishableKey?: string;
  stripeMode?: 'test' | 'live';
  currency?: string;
  taxEnabled?: boolean;
  taxPercentage?: number;
  paymentMethods?: string[];
}) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  
  // Explicitly prevent storing secrets
  const allowedKeys = [
    'stripe_publishable_key',
    'stripe_mode',
    'currency', 
    'tax_enabled',
    'tax_percentage',
    'payment_methods'
  ];
  
  const updates = Object.entries(settings)
    .filter(([key]) => allowedKeys.includes(key))
    .map(([key, value]) => ({
      key,
      value,
      category: 'payment',
      is_sensitive: false, // Never sensitive in database
      updated_at: new Date().toISOString()
    }));
  
  for (const update of updates) {
    await supabase
      .from('system_settings')
      .upsert(update, { onConflict: 'key' });
  }
}

/**
 * Get Stripe instance with proper configuration
 * This is a synchronous version that uses environment variables only
 * DEPRECATED: Use getStripeAsync() instead for settings-based control
 */
export function getStripe() {
  const Stripe = require('stripe');
  
  // This function is kept for backward compatibility
  // It will use test keys by default for safety
  const secretKey = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('Stripe secret key not configured in environment variables');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

/**
 * Get Stripe instance with proper security
 * Secret keys come from environment variables ONLY
 * Mode setting comes from database for admin control
 */
export async function getStripeAsync() {
  const Stripe = require('stripe');
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  
  // Get stripe mode from database (non-sensitive setting)
  const { data: modeSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('category', 'payment')
    .eq('key', 'stripe_mode')
    .single();
  
  // Determine which mode to use (controlled by admin settings)
  const stripeMode = modeSetting?.value || 'test'; // Default to test for safety
  
  // Get secret key from environment variables ONLY (never from database)
  let secretKey: string | undefined;
  
  if (stripeMode === 'live') {
    // Use live key for production
    secretKey = process.env.STRIPE_LIVE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Stripe LIVE mode is enabled but STRIPE_LIVE_SECRET_KEY is not set in environment variables');
    }
  } else {
    // Use test key for test mode
    secretKey = process.env.STRIPE_TEST_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('Stripe TEST mode is enabled but STRIPE_TEST_SECRET_KEY is not set in environment variables');
    }
  }
  
  console.log(`Using Stripe in ${stripeMode.toUpperCase()} mode`);
  
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

/**
 * Security validation for Stripe webhooks
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured in environment variables');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}