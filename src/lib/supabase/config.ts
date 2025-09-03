/**
 * Supabase Auth Configuration
 * These settings help maintain session persistence
 */
export const supabaseAuthConfig = {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto-refresh token when it expires
    autoRefreshToken: true,
    // Detect session from URL (for SSR)
    detectSessionInUrl: true,
    // Storage key prefix
    storageKey: 'course-builder-auth',
    // How often to refresh the token (in seconds)
    // Default is 3600 (1 hour), we'll set it to 50 minutes
    refreshThreshold: 3000, // 50 minutes
  }
};