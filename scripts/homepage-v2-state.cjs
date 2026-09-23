'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/HOMEPAGE-V2-RECEIPT-20260923.json'),'utf8'));
assert.equal(receipt.version,'20260923-homepage-v2');
const updates=new Map(receipt.pages.map(row=>[row.file,{...row}]));
function verify(file,html){
  const row=updates.get(file);
  if(!row)return false;
  assert.equal(sha(html),row.afterSha256,file+' exact reviewed Homepage v2 source');
  return true;
}
module.exports={receipt,updates,verify};
