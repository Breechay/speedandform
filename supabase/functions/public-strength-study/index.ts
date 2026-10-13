// Public, read-only publication. Never return raw receipts or the publication registry.
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method !== 'GET') return respond({ error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const study = url.searchParams.get('study') || '';
  const offset = Number(url.searchParams.get('offset') || '0');
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(study) || !Number.isInteger(offset) || offset < 0 || offset > 10000) {
    return respond({ error: 'Invalid study or offset' }, 400);
  }
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/published_strength_study`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json',
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ p_study_slug: study, p_offset: offset }),
    });
    if (!response.ok) return respond({ error: 'Records temporarily unavailable' }, 503);
    const data = await response.json();
    return respond(data, data.status === 'published' ? 200 : 404);
  } catch {
    return respond({ error: 'Records temporarily unavailable' }, 503);
  }
});
