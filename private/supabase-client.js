import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.1/+esm';

export const SUPABASE_URL = 'https://pbgsjjegycacodiltbhn.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storageKey: 'form-private-auth'
  }
});

export function callbackUrl(returnTo = '/athlete/') {
  const url = new URL('/auth/record-callback/', window.location.origin);
  url.searchParams.set('return_to', returnTo);
  return url.toString();
}

