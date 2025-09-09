# Winston Logger Integration Guide

## Overview
The Course Builder application now includes a comprehensive Winston-based logging system that provides structured logging, real-time monitoring, and debugging capabilities.

## Features

### 🎯 Core Features
- **Structured Logging**: JSON-formatted logs with consistent schema
- **Multiple Log Levels**: error, warn, info, debug, verbose
- **Multiple Transports**: Console, File, Daily Rotating Files
- **Real-time Monitoring**: Live log streaming via Server-Sent Events
- **Request Tracking**: Automatic request ID generation and correlation
- **Performance Metrics**: Built-in performance measurement logging
- **Error Handling**: Automatic stack trace capture and formatting
- **Admin UI**: Web-based log viewer with filtering and search

### 📊 Specialized Logging Methods
- `logger.api()` - API request/response logging
- `logger.database()` - Database operation logging
- `logger.auth()` - Authentication event logging
- `logger.performance()` - Performance metric logging

## Installation

```bash
npm install winston winston-daily-rotate-file --legacy-peer-deps
```

## Configuration

### Environment Variables
```env
# Logging Configuration
LOG_LEVEL=debug                 # Overall log level (error|warn|info|debug|verbose)
LOG_CONSOLE=true                # Enable console logging
LOG_CONSOLE_LEVEL=debug         # Console log level
LOG_FILE=true                   # Enable file logging
LOG_FILE_LEVEL=info            # File log level
LOG_FILE_NAME=logs/application-%DATE%.log
LOG_MAX_SIZE=20m                # Max size per log file
LOG_MAX_FILES=14d               # Keep logs for 14 days
LOG_SILENT=false                # Disable all logging
LOG_REALTIME=true               # Enable real-time streaming
LOG_REALTIME_PORT=3001          # Port for real-time logs
```

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('User logged in', { userId: 'user-123' });
logger.error('Failed to process payment', { 
  error: { message: error.message, stack: error.stack }
});
logger.warn('API rate limit approaching', { remaining: 10 });
logger.debug('Cache miss', { key: 'user-profile-123' });
```

### API Route Integration

```typescript
import { withRequestLogging } from '@/lib/utils/request-logger';

// Wrap your API handler
export const GET = withRequestLogging(async (request: NextRequest) => {
  // Your API logic here
  logger.info('Processing request');
  
  return NextResponse.json({ success: true });
});
```

### Database Operations

```typescript
const startTime = Date.now();
const result = await supabase.from('users').select('*');
const duration = Date.now() - startTime;

logger.database('SELECT', 'users', duration, {
  metadata: { 
    rows: result.data?.length,
    cached: false 
  }
});
```

### Authentication Events

```typescript
logger.auth('login_success', userId, {
  metadata: { 
    method: 'oauth',
    provider: 'google'
  }
});

logger.auth('permission_denied', userId, {
  metadata: { 
    resource: 'admin_panel',
    required_role: 'admin' 
  }
});
```

### Performance Tracking

```typescript
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;

logger.performance('api_call', duration, 'ms', {
  endpoint: '/api/courses',
  cache_hit: false
});
```

## Migration from console.log

### Automatic Migration Helper

```typescript
import { overrideConsole } from '@/lib/logger/migration';

// Enable console override (gradual migration)
overrideConsole(true);

// Your existing console.log calls will now use Winston
console.log('This goes to Winston');
console.error('This error is logged properly');

// Restore original console
overrideConsole(false);
```

### Migration Guide

| Old Pattern | New Pattern |
|------------|------------|
| `console.log('message')` | `logger.info('message')` |
| `console.error('error', error)` | `logger.error('error', { error: { message: error.message } })` |
| `console.warn('warning')` | `logger.warn('warning')` |
| `console.debug('debug')` | `logger.debug('debug')` |

## Admin Log Viewer

### Accessing the Log Viewer
Navigate to `/admin/logs` in your browser (requires admin authentication).

### Features
- **Real-time Updates**: Toggle real-time mode to see logs as they happen
- **Filtering**: Filter by log level (error, warn, info, debug, verbose)
- **Search**: Search through log messages, request IDs, and endpoints
- **Export**: Download logs for offline analysis
- **Clear**: Remove old logs to save disk space

### API Endpoints

```typescript
// Query logs
GET /api/admin/logs?level=error&limit=100&from=2024-01-01&until=2024-01-31

// Stream logs (Server-Sent Events)
GET /api/admin/logs?realtime=true

// Clear logs
DELETE /api/admin/logs
{
  "older_than": "2024-01-01T00:00:00Z"
}
```

## Log File Structure

### File Locations
```
/logs/
├── application-2024-01-15.log   # Daily rotating application logs
├── application-2024-01-16.log
├── error.log                     # Error-only logs
├── exceptions.log                # Uncaught exceptions
└── rejections.log                # Unhandled promise rejections
```

### Log Format
```json
{
  "level": "info",
  "message": "API Request",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "service": "course-builder",
  "environment": "production",
  "requestId": "req-abc123",
  "userId": "user-456",
  "api": {
    "endpoint": "/api/courses",
    "method": "GET",
    "statusCode": 200,
    "duration": 125
  },
  "metadata": {
    "custom": "data"
  }
}
```

## Testing

### Run Test Script
```bash
node scripts/test-logger.js
```

This will generate various log entries to test all logging features.

### Unit Testing
```typescript
import { logger } from '@/lib/logger';

describe('Logger Tests', () => {
  it('should log info messages', () => {
    const spy = jest.spyOn(logger, 'info');
    logger.info('Test message');
    expect(spy).toHaveBeenCalledWith('Test message');
  });
});
```

## Performance Considerations

### Log Levels by Environment
- **Development**: `debug` or `verbose` for detailed debugging
- **Staging**: `info` for general information
- **Production**: `warn` or `error` to reduce overhead

### File Rotation
- Files rotate daily by default
- Old files are compressed (gzipped)
- Automatic cleanup after 14 days

### Batching
For high-volume logging, consider batching:
```typescript
const logs = [];
// Collect logs
logs.push({ level: 'info', message: 'Event 1' });
logs.push({ level: 'info', message: 'Event 2' });
// Batch write
logs.forEach(log => logger[log.level](log.message));
```

## Troubleshooting

### Logs Not Appearing
1. Check environment variables
2. Ensure logs directory exists and is writable
3. Verify log level settings
4. Check for errors in console

### Performance Issues
1. Reduce log level in production
2. Increase rotation frequency
3. Use async transports for file writing
4. Implement log sampling for high-traffic endpoints

### Disk Space
1. Monitor log file sizes
2. Adjust retention policy (`LOG_MAX_FILES`)
3. Use log aggregation services for long-term storage

## Best Practices

1. **Use Structured Logging**: Always include context objects
2. **Avoid Sensitive Data**: Never log passwords, tokens, or PII
3. **Use Appropriate Levels**: Reserve `error` for actual errors
4. **Include Request IDs**: Helps trace issues across services
5. **Log at Boundaries**: Log at API entry/exit points
6. **Measure Performance**: Use performance logging for slow operations
7. **Handle Errors Properly**: Always include stack traces for errors
8. **Clean Up Regularly**: Implement log rotation and cleanup

## Integration with External Services

### Future Enhancements
- **Elasticsearch**: Send logs to ELK stack
- **DataDog**: Integration with DataDog APM
- **Sentry**: Error tracking and alerting
- **CloudWatch**: AWS CloudWatch Logs
- **Grafana Loki**: For metrics and alerting

## Support

For issues or questions about the logging system:
1. Check this documentation
2. Review test script: `scripts/test-logger.js`
3. Check log viewer at `/admin/logs`
4. Contact the development team

---

*Last Updated: January 2025*