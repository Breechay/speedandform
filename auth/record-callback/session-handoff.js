// FORM email return, v2. Hosted admin links use an implicit token fragment;
// the shared browser client deliberately has detectSessionInUrl disabled.
// Never log this URL or return tokens to analytics/error reporting.
export async function acceptImplicitReturn(auth, href, replaceURL) {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const keys = ['access_token', 'refresh_token', 'error', 'error_description', 'error_code'];
  const hasAuthFragment = keys.some(key => fragment.has(key));
  if (!hasAuthFragment) return { restored: false, type: null };

  // Remove credentials/errors from history before any network request. The
  // caller captured recovery/routing information before this cleanup.
  const clean = new URL(url);
  clean.hash = '';
  replaceURL(clean.toString());

  if (fragment.has('error') || fragment.has('error_description') || fragment.has('error_code')
      || url.searchParams.has('error') || url.searchParams.has('error_description')) {
    const expired = fragment.get('error_code') === 'otp_expired';
    throw new Error(expired
      ? 'This sign-in link was already used or has expired. Request a new email.'
      : 'This sign-in link could not be verified. Request a new email.');
  }
  if (url.searchParams.has('code') || url.searchParams.has('token_hash')
      || fragment.getAll('access_token').length !== 1
      || fragment.getAll('refresh_token').length !== 1) {
    throw new Error('This sign-in link is incomplete. Request a new email.');
  }
  const access_token = fragment.get('access_token');
  const refresh_token = fragment.get('refresh_token');
  if (!access_token?.trim() || !refresh_token?.trim()) {
    throw new Error('This sign-in link is incomplete. Request a new email.');
  }

  let result;
  try {
    result = await auth.setSession({ access_token, refresh_token });
  } catch {
    throw new Error('FORM could not finish signing in. Check your connection and try again.');
  }
  if (result?.error || !result?.data?.session?.access_token || !result?.data?.session?.refresh_token) {
    throw new Error('FORM could not verify this session. Request a new sign-in email.');
  }
  // setSession must replace any old browser account. Confirm that the server
  // agrees with the resulting session before the caller claims membership.
  let verified;
  try {
    verified = await auth.getUser(result.data.session.access_token);
  } catch {
    throw new Error('FORM could not check this account. Check your connection and try again.');
  }
  if (verified?.error || !verified?.data?.user?.id
      || verified.data.user.id !== result.data.session.user?.id) {
    throw new Error('FORM could not verify this account. Request a new sign-in email.');
  }
  return { restored: true, type: fragment.get('type') };
}
