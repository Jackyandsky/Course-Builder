import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get integration settings from database
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'google_books_api_key', 
        'google_books_enabled',
        'supabase_url',
        'supabase_anon_key',
        'supabase_service_role_key'
      ])
      .eq('category', 'integrations');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Convert array to object
    const settingsObj: any = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Return settings with sensitive data masked
    const response = {
      google_books_api_key: settingsObj.google_books_api_key ? '••••••••••••••••' : '',
      google_books_enabled: settingsObj.google_books_enabled || false,
      supabase_url: settingsObj.supabase_url ? '••••••••••••••••' : '',
      supabase_anon_key: settingsObj.supabase_anon_key ? '••••••••••••••••' : '',
      supabase_service_role_key: settingsObj.supabase_service_role_key ? '••••••••••••••••' : '',
      _has_google_books_key: !!settingsObj.google_books_api_key,
      _has_supabase_config: !!(settingsObj.supabase_url && settingsObj.supabase_anon_key)
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Integration settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      google_books_api_key, 
      google_books_enabled,
      supabase_url,
      supabase_anon_key,
      supabase_service_role_key
    } = body;

    // Prepare settings to update
    const settingsToUpdate = [];
    const maskedValue = '••••••••••••••••';

    // Only update API key if it's not the masked version
    if (google_books_api_key && google_books_api_key !== maskedValue) {
      settingsToUpdate.push({
        key: 'google_books_api_key',
        value: google_books_api_key,
        category: 'integrations'
      });
    }

    // Always update enabled status
    settingsToUpdate.push({
      key: 'google_books_enabled',
      value: google_books_enabled,
      category: 'integrations'
    });

    // Update Supabase settings only if they're not masked
    if (supabase_url && supabase_url !== maskedValue) {
      settingsToUpdate.push({
        key: 'supabase_url',
        value: supabase_url,
        category: 'integrations'
      });
    }

    if (supabase_anon_key && supabase_anon_key !== maskedValue) {
      settingsToUpdate.push({
        key: 'supabase_anon_key',
        value: supabase_anon_key,
        category: 'integrations'
      });
    }

    if (supabase_service_role_key && supabase_service_role_key !== maskedValue) {
      settingsToUpdate.push({
        key: 'supabase_service_role_key',
        value: supabase_service_role_key,
        category: 'integrations'
      });
    }

    // Update settings using upsert
    for (const setting of settingsToUpdate) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          { ...setting, updated_at: new Date().toISOString() },
          { 
            onConflict: 'key',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error('Error updating setting:', setting.key, error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update integration settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}