'use strict';
// The bounded later product snapshot. Historical releases remain in Git and their receipts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha}=require('./share-metadata.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/SCULPT-LANDING-MANIFEST-20260917.json'),'utf8'));
assert.equal(manifest.baseCommit,'7eb2106a4ab2ef29fa26b98bbc062dfed900c192');
assert.deepEqual(manifest.pages.map(p=>p.file),['forge-sculpt/index.html']);
const updates=new Map(manifest.pages.map(p=>[p.file,p]));
function verify(file,html){const row=updates.get(file);if(!row)return false;assert.equal(sha(html),row.afterSha256,file+' exact Pass 5B source');return true;}
module.exports={manifest,updates,verify};
