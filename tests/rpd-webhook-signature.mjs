// Uses the pinned SDK in an isolated QA folder. No Stripe API requests.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {default:Stripe} = await import(process.env.SF_STRIPE_PATH ? pathToFileURL(process.env.SF_STRIPE_PATH).href : 'stripe');
const stripe = new Stripe('sk_test_signature_verification_only',{httpClient:Stripe.createFetchHttpClient()});
const payload = JSON.stringify({id:'evt_signature_fixture',type:'checkout.session.completed',data:{object:{id:'cs_test_signature_fixture',payment_status:'paid'}}});
const secret = 'whsec_local_signature_fixture';
const header = stripe.webhooks.generateTestHeaderString({payload,secret});
const verify = (body,signature=header,key=secret) => stripe.webhooks.constructEventAsync(body,signature,key,undefined,Stripe.createSubtleCryptoProvider());
assert.equal((await verify(payload)).id,'evt_signature_fixture');
await assert.rejects(verify(payload+' '));
await assert.rejects(verify(payload,header,'whsec_wrong_fixture'));
const stale = stripe.webhooks.generateTestHeaderString({payload,secret,timestamp:Math.floor(Date.now()/1000)-600});
await assert.rejects(verify(payload,stale));
console.log('PASS pinned Stripe SDK raw signature: valid accepted; changed payload, wrong secret and stale timestamp rejected. No API calls.');
