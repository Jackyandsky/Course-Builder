/**
 * Winston Logger Configuration
 * Environment-based configuration for the logging system
 */

export interface LoggerConfig {
  level: string;
  environment: string;
  serviceName: string;
  silent: boolean;
  console: {
    enabled: boolean;
    level: string;
    colorize: boolean;
  };
  file: {
    enabled: boolean;
    level: string;
    filename: string;
    maxSize: string;
    maxFiles: string;
    datePattern: string;
    zippedArchive: boolean;
  };
  error: {
    enabled: boolean;
    filename: string;
    level: string;
  };
  realtime: {
    enabled: boolean;
    port: number;
  };
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

export const config: LoggerConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  environment: process.env.NODE_ENV || 'development',
  serviceName: 'course-builder',
  silent: isTest || process.env.LOG_SILENT === 'true',
  
  console: {
    enabled: isDevelopment || process.env.LOG_CONSOLE === 'true',
    level: process.env.LOG_CONSOLE_LEVEL || 'debug',
    colorize: isDevelopment
  },
  
  file: {
    enabled: !isTest && (process.env.LOG_FILE !== 'false'),
    level: process.env.LOG_FILE_LEVEL || 'info',
    filename: process.env.LOG_FILE_NAME || 'logs/application-%DATE%.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true
  },
  
  error: {
    enabled: !isTest,
    filename: 'logs/error.log',
    level: 'error'
  },
  
  realtime: {
    enabled: process.env.LOG_REALTIME === 'true',
    port: parseInt(process.env.LOG_REALTIME_PORT || '3001', 10)
  }
};