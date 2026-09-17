'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/LATER-EXCLUDED-SITE-RECEIPT-20260917.json'),'utf8'));
assert.equal(receipt.version,'20260917-later-excluded-site');
const updates=new Map(receipt.pages.map(row=>[row.file,{
  file:row.file,
  sourceRevision:row.sourceRevision,
  pullRequest:row.pullRequest,
  afterSha256:row.afterSha256
}]));
function verify(file,html){
  const row=updates.get(file);
  if(!row)return false;
  assert.equal(sha(html),row.afterSha256,file+' exact later approved excluded-page source');
  return true;
}
module.exports={receipt,updates,verify};
