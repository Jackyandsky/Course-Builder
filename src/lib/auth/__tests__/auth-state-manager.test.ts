import { authStateManager } from '../auth-state-manager';

Object.defineProperty(window, 'BroadcastChannel', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
  })),
});

describe('AuthStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
    if (authStateManager) {
      authStateManager.forceReset();
    }
  });

  describe('Token Refresh Control', () => {
    it('should allow token refresh by default', () => {
      if (authStateManager) {
        expect(authStateManager.canRefreshToken()).toBe(true);
      }
    });

    it('should block token refresh after invalid token reported', () => {
      if (authStateManager) {
        authStateManager.reportInvalidToken('user-123');
        expect(authStateManager.canRefreshToken()).toBe(false);
      }
    });

    it('should allow token refresh after successful refresh', () => {
      if (authStateManager) {
        authStateManager.reportInvalidToken('user-123');
        expect(authStateManager.canRefreshToken()).toBe(false);
        
        authStateManager.reportTokenRefreshed('user-123');
        expect(authStateManager.canRefreshToken()).toBe(true);
      }
    });
  });

  describe('State Persistence', () => {
    it('should persist invalid token state to localStorage', () => {
      if (authStateManager) {
        authStateManager.reportInvalidToken('user-123');
        
        expect(localStorage.getItem('auth-token-invalid')).toBe('true');
        expect(localStorage.getItem('auth-token-invalid-time')).toBeTruthy();
      }
    });

    it('should clear invalid token state from localStorage', () => {
      if (authStateManager) {
        authStateManager.reportInvalidToken('user-123');
        authStateManager.reportTokenRefreshed('user-123');
        
        expect(localStorage.getItem('auth-token-invalid')).toBeNull();
        expect(localStorage.getItem('auth-token-invalid-time')).toBeNull();
      }
    });
  });

  describe('State Information', () => {
    it('should return current state information', () => {
      if (authStateManager) {
        const state = authStateManager.getState();
        
        expect(state).toHaveProperty('invalidTokenDetected');
        expect(state).toHaveProperty('lastInvalidTokenTime');
        expect(state).toHaveProperty('canRefresh');
        expect(state).toHaveProperty('domain');
      }
    });

    it('should reflect invalid token state in getState', () => {
      if (authStateManager) {
        authStateManager.reportInvalidToken('user-123');
        const state = authStateManager.getState();
        
        expect(state.invalidTokenDetected).toBe(true);
        expect(state.canRefresh).toBe(false);
        expect(state.lastInvalidTokenTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Session Management', () => {
    it('should report session cleared', () => {
      if (authStateManager) {
        authStateManager.reportSessionCleared();
        
        expect(authStateManager.canRefreshToken()).toBe(false);
        expect(localStorage.getItem('auth-token-invalid')).toBe('true');
      }
    });
  });
});