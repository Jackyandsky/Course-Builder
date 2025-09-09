/**
 * Winston Transports Configuration
 * Creates and configures transports based on environment settings
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './config';
import { formatters } from './formatters';

export function createTransports(): winston.transport[] {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.console.enabled) {
    transports.push(
      new winston.transports.Console({
        level: config.console.level,
        format: formatters.console,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // Daily rotating file transport for all logs
  if (config.file.enabled) {
    const fileTransport: DailyRotateFile = new DailyRotateFile({
      level: config.file.level,
      filename: config.file.filename,
      datePattern: config.file.datePattern,
      zippedArchive: config.file.zippedArchive,
      maxSize: config.file.maxSize,
      maxFiles: config.file.maxFiles,
      format: formatters.file,
      handleExceptions: false,
      handleRejections: false
    });

    // Handle transport events
    fileTransport.on('error', (error) => {
      console.error('File transport error:', error);
    });

    fileTransport.on('rotate', (oldFilename, newFilename) => {
      console.log(`Log rotation: ${oldFilename} → ${newFilename}`);
    });

    transports.push(fileTransport);
  }

  // Error-only file transport
  if (config.error.enabled) {
    transports.push(
      new winston.transports.File({
        level: config.error.level,
        filename: config.error.filename,
        format: formatters.error,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // Real-time monitoring transport (WebSocket)
  if (config.realtime.enabled) {
    // This will be implemented when we add the real-time monitoring feature
    // For now, we'll add a comment placeholder
    // transports.push(new RealtimeTransport({ port: config.realtime.port }));
  }

  return transports;
}

// Export individual transport creators for flexibility
export const createConsoleTransport = () => new winston.transports.Console({
  level: config.console.level,
  format: formatters.console
});

export const createFileTransport = () => new DailyRotateFile({
  level: config.file.level,
  filename: config.file.filename,
  datePattern: config.file.datePattern,
  zippedArchive: config.file.zippedArchive,
  maxSize: config.file.maxSize,
  maxFiles: config.file.maxFiles,
  format: formatters.file
});

export const createErrorTransport = () => new winston.transports.File({
  level: 'error',
  filename: config.error.filename,
  format: formatters.error
});