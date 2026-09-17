'use strict';
const {Pool}=require('pg'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const connection=process.env.NEWSLETTER_TEST_DATABASE_URL;
if(!connection||!['127.0.0.1','localhost'].includes(new URL(connection).hostname))throw Error('Only a disposable local test database is allowed.');
const pool=new Pool({connectionString:connection,max:25});
const args={health:[],request:['p_id','p_email','p_confirm','p_optout','p_payload','p_version'],finish:['p_id','p_provider','p_ok'],confirm:['p_hash'],unsubscribe:['p_hash'],event:['p_event','p_request','p_provider','p_type'],cleanup:[]};
async function rpc(name,data){if(!args[name])throw Error('Unknown test operation');const values=args[name].map(k=>data[k]);return (await pool.query(`select public.newsletter_${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) as value`,values)).rows[0].value;}
async function reset(){await pool.query('truncate newsletter_private.subscribers,newsletter_private.outbox,newsletter_private.optouts,newsletter_private.events,newsletter_private.quotas cascade');}
async function initialize(){await pool.query(`do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if; end $$;`);await pool.query('drop schema if exists newsletter_private cascade');const old=await pool.query("select proname,oid::regprocedure::text signature from pg_proc where pronamespace='public'::regnamespace and proname like 'newsletter_%'");for(const r of old.rows)await pool.query('drop function '+r.signature);await pool.query(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20260917181000_email_updates.sql'),'utf8'));}
const env={SUPABASE_URL:'https://pbgsjjegycacodiltbhn.supabase.co',NEWSLETTER_MODE:'live',NEWSLETTER_ADDRESS_APPROVED:'true',NEWSLETTER_POSTAL_ADDRESS:'EXAMPLE ADDRESS · TEST FIXTURE ONLY',NEWSLETTER_RESEND_API_KEY:'test_only_not_a_credential',NEWSLETTER_TURNSTILE_SECRET:'test_only_not_a_credential',NEWSLETTER_TURNSTILE_SITE_KEY:'test_only_not_a_credential',NEWSLETTER_WEBHOOK_SECRET:'whsec_'+Buffer.alloc(32,7).toString('base64')};
function provider(){const requests=[],receipts=new Map();let fail=false,wrongChallenge=false;
 return {requests,setFail(v){fail=v;},setWrongChallenge(v){wrongChallenge=v;},async fetch(url,opts){
  if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify')return Response.json({success:true,hostname:wrongChallenge?'evil.example':'speedandform.com',action:'newsletter_signup'});
  if(url!=='https://api.resend.com/emails')throw Error('Unexpected external destination');
  const key=opts.headers['Idempotency-Key'],payload=JSON.parse(opts.body);requests.push({key,payload});if(fail)return Response.json({error:'unavailable'},{status:502});
  const prior=receipts.get(key);if(prior&&JSON.stringify(prior.payload)!==opts.body)return Response.json({error:'idempotency_conflict'},{status:409});
  const id=prior?.id||crypto.randomUUID();receipts.set(key,{id,payload});return Response.json({id});
 }};
}
module.exports={pool,rpc,reset,initialize,env,provider};
