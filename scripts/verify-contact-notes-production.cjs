'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha,ORIGIN}=require('./share-metadata.cjs'),{manifest}=require('./contact-notes-state.cjs');
const ROOT=path.resolve(__dirname,'..');
// Read-only inspection 35223710707 / artifact10498105911 establishes exactly
// this Pretty URLs rewrite. No generic whitespace, DOM or email normalization.
function expectedDelivery(file,source){
  assert.ok(manifest.pages.some(p=>p.file===file),'Known reviewed HTML only');
  const from='href="/privacy.html#website"',to="href='/privacy#website'";
  const count=file==='ask/index.html'?2:1;
  assert.equal(source.split(from).length-1,count,file+' exact privacy-link count');
  return source.split(from).join(to);
}
function verifyHtml(file,actual){
  const row=manifest.pages.find(p=>p.file===file);assert.ok(row,file+' reviewed');
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.equal(sha(source),row.afterSha256,file+' pinned source');
  assert.ok(!/\/cdn-cgi\/l\/email-protection|data-cfemail|email-decode\.min\.js/.test(actual),file+' no email rewriting or injected decoder');
  assert.equal(sha(actual),sha(expectedDelivery(file,source)),file+' exact delivered HTML after known privacy-link rewrite');
  return {sourceSha256:row.afterSha256,deliveredSha256:sha(actual),privacyLinksRewritten:file==='ask/index.html'?2:1};
}
function selfTest(){
  for(const p of manifest.pages){const local=fs.readFileSync(path.join(ROOT,p.file),'utf8'),delivered=expectedDelivery(p.file,local);verifyHtml(p.file,delivered);assert.throws(()=>verifyHtml(p.file,delivered+' '),'Even an extra byte must fail');assert.throws(()=>verifyHtml(p.file,delivered.replace("href='/privacy#website'","href='/privacy#wrong'")),'Do not drop fragments');}
  const ask=expectedDelivery('ask/index.html',fs.readFileSync(path.join(ROOT,'ask/index.html'),'utf8'));
  assert.throws(()=>verifyHtml('ask/index.html',ask.replace('mailto:brice@speedandform.com','/cdn-cgi/l/email-protection#00')));
  const headers=fs.readFileSync(path.join(ROOT,'_headers'),'utf8');assert.match(headers,/\/ask\/\*\n  Referrer-Policy: no-referrer\n  Cache-Control: no-cache, no-store, must-revalidate, no-transform/);
  console.log('PASS: all nine exact delivery fixtures; altered bytes, wrong fragments and obfuscated mail links rejected; Ask-only no-transform header present.');
}
async function main(out){
  const report={commit:process.env.GITHUB_SHA,startedAt:new Date().toISOString(),pages:[],assets:[],attempts:[],hostingRewrite:'Only exact privacy.html#website href conversion from inspection35223710707'};
  fs.mkdirSync(path.dirname(out),{recursive:true});const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  async function request(url){const r=await fetch(new URL(url,ORIGIN),{headers:{'Cache-Control':'no-cache','User-Agent':'FORM-Publishing-Verification/1.0'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,url+' status');assert.equal(new URL(r.url).origin,ORIGIN);return r;}
  try{
    selfTest();let ready=false;
    for(let i=0;i<18;i++){
      try{const r=await request('/ask/');assert.ok((r.headers.get('cache-control')||'').split(',').map(x=>x.trim().toLowerCase()).includes('no-transform'),'Ask response retains no-transform');verifyHtml('ask/index.html',await r.text());ready=true;break;}
      catch(e){report.attempts.push(e.message);save();if(i<17)await new Promise(r=>setTimeout(r,10000));}
    }
    assert.ok(ready,'Current Ask response and no-transform header not published');
    for(const p of manifest.pages){const r=await request(p.file==='404.html'?'/404.html':p.url),h=await r.text(),verified=verifyHtml(p.file,h);report.pages.push({file:p.file,url:r.url,status:r.status,cacheControl:r.headers.get('cache-control'),...verified});save();}
    const privacy=await request('/privacy');assert.match(await privacy.text(),/\bid=["']website["']/,'Rewritten privacy link keeps its actual destination');report.privacyDestination={url:privacy.url,status:privacy.status,fragment:'website'};
    for(const a of [...manifest.assets,{file:'media/track/from-practice/5a3a58977d72/beside-the-track-640.jpg'},{file:'media/track/from-practice/5a3a58977d72/beside-the-track-1440.jpg'}]){const r=await request('/'+a.file),b=Buffer.from(await r.arrayBuffer());assert.equal(sha(b),sha(fs.readFileSync(path.join(ROOT,a.file))),a.file+' exact served asset');if(a.file.endsWith('feed.xml'))assert.ok((r.headers.get('content-type')||'').includes('application/rss+xml'),'RSS content type');report.assets.push({file:a.file,status:r.status,type:r.headers.get('content-type'),sha256:sha(b)});save();}
    report.result='PASS';report.finishedAt=new Date().toISOString();save();console.log(`PASS: ${report.pages.length} live pages, ${report.assets.length} exact publishing assets, feed MIME and plain email routes; no email sent.`);
  }catch(e){report.result='FAIL';report.error=e.stack;save();throw e;}
}
module.exports={expectedDelivery,verifyHtml,selfTest};
if(require.main===module){if(process.argv[2]==='--self-test')selfTest();else main(process.argv[2]||'/tmp/contact-notes-production.json').catch(e=>{console.error(e);process.exitCode=1;});}
