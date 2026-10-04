// Isolated Postgres/PGlite execution. Never connects to a hosted database.
// SF_PGLITE_PATH points to the installed PGlite module in a temporary QA folder.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite} = await import(process.env.SF_PGLITE_PATH ? pathToFileURL(process.env.SF_PGLITE_PATH).href : '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create table public.product_entitlements(id uuid primary key default gen_random_uuid(),product_slug text not null,product_version text not null,status text not null default 'paid' check(status in ('paid','refunded','disputed','revoked')),stripe_checkout_session_id text unique not null,stripe_payment_intent_id text unique,stripe_customer_id text,purchaser_email text not null,amount_total int not null,currency text not null,source jsonb not null default '{}',purchased_at timestamptz not null default now(),refunded_at timestamptz);
  grant all on public.product_entitlements to service_role;`);
await db.exec(await fs.readFile('supabase/migrations/20261004163816_rpd_purchase_access_email.sql','utf8'));
const purchase = n => ({product_slug:'race-pace-durability',product_version:'rpd_v1',stripe_checkout_session_id:`cs_test_db_${n}`,stripe_payment_intent_id:`pi_test_db_${n}`,purchaser_email:'buyer@example.test',amount_total:7900,currency:'usd',source:{},purchased_at:'2026-10-04T16:00:00Z'});
const payload = {to:['buyer@example.test'],subject:'Plan fixture',text:'Fixture',html:'<p>Fixture</p>',from:'FORM <hello@send.speedandform.com>'};
const scalar = async (sql,args=[]) => (await db.query(sql,args)).rows[0].result;
const record = n => scalar('select public.rpd_record_paid_purchase($1::jsonb) result',[JSON.stringify(purchase(n))]);
const enqueue = (n,p=payload) => scalar('select public.rpd_enqueue_purchase_email($1,$2,$3::jsonb) result',[`cs_test_db_${n}`,'fixture-v1',JSON.stringify(p)]);
const claim = n => scalar('select public.rpd_claim_purchase_email($1) result',[`cs_test_db_${n}`]);
const finish = (n,c,outcome='sent') => scalar('select public.rpd_finish_purchase_email($1,$2::uuid,$3,$4,$5) result',[`cs_test_db_${n}`,c.lease_token,outcome,outcome==='sent'?`email-${n}`:null,outcome==='retry'?'provider_network':null]);
const revoke = (n,status='refunded') => scalar('select public.rpd_revoke_paid_purchase($1,$2) result',[`pi_test_db_${n}`,status]);
await db.exec('set role service_role');

assert.equal(await record(1),'paid');assert.equal(await record(1),'paid');
assert.equal(await enqueue(1),'pending');
await enqueue(1,{...payload,subject:'Changed deployment'});
const first=await claim(1);assert.equal(first.state,'claimed');assert.equal(first.payload.subject,'Plan fixture');
assert.equal((await claim(1)).state,'busy');
assert.equal(await finish(1,first),'sent');assert.equal((await claim(1)).state,'sent');
assert.equal(await finish(1,first),'sent');
assert.equal(await enqueue(1),'sent');
assert.equal(await scalar("select count(*)::int result from public.rpd_purchase_email_outbox where stripe_checkout_session_id='cs_test_db_1'"),1);

assert.equal(await record(2),'paid');await enqueue(2);const second=await claim(2);assert.equal(await finish(2,second,'retry'),'pending');
assert.equal((await claim(2)).state,'pending');
await db.exec("update public.rpd_purchase_email_outbox set next_attempt_at=now()-interval '1 minute' where stripe_checkout_session_id='cs_test_db_2'");
const retry=await claim(2);assert.equal(retry.state,'claimed');assert.equal(retry.idempotency_key,second.idempotency_key);assert.deepEqual(retry.payload,second.payload);
assert.equal(await finish(2,retry),'sent');

assert.equal(await record(3),'paid');await enqueue(3);const third=await claim(3);
await db.exec("update public.rpd_purchase_email_outbox set lease_until=now()-interval '1 second' where stripe_checkout_session_id='cs_test_db_3'");
const reclaimed=await claim(3);assert.equal(reclaimed.state,'claimed');assert.notEqual(reclaimed.lease_token,third.lease_token);
assert.equal(await finish(3,third),'busy');assert.equal(await finish(3,reclaimed),'sent');

await record(4);await enqueue(4);await claim(4);
await db.exec("update public.rpd_purchase_email_outbox set first_attempt_at=now()-interval '23 hours',lease_until=now()-interval '1 second' where stripe_checkout_session_id='cs_test_db_4'");
assert.equal((await claim(4)).state,'manual_review');assert.equal(await record(4),'paid');
await record(5);await enqueue(5);
await db.exec("update public.rpd_purchase_email_outbox set attempt_count=8 where stripe_checkout_session_id='cs_test_db_5'");
assert.equal((await claim(5)).state,'manual_review');

await record(6);await enqueue(6);const sixth=await claim(6);await revoke(6);
assert.equal(await finish(6,sixth),'cancelled');assert.equal(await record(6),'refunded');assert.equal((await claim(6)).state,'cancelled');
await revoke(7,'disputed');assert.equal(await record(7),'disputed');assert.equal(await enqueue(7),'cancelled');
await revoke(8,'refunded');assert.equal(await record(8),'refunded');
assert.ok(await scalar("select refunded_at result from public.product_entitlements where stripe_checkout_session_id='cs_test_db_8'"));
await record(9);await enqueue(9);await db.exec("update public.product_entitlements set status='revoked' where stripe_checkout_session_id='cs_test_db_9'");assert.equal(await record(9),'revoked');assert.equal((await claim(9)).state,'cancelled');
await record(10);await enqueue(10);const tenth=await claim(10);assert.equal(await finish(10,tenth,'failed'),'failed');assert.equal((await claim(10)).state,'failed');

await db.exec('reset role');
for(const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query('select * from public.rpd_purchase_email_outbox'),/permission denied/);
  await assert.rejects(db.query('select * from public.rpd_purchase_revocations'),/permission denied/);
  await assert.rejects(claim(1),/permission denied/);
  await assert.rejects(record(11),/permission denied/);
  await db.exec('reset role');
}
const functions=await db.query("select prosecdef from pg_proc where proname in ('rpd_record_paid_purchase','rpd_enqueue_purchase_email','rpd_claim_purchase_email','rpd_finish_purchase_email','rpd_revoke_paid_purchase')");
assert.equal(functions.rows.length,5);assert.ok(functions.rows.every(r=>r.prosecdef===false));
await assert.rejects(db.query('select public.rpd_record_paid_purchase($1::jsonb)',[JSON.stringify({...purchase(12),product_slug:null})]),/Invalid paid purchase/);
await db.close();
console.log('PASS isolated PostgreSQL purchase email migration: frozen payload, paid upsert, lease/retry ownership, bounded idempotency, revoked/out-of-order events and service-only grants.');
