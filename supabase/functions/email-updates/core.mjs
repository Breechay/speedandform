import { confirmationEmail, CONSENT_VERSION, ORIGIN } from './email.mjs';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class Failure extends Error { constructor(status, code) { super(code); this.status=status; } }
export function normalizeEmail(value) {
  if(typeof value!=='string') throw new Failure(400,'invalid_email');
  const email=value.trim().toLowerCase();
  if(email.length>254||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)||email.startsWith('.')||email.split('@')[0].endsWith('.')||email.includes('..')||email.split('@')[0].length>64) throw new Failure(400,'invalid_email');
  return email;
}
const base64 = bytes => btoa(String.fromCharCode(...bytes));
export const newToken = () => base64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function hash(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join(''); }
async function boundedBody(req, limit=8192) {
  if(Number(req.headers.get('content-length'))>limit) throw new Failure(413,'body_too_large');
  const reader=req.body?.getReader();if(!reader)return '';
  let length=0,chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new Failure(413,'body_too_large');}chunks.push(value);}
  const b=new Uint8Array(length);let at=0;for(const c of chunks){b.set(c,at);at+=c.length;}return new TextDecoder('utf-8',{fatal:true}).decode(b);
}
export async function verifyWebhook(raw, headers, secret, now=Date.now()) {
  try {
    const id=headers.get('svix-id'),ts=headers.get('svix-timestamp');
    if(!id||id.length>128||!/^\d{10,11}$/.test(ts||'')||Math.abs(now/1000-Number(ts))>300||!secret?.startsWith('whsec_'))return false;
    const key=await crypto.subtle.importKey('raw',Uint8Array.from(atob(secret.slice(6)),c=>c.charCodeAt(0)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const bytes=new TextEncoder().encode(`${id}.${ts}.${raw}`);
    for(const part of (headers.get('svix-signature')||'').split(' ').slice(0,8)){
      const [version,sig]=part.split(',');if(version!=='v1'||!sig)continue;
      if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(sig),c=>c.charCodeAt(0)),bytes))return true;
    }
  } catch { /* Invalid signatures are not diagnostic payloads. */ }
  return false;
}
export function createHandler({env={},fetch:fetcher=fetch,now=()=>Date.now(),rpc:rpcOverride}={}) {
  const endpoint=(env.SUPABASE_URL||'').replace(/\/$/,'')+'/functions/v1/email-updates';
  const mode=env.NEWSLETTER_MODE||'disabled';
  const enabled=['test','live'].includes(mode)&&env.NEWSLETTER_ADDRESS_APPROVED==='true'&&String(env.NEWSLETTER_POSTAL_ADDRESS||'').trim().length>=12&&env.NEWSLETTER_RESEND_API_KEY&&env.NEWSLETTER_TURNSTILE_SECRET&&env.NEWSLETTER_TURNSTILE_SITE_KEY&&env.NEWSLETTER_WEBHOOK_SECRET;
  // Test-only Cloudflare keys must never silently become production anti-abuse settings.
  const ready=!!enabled&&(mode!=='live'|| !/^[123]x0{10}/.test(env.NEWSLETTER_TURNSTILE_SECRET));
  async function rpc(name,args) {
    if(rpcOverride)return rpcOverride(name,args);
    const key=env.SUPABASE_SERVICE_ROLE_KEY;
    if(!key||!env.SUPABASE_URL)throw new Failure(503,'unavailable');
    let res;try{res=await fetcher(env.SUPABASE_URL+'/rest/v1/rpc/newsletter_'+name,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});}catch{throw new Failure(503,'unavailable');}
    if(!res.ok)throw new Failure(503,'unavailable');return res.json();
  }
  async function checkChallenge(proof) {
    if(typeof proof!=='string'||!proof||proof.length>2048)throw new Failure(400,'verification_required');
    let r;try{r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.NEWSLETTER_TURNSTILE_SECRET,response:proof}),signal:AbortSignal.timeout(10000)});}catch{throw new Failure(503,'verification_unavailable');}
    if(!r.ok)throw new Failure(503,'verification_unavailable');
    const v=await r.json();if(v.success!==true||v.hostname!=='speedandform.com'||v.action!=='newsletter_signup')throw new Failure(400,'verification_required');
  }
  async function send(job) {
    if(job.state==='accepted')return;
    if(!job.payload||!UUID.test(job.id))throw new Failure(503,'unavailable');
    // The stored payload, request ID and token stay identical on a transport retry.
    let accepted=null;
    for(let attempt=0;attempt<2;attempt++){
      try {
        const r=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.NEWSLETTER_RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`form-updates-${job.id}`},body:JSON.stringify(job.payload),signal:AbortSignal.timeout(10000)});
        if(r.ok){const v=await r.json();if(UUID.test(v.id||'')){accepted=v.id;break;}}
        if(r.status>=400&&r.status<500&&r.status!==429)break;
      } catch { /* A timeout is not proof the provider rejected the message. */ }
    }
    if(!accepted){await rpc('finish',{p_id:job.id,p_provider:null,p_ok:false});throw new Failure(503,'email_unavailable');}
    await rpc('finish',{p_id:job.id,p_provider:accepted,p_ok:true});
  }
  return async req => {
    const origin=req.headers.get('origin');
    const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, no-transform','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin'};
    if(origin===ORIGIN)h['Access-Control-Allow-Origin']=ORIGIN;
    const response=(status,data)=>new Response(JSON.stringify(data),{status,headers:h});
    try {
      const url=new URL(req.url),action=url.pathname.split('/').filter(Boolean).at(-1);
      if(req.method==='OPTIONS'){
        if(origin!==ORIGIN)return response(403,{code:'forbidden'});
        return new Response(null,{status:204,headers:{...h,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
      }
      if(req.method==='GET'&&action==='status'){
        if(!ready||mode!=='live')return response(200,{ready:false});
        const db=await rpc('health',{});return response(200,{ready:db.version===1,siteKey:env.NEWSLETTER_TURNSTILE_SITE_KEY});
      }
      if(req.method!=='POST')return response(405,{code:'method_not_allowed'});
      if(action==='webhook'){
        const raw=await boundedBody(req,65536);
        if(!await verifyWebhook(raw,req.headers,env.NEWSLETTER_WEBHOOK_SECRET,now()))return response(401,{code:'invalid_signature'});
        let event;try{event=JSON.parse(raw);}catch{throw new Failure(400,'invalid_request');}
        const allowed=['email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed','email.suppressed'];
        if(!allowed.includes(event.type))return response(200,{received:true});
        const tags=event.data?.tags;
        const tag=name=>Array.isArray(tags)?tags.find(t=>t.name===name)?.value:tags?.[name];
        if(tag('stream')!=='form_updates')return response(200,{received:true});
        if(!UUID.test(event.data?.email_id||'')||!UUID.test(tag('request_id')||''))throw new Failure(400,'invalid_request');
        await rpc('event',{p_event:req.headers.get('svix-id'),p_request:tag('request_id'),p_provider:event.data.email_id,p_type:event.type});
        return response(200,{received:true});
      }
      // RFC 8058 POST is token-authorized, not CORS-authorized or session-authorized.
      const oneClick=action==='unsubscribe'&&req.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded');
      let data;
      if(oneClick){const raw=await boundedBody(req);if(raw!=='List-Unsubscribe=One-Click')throw new Failure(400,'invalid_request');data={token:url.searchParams.get('token')};}
      else {
        if(origin!==ORIGIN)throw new Failure(403,'forbidden');
        if(!req.headers.get('content-type')?.startsWith('application/json'))throw new Failure(415,'invalid_request');
        try{data=JSON.parse(await boundedBody(req));}catch(e){if(e instanceof Failure)throw e;throw new Failure(400,'invalid_request');}
      }
      if(!data||typeof data!=='object'||Array.isArray(data))throw new Failure(400,'invalid_request');
      if(action==='unsubscribe'||action==='confirm'){
        if(!TOKEN.test(data.token||'')||Object.keys(data).some(k=>k!=='token'))throw new Failure(400,'invalid_link');
        if(action==='confirm'&&!ready)throw new Failure(503,'unavailable');
        const r=await rpc(action,{p_hash:await hash(data.token)});
        if(!r.ok)throw new Failure(410,'invalid_link');
        return response(200,{state:action==='confirm'?'subscribed':'unsubscribed'});
      }
      if(action!=='subscribe')throw new Failure(404,'not_found');
      if(!ready)throw new Failure(503,'unavailable');
      if(Object.keys(data).some(k=>!['email','consent','version','requestId','proof','website'].includes(k)))throw new Failure(400,'invalid_request');
      if(data.consent!==true||data.version!==CONSENT_VERSION)throw new Failure(400,'consent_required');
      const email=normalizeEmail(data.email);
      if(!UUID.test(data.requestId||''))throw new Failure(400,'invalid_request');
      if(data.website)return response(202,{state:'received'});
      if(mode==='test'&&!/^[a-z0-9+._-]+@resend\.dev$/.test(email))throw new Failure(503,'unavailable');
      await checkChallenge(data.proof);
      const token=newToken(),optout=newToken();
      const payload=confirmationEmail({email,token,optout,postalAddress:env.NEWSLETTER_POSTAL_ADDRESS,requestId:data.requestId,endpoint});
      const job=await rpc('request',{p_id:data.requestId,p_email:email,p_confirm:await hash(token),p_optout:await hash(optout),p_payload:payload,p_version:CONSENT_VERSION});
      if(job.code==='rate_limited')throw new Failure(429,'rate_limited');
      if(job.code==='conflict')throw new Failure(409,'invalid_request');
      if(job.code==='busy')throw new Failure(503,'email_unavailable');
      if(job.code==='send')await send(job);
      // Same response for active, suppressed and newly requested addresses.
      return response(202,{state:'received'});
    } catch(e) { return response(e instanceof Failure?e.status:503,{code:e instanceof Failure?e.message:'unavailable'}); }
  };
}
