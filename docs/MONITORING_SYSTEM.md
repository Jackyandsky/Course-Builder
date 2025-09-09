# Real-time Monitoring System

## Overview
The Course Builder application now includes a comprehensive real-time monitoring system that provides deep insights into application performance, database operations, error tracking, and system health.

## 🎯 Key Features

### Core Monitoring Capabilities
- **Real-time Metrics Collection**: Live system performance data
- **Database Query Analysis**: Automatic query optimization suggestions
- **Error Tracking & Alerting**: Smart error aggregation and notifications
- **Performance Monitoring**: API response times and bottleneck detection
- **Alert Management**: Configurable rules with severity levels
- **Historical Data**: Trend analysis and pattern recognition

### Dashboard Features
- **Live Dashboard**: Real-time metrics with Server-Sent Events
- **Interactive UI**: Filterable, searchable monitoring interface
- **Browser Notifications**: Critical alert notifications
- **Mobile Responsive**: Monitor your app from anywhere

## 🏗️ Architecture

### Components

```
/src/lib/monitoring/
├── metrics-collector.ts     # Core metrics aggregation
├── database-analyzer.ts     # SQL query performance analysis
└── [future components]

/src/app/api/admin/monitoring/
├── websocket/route.ts       # Real-time data streaming
└── database/route.ts        # Database analytics API

/src/app/(admin)/admin/
├── monitoring/page.tsx      # Main dashboard interface
└── logs/page.tsx           # Log viewer (from Winston)
```

### Data Flow
```
Application Events → Metrics Collector → Real-time Dashboard
     ↓                      ↓                    ↓
  Winston Logger    → Database Analyzer → Alert System
     ↓                      ↓                    ↓
  Log Storage       → Query Suggestions → Notifications
```

## 📊 Metrics Collected

### System Metrics
```typescript
interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;      // CPU utilization percentage
    load: number[];     // Load averages
  };
  memory: {
    used: number;       // Memory used in bytes
    total: number;      // Total memory in bytes
    percentage: number; // Usage percentage
    heap: {
      used: number;     // Heap used
      total: number;    // Heap total
    };
  };
  network: {
    requests: number;       // Total requests
    errors: number;         // Error count
    errorRate: number;      // Error percentage
    avgResponseTime: number; // Average response time
  };
  database: {
    connectionCount: number; // Active connections
    activeQueries: number;   // Running queries
    slowQueries: number;     // Slow query count
    errorRate: number;       // DB error rate
    avgQueryTime: number;    // Average query time
  };
  api: {
    requestsPerMinute: number; // Request rate
    errorRate: number;         // API error rate
    slowEndpoints: Array<{     // Performance bottlenecks
      endpoint: string;
      avgTime: number;
      count: number;
    }>;
  };
  errors: {
    total: number;                    // Total error count
    byLevel: Record<string, number>;  // Errors by severity
    recent: Array<{                   // Recent error details
      level: string;
      message: string;
      timestamp: string;
      count: number;
    }>;
  };
}
```

## 🔍 Database Query Analysis

### Automatic Analysis
Every database query is automatically analyzed for:
- **Execution Time**: Identifies slow queries (>1s)
- **Query Structure**: Detects inefficient patterns
- **N+1 Queries**: Identifies repeated similar queries
- **Missing Indexes**: Suggests index optimizations
- **Query Patterns**: Groups similar queries for analysis

### Performance Suggestions
The system provides actionable suggestions:
- Index recommendations
- Query structure improvements
- Pagination suggestions
- JOIN optimization
- Subquery to JOIN conversions

### Example Analysis
```typescript
const analysis = databaseAnalyzer.analyzeQuery(
  'SELECT * FROM courses WHERE status = $1',
  1500, // execution time in ms
  { 
    table: 'courses', 
    rows: 250,
    cached: false 
  }
);

// Returns:
{
  query: "SELECT * FROM courses WHERE status = ?",
  table: "courses",
  operation: "SELECT",
  executionTime: 1500,
  severity: "medium",
  suggestions: [
    "Query execution time is above threshold (>1s). Consider optimization.",
    "Avoid SELECT * - specify only needed columns to improve performance."
  ]
}
```

## 🚨 Alert System

### Default Alert Rules
```typescript
const defaultRules = [
  {
    name: 'High Error Rate',
    condition: 'api.errorRate',
    threshold: 0.05,      // 5%
    operator: 'gt',
    severity: 'high',
    cooldown: 5           // minutes
  },
  {
    name: 'Slow Response Time',
    condition: 'network.avgResponseTime',
    threshold: 2000,      // 2 seconds
    operator: 'gt',
    severity: 'medium',
    cooldown: 10
  },
  {
    name: 'High Memory Usage',
    condition: 'memory.percentage',
    threshold: 85,        // 85%
    operator: 'gt',
    severity: 'medium',
    cooldown: 15
  },
  {
    name: 'Database Error Rate',
    condition: 'database.errorRate',
    threshold: 0.02,      // 2%
    operator: 'gt',
    severity: 'high',
    cooldown: 5
  }
];
```

### Alert Management
- **Configurable Thresholds**: Adjust limits per environment
- **Cooldown Periods**: Prevent alert spam
- **Severity Levels**: low, medium, high, critical
- **Browser Notifications**: Critical alerts trigger notifications
- **Historical Tracking**: View alert history and patterns

## 🖥️ Dashboard Interface

### Real-time Dashboard (`/admin/monitoring`)

#### Features:
- **Live Connection Status**: Shows connection state with visual indicator
- **System Overview Cards**: CPU, Memory, Network, Database health
- **Performance Metrics**: Response times, error rates, throughput
- **Slow Endpoints**: Identifies API bottlenecks
- **Recent Errors**: Latest error details with context
- **Alert Feed**: Real-time alert notifications
- **Error Summary**: Aggregated error statistics

#### Auto-refresh:
- Metrics update every 5 seconds
- Connection status monitoring
- Automatic reconnection on failure
- Browser notification permissions

### Log Viewer (`/admin/logs`)
- Real-time log streaming
- Advanced filtering by level
- Search functionality
- Error context and stack traces
- Request correlation

## 📡 API Endpoints

### Real-time Streaming
```bash
# Connect to real-time metrics stream
GET /api/admin/monitoring/websocket
Content-Type: text/event-stream

# Response format:
data: {"type": "metrics", "data": {...}}
data: {"type": "alert", "data": {...}}
data: {"type": "heartbeat", "timestamp": "..."}
```

### Database Analytics
```bash
# Get overall database metrics
GET /api/admin/monitoring/database

# Get table-specific analytics
GET /api/admin/monitoring/database?table=courses&hours=24

# Analyze a specific query
POST /api/admin/monitoring/database/analyze
Content-Type: application/json
{
  "query": "SELECT * FROM courses WHERE status = $1",
  "executionTime": 1500,
  "metadata": {
    "table": "courses",
    "rows": 100
  }
}

# Clean up old analytics data
DELETE /api/admin/monitoring/database
```

### Alert Management
```bash
# Update alert rule
POST /api/admin/monitoring/websocket
Content-Type: application/json
{
  "command": "update_alert_rule",
  "data": {
    "id": "high-error-rate",
    "updates": {
      "threshold": 0.03,
      "enabled": true
    }
  }
}

# Get alert rules
POST /api/admin/monitoring/websocket
Content-Type: application/json
{
  "command": "get_alert_rules"
}
```

## 🔧 Integration Guide

### 1. Automatic Integration
The monitoring system automatically captures:
- All API requests via `withRequestLogging` wrapper
- Database queries via `databaseAnalyzer.analyzeQuery`
- Errors via `metricsCollector.recordError`
- Performance metrics via `logger.performance`

### 2. Manual Integration
For custom metrics:

```typescript
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { databaseAnalyzer } from '@/lib/monitoring/database-analyzer';

// Record custom API metrics
metricsCollector.recordRequest('/api/custom', 'POST', 250, 200);

// Record custom errors
metricsCollector.recordError('warn', 'Custom warning message');

// Analyze custom database queries
const analysis = databaseAnalyzer.analyzeQuery(
  'SELECT COUNT(*) FROM custom_table',
  150,
  { table: 'custom_table', rows: 1 }
);
```

### 3. API Route Integration
Wrap your API routes with monitoring:

```typescript
import { withRequestLogging } from '@/lib/utils/request-logger';

export const GET = withRequestLogging(async (request: NextRequest) => {
  // Your API logic here
  // Monitoring happens automatically
  return NextResponse.json({ success: true });
});
```

## 🧪 Testing

### Run Test Script
```bash
# Test all monitoring components
node scripts/test-monitoring.js

# This will test:
# - Metrics collection
# - Database analysis
# - Error tracking
# - Alert system
# - Historical data
```

### Manual Testing
1. **Access Dashboard**: Navigate to `/admin/monitoring`
2. **Generate Load**: Make API requests to trigger metrics
3. **Test Alerts**: Simulate high error rates or slow responses
4. **Database Analysis**: Run slow queries to test analyzer
5. **Error Tracking**: Generate errors to test aggregation

## 🎯 Performance Impact

### Minimal Overhead
- **Async Processing**: Non-blocking metrics collection
- **Efficient Storage**: In-memory with automatic cleanup
- **Smart Sampling**: Reduces overhead for high-traffic apps
- **Configurable**: Disable features in production if needed

### Memory Management
- **Automatic Cleanup**: Old data removed periodically
- **Size Limits**: Maximum stored queries/metrics enforced
- **Efficient Data Structures**: Maps and arrays for fast access

## 🔒 Security

### Authentication
- **Admin Only**: All monitoring endpoints require admin role
- **Session Validation**: Proper authentication checks
- **Rate Limiting**: Prevents monitoring endpoint abuse

### Data Protection
- **Query Sanitization**: Removes sensitive data from logs
- **No PII Storage**: Personal data excluded from metrics
- **Secure Transmission**: All data encrypted in transit

## 📈 Optimization Recommendations

### Based on Real Data
The system provides actionable optimization suggestions:

#### Database Optimizations
- **Index Recommendations**: Based on slow query patterns
- **Query Structure**: Suggestions for better performance
- **N+1 Detection**: Identifies and suggests fixes for N+1 queries
- **Pagination**: Recommends LIMIT clauses for unbounded queries

#### API Optimizations
- **Slow Endpoint Identification**: Pinpoints bottlenecks
- **Response Time Analysis**: Tracks performance trends
- **Error Pattern Recognition**: Identifies systemic issues
- **Load Distribution**: Monitors request patterns

#### System Optimizations
- **Memory Usage**: Tracks and alerts on high usage
- **CPU Monitoring**: Identifies performance issues
- **Error Correlation**: Links errors to system conditions

## 🚀 Future Enhancements

### Planned Features
- **Machine Learning**: Predictive analytics and anomaly detection
- **Custom Dashboards**: User-configurable monitoring views
- **External Integrations**: Slack, email, PagerDuty notifications
- **Mobile App**: Native mobile monitoring application
- **Advanced Analytics**: Statistical analysis and forecasting

### Integration Targets
- **APM Services**: DataDog, New Relic integration
- **Log Aggregation**: ELK stack, Splunk compatibility
- **Metrics Platforms**: Grafana, Prometheus exports
- **Cloud Monitoring**: AWS CloudWatch, Azure Monitor

## 📚 Troubleshooting

### Common Issues

#### Dashboard Not Loading
1. Check admin authentication
2. Verify WebSocket connection
3. Check browser console for errors
4. Ensure monitoring API endpoints are accessible

#### Missing Metrics
1. Verify API routes use `withRequestLogging` wrapper
2. Check database query analysis integration
3. Ensure metrics collector is properly initialized
4. Check for client-side errors preventing data collection

#### High Memory Usage
1. Reduce metrics retention period
2. Increase cleanup frequency
3. Disable verbose logging in production
4. Check for memory leaks in custom integrations

### Debug Mode
Enable detailed logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📞 Support

For monitoring system issues:
1. Check this documentation
2. Review test script: `scripts/test-monitoring.js`
3. Access monitoring dashboard at `/admin/monitoring`
4. Check system logs via Winston log viewer
5. Contact development team with specific metrics/errors

---

*Last Updated: January 2025*

**Ready for Production**: The monitoring system is production-ready with minimal performance impact and comprehensive error handling.