/**
 * WebSocket API for Real-time Monitoring Dashboard
 * Provides real-time metrics streaming via Server-Sent Events (SSE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { logger } from '@/lib/logger';
import { withRequestLogging } from '@/lib/utils/request-logger';

// GET /api/admin/monitoring/websocket - Stream real-time metrics
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
      logger.warn('Non-admin user attempted to access monitoring stream', { userId: user.id });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.info('Admin started monitoring stream', { userId: user.id });

    // Create Server-Sent Events stream
    const encoder = new TextEncoder();
    let intervalId: NodeJS.Timeout;
    let alertListenerId: string;
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial metrics
        const currentMetrics = metricsCollector.getCurrentMetrics();
        if (currentMetrics) {
          const data = JSON.stringify({ 
            type: 'metrics', 
            data: currentMetrics 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // Send heartbeat every 30 seconds
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`));

        // Set up real-time metrics streaming
        intervalId = setInterval(() => {
          try {
            const metrics = metricsCollector.getCurrentMetrics();
            if (metrics) {
              const data = JSON.stringify({ 
                type: 'metrics', 
                data: metrics 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error) {
            logger.error('Error streaming metrics', {
              error: { message: (error as Error).message }
            });
          }
        }, 5000); // Every 5 seconds

        // Set up alert streaming
        const alertListener = (alert: any) => {
          try {
            const data = JSON.stringify({ 
              type: 'alert', 
              data: alert 
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            logger.error('Error streaming alert', {
              error: { message: (error as Error).message }
            });
          }
        };

        metricsCollector.on('alert', alertListener);
        alertListenerId = 'alert-listener'; // Simplified ID tracking

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          metricsCollector.off('alert', alertListener);
          controller.close();
          logger.info('Admin monitoring stream disconnected', { userId: user.id });
        });
      },

      cancel() {
        if (intervalId) clearInterval(intervalId);
        if (alertListenerId) {
          metricsCollector.removeAllListeners('alert');
        }
        logger.info('Admin monitoring stream cancelled', { userId: user.id });
      }
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error: any) {
    logger.error('Failed to start monitoring stream', {
      error: { message: error.message, stack: error.stack }
    });
    
    return NextResponse.json({
      error: 'Failed to start monitoring stream',
      message: error.message
    }, { status: 500 });
  }
});

// POST /api/admin/monitoring/websocket - Send commands to monitoring system
export const POST = withRequestLogging(async (request: NextRequest) => {
  try {
    // Check admin authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !await isAdmin(user.id, supabase)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { command, data } = body;

    logger.info('Admin sent monitoring command', {
      userId: user.id,
      metadata: { command, data }
    });

    switch (command) {
      case 'update_alert_rule':
        if (data.id && data.updates) {
          metricsCollector.updateAlertRule(data.id, data.updates);
          return NextResponse.json({ success: true });
        }
        break;

      case 'get_alert_rules':
        const rules = metricsCollector.getAlertRules();
        return NextResponse.json({ rules });

      case 'get_historical_metrics':
        const minutes = data.minutes || 60;
        const historical = metricsCollector.getHistoricalMetrics(minutes);
        return NextResponse.json({ metrics: historical });

      case 'trigger_test_alert':
        // Trigger a test alert for testing purposes
        metricsCollector.emit('alert', {
          rule: {
            id: 'test-alert',
            name: 'Test Alert',
            severity: 'low'
          },
          value: 100,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Unknown command' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid command data' }, { status: 400 });

  } catch (error: any) {
    logger.error('Failed to process monitoring command', {
      error: { message: error.message, stack: error.stack }
    });
    
    return NextResponse.json({
      error: 'Failed to process command',
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