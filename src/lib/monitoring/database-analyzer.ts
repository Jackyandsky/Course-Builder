/**
 * Database Query Analyzer
 * Analyzes database queries for performance optimization
 */

import { logger } from '@/lib/logger';
import { metricsCollector } from './metrics-collector';

export interface QueryAnalysis {
  query: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
  executionTime: number;
  timestamp: number;
  estimatedRows?: number;
  hasIndex?: boolean;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueryPattern {
  pattern: string;
  count: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  examples: string[];
}

export interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  queryPatterns: QueryPattern[];
  recentAnalyses: QueryAnalysis[];
  recommendations: string[];
}

class DatabaseAnalyzer {
  private static instance: DatabaseAnalyzer;
  private queries: QueryAnalysis[] = [];
  private readonly slowQueryThreshold = 1000; // ms
  private readonly maxStoredQueries = 1000;
  
  private constructor() {}

  public static getInstance(): DatabaseAnalyzer {
    if (!DatabaseAnalyzer.instance) {
      DatabaseAnalyzer.instance = new DatabaseAnalyzer();
    }
    return DatabaseAnalyzer.instance;
  }

  /**
   * Analyze a database query for performance issues
   */
  public analyzeQuery(
    query: string, 
    executionTime: number, 
    metadata?: {
      table?: string;
      rows?: number;
      cached?: boolean;
    }
  ): QueryAnalysis {
    const analysis: QueryAnalysis = {
      query: this.sanitizeQuery(query),
      table: metadata?.table || this.extractTableName(query),
      operation: this.detectOperation(query),
      executionTime,
      timestamp: Date.now(),
      estimatedRows: metadata?.rows,
      suggestions: [],
      severity: 'low'
    };

    // Analyze query performance
    this.addPerformanceSuggestions(analysis);
    
    // Analyze query structure
    this.addStructureSuggestions(analysis);
    
    // Store analysis
    this.queries.push(analysis);
    
    // Keep only recent queries
    if (this.queries.length > this.maxStoredQueries) {
      this.queries = this.queries.slice(-this.maxStoredQueries);
    }
    
    // Log if it's a slow query
    if (executionTime > this.slowQueryThreshold) {
      logger.warn('Slow database query detected', {
        database: {
          query: analysis.query,
          duration: executionTime,
          table: analysis.table,
          suggestions: analysis.suggestions
        }
      });
      
      // Record in metrics collector
      metricsCollector.recordDatabaseQuery(analysis.query, executionTime);
    }
    
    return analysis;
  }

  /**
   * Get comprehensive database metrics
   */
  public getMetrics(): DatabaseMetrics {
    const recentQueries = this.queries.filter(q => 
      Date.now() - q.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const slowQueries = recentQueries.filter(q => 
      q.executionTime > this.slowQueryThreshold
    );
    
    const avgTime = recentQueries.length > 0 
      ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length
      : 0;

    return {
      totalQueries: recentQueries.length,
      slowQueries: slowQueries.length,
      averageQueryTime: avgTime,
      queryPatterns: this.getQueryPatterns(recentQueries),
      recentAnalyses: slowQueries.slice(-20), // Last 20 slow queries
      recommendations: this.generateRecommendations(recentQueries)
    };
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/token\s*=\s*'[^']*'/gi, "token = '[REDACTED]'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret = '[REDACTED]'")
      .trim();
  }

  /**
   * Extract table name from SQL query
   */
  private extractTableName(query: string): string {
    const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    const intoMatch = query.match(/into\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    const updateMatch = query.match(/update\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    const deleteMatch = query.match(/delete\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    
    return (fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || 'unknown').toLowerCase();
  }

  /**
   * Detect SQL operation type
   */
  private detectOperation(query: string): QueryAnalysis['operation'] {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    return 'UNKNOWN';
  }

  /**
   * Add performance-based suggestions
   */
  private addPerformanceSuggestions(analysis: QueryAnalysis): void {
    const { query, executionTime } = analysis;
    const queryLower = query.toLowerCase();

    // Execution time analysis
    if (executionTime > 5000) {
      analysis.severity = 'critical';
      analysis.suggestions.push('Query execution time is extremely slow (>5s). Consider query optimization.');
    } else if (executionTime > 2000) {
      analysis.severity = 'high';
      analysis.suggestions.push('Query execution time is slow (>2s). Review query structure and indexes.');
    } else if (executionTime > 1000) {
      analysis.severity = 'medium';
      analysis.suggestions.push('Query execution time is above threshold (>1s). Consider optimization.');
    }

    // N+1 query detection
    if (analysis.operation === 'SELECT' && executionTime < 100) {
      const recentSimilar = this.queries.filter(q => 
        q.table === analysis.table &&
        q.operation === 'SELECT' &&
        Date.now() - q.timestamp < 5000 // Within last 5 seconds
      );
      
      if (recentSimilar.length > 10) {
        analysis.severity = 'high';
        analysis.suggestions.push('Potential N+1 query detected. Consider using JOIN or eager loading.');
      }
    }

    // SELECT * detection
    if (queryLower.includes('select *')) {
      analysis.suggestions.push('Avoid SELECT * - specify only needed columns to improve performance.');
    }

    // Missing LIMIT detection
    if (queryLower.includes('select') && !queryLower.includes('limit') && !queryLower.includes('where')) {
      analysis.suggestions.push('Consider adding LIMIT clause for unbounded SELECT queries.');
    }

    // OR condition detection
    if (queryLower.includes(' or ')) {
      analysis.suggestions.push('OR conditions can be slow. Consider UNION or separate queries with proper indexes.');
    }

    // Function in WHERE clause
    if (queryLower.match(/where.*\w+\(/)) {
      analysis.suggestions.push('Functions in WHERE clauses prevent index usage. Consider restructuring the query.');
    }
  }

  /**
   * Add structure-based suggestions
   */
  private addStructureSuggestions(analysis: QueryAnalysis): void {
    const queryLower = analysis.query.toLowerCase();

    // JOIN without proper conditions
    if (queryLower.includes('join') && !queryLower.includes('on')) {
      analysis.suggestions.push('Ensure JOINs have proper ON conditions to avoid Cartesian products.');
    }

    // Subquery optimization
    if (queryLower.includes('select') && queryLower.match(/\(\s*select/)) {
      analysis.suggestions.push('Consider converting subqueries to JOINs for better performance.');
    }

    // ORDER BY without LIMIT
    if (queryLower.includes('order by') && !queryLower.includes('limit')) {
      analysis.suggestions.push('ORDER BY without LIMIT can be expensive. Consider pagination.');
    }

    // DISTINCT usage
    if (queryLower.includes('distinct')) {
      analysis.suggestions.push('DISTINCT can be expensive. Verify if it\'s necessary or if duplicates can be avoided at source.');
    }

    // Complex WHERE clauses
    const whereMatches = queryLower.match(/where.*?(?:group|order|limit|$)/g);
    if (whereMatches && whereMatches[0].split('and').length > 5) {
      analysis.suggestions.push('Complex WHERE clauses with many conditions may benefit from query restructuring.');
    }
  }

  /**
   * Identify query patterns
   */
  private getQueryPatterns(queries: QueryAnalysis[]): QueryPattern[] {
    const patterns = new Map<string, {
      count: number;
      times: number[];
      examples: string[];
    }>();

    queries.forEach(query => {
      const pattern = this.generateQueryPattern(query.query);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, times: [], examples: [] });
      }
      
      const data = patterns.get(pattern)!;
      data.count++;
      data.times.push(query.executionTime);
      if (data.examples.length < 3) {
        data.examples.push(query.query);
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        avgTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        maxTime: Math.max(...data.times),
        minTime: Math.min(...data.times),
        examples: data.examples
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate a pattern from a query for grouping similar queries
   */
  private generateQueryPattern(query: string): string {
    return query
      .toLowerCase()
      .replace(/\b\d+\b/g, '?') // Replace numbers with ?
      .replace(/'[^']*'/g, '?') // Replace string literals with ?
      .replace(/\$\d+/g, '?') // Replace parameterized queries
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(queries: QueryAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze slow queries
    const slowQueries = queries.filter(q => q.executionTime > this.slowQueryThreshold);
    if (slowQueries.length > queries.length * 0.1) {
      recommendations.push(`${Math.round((slowQueries.length / queries.length) * 100)}% of queries are slow. Review database indexes and query patterns.`);
    }

    // Analyze table usage
    const tableUsage = new Map<string, number>();
    queries.forEach(q => {
      tableUsage.set(q.table, (tableUsage.get(q.table) || 0) + 1);
    });

    const mostUsedTable = Array.from(tableUsage.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostUsedTable && mostUsedTable[1] > queries.length * 0.3) {
      recommendations.push(`Table '${mostUsedTable[0]}' accounts for ${Math.round((mostUsedTable[1] / queries.length) * 100)}% of queries. Consider optimizing its indexes.`);
    }

    // Check for N+1 patterns
    const selectQueries = queries.filter(q => q.operation === 'SELECT');
    const quickSelects = selectQueries.filter(q => q.executionTime < 100);
    if (quickSelects.length > 50 && quickSelects.length > selectQueries.length * 0.7) {
      recommendations.push('High number of fast SELECT queries detected. Check for N+1 query patterns and consider eager loading.');
    }

    // Check for missing pagination
    const unpaginatedQueries = queries.filter(q => 
      q.operation === 'SELECT' && 
      !q.query.toLowerCase().includes('limit') &&
      q.executionTime > 500
    );
    if (unpaginatedQueries.length > 0) {
      recommendations.push(`${unpaginatedQueries.length} slow queries without LIMIT detected. Implement pagination for large result sets.`);
    }

    return recommendations.slice(0, 10);
  }

  /**
   * Get queries by table
   */
  public getQueriesByTable(tableName: string, hours: number = 24): QueryAnalysis[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.queries.filter(q => 
      q.table === tableName && q.timestamp > cutoff
    );
  }

  /**
   * Clear old query data
   */
  public cleanup(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.queries = this.queries.filter(q => q.timestamp > oneDayAgo);
    
    logger.debug('Database analyzer cleanup completed', {
      metadata: { remainingQueries: this.queries.length }
    });
  }
}

// Export singleton instance
export const databaseAnalyzer = DatabaseAnalyzer.getInstance();