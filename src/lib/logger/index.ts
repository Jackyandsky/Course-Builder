/**
 * Winston Logger Service
 * Centralized logging system for the Course Builder application
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './config';
import { formatters } from './formatters';
import { createTransports } from './transports';
import { LogContext, LogLevel } from './types';
// import { SecurityMonitor } from './security-monitor';
// import { ComprehensiveMonitor } from './comprehensive-monitor';
import { NextRequest } from 'next/server';

class LoggerService {
  private logger: winston.Logger;
  private static instance: LoggerService;
  private requestIdMap: Map<string, string> = new Map();
  // private securityMonitor: SecurityMonitor;
  // private comprehensiveMonitor: ComprehensiveMonitor;

  private constructor() {
    // Prevent multiple instances during hot reload
    if ((global as any).__winstonLoggerInstance) {
      // Return existing instance
      Object.assign(this, (global as any).__winstonLoggerInstance);
      return this;
    }

    this.logger = winston.createLogger({
      level: config.level,
      format: formatters.combined,
      defaultMeta: { 
        service: config.serviceName,
        environment: config.environment 
      },
      transports: createTransports(),
      exitOnError: false,
      silent: config.silent
    });

    // DISABLED: Console mirroring causes 5x duplication due to Next.js worker processes
    // Each worker process creates its own logger instance and wraps console
    // Since console output is already visible in terminal, we'll use explicit logging instead
    // this.setupConsoleMirror();

    // Log system start
    this.logger.info('SYSTEM_STARTED', {
      service: config.serviceName,
      environment: config.environment,
      timestamp: new Date().toISOString()
    });

    // Handle uncaught exceptions and rejections in production
    if (config.environment === 'production') {
      this.logger.exceptions.handle(
        new winston.transports.File({ 
          filename: 'logs/exceptions.log',
          format: formatters.error
        })
      );

      this.logger.rejections.handle(
        new winston.transports.File({ 
          filename: 'logs/rejections.log',
          format: formatters.error
        })
      );
    }

    // Store instance in global for hot reload persistence
    (global as any).__winstonLoggerInstance = this;
  }

  public static getInstance(): LoggerService {
    // Use global to persist across hot reloads
    if (!(global as any).__winstonLoggerInstance) {
      new LoggerService(); // Constructor handles storing in global
    }
    return (global as any).__winstonLoggerInstance;
  }

  // Core logging methods with structured context
  public error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public verbose(message: string, context?: LogContext): void {
    this.log('verbose', message, context);
  }

  // Specialized logging methods
  public api(endpoint: string, method: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info('API Request', {
      ...context,
      api: {
        endpoint,
        method,
        statusCode,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  }

  public database(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug('Database Operation', {
      ...context,
      database: {
        operation,
        table,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  }

  public auth(event: string, userId?: string, context?: LogContext): void {
    this.info('Authentication Event', {
      ...context,
      auth: {
        event,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  public performance(metric: string, value: number, unit: string = 'ms', context?: LogContext): void {
    this.debug('Performance Metric', {
      ...context,
      performance: {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Request tracking
  public setRequestId(key: string, requestId: string): void {
    this.requestIdMap.set(key, requestId);
  }

  public getRequestId(key: string): string | undefined {
    return this.requestIdMap.get(key);
  }

  public clearRequestId(key: string): void {
    this.requestIdMap.delete(key);
  }

  // Stream logs for real-time monitoring
  public stream(options?: any): NodeJS.ReadableStream {
    return (this.logger as any).stream(options);
  }

  // Query historical logs
  public async query(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      (this.logger as any).query(options, (err: Error | null, results: any) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Private helper method
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const requestId = context?.requestId || this.getRequestId('current');
    
    this.logger.log(level, message, {
      ...context,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  // SIMPLE CONSOLE MIRROR - CAPTURE CONSOLE OUTPUT TO FILES
  
  // Simple console mirror - capture what you see in console
  private setupConsoleMirror(): void {
    if (typeof window !== 'undefined') return; // Only on server-side
    
    // Use process.pid to ensure only one process sets up console mirroring
    const currentPid = process.pid;
    
    // Check if this process already set up console mirroring
    if ((global as any).__consoleMirrorPid === currentPid) {
      return; // This process already set up console mirroring
    }
    
    // Check if console was already wrapped by ANY process
    if ((console.log as any).__isWrappedByWinston) {
      // Console is already wrapped, don't wrap again
      // But still mark this process as aware
      (global as any).__consoleMirrorPid = currentPid;
      return;
    }
    
    // Mark that this process is setting up console mirroring
    (global as any).__consoleMirrorPid = currentPid;
    
    // Store the TRULY original console methods (not wrapped versions)
    const originalConsole = {
      log: (console.log as any).__trueOriginal || console.log,
      error: (console.error as any).__trueOriginal || console.error,
      warn: (console.warn as any).__trueOriginal || console.warn,
      info: (console.info as any).__trueOriginal || console.info
    };

    // Enhanced console.log mirror
    const newConsoleLog = (...args: any[]) => {
      try {
        originalConsole.log(...args);
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return `[Object: ${Object.prototype.toString.call(arg)}]`;
            }
          }
          return String(arg);
        }).join(' ');
        this.logger.info(`CONSOLE: ${message}`);
      } catch (e) {
        originalConsole.error('Console log mirror error:', e);
      }
    };
    (newConsoleLog as any).__trueOriginal = originalConsole.log;
    (newConsoleLog as any).__isWrappedByWinston = true;
    console.log = newConsoleLog;

    // Enhanced console.error mirror with better error handling
    const newConsoleError = (...args: any[]) => {
      try {
        originalConsole.error(...args);
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              // Handle Error objects specially
              if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
              }
              // Handle objects with error-like properties
              if (arg.message || arg.error || arg.stack) {
                return JSON.stringify({
                  message: arg.message,
                  error: arg.error,
                  stack: arg.stack,
                  name: arg.name,
                  ...arg
                }, null, 2);
              }
              // Enhanced object serialization to capture more details
              return JSON.stringify(arg, (key, value) => {
                // Handle functions
                if (typeof value === 'function') {
                  return `[Function: ${value.name || 'anonymous'}]`;
                }
                // Handle undefined
                if (value === undefined) {
                  return '[undefined]';
                }
                // Handle symbols
                if (typeof value === 'symbol') {
                  return value.toString();
                }
                return value;
              }, 2);
            } catch (e) {
              // If JSON.stringify fails, try to extract key information
              const objString = Object.prototype.toString.call(arg);
              const keys = Object.keys(arg).slice(0, 10); // First 10 keys
              return `[${objString}] Keys: ${keys.join(', ')}`;
            }
          }
          return String(arg);
        }).join(' ');
        
        this.logger.error(`CONSOLE_ERROR: ${message}`, {
          console: true,
          type: 'error',
          timestamp: new Date().toISOString(),
          raw_args: args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (e) {
                return `[Object: ${Object.prototype.toString.call(arg)}]`;
              }
            }
            return String(arg);
          })
        });
      } catch (e) {
        originalConsole.error('Console error mirror failed:', e);
      }
    };
    (newConsoleError as any).__trueOriginal = originalConsole.error;
    (newConsoleError as any).__isWrappedByWinston = true;
    console.error = newConsoleError;

    // Enhanced console.warn mirror
    const newConsoleWarn = (...args: any[]) => {
      try {
        originalConsole.warn(...args);
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return `[Object: ${Object.prototype.toString.call(arg)}]`;
            }
          }
          return String(arg);
        }).join(' ');
        this.logger.warn(`CONSOLE_WARN: ${message}`);
      } catch (e) {
        originalConsole.error('Console warn mirror error:', e);
      }
    };
    (newConsoleWarn as any).__trueOriginal = originalConsole.warn;
    (newConsoleWarn as any).__isWrappedByWinston = true;
    console.warn = newConsoleWarn;

    // Enhanced console.info mirror
    const newConsoleInfo = (...args: any[]) => {
      try {
        originalConsole.info(...args);
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return `[Object: ${Object.prototype.toString.call(arg)}]`;
            }
          }
          return String(arg);
        }).join(' ');
        this.logger.info(`CONSOLE_INFO: ${message}`);
      } catch (e) {
        originalConsole.error('Console info mirror error:', e);
      }
    };
    (newConsoleInfo as any).__trueOriginal = originalConsole.info;
    (newConsoleInfo as any).__isWrappedByWinston = true;
    console.info = newConsoleInfo;

    // Track how many times console has been wrapped
    if (!(global as any).__consoleWrapCount) {
      (global as any).__consoleWrapCount = 0;
    }
    (global as any).__consoleWrapCount++;
    
    // Log that console mirror is active with wrap count and PID
    this.logger.info('CONSOLE_MIRROR_ACTIVE', {
      message: 'Console mirroring initialized successfully',
      wrapCount: (global as any).__consoleWrapCount,
      pid: currentPid,
      timestamp: new Date().toISOString()
    });
  }

  // Manual logging methods for API routes
  public logAPIRequest(request: NextRequest, startTime: number): void {
    const duration = Date.now() - startTime;
    this.logger.info('API_REQUEST', {
      method: request.method,
      url: request.url,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  public logAPIResponse(request: NextRequest, response: any, startTime: number, userId?: string): void {
    const duration = Date.now() - startTime;
    this.logger.info('API_RESPONSE', {
      method: request.method,
      url: request.url,
      status: response.status,
      duration,
      userId,
      timestamp: new Date().toISOString()
    });
  }


  // Clean up resources
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();

// Export types for external use
export type { LogContext, LogLevel } from './types';