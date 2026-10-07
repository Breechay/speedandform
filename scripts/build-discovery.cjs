'use strict';
// All public discovery projections now share the reviewed catalog.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {entries}=require('./discovery-catalog.cjs');
const root=path.resolve(__dirname,'..');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wayfinding='<nav class="site-wayfinding" aria-label="Explore Speed and Form"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/contact">Contact</a></nav>';
function build(){return require('./build-discovery-current.cjs').build();}
function buildHalfMarathon(){
 build();
 const resources=entries.filter(e=>e.category==='half-marathon');
 if(resources.length!==7)throw Error('Half-marathon collection requires seven complete resources.');
 const files=['library.html','search.html','404.html','search-index.json','sitemap.xml','plans/index.html'];
 const receipt={version:'20261006-lessons',stage:'Discovery source build; later cream/brand build steps may change HTML hashes.',scope:'Seven half-marathon resources within the consolidated public catalog.',resources:resources.map(({url,title,type})=>({url,title,type})),searchEntries:entries.length,existingSearchEntries:entries.length-resources.length,files:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),deferred:'Historical delivery and archive pages stay outside the curated public catalog.'};
 fs.writeFileSync(path.join(root,'docs/audits/HALF-MARATHON-DISCOVERY-20261006.json'),JSON.stringify(receipt,null,2)+'\n');
 return receipt;
}
if(require.main===module){if(process.argv.includes('--half-marathon'))buildHalfMarathon();else build();}
module.exports={build,buildHalfMarathon,esc,wayfinding};
