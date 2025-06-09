import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This is the client-side Supabase client.
// It's used in client components (hooks, etc.)
export const createSupabaseClient = () => {
  return createClientComponentClient();
};

// We export the type for convenience.
// The server-side client will be created directly in server-side functions.
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;