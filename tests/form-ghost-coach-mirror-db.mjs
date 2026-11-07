import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openPglite, as } from './support/replay-schema.mjs';

const db = await openPglite();
const coach = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const athleteUser = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const outsider = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const athlete = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
const message = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
const q = async (sql, args = []) => (await db.query(sql, args)).rows;

await db.exec(`
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table public.athletes(id uuid primary key);
create table public.athlete_memberships(athlete_id uuid,user_id uuid,role text,status text);
create table public.form_ghost_messages(
  id uuid primary key,campaign_key text,template_kind text,title text,body text,
  action_kind text,action_date date,event_on date,publisher_id uuid,created_at timestamptz,
  available_at timestamptz,archived_at timestamptz,quiet boolean
);
create table public.form_ghost_recipients(
  message_id uuid,athlete_id uuid,selected_at timestamptz,first_opened_at timestamptz
);
create table public.form_miami_session_links(
  lane text,on_date date,athlete_id uuid,paused boolean,planned_session_id uuid
);
create table public.session_completions(
  planned_session_id uuid,athlete_id uuid,status text,filed_at timestamptz
);
create table public.form_miami_publications(
  lane text,on_date date,revision integer,payload jsonb
);
`);
await q('insert into public.athletes values($1)', [athlete]);
await q("insert into public.athlete_memberships values($1,$2,'coach','active'),($1,$3,'athlete','active')",
  [athlete, coach, athleteUser]);
await q(`insert into public.form_ghost_messages
  (id,campaign_key,template_kind,title,body,action_kind,action_date,event_on,publisher_id,created_at,available_at,quiet)
  values($1,'test','plain','For you','Private athlete note','none',current_date,current_date,$2,now(),now(),true)`,
  [message, coach]);
await q('insert into public.form_ghost_recipients values($1,$2,now(),null)', [message, athlete]);

const migration = fs.readFileSync(new URL(
  '../supabase/migrations/20261107013146_form_ghost_coach_mirror.sql', import.meta.url), 'utf8');
await db.exec(migration);

test('assigned coach reads the selected athlete Halo without marking it opened', async () => {
  await as(db, coach, async () => {
    const result = (await q('select public.form_ghost_inbox_for_athlete($1) as r', [athlete]))[0].r;
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'For you');
    assert.equal(result[0].unread, true);
  });
  assert.equal((await q('select first_opened_at from public.form_ghost_recipients'))[0].first_opened_at, null);
});

test('an athlete or unrelated authenticated user cannot use the coach projection', async () => {
  await as(db, athleteUser, async () => {
    await assert.rejects(q('select public.form_ghost_inbox_for_athlete($1)', [athlete]), /athlete_access_denied/);
  });
  await as(db, outsider, async () => {
    await assert.rejects(q('select public.form_ghost_inbox_for_athlete($1)', [athlete]), /athlete_access_denied/);
  });
});

test('revoked coach membership immediately removes Mirror access', async () => {
  await q("update public.athlete_memberships set status='revoked' where user_id=$1", [coach]);
  await as(db, coach, async () => {
    await assert.rejects(q('select public.form_ghost_inbox_for_athlete($1)', [athlete]), /athlete_access_denied/);
  });
});

after(() => db.close());
