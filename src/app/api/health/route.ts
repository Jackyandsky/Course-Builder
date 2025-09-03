import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { supabaseMonitor } from '@/lib/supabase/monitor';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const startTime = Date.now();
    
    // Test database connection
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    const dbResponseTime = Date.now() - startTime;
    
    // Test auth service
    const authStartTime = Date.now();
    const { error: authError } = await supabase.auth.getSession();
    const authResponseTime = Date.now() - authStartTime;
    
    // Get monitor stats
    const monitorStats = supabaseMonitor.getStats();
    
    const healthy = !dbError && !authError;
    const status = healthy ? 'healthy' : 'unhealthy';
    
    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbError ? 'down' : 'up',
          responseTime: dbResponseTime,
          error: dbError?.message
        },
        auth: {
          status: authError ? 'down' : 'up',
          responseTime: authResponseTime,
          error: authError?.message
        }
      },
      metrics: {
        requestCount: monitorStats.requestCount,
        errorCount: monitorStats.errorCount,
        errorRate: monitorStats.errorRate,
        uptime: monitorStats.uptime
      }
    }, {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}