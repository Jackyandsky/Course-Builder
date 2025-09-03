import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Singleton instance to prevent multiple clients and reduce token refresh requests
let supabaseInstance: SupabaseClientType<Database> | null = null;

// This is the client-side Supabase client.
// It's used in client components (hooks, etc.)
// Now returns a singleton to reduce auth token requests
export const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      options: {
        auth: {
          // Enable auto refresh but with longer intervals
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // Increase token refresh threshold (default is 60 seconds before expiry)
          // This reduces frequency of token refresh attempts
          refreshThreshold: 300, // 5 minutes before expiry
        },
        global: {
          // Reduce automatic retries on failed requests
          fetch: (url, options = {}) => {
            // Add cache headers to reduce repeated auth checks
            const modifiedOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Cache-Control': 'max-age=60', // Cache for 1 minute
              },
            };
            return fetch(url, modifiedOptions);
          },
        },
      },
    });
  }
  return supabaseInstance;
};

// We export the type for convenience.
// The server-side client will be created directly in server-side functions.
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;