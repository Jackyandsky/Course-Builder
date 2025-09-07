import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// HEAD - Check cache version (public)
export async function HEAD(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get packages directly from database
    const { data: packages, error } = await supabase
      .from('packages')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    const version = btoa(JSON.stringify(packages || [])).substring(0, 16);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Cache-Version': version,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Cache version check error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// POST - Invalidate client-side caches (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate new cache version
    const newCacheVersion = Date.now().toString();
    
    return NextResponse.json({ 
      cacheVersion: newCacheVersion,
      message: 'Cache invalidation signal sent' 
    }, {
      headers: {
        'X-Cache-Version': newCacheVersion,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}