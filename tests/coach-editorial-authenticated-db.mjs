// Actual PostgreSQL policies + authenticated JWT role, in isolated PGlite.
// Never uses production service-role data. Run with SF_PGLITE_PATH when needed.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, as } from './support/replay-schema.mjs';

const db = await openPglite();
const coach = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const athleteUser = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const outsider = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const athlete = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
const day = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
const session = 'ffffffff-ffff-4fff-ffff-ffffffffffff';
const version = '11111111-1111-4111-8111-111111111111';
const q = async (sql, args = []) => (await db.query(sql, args)).rows;

await db.exec(`
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table public.athletes(id uuid primary key, active boolean not null default true);
create table public.coaching_administrators(user_id uuid primary key, status text);
create table public.athlete_memberships(athlete_id uuid, user_id uuid, role text, status text);
create function public.is_active_coaching_administrator(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.coaching_administrators
    where user_id=p_user_id and status='active') $$;
revoke all on function public.is_active_coaching_administrator(uuid) from public, authenticated;
create function public.is_coach_member(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.athlete_memberships
    where athlete_id=p_athlete_id and user_id=(select auth.uid())
      and role='coach' and status='active') $$;
create function public.coaching_sync_enabled() returns boolean
language sql stable as $$ select true $$;
create function public.coaching_access_identity() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('athlete_id',athlete_id)
    from public.athlete_memberships where user_id=(select auth.uid())
      and role='athlete' and status='active' limit 1),'{}'::jsonb) $$;
create table public.coach_strength_groups(
  group_key text primary key,
  status text,
  constraint coach_strength_groups_status_check
    check(status in ('draft','ready','retired'))
);
create table public.coach_strength_group_members(group_key text,athlete_id uuid,status text);
alter table public.coach_strength_groups enable row level security;
alter table public.coach_strength_group_members enable row level security;
create policy group_coach on public.coach_strength_groups for select to authenticated
  using (public.is_active_coaching_administrator((select auth.uid())));
create policy member_coach on public.coach_strength_group_members for select to authenticated
  using (public.is_active_coaching_administrator((select auth.uid())));
grant select on public.coach_strength_groups, public.coach_strength_group_members to authenticated;
create table public.athlete_direction_drafts(athlete_id uuid, private_note text);
alter table public.athlete_direction_drafts enable row level security;
revoke all on public.athlete_direction_drafts from authenticated;
create table public.form_training_strength_days(
  id uuid primary key default gen_random_uuid(), athlete_id uuid references public.athletes(id),
  scheduled_on date not null, forge_program_id text not null,
  forge_program_digest text not null, session_key text not null,
  title text not null, exercises jsonb not null, authored_by uuid not null,
  authored_at timestamptz default now(), cleared_at timestamptz,
  unique (athlete_id,scheduled_on,session_key)
);
alter table public.form_training_strength_days enable row level security;
create table public.planned_sessions(
  id uuid primary key, athlete_id uuid references public.athletes(id),
  scheduled_on date, state text
);
create table public.planned_session_versions(
  id uuid primary key default gen_random_uuid(), athlete_id uuid,
  planned_session_id uuid, version_number integer, title text,
  prescribed_distance numeric, distance_unit text, prescribed_duration_minutes integer,
  intent text, details text, change_reason text, authored_by uuid,
  created_at timestamptz default now(), rpe_low smallint,rpe_high smallint,
  pace_low text,pace_high text,shape text,coach_note text
);
create table public.planned_session_components(
  athlete_id uuid,version_id uuid,position smallint,role text,shape text,
  repeat_count smallint,distance numeric,distance_unit text,duration_seconds integer,
  recovery_seconds integer,recovery_kind text,pace_low text,pace_high text,
  pace_low_seconds integer,pace_high_seconds integer,rpe_low smallint,rpe_high smallint,
  rpe_source text,rpe_default_version text,repeat_minimum smallint,
  repeat_target smallint,repeat_progression smallint,repeat_ceiling smallint,
  counts_toward_mark_id uuid
);
create table public.planned_session_exercises(version_id uuid);
`);
await db.query("insert into public.athletes(id) values($1)", [athlete]);
await db.query("insert into public.coaching_administrators values($1,'active')", [coach]);
await db.query("insert into public.athlete_memberships values($1,$2,'coach','active'),($1,$3,'athlete','active')",
  [athlete, coach, athleteUser]);
await db.query("insert into public.coach_strength_groups values('strength-sculpt02-glute-only','draft')");
await db.query("insert into public.coach_strength_group_members values('strength-sculpt02-glute-only',$1,'planned')", [athlete]);
await db.query("insert into public.form_training_strength_days(id,athlete_id,scheduled_on,forge_program_id,forge_program_digest,session_key,title,exercises,authored_by) values($1,$2,current_date+7,'sculpt_v1','digest','glute-b','Glute B · Thrust',$3::jsonb,$4)",
  [day,athlete,JSON.stringify([{name:'Barbell Hip Thrust',sets:3,reps:10}]),coach]);
await db.query("insert into public.planned_sessions values($1,$2,current_date+8,'published')", [session,athlete]);
await db.query("insert into public.planned_session_versions(id,athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,intent,details,rpe_low,rpe_high,pace_low,pace_high,shape,coach_note) values($1,$2,$3,1,'Easy · 5 mi',5,'mi',null,'Conversational. 8:00/mi or slower.',2,3,'8:00','9:00','continuous','PRIVATE: athlete has an Achilles concern')",
  [version,athlete,session]);
await db.query("insert into public.planned_session_components(athlete_id,version_id,position,role,shape,distance,distance_unit) values($1,$2,1,'work','continuous',5,'mi')", [athlete,version]);

const grant = fs.readFileSync(new URL('../supabase/migrations/20261102163200_coach_strength_group_policy_helper_grant.sql', import.meta.url),'utf8');
const migration = fs.readFileSync(new URL('../supabase/migrations/20261102170000_coach_editorial_copy_publication.sql', import.meta.url),'utf8');
const groupLifecycle = fs.readFileSync(new URL('../supabase/migrations/20261102174500_coach_strength_group_active_lifecycle.sql', import.meta.url),'utf8');
await db.exec(grant);
await db.exec(migration);

test('authenticated coach reads real group RLS and secure copy audit; private direction drafts stay denied', async () => {
  await as(db, coach, async () => {
    const groups = await q('select group_key from public.coach_strength_groups');
    assert.deepEqual(groups.map(row => row.group_key), ['strength-sculpt02-glute-only']);
    await assert.rejects(q('select * from public.athlete_direction_drafts'), /permission denied/);
    const preview = (await q('select public.coach_copy_review(current_date,current_date+30) as r'))[0].r;
    assert.equal(preview.strength.length,1);
    assert.equal(preview.running.length,1);
    assert.equal(preview.strength[0].suggested_emphasis,'Glutes · hip extension · stability');
    assert.ok(!JSON.stringify(preview).includes('Achilles concern'));
  });
  await as(db, outsider, async () => {
    await assert.rejects(q('select public.coach_copy_review(current_date,current_date+30)'), /active coach required/);
  });
});

test('Glute Priority group can reach active while original security policies remain intact', async () => {
  await assert.rejects(q("update public.coach_strength_groups set status='active'"), /check constraint/);
  await db.exec(groupLifecycle);
  await q("update public.coach_strength_groups set status='active'");
  assert.equal((await q('select status from public.coach_strength_groups'))[0].status,'active');
  await as(db, outsider, async () => {
    const result = await q('select group_key from public.coach_strength_groups');
    assert.deepEqual(result, [], 'non-coaches never see the activated group');
  });
});

test('atomic publish writes only emphasis + new running version with identical dose and private notes', async () => {
  const strength = [{day_id:day,title:'Glute B · Thrust',forge_program_id:'sculpt_v1',
    forge_program_digest:'digest',emphasis:'Glutes · hip extension · stability'}];
  const running = [{session_id:session,version_id:version,title:'Easy · 5 mi',
    intent:'Relaxed aerobic running · keep breathing conversational'}];
  await as(db, coach, async () => {
    await assert.rejects(q('select public.coach_publish_editorial_copy($1::jsonb,$2::jsonb)',
      [JSON.stringify([{...strength[0],emphasis:'Draft: publish this later'}]),JSON.stringify(running)]),
      /invalid athlete-visible strength emphasis/);
  });
  assert.equal((await q('select count(*)::int n from public.planned_session_versions'))[0].n,1);
  await as(db, coach, async () => {
    const receipt = (await q('select public.coach_publish_editorial_copy($1::jsonb,$2::jsonb) as r',
      [JSON.stringify(strength),JSON.stringify(running)]))[0].r;
    assert.equal(receipt.strength_updated,1);
    assert.equal(receipt.running_updated,1);
    const next = (await q('select public.coach_publish_editorial_copy($1::jsonb,$2::jsonb) as r',
      [JSON.stringify(strength),JSON.stringify(running)]))[0].r;
    assert.equal(next.already_matching,2,'retry should not invent a third version');
  });
  const latest = (await q('select * from public.planned_session_versions order by version_number desc limit 1'))[0];
  const previous = (await q('select * from public.planned_session_versions order by version_number asc limit 1'))[0];
  for (const key of ['title','prescribed_distance','distance_unit','details','rpe_low','rpe_high','pace_low','pace_high','shape','coach_note']) {
    assert.deepEqual(latest[key],previous[key],key);
  }
  assert.equal(latest.version_number,2);
  assert.equal(latest.intent,running[0].intent);
  assert.equal((await q('select count(*)::int n from public.planned_session_components'))[0].n,2);
  assert.equal((await q('select count(*)::int n from public.planned_session_versions'))[0].n,2);
});

test('athlete-authorized native strength feed receives emphasis, not private coach notes', async () => {
  await as(db, athleteUser, async () => {
    const feed = (await q('select public.athlete_strength_days(current_date,current_date+30) as r'))[0].r;
    assert.equal(feed.days[0].emphasis,'Glutes · hip extension · stability');
    assert.ok(!JSON.stringify(feed).includes('PRIVATE'));
  });
  await as(db, outsider, async () => {
    await assert.rejects(q('select public.athlete_strength_days(current_date,current_date+30)'), /athlete_claim_required/);
  });
});

test('custom strength title must carry authored athlete emphasis on first publication', async () => {
  await as(db, coach, async () => {
    await assert.rejects(q('select public.coach_strength_day_set_described($1,current_date+9,$2,$3,$4,$5,$6,$7::jsonb)',
      [athlete,'custom_v1','digest2','mobility','Mobility A','Draft: awaiting approval','[{"name":"Hip Rotation","sets":2,"reps":8}]']),
      /complete described strength day required/);
    const published = await q('select public.coach_strength_day_set_described($1,current_date+9,$2,$3,$4,$5,$6,$7::jsonb) as id',
      [athlete,'custom_v1','digest2','mobility','Mobility A','Hip rotation · controlled joint range','[{"name":"Hip Rotation","sets":2,"reps":8}]']);
    assert.ok(published[0].id);
  });
  const custom = (await q("select emphasis from public.form_training_strength_days where title='Mobility A'"))[0];
  assert.equal(custom.emphasis,'Hip rotation · controlled joint range');
});

after(() => db.close());
