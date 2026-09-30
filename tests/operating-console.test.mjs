import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {priorityCandidates,sourceState,escapeHtml,safeUrl,validateBoard,dateLabel,upcomingAppointments} from '../coach/ops/model.mjs';
const day='2026-09-30';
const base={id:'a',kind:'task',actor:'brice',status:'queued',priority:20,focus_on:day,created_at:'2026-09-30T00:00:00Z'};
test('at most four ready owner actions, not waiting or agent work',()=>{
 const items=[...Array.from({length:7},(_,n)=>({...base,id:String(n),priority:n+1})),{...base,id:'waiting',status:'waiting',priority:1},{...base,id:'agent',actor:'agent',priority:1},{...base,id:'done',status:'done'},{...base,id:'context',kind:'context'}];
 assert.deepEqual(priorityCandidates(items,day).map(i=>i.id),['0','1','2','3']);
});
test('future focus and undated backlog do not become invented priorities',()=>{
 assert.equal(priorityCandidates([{...base,focus_on:'2026-10-01'},{...base,focus_on:null,due_on:null}],day).length,0);
 assert.equal(priorityCandidates([{...base,focus_on:null,due_on:'2026-09-29'}],day).length,1);
});
test('today selection takes precedence and unfinished prior selection remains visible',()=>{
 assert.deepEqual(priorityCandidates([{...base,id:'old',focus_on:'2026-09-29',priority:1},{...base,id:'today',priority:90}],day).map(i=>i.id),['today','old']);
});
test('missing, expired, conflicting and pending sources are not live',()=>{
 const now=Date.parse('2026-09-30T14:00:00Z');
 assert.equal(sourceState({state:'snapshot'},now),'unchecked');
 assert.equal(sourceState({state:'snapshot',observed_at:'2026-09-29',expires_at:'2026-09-30T12:00:00Z'},now),'stale');
 assert.equal(sourceState({state:'pending'},now),'pending');
 assert.equal(sourceState({state:'conflict'},now),'conflict');
});
test('escape text and reject executable links',()=>{
 assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
 assert.equal(safeUrl('javascript:alert(1)'),null);
 assert.equal(safeUrl('data:text/html,hi'),null);
 assert.equal(safeUrl('/coach/labs/'),'https://speedandform.com/coach/labs/');
});
test('incomplete responses fail instead of reporting no tasks',()=>{
 assert.throws(()=>validateBoard({schema_version:1,today:day,items:[]}));
 const data={schema_version:1,today:day};for(const k of ['items','priorities','sources','athletes','decisions','coach_tasks','coach_todos','appointments','changes'])data[k]=[];
 assert.equal(validateBoard(data),data);
});
test('date-only labels do not become previous-day dates',()=>assert.equal(dateLabel('2026-09-30'), 'Sep 30'));
test('browser writes use optimistic revision matching and canonical shared reader',()=>{
 const js=fs.readFileSync(new URL('../coach/ops/console.js',import.meta.url),'utf8');
 assert.match(js,/\.eq\('revision',item\.revision\)/);
 assert.match(js,/rpc\('operating_console_read'/);
 assert.doesNotMatch(js,/from\('decisions'\)\.update/);
 assert.doesNotMatch(js,/f\.title\.value|f\.id\.value/);
});
test('migration is private, does not seed identities and includes external decisions',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/20260930133207_operating_console_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/SECURITY INVOKER/);
 assert.match(sql,/published','delivered_externally/);
 assert.doesNotMatch(sql,/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b|\$\d+\.\d{2}/i);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.operating_console_read\(uuid,date\) FROM PUBLIC,anon/);
});

test('past appointments and completed work leave next commitments; time-pending stays',()=>{
 const a={scheduled_on:day,time_local:'06:30:00',duration_minutes:60,status:'planned'};
 assert.equal(upcomingAppointments([a],day,'2026-09-30T13:30:00Z').length,0);
 assert.equal(upcomingAppointments([{...a,time_local:null,status:'tentative'}],day,'2026-09-30T13:30:00Z').length,1);
 assert.equal(upcomingAppointments([{...a,scheduled_on:'2026-10-01'}],day,'2026-09-30T13:30:00Z').length,1);
 assert.equal(upcomingAppointments([{...a,scheduled_on:'2026-10-01',status:'done'}],day,'2026-09-30T13:30:00Z').length,0);
});
