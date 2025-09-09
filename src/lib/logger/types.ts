/**
 * Logger Type Definitions
 * Type definitions for the Winston logger service
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  
  // Error context
  error?: {
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
  };
  
  // API context
  api?: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
  };
  
  // Database context
  database?: {
    operation: string;
    table: string;
    duration: number;
    query?: string;
    params?: any[];
  };
  
  // Authentication context
  auth?: {
    event: string;
    userId?: string;
    role?: string;
    permissions?: string[];
  };
  
  // Performance context
  performance?: {
    metric: string;
    value: number;
    unit: string;
  };
  
  // Custom metadata
  metadata?: Record<string, any>;
  
  // Timestamp (auto-added)
  timestamp?: string;
}

export interface LogQuery {
  from?: Date;
  until?: Date;
  limit?: number;
  start?: number;
  order?: 'asc' | 'desc';
  fields?: string[];
  level?: LogLevel;
  userId?: string;
  requestId?: string;
}