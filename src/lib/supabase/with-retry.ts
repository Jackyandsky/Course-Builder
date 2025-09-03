import { supabaseMonitor } from './monitor';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Wraps a Supabase query with retry logic and monitoring
 */
export async function withRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2
  } = options;
  
  let lastError: any;
  let currentDelay = retryDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      supabaseMonitor.incrementRequest();
      const result = await queryFn();
      
      if (!result.error) {
        return result;
      }
      
      lastError = result.error;
      
      // Check if error is retryable
      if (!isRetryableError(result.error)) {
        supabaseMonitor.incrementError();
        return result;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        supabaseMonitor.incrementError();
        return result;
      }
      
      console.warn(`[Supabase Retry] Attempt ${attempt + 1} failed, retrying in ${currentDelay}ms:`, result.error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
      
    } catch (error) {
      lastError = error;
      supabaseMonitor.incrementError();
      
      if (attempt === maxRetries) {
        return { data: null, error };
      }
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Network errors
  if (error.message?.includes('fetch failed')) return true;
  if (error.message?.includes('network')) return true;
  
  // Connection errors
  if (error.code === 'ECONNRESET') return true;
  if (error.code === 'ETIMEDOUT') return true;
  if (error.code === 'ENOTFOUND') return true;
  
  // Database connection errors
  if (error.code === '08P01') return true; // Protocol violation
  if (error.code === '08006') return true; // Connection failure
  if (error.code === '08001') return true; // Unable to connect
  if (error.code === '57P03') return true; // Cannot connect now
  
  // Rate limiting
  if (error.status === 429) return true;
  
  // Server errors (might be temporary)
  if (error.status >= 500 && error.status < 600) return true;
  
  return false;
}

/**
 * Batch multiple queries to reduce connection overhead
 */
export async function batchQueries<T extends readonly Promise<any>[]>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(queries);
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      console.warn(`[Supabase Batch] Slow batch query detected: ${duration}ms for ${queries.length} queries`);
    }
    
    return results as { [K in keyof T]: Awaited<T[K]> };
  } catch (error) {
    console.error('[Supabase Batch] Batch query failed:', error);
    throw error;
  }
}