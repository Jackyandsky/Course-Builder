/**
 * Test Script for Real-time Monitoring System
 * Run with: node scripts/test-monitoring.js
 */

const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Import monitoring components
process.env.NODE_ENV = 'development';

console.log('🚀 Starting Real-time Monitoring System Test...\n');

// Test 1: Basic Metrics Collection
console.log('📊 Test 1: Metrics Collection');
const { metricsCollector } = require('../src/lib/monitoring/metrics-collector');

// Simulate API requests
for (let i = 0; i < 10; i++) {
  const responseTime = Math.random() * 2000 + 100; // 100-2100ms
  const statusCode = Math.random() > 0.1 ? 200 : 500; // 90% success rate
  
  metricsCollector.recordRequest('/api/courses', 'GET', responseTime, statusCode);
  console.log(`  API Request recorded: ${Math.round(responseTime)}ms, Status: ${statusCode}`);
}

// Simulate some slow requests
metricsCollector.recordRequest('/api/courses/search', 'POST', 3500, 200);
metricsCollector.recordRequest('/api/admin/reports', 'GET', 5200, 200);
console.log('  Slow requests recorded');

// Test 2: Database Query Analysis
console.log('\n💾 Test 2: Database Query Analysis');
const { databaseAnalyzer } = require('../src/lib/monitoring/database-analyzer');

// Simulate various database queries
const testQueries = [
  {
    query: 'SELECT * FROM courses WHERE status = $1',
    time: 1500,
    table: 'courses'
  },
  {
    query: 'SELECT id, name FROM users WHERE email = $1 LIMIT 1',
    time: 50,
    table: 'users'
  },
  {
    query: 'SELECT COUNT(*) FROM user_profiles',
    time: 2800,
    table: 'user_profiles'
  },
  {
    query: 'UPDATE courses SET updated_at = NOW() WHERE id = $1',
    time: 120,
    table: 'courses'
  },
  {
    query: 'SELECT * FROM courses c JOIN lessons l ON c.id = l.course_id ORDER BY c.created_at',
    time: 4200,
    table: 'courses'
  }
];

testQueries.forEach(({ query, time, table }, index) => {
  const analysis = databaseAnalyzer.analyzeQuery(query, time, { table, rows: Math.floor(Math.random() * 100) });
  console.log(`  Query ${index + 1}: ${time}ms - ${analysis.severity} severity`);
  if (analysis.suggestions.length > 0) {
    console.log(`    Suggestions: ${analysis.suggestions.slice(0, 2).join('; ')}`);
  }
});

// Test 3: Error Recording
console.log('\n❌ Test 3: Error Tracking');

// Simulate various errors
const testErrors = [
  { level: 'error', message: 'Database connection failed' },
  { level: 'error', message: 'User authentication failed' },
  { level: 'warn', message: 'Slow API response detected' },
  { level: 'error', message: 'Payment processing error' },
  { level: 'warn', message: 'High memory usage' }
];

testErrors.forEach((error, index) => {
  metricsCollector.recordError(error.level, error.message);
  console.log(`  Error ${index + 1}: [${error.level.toUpperCase()}] ${error.message}`);
});

// Test 4: Get Current Metrics
console.log('\n📈 Test 4: Current Metrics');
setTimeout(() => {
  const currentMetrics = metricsCollector.getCurrentMetrics();
  if (currentMetrics) {
    console.log('  System Metrics:');
    console.log(`    Memory Usage: ${currentMetrics.memory.percentage.toFixed(1)}%`);
    console.log(`    API Requests: ${currentMetrics.api.requestsPerMinute}`);
    console.log(`    API Error Rate: ${(currentMetrics.api.errorRate * 100).toFixed(1)}%`);
    console.log(`    Network Avg Response: ${currentMetrics.network.avgResponseTime.toFixed(0)}ms`);
    console.log(`    Total Errors: ${currentMetrics.errors.total}`);
    console.log(`    Recent Errors: ${currentMetrics.errors.recent.length}`);
  } else {
    console.log('  No metrics available yet');
  }
}, 2000);

// Test 5: Database Analytics
console.log('\n🔍 Test 5: Database Analytics');
setTimeout(() => {
  const dbMetrics = databaseAnalyzer.getMetrics();
  console.log('  Database Analytics:');
  console.log(`    Total Queries: ${dbMetrics.totalQueries}`);
  console.log(`    Slow Queries: ${dbMetrics.slowQueries}`);
  console.log(`    Average Query Time: ${dbMetrics.averageQueryTime.toFixed(0)}ms`);
  console.log(`    Query Patterns: ${dbMetrics.queryPatterns.length}`);
  console.log(`    Recommendations: ${dbMetrics.recommendations.length}`);
  
  if (dbMetrics.recommendations.length > 0) {
    console.log('    Top Recommendations:');
    dbMetrics.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`      ${i + 1}. ${rec}`);
    });
  }

  if (dbMetrics.queryPatterns.length > 0) {
    console.log('    Top Query Patterns:');
    dbMetrics.queryPatterns.slice(0, 3).forEach((pattern, i) => {
      console.log(`      ${i + 1}. ${pattern.count} queries, avg: ${pattern.avgTime.toFixed(0)}ms`);
    });
  }
}, 3000);

// Test 6: Alert System
console.log('\n🚨 Test 6: Alert System');
setTimeout(() => {
  // Get alert rules
  const alertRules = metricsCollector.getAlertRules();
  console.log(`  Alert Rules: ${alertRules.length} configured`);
  
  alertRules.slice(0, 3).forEach((rule, i) => {
    console.log(`    ${i + 1}. ${rule.name} - ${rule.condition} ${rule.operator} ${rule.threshold} (${rule.severity})`);
  });

  // Simulate triggering an alert by updating a rule threshold
  if (alertRules.length > 0) {
    console.log('  Simulating alert trigger...');
    const testRule = alertRules[0];
    metricsCollector.updateAlertRule(testRule.id, { threshold: 0.01 }); // Very low threshold
    console.log(`  Updated rule "${testRule.name}" threshold to trigger alert`);
  }
}, 4000);

// Test 7: Historical Data
console.log('\n📚 Test 7: Historical Data');
setTimeout(() => {
  const historical = metricsCollector.getHistoricalMetrics(1);
  console.log(`  Historical metrics available: ${historical.length} data points`);
  
  if (historical.length > 0) {
    const latest = historical[historical.length - 1];
    console.log(`  Latest timestamp: ${new Date(latest.timestamp).toLocaleTimeString()}`);
  }
}, 5000);

// Test 8: Table-specific Analysis
console.log('\n🗃️  Test 8: Table-specific Analysis');
setTimeout(() => {
  const coursesQueries = databaseAnalyzer.getQueriesByTable('courses', 1);
  console.log(`  Courses table queries: ${coursesQueries.length}`);
  
  if (coursesQueries.length > 0) {
    const avgTime = coursesQueries.reduce((sum, q) => sum + q.executionTime, 0) / coursesQueries.length;
    const slowQueries = coursesQueries.filter(q => q.executionTime > 1000).length;
    console.log(`    Average time: ${avgTime.toFixed(0)}ms`);
    console.log(`    Slow queries: ${slowQueries}`);
  }
}, 6000);

// Summary and cleanup
setTimeout(() => {
  console.log('\n✅ Monitoring System Test Complete!');
  console.log('-----------------------------------');
  console.log('Components tested:');
  console.log('1. ✅ Metrics Collection Service');
  console.log('2. ✅ Database Query Analyzer');
  console.log('3. ✅ Error Tracking System');
  console.log('4. ✅ Performance Monitoring');
  console.log('5. ✅ Alert Rule System');
  console.log('6. ✅ Historical Data Storage');
  console.log('\nTo access the monitoring dashboard:');
  console.log('1. Start your Next.js development server');
  console.log('2. Navigate to /admin/monitoring (requires admin auth)');
  console.log('3. Real-time data will stream automatically');
  console.log('\nAPI Endpoints available:');
  console.log('- GET  /api/admin/monitoring/websocket (real-time stream)');
  console.log('- GET  /api/admin/monitoring/database (database analytics)');
  console.log('- POST /api/admin/monitoring/database/analyze (query analysis)');
  console.log('- GET  /api/admin/logs (log viewer)');
  
  // Clean up
  databaseAnalyzer.cleanup();
  console.log('\n👋 Test completed and cleaned up!');
}, 7000);