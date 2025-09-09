/**
 * Request Logger Middleware
 * Logs HTTP requests and responses for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { v4 as uuidv4 } from 'uuid';

export interface RequestLogContext {
  requestId: string;
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  ip?: string;
  userAgent?: string;
  userId?: string;
  startTime: number;
}

/**
 * Extract request metadata for logging
 */
function extractRequestMetadata(request: NextRequest): Partial<RequestLogContext> {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    // Skip sensitive headers
    if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  return {
    method: request.method,
    url: request.url,
    path: url.pathname,
    query,
    headers,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined
  };
}

/**
 * Log the API request
 */
export function logRequest(request: NextRequest, context?: RequestLogContext): string {
  const requestId = context?.requestId || uuidv4();
  const metadata = extractRequestMetadata(request);
  
  logger.info(`API Request: ${metadata.method} ${metadata.path}`, {
    requestId,
    api: {
      endpoint: metadata.path || '',
      method: metadata.method || '',
      statusCode: 0, // Will be updated in response
      duration: 0, // Will be updated in response
      query: metadata.query,
      timestamp: new Date().toISOString()
    },
    ip: metadata.ip,
    userAgent: metadata.userAgent
  });

  return requestId;
}

/**
 * Log the API response
 */
export function logResponse(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  startTime: number,
  error?: Error
): void {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);
  const statusCode = response.status;
  
  const logContext = {
    requestId,
    api: {
      endpoint: url.pathname,
      method: request.method,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    }
  };

  // Record metrics
  metricsCollector.recordRequest(url.pathname, request.method, duration, statusCode);

  if (error) {
    logger.error(`API Error: ${request.method} ${url.pathname}`, {
      ...logContext,
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        statusCode
      }
    });
    metricsCollector.recordError('error', `API Error: ${error.message}`);
  } else if (statusCode >= 400) {
    logger.warn(`API Client Error: ${request.method} ${url.pathname}`, logContext);
    metricsCollector.recordError('warn', `API Client Error: ${statusCode}`);
  } else {
    logger.info(`API Response: ${request.method} ${url.pathname}`, logContext);
  }

  // Log performance metrics for slow requests
  if (duration > 1000) {
    logger.performance('slow_api_request', duration, 'ms', {
      requestId,
      endpoint: url.pathname,
      method: request.method
    });
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withRequestLogging<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    const requestId = logRequest(request);
    
    // Store request ID for use in the handler
    logger.setRequestId('current', requestId);
    
    try {
      const response = await handler(...args);
      logResponse(request, response, requestId, startTime);
      return response;
    } catch (error) {
      const errorResponse = NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId 
        },
        { status: 500 }
      );
      logResponse(request, errorResponse, requestId, startTime, error as Error);
      return errorResponse;
    } finally {
      logger.clearRequestId('current');
    }
  };
}

/**
 * Express-style middleware for Next.js API routes
 */
export async function requestLogger(
  req: NextRequest,
  res: NextResponse,
  next: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  const requestId = logRequest(req);
  
  logger.setRequestId('current', requestId);
  
  try {
    await next();
    logResponse(req, res, requestId, startTime);
  } catch (error) {
    logResponse(req, res, requestId, startTime, error as Error);
    throw error;
  } finally {
    logger.clearRequestId('current');
  }
}