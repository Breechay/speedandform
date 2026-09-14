const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('js/coaching-measurement.js','utf8');
function context(host='speedandform.com',nav={}) {
 const scripts=[]; const window={location:{hostname:host},navigator:nav};
 vm.runInNewContext(source,{window,document:{head:{appendChild:s=>scripts.push(s)},createElement:()=>({})}});
 return {window,scripts};
}
for(const [host,nav] of [['localhost',{}],['preview.netlify.app',{}],['speedandform.com',{globalPrivacyControl:true}],['speedandform.com',{doNotTrack:'1'}]]) {
 const c=context(host,nav);assert.equal(c.scripts.length,0);assert.equal(c.window.fbq,undefined);
}
const c=context();assert.equal(c.scripts.length,1);
assert.deepEqual(Array.from(c.window.fbq.queue[2]),['trackSingle','147659485878240','PageView']);
c.window.formTrackLead();c.window.formTrackLead();assert.equal(c.window.fbq.queue.length,4);
assert.deepEqual(Array.from(c.window.fbq.queue[3]),['trackSingle','147659485878240','Lead']);
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
 console.log('PASS: production guard, privacy signals, single event without answers, accepted/rejected relay responses, duplicate click, tracking failure isolation. No network requests sent.');
})();
