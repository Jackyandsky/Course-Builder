/**
 * Auth Debug Utilities
 * For debugging authentication issues in production
 */

import { authStateManager } from './auth-state-manager';

// Make debug utilities available globally in browser console
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    // Check current auth state
    checkState: () => {
      const state = authStateManager?.getState() || { error: 'Auth state manager not initialized' };
      console.table(state);
      return state;
    },
    
    // Force reset invalid token state
    forceReset: () => {
      if (!authStateManager) {
        console.error('Auth state manager not initialized');
        return false;
      }
      authStateManager.forceReset();
      console.log('✅ Auth state reset successfully');
      return true;
    },
    
    // Check localStorage auth data
    checkLocalStorage: () => {
      const data = {
        'auth-token-invalid': localStorage.getItem('auth-token-invalid'),
        'auth-token-invalid-time': localStorage.getItem('auth-token-invalid-time'),
        'auth-token-invalid-domain': localStorage.getItem('auth-token-invalid-domain'),
        'auth-session-cache': localStorage.getItem('auth-session-cache'),
      };
      console.table(data);
      return data;
    },
    
    // Check all auth cookies
    checkCookies: () => {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && (
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('supabase')
        )) {
          acc[key] = value ? value.substring(0, 20) + '...' : 'empty';
        }
        return acc;
      }, {} as Record<string, string>);
      console.table(cookies);
      return cookies;
    },
    
    // Clear all auth data
    clearAll: () => {
      // Clear localStorage
      const keys = ['auth-token-invalid', 'auth-token-invalid-time', 
                    'auth-token-invalid-domain', 'auth-session-cache', 
                    'auth-state-message'];
      keys.forEach(key => localStorage.removeItem(key));
      
      // Clear cookies
      const cookieNames = ['sb-access-token', 'sb-refresh-token', 
                          'sb-auth-token', 'supabase-auth-token'];
      const domains = ['', '.vanboss.work', '.igpsedu.com'];
      
      domains.forEach(domain => {
        cookieNames.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domain ? ` domain=${domain};` : ''}`;
        });
      });
      
      console.log('✅ All auth data cleared');
      return true;
    },
    
    // Monitor auth state changes
    monitor: (duration = 10000) => {
      console.log(`📊 Monitoring auth state for ${duration / 1000} seconds...`);
      const interval = setInterval(() => {
        const state = authStateManager?.getState();
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}]`, state);
      }, 1000);
      
      setTimeout(() => {
        clearInterval(interval);
        console.log('📊 Monitoring stopped');
      }, duration);
    },
    
    // Test cross-tab communication
    testBroadcast: () => {
      if (!authStateManager) {
        console.error('Auth state manager not initialized');
        return false;
      }
      
      console.log('📡 Broadcasting test message...');
      authStateManager.reportTokenRefreshed('test-user-id');
      console.log('✅ Test message sent. Check other tabs for reception.');
      return true;
    },
    
    // Get detailed auth report
    getReport: async () => {
      const report = {
        stateManager: authStateManager?.getState() || null,
        localStorage: {} as any,
        cookies: {} as any,
        session: null as any,
      };
      
      // Get localStorage data
      ['auth-token-invalid', 'auth-token-invalid-time', 
       'auth-token-invalid-domain', 'auth-session-cache'].forEach(key => {
        const value = localStorage.getItem(key);
        if (value) report.localStorage[key] = value;
      });
      
      // Get cookie data
      document.cookie.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && key.includes('sb-')) {
          report.cookies[key] = value ? 'present' : 'empty';
        }
      });
      
      // Try to get current session
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        report.session = {
          status: response.status,
          ok: response.ok,
          hasInvalidHeader: response.headers.get('X-Auth-Invalid') === 'true',
        };
      } catch (error) {
        report.session = { error: String(error) };
      }
      
      console.log('📋 Auth Debug Report:');
      console.log(JSON.stringify(report, null, 2));
      return report;
    },
  };
  
  console.log(`
🔐 Auth Debug Tools Loaded
========================
Available commands:
- authDebug.checkState()      // Check current auth state
- authDebug.checkLocalStorage() // Check localStorage auth data
- authDebug.checkCookies()     // Check auth cookies
- authDebug.forceReset()       // Force reset invalid token state
- authDebug.clearAll()         // Clear all auth data
- authDebug.monitor(10000)    // Monitor state for 10 seconds
- authDebug.testBroadcast()    // Test cross-tab communication
- authDebug.getReport()        // Get detailed auth report
  `);
}

export {};