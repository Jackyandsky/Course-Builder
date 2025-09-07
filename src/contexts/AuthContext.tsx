'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user-management';
import { 
  getCachedSession, 
  cacheSession, 
  clearCachedSession, 
  isJWTExpired,
  shouldRefreshSession 
} from '@/lib/auth/jwt-validator';
import { authStateManager } from '@/lib/auth/auth-state-manager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any, redirectTo?: string) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signInWithMagicLink: (email: string, metadata?: any, redirectTo?: string) => Promise<{ success: boolean; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const checkingRef = useRef(false);
  const lastCheckTime = useRef<number>(0);
  const initialCheckDone = useRef(false);
  const invalidTokenDetected = useRef(false); // Prevent refresh attempts after invalid token

  // Hydration-safe client check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check session on mount and set up polling
  useEffect(() => {
    if (!isClient) return; // Wait for hydration
    
    let mounted = true;

    const checkInitialSession = async () => {
      if (!mounted || initialCheckDone.current) return;
      
      initialCheckDone.current = true;
      console.log('[AuthContext] Initial session check starting...');
      
      // Try cached session first for instant UI
      const cached = getCachedSession(300000); // 5 minutes cache
      if (cached?.user && !isJWTExpired(cached.session?.access_token || '', 300)) {
        console.log('[AuthContext] Using cached session for instant UI');
        setUser(cached.user);
        setSession(cached.session as Session);
        setUserProfile(cached.userProfile);
        setLoading(false);
        
        // Background refresh without blocking UI
        setTimeout(() => {
          if (mounted) {
            checkSession().catch(console.error);
          }
        }, 1000);
        return;
      }
      
      // No valid cache - check with server
      setLoading(true);
      
      try {
        // Add exponential backoff on 429 errors
        const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          
          if (response.status === 429 && retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`[AuthContext] Rate limited, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retryCount + 1);
          }
          
          return response;
        };
        
        const response = await fetchWithRetry();
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AuthContext] Initial session response:', { 
            hasUser: !!data.user, 
            userEmail: data.user?.email 
          });
          
          if (data.user) {
            setUser(data.user);
            setSession(data.session);
            setUserProfile(data.userProfile);
            
            // Cache for future use
            if (data.session?.access_token) {
              cacheSession(data);
            }
          } else {
            setUser(null);
            setSession(null);
            setUserProfile(null);
          }
        } else {
          console.log('[AuthContext] Initial session check failed with status:', response.status);
          setUser(null);
          setSession(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[AuthContext] Initial session check error:', error);
        // On error, try cached data
        const cached = getCachedSession(60000);
        if (cached?.user) {
          setUser(cached.user);
          setSession(cached.session as Session);
          setUserProfile(cached.userProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial check - no delay needed
    checkInitialSession();

    // Poll session every 30 minutes (significantly increased to reduce API calls)
    // Most JWT tokens last 1 hour, so checking every 30 minutes is sufficient
    const interval = setInterval(() => {
      if (mounted) {
        const cached = getCachedSession();
        if (cached?.session?.access_token && shouldRefreshSession(cached.session.access_token)) {
          console.log('[AuthContext] Scheduled session refresh needed');
          checkSession();
        }
      }
    }, 1800000); // 30 minutes

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isClient]); // Add isClient dependency

  const checkSession = async () => {
    // Check with global auth state manager first
    if (authStateManager && !authStateManager.canRefreshToken()) {
      console.log('[AuthContext] Auth state manager blocking refresh attempt');
      setLoading(false);
      // Clear local state if tokens are invalid
      setUser(null);
      setSession(null);
      setUserProfile(null);
      return;
    }
    
    // If we've detected an invalid token locally, don't attempt any more refreshes
    if (invalidTokenDetected.current) {
      console.log('[AuthContext] Invalid token detected locally, skipping refresh attempt');
      setLoading(false);
      return;
    }
    
    // Prevent concurrent checks and rate limiting (increased to 5 seconds)
    const now = Date.now();
    if (checkingRef.current || (now - lastCheckTime.current < 5000)) {
      // If already checking or checked within last 5 seconds
      setLoading(false);
      return;
    }
    
    try {
      checkingRef.current = true;
      lastCheckTime.current = now;
      
      console.log('[AuthContext] Checking session...');
      
      // Add exponential backoff for retry attempts
      const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
        
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
            cache: 'no-store',
            headers: {
              'X-Client-Version': '1.0', // Version tracking for debugging
            },
          });
          
          // Check for invalid token header from middleware
          if (response.headers.get('X-Auth-Invalid') === 'true') {
            console.log('[AuthContext] Invalid auth detected via header');
            if (authStateManager) {
              authStateManager.reportInvalidToken();
            }
            invalidTokenDetected.current = true;
          }
          
          clearTimeout(timeoutId);
          
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
            console.log(`[AuthContext] Rate limited on background check, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(retryCount + 1);
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };
      
      const response = await fetchWithRetry();

      if (response.ok) {
        const data = await response.json();
        
        // Check if refresh token was invalid and cleared
        if (data.refreshTokenInvalid) {
          console.log('[AuthContext] Refresh token was invalid, clearing local session');
          invalidTokenDetected.current = true; // Set flag to prevent future attempts
          
          // Report to global auth state manager
          if (authStateManager) {
            authStateManager.reportInvalidToken(data.user?.id);
          }
          
          clearCachedSession();
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setLoading(false);
          
          // Clear all auth cookies to prevent any further attempts
          document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          return;
        }
        
        console.log('[AuthContext] Session response:', { 
          hasUser: !!data.user, 
          hasSession: !!data.session,
          userEmail: data.user?.email,
          fromCache: data.fromCache || data.cached,
        });
        
        // Cache the session data for fast access
        if (data.user && data.session?.access_token) {
          cacheSession(data);
          // Report successful refresh to auth state manager
          if (authStateManager) {
            authStateManager.reportTokenRefreshed(data.user.id);
          }
        }
        
        // Always update state with the response
        setUser(data.user);
        setSession(data.session);
        setUserProfile(data.userProfile);
      } else if (response.status === 429) {
        // Rate limited - use cached data if available
        console.log('[AuthContext] Rate limited, using cached data');
        const cached = getCachedSession(60000); // Accept cache up to 1 minute old
        if (cached?.user) {
          setUser(cached.user);
          setSession(cached.session as Session);
          setUserProfile(cached.userProfile);
        }
      } else if (response.status === 401) {
        console.log('[AuthContext] 401 - Clearing session');
        // Clear cache on auth failure
        clearCachedSession();
        
        // Clear state
        setUser(null);
        setSession(null);
        setUserProfile(null);
      } else {
        console.log('[AuthContext] Session check failed with status:', response.status);
      }
    } catch (error) {
      // Handle abort errors silently
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Session check timed out - using cached data if available');
        
        // Try to use cached session on timeout
        const cached = getCachedSession(60000); // Accept 1 minute old cache on timeout
        if (cached && cached.user) {
          setUser(cached.user);
          setSession(cached.session as Session);
          setUserProfile(cached.userProfile);
        }
      } else {
        console.error('Session check error:', error);
      }
      // Don't clear session on network errors
    } finally {
      // ALWAYS set loading to false after first check
      setLoading(false);
      checkingRef.current = false;
    }
  };

  const refreshSession = async () => {
    await checkSession();
  };

  const signUp = async (email: string, password: string, metadata?: any, redirectTo?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, metadata, redirectTo }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSession(data.session);
        return { user: data.user, error: null };
      } else {
        return { user: null, error: data.error };
      }
    } catch (error) {
      return { user: null, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string, metadata?: any, redirectTo?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, metadata, redirectTo }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, error: null };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setSession(data.session);
        setUserProfile(data.userProfile);
        return { user: data.user, error: null };
      } else {
        console.error('Login failed:', data.error, 'Status:', response.status);
        return { user: null, error: { message: data.error || 'Authentication failed' } };
      }
    } catch (error) {
      console.error('Login exception:', error);
      return { user: null, error: { message: 'Network error' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear cache on logout
        clearCachedSession();
        setUser(null);
        setSession(null);
        setUserProfile(null);
        // Redirect to landing page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    // This still needs to use Supabase directly or create another API route
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
    signUp,
    signIn,
    signInWithMagicLink,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}