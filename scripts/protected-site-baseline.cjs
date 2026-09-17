'use strict';
// Exact reviewed changes. Never exclude these files from checks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{sha}=require('./share-metadata.cjs');
const measurementRef='a8a778a0ce30d8eca12f7ac43efcd84583164bec';
const priorHomepageReceipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/HOME-DOCTRINE-RECEIPT-20260917.json'),'utf8'));
assert.equal(priorHomepageReceipt.version,'20260917-home-doctrine','Keep the earlier homepage doctrine receipt immutable');
const methodReceipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/RUN-DEVELOPMENT-METHOD-RECEIPT-20260917.json'),'utf8'));
assert.equal(methodReceipt.version,'20260917-run-development-method','Expected current Run Development method receipt');
const homepageReceipt=methodReceipt.pages.find(row=>row.file==='index.html');
assert.ok(homepageReceipt,'Run Development method receipt must include index.html');
const homepageRef=methodReceipt.testedRevision;
// One scoped /ask/* response policy; tests/ask-header.cjs also proves the exact append.
const askHeaderRef='64234d254d1efb6e5b895141e61070df83c5c512';
function protectedBaseline(file, originalRef) {
  if(file==='js/coaching-measurement.js')return measurementRef;
  if(file==='index.html')return homepageRef;
  if(file==='netlify.toml')return askHeaderRef;
  return originalRef;
}
const updates=new Map([['index.html',{
  file:'index.html',
  sourceCommit:homepageRef,
  afterSha256:homepageReceipt.sourceSha256,
  bodySha256:homepageReceipt.bodySha256,
  preview:homepageReceipt.preview
}]]);
protectedBaseline.updates=updates;
protectedBaseline.verify=(file,text)=>{const row=updates.get(file);if(!row)return false;assert.equal(sha(text),row.afterSha256,file+' exact independently released source');return true;};
module.exports=protectedBaseline;
