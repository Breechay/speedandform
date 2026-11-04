import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { athleteFeedbackTimeline } from '../private/athlete-feedback-timeline.mjs';

test('feedback keeps distinct sources, dates, revisions, and filing provenance', () => {
  const output = athleteFeedbackTimeline([
    {id:'old',source:'coach_observed',observed_on:'2026-10-30',created_at:'2026-10-30T12:00:00Z',facet:'practice',observation:'Observed rhythm change'},
    {id:'new',source:'athlete_reported',observed_on:'2026-11-04',created_at:'2026-11-04T12:00:00Z',facet:'helps',observation:'Strength days make the week clearer',supersedes:'old',evidence_completion_ids:['filed-1','filed-2']}
  ],[{id:'filed-1',filed_at:'2026-11-04T13:00:00Z'}]);
  assert.equal(output[0].id,'new');
  assert.equal(output[0].source_label,'Athlete reported');
  assert.equal(output[0].supersedes,'old');
  assert.equal(output[0].evidence[0].state,'linked_in_recent_read');
  assert.equal(output[0].evidence[1].state,'reference_not_loaded');
  assert.equal(output[1].source_label,'Coach observed');
});

test('Console reads observations under RLS and keeps source failures explicit', () => {
  const code=fs.readFileSync(new URL('../coach/ops/console.js',import.meta.url),'utf8');
  assert.match(code,/from\('athlete_observations'\)/);
  assert.match(code,/\.eq\('athlete_id',id\)/);
  assert.match(code,/\.limit\(12\)/);
  assert.match(code,/Historical observations unavailable/);
  assert.match(code,/athleteFeedbackTimeline/);
  assert.doesNotMatch(code,/\.from\('athlete_observations'\)\.insert/);
});
