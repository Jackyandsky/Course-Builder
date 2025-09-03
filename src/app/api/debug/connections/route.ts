import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if current user is admin
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
    
    // Test concurrent connections
    const concurrencyTest = await testConcurrentConnections(supabase);
    
    // Get database statistics
    const { data: dbStats, error: dbError } = await supabase
      .rpc('get_db_stats')
      .single();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      concurrencyTest,
      databaseStats: dbStats || { error: dbError?.message },
      recommendations: [
        'Use singleton pattern for client components',
        'Batch queries when possible',
        'Implement connection retry logic',
        'Monitor error rates'
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

async function testConcurrentConnections(supabase: any) {
  const testCount = 10;
  const results = {
    totalRequests: testCount,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
    errors: [] as string[]
  };
  
  const promises = Array.from({ length: testCount }, async (_, i) => {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (error) throw error;
      
      results.successful++;
      return Date.now() - startTime;
    } catch (error: any) {
      results.failed++;
      results.errors.push(error.message);
      return null;
    }
  });
  
  const responseTimes = await Promise.all(promises);
  const validTimes = responseTimes.filter(t => t !== null) as number[];
  
  if (validTimes.length > 0) {
    results.avgResponseTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
  }
  
  return results;
}