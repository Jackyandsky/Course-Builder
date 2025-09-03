import { getMiddlewareSupabaseClient } from './middleware-helper';

/**
 * Monitor Supabase connection health and performance
 */
export class SupabaseMonitor {
  private static instance: SupabaseMonitor;
  private requestCount = 0;
  private errorCount = 0;
  private lastReset = Date.now();
  private readonly resetInterval = 60000; // Reset counters every minute
  
  private constructor() {}
  
  static getInstance(): SupabaseMonitor {
    if (!SupabaseMonitor.instance) {
      SupabaseMonitor.instance = new SupabaseMonitor();
    }
    return SupabaseMonitor.instance;
  }
  
  incrementRequest() {
    this.checkReset();
    this.requestCount++;
  }
  
  incrementError() {
    this.checkReset();
    this.errorCount++;
  }
  
  private checkReset() {
    const now = Date.now();
    if (now - this.lastReset > this.resetInterval) {
      console.log(`[Supabase Monitor] Stats: ${this.requestCount} requests, ${this.errorCount} errors`);
      this.requestCount = 0;
      this.errorCount = 0;
      this.lastReset = now;
    }
  }
  
  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      uptime: Date.now() - this.lastReset
    };
  }
  
  async checkConnection() {
    try {
      const supabase = getMiddlewareSupabaseClient();
      const startTime = Date.now();
      
      // Simple health check query
      const { error } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        this.incrementError();
        console.error('[Supabase Monitor] Health check failed:', error);
        return { healthy: false, responseTime, error };
      }
      
      this.incrementRequest();
      return { healthy: true, responseTime };
    } catch (err) {
      this.incrementError();
      console.error('[Supabase Monitor] Health check error:', err);
      return { healthy: false, error: err };
    }
  }
}

// Export singleton instance
export const supabaseMonitor = SupabaseMonitor.getInstance();