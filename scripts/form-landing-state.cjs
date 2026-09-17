'use strict';
// One explicitly reviewed product-page snapshot; historical receipts stay immutable.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha}=require('./share-metadata.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/FORM-LANDING-MANIFEST-20260917.json'),'utf8'));
assert.equal(manifest.baseCommit,'6827f20cd2b416578abca14cb08561dbb3423dc4');
assert.deepEqual(manifest.pages.map(p=>p.file),['form/index.html']);
const updates=new Map(manifest.pages.map(p=>[p.file,p]));
function verify(file,html){const p=updates.get(file);if(!p)return false;assert.equal(sha(html),p.afterSha256,file+' exact Pass 5A source');return true;}
module.exports={manifest,updates,verify};
