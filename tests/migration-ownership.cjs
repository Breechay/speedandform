'use strict';
// The held allowlist migration is the single authoritative copy; any mirror must be byte-identical; it must not be pending in migrations/.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const NAME='20261101230000_public_plan_preview_allowlist.sql',HELD=path.join(ROOT,'supabase/held',NAME),LIVE=path.join(ROOT,'supabase/migrations',NAME);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(fs.existsSync(HELD),'authoritative held file exists');
assert.ok(!fs.existsSync(LIVE),'not pending in supabase/migrations (db push would apply it)');
const migrations=fs.readdirSync(path.join(ROOT,'supabase/migrations')).map(f=>f.replace(/^\d+_/,'').replace(/\.sql$/,''));
assert.ok(!migrations.includes('public_plan_preview_allowlist'),'no second migration with the same ledger name');
const bytes=fs.readFileSync(HELD),text=bytes.toString('utf8');
assert.ok(text.includes('AUTHORITATIVE COPY: speedandform repo'),'header names the authoritative repo');
assert.ok(/form\.expected_preview_md5/.test(text)&&/reviewed function-definition hash/.test(text),'reviewed hash is required');
assert.ok(/ledger already records public_plan_preview_allowlist/.test(text),'ledger duplicate guard present');
assert.ok(/^begin;/m.test(text)&&/^commit;/m.test(text),'single transaction');
const readme=fs.readFileSync(path.join(ROOT,'supabase/held/README.md'),'utf8');
assert.ok(readme.includes(sha(bytes)),'held README records the current sha256');
if(process.env.FORM_IOS_DIR){
 const mirror=path.join(process.env.FORM_IOS_DIR,'supabase/mirrors/speedandform',NAME);
 assert.ok(fs.existsSync(mirror),'FORM-iOS mirror exists');
 assert.equal(sha(fs.readFileSync(mirror)),sha(bytes),'FORM-iOS mirror is byte-identical to the authoritative copy');
}
console.log(JSON.stringify({result:'passed',sha256:sha(bytes),mirror_checked:!!process.env.FORM_IOS_DIR}));
