const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const {processVerifiedEvent,paidPurchase} = await import(pathToFileURL(path.resolve('supabase/functions/stripe-rpd-webhook/core.mjs')));
  const {purchaseAccessEmail} = await import(pathToFileURL(path.resolve('supabase/functions/stripe-rpd-webhook/email.mjs')));
  const session = {id:'cs_test_email_fixture',payment_status:'paid',created:1791136800,metadata:{product_slug:'race-pace-durability',utm_source:'qa'},customer_details:{email:'Buyer@Example.test'},payment_intent:'pi_email_fixture',amount_total:7900,currency:'usd'};
  const event = (s=session,type='checkout.session.completed') => ({id:'evt_fixture',type,data:{object:s}});
  function fixture() {
    const f = {status:null,state:null,payload:null,attempts:0,calls:[],finishFailure:false};
    f.store = {
      async record(p) {f.purchase ||= p;f.status ||= 'paid';return f.status;},
      async enqueue(id,version,payload) {f.payload ||= payload;f.state ||= 'pending';return f.state;},
      async claim() {if(f.state !== 'pending') return {state:f.state};f.state='sending';f.attempts++;return {state:'claimed',lease_token:'lease-fixture',idempotency_key:'rpd-purchase-access/'+session.id,payload:f.payload};},
      async finish(id,token,result) {if(f.finishFailure) {f.finishFailure=false;throw Error('DB unavailable');}f.state=result.kind === 'retry' ? 'pending' : result.kind;return f.state;},
      async revoke(id,status) {f.status=status;if(f.state !== 'sent')f.state='cancelled';}
    };
    f.fetcher = async (url,request) => {f.calls.push({url,request});return new Response(JSON.stringify({id:'email-fixture'}),{status:200});};
    f.run = (e=event(),opts={}) => processVerifiedEvent(e,{store:f.store,apiKey:'fixture-key',emailEnabled:true,fetcher:f.fetcher,...opts});
    return f;
  }
  const email = purchaseAccessEmail({sessionId:session.id,email:session.customer_details.email});
  assert.equal(email.from,'FORM <hello@send.speedandform.com>');
  assert.equal(email.reply_to,'support@speedandform.com');
  assert.equal(email.to[0],'buyer@example.test');
  assert.match(email.subject,/Race Pace That Lasts/);
  assert.match(email.html,/<html lang="en" dir="ltr">/);
  assert.match(email.html,/<table lang="en" dir="ltr" role="presentation"/);
  assert.equal((email.html.match(/<h1/g)||[]).length,1);
  assert.equal((email.html.match(/<table/g)||[]).length,(email.html.match(/role="presentation"/g)||[]).length);
  assert.match(email.text,/purchase_session=cs_test_email_fixture/);
  assert.match(email.text,/\/access\//);
  assert.doesNotMatch(email.html,/utm_|evt_|pi_email|tracking|subscribe/i);
  assert.throws(()=>purchaseAccessEmail({sessionId:'javascript:evil',email:'buyer@example.test'}));
  assert.throws(()=>purchaseAccessEmail({sessionId:session.id,email:'buyer@example.test\r\nBcc:bad@example.test'}));

  assert.equal(paidPurchase({...session,payment_status:'unpaid'}),null);
  assert.equal(paidPurchase({...session,metadata:{product_slug:'other'}}),null);
  assert.equal(paidPurchase({...session,metadata:{offer:'race_pace_durability'}}).product_slug,'race-pace-durability');
  assert.equal(paidPurchase({...session,client_reference_id:'rpd__s_google__c_half-marathon'}).source.utm_source,'google');

  const good=fixture();
  assert.equal((await good.run()).email,'sent');
  assert.equal(good.status,'paid');
  assert.equal(good.calls.length,1);
  assert.equal(good.calls[0].request.headers['Idempotency-Key'],'rpd-purchase-access/'+session.id);
  assert.ok(good.calls[0].request.signal instanceof AbortSignal);
  await good.run(event(session,'checkout.session.async_payment_succeeded'));
  await good.run();
  assert.equal(good.calls.length,1,'duplicate events do not resend');

  for(const status of ['refunded','disputed','revoked']) {
    const f=fixture();f.status=status;
    assert.equal((await f.run()).email,'cancelled');assert.equal(f.calls.length,0);assert.equal(f.status,status);
  }
  const unpaid=fixture();await unpaid.run(event({...session,payment_status:'unpaid'}));assert.equal(unpaid.status,null);assert.equal(unpaid.calls.length,0);
  const unknown=fixture();await unknown.run(event(session,'payment_intent.succeeded'));assert.equal(unknown.status,null);
  const disabled=fixture();assert.equal((await disabled.run(event(),{emailEnabled:false,apiKey:''})).email,'disabled');assert.equal(disabled.status,'paid');assert.equal(disabled.state,null);assert.equal(disabled.calls.length,0);
  const defaultOff=fixture();assert.equal((await processVerifiedEvent(event(),{store:defaultOff.store,apiKey:'fixture-key',fetcher:defaultOff.fetcher})).email,'disabled');assert.equal(defaultOff.status,'paid');assert.equal(defaultOff.calls.length,0);

  const transient=fixture();
  transient.fetcher=async (url,request)=>{transient.calls.push({url,request});throw Error('network contains private echoed details');};
  assert.equal((await transient.run()).retry,true);assert.equal(transient.status,'paid');assert.equal(transient.state,'pending');
  transient.fetcher=fixture().fetcher;
  assert.equal((await transient.run()).email,'sent');assert.equal(transient.status,'paid');
  for(const http of [429,500,503]) {
    const f=fixture();const r=await f.run(event(),{fetcher:async()=>new Response('{}',{status:http})});
    assert.equal(r.retry,true);assert.equal(f.status,'paid');
  }
  const invalid=fixture();assert.equal((await invalid.run(event(),{fetcher:async()=>new Response('{}',{status:200})})).retry,true);
  const timeout=fixture();const timed=await timeout.run(event(),{timeoutMs:10,fetcher:async(url,request)=>new Promise((resolve,reject)=>{const keepAlive=setTimeout(resolve,1000);request.signal.addEventListener('abort',()=>{clearTimeout(keepAlive);reject(Error('aborted'));},{once:true});})});assert.equal(timed.retry,true);assert.equal(timeout.status,'paid');
  const concurrent=fixture();assert.equal((await concurrent.run(event(),{fetcher:async()=>new Response(JSON.stringify({name:'concurrent_idempotent_requests'}),{status:409})})).retry,true);
  for(const http of [400,401,403,422]) {
    const f=fixture();const r=await f.run(event(),{fetcher:async()=>new Response('{"message":"private buyer details"}',{status:http})});
    assert.equal(r.retry,false);assert.equal(f.state,'failed');assert.equal(f.status,'paid');
  }
  const missing=fixture();assert.equal((await missing.run(event(),{apiKey:''})).retry,true);assert.equal(missing.status,'paid');assert.equal(missing.attempts,0);assert.equal(missing.calls.length,0);
  const writeFailure=fixture();writeFailure.finishFailure=true;await assert.rejects(writeFailure.run());assert.equal(writeFailure.status,'paid');
  writeFailure.state='pending';await writeFailure.run();assert.equal(writeFailure.calls.length,2);assert.equal(writeFailure.calls[0].request.body,writeFailure.calls[1].request.body);assert.equal(writeFailure.calls[0].request.headers['Idempotency-Key'],writeFailure.calls[1].request.headers['Idempotency-Key']);
  const enqueueFailure=fixture();enqueueFailure.store.enqueue=async()=>{throw Error('queue unavailable');};await assert.rejects(enqueueFailure.run());assert.equal(enqueueFailure.status,'paid');assert.equal(enqueueFailure.calls.length,0);
  const refund=fixture();await refund.run(event());await refund.run(event({payment_intent:session.payment_intent},'charge.refunded'));await refund.run();assert.equal(refund.status,'refunded');assert.equal(refund.calls.length,1);
  const dispute=fixture();await dispute.run(event({payment_intent:{id:session.payment_intent}},'charge.dispute.created'));await dispute.run();assert.equal(dispute.status,'disputed');assert.equal(dispute.calls.length,0);
  console.log('PASS RPD purchase access email: paid gating, private links, sender/accessibility, duplicate events, timeout/HTTP/config/DB recovery and revocation. No external sends.');
})().catch(error=>{console.error(error);process.exitCode=1;});
