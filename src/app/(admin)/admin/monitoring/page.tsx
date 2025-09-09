'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface SystemMetrics {
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

interface Alert {
  rule: {
    id: string;
    name: string;
    severity: string;
  };
  value: number;
  timestamp: string;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [historicalMetrics, setHistoricalMetrics] = useState<SystemMetrics[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to real-time monitoring stream
  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    const eventSource = new EventSource('/api/admin/monitoring/websocket');
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('Connected to monitoring stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'metrics':
            setMetrics(data.data);
            setHistoricalMetrics(prev => [...prev.slice(-59), data.data]); // Keep last 60 data points
            break;
          
          case 'alert':
            setAlerts(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 alerts
            // Show browser notification for critical alerts
            if (data.data.rule.severity === 'critical') {
              if (Notification.permission === 'granted') {
                new Notification(`Critical Alert: ${data.data.rule.name}`, {
                  body: `Value: ${data.data.value}`,
                  icon: '/favicon.ico'
                });
              }
            }
            break;
          
          case 'heartbeat':
            // Keep connection alive
            break;
        }
      } catch (error) {
        console.error('Error parsing monitoring data:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      console.error('Monitoring stream connection error');
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connectToStream();
        }
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  }, []);

  // Initialize connection
  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectToStream]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return Math.round(value * 100) / 100 + '%';
  };

  // Get status color based on value and thresholds
  const getStatusColor = (value: number, warning: number, critical: number): string => {
    if (value >= critical) return 'text-red-600 bg-red-100';
    if (value >= warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Get alert severity color
  const getAlertColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading monitoring dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time application performance and health metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' ? 'text-green-700 bg-green-100' :
            connectionStatus === 'connecting' ? 'text-yellow-700 bg-yellow-100' :
            'text-red-700 bg-red-100'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            {connectionStatus === 'connected' ? 'Live' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </div>
          <span className="text-sm text-gray-500">
            Last update: {new Date(metrics.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold">{formatPercentage(metrics.cpu.usage)}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(metrics.cpu.usage, 70, 90)
            }`}>
              {metrics.cpu.usage < 70 ? 'Normal' : metrics.cpu.usage < 90 ? 'Warning' : 'Critical'}
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.cpu.usage < 70 ? 'bg-green-500' : 
                  metrics.cpu.usage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.cpu.usage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold">{formatPercentage(metrics.memory.percentage)}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(metrics.memory.percentage, 80, 95)
            }`}>
              {metrics.memory.percentage < 80 ? 'Normal' : metrics.memory.percentage < 95 ? 'Warning' : 'Critical'}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.memory.percentage < 80 ? 'bg-green-500' : 
                  metrics.memory.percentage < 95 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.memory.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Network Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold">{Math.round(metrics.network.avgResponseTime)}ms</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(metrics.network.avgResponseTime, 1000, 3000)
            }`}>
              {metrics.network.avgResponseTime < 1000 ? 'Fast' : 
               metrics.network.avgResponseTime < 3000 ? 'Slow' : 'Critical'}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {metrics.network.requests} requests | {formatPercentage(metrics.network.errorRate * 100)} errors
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database Health</p>
              <p className="text-2xl font-bold">{Math.round(metrics.database.avgQueryTime)}ms</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusColor(metrics.database.errorRate * 100, 2, 5)
            }`}>
              {metrics.database.errorRate < 0.02 ? 'Healthy' : 
               metrics.database.errorRate < 0.05 ? 'Warning' : 'Critical'}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {metrics.database.slowQueries} slow queries | {formatPercentage(metrics.database.errorRate * 100)} errors
          </div>
        </div>
      </div>

      {/* API Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slow Endpoints */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Slow API Endpoints</h3>
          {metrics.api.slowEndpoints.length > 0 ? (
            <div className="space-y-3">
              {metrics.api.slowEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{endpoint.endpoint}</p>
                    <p className="text-xs text-gray-500">{endpoint.count} requests</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{Math.round(endpoint.avgTime)}ms</p>
                    <p className="text-xs text-gray-500">avg time</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No slow endpoints detected</p>
          )}
        </div>

        {/* Recent Errors */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
          {metrics.errors.recent.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {metrics.errors.recent.slice(0, 10).map((error, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-red-50 rounded border-l-4 border-red-400">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        error.level === 'error' ? 'text-red-700 bg-red-100' : 'text-yellow-700 bg-yellow-100'
                      }`}>
                        {error.level.toUpperCase()}
                      </span>
                      {error.count > 1 && (
                        <span className="ml-2 text-xs text-gray-600">×{error.count}</span>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-gray-700 truncate">{error.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent errors</p>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.rule.severity)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{alert.rule.name}</p>
                    <p className="text-sm opacity-75">Value: {alert.value}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertColor(alert.rule.severity)}`}>
                      {alert.rule.severity.toUpperCase()}
                    </span>
                    <p className="text-xs mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Error Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{metrics.errors.total}</p>
            <p className="text-sm text-gray-600">Total Errors</p>
          </div>
          {Object.entries(metrics.errors.byLevel).map(([level, count]) => (
            <div key={level} className="text-center">
              <p className={`text-2xl font-bold ${
                level === 'error' ? 'text-red-600' : 
                level === 'warn' ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                {count}
              </p>
              <p className="text-sm text-gray-600 capitalize">{level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}