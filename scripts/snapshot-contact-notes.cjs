'use strict';
// Deliberate build-time review operation; never invoked by the website or the test gate.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const s=require('./share-metadata.cjs'),ROOT=path.resolve(__dirname,'..');
const baseCommit='780f409ed521f3c6290c19e0d80279331bf4eecc';
const files=['field-notes.html','ask/index.html','library.html','search.html','404.html',...require('./field-notes-content.cjs').filter(n=>n.published).map(n=>'field-notes/'+n.slug+'/index.html')];
function row(file){const b=fs.readFileSync(path.join(ROOT,file));let before=null;try{before=s.sha(cp.execFileSync('git',['show',baseCommit+':'+file],{cwd:ROOT,stdio:['ignore','pipe','ignore']}));}catch(_){}return {file,beforeSha256:before,afterSha256:s.sha(b)};}
const m={version:'20260917-p6a',baseCommit,pages:files.map(f=>{const h=fs.readFileSync(path.join(ROOT,f),'utf8');return {...row(f),url:s.canonical(h,f),bodySha256:s.sha(h.slice(h.toLowerCase().indexOf('</head>'))),preview:{title:s.meta(h,'og:title'),description:s.meta(h,'og:description')}};}),assets:['css/contact-notes.css','js/contact-notes.js','js/question-contexts.json','field-notes/feed.xml'].map(row),integration:['_headers','scripts/build-discovery.cjs','scripts/discovery-catalog.cjs','search-index.json','sitemap.xml','docs/audits/DISCOVERY-MANIFEST-20260916.json'].map(row)};
fs.writeFileSync(path.join(ROOT,'docs/audits/CONTACT-NOTES-MANIFEST-20260917.json'),JSON.stringify(m,null,2)+'\n');
console.log('Pinned '+m.pages.length+' public HTML snapshots and bounded integration assets.');
