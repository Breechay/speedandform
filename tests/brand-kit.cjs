/* The brand page is the public form of docs/BRAND.md. Protect its links, its single generated bend and its plain voice. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),bend=require('../scripts/sf-bend.cjs');
const html=fs.readFileSync(path.join(root,'brand/index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/brand.css'),'utf8');
const local=[...html.matchAll(/(?:href|src)="(\/[^"#?]+)/g)].map(m=>m[1]).filter(u=>/^\/(assets|css|js)\//.test(u));
assert.ok(local.length>40,'the page links its files');
for(const u of new Set(local))assert.ok(fs.existsSync(path.join(root,u)),'missing file: '+u);
for(const u of css.matchAll(/url\("(\/[^")]+)"\)/g))assert.ok(fs.existsSync(path.join(root,u[1])),'missing stylesheet asset: '+u[1]);
assert.equal(html.split(bend.renderBend()).length,2,'exactly one bend, generated, not hand-edited');
assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,'one headline');
const copy=html.replace(/<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>|<[^>]+>/g,' ');
assert.ok(!/[\u2014\u2013]/.test(copy),'plain punctuation: no dashes for drama');
assert.ok(!/!/.test(copy.replace(/<!--[\s\S]*?-->/g,'')),'no exclamation points');
assert.ok(!/\bwe believe\b/i.test(copy.replace(/Never\s+.we believe.|We believe in a holistic approach to performance\./g,'')),'first person, not corporate');
for(const f of ['emblem/sf-emblem-bone.svg','emblem/sf-emblem-ink.svg','bend/the-bend-bone.svg','bend/the-bend-ink.svg','tokens/tokens.css','tokens/tokens.json','templates/story-9x16.html','templates/invite-4x5.html','templates/pdf-cover-letter.html','templates/email-header.html','README.txt'])assert.ok(fs.existsSync(path.join(root,'assets/brand/kit',f)),'kit file: '+f);
// Text assets must match their generator: rebuild and confirm nothing changes.
const snap=f=>fs.readFileSync(path.join(root,f),'utf8'),watch=['assets/brand/kit/bend/the-bend-bone.svg','assets/brand/kit/templates/story-9x16.html','assets/brand/kit/tokens/tokens.css','brand/index.html'],before=watch.map(snap);
execFileSync('node',[path.join(root,'scripts/build-brand-kit.cjs')],{stdio:'ignore'});
watch.forEach((f,i)=>assert.equal(snap(f),before[i],'generated file is stale: '+f));
for(const t of ['story-9x16','invite-4x5','pdf-cover-letter'])assert.ok(!/A[\d. ]+ 0 0 1 /.test(snap('assets/brand/kit/templates/'+t+'.html')),'the bend is never mirrored');
console.log('PASS: brand page links resolve, one generated bend, plain voice, and kit text assets match their generator.');
