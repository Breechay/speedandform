import { callbackUrl, supabase } from './supabase-client.js';

const ALLOWED_DESTINATIONS = ['/athlete/', '/coach/'];

export function safeReturnTo(value) {
  if (!value) return '/athlete/';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/athlete/';
    const allowed = ALLOWED_DESTINATIONS.some((path) => url.pathname.startsWith(path));
    return allowed ? `${url.pathname}${url.search}` : '/athlete/';
  } catch {
    return '/athlete/';
  }
}

export async function sendMagicLink(email, returnTo = '/athlete/') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('Enter the email Brice invited.');
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: callbackUrl(safeReturnTo(returnTo)),
      shouldCreateUser: true
    }
  });
  if (error) throw error;
}

export async function signInWithApple(returnTo = '/athlete/') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: callbackUrl(safeReturnTo(returnTo)) }
  });
  if (error) throw error;
  return data;
}

export async function finishAuthCallback() {
  const url = new URL(window.location.href);
  const authError = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (authError) throw new Error(authError);
  const tokenHash = url.searchParams.get('token_hash');
  const otpType = url.searchParams.get('type');
  if (tokenHash) {
    const allowedTypes = new Set(['email', 'magiclink', 'signup', 'invite', 'recovery', 'email_change']);
    if (!allowedTypes.has(otpType)) throw new Error('That sign-in link is not valid.');
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (error) throw error;
  }
  const code = url.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error('That sign-in link has expired. Request a new one.');
  await claimAccess();
  return safeReturnTo(url.searchParams.get('return_to'));
}

export async function claimAccess() {
  const { error } = await supabase.rpc('claim_access');
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getAccessContext() {
  const session = await getSession();
  if (!session) return { session: null, memberships: [], athleteMemberships: [], coachMemberships: [] };
  await claimAccess();
  const { data, error } = await supabase
    .from('athlete_memberships')
    .select('athlete_id, role, status, athletes(id, slug, display_name, first_name, home_surface, target_event, goal_label, program_name, account_label)')
    .eq('status', 'active');
  if (error) throw error;
  const memberships = data || [];
  return {
    session,
    memberships,
    athleteMemberships: memberships.filter((item) => item.role === 'athlete'),
    coachMemberships: memberships.filter((item) => item.role === 'coach')
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.assign('/athlete/');
}

export function authErrorMessage(error) {
  const message = String(error?.message || error || 'Sign in could not be completed.');
  if (/provider.*not.*enabled/i.test(message)) return 'Apple sign-in is being connected. Use the email link for now.';
  if (/rate limit/i.test(message)) return 'Too many links were requested. Wait a moment, then try again.';
  if (/expired|invalid.*code|otp/i.test(message)) return 'That link has expired. Request a new sign-in link.';
  return message;
}
