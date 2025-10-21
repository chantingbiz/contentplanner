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

if (import.meta.env.DEV) {
  console.log('[Supabase ENV]', {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKeyPresent: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase configuration missing!\n' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
  throw new Error('Missing Supabase environment variables');
}

// Create and export the singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Supabase connectivity check (dev only) ---
if (import.meta.env.DEV) {
  async function testSupabaseConnection() {
    try {
      const { data, error, status } = await supabase
        .from('backups')
        .select('workspace, updated_at')
        .limit(1);
      if (error) {
        console.warn('[Supabase Test] ❌ Error:', error.message);
      } else {
        console.info('[Supabase Test] ✅ Connected. Status:', status);
        console.table(data);
      }
    } catch (err) {
      console.error('[Supabase Test] ❌ Exception:', err);
    }
  }
  testSupabaseConnection();
}

