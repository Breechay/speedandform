import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler } from './handler.mjs';
const sourceID='00000000-0000-4000-8000-000000000001';
const appleID='00000000-0000-4000-8000-000000000002';
const athleteID='00000000-0000-4000-8000-000000000003';
const auth='source-session-credential-placeholder';
const baseBody={id_token:'apple-id-token-placeholder',nonce:'nonce-12345678901234567890123456789',expected_athlete_id:athleteID};
function fixture(overrides={}) {
  const calls=[];
  const responses={
    '/auth/v1/user':{id:sourceID,email:'athlete@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z'},
    '/rest/v1/rpc/coaching_access_identity':{athlete_id:athleteID,display_name:'Athlete'},
    '/rest/v1/rpc/coaching_apple_link_admit':true,
    '/auth/v1/token?grant_type=id_token':{access_token:'temporary-apple-session-credential',refresh_token:'never-returned',user:{id:appleID,identities:[{provider:'apple'}]}},
    '/rest/v1/rpc/coaching_connect_apple':{athlete_id:athleteID,display_name:'Athlete',status:'connected'},
    '/auth/v1/logout?scope=local':null,
    ...overrides,
  };
  const handler=makeHandler({url:'https://project.invalid',publishableKey:'public-key',serviceKey:'service-secret',fetcher:async(url,options)=>{
    const path=url.replace('https://project.invalid',''); calls.push({path,options});
    const r=responses[path];
    if(r instanceof Error) throw r;
    if(r?.httpError) return new Response(JSON.stringify(r.body||{}),{status:r.httpError});
    return new Response(JSON.stringify(r),{status:200});
  }});
  return {calls,handler};
}
async function run(overrides={},body=baseBody,headers={},method='POST'){
  const f=fixture(overrides);
  const req=new Request('https://project.invalid/functions/v1/coaching-link-apple',{method,headers:{authorization:`Bearer ${auth}`,'content-type':'application/json',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
  const response=await f.handler(req);const result=await response.json().catch(()=>null);
  return {...f,response,result};
}
test('both verified credentials link only the expected athlete and return no credentials',async()=>{
 const {calls,response,result}=await run();assert.equal(response.status,200);assert.equal(result.athlete_id,athleteID);
 assert.equal(calls[0].options.headers.Authorization,`Bearer ${auth}`);
 const link=calls.find(c=>c.path.endsWith('coaching_connect_apple'));
 assert.deepEqual(JSON.parse(link.options.body),{p_verified_user_id:sourceID,p_apple_user_id:appleID,p_expected_athlete_id:athleteID});
 assert.ok(!JSON.stringify(result).includes('credential'));assert.ok(!JSON.stringify(result).includes('service-secret'));
 assert.equal(calls.at(-1).path,'/auth/v1/logout?scope=local');assert.equal(response.headers.get('cache-control'),'no-store');
});
test('missing bearer makes no external requests',async()=>{const r=await run({},baseBody,{authorization:''});assert.equal(r.response.status,401);assert.equal(r.calls.length,0)});
test('unverified email cannot link or verify Apple',async()=>{const r=await run({'/auth/v1/user':{id:sourceID,email:'athlete@example.invalid',email_confirmed_at:null}});assert.equal(r.response.status,403);assert.equal(r.calls.length,1)});
test('nil email not treated as proven',async()=>{const r=await run({'/auth/v1/user':{id:sourceID,email:null,email_confirmed_at:'x'}});assert.equal(r.response.status,403)});
test('invalid source credential not accepted',async()=>{const r=await run({'/auth/v1/user':{httpError:401}});assert.equal(r.response.status,401);assert.equal(r.calls.length,1)});
test('source network fault is not an invitation failure',async()=>{const r=await run({'/auth/v1/user':new Error('offline')});assert.equal(r.response.status,503)});
test('ambiguous source membership cannot choose first athlete',async()=>{const r=await run({'/rest/v1/rpc/coaching_access_identity':{httpError:400,body:{code:'P0003'}}});assert.equal(r.response.status,409);assert.ok(!r.calls.some(c=>c.path.includes('/token?')))});
test('changed expected athlete refuses before Apple token exchange',async()=>{const r=await run({}, {...baseBody,expected_athlete_id:appleID});assert.equal(r.response.status,409);assert.equal(r.result.code,'athlete_changed')});
test('rate limit is enforced before Apple authentication',async()=>{const r=await run({'/rest/v1/rpc/coaching_apple_link_admit':false});assert.equal(r.response.status,429);assert.equal(r.calls.length,3)});
test('rate limiter outage does not fail open',async()=>{const r=await run({'/rest/v1/rpc/coaching_apple_link_admit':{httpError:500}});assert.equal(r.response.status,503);assert.equal(r.calls.length,3)});
test('invalid Apple signature or nonce never reaches link writer',async()=>{const r=await run({'/auth/v1/token?grant_type=id_token':{httpError:400}});assert.equal(r.response.status,401);assert.ok(!r.calls.some(c=>c.path.endsWith('coaching_connect_apple')))});
test('Apple exchange sends original nonce for verification',async()=>{const r=await run();const c=r.calls.find(c=>c.path.includes('/token?'));assert.deepEqual(JSON.parse(c.options.body),{provider:'apple',id_token:baseBody.id_token,nonce:baseBody.nonce})});
test('non-Apple identity rejected and temporary session closed',async()=>{const r=await run({'/auth/v1/token?grant_type=id_token':{access_token:'temporary-apple-session-credential',user:{id:appleID,identities:[{provider:'email'}]}}});assert.equal(r.response.status,401);assert.equal(r.calls.at(-1).path,'/auth/v1/logout?scope=local')});
test('another athletes Apple account returns conflict, never rewritten',async()=>{const r=await run({'/rest/v1/rpc/coaching_connect_apple':{httpError:409,body:{code:'23505'}}});assert.equal(r.response.status,409);assert.equal(r.result.code,'apple_account_conflict');assert.equal(r.calls.at(-1).path,'/auth/v1/logout?scope=local')});
test('revoked membership refuses with no success report',async()=>{const r=await run({'/rest/v1/rpc/coaching_connect_apple':{httpError:403,body:{code:'42501'}}});assert.equal(r.response.status,403)});
test('no arbitrary email or user id accepted from request body',async()=>{for(const key of ['email','user_id','athlete_id','role']){const r=await run({}, {...baseBody,[key]:'malicious'});assert.equal(r.response.status,400);assert.equal(r.calls.length,0)}});
test('bad JSON rejected without external calls',async()=>{const r=await run({},'{');assert.equal(r.response.status,400);assert.equal(r.calls.length,0)});
test('oversized streamed body rejected',async()=>{const r=await run({},'x'.repeat(17000));assert.equal(r.response.status,400);assert.equal(r.calls.length,0)});
test('bad nonce rejected without external calls',async()=>{const r=await run({}, {...baseBody,nonce:'short'});assert.equal(r.response.status,400);assert.equal(r.calls.length,0)});
test('foreign origin rejected',async()=>{const r=await run({},baseBody,{origin:'https://evil.invalid'});assert.equal(r.response.status,403);assert.equal(r.calls.length,0)});
test('GET cannot authenticate or link',async()=>{const r=await run({},baseBody,{},'GET');assert.equal(r.response.status,405);assert.equal(r.calls.length,0)});
test('cleanup fault does not pretend committed link failed',async()=>{const r=await run({'/auth/v1/logout?scope=local':new Error('offline')});assert.equal(r.response.status,200)});
test('database transport failure closes temporary Apple session',async()=>{const r=await run({'/rest/v1/rpc/coaching_connect_apple':new Error('offline')});assert.equal(r.response.status,503);assert.equal(r.calls.at(-1).path,'/auth/v1/logout?scope=local')});
test('backend mismatching athlete cannot be reported as connected',async()=>{const r=await run({'/rest/v1/rpc/coaching_connect_apple':{athlete_id:appleID}});assert.equal(r.response.status,503)});
