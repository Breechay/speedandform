'use strict';
// Explicit later editorial snapshots. Older release receipts retain their original hashes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha}=require('./share-metadata.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/GUIDES-MANIFEST-20260917.json'),'utf8'));
const allowed=['easy-run.html','threshold-training.html','long-run-pace.html','running-form-errors.html','library.html'];
assert.deepEqual(manifest.pages.map(p=>p.file).sort(),allowed.sort(),'Only the four guides and their Library descriptions are approved');
assert.equal(manifest.baseCommit,'adaaa8c48f01303710aa6a53ee9258ecc48b72a8');
const updates=new Map(manifest.pages.map(p=>[p.file,p]));
const subsequent=require('./training-guide-state.cjs');
function verify(file,html){if(subsequent.verify(file,html))return true;const row=updates.get(file);if(!row)return false;assert.equal(sha(html),row.afterSha256,file+' exact Pass 4 editorial source');return true;}
const latestUpdates=new Map([...updates,...subsequent.updates]);
module.exports={manifest,updates,latestUpdates,verify};
