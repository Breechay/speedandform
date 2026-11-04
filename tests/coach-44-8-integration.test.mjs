import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../coach/ops/index.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('../coach/ops/console.js',import.meta.url),'utf8');
const handoff=fs.readFileSync(new URL('../docs/operations/COACH_44_8_INTEGRATION_HANDOFF_2026-11.md',import.meta.url),'utf8');

test('the combined Coach interface has all its source-backed views and cache-busted assets',()=>{
  assert.match(html,/data-tab="staff"/);
  assert.match(html,/console\.css\?v=5/);
  assert.match(html,/console\.js\?v=6/);
  for(const name of ['staffSnapshot','athleteContinuity','decisionOutcomeContinuity','athleteFeedbackTimeline'])
    assert.match(code,new RegExp(name));
});
test('44.8 boundaries and incomplete database features remain explicit',()=>{
  assert.match(handoff,/44\.6 stability and 44\.7 Speed \+ Strength/);
  assert.match(handoff,/No ledger table or writer yet/);
  assert.match(handoff,/No relationship table or writer yet/);
  assert.match(handoff,/no retroactive guess\/backfill/);
});
