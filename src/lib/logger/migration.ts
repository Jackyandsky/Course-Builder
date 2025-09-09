/**
 * Logger Migration Helper
 * Helps migrate from console.log to Winston logger
 */

import { logger } from './index';
import { LogContext } from './types';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

/**
 * Override console methods to use Winston logger
 * This allows gradual migration from console.log to logger
 */
export function overrideConsole(enabled: boolean = true): void {
  if (!enabled) {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    return;
  }

  // Override console.log
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logger.info(`[console.log] ${message}`);
    
    // Also call original in development for backwards compatibility
    if (process.env.NODE_ENV === 'development') {
      originalConsole.log(...args);
    }
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const error = args.find(arg => arg instanceof Error);
    const context: LogContext = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};
    
    logger.error(`[console.error] ${message}`, context);
    
    // Also call original in development
    if (process.env.NODE_ENV === 'development') {
      originalConsole.error(...args);
    }
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logger.warn(`[console.warn] ${message}`);
    
    // Also call original in development
    if (process.env.NODE_ENV === 'development') {
      originalConsole.warn(...args);
    }
  };

  // Override console.info
  console.info = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logger.info(`[console.info] ${message}`);
    
    // Also call original in development
    if (process.env.NODE_ENV === 'development') {
      originalConsole.info(...args);
    }
  };

  // Override console.debug
  console.debug = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    logger.debug(`[console.debug] ${message}`);
    
    // Also call original in development
    if (process.env.NODE_ENV === 'development') {
      originalConsole.debug(...args);
    }
  };
}

/**
 * Helper to find and report console.log usage in code
 * This can be used in a script to identify migration targets
 */
export function findConsoleUsage(code: string): {
  line: number;
  column: number;
  type: string;
  text: string;
}[] {
  const patterns = [
    { regex: /console\.log\(/g, type: 'console.log' },
    { regex: /console\.error\(/g, type: 'console.error' },
    { regex: /console\.warn\(/g, type: 'console.warn' },
    { regex: /console\.info\(/g, type: 'console.info' },
    { regex: /console\.debug\(/g, type: 'console.debug' }
  ];
  
  const results: any[] = [];
  const lines = code.split('\n');
  
  lines.forEach((line, lineIndex) => {
    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          line: lineIndex + 1,
          column: match.index + 1,
          type,
          text: line.trim()
        });
      }
    });
  });
  
  return results;
}

/**
 * Migration guide generator
 */
export function generateMigrationGuide(filePath: string, consoleUsages: any[]): string {
  let guide = `# Logger Migration Guide for ${filePath}\n\n`;
  guide += `Found ${consoleUsages.length} console statements to migrate:\n\n`;
  
  consoleUsages.forEach((usage, index) => {
    guide += `## ${index + 1}. Line ${usage.line}, Column ${usage.column}\n`;
    guide += `Type: ${usage.type}\n`;
    guide += `Code: \`${usage.text}\`\n`;
    guide += `Suggested replacement:\n`;
    
    switch (usage.type) {
      case 'console.log':
        guide += `\`\`\`typescript\nlogger.info('Your message here', { /* context */ });\n\`\`\`\n`;
        break;
      case 'console.error':
        guide += `\`\`\`typescript\nlogger.error('Error description', { error: { message: error.message, stack: error.stack } });\n\`\`\`\n`;
        break;
      case 'console.warn':
        guide += `\`\`\`typescript\nlogger.warn('Warning message', { /* context */ });\n\`\`\`\n`;
        break;
      case 'console.info':
        guide += `\`\`\`typescript\nlogger.info('Info message', { /* context */ });\n\`\`\`\n`;
        break;
      case 'console.debug':
        guide += `\`\`\`typescript\nlogger.debug('Debug message', { /* context */ });\n\`\`\`\n`;
        break;
    }
    guide += '\n';
  });
  
  return guide;
}