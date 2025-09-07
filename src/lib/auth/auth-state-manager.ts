/**
 * Global Auth State Manager
 * Coordinates authentication state across all tabs, windows, and domains
 * Prevents multiple processes from making invalid token refresh attempts
 */

interface AuthStateMessage {
  type: 'TOKEN_INVALID' | 'TOKEN_REFRESHED' | 'SESSION_CLEARED' | 'AUTH_CHECK';
  timestamp: number;
  domain?: string;
  userId?: string;
}

class AuthStateManager {
  private static instance: AuthStateManager;
  private channel: BroadcastChannel | null = null;
  private invalidTokenDetected = false;
  private lastInvalidTokenTime = 0;
  private readonly INVALID_TOKEN_TIMEOUT = 3600000; // 1 hour
  
  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        // Try to use BroadcastChannel if available
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('auth-state');
          
          // Listen for messages from other tabs
          this.channel.onmessage = (event: MessageEvent<AuthStateMessage>) => {
            this.handleMessage(event.data);
          };
        }
        
        // Check localStorage for persisted invalid token state
        this.checkPersistedState();
        
        // Listen for storage events (cross-tab communication fallback)
        window.addEventListener('storage', this.handleStorageEvent);
        
        // Clear invalid token state after timeout
        setInterval(() => {
          if (this.invalidTokenDetected && 
              Date.now() - this.lastInvalidTokenTime > this.INVALID_TOKEN_TIMEOUT) {
            this.clearInvalidTokenState();
          }
        }, 60000); // Check every minute
      } catch (error) {
        console.error('Failed to initialize AuthStateManager:', error);
      }
    }
  }
  
  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }
  
  private handleMessage(msg: AuthStateMessage) {
    console.log('[AuthStateManager] Received message:', msg);
    
    switch (msg.type) {
      case 'TOKEN_INVALID':
        this.setInvalidTokenState();
        break;
      case 'TOKEN_REFRESHED':
        this.clearInvalidTokenState();
        break;
      case 'SESSION_CLEARED':
        this.setInvalidTokenState();
        break;
    }
  }
  
  private handleStorageEvent = (event: StorageEvent) => {
    // Handle cross-tab communication via localStorage
    if (event.key === 'auth-state-message' && event.newValue) {
      try {
        const msg = JSON.parse(event.newValue) as AuthStateMessage;
        this.handleMessage(msg);
        // Clear the message after processing
        setTimeout(() => localStorage.removeItem('auth-state-message'), 100);
      } catch (e) {
        // Invalid message format
      }
    }
    
    if (event.key === 'auth-token-invalid' && event.newValue === 'true') {
      this.invalidTokenDetected = true;
      this.lastInvalidTokenTime = parseInt(
        localStorage.getItem('auth-token-invalid-time') || '0'
      );
    } else if (event.key === 'auth-token-invalid' && event.newValue === null) {
      this.invalidTokenDetected = false;
      this.lastInvalidTokenTime = 0;
    }
  };
  
  private checkPersistedState() {
    const invalid = localStorage.getItem('auth-token-invalid');
    const invalidTime = localStorage.getItem('auth-token-invalid-time');
    
    if (invalid === 'true' && invalidTime) {
      const time = parseInt(invalidTime);
      if (Date.now() - time < this.INVALID_TOKEN_TIMEOUT) {
        this.invalidTokenDetected = true;
        this.lastInvalidTokenTime = time;
        console.log('[AuthStateManager] Restored invalid token state from localStorage', {
          elapsed: `${Math.round((Date.now() - time) / 1000)}s ago`,
          domain: localStorage.getItem('auth-token-invalid-domain'),
        });
      } else {
        // Clear expired state
        this.clearInvalidTokenState();
      }
    }
  }
  
  private setInvalidTokenState() {
    this.invalidTokenDetected = true;
    this.lastInvalidTokenTime = Date.now();
    
    // Persist to localStorage for cross-domain access
    localStorage.setItem('auth-token-invalid', 'true');
    localStorage.setItem('auth-token-invalid-time', String(this.lastInvalidTokenTime));
    localStorage.setItem('auth-token-invalid-domain', window.location.hostname);
    
    // Clear all auth cookies
    this.clearAuthCookies();
  }
  
  private clearInvalidTokenState() {
    this.invalidTokenDetected = false;
    this.lastInvalidTokenTime = 0;
    
    // Clear from localStorage
    localStorage.removeItem('auth-token-invalid');
    localStorage.removeItem('auth-token-invalid-time');
    localStorage.removeItem('auth-token-invalid-domain');
  }
  
  private clearAuthCookies() {
    // Clear cookies for all possible domains
    const domains = [
      '', // current domain
      '.vanboss.work',
      '.igpsedu.com',
      '.builder.vanboss.work',
      '.builder.igpsedu.com',
    ];
    
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
    ];
    
    domains.forEach(domain => {
      cookieNames.forEach(name => {
        // Clear for root path
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${domain ? ` domain=${domain};` : ''}`;
        // Clear for specific paths
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;${domain ? ` domain=${domain};` : ''}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/auth;${domain ? ` domain=${domain};` : ''}`;
      });
    });
  }
  
  private broadcastMessage(msg: AuthStateMessage) {
    // Broadcast via BroadcastChannel if available
    if (this.channel) {
      this.channel.postMessage(msg);
    }
    
    // Also broadcast via localStorage for fallback
    localStorage.setItem('auth-state-message', JSON.stringify(msg));
  }
  
  // Public API
  
  /**
   * Check if token refresh should be attempted
   */
  canRefreshToken(): boolean {
    if (this.invalidTokenDetected) {
      const elapsed = Date.now() - this.lastInvalidTokenTime;
      if (elapsed < this.INVALID_TOKEN_TIMEOUT) {
        console.log('[AuthStateManager] Token refresh blocked - invalid token detected', {
          elapsed: `${Math.round(elapsed / 1000)}s ago`,
          domain: localStorage.getItem('auth-token-invalid-domain'),
        });
        return false;
      } else {
        // Clear expired state
        this.clearInvalidTokenState();
      }
    }
    return true;
  }
  
  /**
   * Report invalid token detection
   */
  reportInvalidToken(userId?: string) {
    console.log('[AuthStateManager] Invalid token reported', { 
      userId,
      domain: window.location.hostname 
    });
    
    this.setInvalidTokenState();
    
    // Broadcast to other tabs
    this.broadcastMessage({
      type: 'TOKEN_INVALID',
      timestamp: Date.now(),
      domain: window.location.hostname,
      userId,
    });
  }
  
  /**
   * Report successful token refresh
   */
  reportTokenRefreshed(userId?: string) {
    console.log('[AuthStateManager] Token refreshed successfully', { 
      userId,
      domain: window.location.hostname 
    });
    
    this.clearInvalidTokenState();
    
    // Broadcast to other tabs
    this.broadcastMessage({
      type: 'TOKEN_REFRESHED',
      timestamp: Date.now(),
      domain: window.location.hostname,
      userId,
    });
  }
  
  /**
   * Report session cleared
   */
  reportSessionCleared() {
    console.log('[AuthStateManager] Session cleared');
    
    this.setInvalidTokenState();
    
    // Broadcast to other tabs
    this.broadcastMessage({
      type: 'SESSION_CLEARED',
      timestamp: Date.now(),
      domain: window.location.hostname,
    });
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      invalidTokenDetected: this.invalidTokenDetected,
      lastInvalidTokenTime: this.lastInvalidTokenTime,
      canRefresh: this.canRefreshToken(),
      domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    };
  }
  
  /**
   * Force clear invalid token state (for debugging)
   */
  forceReset() {
    console.log('[AuthStateManager] Forcing reset of invalid token state');
    this.clearInvalidTokenState();
    this.broadcastMessage({
      type: 'TOKEN_REFRESHED',
      timestamp: Date.now(),
      domain: window.location.hostname,
    });
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
  }
}

// Export singleton instance
export const authStateManager = typeof window !== 'undefined' 
  ? AuthStateManager.getInstance() 
  : null;

// Export for type checking
export type { AuthStateManager };