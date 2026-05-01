import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { ADMIN_PIN } from './auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Separate client that injects the admin PIN header so RLS allows writes.
// Only call this when the user is logged in as admin.
export const adminSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-admin-pin': ADMIN_PIN } },
});
