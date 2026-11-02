// Contract checks for the authenticated coach invitation surface.
// Run: node --test tests/coach-invite-surface.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('coach invite goes through the scoped RPC, never a direct access_invites insert', () => {
  const data = read('private/data.js');
  assert.match(data, /export async function createAthleteInvite/);
  assert.match(data, /supabase\.rpc\('coach_invite_create'/);
  const fn = data.split('export async function createAthleteInvite')[1].split('export async function authorSession')[0];
  assert.doesNotMatch(fn, /\.from\('access_invites'\)/);
});

test('invite dialog distinguishes reserved access from email delivery', () => {
  const html = read('coach/index.html');
  const script = read('coach/coach.js');
  assert.match(html, /id="inviteDialog"/);
  assert.match(html, /type="email" name="email"/);
  assert.match(html, /does not create an Auth user, claim an account, or send an email/);
  assert.match(script, /id="inviteAthlete"/);
  assert.match(script, /invite\?\.athlete_id !== athleteId \|\| invite\?\.email !== email/);
  assert.match(script, /No email has been sent/);
});

test('published session editor rejects unimplemented date and week moves', () => {
  const script = read('coach/coach.js');
  assert.match(script, /payload\.scheduledOn !== existing\.scheduled_on/);
  assert.match(script, /payload\.dayLabel !== existing\.day_label/);
  assert.match(script, /payload\.weekId !== existing\.week_id/);
  assert.match(script, /cannot move an existing session/);
});
