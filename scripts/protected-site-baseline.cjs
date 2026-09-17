'use strict';
// Exact reviewed changes. Never exclude these files from checks.
const assert=require('node:assert/strict'),{sha}=require('./share-metadata.cjs');
const measurementRef='a8a778a0ce30d8eca12f7ac43efcd84583164bec';
const homepageRef='4554f3acb0dd67060b916e662d11a9d115ecc633';
// One scoped /ask/* response policy; tests/ask-header.cjs also proves the exact append.
const askHeaderRef='64234d254d1efb6e5b895141e61070df83c5c512';
function protectedBaseline(file, originalRef) {
  if(file==='js/coaching-measurement.js')return measurementRef;
  if(file==='index.html')return homepageRef;
  if(file==='netlify.toml')return askHeaderRef;
  return originalRef;
}
const updates=new Map([['index.html',{file:'index.html',sourceCommit:homepageRef,
  afterSha256:'47b1dc50cf9e17042a048245a59f3fed2fe871cbc72c34d6366ebf09a2cda004',
  bodySha256:'44f0f9819e3286e44c83bdf960317164259462c6bf4683ec8030a6ee4bc304b8'}]]);
protectedBaseline.updates=updates;
protectedBaseline.verify=(file,text)=>{const row=updates.get(file);if(!row)return false;assert.equal(sha(text),row.afterSha256,file+' exact independently released source');return true;};
module.exports=protectedBaseline;
