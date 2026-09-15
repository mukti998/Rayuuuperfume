import { createClient } from '@supabase/supabase-js';

// Hardcoded defaults — these are public-by-design values (Supabase anon
// key + project URL).  They MUST be literal strings so Vite can inline
// them at build time; encrypted deploy-env values (from Freebuff hosting)
// arrive as opaque blobs and cannot be used here.
const SUPABASE_URL = 'https://jzovvhnhpzjbvfhciwzh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Me5a49ECdfaqch4aBTEDNA_Z5Ou0zC8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
