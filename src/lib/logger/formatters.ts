/**
 * Winston Log Formatters
 * Custom formatters for different log output formats
 */

import winston from 'winston';
import { config } from './config';

const { combine, timestamp, errors, json, printf, colorize, metadata } = winston.format;

// Custom printf format for console output
const consoleFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  if (requestId) {
    msg += ` [${requestId}]`;
  }
  
  msg += `: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Development console format with colors
const devConsoleFormat = combine(
  timestamp({ format: 'HH:mm:ss.SSS' }),
  colorize({ all: true }),
  errors({ stack: true }),
  consoleFormat
);

// Production console format without colors
const prodConsoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  consoleFormat
);

// JSON format for file output
const jsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  json()
);

// Error-specific format with full stack traces
const errorFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  }),
  json()
);

// Structured format for log aggregation services
const structuredFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label', 'service', 'environment']
  }),
  json({
    replacer: (key, value) => {
      // Sanitize sensitive data
      if (key === 'password' || key === 'token' || key === 'apiKey' || key === 'secret') {
        return '[REDACTED]';
      }
      return value;
    }
  })
);

// Combined format based on environment
const combinedFormat = config.environment === 'production' 
  ? structuredFormat 
  : combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      errors({ stack: true }),
      json()
    );

export const formatters = {
  console: config.environment === 'development' ? devConsoleFormat : prodConsoleFormat,
  file: jsonFormat,
  error: errorFormat,
  structured: structuredFormat,
  combined: combinedFormat,
  dev: devConsoleFormat,
  prod: prodConsoleFormat
};