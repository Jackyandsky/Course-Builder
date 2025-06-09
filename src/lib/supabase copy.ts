import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createClientComponentClient();
};

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  return createServerComponentClient({ cookies });
};

// Type for Supabase client
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
