// No credential logging, no email lookup, no administrator-supplied athlete selection.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGIN = 'https://speedandform.com';
const MAX_BYTES = 16384;

export async function readBoundedJSON(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new Error('oversized');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('oversized'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function makeHandler({ url, publishableKey, serviceKey, fetcher = fetch }) {
  const requestJSON = async (path, token, body, method = 'POST', apiKey = publishableKey) => {
    const response = await fetcher(`${url}${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { apikey: apiKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, ok: response.ok, data };
  };

  return async (request) => {
    const origin = request.headers.get('origin');
    const headers = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin',
      ...(origin === ORIGIN ? { 'Access-Control-Allow-Origin': ORIGIN } : {}),
    };
    const reply = (status, code, extra = {}) => new Response(JSON.stringify({ code, ...extra }), { status, headers });
    if (origin && origin !== ORIGIN) return reply(403, 'origin_refused');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      ...headers, 'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
    } });
    if (request.method !== 'POST') return reply(405, 'method_not_allowed');
    if (!url || !publishableKey || !serviceKey) return reply(503, 'unavailable');
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return reply(415, 'invalid_request');
    const bearer = request.headers.get('authorization') || '';
    const match = /^Bearer ([^\s]{20,8192})$/i.exec(bearer);
    if (!match) return reply(401, 'sign_in_required');
    const verifiedToken = match[1];
    let body;
    try { body = await readBoundedJSON(request); } catch { return reply(400, 'invalid_request'); }
    if (!body || Array.isArray(body) || typeof body !== 'object'
      || Object.keys(body).some((key) => !['id_token','nonce','expected_athlete_id'].includes(key))
      || typeof body.id_token !== 'string' || body.id_token.length < 20 || body.id_token.length > 8192
      || typeof body.nonce !== 'string' || !/^[A-Za-z0-9._-]{16,128}$/.test(body.nonce)
      || typeof body.expected_athlete_id !== 'string' || !UUID.test(body.expected_athlete_id)) return reply(400, 'invalid_request');

    let temporaryAppleToken = null;
    try {
      const source = await requestJSON('/auth/v1/user', verifiedToken, undefined, 'GET');
      if (!source.ok) return reply(source.status >= 500 ? 503 : 401, 'sign_in_required');
      const user = source.data;
      if (!UUID.test(user?.id || '') || !user?.email || !user?.email_confirmed_at || user?.is_anonymous) return reply(403, 'verified_email_required');
      const identity = await requestJSON('/rest/v1/rpc/coaching_access_identity', verifiedToken, {});
      if (!identity.ok) return reply(identity.data?.code === 'P0003' ? 409 : identity.status >= 500 ? 503 : 403, 'athlete_access_required');
      if (identity.data?.athlete_id !== body.expected_athlete_id) return reply(409, 'athlete_changed');
      const admitted = await requestJSON('/rest/v1/rpc/coaching_apple_link_admit', serviceKey, { p_user_id: user.id }, 'POST', serviceKey);
      if (!admitted.ok) return reply(503, 'unavailable');
      if (admitted.data !== true) return reply(429, 'try_later');

      const apple = await requestJSON('/auth/v1/token?grant_type=id_token', publishableKey, {
        provider: 'apple', id_token: body.id_token, nonce: body.nonce,
      });
      if (!apple.ok) return reply(apple.status >= 500 ? 503 : 401, 'apple_verification_failed');
      temporaryAppleToken = apple.data?.access_token || null;
      if (!temporaryAppleToken || !UUID.test(apple.data?.user?.id || '')
        || !apple.data.user.identities?.some((item) => item.provider === 'apple')) return reply(401, 'apple_verification_failed');

      const linked = await requestJSON('/rest/v1/rpc/coaching_connect_apple', serviceKey, {
        p_verified_user_id: user.id, p_apple_user_id: apple.data.user.id,
        p_expected_athlete_id: body.expected_athlete_id,
      }, 'POST', serviceKey);
      if (!linked.ok) return reply(linked.data?.code === '23505' ? 409 : linked.status >= 500 ? 503 : 403,
        linked.data?.code === '23505' ? 'apple_account_conflict' : 'link_refused');
      if (linked.data?.athlete_id !== body.expected_athlete_id) return reply(503, 'link_unconfirmed');
      return reply(200, 'connected', { athlete_id: linked.data.athlete_id, display_name: linked.data.display_name });
    } catch {
      return reply(503, 'unavailable');
    } finally {
      if (temporaryAppleToken) {
        await requestJSON('/auth/v1/logout?scope=local', temporaryAppleToken, {}).catch(() => {});
      }
    }
  };
}
