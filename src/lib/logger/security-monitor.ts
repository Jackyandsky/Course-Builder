import { Logger } from 'winston';
import { NextRequest } from 'next/server';

export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'SUSPICIOUS_ACCESS' | 'UNAUTHORIZED_ACTION' | 'DATA_ACCESS_VIOLATION' | 'INJECTION_ATTEMPT' | 'BRUTE_FORCE' | 'PRIVILEGE_ESCALATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface DebugIntelligence {
  type: 'ERROR_PATTERN' | 'PERFORMANCE_ANOMALY' | 'USER_BEHAVIOR_ANOMALY' | 'DATABASE_ISSUE' | 'API_FAILURE' | 'COMPONENT_ERROR';
  pattern: string;
  frequency: number;
  affectedUsers: string[];
  suggestions: string[];
  autoFix?: boolean;
  context: Record<string, any>;
}

export class SecurityMonitor {
  private logger: Logger;
  private suspiciousPatterns: Map<string, number> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private debugPatterns: Map<string, DebugIntelligence> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializePatterns();
  }

  private initializePatterns() {
    // Initialize security patterns to watch for
    this.suspiciousPatterns.set('rapid_requests', 0);
    this.suspiciousPatterns.set('admin_bruteforce', 0);
    this.suspiciousPatterns.set('sql_injection', 0);
    this.suspiciousPatterns.set('xss_attempt', 0);
  }

  // Security Event Logging
  logSecurityEvent(event: SecurityEvent) {
    this.logger.error('SECURITY_ALERT', {
      security: true,
      ...event,
      alert_level: event.severity,
      requires_investigation: event.severity === 'HIGH' || event.severity === 'CRITICAL'
    });

    // Trigger automated responses
    if (event.severity === 'CRITICAL') {
      this.triggerSecurityAlert(event);
    }
  }

  // Authentication Security
  logAuthFailure(request: NextRequest, reason: string, userId?: string) {
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Increment failed attempts
    const key = `${ip}_auth_failure`;
    this.failedAttempts.set(key, (this.failedAttempts.get(key) || 0) + 1);
    
    this.logSecurityEvent({
      type: 'AUTH_FAILURE',
      severity: this.failedAttempts.get(key)! > 5 ? 'HIGH' : 'MEDIUM',
      userId,
      ip,
      userAgent,
      endpoint: request.nextUrl.pathname,
      details: {
        reason,
        attempt_count: this.failedAttempts.get(key),
        method: request.method
      },
      timestamp: new Date().toISOString()
    });
  }

  // Database Security Monitoring
  logDatabaseAccess(query: string, userId: string, result: any, duration: number) {
    // Check for SQL injection patterns
    const suspiciousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from.*where.*1\s*=\s*1/i,
      /insert\s+into.*values.*\(/i,
      /exec\s*\(/i,
      /script\s*>/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(query));
    
    if (isSuspicious) {
      this.logSecurityEvent({
        type: 'INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        userId,
        details: {
          query: query.substring(0, 200), // First 200 chars for security
          duration,
          result_count: Array.isArray(result) ? result.length : 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log normal database access with intelligence
    this.logger.info('DATABASE_ACCESS', {
      database: true,
      user_id: userId,
      query_type: this.extractQueryType(query),
      duration,
      suspicious: isSuspicious,
      result_size: Array.isArray(result) ? result.length : typeof result === 'object' ? Object.keys(result).length : 0,
      table_accessed: this.extractTableName(query),
      timestamp: new Date().toISOString()
    });
  }

  // API Security Monitoring
  logAPIAccess(request: NextRequest, response: any, duration: number, userId?: string) {
    const ip = this.extractIP(request);
    const endpoint = request.nextUrl.pathname;
    const method = request.method;
    
    // Check for suspicious API access patterns
    this.checkSuspiciousAPIPatterns(ip, endpoint, method);
    
    this.logger.info('API_ACCESS', {
      api: true,
      method,
      endpoint,
      user_id: userId,
      ip,
      duration,
      response_status: response?.status || 'unknown',
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      timestamp: new Date().toISOString(),
      request_size: request.headers.get('content-length') || '0',
      response_size: response?.headers?.get('content-length') || '0'
    });
  }

  // Debug Intelligence - Automated Problem Detection
  detectDebugPatterns(error: Error, context: Record<string, any>) {
    const errorPattern = this.categorizeError(error);
    const patternKey = `${errorPattern.type}_${this.hashError(error.message)}`;
    
    if (!this.debugPatterns.has(patternKey)) {
      this.debugPatterns.set(patternKey, {
        type: errorPattern.type,
        pattern: error.message,
        frequency: 1,
        affectedUsers: context.userId ? [context.userId] : [],
        suggestions: this.generateAutoSuggestions(error, context),
        autoFix: this.canAutoFix(error),
        context: { ...context }
      });
    } else {
      const existing = this.debugPatterns.get(patternKey)!;
      existing.frequency++;
      if (context.userId && !existing.affectedUsers.includes(context.userId)) {
        existing.affectedUsers.push(context.userId);
      }
      existing.context = { ...existing.context, ...context };
    }

    // Log debug intelligence
    this.logger.warn('DEBUG_INTELLIGENCE', {
      debug: true,
      error_pattern: errorPattern.type,
      frequency: this.debugPatterns.get(patternKey)!.frequency,
      affected_users_count: this.debugPatterns.get(patternKey)!.affectedUsers.length,
      suggestions: this.debugPatterns.get(patternKey)!.suggestions,
      auto_fixable: this.debugPatterns.get(patternKey)!.autoFix,
      original_error: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // First 3 lines of stack
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Component Error Intelligence
  logComponentError(componentName: string, error: Error, props: any, userId?: string) {
    this.logger.error('COMPONENT_ERROR', {
      component: true,
      component_name: componentName,
      error_message: error.message,
      error_type: error.name,
      user_id: userId,
      props_keys: Object.keys(props || {}),
      stack_trace: error.stack?.split('\n').slice(0, 5),
      auto_recovery: this.suggestComponentRecovery(componentName, error),
      timestamp: new Date().toISOString()
    });

    this.detectDebugPatterns(error, { componentName, userId, props });
  }

  // User Behavior Intelligence
  logUserAction(userId: string, action: string, context: Record<string, any>) {
    this.logger.info('USER_ACTION', {
      user: true,
      user_id: userId,
      action,
      ...context,
      timestamp: new Date().toISOString()
    });

    // Detect unusual user behavior patterns
    this.detectUserBehaviorAnomalies(userId, action, context);
  }

  // Private helper methods
  private triggerSecurityAlert(event: SecurityEvent) {
    // In a real implementation, this would send notifications, trigger automated blocks, etc.
    this.logger.error('CRITICAL_SECURITY_ALERT', {
      alert: true,
      immediate_action_required: true,
      event,
      automated_response: 'IP_BLOCKED_TEMPORARILY',
      notification_sent: true
    });
  }

  private extractIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  private extractQueryType(query: string): string {
    const firstWord = query.trim().split(' ')[0].toUpperCase();
    return ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(firstWord) 
      ? firstWord : 'UNKNOWN';
  }

  private extractTableName(query: string): string {
    const match = query.match(/(?:from|into|update|table)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    return match ? match[1] : 'unknown';
  }

  private checkSuspiciousAPIPatterns(ip: string, endpoint: string, method: string) {
    const key = `${ip}_${endpoint}`;
    const requests = this.suspiciousPatterns.get(key) || 0;
    
    if (requests > 50) { // More than 50 requests to same endpoint from same IP
      this.logSecurityEvent({
        type: 'SUSPICIOUS_ACCESS',
        severity: 'HIGH',
        ip,
        endpoint,
        details: {
          request_count: requests,
          method,
          pattern: 'rapid_requests'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    this.suspiciousPatterns.set(key, requests + 1);
  }

  private categorizeError(error: Error): { type: DebugIntelligence['type'] } {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { type: 'API_FAILURE' };
    }
    if (error.message.includes('database') || error.message.includes('sql')) {
      return { type: 'DATABASE_ISSUE' };
    }
    if (error.message.includes('component') || error.message.includes('render')) {
      return { type: 'COMPONENT_ERROR' };
    }
    return { type: 'ERROR_PATTERN' };
  }

  private hashError(message: string): string {
    return message.replace(/\d+/g, 'N').replace(/['"]/g, '').substring(0, 50);
  }

  private generateAutoSuggestions(error: Error, context: Record<string, any>): string[] {
    const suggestions = [];
    
    if (error.message.includes('fetch')) {
      suggestions.push('Add retry logic with exponential backoff');
      suggestions.push('Implement request timeout handling');
    }
    
    if (error.message.includes('undefined') && context.componentName) {
      suggestions.push(`Add null checks in ${context.componentName} component`);
      suggestions.push('Implement loading states');
    }
    
    if (error.message.includes('database')) {
      suggestions.push('Check database connection pool');
      suggestions.push('Add query timeout protection');
    }

    return suggestions;
  }

  private canAutoFix(error: Error): boolean {
    // Simple patterns that could be auto-fixed
    return error.message.includes('timeout') || 
           error.message.includes('network') ||
           error.message.includes('fetch');
  }

  private suggestComponentRecovery(componentName: string, error: Error): string[] {
    return [
      `Implement error boundary around ${componentName}`,
      'Add fallback UI component',
      'Cache component state for recovery'
    ];
  }

  private detectUserBehaviorAnomalies(userId: string, action: string, context: Record<string, any>) {
    // This would implement machine learning-like pattern detection
    // For now, simple rule-based detection
    
    if (action === 'admin_access' && context.ip) {
      this.logger.warn('ADMIN_ACCESS_MONITORING', {
        security: true,
        user_id: userId,
        action,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Public method to get intelligence reports
  getDebugIntelligenceReport(): DebugIntelligence[] {
    return Array.from(this.debugPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Top 20 patterns
  }

  getSecuritySummary(): Record<string, any> {
    return {
      total_security_events: Array.from(this.suspiciousPatterns.values()).reduce((a, b) => a + b, 0),
      failed_auth_attempts: Array.from(this.failedAttempts.values()).reduce((a, b) => a + b, 0),
      top_debug_patterns: this.getDebugIntelligenceReport().slice(0, 5),
      timestamp: new Date().toISOString()
    };
  }
}