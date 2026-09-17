'use strict';
const polish=require('../scripts/app-preview-polish.cjs');
const current=require('../scripts/current-release-state.cjs');
// The repair must change one scoped response policy, not any public page or asset.
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const base='4ee97b910d6f2e7498b3ebb748fe4bce4310bdb4';
const before=cp.execFileSync('git',['show',base+':netlify.toml'],{encoding:'utf8'});
const addition='\n# Ask owns a plain email route even when JavaScript is unavailable.\n# Repeat the scoped policy here: the global TOML header overrides _headers.\n[[headers]]\n  for = "/ask/*"\n  [headers.values]\n    Cache-Control = "no-cache, no-store, must-revalidate, no-transform"\n    Referrer-Policy = "no-referrer"\n';
assert.equal(fs.readFileSync('netlify.toml','utf8'),before+addition,'Only the exact Ask policy is appended');
const paths=cp.execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n');
let checked=0;
for(const f of paths.filter(f=>f.endsWith('.html')||f.startsWith('css/')||f.startsWith('js/')||['_headers','_redirects','robots.txt','sitemap.xml','search-index.json'].includes(f))){
 if(current.verify(f,fs.readFileSync(f)))continue;
 const original=cp.execFileSync('git',['show',base+':'+f],{maxBuffer:30_000_000});
 assert.deepEqual(fs.readFileSync(f),original,f+' remains byte-for-byte unchanged');checked++;
}
require('../scripts/verify-contact-notes-production.cjs').selfTest();
console.log('PASS: one exact Ask-only header addition; '+checked+' HTML/style/script/routing sources unchanged; delivery fixtures reject obfuscation, wrong fragments and extra bytes.');
