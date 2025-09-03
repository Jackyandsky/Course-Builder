import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Unified Supabase client helper using middleware client pattern
 * This replaces all other client creation patterns for consistency
 */
export function getMiddlewareSupabaseClient(req?: NextRequest, res?: NextResponse) {
  // For server-side contexts where req/res are available
  if (req && res) {
    return createMiddlewareClient<Database>({ req, res });
  }
  
  // For contexts without explicit req/res, create minimal versions
  const dummyReq = req || new NextRequest('http://localhost');
  const dummyRes = res || NextResponse.next();
  
  return createMiddlewareClient<Database>({ req: dummyReq, res: dummyRes });
}

// Alias for backward compatibility
export const supabase = getMiddlewareSupabaseClient();