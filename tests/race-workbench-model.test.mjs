import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {normalizePayload,validatePayload,validateWorkbench,escapeHtml,safeHttps} from '../coach/races/workbench-model.mjs';

const id='00000000-0000-4000-8000-000000000001';
const base={name:'Life Time Miami Marathon & Half',starts_on:'2027-01-31',ends_on:'2027-01-31',city:'Miami, FL',
  official_url:'https://www.themiamimarathon.com/',brief:'Miami starts downtown and crosses the causeways.',
  brief_source_url:'https://www.themiamimarathon.com/race/',source_checked_at:'2026-10-29'};

test('a photo-free sourced race can be published',()=>{
  const {payload,errors}=validatePayload(base,{publish:true,eventId:id});
  assert.deepEqual(errors,[]);
  assert.equal(payload.cover_image_url,null);
  assert.equal(payload.cover_rights_confirmed,false);
  assert.equal(payload.starts_on,'2027-01-31');
});
test('publication requires provenance for an authored brief',()=>{
  assert.match(validatePayload({...base,brief_source_url:null},{publish:true,eventId:id}).errors.join(' '),/Attribute/i);
  assert.match(validatePayload({...base,source_checked_at:null},{publish:true,eventId:id}).errors.join(' '),/checked/i);
});
test('cover must be event-specific and approval plus alt are required',()=>{
  const url=`https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-media/races/${id}/v2.webp`;
  assert.match(validatePayload({...base,cover_image_url:url},{publish:true,eventId:id}).errors.join(' '),/rights/i);
  assert.deepEqual(validatePayload({...base,cover_image_url:url,cover_rights_confirmed:true,cover_image_alt:'Runners at dawn'},
    {publish:true,eventId:id}).errors,[]);
  assert.match(validatePayload({...base,cover_image_url:url},{eventId:'00000000-0000-4000-8000-000000000002'}).errors.join(' '),/this race/i);
});
test('new drafts cannot smuggle entry, result or approval fields',()=>{
  const p=normalizePayload({...base,race_entries:[{status:'registered'}],result:{finish_seconds:1},athlete_approved_at:'now'});
  assert.equal(Object.hasOwn(p,'race_entries'),false);
  assert.equal(Object.hasOwn(p,'result'),false);
  assert.equal(Object.hasOwn(p,'athlete_approved_at'),false);
});
test('reject long descriptions, mixed protocols, reversed dates and unsafe HTML',()=>{
  const errors=validatePayload({...base,brief:'x'.repeat(701),official_url:'javascript:alert(1)',
    starts_on:'2027-02-01',ends_on:'2027-01-31'},{eventId:id}).errors;
  assert.equal(errors.length,3);
  assert.equal(safeHttps('javascript:alert(1)'),null);
  assert.equal(escapeHtml('<img onerror="alert(1)">'),'&lt;img onerror=&quot;alert(1)&quot;&gt;');
});
test('private RPC response is schema-checked',()=>{
  assert.equal(validateWorkbench({schema_version:1,events:[{event_id:id,published:{name:'x'},draft_revision:0}]}).events.length,1);
  assert.throws(()=>validateWorkbench({schema_version:1,events:[{event_id:id}]}));
});
test('SQL retains strict separation between draft and athlete-visible publish',()=>{
  const sql=readFileSync(new URL('../docs/next/FORM_RACE_EDITORIAL_COACH_WORKBENCH_CANDIDATE.sql',import.meta.url),'utf8');
  assert.match(sql,/coach_race_private\.editorial_drafts/);
  assert.match(sql,/coach_race_private\.editorial_publication_history/);
  assert.match(sql,/is_active_coaching_administrator\(auth\.uid\(\)\)/);
  assert.match(sql,/v_event\.updated_at is distinct from v_draft\.base_event_updated_at/);
  assert.doesNotMatch(sql,/update\s+public\.race_entries\b/i);
  assert.doesNotMatch(sql,/update\s+coach_race_private\.result_publications\b/i);
  assert.match(sql,/for insert to authenticated/);
});
