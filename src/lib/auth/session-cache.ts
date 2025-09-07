/**
 * Server-side session caching to prevent excessive token refresh requests
 * This helps avoid 429 rate limit errors from Supabase
 */

import { Session } from '@supabase/supabase-js';

// In-memory cache for session data
// Key: user ID, Value: { session, timestamp }
const sessionCache = new Map<string, { session: Session; timestamp: number }>();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cleanup old cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      sessionCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export const serverSessionCache = {
  /**
   * Get cached session if it's still valid
   */
  get(userId: string): Session | null {
    const cached = sessionCache.get(userId);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Return cached session if it's less than 5 minutes old
    if (age < CACHE_DURATION) {
      // Check if the session itself is still valid
      const expiresAt = cached.session.expires_at;
      if (expiresAt && expiresAt * 1000 > now + 60000) { // Still valid for at least 1 minute
        return cached.session;
      }
    }
    
    // Cache is stale or session is expiring soon, remove it
    sessionCache.delete(userId);
    return null;
  },
  
  /**
   * Store session in cache
   */
  set(userId: string, session: Session): void {
    sessionCache.set(userId, {
      session,
      timestamp: Date.now(),
    });
  },
  
  /**
   * Remove session from cache
   */
  delete(userId: string): void {
    sessionCache.delete(userId);
  },
  
  /**
   * Clear all cached sessions
   */
  clear(): void {
    sessionCache.clear();
  },
  
  /**
   * Get cache statistics (for monitoring)
   */
  getStats(): { size: number; entries: Array<{ userId: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(sessionCache.entries()).map(([userId, value]) => ({
      userId,
      age: Math.floor((now - value.timestamp) / 1000), // Age in seconds
    }));
    
    return {
      size: sessionCache.size,
      entries,
    };
  },
};

// Rate limiting for token refresh attempts
const refreshAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REFRESH_ATTEMPTS = 3; // Max 3 attempts per minute

export const refreshRateLimiter = {
  /**
   * Check if refresh is allowed for this user
   */
  canRefresh(userId: string): boolean {
    const now = Date.now();
    const attempts = refreshAttempts.get(userId);
    
    if (!attempts || now > attempts.resetTime) {
      // Reset the counter
      refreshAttempts.set(userId, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
      return true;
    }
    
    if (attempts.count >= MAX_REFRESH_ATTEMPTS) {
      console.warn(`[RateLimiter] User ${userId} exceeded refresh rate limit`);
      return false;
    }
    
    // Increment counter
    attempts.count++;
    return true;
  },
  
  /**
   * Reset rate limit for a user
   */
  reset(userId: string): void {
    refreshAttempts.delete(userId);
  },
  
  /**
   * Get rate limit status for monitoring
   */
  getStatus(userId: string): { allowed: boolean; remaining: number; resetIn: number } | null {
    const now = Date.now();
    const attempts = refreshAttempts.get(userId);
    
    if (!attempts || now > attempts.resetTime) {
      return {
        allowed: true,
        remaining: MAX_REFRESH_ATTEMPTS,
        resetIn: 0,
      };
    }
    
    return {
      allowed: attempts.count < MAX_REFRESH_ATTEMPTS,
      remaining: Math.max(0, MAX_REFRESH_ATTEMPTS - attempts.count),
      resetIn: Math.max(0, attempts.resetTime - now),
    };
  },
};

// Cleanup rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of refreshAttempts.entries()) {
    if (now > value.resetTime) {
      refreshAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes