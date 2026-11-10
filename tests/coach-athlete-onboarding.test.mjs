import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { athleteSlug, existingAthleteMatch, newYorkWeekMonday, normalizeNewAthlete, normalizeInviteEmail } from '../private/athlete-onboarding.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('portrait editor is available on a selected coach dossier and opens for that athlete', () => {
  const labs = read('coach/labs/labs.js');
  const css = read('coach/labs/labs.css');
  assert.match(labs, /plToggle'\)\.hidden = !asCoach\(\) \|\| view !== 'athlete'/);
  assert.match(labs, /PL\.who\.value = record\.athlete\.slug/);
  assert.match(css, /body:has\(\.ccApp\)>\.plToggle:not\(\[hidden\]\)\{display:block!important/);
});

test('invite email accepts a valid address and rejects malformed or oversized addresses', () => {
  assert.equal(normalizeInviteEmail('  AnthonyKugaCheer@gmail.com  '), 'anthonykugacheer@gmail.com');
  assert.throws(() => normalizeInviteEmail('anthony@localhost'), /verified email/);
  assert.throws(() => normalizeInviteEmail('anthony@ example.com'), /verified email/);
  assert.throws(() => normalizeInviteEmail('a'.repeat(255) + '@example.com'), /verified email/);
  const data = read('private/data.js');
  const invite = data.split('export async function createAthleteInvite')[1].split('export async function')[0];
  assert.match(invite, /normalizeInviteEmail\(email\)/);
  assert.doesNotMatch(invite, /\\\\s/);
});

test('new athlete identity is normalized without modifying an existing athlete', () => {
  const created = normalizeNewAthlete({
    displayName: '  José   Runner  ', firstName: ' José ',
    email: ' JOSERUNNER@example.com ', programName: 'Run Development',
    accountLabel: 'Coached athlete', targetEvent: 'City Half'
  });
  assert.equal(athleteSlug('José Runner'), 'jose-runner');
  assert.equal(created.displayName, 'José Runner');
  assert.equal(created.firstName, 'José');
  assert.equal(created.slug, 'jose-runner');
  assert.equal(created.email, 'joserunner@example.com');
  assert.equal(created.targetEvent, 'City Half');
  assert.equal(created.goalLabel, null);
});

test('same first name is okay; exact full-name or slug collision is not', () => {
  const roster = [
    { slug: 'alex', display_name: 'Alex' },
    { slug: 'alex-smith', display_name: 'Alex Smith' }
  ];
  const second = normalizeNewAthlete({ displayName: 'Alex Brown', firstName: 'Alex',
    programName: 'Run Development', accountLabel: 'Coached athlete' });
  assert.equal(existingAthleteMatch(roster, second), null);
  assert.equal(existingAthleteMatch(roster, { ...second, slug: 'alex-smith' }), roster[1]);
  assert.equal(existingAthleteMatch(roster, { ...second, displayName: ' ALEX SMITH ' }), roster[1]);
});

test('new athlete validation refuses incomplete identity and malformed optional email', () => {
  const base = { displayName: 'Sam Rivera', firstName: 'Sam', programName: 'Run Development', accountLabel: 'Coached athlete' };
  assert.throws(() => normalizeNewAthlete({ ...base, displayName: '??' }), /valid athlete record|full name/);
  assert.throws(() => normalizeNewAthlete({ ...base, email: 'not-an-email' }), /verified email/);
  assert.throws(() => normalizeNewAthlete({ ...base, programName: '' }), /program/);
});

test('first-week anchor respects New York, even after midnight UTC', () => {
  assert.equal(newYorkWeekMonday(new Date('2026-11-09T22:00:00Z')), '2026-11-09');
  assert.equal(newYorkWeekMonday(new Date('2026-11-10T02:00:00Z')), '2026-11-09');
  assert.equal(newYorkWeekMonday(new Date('2026-11-08T20:00:00Z')), '2026-11-02');
});

test('coach console exposes the writer but keeps access and athlete publication separate', () => {
  const html = read('coach/index.html');
  const js = read('coach/coach.js');
  const data = read('private/data.js');
  assert.match(html, /id="newAthleteDialog"/);
  for (const name of ['displayName', 'firstName', 'email', 'programName', 'accountLabel', 'targetEvent', 'goalLabel']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(js, /athleteCreationAllowed \? '<button class="consoleAddAthlete"/);
  assert.match(js, /await canAuthorCoachAthletes\(\)/);
  assert.match(js, /await createCoachAthlete\(payload, roster\)/);
  assert.match(js, /await createAthleteInvite\(created\.id, created\.email\)/);
  assert.match(js, /await loadCoachRoster\(access\.coachMemberships\)/);
  assert.match(js, /await selectAthlete\(created\.id\)/);
  assert.match(js, /function emptyCoachRosterView\(\)/);
  assert.match(js, /if \(!roster\.length && athleteCreationAllowed\)/);
  assert.match(js, /Start first block/);
  assert.match(js, /await authorInitialTrainingBlock\(payload\)/);
  assert.match(js, /newYorkWeekMonday\(\)/);
  assert.match(data, /supabase\.rpc\('author_athlete'/);
  assert.match(data, /supabase\.rpc\('author_initial_training_block'/);
  assert.match(data, /sourceReadbackVerified: true, invitationReserved: false/);
  assert.doesNotMatch(data.slice(data.indexOf('export async function createCoachAthlete'), data.indexOf('export async function createAthleteInvite')),
    /signUp|inviteUserByEmail|sendMagicLink|coaching-email-signin/);
});

test('protected writer atomically adds the logged-in administrator and refuses duplicates', () => {
  const sql = read('supabase/migrations/20261109190000_restore_coach_athlete_authoring.sql');
  assert.match(sql, /create policy athletes_insert_protected_admin[\s\S]*?to authenticated/);
  assert.match(sql, /create policy memberships_insert_protected_admin[\s\S]*?user_id = auth\.uid\(\) and role = 'coach'/);
  assert.match(sql, /security invoker set search_path = ''/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.match(sql, /created uuid := pg_catalog\.gen_random_uuid\(\)/);
  assert.doesNotMatch(sql, /returning id into created/i);
  assert.match(sql, /acting_coach uuid := \(select auth\.uid\(\)\)/);
  assert.match(sql, /not public\.is_active_coaching_administrator\(acting_coach\)/);
  assert.match(sql, /where slug = normalized_slug[\s\S]*?= lower\(normalized_name\)/);
  assert.match(sql, /insert into public\.athlete_memberships[\s\S]*?values \(created, acting_coach, 'coach', 'active'\)/);
  assert.match(sql, /grant execute on function public\.author_athlete[\s\S]*?to authenticated/);
  assert.doesNotMatch(sql, /grant execute[^;]*to anon/i);
  assert.match(sql, /create or replace function public\.author_initial_training_block/);
  assert.match(sql, /not public\.is_coach_member\(p_athlete_id\)/);
  assert.match(sql, /if exists \(select 1 from public\.training_blocks where athlete_id = p_athlete_id\)/);
  assert.match(sql, /'coach_authored'/);
});
