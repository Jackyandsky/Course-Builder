import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.logAuthFailure(request, 'No authentication token', undefined);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      logger.logAuthFailure(request, 'Non-admin accessing intelligence endpoint', user.id);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Log admin access for security monitoring
    logger.logUserAction(user.id, 'admin_intelligence_access', {
      endpoint: '/api/admin/monitoring/intelligence',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Get intelligent debugging and security data
    const intelligence = logger.getDebugIntelligence();
    
    // Enhanced intelligence data
    const enhancedIntelligence = {
      ...intelligence,
      claude_analysis: {
        system_status: intelligence.debug_patterns.length > 0 ? 'NEEDS_ATTENTION' : 'HEALTHY',
        critical_issues: intelligence.debug_patterns.filter((p: any) => p.frequency > 10),
        security_alerts: intelligence.security_summary.failed_auth_attempts > 5 ? 'HIGH' : 'NORMAL',
        automated_recommendations: generateAutomatedRecommendations(intelligence),
        next_actions: generateNextActions(intelligence)
      },
      log_samples: await getRecentIntelligentLogs()
    };

    logger.info('Intelligence data accessed', {
      user_id: user.id,
      data_size: JSON.stringify(enhancedIntelligence).length,
      patterns_count: intelligence.debug_patterns.length,
      security_events: intelligence.security_summary.total_security_events
    });

    return NextResponse.json(enhancedIntelligence);
    
  } catch (error: any) {
    logger.detectError(error, {
      endpoint: '/api/admin/monitoring/intelligence',
      operation: 'get_intelligence_data'
    });
    
    return NextResponse.json(
      { error: 'Failed to get intelligence data', details: error.message },
      { status: 500 }
    );
  }
}

// Real-time streaming endpoint for continuous monitoring
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { query_type, filters } = body;

    let results;
    switch (query_type) {
      case 'recent_errors':
        results = await logger.queryIntelligentLogs({
          level: 'error',
          category: 'error',
          timeRange: filters?.timeRange
        });
        break;
        
      case 'security_events':
        results = await logger.queryIntelligentLogs({
          category: 'security',
          timeRange: filters?.timeRange
        });
        break;
        
      case 'user_actions':
        results = await logger.queryIntelligentLogs({
          category: 'user',
          userId: filters?.userId,
          timeRange: filters?.timeRange
        });
        break;
        
      case 'api_performance':
        results = await logger.queryIntelligentLogs({
          category: 'api',
          timeRange: filters?.timeRange
        });
        break;
        
      default:
        results = await logger.queryIntelligentLogs(filters || {});
    }

    logger.logUserAction(user.id, 'intelligence_query', {
      query_type,
      filters,
      results_count: results?.length || 0
    });

    return NextResponse.json({
      query_type,
      filters,
      results: results || [],
      count: results?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    logger.detectError(error, {
      endpoint: '/api/admin/monitoring/intelligence',
      operation: 'query_logs'
    });
    
    return NextResponse.json(
      { error: 'Failed to query logs', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function generateAutomatedRecommendations(intelligence: any): string[] {
  const recommendations: string[] = [];
  
  if (intelligence.debug_patterns.length > 5) {
    recommendations.push('High error pattern frequency detected - Implement error boundaries');
  }
  
  if (intelligence.security_summary.failed_auth_attempts > 10) {
    recommendations.push('Unusual authentication failures - Enable rate limiting');
  }
  
  if (intelligence.system_health.memory_usage.heapUsed > 100 * 1024 * 1024) {
    recommendations.push('High memory usage detected - Consider implementing memory optimization');
  }
  
  intelligence.debug_patterns.forEach((pattern: any) => {
    if (pattern.frequency > 3 && pattern.autoFix) {
      recommendations.push(`Auto-fixable issue detected: ${pattern.pattern.substring(0, 50)}...`);
    }
  });
  
  return recommendations;
}

function generateNextActions(intelligence: any): string[] {
  const actions: string[] = [];
  
  // Critical security actions
  if (intelligence.security_summary.failed_auth_attempts > 20) {
    actions.push('URGENT: Investigate potential brute force attack');
  }
  
  // Performance actions  
  if (intelligence.system_health.active_requests > 50) {
    actions.push('Monitor request queue - potential bottleneck');
  }
  
  // Debug actions
  const criticalPatterns = intelligence.debug_patterns.filter((p: any) => p.frequency > 10);
  if (criticalPatterns.length > 0) {
    actions.push(`Fix high-frequency errors: ${criticalPatterns.length} patterns need attention`);
  }
  
  return actions;
}

async function getRecentIntelligentLogs(): Promise<any[]> {
  try {
    return await logger.queryIntelligentLogs({
      timeRange: {
        start: new Date(Date.now() - 3600000).toISOString(), // Last hour
        end: new Date().toISOString()
      }
    });
  } catch (error) {
    return [];
  }
}