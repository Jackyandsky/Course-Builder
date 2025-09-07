import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authStateManager } from '@/lib/auth/auth-state-manager';

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get a singleton Supabase client instance for client components.
 * This prevents multiple instances from being created and reduces token refresh requests.
 */
export function getSingletonSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      // Disable automatic token refresh on window focus
      options: {
        auth: {
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    });
    
    // Override auth methods to check auth state manager
    const originalGetSession = supabaseInstance.auth.getSession.bind(supabaseInstance.auth);
    const originalRefreshSession = supabaseInstance.auth.refreshSession.bind(supabaseInstance.auth);
    
    supabaseInstance.auth.getSession = async () => {
      // Check if we can refresh before attempting
      if (authStateManager && !authStateManager.canRefreshToken()) {
        console.log('[Supabase Singleton] Auth state manager blocking refresh');
        return { data: { session: null }, error: null };
      }
      return originalGetSession();
    };
    
    supabaseInstance.auth.refreshSession = async (currentSession?: any) => {
      // Check if we can refresh before attempting
      if (authStateManager && !authStateManager.canRefreshToken()) {
        console.log('[Supabase Singleton] Auth state manager blocking refresh');
        return { data: { session: null, user: null }, error: null };
      }
      return originalRefreshSession(currentSession);
    };
  }
  return supabaseInstance;
}

/**
 * @deprecated Use getSingletonSupabaseClient() instead
 */
export const createSupabaseClient = () => {
  console.warn('createSupabaseClient is deprecated. Use getSingletonSupabaseClient() instead.');
  return getSingletonSupabaseClient();
};