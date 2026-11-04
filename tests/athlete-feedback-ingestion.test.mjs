import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const consoleJs=read('coach/ops/console.js');
const data=read('private/data.js');

test('feedback capture is athlete-scoped, attributed, and does not rewrite a plan',()=>{
  assert.match(consoleJs,/id="athlete-feedback-form"/);
  assert.match(consoleJs,/athleteBrief\.data\?\.athlete\?\.id!==athleteId/);
  assert.match(consoleJs,/source:f\.elements\['source'\]\.value/);
  assert.match(consoleJs,/observedOn:f\.elements\['observed_on'\]\.value/);
  assert.match(consoleJs,/No plan changed/);
  assert.doesNotMatch(consoleJs,/athlete-feedback-form[\s\S]{0,1000}reviseSession/);
});

test('shared owner validates source and rereads saved observation without blind retry',()=>{
  assert.match(data,/\['athlete_reported','coach_observed','system_detected'\]\.includes\(source\)/);
  assert.match(data,/Preserve a nonempty source observation/);
  assert.match(data,/signed-in|Sign in as an authorized coach/);
  assert.match(data,/observed_on: observedOn/);
  assert.match(consoleJs,/data\?\.some\(o=>o\.id===saved\.id\)/);
  assert.match(consoleJs,/before any retry/);
});
