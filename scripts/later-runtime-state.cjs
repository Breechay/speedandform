'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {sha}=require('./share-metadata.cjs');

const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/LATER-RUNTIME-LINEAGE-20260917.json'),'utf8'));
assert.equal(receipt.version,'20260917-later-runtime-lineage');
const artifacts=new Map(receipt.files.map(row=>[row.file,row]));
function verify(file,text){
  const row=artifacts.get(file);
  if(!row)return false;
  assert.equal(sha(text),row.afterSha256,file+' exact later approved runtime source');
  return true;
}
module.exports={receipt,artifacts,verify};
