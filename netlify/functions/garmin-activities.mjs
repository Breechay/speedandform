import { BlockList, isIPv4 } from 'node:net';

// Source networks are supplied from the partner portal in runtime configuration.
function allowed(ip, ranges) {
  if (!isIPv4(ip ?? '') || !ranges) return false;
  const sources = new BlockList();
  for (const cidr of ranges.split(',')) {
    const [network, bits, extra] = cidr.trim().split('/');
    if (extra !== undefined || !isIPv4(network) || !/^(2[0-9]|3[0-2])$/.test(bits ?? '')) return false;
    sources.addSubnet(network, Number(bits), 'ipv4');
  }
  return sources.check(ip, 'ipv4');
}

const respond = status => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
export async function receive(request, context, env, send) {
  if (env.GARMIN_PUSH_ENABLED !== 'true') return respond(503);
  if (request.method !== 'POST') return respond(405);
  if (!allowed(context.ip, env.FORM_GARMIN_SOURCE_RANGES)) return respond(403);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return respond(415);
  if (!env.GARMIN_GATEWAY_TOKEN || !env.FORM_SUPABASE_PUBLISHABLE_KEY) return respond(503);

  const reader = request.body?.getReader();
  if (!reader) return respond(400);
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2 * 1024 * 1024) {
        await reader.cancel();
        return respond(413);
      }
      chunks.push(value);
    }
    const batch = JSON.parse(Buffer.concat(chunks).toString('utf8'), (key, value, context) => {
      if ((key === 'activityId' || key === 'workoutId') && typeof value === 'number') {
        if (context?.source && /^[0-9]{1,40}$/.test(context.source)) return context.source;
        if (!Number.isSafeInteger(value) || value < 0) throw Error();
        return String(value);
      }
      return value;
    });
    if (!batch || Object.keys(batch).length !== 1 || !Array.isArray(batch.activities)
      || !batch.activities.length || batch.activities.length > 1000) return respond(400);
    const events = batch.activities.map(item => {
      if (!item || ![item.userId, item.summaryId].every(id => typeof id === 'string' && id.trim() && id.length <= 256)) throw Error();
      const event = { userId: item.userId, summaryId: item.summaryId };
      for (const key of ['activityId', 'workoutId']) {
        if (item[key] == null) continue;
        if (typeof item[key] !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(item[key])) throw Error();
        event[key] = item[key];
      }
      if (typeof item.activityType === 'string' && /^[A-Z_]{1,80}$/.test(item.activityType)) event.activityType = item.activityType;
      for (const field of ['startTimeInSeconds', 'durationInSeconds', 'distanceInMeters']) {
        if (Number.isFinite(item[field]) && item[field] >= 0) event[field] = item[field];
      }
      return event;
    });
    try {
      const result = await send('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/form_garmin_receive_activities', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'content-type': 'application/json', apikey: env.FORM_SUPABASE_PUBLISHABLE_KEY, 'x-form-gateway': env.GARMIN_GATEWAY_TOKEN },
        body: JSON.stringify({ events }),
      });
      return respond(result.status === 204 ? 200 : 503);
    } catch { return respond(503); }
  } catch { return respond(400); }
}
export default (request, context) => receive(request, context, process.env, fetch);
export const config = { path: '/integrations/garmin/activities' };
