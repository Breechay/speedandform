'use strict';
const contact=require('./contact-notes-state.cjs');
// Exact later snapshots; no replacement of the historical Pass 4A receipt.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha}=require('./share-metadata.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/TRAINING-GUIDES-MANIFEST-20260917.json'),'utf8'));
const allowed=['training-week.html','strength.html','recovery.html','fueling.html','library.html'];
assert.deepEqual(manifest.pages.map(p=>p.file).sort(),allowed.sort());
assert.equal(manifest.baseCommit,'c1cf76da68a64e6b06e2f4fcd008f6c288b811c2');
const updates=new Map(manifest.pages.map(p=>[p.file,p]));
function verify(file,html){if(contact.verify(file,html))return true;const row=updates.get(file);if(!row)return false;assert.equal(sha(html),row.afterSha256,file+' exact Pass 4B source');return true;}
module.exports={manifest,updates,verify};
