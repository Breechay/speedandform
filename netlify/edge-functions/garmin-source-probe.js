const respond = status => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
// Source filtering is enforced by the isolated Netlify project's firewall.
const routes = new Map([['/integrations/garmin/activities', 'activities'], ['/integrations/garmin/activityDetails', 'activityDetails']]);

// Activity Details: only lap starts and, per sample, time, distance, heart rate and timer. Positions and every
// other field are dropped here and never leave the gateway.
export function details(item) {
  if (!item || typeof item.userId !== 'string' || !item.userId.trim() || item.userId.length > 256) throw Error();
  const activityId = item.activityId ?? item.summary?.activityId;
  if (typeof activityId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(activityId)) return null;
  const start = item.summary?.startTimeInSeconds;
  if (!Number.isFinite(start) || !Array.isArray(item.samples)) return null;
  const samples = [];
  let last = -1;
  for (const s of item.samples) {
    const offset = s?.startTimeInSeconds - start, metres = s?.totalDistanceInMeters;
    if (!Number.isFinite(offset) || offset < 0 || offset <= last || !Number.isFinite(metres) || metres < 0) continue;
    const timer = Number.isFinite(s.timerDurationInSeconds) ? s.timerDurationInSeconds : offset;
    const heart = Number.isFinite(s.heartRate) && s.heartRate >= 30 && s.heartRate <= 240 ? Math.round(s.heartRate) : null;
    samples.push([offset, Math.round(metres * 100) / 100, heart, timer]);
    last = offset;
  }
  if (!samples.length) return null;
  const step = Math.ceil(samples.length / 40000);
  const laps = (Array.isArray(item.laps) ? item.laps : []).map(l => l?.startTimeInSeconds - start)
    .filter(o => Number.isFinite(o) && o >= 0).slice(0, 600);
  return { userId: item.userId, activityId, laps, samples: step > 1 ? samples.filter((_, i) => i % step === 0) : samples };
}
export async function receive(request, siteId, env, send) {
  const url = new URL(request.url);
  const route = routes.get(url.pathname);
  if (siteId !== '2f8af10b-c7cf-418c-b3ad-6dc7b1864380' || url.hostname !== 'form-garmin-ingress.netlify.app' || !route) return respond(403);
  if (request.method !== 'POST') return respond(405);
  const limit = (route === 'activityDetails' ? 20 : 2) * 1024 * 1024;
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
      if (size > limit) {
        await reader.cancel();
        return respond(413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    // Details are large: quote the long ids in the text instead of visiting every value with a reviver.
    const text = new TextDecoder().decode(bytes);
    const batch = route === 'activityDetails'
      ? JSON.parse(text.replace(/("activityId"\s*:\s*)([0-9]{1,40})(?=\s*[,}])/g, '$1"$2"'))
      : JSON.parse(text, (key, value, context) => {
      if ((key === 'activityId' || key === 'workoutId') && typeof value === 'number') {
        if (context?.source && /^[0-9]{1,40}$/.test(context.source)) return context.source;
        if (!Number.isSafeInteger(value) || value < 0) throw Error();
        return String(value);
      }
      return value;
    });
    if (!batch || Object.keys(batch).length !== 1 || !Object.hasOwn(batch,route) || !Array.isArray(batch[route])
      || !batch[route].length || batch[route].length > 1000) return respond(400);
    const events = route === 'activityDetails' ? batch[route].map(details).filter(Boolean) : batch[route].map(item => {
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
    // A detail without samples (a typed-in activity) has nothing to keep; Garmin still gets its 200.
    if (!events.length) return respond(200);
    if (events.length > 200 && route === 'activityDetails') return respond(400);
    try {
      const rpc = route === 'activityDetails' ? 'form_garmin_receive_activity_details' : 'form_garmin_receive_activities';
      const result = await send('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/' + rpc, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000),
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
export const config = {path:['/integrations/garmin/activities','/integrations/garmin/activityDetails']};
