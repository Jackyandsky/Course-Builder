/**
 * Debug and Log Investigation Script
 * Run with: node scripts/debug-logs.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Course Builder Log Investigation Script');
console.log('==========================================\n');

// 1. Check for log files in various locations
console.log('📁 Checking for log files...');

const logLocations = [
  './logs',
  './.next/server/logs', 
  './src/app/logs',
  './',
  './database'
];

const logFiles = [];

logLocations.forEach(location => {
  const fullPath = path.resolve(location);
  try {
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        if (file.endsWith('.log') || file.includes('log') || file.endsWith('.txt')) {
          const filePath = path.join(fullPath, file);
          const stats = fs.statSync(filePath);
          logFiles.push({
            path: filePath,
            relativePath: path.relative(process.cwd(), filePath),
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      });
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
});

if (logFiles.length > 0) {
  console.log(`✅ Found ${logFiles.length} log files:\n`);
  logFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.relativePath}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Modified: ${new Date(file.modified).toLocaleString()}`);
    console.log('');
  });
} else {
  console.log('❌ No log files found in expected locations');
}

// 2. Create Winston logs directory and test basic logging
console.log('📝 Setting up Winston logging...');
const logsDir = path.join(process.cwd(), 'logs');

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`✅ Created logs directory: ${logsDir}`);
  } else {
    console.log(`✅ Logs directory exists: ${logsDir}`);
  }

  // Create a simple test log
  const testLogPath = path.join(logsDir, 'debug-test.log');
  const testEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Debug log investigation script executed',
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };
  
  fs.writeFileSync(testLogPath, JSON.stringify(testEntry, null, 2) + '\n');
  console.log(`✅ Created test log: ${path.relative(process.cwd(), testLogPath)}`);

} catch (error) {
  console.log(`❌ Failed to create logs directory: ${error.message}`);
}

// 3. Check for existing error logs or console outputs
console.log('\n🔍 Searching for error indicators...');

const searchFiles = [
  './dev.log',
  './issues.txt', 
  './.next/build.log',
  './npm-debug.log',
  './debug-admin-api.js'
];

const errorIndicators = [];

searchFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const stats = fs.statSync(file);
      
      // Count error-like patterns
      const errorPatterns = [
        /error/gi,
        /failed/gi,
        /exception/gi,
        /warning/gi,
        /timeout/gi,
        /connection/gi
      ];
      
      let matches = 0;
      errorPatterns.forEach(pattern => {
        const found = content.match(pattern);
        if (found) matches += found.length;
      });
      
      if (matches > 0) {
        errorIndicators.push({
          file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          errorCount: matches,
          preview: content.slice(0, 200) + (content.length > 200 ? '...' : '')
        });
      }
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }
});

if (errorIndicators.length > 0) {
  console.log(`⚠️ Found ${errorIndicators.length} files with potential issues:\n`);
  errorIndicators.forEach((file, index) => {
    console.log(`${index + 1}. ${file.file}`);
    console.log(`   Error indicators: ${file.errorCount}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Modified: ${new Date(file.modified).toLocaleString()}`);
    console.log(`   Preview: ${file.preview.replace(/\n/g, ' ')}`);
    console.log('');
  });
} else {
  console.log('✅ No obvious error files found');
}

// 4. Environment and configuration check
console.log('\n⚙️ Environment Configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`LOG_LEVEL: ${process.env.LOG_LEVEL || 'not set'}`);
console.log(`LOG_FILE: ${process.env.LOG_FILE || 'not set'}`);
console.log(`LOG_CONSOLE: ${process.env.LOG_CONSOLE || 'not set'}`);

// Check for .env files
const envFiles = ['.env.local', '.env.development', '.env.production', '.env'];
console.log('\n📄 Environment files:');
envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    const stats = fs.statSync(envFile);
    console.log(`✅ ${envFile} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${envFile} (not found)`);
  }
});

// 5. Supabase connection check simulation
console.log('\n🔗 Supabase Configuration Check:');
try {
  // Check if Supabase config exists
  const supabaseDir = './supabase';
  if (fs.existsSync(supabaseDir)) {
    const configFile = path.join(supabaseDir, 'config.toml');
    if (fs.existsSync(configFile)) {
      console.log('✅ Supabase config found');
      const config = fs.readFileSync(configFile, 'utf8');
      // Extract project ID if visible
      const projectIdMatch = config.match(/project_id\s*=\s*"([^"]+)"/);
      if (projectIdMatch) {
        console.log(`   Project ID: ${projectIdMatch[1]}`);
      }
    }
  }
  
  // Check environment for Supabase settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Not set'}`);
  
} catch (error) {
  console.log(`❌ Error checking Supabase config: ${error.message}`);
}

// 6. Recent API activity simulation
console.log('\n🌐 API Activity Check:');
console.log('To check for recent API errors or issues:');
console.log('1. Check browser Network tab for failed requests');
console.log('2. Look at Next.js server console output');
console.log('3. Check Supabase dashboard for query errors');
console.log('4. Access /api/health endpoint to test connectivity');

// 7. Recommendations
console.log('\n💡 Debugging Recommendations:');
console.log('=====================================');

if (logFiles.length === 0) {
  console.log('🔧 No log files found. To enable logging:');
  console.log('   1. Ensure Winston logger is properly initialized');
  console.log('   2. Set LOG_LEVEL=debug in your .env.local');
  console.log('   3. Set LOG_FILE=true to enable file logging');
  console.log('   4. Restart your development server');
}

console.log('📊 To access monitoring dashboard:');
console.log('   1. Start your Next.js server: npm run dev');
console.log('   2. Navigate to /admin/logs (with admin authentication)');
console.log('   3. Check /admin/monitoring for real-time metrics');

console.log('🔍 To investigate specific issues:');
console.log('   1. Check browser console for JavaScript errors');
console.log('   2. Monitor Network tab for API failures');
console.log('   3. Check Supabase dashboard > Logs section');
console.log('   4. Review /api/health endpoint response');

console.log('🐛 Common issues to check:');
console.log('   1. Authentication failures (401/403 errors)');
console.log('   2. Database connection issues');
console.log('   3. Missing environment variables');
console.log('   4. CORS or network connectivity problems');
console.log('   5. TypeScript compilation errors');

console.log('\n🎯 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Visit: http://localhost:3000/api/health');
console.log('3. Check: /admin/logs (requires admin login)');
console.log('4. Monitor: /admin/monitoring dashboard');

console.log('\n✅ Debug script completed!');
console.log('Check the logs/ directory for new log files as you use the application.');

// Create a simple monitoring command
const monitoringHelp = `
# Monitoring Commands

## Check logs in real-time:
tail -f logs/application-*.log | jq '.'

## Search for errors:
grep -i "error" logs/*.log

## Check recent activity:
find logs -name "*.log" -mmin -60 -exec echo "=== {} ===" \\; -exec tail -5 {} \\;

## Monitor API health:
curl http://localhost:3000/api/health | jq '.'

## Monitor database queries:
curl http://localhost:3000/api/admin/monitoring/database | jq '.'
`;

fs.writeFileSync('./logs/monitoring-commands.txt', monitoringHelp.trim());
console.log('\n📋 Saved monitoring commands to: logs/monitoring-commands.txt');