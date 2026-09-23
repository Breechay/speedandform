'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/MIAMI-SHARE-CARD-RECEIPT-20260923.json'),'utf8'));
assert.equal(receipt.version,'20260923-miami-share-card');
const updates=new Map(receipt.pages.map(row=>[row.file,{...row}]));
function verify(file,html){
  const row=updates.get(file); if(!row)return false;
  assert.equal(s.sha(html.slice(html.toLowerCase().indexOf('</head>'))),row.bodySha256,file+' Miami body unchanged');
  assert.equal(s.meta(html,'og:image'),row.image,file+' Miami OG image');
  assert.equal(s.meta(html,'twitter:image'),row.image,file+' Miami Twitter image');
  assert.equal(s.meta(html,'og:title'),row.preview.title,file+' Miami preview title');
  assert.equal(s.meta(html,'twitter:title'),row.preview.title,file+' Miami Twitter title');
  assert.equal(s.meta(html,'twitter:description'),row.preview.description,file+' Miami preview description');
  assert.equal(s.meta(html,'og:image:alt'),row.alt,file+' Miami image alt');
  return true;
}
module.exports={receipt,updates,verify};
