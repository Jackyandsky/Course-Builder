import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { supabaseMonitor } from '@/lib/supabase/monitor';
import { logger } from '@/lib/logger';
import { withRequestLogging } from '@/lib/utils/request-logger';
import { databaseAnalyzer } from '@/lib/monitoring/database-analyzer';

export const GET = withRequestLogging(async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    logger.info('Health check initiated');
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const dbStartTime = Date.now();
    
    // Test database connection
    const { error: dbError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Log database operation
    logger.database('SELECT', 'user_profiles', dbResponseTime, {
      metadata: { operation: 'health_check', success: !dbError }
    });
    
    // Analyze database query
    databaseAnalyzer.analyzeQuery(
      'SELECT count(*) FROM user_profiles LIMIT 1',
      dbResponseTime,
      { 
        table: 'user_profiles', 
        rows: 1, 
        cached: false 
      }
    );
    
    // Test auth service
    const authStartTime = Date.now();
    const { error: authError } = await supabase.auth.getSession();
    const authResponseTime = Date.now() - authStartTime;
    
    logger.auth('session_check', undefined, {
      metadata: { responseTime: authResponseTime, success: !authError }
    });
    
    // Get monitor stats
    const monitorStats = supabaseMonitor.getStats();
    
    const healthy = !dbError && !authError;
    const status = healthy ? 'healthy' : 'unhealthy';
    
    if (!healthy) {
      logger.warn('Health check failed', {
        metadata: {
          database: { error: dbError?.message },
          auth: { error: authError?.message }
        }
      });
    } else {
      logger.info('Health check completed successfully', {
        performance: {
          metric: 'health_check_total',
          value: Date.now() - startTime,
          unit: 'ms'
        }
      });
    }
    
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
    logger.error('Health check failed with exception', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    });
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});