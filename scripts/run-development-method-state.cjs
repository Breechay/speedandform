'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./share-metadata.cjs');

const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/RUN-DEVELOPMENT-METHOD-RECEIPT-20260917.json'),'utf8'));
assert.equal(receipt.version,'20260917-run-development-method');
const updates=new Map(receipt.pages.map(row=>[row.file,{
  file:row.file,
  sourceRevision:receipt.testedRevision,
  afterSha256:row.sourceSha256,
  bodySha256:row.bodySha256,
  preview:row.preview
}]));
const artifacts=new Map([
  ...[...updates.values()],
  ...receipt.assets.map(row=>[row.file,{
    file:row.file,
    sourceRevision:receipt.testedRevision,
    afterSha256:row.sourceSha256
  }])
]);
function verify(file,text){
  const row=artifacts.get(file);
  if(!row)return false;
  assert.equal(sha(text),row.afterSha256,file+' exact reviewed Run Development method source');
  return true;
}
module.exports={receipt,updates,artifacts,verify};
