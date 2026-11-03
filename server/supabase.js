import { createClient } from '@supabase/supabase-js';

const URL = (process.env.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Service client for database access. Never sign users in with this one,
// or it would start sending their token instead of the service key.
export const supabase = URL && KEY ? createClient(URL, KEY, options) : null;

// Throwaway client for sign-in / refresh calls
export const authClient = () => createClient(URL, KEY, options);

if (!supabase) console.warn('[db] Supabase keys missing: using local catalog and in-memory storage. Accounts are disabled.');
