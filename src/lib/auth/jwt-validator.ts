/**
 * Client-side JWT validation utilities
 * No Supabase dependencies - pure JavaScript
 */

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  role?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  [key: string]: any;
}

/**
 * Decode JWT without verification (for client-side use only)
 * DO NOT use this for security decisions - only for optimistic UI
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '=='.substring(0, (3 - (base64.length % 3)) % 3);
    
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Check if JWT is expired (with optional buffer time)
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time before actual expiration (default: 60 seconds)
 */
export function isJWTExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Treat invalid tokens as expired
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationWithBuffer = payload.exp - bufferSeconds;
  
  return now >= expirationWithBuffer;
}

/**
 * Get remaining time until JWT expiration in seconds
 */
export function getJWTTimeToExpiry(token: string): number {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;
  
  return Math.max(0, remaining);
}

/**
 * Extract user info from JWT
 */
export function getUserFromJWT(token: string): { id: string; email?: string; role?: string } | null {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role || payload.user_role,
  };
}

/**
 * Session cache interface
 */
export interface CachedSession {
  user: any;
  session: {
    access_token: string;
    expires_at?: number;
    expires_in?: number;
  };
  userProfile: any;
  timestamp: number;
  cachedAt: number;
}

/**
 * Cache session data in sessionStorage with validation
 */
export function cacheSession(sessionData: any): void {
  try {
    const cacheData: CachedSession = {
      ...sessionData,
      cachedAt: Date.now(),
    };
    
    sessionStorage.setItem('auth_session_cache', JSON.stringify(cacheData));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    console.warn('Failed to cache session:', error);
  }
}

/**
 * Retrieve cached session with validation
 * @param maxAge - Maximum cache age in milliseconds (default: 5 minutes)
 */
export function getCachedSession(maxAge: number = 300000): CachedSession | null {
  try {
    const cached = sessionStorage.getItem('auth_session_cache');
    if (!cached) {
      return null;
    }

    const data: CachedSession = JSON.parse(cached);
    
    // Check cache age
    const age = Date.now() - data.cachedAt;
    if (age > maxAge) {
      // Cache is too old
      sessionStorage.removeItem('auth_session_cache');
      return null;
    }

    // Check if JWT is still valid
    if (data.session?.access_token && isJWTExpired(data.session.access_token)) {
      // Token is expired
      sessionStorage.removeItem('auth_session_cache');
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to retrieve cached session:', error);
    sessionStorage.removeItem('auth_session_cache');
    return null;
  }
}

/**
 * Clear cached session
 */
export function clearCachedSession(): void {
  try {
    sessionStorage.removeItem('auth_session_cache');
  } catch (error) {
    console.warn('Failed to clear cached session:', error);
  }
}

/**
 * Check if we should refresh the session
 * Returns true if token will expire soon (within 10 minutes)
 * Increased threshold to reduce frequency of refresh attempts
 */
export function shouldRefreshSession(token: string): boolean {
  const timeToExpiry = getJWTTimeToExpiry(token);
  return timeToExpiry > 0 && timeToExpiry < 600; // Less than 10 minutes
}