'use strict';
// Only public discovery projections. No route scanning or athlete delivery files.
const fs=require('node:fs'),path=require('node:path');
const {entries,GROUPS}=require('./discovery-catalog.cjs');
const lessons=require('./running-lessons-content.cjs');
const {groups,normalize}=require('../js/discovery-search.js');
const families=require('../js/library-families.js');
const share=require('./share-metadata.cjs');
const root=path.resolve(__dirname,'..'),V='20261006-lessons';
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=e=>e.kind||e.type;
const row=e=>`<li><a class="discovery-link" href="${esc(e.url)}"><span><span class="discovery-result-type">${esc(label(e))}</span><strong>${esc(e.title)}</strong><small>${esc(e.description)}</small></span><span class="discovery-arrow" aria-hidden="true">→</span></a></li>`;
const formats=`<div class="discovery-formats"><div><span>Lesson</span><p>Understand an idea. Use an example. Check what stuck.</p></div><div><span>Routine</span><p>Follow the dose and numbered steps. Keep it open while you practice.</p></div><div><span>Shelf</span><p>Find a collection of useful links, then choose the one you need.</p></div></div>`;
const kindNav=`<nav class="discovery-kind-nav" aria-label="Page formats"><a href="/search" data-library-kind="" aria-current="true">All pages</a><a href="/search?kind=Lesson" data-library-kind="Lesson">Lessons</a><a href="/search?kind=Routine" data-library-kind="Routine">Routines</a><a href="/search?kind=Shelf" data-library-kind="Shelf">Shelves</a></nav>`;
function form(){return `<form class="discovery-search" id="discovery-search" role="search" action="/search" method="get"><label for="discovery-query">What would you like to understand?</label><div class="discovery-field"><input id="discovery-query" type="search" name="q" maxlength="180" placeholder="Try: what is threshold running?" autocomplete="off"><button type="submit">Search</button></div></form>`;}
function basics(){return `<section class="discovery-basics" id="running-basics" aria-labelledby="basics-heading"><p class="discovery-eyebrow">Learn it. Use it. Come back to it.</p><h2 id="basics-heading">Running basics, one lesson at a time.</h2><p>Start at the beginning, or open the question you have today. Each lesson has a simple picture, an example and a short recap.</p><ol class="discovery-lesson-list">${lessons.map(g=>`<li><a href="${g.route}"><span>${g.number}</span><strong>${esc(g.heading)}</strong></a></li>`).join('')}</ol><p class="discovery-course-link">Ready for more science? <a href="/library/running-physiology-course/">Open the lecture course →</a></p></section>`;}
function toc(){return groups.map(([title,description,match])=>{
 const items=entries.filter(match);if(!items.length)return '';
 const family=families[items[0].category];
 const sets=family?family.groups.map(g=>({title:g.title,items:items.filter(e=>g.urls.includes(e.url))})):[{items}];
 const lists=sets.map(set=>`${set.title?`<h4 class="discovery-subgroup">${esc(set.title)}</h4>`:''}<ul class="discovery-toc-list">${set.items.map(e=>`<li><a class="discovery-toc-link" href="${esc(e.url)}"><span class="discovery-toc-title">${esc(e.title)}</span><small>${esc(label(e))}</small></a></li>`).join('')}</ul>`).join('');
 const id='topic-'+normalize(title).replace(/ /g,'-');
 return `<section class="discovery-toc-section" id="${id}"><div class="discovery-toc-head"><p class="discovery-toc-count">${String(items.length).padStart(2,'0')}</p><h3><a class="discovery-heading-link" href="#${id}">${esc(title)}</a></h3><p>${esc(description)}</p></div><div class="discovery-toc-family">${lists}</div></section>`;
 }).join('');}
function shell(file,body,schema){
 let head=read(file).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];
 head=head.replace(/<link\b[^>]*href="\/css\/(?:cream-reading|discovery|sf-brand)\.css[^>]*>/g,'').replace(/<script\b[^>]*id="discovery-schema"[^>]*>[\s\S]*?<\/script>/g,'').replace(/\n\s*\n/g,'\n').trim();
 head+=`\n<link rel="stylesheet" href="/css/cream-reading.css?v=20261006"><link rel="stylesheet" href="/css/discovery.css?v=${V}"><link rel="stylesheet" href="/css/sf-brand.css?v=20261001">`;
 if(schema)head+=`\n<script type="application/ld+json" id="discovery-schema">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
 const header=`<a class="discovery-skip" href="#main">Skip to content</a><header class="discovery-wrap discovery-header"><a class="discovery-brand sf-brand" href="/" aria-label="Speed and Form home"></a><nav class="discovery-nav" aria-label="Main"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/contact">Contact</a></nav></header>`;
 const footer=`<footer class="discovery-wrap discovery-footer"><a class="sf-brand" href="/" aria-label="Speed and Form home"></a><nav aria-label="Footer"><a href="/library">Library</a><a href="/search">Search</a><a href="/contact">Contact</a><a href="/privacy#website">Privacy</a></nav></footer>`;
 return require('./build-cream-reading.cjs').transformHtml(`<!doctype html>\n<html lang="en" data-form-reading="20261006" data-discovery="20261006" data-running-discovery="20261006"><head>${head}\n</head><body>${header}<main id="main" tabindex="-1" class="discovery-wrap">${body}</main>${footer}${file==='search.html'?`<script src="/js/library-families.js?v=${V}" defer></script><script src="/js/discovery-search.js?v=${V}" defer></script>`:''}</body></html>\n`,file);
}
function build(){
 for(const e of entries){
  if(!fs.existsSync(path.join(root,e.file)))throw Error('Missing catalog page: '+e.url);
  if(!e.description)throw Error('Missing description: '+e.url);
  const html=read(e.file);
  if(/noindex/i.test(share.meta(html,'robots')))throw Error('Private/unindexable catalog page: '+e.url);
  if(share.canonical(html,e.file)!==share.ORIGIN+e.url)throw Error('Catalog/canonical drift: '+e.url);
  if(groups.filter(([, ,match])=>match(e)).length!==1)throw Error('Catalog grouping drift: '+e.url);
 }
 const index=entries.map(({route,file,...e})=>e);write('search-index.json',JSON.stringify(index,null,2)+'\n');
 const topics=GROUPS.map(([id,title])=>`<a href="#${id}">${esc(title)}</a>`).join('');
 const sections=GROUPS.map(([id,title,description])=>`<section class="discovery-section" id="${id}" aria-labelledby="heading-${id}"><div><h2 id="heading-${id}"><a class="discovery-heading-link" href="#${id}">${esc(title)}</a></h2><p>${esc(description)}</p></div><ul class="discovery-rows">${entries.filter(e=>e.category===id).map(row).join('')}</ul></section>`).join('');
 const library=`<section class="discovery-hero"><p class="discovery-eyebrow">The Library</p><h1>Understand your running.</h1><p class="discovery-dek">Plain answers you can use, remember and share.</p>${form()}</section>${formats}${basics()}<nav class="discovery-topics" aria-label="Library topics">${topics}</nav>${sections}<section class="discovery-help"><h2>Put it into practice.</h2><p>The Library explains the ideas. Coaching connects them to your running, goal and week.</p><a href="/#begin">Work with Brice →</a><p class="discovery-question"><a href="/ask/">Ask a training question →</a></p></section><details class="discovery-archive"><summary>Earlier training material</summary><p>These pages are retained as a record. They are not the current group schedule or a new training assignment.</p><a href="/plan-spring-2026">Spring 2026 training cycle</a><a href="/races/key-biscayne-2026">Key Biscayne 2026 race notes</a></details>`;
 const schema={'@context':'https://schema.org','@type':'CollectionPage','@id':share.ORIGIN+'/library#page',url:share.ORIGIN+'/library',name:'Speed & Form running library',description:'Plain running lessons, guides, plans and training tools.',mainEntity:{'@type':'ItemList',itemListElement:entries.map((e,i)=>({'@type':'ListItem',position:i+1,name:e.title,url:share.ORIGIN+e.url}))}};
 write('library.html',share.transform(shell('library.html',library,schema),'library.html',root));
 const examples=['What is threshold running?','Why are my easy runs hard?','How fast should my long run be?','What is VO₂max?'];
 const search=`<section class="discovery-hero"><p class="discovery-eyebrow">Search &amp; site index</p><h1>What do you want to understand?</h1><p class="discovery-dek">Ask a running question, find an article again, or browse the whole site.</p>${form()}${kindNav}<nav class="discovery-examples" aria-label="Questions to try">${examples.map(q=>`<a data-search-example href="/search?q=${encodeURIComponent(q)}">${esc(q)}</a>`).join('')}</nav></section><div class="discovery-results"><div class="discovery-state"><p class="discovery-status" id="discovery-status" role="status" aria-live="polite">Loading search… You can browse the index below.</p><button class="discovery-clear" id="discovery-clear" type="button" hidden>Clear search</button></div><div id="discovery-output"></div></div><section class="discovery-browse" id="discovery-browse" aria-labelledby="browse-heading"><div class="discovery-browse-head"><p class="discovery-eyebrow">The whole house</p><h2 id="browse-heading">Browse by topic.</h2><p>Guides, plans, studies and Field Notes. Open an answer now, then return when you need a refresh. <a href="/library#running-basics">Start with the nine basics lessons →</a></p></div>${formats}<div class="discovery-toc" id="discovery-toc">${toc()}</div></section><noscript><div class="discovery-noscript"><p>Typing a search needs JavaScript. Every page in the index above is still available.</p><a href="/library#running-basics">Start with running basics →</a> · <a href="/library">Browse the Library →</a></div></noscript>`;
 write('search.html',shell('search.html',search));
 // Retain the wider existing sitemap. Add only reviewed canonical catalog pages.
 let sitemap=read('sitemap.xml');
 for(const e of entries)if(!sitemap.includes('<loc>'+share.ORIGIN+e.url+'</loc>'))sitemap=sitemap.replace('</urlset>','  <url><loc>'+share.ORIGIN+esc(e.url)+'</loc></url>\n</urlset>');
 write('sitemap.xml',sitemap);
 console.log(`Public discovery: ${index.length} records, ${groups.length} groups, ${lessons.length} linked basics lessons.`);
 return {searchEntries:index.length,groups:groups.length,lessons:lessons.length};
}
if(require.main===module)build();
module.exports={build,basics,toc,shell};
