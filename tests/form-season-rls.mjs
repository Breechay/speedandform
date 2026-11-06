import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

// Optional isolated integration test: npm install --no-save --no-package-lock
// @electric-sql/pglite@0.5.15 && node tests/form-season-rls.mjs
// Uses a local in-memory PostgreSQL with a minimal mock of FORM's existing
// canonical identity helpers. The live Apple bridge still needs signed-in QA.
const db = new PGlite();
const sql = readFileSync(
  new URL('../supabase/migrations/20261106110727_form_miami_fall_2026_season_source.sql', import.meta.url),
  'utf8'
);
const A = '10000000-0000-4000-8000-000000000001';
const B = '10000000-0000-4000-8000-000000000002';
const C = '10000000-0000-4000-8000-000000000003';
const ua = '20000000-0000-4000-8000-000000000001';
const ub = '20000000-0000-4000-8000-000000000002';
const uc = '20000000-0000-4000-8000-000000000003';

const q = async (sql, values = []) => (await db.query(sql, values)).rows;
const expectError = async (run, expected) => {
  let failed = false;
  try { await run(); } catch (e) {
    failed = true;
    assert.match(e.message, expected);
  }
  assert.equal(failed, true, 'expected SQL permission or constraint failure');
};
const as = async (role, user) => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
  await db.exec('set role ' + role);
};

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table auth.users (id uuid primary key);
    create table public.athletes (id uuid primary key, active boolean default true);
    create table public.athlete_memberships (
      athlete_id uuid not null references public.athletes(id),
      user_id uuid not null references auth.users(id),
      role text not null, status text not null
    );
    create function public.set_updated_at() returns trigger
      language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
    create function public.is_athlete_member(target_athlete_id uuid)
      returns boolean language sql stable security definer set search_path=public,pg_temp
      as $$ select exists (
        select 1 from public.athlete_memberships m
        where m.athlete_id=target_athlete_id and m.user_id=auth.uid()
          and m.role='athlete' and m.status='active'
      ) $$;
    create function public.is_coach_member(target_athlete_id uuid)
      returns boolean language sql stable security definer set search_path=public,pg_temp
      as $$ select exists (
        select 1 from public.athlete_memberships m
        where m.athlete_id=target_athlete_id and m.user_id=auth.uid()
          and m.role='coach' and m.status='active'
      ) $$;
    create function public.can_read_athlete(target_athlete_id uuid)
      returns boolean language sql stable security definer set search_path=public,pg_temp
      as $$ select public.is_athlete_member(target_athlete_id)
                   or public.is_coach_member(target_athlete_id) $$;
    grant usage on schema public to anon,authenticated,service_role;
    grant usage on schema auth to anon,authenticated,service_role;
    grant execute on all functions in schema auth to authenticated;
  `);
  await db.exec(sql);
  const catalog = await q("select * from public.form_seasons where season_key='form-miami-fall-2026'");
  assert.equal(catalog.length, 1);
  assert.equal((await q('select * from public.form_season_phases')).length, 4);
  assert.equal((await q('select * from public.form_season_memberships')).length, 0);

  await db.exec(`
    insert into auth.users(id) values ('${ua}'),('${ub}'),('${uc}');
    insert into public.athletes(id) values ('${A}'),('${B}'),('${C}');
    insert into public.athlete_memberships values
      ('${A}','${ua}','athlete','active'),
      ('${B}','${ub}','athlete','active'),
      ('${A}','${uc}','coach','active');
    insert into public.form_season_memberships
      (season_id,athlete_id,status,joined_on,confirmed_at,confirmed_by)
    select id,'${A}','active',date '2026-10-19',now(),'${uc}'
      from public.form_seasons where season_key='form-miami-fall-2026';
    insert into public.form_season_memberships
      (season_id,athlete_id,status,joined_on,confirmed_at,confirmed_by)
    select id,'${B}','active',date '2026-10-29',now(),'${uc}'
      from public.form_seasons where season_key='form-miami-fall-2026';
    insert into public.form_season_memberships(season_id,athlete_id)
      select id,'${C}' from public.form_seasons where season_key='form-miami-fall-2026';
  `);

  await as('anon', null);
  assert.equal((await q('select * from public.form_seasons')).length, 1);
  assert.equal((await q('select * from public.form_season_phases')).length, 4);
  await expectError(() => q('select * from public.form_season_memberships'), /permission denied/);
  await expectError(
    () => q("select * from public.form_season_member_context()"), /permission denied/
  );

  await as('authenticated', ua);
  assert.equal((await q('select * from public.form_season_memberships')).length, 1);
  const ownA = await q('select * from public.form_season_member_context()');
  assert.equal(ownA.length, 1);
  assert.equal(ownA[0].athlete_id, A);
  assert.equal(ownA[0].first_eligible_week, 1);
  assert.equal(ownA[0].total_weeks, 15);
  assert.equal((await q('select * from public.form_season_member_context($1,$2)', ['form-miami-fall-2026',B])).length, 0);
  await expectError(() => q(`insert into public.form_season_memberships
    (season_id,athlete_id) select id,'${C}' from public.form_seasons`), /permission denied/);

  await as('authenticated', ub);
  const ownB = await q('select * from public.form_season_member_context()');
  assert.equal(ownB.length, 1);
  assert.equal(ownB[0].athlete_id, B);
  assert.equal(ownB[0].first_eligible_week, 2);
  assert.equal((await q('select * from public.form_season_memberships')).length, 1);

  await as('authenticated', uc);
  assert.equal((await q('select * from public.form_season_member_context()')).length, 0);
  assert.equal((await q('select * from public.form_season_member_context($1,$2)', ['form-miami-fall-2026',A])).length, 1);
  assert.equal((await q('select * from public.form_season_member_context($1,$2)', ['form-miami-fall-2026',B])).length, 0);

  await as('authenticated', '20000000-0000-4000-8000-000000000004');
  assert.equal((await q('select * from public.form_season_member_context()')).length, 0);
  assert.equal((await q('select * from public.form_season_memberships')).length, 0);

  await as('postgres', null);
  await db.exec(`update public.form_season_memberships
    set status='withdrawn', withdrawn_at=now() where athlete_id='${A}'`);
  await expectError(() => q(`insert into public.form_season_memberships
    (season_id,athlete_id,status,joined_on,confirmed_at)
    select id,'30000000-0000-4000-8000-000000000001','active',date '2026-10-10',now()
    from public.form_seasons`), /season_join_date_out_of_range/);

  await as('authenticated', ua);
  assert.equal((await q('select * from public.form_season_member_context()')).length, 0);
  assert.equal((await q('select * from public.form_season_memberships')).length, 1);

  console.log('PASS: real PostgreSQL migration, RLS isolation, Coach Mirror, missing/pending, withdrawal, public/private and dates.');
} finally {
  await db.close();
}
