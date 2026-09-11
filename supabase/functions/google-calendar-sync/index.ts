import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const service = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const COACHING_SLUGS = ['rod', 'devin', 'natalie', 'valerie'];
const DAY = 86400000;

function cors(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = origin === 'https://speedandform.com' || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://speedandform.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-calendar-sync-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function json(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json' }
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

async function runtimeSecrets() {
  const { data, error } = await service.rpc('google_calendar_runtime_secrets');
  if (error) throw error;
  return data || {};
}

async function requireCoach(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) throw new Error('AUTH_REQUIRED');
  const token = header.slice(7).trim();
  const { data: { user }, error } = await service.auth.getUser(token);
  if (error || !user) throw new Error('AUTH_REQUIRED');
  const { data: admin, error: adminError } = await service.from('coaching_administrators')
    .select('user_id').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (adminError) throw adminError;
  if (!admin) throw new Error('COACH_REQUIRED');
  return user;
}

async function refreshGoogleToken(userId: string) {
  const [{ data: refreshToken, error: refreshError }, secrets] = await Promise.all([
    service.rpc('google_calendar_refresh_token', { p_user_id: userId }),
    runtimeSecrets()
  ]);
  if (refreshError) throw refreshError;
  if (!refreshToken) throw new Error('Google Calendar is not connected.');
  if (!secrets.client_id || !secrets.client_secret) {
    throw new Error('Automatic sync needs the Google OAuth client ID and client secret in Supabase Vault.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: secrets.client_id,
      client_secret: secrets.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || `Google token refresh failed (${response.status}).`);
  }
  return body.access_token as string;
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '00';
  return {
    year: Number(get('year')), month: Number(get('month')), day: Number(get('day')),
    hour: Number(get('hour')), minute: Number(get('minute')), second: Number(get('second'))
  };
}

function isoDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function mondayFor(parts: { year: number; month: number; day: number }) {
  const noon = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  const back = (noon.getUTCDay() + 6) % 7;
  noon.setUTCDate(noon.getUTCDate() - back);
  return isoDate(noon.getUTCFullYear(), noon.getUTCMonth() + 1, noon.getUTCDate());
}

function strippedTitle(summary: string, athleteName: string) {
  const escaped = athleteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = summary.replace(new RegExp(`^${escaped}\\s*(?:—|-|:)\\s*`, 'i'), '').trim();
  return value || summary;
}

function autoAthlete(summary: string, athletes: any[]) {
  const matches = athletes.filter((athlete) => {
    const escaped = String(athlete.first_name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}\\s*(?:—|-|:)`, 'i').test(summary || '');
  });
  return matches.length === 1 ? matches[0] : null;
}

async function googleGet(url: string, accessToken: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || body?.error_description || `Google request failed (${response.status}).`);
  return body;
}

async function calendarIdentity(accessToken: string, fallbackEmail: string | null) {
  const [calendar, profile] = await Promise.all([
    googleGet('https://www.googleapis.com/calendar/v3/calendars/primary', accessToken),
    googleGet('https://www.googleapis.com/oauth2/v2/userinfo', accessToken).catch(() => null)
  ]);
  return {
    calendarId: calendar.id || 'primary',
    timeZone: calendar.timeZone || 'America/New_York',
    email: profile?.email || fallbackEmail
  };
}

async function listWindow(calendarId: string, accessToken: string) {
  const timeMin = new Date(Date.now() - 14 * DAY).toISOString();
  const timeMax = new Date(Date.now() + 90 * DAY).toISOString();
  const items: any[] = [];
  let pageToken = '';
  do {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('showDeleted', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await googleGet(url.toString(), accessToken);
    items.push(...(page.items || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return items;
}

async function syncConnection(connection: any, accessToken: string) {
  const [{ data: rules, error: rulesError }, { data: athletes, error: athletesError }] = await Promise.all([
    service.from('google_calendar_event_rules').select('*').eq('active', true),
    service.from('athletes').select('id,slug,first_name').in('slug', COACHING_SLUGS)
  ]);
  if (rulesError) throw rulesError;
  if (athletesError) throw athletesError;
  const events = await listWindow(connection.calendar_id, accessToken);
  let matched = 0;

  for (const event of events) {
    const sourceId = event.id as string;
    if (!sourceId) continue;

    if (event.status === 'cancelled') {
      await service.from('coach_week_items')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('source_calendar_id', connection.calendar_id).eq('source_event_id', sourceId);
      continue;
    }
    if (!event.start?.dateTime || !event.end?.dateTime) continue;

    const exact = (rules || []).find((rule: any) => rule.event_id === sourceId);
    const series = !exact && event.recurringEventId
      ? (rules || []).find((rule: any) => rule.recurring_event_id === event.recurringEventId)
      : null;
    const rule = exact || series || null;
    let athlete = rule ? (athletes || []).find((row: any) => row.id === rule.athlete_id) : null;
    if (!athlete) athlete = autoAthlete(event.summary || '', athletes || []);
    if (!athlete) continue;

    const rawStart = new Date(event.start.dateTime);
    const rawEnd = new Date(event.end.dateTime);
    const offset = Number(rule?.start_offset_minutes || 0);
    const workStart = new Date(rawStart.getTime() + offset * 60000);
    const duration = Number(rule?.duration_override_minutes || Math.max(15, Math.round((rawEnd.getTime() - workStart.getTime()) / 60000)));
    const parts = dateParts(workStart, connection.calendar_timezone || 'America/New_York');
    const scheduledOn = isoDate(parts.year, parts.month, parts.day);
    const weekStart = mondayFor(parts);
    const timeLocal = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`;
    const title = rule?.title_override || strippedTitle(event.summary || 'Coaching', athlete.first_name || '');

    const row = {
      athlete_id: athlete.id,
      week_starts_on: weekStart,
      scheduled_on: scheduledOn,
      time_local: timeLocal,
      duration_minutes: duration,
      title,
      kind: 'coached',
      location: event.location || null,
      status: 'planned',
      source: 'google',
      source_calendar_id: connection.calendar_id,
      source_event_id: sourceId,
      source_url: event.htmlLink || null,
      note: 'Synced from Google Calendar.',
      created_by: connection.user_id,
      updated_at: new Date().toISOString()
    };
    const { error } = await service.from('coach_week_items')
      .upsert(row, { onConflict: 'source_calendar_id,source_event_id' });
    if (error) throw error;
    matched += 1;
  }

  await service.from('google_calendar_connections').update({
    last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString()
  }).eq('user_id', connection.user_id);
  return { matched, scanned: events.length };
}

async function connect(req: Request, body: any) {
  const user = await requireCoach(req);
  const refreshToken = String(body.providerRefreshToken || '');
  const accessToken = String(body.providerAccessToken || '');
  if (!refreshToken) throw new Error('Google did not return an offline refresh token. Reconnect Calendar and approve access again.');
  if (!accessToken) throw new Error('Google did not return an access token. Reconnect Calendar.');

  const identity = await calendarIdentity(accessToken, user.email || null);
  const { error } = await service.rpc('google_calendar_store_connection', {
    p_user_id: user.id,
    p_google_email: identity.email,
    p_refresh_token: refreshToken,
    p_calendar_id: identity.calendarId,
    p_timezone: identity.timeZone
  });
  if (error) throw error;

  const connection = {
    user_id: user.id, google_email: identity.email, calendar_id: identity.calendarId,
    calendar_timezone: identity.timeZone, enabled: true
  };
  const result = await syncConnection(connection, accessToken);
  return { connected: true, ...result, email: identity.email };
}

async function syncOne(req: Request) {
  const user = await requireCoach(req);
  const { data: connection, error } = await service.from('google_calendar_connections')
    .select('*').eq('user_id', user.id).eq('enabled', true).maybeSingle();
  if (error) throw error;
  if (!connection) throw new Error('Google Calendar is not connected.');
  try {
    const token = await refreshGoogleToken(user.id);
    return await syncConnection(connection, token);
  } catch (failure) {
    await service.from('google_calendar_connections').update({
      last_error: errorMessage(failure), updated_at: new Date().toISOString()
    }).eq('user_id', user.id);
    throw failure;
  }
}

async function syncAll(req: Request) {
  const secrets = await runtimeSecrets();
  const supplied = req.headers.get('x-calendar-sync-key') || '';
  if (!secrets.cron_key || supplied !== secrets.cron_key) throw new Error('CRON_AUTH_FAILED');
  const { data: connections, error } = await service.from('google_calendar_connections').select('*').eq('enabled', true);
  if (error) throw error;
  const results = [];
  for (const connection of connections || []) {
    try {
      const token = await refreshGoogleToken(connection.user_id);
      results.push({ user_id: connection.user_id, ok: true, ...(await syncConnection(connection, token)) });
    } catch (failure) {
      const message = errorMessage(failure);
      await service.from('google_calendar_connections').update({ last_error: message, updated_at: new Date().toISOString() })
        .eq('user_id', connection.user_id);
      results.push({ user_id: connection.user_id, ok: false, error: message });
    }
  }
  return { synced: results };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || '';
    if (action === 'connect') return json(req, await connect(req, body));
    if (action === 'sync-now') return json(req, await syncOne(req));
    if (action === 'sync-all') return json(req, await syncAll(req));
    return json(req, { error: 'Unknown action' }, 400);
  } catch (failure) {
    const message = errorMessage(failure);
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'COACH_REQUIRED' || message === 'CRON_AUTH_FAILED' ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
