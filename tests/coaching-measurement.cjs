const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('js/coaching-measurement.js','utf8');
function context(host='speedandform.com',nav={}) {
 const scripts=[]; const sendButton={setAttribute(){}};
 const window={location:{hostname:host},navigator:nav,fetch:async()=>({})};
 const document={head:{appendChild:s=>scripts.push(s)},createElement:()=>({}),getElementById:id=>id==='sendBtn'?sendButton:null,querySelector:()=>null};
 vm.runInNewContext(source,{window,document,FormData});
 return {window,scripts};
}
for(const [host,nav] of [['localhost',{}],['preview.netlify.app',{}],['speedandform.com',{globalPrivacyControl:true}],['speedandform.com',{doNotTrack:'1'}]]) {
 const c=context(host,nav);assert.equal(c.scripts.length,0);assert.equal(c.window.fbq,undefined);assert.equal(c.window.gtag,undefined);
}
const c=context();assert.equal(c.scripts.length,2);
assert.equal(c.scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-HKG3MXM668');
assert.equal(c.scripts[1].src,'https://connect.facebook.net/en_US/fbevents.js');
assert.deepEqual(Array.from(c.window.fbq.queue[2]),['trackSingle','147659485878240','PageView']);
assert.equal(c.window.dataLayer.length,2);assert.equal(c.window.dataLayer[1][0],'config');assert.equal(c.window.dataLayer[1][1],'G-HKG3MXM668');
c.window.formTrackLead();c.window.formTrackLead();assert.equal(c.window.fbq.queue.length,4);
assert.deepEqual(Array.from(c.window.fbq.queue[3]),['trackSingle','147659485878240','Lead']);
assert.equal(c.window.dataLayer.length,3);assert.equal(c.window.dataLayer[2][0],'event');assert.equal(c.window.dataLayer[2][1],'generate_lead');
const html=readFileSync('index.html','utf8');
const send=html.slice(html.indexOf('  function sendToBrice()'),html.indexOf('\n  function fail('));
(async()=>{
 for(const [ok,success,throws,expected] of [[true,true,false,1],[true,'true',false,1],[true,false,false,0],[false,true,false,0],[true,true,true,1]]) {
  let leads=0,done=0,failed=0;
  const ctx={sending:false,$:()=>({getAttribute:()=>'',disabled:false}),payload:()=>({offer:'Run'}),BRICE:'test@example.com',A:{},FormData,Promise,intakeFields:()=>[],pane:()=>done++,fail:()=>failed++,window:{formTrackLead:()=>{leads++;if(throws)throw Error('blocked');}},fetch:async()=>({ok,json:async()=>({success})})};
  vm.runInNewContext(send+'\nsendToBrice();sendToBrice();',ctx);
  await new Promise(r=>setImmediate(r));
  assert.equal(leads,expected);assert.equal(done,expected);assert.equal(failed,expected?0:1);
 }
 console.log('PASS: production/privacy guards, GA4 + Meta page measurement, accepted/rejected relay responses, duplicate click, tracking failure isolation. No intake answers sent to analytics; no network requests sent.');
})();
