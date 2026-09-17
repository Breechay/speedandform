'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/RPD-STORY-SHARE-RECEIPT-20260917.json'),'utf8'));
assert.equal(receipt.version,'20260917-rpd-story-share');
assert.equal(receipt.pullRequest,137);
const updates=new Map(receipt.pages.map(row=>[row.file,{
  file:row.file,
  sourceRevision:receipt.sourceRevision,
  afterSha256:row.sourceSha256,
  bodySha256:row.bodySha256,
  preview:row.preview,
  allowShareTransformRewrite:true
}]));
function verify(file,html){
  const row=updates.get(file);
  if(!row)return false;
  assert.equal(sha(html),row.afterSha256,file+' exact reviewed RPD story source');
  return true;
}
module.exports={receipt,updates,verify};
