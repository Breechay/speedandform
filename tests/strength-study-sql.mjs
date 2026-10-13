// Run with PGLITE_MODULE pointing to a pinned @electric-sql/pglite 0.3.14 installation.
// Isolated in-memory Postgres fixtures, never production athlete data.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE);
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create table public.athletes(id uuid primary key);
create table public.planned_session_versions(id uuid,athlete_id uuid,version_number int);
create table public.forge_strength_receipts(receipt_id text,athlete_id uuid,session_name text,plan_week_number int,
completed_at timestamptz,received_at timestamptz,native_payload jsonb,consent_version text,planned_session_version_id uuid);
grant usage on schema public to service_role;
grant select on all tables in schema public to service_role;`);
for(const name of ['20261013103434_public_strength_study_evidence.sql','20261013104104_strength_study_registry_service_policy.sql']) await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
const aid='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
await db.query('insert into athletes values ($1),($2)',[aid,other]);
await db.query("insert into strength_study_publications(study_slug,athlete_id,display_name,consent_recorded_at,consent_note) values ('fixture',$1,'Fixture',now(),'test')",[aid]);
const payload={feedback:'PRIVATE',deviceKey:'PRIVATE',sets:[{movementId:'press',movementName:'Press',setIndex:0,weight:50,reps:8,privateField:'PRIVATE'},{movementId:'hold',movementName:'Hold',setIndex:0,seconds:30}]};
for(const [id,athlete,p] of [['native',aid,payload],['unrelated',other,payload],['legacy',aid,null],['backfill',aid,{...payload,isBackfilled:true}]]) await db.query("insert into forge_strength_receipts values ($1,$2,'Upper A',6,now(),now(),$3,'forge-coach-receipts-v1',null)",[id,athlete,p]);
await db.exec('set role service_role');
let data=(await db.query("select published_strength_study('fixture') as result")).rows[0].result;
assert.equal(data.total_sessions,1);assert.equal(data.sessions.length,1);
assert.equal(data.sessions[0].sets[0].weight,50);assert.equal(data.sessions[0].sets[0].weight_unit,null);
assert.equal(data.sessions[0].sets[1].seconds,30);
assert(!JSON.stringify(data).includes('PRIVATE'));assert(!JSON.stringify(data).includes(aid));
assert.equal((await db.query("select published_strength_study('unknown') as result")).rows[0].result.status,'not_published');
assert.equal((await db.query("select published_strength_study('fixture',50) as result")).rows[0].result.sessions.length,0);
await db.exec("update strength_study_publications set revoked_at=now() where study_slug='fixture'");
assert.equal((await db.query("select published_strength_study('fixture') as result")).rows[0].result.status,'not_published');
await db.exec('reset role; set role anon');
await assert.rejects(db.query("select public.published_strength_study('fixture')"),/permission denied/);
await assert.rejects(db.query('select * from public.strength_study_publications'),/permission denied/);
await db.close();console.log('PASS: SQL projection, cross-athlete isolation, private-field exclusion, legacy/backfill exclusion, pagination, unknown/revoked publication, anon denial.');
