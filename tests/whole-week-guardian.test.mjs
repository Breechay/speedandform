import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wholeWeekGuardian } from '../private/whole-week-guardian.mjs';

const brief = overrides => ({
  read_at: '2026-11-04T18:00:00Z', athlete: { id: 'athlete-1' },
  current_week: { id: 'week-1', story_current: false },
  upcoming_sessions: [], forge_receipts: [], ...overrides
});

test('stale story is assigned to agents, not automatically Brice', () => {
  const output = wholeWeekGuardian(brief());
  assert.equal(output.findings.find(f => f.code === 'week_story_stale').owner, 'agent');
  assert.equal(output.checks.paired_strength, 'unknown');
  assert.ok(!output.findings.some(f => f.owner === 'coach'));
});

test('stacking and consecutive high efforts invite judgment without rewriting sessions', () => {
  const output = wholeWeekGuardian(brief({ current_week: { id: 'w', story_current: true },
    upcoming_sessions: [
      { id: 'a', state: 'published', version_id: 'v1', scheduled_on: '2026-11-05', is_key: true },
      { id: 'b', state: 'published', version_id: 'v2', scheduled_on: '2026-11-05', rpe_high: 4 },
      { id: 'c', state: 'published', version_id: 'v3', scheduled_on: '2026-11-06', rpe_high: 8 }
    ] }));
  assert.equal(output.findings.find(f => f.code === 'multiple_runs_same_day').owner, 'coach');
  assert.equal(output.findings.find(f => f.code === 'consecutive_key_demands').owner, 'coach');
  assert.equal(output.findings.filter(f => f.code === 'week_story_stale').length, 0);
});

test('missing source never becomes an empty clean bill of health', () => {
  const output = wholeWeekGuardian({});
  assert.equal(output.checks.day_collisions, 'unknown');
  assert.equal(output.findings[0].code, 'source_missing');
});

test('approved strength overlap is context, not a repeat coaching escalation', () => {
  const output = wholeWeekGuardian(brief({
    upcoming_sessions: [{ id:'run',version_id:'v',state:'published',scheduled_on:'2026-11-05',is_key:true }]
  }), {available:true,days:[{id:'lift',scheduled_on:'2026-11-05',title:'Strength A',exercises:[{name:'Romanian Deadlift',sets:3,reps:'8'}]}]});
  const overlap=output.findings.find(f=>f.code==='planned_strength_stack');
  assert.equal(overlap.owner,'agent');
  assert.equal(overlap.severity,'context');
  assert.equal(output.findings.some(f=>f.code==='lower_strength_on_key_run'),false);
  assert.equal(output.checks.paired_strength,'form_day_projection_only');
  assert.ok(output.findings.some(f=>f.code==='forge_prescription_not_verified'));
});

test('agent Console renders guardian findings as ownership categories', () => {
  const consoleSource = fs.readFileSync(new URL('../coach/ops/console.js', import.meta.url), 'utf8');
  assert.match(consoleSource, /wholeWeekGuardian\(d,athleteBrief\.strength\)/);
  assert.match(consoleSource, /Coaching judgment/);
  assert.match(consoleSource, /Agent /);
  assert.match(consoleSource, /not automatic edits or a complete FORM\/Forge workload certification/);
  assert.match(consoleSource, /coach_preview_strength_days/);
});
