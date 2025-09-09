/**
 * Logger Middleware - Automatically captures ALL API requests/responses
 * Integrates with Next.js middleware to log everything without manual intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function withLogging(handler: Function) {
  return async function loggedHandler(request: NextRequest, ...args: any[]) {
    const startTime = Date.now();
    
    // Log the incoming request
    logger.logAPIRequest(request, startTime);
    
    try {
      // Execute the original handler
      const response = await handler(request, ...args);
      
      // Extract user ID if available from the response or request context
      let userId: string | undefined;
      try {
        // Try to get user ID from various sources
        if (response && typeof response.json === 'function') {
          const responseData = await response.json();
          userId = responseData.user?.id || responseData.user_id;
        }
      } catch (error) {
        // Ignore if we can't extract user ID
      }
      
      // Log the response
      logger.logAPIResponse(request, response, startTime, userId);
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Log the error
      logger.error('API_ERROR', {
        api: true,
        method: request.method,
        pathname: request.nextUrl.pathname,
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        duration,
        timestamp: new Date().toISOString(),
        source: 'api.error'
      });
      
      // Re-throw the error to maintain normal error handling
      throw error;
    }
  };
}

// Wrapper for API routes to automatically add logging
export function createLoggedAPIRoute(handler: Function) {
  return withLogging(handler);
}

// Middleware for automatic user action tracking
export function logUserAction(userId: string, action: string, request: NextRequest, additionalData: any = {}) {
  logger.logUserAction(userId, action, {
    pathname: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent'),
    ...additionalData
  });
}

// Middleware for automatic database operation logging
export function logDatabaseOperation(
  operation: string, 
  table: string, 
  query: string, 
  result: any, 
  duration: number, 
  userId?: string
) {
  logger.logDatabaseOperation(operation, table, query, result, duration, userId);
}

// Middleware for automatic auth event logging  
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'password_change' | 'session_refresh', 
  userId: string, 
  request: NextRequest,
  additionalDetails: any = {}
) {
  logger.logUserAuth(event, userId, {
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent'),
    pathname: request.nextUrl.pathname,
    ...additionalDetails
  });
}