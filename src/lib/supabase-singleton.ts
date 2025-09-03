import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

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