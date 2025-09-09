/**
 * Database Analytics API
 * Provides database query analysis and optimization recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { databaseAnalyzer } from '@/lib/monitoring/database-analyzer';
import { logger } from '@/lib/logger';
import { withRequestLogging } from '@/lib/utils/request-logger';

// GET /api/admin/monitoring/database - Get database analytics
export const GET = withRequestLogging(async (request: NextRequest) => {
  try {
    // Check admin authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.role !== 'admin') {
      logger.warn('Non-admin user attempted to access database analytics', { userId: user.id });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const hours = parseInt(searchParams.get('hours') || '24');

    let analytics;
    
    if (table) {
      // Get analytics for specific table
      const tableQueries = databaseAnalyzer.getQueriesByTable(table, hours);
      analytics = {
        table,
        hours,
        queries: tableQueries,
        summary: {
          total: tableQueries.length,
          slow: tableQueries.filter(q => q.executionTime > 1000).length,
          avgTime: tableQueries.length > 0 
            ? tableQueries.reduce((sum, q) => sum + q.executionTime, 0) / tableQueries.length 
            : 0
        }
      };
    } else {
      // Get overall database metrics
      analytics = databaseAnalyzer.getMetrics();
    }

    logger.info('Admin accessed database analytics', {
      userId: user.id,
      metadata: { table, hours, queryCount: analytics.totalQueries || analytics.queries?.length }
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to get database analytics', {
      error: { message: error.message, stack: error.stack }
    });
    
    return NextResponse.json({
      error: 'Failed to get database analytics',
      message: error.message
    }, { status: 500 });
  }
});

// POST /api/admin/monitoring/database/analyze - Analyze a specific query
export const POST = withRequestLogging(async (request: NextRequest) => {
  try {
    // Check admin authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !await isAdmin(user.id, supabase)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, executionTime, metadata } = body;

    if (!query || typeof executionTime !== 'number') {
      return NextResponse.json({ 
        error: 'Missing required fields: query, executionTime' 
      }, { status: 400 });
    }

    // Analyze the query
    const analysis = databaseAnalyzer.analyzeQuery(query, executionTime, metadata);

    logger.info('Admin submitted query for analysis', {
      userId: user.id,
      metadata: { 
        table: analysis.table,
        executionTime,
        suggestions: analysis.suggestions.length
      }
    });

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to analyze query', {
      error: { message: error.message, stack: error.stack }
    });
    
    return NextResponse.json({
      error: 'Failed to analyze query',
      message: error.message
    }, { status: 500 });
  }
});

// DELETE /api/admin/monitoring/database - Clean up old analytics data
export const DELETE = withRequestLogging(async (request: NextRequest) => {
  try {
    // Check admin authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !await isAdmin(user.id, supabase)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up old data
    databaseAnalyzer.cleanup();

    logger.info('Admin triggered database analytics cleanup', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Analytics data cleanup completed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to cleanup database analytics', {
      error: { message: error.message, stack: error.stack }
    });
    
    return NextResponse.json({
      error: 'Failed to cleanup analytics',
      message: error.message
    }, { status: 500 });
  }
});

async function isAdmin(userId: string, supabase: any): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}