import { projectFeed } from './selected-feeds.mjs';
const respond = status => new Response(null, { status, headers: { 'cache-control': 'no-store' } });
export async function receive(request, context, env, send) {
  const route = new URL(request.url).pathname.split('/').pop() || 'activities';
  const lifecycle = ['deregistrations','userPermissionsChange'].includes(route);
  if ((lifecycle ? env.GARMIN_LIFECYCLE_ENABLED : env.GARMIN_PUSH_ENABLED) !== 'true') return respond(503);
  if (request.method !== 'POST') return respond(405);
  const reason = context.sourceRejection(context.ip, env.FORM_GARMIN_SOURCE_RANGES);
  if (reason) {
    console.info('garmin_gateway_rejected', reason);
    return respond(reason === 'source_outside_ranges' ? 403 : 503);
  }
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
      if (lifecycle) {
        if (typeof item?.userId !== 'string' || !item.userId.trim() || item.userId.length > 256) throw Error();
        if (route === 'deregistrations') return {userId:item.userId};
        if (!Array.isArray(item.permissions) || !item.permissions.every(p => typeof p === 'string')) throw Error();
        return {userId:item.userId, permissions:item.permissions};
      }
      if (route !== 'activities') return projectFeed(route,item);
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
      const rpc = lifecycle ? 'form_garmin_lifecycle_v2' : route === 'activities' ? 'form_garmin_receive_activities' : 'form_garmin_receive_selected_v2';
      const result = await send('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/' + rpc, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'content-type': 'application/json', apikey: env.FORM_SUPABASE_PUBLISHABLE_KEY, 'x-form-gateway': env.GARMIN_GATEWAY_TOKEN },
        body: JSON.stringify(route === 'activities' ? {events} : {feed:route,events}),
      });
      return respond(result.status === 204 ? 200 : 503);
    } catch { return respond(503); }
  } catch { return respond(400); }
}
