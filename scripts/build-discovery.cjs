'use strict';
/* Build-time public discovery. No client-side content, schema, or navigation injection. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {GROUPS,ARCHIVE,PRESERVE_ONLY,EXTRA,entries,fileFor}=require('./discovery-catalog.cjs');
const share=require('./share-metadata.cjs');
const ROOT=path.resolve(__dirname,'..'),O='https://speedandform.com',V='20260916-p2';
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8'),write=(f,s)=>{fs.mkdirSync(path.dirname(path.join(ROOT,f)),{recursive:true});fs.writeFileSync(path.join(ROOT,f),s);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const changed=new Map();
const wayfinding=`<nav class="site-wayfinding" aria-label="Explore FORM"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/#begin">Work with Brice</a></nav>`;
function change(file,after,reason){const before=read(file);if(after!==before){changed.set(file,{file,reason,beforeSha256:hash(before),afterSha256:hash(after),bodySha256:hash(after.slice(after.toLowerCase().indexOf('</head>')))});write(file,after);}}
function row(e){return `<li><a class="discovery-link" href="${esc(e.url)}"><span><strong>${esc(e.title)}</strong><small>${esc(e.description)}</small></span><span class="discovery-arrow" aria-hidden="true">→</span></a></li>`;}
function searchForm(){return `<form class="discovery-search" id="discovery-search" role="search" action="/search" method="get"><label for="discovery-query">What would you like to understand?</label><div class="discovery-field"><input id="discovery-query" type="search" name="q" maxlength="180" placeholder="Try easy running…" autocomplete="off"><button type="submit">Search</button></div></form>`;}
function header(){return `<a class="discovery-skip" href="#main">Skip to content</a><header class="discovery-wrap discovery-header"><a class="discovery-brand" href="/" aria-label="FORM home">FORM<span>.</span></a><nav class="discovery-nav" aria-label="Main"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/#begin">Work with Brice</a></nav></header>`;}
function footer(){return `<footer class="discovery-wrap discovery-footer"><p>Speed &amp; Form<br>Running with Brice. Miami + Remote.</p><nav aria-label="Footer"><a href="/field-notes">Field Notes</a><a href="/ask/">Ask Brice</a><a href="/labs/">Studies &amp; tools</a><a href="/form/">FORM app</a><a href="/forge-sculpt/">Breechay Sculpt</a><a href="/athlete/">Athlete sign in</a><a href="/privacy.html#website">Privacy</a></nav></footer>`;}
function page(file,body,{noindex=false,schema=null}={}){let h=read(file).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1];
 h=h.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<link\b[^>]*(?:fonts\.googleapis|cream-reading\.css|discovery\.css)[^>]*>/gi,'').replace(/<script\b[^>]*id="discovery-schema"[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<meta\b[^>]*name="robots"[^>]*>/gi,'');
 h=h.trim().replace(/\n{2,}/g,'\n');
 if(file==='library.html'){
  const title='Running Guides & Training Tools | FORM Library',description='Understand your running. Explore clear guides to pace, running form, strength, race preparation, and recovery, plus plans and studies from Brice.';
  h=h.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
  h=h.replace(/<meta\b[^>]*>/gi,tag=>{const a=share.attrs(tag),k=a.name||a.property;return ['description','og:description','twitter:description'].includes(k)?tag.replace(/content="[^"]*"/,'content="'+esc(description)+'"'):['og:title','twitter:title'].includes(k)?tag.replace(/content="[^"]*"/,'content="'+esc(title)+'"'):tag;});
 }
 if(noindex)h+='\n<meta name="robots" content="noindex,follow">';
 if(schema)h+='\n<script type="application/ld+json" id="discovery-schema">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>';
 h+=`\n<link rel="stylesheet" href="/css/cream-reading.css?v=20260916"><link rel="stylesheet" href="/css/discovery.css?v=${V}">\n`;
 return `<!doctype html>\n<html lang="en" data-form-reading="20260916" data-discovery="${V}"><head>${h.trim()}</head><body>${header()}<main id="main" class="discovery-wrap">${body}</main>${footer()}${file==='search.html'?`<script src="/js/discovery-search.js?v=${V}" defer></script>`:''}</body></html>\n`;
}
function build(){
 const beforeFiles=new Map(share.allHtml(ROOT).map(f=>[f,hash(read(f))]));
 const library=`<section class="discovery-hero"><p class="discovery-eyebrow">The Library</p><h1>Understand your running.</h1><p class="discovery-dek">A question, a useful answer, and somewhere to go next. Explore the guides, training plans, and work behind the practice.</p>${searchForm()}</section><nav class="discovery-topics" aria-label="Library topics">${GROUPS.map(([id,title])=>`<a href="#${id}">${esc(({start:"Start here",training:"Pace & training",movement:"Form & strength",race:"Race preparation",recovery:"Recovery",practice:"Plans & studies"})[id])}</a>`).join('')}</nav>`+GROUPS.map(([id,title,desc])=>`<section class="discovery-section" id="${id}" aria-labelledby="heading-${id}"><div><h2 id="heading-${id}">${esc(title)}</h2><p>${esc(desc)}</p></div><ul class="discovery-rows">${entries.filter(e=>e.category===id).map(row).join('')}</ul></section>`).join('')+`<section class="discovery-help"><h2>Make it work for you.</h2><p>The Library explains the ideas. Coaching puts them into a week built around your running, your goal, and your life.</p><a href="/#begin">Tell Brice what you are training for →</a><p class="discovery-question">Just have a question? <a href="/ask/">Ask Brice directly →</a></p></section><details class="discovery-archive"><summary>Earlier training material</summary><p>These pages are retained as a record. They are not the current group schedule or a new training assignment.</p><a href="/plan-spring-2026">Spring 2026 training cycle</a><a href="/races/key-biscayne-2026">Key Biscayne 2026 race notes</a></details>`;
 const schema={'@context':'https://schema.org','@type':'CollectionPage','@id':O+'/library#page',url:O+'/library',name:'FORM Library',description:'Running guides, plans, studies, and tools from the coaching practice.',mainEntity:{'@type':'ItemList',itemListElement:entries.map((e,i)=>({'@type':'ListItem',position:i+1,name:e.title,url:O+e.url}))}};
 change('library.html',page('library.html',library,{schema}),'Athlete-facing topic index and static discovery links');
 const search=`<section class="discovery-hero"><p class="discovery-eyebrow">Search the Library</p><h1>Find your next answer.</h1><p class="discovery-dek">Search by the question you have, the run you are working on, or the idea you want to understand.</p>${searchForm()}</section><div class="discovery-results"><div class="discovery-state"><p class="discovery-status" id="discovery-status" role="status" aria-live="polite">Search is ready when the page loads.</p><button class="discovery-clear" id="discovery-clear" type="button" hidden>Clear search</button></div><div id="discovery-output"></div><noscript><p>Search needs JavaScript. <a href="/library">Browse the full Library by topic</a> without it.</p></noscript></div>`;
 change('search.html',page('search.html',search,{noindex:true}),'Safe, query-aware public search with explicit loading, failure, retry and empty states');
 const lost=`<section class="discovery-hero"><p class="discovery-eyebrow">404 · Page not found</p><h1>That page<br>isn’t here.</h1><p class="discovery-dek">The link may have changed. Find what you came for below, or return to the Library.</p>${searchForm()}</section><section class="discovery-section" aria-label="Find your way"><div><h2>Still in the right place.</h2><p>Learn something useful, find your next plan, or join us at the track.</p></div><ul class="discovery-rows">${[{url:'/library',title:'Learn about your running',description:'Guides, questions, and practical references.'},{url:'/plans/',title:'Find a training plan',description:'Read the scope, preview, and access details.'},{url:'/thursday',title:'Run with us',description:'Current track-session information.'},{url:'/#begin',title:'Work with Brice',description:'Coaching built around your running.'}].map(row).join('')}</ul></section>`;
 change('404.html',page('404.html',lost,{noindex:true}),'Useful search and public routes; removes stale all-plans-free claim');
 // Static navigation on reviewed reading surfaces only. Never rewrite their content or scripts.
 const navFiles=new Set(entries.filter(e=>!['Plan','Plans','Study','App','Workouts','Guide & tools','Field note','Gallery'].includes(e.type)).map(e=>e.file));
 for(const file of navFiles){let h=read(file);const pageWayfinding=file==='thursday.html'?wayfinding.replace('<a href="/thursday">Run with us</a>','<a href="/track/">Photos &amp; films</a>'):wayfinding;if(['library.html','search.html','404.html'].includes(file))continue;
  if(h.includes('class="site-wayfinding"')){h=h.replace(/<nav class="site-wayfinding"[\s\S]*?<\/nav>/,pageWayfinding);change(file,h,'Public wayfinding; original navigation, article content, IDs and scripts retained');continue;}
  let match=h.match(/<nav class="nav"[\s\S]*?<\/nav>/i)||h.match(/<div class="nav">[\s\S]*?<\/div>/i);if(!match)continue;
  h=h.replace(match[0],match[0]+'\n'+pageWayfinding).replace('</head>',`<link rel="stylesheet" href="/css/discovery.css?v=${V}">\n</head>`);
  change(file,h,'Public wayfinding; original navigation, article content, IDs and scripts retained');
 }
 // Eight newer articles had no canonical at all. Their existing OG URL supplies the canonical.
 for(const e of entries.filter(e=>e.file.startsWith('library/')||e.file==='forge-sculpt/index.html')){let h=read(e.file);if(!/<link\b[^>]*rel=["']canonical["']/i.test(h)){
  h=h.replace('</head>',`<link rel="canonical" href="${O+e.url}">\n</head>`);
  if(share.DESCRIPTIONS[e.file])h=h.replace(/<meta\b[^>]*name="description"[^>]*>/i,'<meta name="description" content="'+esc(share.DESCRIPTIONS[e.file])+'">');
  change(e.file,h,'Canonical added from existing public OG URL; public wayfinding retained');
 }}
 // Keep acquisition sections and intake unchanged. Give the header a visible Library door on phones.
 let home=read('index.html').replace('<a class="hide-mobile" href="#practice">The method</a>','<a href="/library">Library</a>').replace('<a href="/library">Reading <span>↗</span></a>','<a href="/library">Library <span>↗</span></a><a href="/thursday">Run with us <span>↗</span></a>');
 change('index.html',home,'Library in the header and current track door in the footer; acquisition content unchanged');
 // Context, not destruction: retain dated work and stop presenting it as the current schedule.
 for(const route of ARCHIVE){const file=fileFor(route);if(!fs.existsSync(path.join(ROOT,file)))continue;let h=read(file);if(h.includes('data-discovery-archive'))continue;
  const notice='<aside class="discovery-return" data-discovery-archive><strong>Earlier training material.</strong> This page is retained as a record, not the current schedule or a new training assignment. <a href="/thursday">Current track details</a> · <a href="/plans/">Published training plans</a></aside>';
  h=h.replace(/(<body\b[^>]*>)/i,'$1\n'+notice).replace('</head>',`<link rel="stylesheet" href="/css/discovery.css?v=${V}">\n</head>`);change(file,h,'Historical context notice; original route and record retained');
 }
 // One reviewed catalog owns search; never sweep a directory containing athlete deliveries.
 const index=entries.map(({route,file,...e})=>e);write('search-index.json',JSON.stringify(index,null,2)+'\n');
 // Catalog + retained evergreen references, with one canonical URL per indexable public source.
 const publicFiles=[...new Set([...entries.map(e=>e.file),...EXTRA.map(fileFor)])].sort();
 const urls=publicFiles.map(file=>{const html=read(file);if(/noindex/i.test(share.meta(html,'robots')))throw Error('Noindex in sitemap: '+file);const c=share.canonical(html,file);if(!c.startsWith(O+'/'))throw Error('Nonlocal canonical: '+file);return {file,url:c};});
 if(new Set(urls.map(x=>x.url)).size!==urls.length)throw Error('Duplicate sitemap canonical');
 write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(e=>'  <url><loc>'+esc(e.url)+'</loc></url>').join('\n')+'\n</urlset>\n');
 write('robots.txt','User-agent: *\nAllow: /\n\n# Rendering resources must remain crawlable.\nDisallow: /tmp/\nDisallow: /dev/\n\nSitemap: '+O+'/sitemap.xml\n');
 let redir=read('_redirects');if(!redir.includes('# Pass 2: verified app alias'))redir='# Pass 2: verified app alias; the static legacy file must not shadow it.\n/app /form/ 301!\n/app.html /form/ 301!\n\n'+redir;write('_redirects',redir);
 let headers=read('_headers');if(!headers.includes('# Pass 2: discovery controls'))headers+='\n# Pass 2: discovery controls (not an access-control mechanism)\n/search\n  X-Robots-Tag: noindex, follow\n\n/search.html\n  X-Robots-Tag: noindex, follow\n\n/404.html\n  X-Robots-Tag: noindex, follow\n\n/docs/*\n  X-Robots-Tag: noindex, nofollow\n\n/scripts/*\n  X-Robots-Tag: noindex, nofollow\n\n/tests/*\n  X-Robots-Tag: noindex, nofollow\n';write('_headers',headers);
 // Keep Pass 1 metadata formatting and values stable as head resources are added.
 for(const file of new Set([...changed.keys(),...navFiles,...ARCHIVE.map(fileFor)])) if(share.PAGES.includes(file)&&file!=='search.html') change(file,share.transform(read(file),file,ROOT),changed.get(file)?.reason||'Normalize existing approved share metadata after discovery resources');
 // Preserve the original Pass 1 receipt. New release snapshots cover only explicitly changed files.
 const dest='docs/audits/DISCOVERY-MANIFEST-20260916.json',prior=fs.existsSync(path.join(ROOT,dest))?JSON.parse(read(dest)):null;
 const rows=new Map((prior?.changedHtml||[]).map(e=>[e.file,e]));for(const [file,entry] of changed)rows.set(file,{...entry,beforeSha256:rows.get(file)?.beforeSha256||beforeFiles.get(file),afterSha256:hash(read(file)),bodySha256:hash(read(file).slice(read(file).toLowerCase().indexOf('</head>'))),preview:{title:share.meta(read(file),'og:title'),description:share.meta(read(file),'og:description')}});
 const manifest={version:V,baseCommit:'05b76ab2b08cfc37f448f637f19e3aa0c9c3d03a',searchEntries:index.length,sitemap:urls,changedHtml:[...rows.values()].sort((a,b)=>a.file.localeCompare(b.file)),retainedArchives:ARCHIVE,omittedFromDiscovery:PRESERVE_ONLY,untouchedHtml:[...beforeFiles].filter(([f])=>!rows.has(f)).map(([file,sha256])=>({file,sha256}))};
 write(dest,JSON.stringify(manifest,null,2)+'\n');console.log(`Discovery: ${index.length} search entries, ${urls.length} canonical sitemap URLs, ${rows.size} scoped HTML changes.`);
 return manifest;
}
if(require.main===module)build();module.exports={build,esc,wayfinding};
