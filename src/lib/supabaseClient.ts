import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Singleton
 * 
 * Reads configuration from Vite environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * Throws a clear warning if either is missing.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase configuration missing!\n' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
  throw new Error('Missing Supabase environment variables');
}

// Create and export the singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

