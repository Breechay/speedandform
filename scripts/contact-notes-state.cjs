'use strict';
// Exact later snapshots, not exclusions from earlier release protections.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sha}=require('./share-metadata.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/CONTACT-NOTES-MANIFEST-20260917.json'),'utf8'));
assert.equal(manifest.baseCommit,'780f409ed521f3c6290c19e0d80279331bf4eecc');
const updates=new Map(manifest.pages.map(p=>[p.file,p]));
const artifacts=new Map([...manifest.pages,...manifest.assets,...manifest.integration].map(p=>[p.file,p]));
function verify(file,text){const row=artifacts.get(file);if(!row)return false;assert.equal(sha(text),row.afterSha256,file+' exact Pass 6A source');return true;}
module.exports={manifest,updates,artifacts,verify};
