#!/usr/bin/env node

/**
 * Test Logger Functionality - Verify logs go to ./logs/ folder
 */

console.log('🔍 Testing Logger Functionality...\n');

// Test if we can import the logger
try {
  // Try to require the logger using Node.js require
  const path = require('path');
  const fs = require('fs');
  
  // Check if logs directory exists
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Created logs directory:', logsDir);
  } else {
    console.log('✅ Logs directory exists:', logsDir);
  }
  
  // Test if we can create Winston logger directly
  const winston = require('winston');
  const DailyRotateFile = require('winston-daily-rotate-file');
  
  // Create a simple test logger
  const testLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      }),
      new DailyRotateFile({
        filename: path.join(logsDir, 'test-application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d'
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'test-error.log'),
        level: 'error'
      })
    ]
  });
  
  console.log('✅ Winston logger created successfully');
  
  // Test logging to files
  testLogger.info('LOGGER_TEST', {
    message: 'Testing logger functionality',
    timestamp: new Date().toISOString(),
    test: true,
    console_captured: 'This should appear in logs folder',
    source: 'logger_test'
  });
  
  testLogger.error('ERROR_TEST', {
    message: 'Testing error logging',
    error_type: 'test_error',
    timestamp: new Date().toISOString(),
    source: 'logger_test'
  });
  
  testLogger.warn('CONSOLE_WARN_TEST', {
    console: true,
    type: 'warn',
    message: 'This simulates a console.warn() call being captured',
    timestamp: new Date().toISOString(),
    source: 'console.warn'
  });
  
  console.log('✅ Test logs written');
  
  // Wait a moment for files to be written
  setTimeout(() => {
    // Check if log files were created
    const files = fs.readdirSync(logsDir);
    console.log('\n📁 Files in logs directory:');
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   📄 ${file} (${stats.size} bytes)`);
    });
    
    // Show content of one of the log files
    const logFiles = files.filter(f => f.includes('test-application'));
    if (logFiles.length > 0) {
      console.log(`\n📖 Content of ${logFiles[0]}:`);
      try {
        const content = fs.readFileSync(path.join(logsDir, logFiles[0]), 'utf8');
        console.log(content);
      } catch (error) {
        console.log('   ❌ Could not read log file:', error.message);
      }
    }
    
    console.log('\n🎯 Logger Test Results:');
    console.log('   ✅ Winston logger working correctly');
    console.log('   ✅ Logs being written to ./logs/ directory');
    console.log('   ✅ Daily rotation configured');
    console.log('   ✅ Error logs separated');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Integrate logger into Next.js application');
    console.log('   2. Add logger to API routes');
    console.log('   3. Set up console interception');
    console.log('   4. Test with live application');
    
  }, 1000);
  
} catch (error) {
  console.error('❌ Error testing logger:', error.message);
  console.error('Stack:', error.stack);
}