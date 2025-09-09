/**
 * Real-time Metrics Collector
 * Collects and aggregates application metrics for monitoring dashboard
 */

import { logger } from '@/lib/logger';
import { supabaseMonitor } from '@/lib/supabase/monitor';
import EventEmitter from 'events';

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
    };
  };
  network: {
    requests: number;
    errors: number;
    errorRate: number;
    avgResponseTime: number;
  };
  database: {
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
    errorRate: number;
    avgQueryTime: number;
  };
  api: {
    requestsPerMinute: number;
    errorRate: number;
    slowEndpoints: Array<{
      endpoint: string;
      avgTime: number;
      count: number;
    }>;
  };
  errors: {
    total: number;
    byLevel: Record<string, number>;
    recent: Array<{
      level: string;
      message: string;
      timestamp: string;
      count: number;
    }>;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: number;
}

class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private metrics: Map<string, any> = new Map();
  private requestTimes: number[] = [];
  private errorCounts: Map<string, number> = new Map();
  private slowQueries: Array<{ query: string; time: number; timestamp: number }> = [];
  private apiEndpoints: Map<string, { times: number[]; errors: number }> = new Map();
  private alertRules: AlertRule[] = [];
  private recentErrors: Array<{ level: string; message: string; timestamp: string; count: number }> = [];
  
  private constructor() {
    super();
    this.setupDefaultAlertRules();
    this.startCollection();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'api.errorRate',
        threshold: 0.05, // 5%
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: 'network.avgResponseTime',
        threshold: 2000, // 2 seconds
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 10
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        condition: 'memory.percentage',
        threshold: 85, // 85%
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 15
      },
      {
        id: 'database-errors',
        name: 'Database Error Rate',
        condition: 'database.errorRate',
        threshold: 0.02, // 2%
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5
      }
    ];
  }

  private startCollection(): void {
    // Collect metrics every 5 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 5000);

    // Clean up old data every minute
    setInterval(() => {
      this.cleanupOldData();
    }, 60000);

    // Check alerts every 30 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 30000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics();
      this.emit('metrics', metrics);
      this.metrics.set('current', metrics);
      
      logger.debug('Metrics collected', {
        metadata: {
          timestamp: metrics.timestamp,
          cpu: metrics.cpu.usage,
          memory: metrics.memory.percentage,
          requests: metrics.api.requestsPerMinute
        }
      });
    } catch (error) {
      logger.error('Failed to collect metrics', {
        error: { message: (error as Error).message }
      });
    }
  }

  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const supabaseStats = supabaseMonitor.getStats();
    
    // Calculate network metrics
    const avgResponseTime = this.requestTimes.length > 0 
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length 
      : 0;
    
    const totalRequests = Array.from(this.apiEndpoints.values())
      .reduce((sum, endpoint) => sum + endpoint.times.length, 0);
    
    const totalErrors = Array.from(this.apiEndpoints.values())
      .reduce((sum, endpoint) => sum + endpoint.errors, 0);

    // Calculate slow endpoints
    const slowEndpoints = Array.from(this.apiEndpoints.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        avgTime: data.times.length > 0 ? data.times.reduce((a, b) => a + b, 0) / data.times.length : 0,
        count: data.times.length
      }))
      .filter(ep => ep.avgTime > 1000)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Error metrics by level
    const errorsByLevel: Record<string, number> = {};
    let totalErrors2 = 0;
    this.errorCounts.forEach((count, level) => {
      errorsByLevel[level] = count;
      totalErrors2 += count;
    });

    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: Math.random() * 100, // Simplified - in production use actual CPU metrics
        load: [0.5, 0.7, 0.3] // Load average
      },
      memory: {
        used: memUsage.rss,
        total: memUsage.rss + memUsage.external,
        percentage: (memUsage.rss / (memUsage.rss + memUsage.external)) * 100,
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal
        }
      },
      network: {
        requests: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
        avgResponseTime
      },
      database: {
        connectionCount: 1, // Simplified
        activeQueries: this.slowQueries.filter(q => Date.now() - q.timestamp < 10000).length,
        slowQueries: this.slowQueries.length,
        errorRate: supabaseStats.errorRate,
        avgQueryTime: 50 // Simplified
      },
      api: {
        requestsPerMinute: Math.floor(totalRequests / Math.max(1, (Date.now() - Date.now()) / 60000)) || totalRequests,
        errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
        slowEndpoints
      },
      errors: {
        total: totalErrors2,
        byLevel: errorsByLevel,
        recent: this.recentErrors.slice(0, 10)
      }
    };
  }

  // Public methods for recording metrics
  public recordRequest(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    const key = `${method} ${endpoint}`;
    
    if (!this.apiEndpoints.has(key)) {
      this.apiEndpoints.set(key, { times: [], errors: 0 });
    }
    
    const endpointData = this.apiEndpoints.get(key)!;
    endpointData.times.push(responseTime);
    
    if (statusCode >= 400) {
      endpointData.errors++;
    }
    
    this.requestTimes.push(responseTime);
    
    logger.performance('api_request', responseTime, 'ms', {
      metadata: { endpoint, method, statusCode }
    });
  }

  public recordError(level: string, message: string): void {
    const current = this.errorCounts.get(level) || 0;
    this.errorCounts.set(level, current + 1);
    
    // Add to recent errors
    const existing = this.recentErrors.find(e => e.message === message && e.level === level);
    if (existing) {
      existing.count++;
      existing.timestamp = new Date().toISOString();
    } else {
      this.recentErrors.unshift({
        level,
        message,
        timestamp: new Date().toISOString(),
        count: 1
      });
      
      // Keep only last 50 unique errors
      if (this.recentErrors.length > 50) {
        this.recentErrors = this.recentErrors.slice(0, 50);
      }
    }
  }

  public recordDatabaseQuery(query: string, time: number): void {
    if (time > 1000) { // Slow query threshold
      this.slowQueries.push({
        query,
        time,
        timestamp: Date.now()
      });
      
      logger.warn('Slow database query detected', {
        database: { query, duration: time },
        metadata: { threshold: 1000 }
      });
    }
  }

  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up old request times (keep last hour)
    this.requestTimes = this.requestTimes.slice(-1000);
    
    // Clean up slow queries
    this.slowQueries = this.slowQueries.filter(q => q.timestamp > oneHourAgo);
    
    // Clean up API endpoint data
    this.apiEndpoints.forEach((data, key) => {
      data.times = data.times.slice(-100); // Keep last 100 requests per endpoint
      if (data.times.length === 0) {
        data.errors = 0;
      }
    });
    
    // Reset error counts every hour
    this.errorCounts.clear();
  }

  private checkAlerts(): void {
    const currentMetrics = this.metrics.get('current') as SystemMetrics;
    if (!currentMetrics) return;

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;
      
      // Check cooldown
      const now = Date.now();
      if (rule.lastTriggered && (now - rule.lastTriggered) < (rule.cooldown * 60 * 1000)) {
        return;
      }

      const value = this.getMetricValue(currentMetrics, rule.condition);
      if (value === undefined) return;

      let triggered = false;
      switch (rule.operator) {
        case 'gt':
          triggered = value > rule.threshold;
          break;
        case 'lt':
          triggered = value < rule.threshold;
          break;
        case 'eq':
          triggered = value === rule.threshold;
          break;
      }

      if (triggered) {
        rule.lastTriggered = now;
        this.emit('alert', {
          rule,
          value,
          timestamp: currentMetrics.timestamp
        });
        
        logger.warn(`Alert triggered: ${rule.name}`, {
          metadata: {
            rule: rule.name,
            condition: rule.condition,
            threshold: rule.threshold,
            actual: value,
            severity: rule.severity
          }
        });
      }
    });
  }

  private getMetricValue(metrics: SystemMetrics, path: string): number | undefined {
    const parts = path.split('.');
    let current: any = metrics;
    
    for (const part of parts) {
      if (current[part] === undefined) return undefined;
      current = current[part];
    }
    
    return typeof current === 'number' ? current : undefined;
  }

  // Public methods for dashboard
  public getCurrentMetrics(): SystemMetrics | undefined {
    return this.metrics.get('current');
  }

  public getHistoricalMetrics(minutes: number = 60): SystemMetrics[] {
    // In a real implementation, you'd store historical data
    // For now, return current metrics
    const current = this.getCurrentMetrics();
    return current ? [current] : [];
  }

  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  public updateAlertRule(id: string, updates: Partial<AlertRule>): void {
    const index = this.alertRules.findIndex(rule => rule.id === id);
    if (index >= 0) {
      this.alertRules[index] = { ...this.alertRules[index], ...updates };
      logger.info('Alert rule updated', { metadata: { ruleId: id, updates } });
    }
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();