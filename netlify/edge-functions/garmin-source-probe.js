const respond = status => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
// Source filtering is enforced by the isolated Netlify project's firewall.
export async function receive(request, siteId, env, send) {
  const url = new URL(request.url);
  if (siteId !== '2f8af10b-c7cf-418c-b3ad-6dc7b1864380' || url.hostname !== 'form-garmin-ingress.netlify.app' || url.pathname !== '/integrations/garmin/activities') return respond(403);
  if (request.method !== 'POST') return respond(405);
  const route = 'activities';
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
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    const batch = JSON.parse(new TextDecoder().decode(bytes), (key, value, context) => {
      if ((key === 'activityId' || key === 'workoutId') && typeof value === 'number') {
        if (context?.source && /^[0-9]{1,40}$/.test(context.source)) return context.source;
        if (!Number.isSafeInteger(value) || value < 0) throw Error();
        return String(value);
      }
      return value;
    });
    if (!batch || Object.keys(batch).length !== 1 || !Object.hasOwn(batch,route) || !Array.isArray(batch[route])
      || !batch[route].length || batch[route].length > 1000) return respond(400);
    const events = batch[route].map(item => {
      if (!item || ![item.userId, item.summaryId].every(id => typeof id === 'string' && id.trim() && id.length <= 256)) throw Error();
      const event = { userId: item.userId, summaryId: item.summaryId };
      for (const key of ['activityId', 'workoutId']) {
        if (item[key] == null) continue;
        if (typeof item[key] !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(item[key])) throw Error();
        event[key] = item[key];
      }
      if (typeof item.activityType === 'string' && /^[A-Z_]{1,80}$/.test(item.activityType)) event.activityType = item.activityType;
      for (const field of ['startTimeInSeconds', 'durationInSeconds', 'distanceInMeters',
        'averageHeartRateInBeatsPerMinute', 'maxHeartRateInBeatsPerMinute', 'averageSpeedInMetersPerSecond', 'totalElevationGainInMeters']) {
        if (Number.isFinite(item[field]) && item[field] >= 0) event[field] = item[field];
      }
      // Brand rule: data views name the device ("Garmin Forerunner 965"). Plain printable text only.
      if (typeof item.deviceName === 'string' && /^[\p{L}\p{N} ._()+-]{1,80}$/u.test(item.deviceName)) event.deviceName = item.deviceName;
      // A manual or web-uploaded activity never files itself.
      for (const flag of ['manual', 'isWebUpload']) if (typeof item[flag] === 'boolean') event[flag] = item[flag];
      return event;
    });
    try {
      const rpc = 'form_garmin_receive_activities';
      const result = await send('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/' + rpc, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'content-type': 'application/json', apikey: env.FORM_SUPABASE_PUBLISHABLE_KEY, 'x-form-gateway': env.GARMIN_GATEWAY_TOKEN },
        body: JSON.stringify({events}),
      });
      return respond(result.status === 204 ? 200 : 503);
    } catch { return respond(503); }
  } catch { return respond(400); }
}

export default function gateway(request, context) {
  const env = {GARMIN_GATEWAY_TOKEN: Netlify.env.get('GARMIN_GATEWAY_TOKEN'), FORM_SUPABASE_PUBLISHABLE_KEY: Netlify.env.get('FORM_SUPABASE_PUBLISHABLE_KEY')};
  return receive(request, context.site.id, env, fetch);
}
export const config = {path:'/integrations/garmin/activities'};
