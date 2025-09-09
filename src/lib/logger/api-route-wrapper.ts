/**
 * API Route Wrapper with Automatic Logging
 * Wraps API route handlers to automatically add logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from './api-middleware';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

interface APIRouteHandlers {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  DELETE?: RouteHandler;
  PATCH?: RouteHandler;
  HEAD?: RouteHandler;
  OPTIONS?: RouteHandler;
}

/**
 * Wraps all API route handlers with automatic logging
 * Usage:
 * 
 * export const { GET, POST } = withLogging({
 *   GET: async (request) => {
 *     // your handler logic
 *   },
 *   POST: async (request) => {
 *     // your handler logic  
 *   }
 * });
 */
export function withLogging(handlers: APIRouteHandlers): APIRouteHandlers {
  const wrappedHandlers: APIRouteHandlers = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler && typeof handler === 'function') {
      wrappedHandlers[method as HTTPMethod] = withApiLogging(handler);
    }
  }

  return wrappedHandlers;
}

/**
 * Single handler wrapper for individual methods
 */
export function withLoggingSingle<T extends RouteHandler>(handler: T): T {
  return withApiLogging(handler) as T;
}