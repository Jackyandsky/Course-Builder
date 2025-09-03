'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user-management';
import { 
  getCachedSession, 
  cacheSession, 
  clearCachedSession, 
  isJWTExpired,
  shouldRefreshSession 
} from '@/lib/auth/jwt-validator';
import { fetchWithTimeout, fetchWithRetry } from '@/lib/utils/api-timeout';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Request deduplication
const sessionCheckPromise = new Map<string, Promise<any>>();

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Start with false - non-blocking
  const [isInitialized, setIsInitialized] = useState(false);
  const mountedRef = useRef(true);
  const lastCheckTime = useRef<number>(0);

  // Deduplicated session check
  const checkSessionDeduplicated = useCallback(async () => {
    const key = 'session-check';
    
    // Return existing promise if already checking
    if (sessionCheckPromise.has(key)) {
      return sessionCheckPromise.get(key);
    }

    // Prevent rapid repeated checks
    const now = Date.now();
    if (now - lastCheckTime.current < 2000) {
      return;
    }
    lastCheckTime.current = now;

    const promise = (async () => {
      try {
        const response = await fetchWithRetry('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          timeout: 3000, // 3 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.user && data.session?.access_token) {
            cacheSession(data);
          }
          
          return data;
        } else if (response.status === 401) {
          clearCachedSession();
          return { user: null, session: null, userProfile: null };
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        console.warn('Session check failed:', error);
        
        // On error, use cached data if available
        const cached = getCachedSession(120000); // Accept 2 minute old cache on error
        if (cached?.user) {
          return cached;
        }
        
        return { user: null, session: null, userProfile: null };
      } finally {
        // Clean up deduplication map
        sessionCheckPromise.delete(key);
      }
    })();

    sessionCheckPromise.set(key, promise);
    return promise;
  }, []);

  // Non-blocking initialization
  useEffect(() => {
    if (!mountedRef.current) return;

    const initAuth = async () => {
      // Step 1: Immediately use cached session if valid (non-blocking)
      const cached = getCachedSession(60000); // 1 minute cache
      if (cached?.user && cached.session?.access_token && !isJWTExpired(cached.session.access_token)) {
        setUser(cached.user);
        setSession(cached.session as Session);
        setUserProfile(cached.userProfile);
        setIsInitialized(true);
        
        // Step 2: Background refresh (non-blocking)
        checkSessionDeduplicated().then(data => {
          if (mountedRef.current && data) {
            setUser(data.user);
            setSession(data.session);
            setUserProfile(data.userProfile);
          }
        }).catch(console.error);
      } else {
        // No valid cache - do a quick check with timeout
        setLoading(true);
        
        try {
          const data = await checkSessionDeduplicated();
          if (mountedRef.current && data) {
            setUser(data.user);
            setSession(data.session);
            setUserProfile(data.userProfile);
          }
        } finally {
          if (mountedRef.current) {
            setLoading(false);
            setIsInitialized(true);
          }
        }
      }
    };

    initAuth();

    // Reduced polling interval - check less frequently
    const interval = setInterval(() => {
      if (mountedRef.current) {
        const cached = getCachedSession();
        if (cached?.session?.access_token && shouldRefreshSession(cached.session.access_token)) {
          checkSessionDeduplicated().then(data => {
            if (mountedRef.current && data) {
              setUser(data.user);
              setSession(data.session);
              setUserProfile(data.userProfile);
            }
          }).catch(console.error);
        }
      }
    }, 900000); // 15 minutes (increased from 10)

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkSessionDeduplicated]);

  const refreshSession = useCallback(async () => {
    const data = await checkSessionDeduplicated();
    if (data) {
      setUser(data.user);
      setSession(data.session);
      setUserProfile(data.userProfile);
    }
  }, [checkSessionDeduplicated]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, metadata }),
        credentials: 'include',
        timeout: 5000,
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSession(data.session);
        if (data.session) cacheSession(data);
        return { user: data.user, error: null };
      }
      
      return { user: null, error: data.error };
    } catch (error) {
      return { user: null, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        timeout: 5000,
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSession(data.session);
        setUserProfile(data.userProfile);
        if (data.session) cacheSession(data);
        return { user: data.user, error: null };
      }
      
      return { user: null, error: { message: data.error || 'Authentication failed' } };
    } catch (error) {
      return { user: null, error: { message: 'Network error' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await fetchWithTimeout('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        timeout: 3000,
      });

      clearCachedSession();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear local state
      clearCachedSession();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetchWithTimeout('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        timeout: 5000,
      });

      const data = await response.json();
      return { error: data.error || null };
    } catch (error) {
      return { error: 'Network error' };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    isInitialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useOptimizedAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}