'use strict';
// Owner-requested visual correction, September 17. Exact transformations only.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),BASE='b97bee0690b6bec505a8b082745b668d2161c9cb';
const {sha}=require('./share-metadata.cjs');
const edits=new Map([
 ['forge-sculpt/index.html',[[ '<p class="bs-poster-label">Sculpt · The Frame</p>', '' ]]],
 ['css/sculpt-landing.css',[
  ['.bs-poster-label{font:400 10px/1.5 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--paper-muted);margin-top:14px}', ''],
  ['font:400 245px/.95 Georgia,serif;letter-spacing:-.09em;', 'font:500 245px/.95 var(--sans);letter-spacing:-.075em;font-variant-numeric:lining-nums tabular-nums;']
 ]],
 ['css/form-landing.css',[
  ['.fl-mark span,.fl-athlete span{color:var(--fl-lime)}', '.fl-mark span,.fl-athlete span{display:inline-block;width:.18em;height:.18em;margin-left:.035em;line-height:0;letter-spacing:0;border-radius:50%;background:var(--fl-lime);color:transparent;vertical-align:baseline}'],
  ['/* FORM public product room.', '@media(forced-colors:active){.fl-mark span,.fl-athlete span{background:CanvasText!important;forced-color-adjust:none}}\n/* FORM public product room.']
 ]]
]);
function transform(file,source){for(const [from,to] of edits.get(file)||[]){assert.equal(source.split(from).length-1,1,file+' unambiguous edit');source=source.replace(from,to);}return source;}
function original(file){return cp.execFileSync('git',['show',BASE+':'+file],{cwd:ROOT,encoding:'utf8',maxBuffer:30_000_000});}
function verify(file,content){if(!edits.has(file))return false;assert.equal(String(content),transform(file,original(file)),file+' exact requested visual correction');return true;}
function apply(){
 for(const [file] of edits){const source=original(file),after=transform(file,source),p=path.join(ROOT,file),current=fs.readFileSync(p,'utf8');assert.ok(current===source||current===after,file+' unexpected concurrent edit');fs.writeFileSync(p,after);}
 // Advance existing exact snapshots only; never regenerate scientific, product or commercial claims.
 for(const file of ['FORM-LANDING-MANIFEST-20260917.json','SCULPT-LANDING-MANIFEST-20260917.json']){
  const p=path.join(ROOT,'docs/audits',file),m=JSON.parse(fs.readFileSync(p,'utf8'));
  for(const row of m.pages){if(!edits.has(row.file))continue;const h=fs.readFileSync(path.join(ROOT,row.file),'utf8');row.afterSha256=sha(h);row.bodySha256=sha(h.slice(h.toLowerCase().indexOf('</head>')));}
  for(const a of m.assets){if(edits.has(a.file))a.sha256=sha(fs.readFileSync(path.join(ROOT,a.file)));}
  fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
 }
 // An older protection must recognize an exact later revision, not accept arbitrary new bytes.
 function patch(file,from,to){const p=path.join(ROOT,file),s=fs.readFileSync(p,'utf8');if(s.includes(to))return;assert.equal(s.split(from).length-1,1,file+' unique guard');fs.writeFileSync(p,s.replace(from,to));}
 for(const f of ['tests/sculpt-landing.cjs','tests/contact-notes.cjs','tests/ask-header.cjs'])patch(f,"'use strict';\n","'use strict';\nconst polish=require('../scripts/app-preview-polish.cjs');\n");
 patch('tests/sculpt-landing.cjs',"if(!contact.verify(f,read(f)))assert.equal", "if(!polish.verify(f,read(f))&&!contact.verify(f,read(f)))assert.equal");
 patch('tests/contact-notes.cjs',"{assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected HTML');preserved++;}","{if(!polish.verify(f,read(f))){assert.equal(s.sha(read(f)),s.sha(old(f)),f+' protected HTML');preserved++;}}");
 patch('tests/contact-notes.cjs',")assert.equal(s.sha(read(f)),s.sha(old(f)),f+' not changed by publishing');", ")if(!polish.verify(f,read(f)))assert.equal(s.sha(read(f)),s.sha(old(f)),f+' not changed by publishing');");
 patch('tests/ask-header.cjs'," const original=cp.execFileSync", " if(polish.verify(f,fs.readFileSync(f)))continue;\n const original=cp.execFileSync");
 cp.execFileSync(process.execPath,['scripts/build-discovery.cjs'],{cwd:ROOT,stdio:'inherit'});
 // Only the discovery manifest integration checksum changes in the contact receipt.
 const p=path.join(ROOT,'docs/audits/CONTACT-NOTES-MANIFEST-20260917.json'),m=JSON.parse(fs.readFileSync(p,'utf8'));
 const row=m.integration.find(x=>x.file==='docs/audits/DISCOVERY-MANIFEST-20260916.json');assert.ok(row);row.afterSha256=sha(fs.readFileSync(path.join(ROOT,row.file)));
 fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
}
module.exports={BASE,edits,transform,verify,original};
if(require.main===module){assert.equal(process.argv[2],'--apply');apply();}
