// Replays the real migration history into an isolated PGlite database. Never connects to a
// hosted database. Migrations that seed production rows (a named athlete "must already exist")
// cannot run on an empty database; they are listed in SEED_ONLY with the reason, and the replay
// fails loudly if any OTHER migration fails or if a listed one starts to pass unexpectedly.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const shim = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema if not exists auth; create schema if not exists extensions; create schema if not exists storage;
create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now(), email_confirmed_at timestamptz, deleted_at timestamptz, banned_until timestamptz, last_sign_in_at timestamptz, is_anonymous boolean default false);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true),''),'anon') $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create table storage.buckets(id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, owner_id text); alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
grant usage on schema auth, extensions, storage to anon, authenticated, service_role;
`;

export async function openPglite() {
  const mod = process.env.SF_PGLITE_PATH ? pathToFileURL(process.env.SF_PGLITE_PATH).href : '@electric-sql/pglite';
  const { PGlite } = await import(mod);
  return new PGlite();
}

// Splits a migration into top-level statements, honouring '...' strings, "..." identifiers,
// $tag$...$tag$ bodies and -- and /* */ comments.
export function splitStatements(sql) {
  const out = []; let cur = ''; let i = 0; const n = sql.length;
  while (i < n) {
    const c = sql[i], two = sql.slice(i, i + 2);
    if (two === '--') { const j = sql.indexOf('\n', i); const k = j < 0 ? n : j; cur += sql.slice(i, k); i = k; continue; }
    if (two === '/*') { const j = sql.indexOf('*/', i + 2); const k = j < 0 ? n : j + 2; cur += sql.slice(i, k); i = k; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < n) { if (sql[j] === c) { if (sql[j + 1] === c) { j += 2; continue; } break; } j++; } cur += sql.slice(i, j + 1); i = j + 1; continue; }
    if (c === '$') { const m = /^\$([A-Za-z_]*)\$/.exec(sql.slice(i)); if (m) { const tag = m[0]; const j = sql.indexOf(tag, i + tag.length); const k = j < 0 ? n : j + tag.length; cur += sql.slice(i, k); i = k; continue; } }
    if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
    cur += c; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const stripLeadingComments = (t) => t.replace(/^(\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*/, '');
const SEED = /^(do|insert|update|delete|select|with|truncate)\b/i;
const TXN = /^(begin|commit|rollback|start transaction)\b/i;

// Each statement runs on its own. A failing seed statement (production rows are absent) is
// tolerated and counted; a failing DDL statement is a real failure of the schema history.
export async function replaySchema({ db, upTo = null, root = 'supabase/migrations' } = {}) {
  await db.exec(shim);
  const files = (await fs.readdir(root)).filter((f) => f.endsWith('.sql')).sort();
  const ddlFailures = []; const seedSkipped = [];
  for (const f of files) {
    if (upTo && f > upTo) break;
    // PGlite 0.3.14 bundles no pgcrypto; the history only creates the extension and never calls it.
    const sql = (await fs.readFile(path.join(root, f), 'utf8')).replace(/create extension if not exists pgcrypto;/gi, '');
    for (const stmt of splitStatements(sql)) {
      if (TXN.test(stripLeadingComments(stmt))) continue;
      try { await db.exec(stmt); }
      catch (e) {
        const msg = String(e.message || e).split('\n')[0];
        (SEED.test(stripLeadingComments(stmt)) ? seedSkipped : ddlFailures).push({ file: f, error: msg, statement: stmt.slice(0, 90).replace(/\s+/g, ' ') });
      }
    }
  }
  return { files, ddlFailures, seedSkipped };
}

// Known platform-only failures that cannot matter to the plan chain: Supabase extensions this
// harness does not have (pg_net, pg_cron, Vault) and a table created outside git.
export const PLATFORM_ONLY = new Set([
  '20260911150300_google_calendar_ongoing_sync.sql',
  '20261004163816_rpd_purchase_access_email.sql'
]);

export async function as(db, userId, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${userId}', false); select set_config('request.jwt.claim.role', 'authenticated', false); set role authenticated`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}

// A coach, an athlete with an active block, one published strength session and its first version.
export async function fixture(db, { slug = 'fx', weeks = 1 } = {}) {
  const q = async (sql, args = []) => (await db.query(sql, args)).rows[0];
  // The history leaves coaching sync paused; the fixture runs the feed as if it were live.
  await db.exec('update public.coaching_sync_state set enabled = true');
  const athleteUser = (await q(`insert into auth.users(email) values ($1) returning id`, [`${slug}-athlete@example.test`])).id;
  const coachUser = (await q(`insert into auth.users(email) values ($1) returning id`, [`${slug}-coach@example.test`])).id;
  const athlete = (await q(`insert into public.athletes(slug, display_name, first_name, home_surface, program_name, account_label)
    values ($1,$2,$3,'form','Fixture',$4) returning id`, [slug, `${slug} Athlete`, slug, `${slug}-label`])).id;
  await db.query(`insert into public.athlete_memberships(athlete_id, user_id, role) values ($1,$2,'athlete'),($1,$3,'coach')`, [athlete, athleteUser, coachUser]);
  const block = (await q(`insert into public.training_blocks(athlete_id, source, name, block_number, total_weeks, purpose, status)
    values ($1,'coach_authored','Fixture block',1,$2,'development','active') returning id`, [athlete, weeks])).id;
  return { athlete, athleteUser, coachUser, block };
}
