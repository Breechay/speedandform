import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { publishedDayKey, uniqueActivePublicationByDay } from '../private/archive-reconciliation.mjs';

const source = readFileSync(new URL('../private/data.js', import.meta.url), 'utf8');
const coach = readFileSync(new URL('../coach/coach.js', import.meta.url), 'utf8');

test('published day key accepts Saturday and SAT without using title/distance', () => {
  const active = { id: 'keep', day_label: 'Saturday', scheduled_on: '2026-11-07', state: 'published' };
  const old = { id: 'archive', day_label: 'SAT', scheduled_on: '2026-11-07', state: 'published' };
  assert.equal(publishedDayKey(active), publishedDayKey(old));
  assert.equal(uniqueActivePublicationByDay([active]).get(publishedDayKey(old))?.id, 'keep');
});

test('withdrawn and unpublished rows never become authoritative replacements', () => {
  const rows = [
    { id: 'cancelled', day_label: 'Saturday', scheduled_on: '2026-11-07', state: 'cancelled' },
    { id: 'withdrawn', day_label: 'Saturday', scheduled_on: '2026-11-14', state: 'published', withdrawn_at: '2026-10-31' },
    { id: 'draft', day_label: 'Saturday', scheduled_on: '2026-11-21', state: 'draft' }
  ];
  assert.equal(uniqueActivePublicationByDay(rows).size, 0);
});

test('conflicting active sessions fail closed', () => {
  assert.throws(() => uniqueActivePublicationByDay([
    { id: 'one', day_label: 'SAT', scheduled_on: '2026-11-28', state: 'published' },
    { id: 'two', day_label: 'Saturday', scheduled_on: '2026-11-28', state: 'published' }
  ]), /More than one active-block publication/);
});

test('normal athlete and coach loads filter archived plans before downloading their sessions', () => {
  assert.match(source, /\.eq\('block_id', blockResponse\.data\.id\)/);
  assert.match(source, /selectIn\('planned_sessions', 'week_id', weekIds/);
  assert.match(source, /const activeBlockIds = new Set/);
  assert.match(source, /const weeks = \(weeksResponse\.data \|\| \[\]\)\.filter/);
  assert.match(source, /session_completions'\)\.select\('\*'\)\.eq\('athlete_id', athleteId\)/);
});

test('archive cleanup requires signed-in coach, live replacement, receipt check, and withdrawal RPC', () => {
  assert.match(source, /uniqueActivePublicationByDay\(activeSessions\)/);
  assert.match(source, /\.neq\('status', 'active'\)/);
  assert.match(source, /\.select\('planned_session_id'\)\.in\('planned_session_id', candidates/);
  assert.match(source, /supabase\.rpc\('withdraw_session'/);
  assert.match(coach, /if \(!old \|\| old\.hasReceipt \|\| current\.block\?\.id !== selectedRecord\.block\?\.id\)/);
  assert.match(coach, /reason\.includes\(old\.id\).*reason\.includes\(old\.canonical\.id\)/);
  assert.match(coach, /Historical filed session \(preserved\)/);
});
