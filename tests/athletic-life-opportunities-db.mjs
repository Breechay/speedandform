// Isolated PGlite acceptance for the private opportunity migration. Never connects to production.
// SF_PGLITE_PATH=/tmp/<qa>/node_modules/@electric-sql/pglite/dist/index.js node tests/athletic-life-opportunities-db.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { openPglite, splitStatements, as } from './support/replay-schema.mjs';

const db=await openPglite();
const q=async(sql,args=[])=> (await db.query(sql,args)).rows;
const rejects=async(fn,pattern)=>assert.rejects(fn,pattern);

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key default gen_random_uuid());
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,service_role;
    create table public.qa_admins(user_id uuid primary key references auth.users(id));
    create function public.is_active_coaching_administrator(p_id uuid) returns boolean
      language sql stable security definer set search_path=pg_catalog,public as $$
      select exists(select 1 from public.qa_admins where user_id=p_id) $$;
  `);

  // Use the actual existing stamp/audit definitions, not test approximations.
  const source=await fs.readFile('supabase/migrations/20260930133207_operating_console_v1.sql','utf8');
  const selected=splitStatements(source).filter(s=>
    /CREATE TABLE public\.operating_changes\s*\(/i.test(s) ||
    /CREATE FUNCTION public\.operating_record_(stamp|audit)\s*\(/i.test(s)
  );
  assert.equal(selected.length,3,'existing operating audit functions and table located');
  for(const stmt of selected)await db.exec(stmt);

  const migration=await fs.readFile('supabase/migrations/20261029162911_athletic_life_opportunities_v1.sql','utf8');
  await db.exec(migration);
  const [owner,other]=await q('insert into auth.users default values returning id').then(async a=>[a[0].id,(await q('insert into auth.users default values returning id'))[0].id]);
  await db.query('insert into public.qa_admins(user_id) values ($1),($2)',[owner,other]);

  const insert=async(title)=>as(db,owner,async()=>
    (await q(`insert into public.athletic_opportunities(title,category,hypothesis,next_test,estimated_hours,estimated_cost_usd,approval_note)
       values ($1,'experience','Test a real barrier','Ask one willing person',2,0,'One private discovery only') returning *`,[title]))[0]);
  const first=await insert('One New Door');
  assert.equal(first.status,'candidate');
  assert.equal(first.revision,1);
  assert.equal((await q('select count(*)::int n from public.operating_changes where record_table=$1',['athletic_opportunities']))[0].n,1);

  await as(db,owner,async()=>{
    assert.equal((await q('select public.athletic_opportunities_read() r'))[0].r.items.length,1);
    await rejects(q('delete from public.athletic_opportunities where id=$1',[first.id]),/permission denied/i);
    await rejects(q('update public.athletic_opportunities set status=$1 where id=$2',['active',first.id]),/Invalid opportunity state transition/i);
    await q(`update public.athletic_opportunities set status='ready',approved_by=$1,approved_at=now() where id=$2`,[owner,first.id]);
    await rejects(q(`update public.athletic_opportunities set next_test='New scope' where id=$1`,[first.id]),/Scope changed/i);
    const after=(await q('select revision from public.athletic_opportunities where id=$1',[first.id]))[0];
    assert.equal(after.revision,2);
  });

  await as(db,other,async()=>{
    assert.equal((await q('select count(*)::int n from public.athletic_opportunities'))[0].n,0);
    assert.equal((await q('update public.athletic_opportunities set title=$1 where id=$2 returning id',['Stolen',first.id])).length,0);
    await rejects(q('select public.athletic_opportunities_read($1) r',[owner]),/Private coach access required/i);
  });
  await db.exec('reset role');
  const outsider=(await q('insert into auth.users default values returning id'))[0].id;
  await as(db,outsider,async()=>{
    assert.equal((await q('select count(*)::int n from public.athletic_opportunities'))[0].n,0);
    await rejects(q('select public.athletic_opportunities_read() r'),/Private coach access required/i);
    await rejects(q(`insert into public.athletic_opportunities(title,category,hypothesis) values ('Not mine','creative','No access')`),/row-level security/i);
  });

  const second=await insert('Second test');
  const third=await insert('Third test');
  await as(db,owner,async()=>{
    for(const id of [second.id,third.id])
      await q(`update public.athletic_opportunities set status='ready',approved_by=$1,approved_at=now() where id=$2`,[owner,id]);
    for(const id of [first.id,second.id])await q(`update public.athletic_opportunities set status='active' where id=$1`,[id]);
    await rejects(q(`update public.athletic_opportunities set status='active' where id=$1`,[third.id]),/Two experiments are already active/i);
    await rejects(q(`update public.athletic_opportunities set status='completed' where id=$1`,[first.id]),/violates check constraint/i);
    await q(`update public.athletic_opportunities set evidence='The person described a real barrier',learning='One conversation, not proof of demand',status='completed' where id=$1`,[first.id]);
    await q(`update public.athletic_opportunities set status='active' where id=$1`,[third.id]);
    assert.equal((await q(`select count(*)::int n from public.athletic_opportunities where status='active'`))[0].n,2);
  });
  assert.ok((await q('select count(*)::int n from public.operating_changes'))[0].n>=10);

  await db.exec('set role anon');
  await rejects(q('select * from public.athletic_opportunities'),/permission denied/i);
  await rejects(q('select public.athletic_opportunities_read()'),/permission denied/i);
  await db.exec('reset role');
  console.log('PASS isolated opportunity migration: authorization, audit, approval, scope, transitions, two-active cap and closeout.');
} finally { await db.close(); }
