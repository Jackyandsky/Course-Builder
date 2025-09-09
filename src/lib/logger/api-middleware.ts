/**
 * API Logging Middleware
 * Logs all API requests, responses, and errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './index';

interface RequestContext {
  method: string;
  url: string;
  pathname: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  ip?: string;
  userAgent?: string;
  startTime: number;
}

export function withApiLogging<T extends any[]>(
  handler: (...args: T) => Promise<Response> | Response
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    
    // Extract request context
    const context: RequestContext = {
      method: request.method,
      url: request.url,
      pathname: new URL(request.url).pathname,
      query: Object.fromEntries(new URL(request.url).searchParams),
      headers: Object.fromEntries(request.headers.entries()),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      startTime
    };


    // Log request start
    logger.info('API_REQUEST_START', {
      type: 'api_request',
      method: context.method,
      url: context.url,
      pathname: context.pathname,
      query: context.query,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString()
    });

    try {
      // Execute the handler
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      // Log successful response
      logger.info('API_REQUEST_SUCCESS', {
        type: 'api_response',
        method: context.method,
        pathname: context.pathname,
        status: response.status,
        statusText: response.statusText,
        duration,
        ip: context.ip,
        timestamp: new Date().toISOString()
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error response
      logger.error('API_REQUEST_ERROR', {
        type: 'api_error',
        method: context.method,
        pathname: context.pathname,
        duration,
        ip: context.ip,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        timestamp: new Date().toISOString()
      });

      // Re-throw the error so it's handled normally
      throw error;
    }
  };
}

// Helper function for manual API logging
export function logApiRequest(
  request: NextRequest,
  response: NextResponse | Response,
  startTime: number,
  error?: Error
) {
  const duration = Date.now() - startTime;
  const pathname = new URL(request.url).pathname;

  const baseContext = {
    method: request.method,
    pathname,
    duration,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error('API_REQUEST_ERROR', {
      ...baseContext,
      type: 'api_error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  } else {
    logger.info('API_REQUEST_SUCCESS', {
      ...baseContext,
      type: 'api_response',
      status: response.status,
      statusText: response.statusText || 'OK'
    });
  }
}