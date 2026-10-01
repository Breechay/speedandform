'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),s=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/OUTSIDE-IN-SOURCE-20261001.json'),'utf8'));
const updates=new Map(receipt.pages.map(row=>[row.file,{...row}]));
function verify(file,html){const row=updates.get(file);if(!row)return false;assert.equal(s.sha(html),row.afterSha256,file+' reviewed outside-in source');return true;}
module.exports={receipt,updates,verify};
