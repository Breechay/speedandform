import assert from 'node:assert/strict';
import test from 'node:test';
import {receive} from '../netlify/functions/garmin-activities.mjs';

const env = { FORM_GARMIN_SOURCE_RANGES:'192.0.2.0/24', GARMIN_PUSH_ENABLED:'true', GARMIN_GATEWAY_TOKEN:'x'.repeat(64), FORM_SUPABASE_PUBLISHABLE_KEY:'fixture' };
const batch = {activities:[{userId:'test-user', summaryId:'test-run', durationInSeconds:42, activityId:12345678, workoutId:'98765432101234567890', latitude:1}]};
const post = () => new Request('https://example.test/', {
  method:'POST', headers:{'content-type':'application/json', 'x-forwarded-for':'192.0.2.2', 'cf-connecting-ip':'192.0.2.2'},
  body:JSON.stringify(batch),
});
const blocked = async () => { throw Error('unexpected backend request'); };
test('disabled and untrusted requests never reach storage', async () => {
  let calls = 0;
  const record = () => { calls++; return blocked(); };
  for (const ip of ['198.51.100.1', '203.0.113.1']) assert.equal((await receive(post(),{ip},env,record)).status,403);
  assert.equal((await receive(post(),{ip:'192.0.2.2'},{...env,GARMIN_PUSH_ENABLED:'false'},record)).status,503);
  assert.equal(calls,0);
});
test('acknowledgment follows successful durable RPC and the payload omits coordinates', async () => {
  const ip = '192.0.2.2';
  let release, started;
  const entered = new Promise(resolve => { started = resolve; });
  const pending = receive(post(),{ip},env,async (_, options) => {
    assert.deepEqual(JSON.parse(options.body).events,[{userId:'test-user',summaryId:'test-run',activityId:'12345678',workoutId:'98765432101234567890',durationInSeconds:42}]);
    assert.equal(options.headers['x-form-gateway'],env.GARMIN_GATEWAY_TOKEN);
    started();
    return new Promise(resolve => { release = resolve; });
  });
  await entered;
  let completed = false;
  pending.then(()=>{ completed=true; });
  await Promise.resolve();
  assert.equal(completed,false);
  release(new Response(null,{status:204}));
  assert.equal((await pending).status,200);
  for (const status of [401,403,500]) assert.equal((await receive(post(),{ip},env,async()=>new Response(null,{status}))).status,503);
  assert.equal((await receive(post(),{ip},env,blocked)).status,503);
});
test('platform IPv4-mapped address is compared against the same IPv4 networks', async()=>{
 const ok=async()=>new Response(null,{status:204});
 assert.equal((await receive(post(),{ip:'::ffff:192.0.2.2'},env,ok)).status,200);
 assert.equal((await receive(post(),{ip:'::ffff:198.51.100.1'},env,ok)).status,403);
 assert.equal((await receive(post(),{ip:'2001:db8::2'},env,ok)).status,403);
});
