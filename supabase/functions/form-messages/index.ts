import { createClient } from 'jsr:@supabase/supabase-js@2';

// Coach-only dispatcher of already-authored private FORM Miami notices. The
// browser cannot choose recipients or email content: those come from the DB.
const FROM = 'FORM <access@send.speedandform.com>';
const REPLY = 'support@speedandform.com';
const ORIGIN = 'https://speedandform.com';
const headers = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'Access-Control-Allow-Origin':ORIGIN,
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
};
const json = (data:unknown, status=200)=>new Response(JSON.stringify(data),{status,headers});
const escape = (v:string)=>v.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

function emailBody(title:string,body:string,href:string){
  // Whitelisted destinations only; the source controls href and no user can
  // insert a javascript: or external credential-collection link.
  const safeHref = href === '/runs/' ? '/runs/' : '/athlete/';
  const url=ORIGIN+safeHref;
  return {
    subject:`FORM · ${title}`,
    text:`${title}\n\n${body}\n\nOpen FORM: ${url}\n\nThis is an update to your training. To turn off email updates, open My training.\n\nSpeed & Form`,
    html:`<!doctype html><html><body style="margin:0;padding:32px 20px;background:#f4f2ec;color:#171a19;font-family:Arial,sans-serif;"><div style="max-width:540px;margin:auto;"><p style="font-weight:700;font-size:14px;letter-spacing:2px;">FORM</p><h1 style="font-size:32px;font-weight:500;letter-spacing:-1px;">${escape(title)}</h1><p style="font-size:17px;line-height:1.6;">${escape(body)}</p><p style="margin:32px 0;"><a href="${url}" style="display:inline-block;padding:14px 22px;background:#111c21;color:white;text-decoration:none;">Open FORM</a></p><p style="font-size:12px;color:#666;line-height:1.5;">Private training update. You can turn off email updates in My training.<br>Need help? ${REPLY}</p></div></body></html>`,
  };
}

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({code:'method_not_allowed'},405);
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey=Deno.env.get('SUPABASE_ANON_KEY'),resend=Deno.env.get('NEWSLETTER_RESEND_API_KEY')||Deno.env.get('RESEND_API_KEY');
  if(!url||!service||!publicKey||!resend)return json({code:'delivery_not_configured'},503);
  const bearer=req.headers.get('Authorization')||'';
  const token=bearer.startsWith('Bearer ')?bearer.slice(7):'';
  if(!token)return json({code:'unauthorized'},401);
  const caller=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await caller.auth.getUser(token);
  if(userError||!userData.user)return json({code:'unauthorized'},401);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:member,error:membershipError}=await admin.from('athlete_memberships')
    .select('athlete_id').eq('user_id',userData.user.id).eq('role','coach').eq('status','active').limit(1);
  if(membershipError||!member?.length)return json({code:'coach_only'},403);
  await admin.rpc('form_miami_email_cleanup');
  const {data:outbox,error:claimError}=await admin.rpc('form_miami_email_claim',{p_limit:20});
  if(claimError)return json({code:'delivery_queue_error'},503);
  let sent=0,failed=0;
  for(const row of outbox||[]){
    const rendered=emailBody(row.title,row.body,row.href);
    try{
      const result=await fetch('https://api.resend.com/emails',{
        method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json','Idempotency-Key':`form-miami-${row.id}`},
        body:JSON.stringify({from:FROM,to:[row.email],reply_to:REPLY,...rendered}),
      });
      const response=await result.json().catch(()=>({}));
      if(result.ok){
        sent++;
        await admin.rpc('form_miami_email_finish',{p_id:row.id,p_success:true,p_provider_id:response?.id||null,p_error:null});
      }else{
        failed++;
        await admin.rpc('form_miami_email_finish',{p_id:row.id,p_success:false,p_provider_id:null,p_error:`Resend ${result.status}`});
      }
    }catch{
      failed++;
      await admin.rpc('form_miami_email_finish',{p_id:row.id,p_success:false,p_provider_id:null,p_error:'Network delivery unavailable'});
    }
  }
  return json({processed:(outbox||[]).length,sent,failed});
});
