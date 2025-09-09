/**
 * Test Script for Winston Logger
 * Run with: node scripts/test-logger.js
 */

const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Import the logger (using require for simplicity)
process.env.NODE_ENV = 'development';
const { logger } = require('../src/lib/logger');

console.log('🚀 Starting Winston Logger Test...\n');

// Test 1: Basic logging levels
console.log('📝 Test 1: Basic Logging Levels');
logger.error('This is an error message', { 
  error: { 
    message: 'Something went wrong', 
    code: 'ERR_TEST' 
  } 
});

logger.warn('This is a warning message', { 
  metadata: { 
    warning_type: 'performance', 
    threshold: 1000 
  } 
});

logger.info('This is an info message', { 
  metadata: { 
    action: 'user_login', 
    userId: 'test-user-123' 
  } 
});

logger.debug('This is a debug message', { 
  metadata: { 
    debug_info: 'Detailed debugging information' 
  } 
});

logger.verbose('This is a verbose message', { 
  metadata: { 
    verbose_details: 'Very detailed information' 
  } 
});

// Test 2: API logging
console.log('\n📊 Test 2: API Request Logging');
const apiStartTime = Date.now();
logger.api('/api/courses', 'GET', 200, Date.now() - apiStartTime, {
  userId: 'user-456',
  requestId: 'req-789',
  metadata: { 
    query: { limit: 10, page: 1 } 
  }
});

// Test 3: Database logging
console.log('\n💾 Test 3: Database Operation Logging');
const dbStartTime = Date.now();
logger.database('SELECT', 'courses', Date.now() - dbStartTime, {
  metadata: { 
    rows_returned: 25,
    query: 'SELECT * FROM courses WHERE status = $1',
    params: ['published']
  }
});

// Test 4: Authentication logging
console.log('\n🔐 Test 4: Authentication Event Logging');
logger.auth('login_success', 'user-123', {
  metadata: { 
    method: 'email',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});

logger.auth('login_failed', undefined, {
  metadata: { 
    reason: 'invalid_password',
    email: 'test@example.com',
    attempts: 3
  }
});

// Test 5: Performance logging
console.log('\n⚡ Test 5: Performance Metrics');
logger.performance('page_load', 1250, 'ms', {
  metadata: { 
    page: '/courses',
    resources: 45
  }
});

logger.performance('api_response', 85, 'ms', {
  metadata: { 
    endpoint: '/api/users',
    cache_hit: true
  }
});

// Test 6: Error with stack trace
console.log('\n❌ Test 6: Error with Stack Trace');
try {
  throw new Error('Test error with stack trace');
} catch (error) {
  logger.error('Caught an exception', {
    error: {
      message: error.message,
      stack: error.stack,
      code: 'TEST_ERROR'
    }
  });
}

// Test 7: Bulk operations
console.log('\n📦 Test 7: Bulk Operations Logging');
for (let i = 0; i < 5; i++) {
  logger.info(`Processing item ${i + 1}`, {
    metadata: { 
      item_id: `item-${i + 1}`,
      batch: 'test-batch-001',
      progress: `${(i + 1) * 20}%`
    }
  });
}

// Test 8: Complex nested metadata
console.log('\n🔧 Test 8: Complex Metadata');
logger.info('Complex operation completed', {
  api: {
    endpoint: '/api/courses/123',
    method: 'PUT',
    statusCode: 200,
    duration: 145
  },
  database: {
    operation: 'UPDATE',
    table: 'courses',
    duration: 45
  },
  metadata: {
    user: {
      id: 'user-789',
      email: 'admin@example.com',
      role: 'admin'
    },
    changes: {
      title: { old: 'Old Title', new: 'New Title' },
      status: { old: 'draft', new: 'published' }
    },
    timestamp: new Date().toISOString()
  }
});

// Test 9: Request tracking
console.log('\n🔍 Test 9: Request Tracking');
const requestId = 'req-' + Date.now();
logger.setRequestId('current', requestId);

logger.info('Starting request processing', { 
  metadata: { step: 1 } 
});

logger.info('Validating input', { 
  metadata: { step: 2, validation: 'passed' } 
});

logger.info('Processing business logic', { 
  metadata: { step: 3, items_processed: 10 } 
});

logger.info('Request completed', { 
  metadata: { step: 4, total_duration: 250 } 
});

logger.clearRequestId('current');

// Summary
console.log('\n✅ Logger Test Complete!');
console.log('----------------------------');
console.log('Check the following locations for logs:');
console.log(`1. Console output (colored, formatted)`);
console.log(`2. ${path.join(logsDir, 'application-*.log')} (JSON format, all logs)`);
console.log(`3. ${path.join(logsDir, 'error.log')} (Error logs only)`);
console.log('\nYou can view logs in the admin panel at: /admin/logs');

// Give time for logs to flush
setTimeout(() => {
  logger.close().then(() => {
    console.log('\n👋 Logger closed successfully');
    process.exit(0);
  });
}, 2000);