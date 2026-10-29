'use strict';
// Static, source-preserving research publication. No remote data or browser Markdown.
const fs=require('node:fs'),path=require('node:path');
const {Marked}=require('./vendor/marked/marked.cjs');
const ROOT=path.resolve(__dirname,'..'),BASE='/the-athletic-life/',DIR=path.join(ROOT,BASE);
const reports=JSON.parse(fs.readFileSync(path.join(DIR,'research/reports.json'),'utf8'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safe=url=>/^(?:https?:\/\/|\/(?!\/)|#|\.?\.?\/)/i.test(url);
function render(md){
 const sections=[];let count=0;
 const marked=new Marked({gfm:true,renderer:{
  html({text}){return esc(text)},
  heading({tokens,depth}){const title=this.parser.parseInline(tokens),id='section-'+(++count),level=Math.max(2,depth);if(level===2)sections.push({id,title});return `<h${level} id="${id}">${title}</h${level}>\n`},
  link({href,tokens}){const label=this.parser.parseInline(tokens);return safe(href)?`<a href="${esc(href)}">${label}</a>`:label},
  image({text}){return esc(text)},
  table(token){const cells=(row,tag)=>row.map(c=>`<${tag}${tag==='th'?' scope="col"':''}>${this.parser.parseInline(c.tokens)}</${tag}>`).join('');return `<div class="ar-table" tabindex="0" role="region" aria-label="Research comparison"><table><thead><tr>${cells(token.header,'th')}</tr></thead><tbody>${token.rows.map(r=>`<tr>${cells(r,'td')}</tr>`).join('')}</tbody></table></div>`}
 }});
 return {html:marked.parse(md),sections};
}
function shell({title,description,route,body,kind='Reference',toc=[],download='',source=false,hero=false}){
 const nav=toc.map(s=>`<a href="#${s.id}">${s.title}</a>`).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | The Athletic Life</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#0b0b0b"><link rel="canonical" href="https://speedandform.com${route}"><meta name="robots" content="${source?'noindex,follow':'index,follow,max-image-preview:large'}"><meta property="og:site_name" content="Speed &amp; Form"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)} | FORM"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="https://speedandform.com/media/library/bw-group-portrait-1200.webp"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)} | FORM"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://speedandform.com${route}"><meta property="og:image" content="https://speedandform.com/media/library/bw-group-portrait-1200.webp"><link rel="icon" href="/favicon.ico"><link rel="preload" href="/assets/site/fonts/inter-tight-latin-variable.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/athletic-life.css?v=20261028"><link rel="stylesheet" href="/css/athletic-research.css?v=20261028"></head>
<body class="al-page ar-page"><a class="al-skip" href="#reading">Skip to content</a><header class="al-header"><a class="al-header-logo" href="/" aria-label="Speed and Form home"><img src="/assets/brand/kit/emblem/sf-emblem-bone.svg" width="96" height="40" alt=""></a><a class="al-home" href="${BASE}">The Athletic Life</a></header>
<main><header class="ar-opening${hero?' ar-opening-photo':''}"><div><p class="ar-date">${esc(kind)} · October 28, 2026</p><h1>${esc(title)}</h1><p class="ar-deck">${esc(description)}</p></div>${hero?'<figure><img src="/media/library/bw-group-portrait-1200.webp" width="1200" height="800" alt="FORM athletes in a group portrait" fetchpriority="high"></figure>':''}</header>
<nav class="ar-collection-nav" aria-label="Athletic Life collection"><a href="${BASE}">Founding brief</a><a href="${BASE}discoveries/">First discoveries</a><a href="${BASE}research/">Research</a><a href="${BASE}research/agent-guide/">Agent guide</a></nav>
<div class="ar-reading${toc.length?' ar-with-index':''}" id="reading">${toc.length?`<aside><details open><summary>Contents</summary><nav aria-label="Article contents">${nav}</nav></details>${download?`<a class="ar-download" href="${download}">Markdown ↓</a>`:''}</aside>`:''}<article class="ar-prose">${body}</article></div></main>
<footer class="ar-footer"><a href="${BASE}research/">The Athletic Life · Research</a><a href="#reading">Back to reading ↑</a><a href="/">Speed &amp; Form</a></footer><script src="/js/athletic-research.js" defer></script></body></html>`;
}
function write(route,html){const dir=path.join(ROOT,route);fs.mkdirSync(dir,{recursive:true});const {transformHtml}=require('./build-site-menu.cjs');fs.writeFileSync(path.join(dir,'index.html'),transformHtml(html,route+'index.html').replace(/[ \t]+$/gm,''))}
function article({file,title,description,route,kind,source=false,intro=''}){
 let md=fs.readFileSync(path.join(DIR,file),'utf8');
 // The stored Markdown retains its title. The reading page supplies that title once.
 md=md.replace(/^# [^\n]+\n/,'');if(!source)md=md.replace(/^\s*October 28, 2026[^\n]*\n/,'');const rendered=render(md);
 if(file==='discoveries/article.md'){let n=0;rendered.html=rendered.html.replace(/\[([1-5])\]/g,'<a href="#reference-$1">[$1]</a>').replace(/<li>/g,()=>'<li id="reference-'+(++n)+'">');}
 write(route,shell({title,description,route,kind,source,toc:rendered.sections,download:BASE+file,body:intro+rendered.html}));
}
function build(){
 article({file:'discoveries/article.md',title:'What an athletic life can make possible',description:'Capability, chosen connection, meaningful experiences and a history worth keeping.',route:BASE+'discoveries/',kind:'First discoveries'});
 article({file:'research/editorial-assessment.md',title:'Editorial assessment',description:'Where the reports agree, where they diverge, and what the evidence does not establish.',route:BASE+'research/assessment/',kind:'Research review'});
 article({file:'research/agent-guide.md',title:'A guide for future work',description:'Research context for app audits, product decisions and new possibilities.',route:BASE+'research/agent-guide/',kind:'Agent reference'});
 for(const r of reports){
  const intro=`<div class="ar-source-note"><p><strong>Independent source report.</strong> ${esc(r.limit)} Recommendations and illustrative scenes are not adopted policies, current offers or demonstrated FORM outcomes.</p><p>${esc(r.format)}. <a href="${BASE}research/${r.original}" download>Original ${path.extname(r.original).slice(1).toUpperCase()} ↓</a> · <a href="${BASE}research/assessment/">Editorial assessment</a></p></div>`;
  article({file:'research/'+r.markdown,title:r.title,description:r.contribution,route:BASE+'research/'+r.slug+'/',kind:'Source report',source:true,intro});
 }
 const body=`<section class="ar-feature"><p class="ar-label">First discoveries</p><h2><a href="${BASE}discoveries/">What an athletic life<br>can make possible <span aria-hidden="true">↗</span></a></h2><p>Good coaching can leave someone more capable, more independent and able to pursue something that once felt out of reach.</p></section>
 <section class="ar-reference"><h2>For the work ahead</h2><div><a href="${BASE}research/agent-guide/">Agent guide ↗</a><p>App audits and opportunity work, with current authority and evidence kept distinct.</p><a href="${BASE}research/agent-guide.md">Plain Markdown ↓</a></div><div><a href="${BASE}research/assessment/">Editorial assessment ↗</a><p>Convergence, disagreements and corrections across the seven reports.</p></div></section>
 <section class="ar-reports"><h2>Independent perspectives</h2><p>Seven reports, one founding question. Shared sources and agreement do not establish athlete demand. These are exploratory arguments, not approved product requirements.</p>${reports.map((r,i)=>`<div class="ar-report"><span class="ar-report-number">${String(i+1).padStart(2,'0')}</span><div><h3><a href="${BASE}research/${r.slug}/">${esc(r.title)} <span aria-hidden="true">↗</span></a></h3><p>${esc(r.contribution)}</p><p class="ar-limit">${esc(r.limit)}</p><div class="ar-source-links"><span>${Math.round(r.words/200)} min read</span><a href="${BASE}research/${r.markdown}">Markdown</a><a href="${BASE}research/${r.original}" download>Original ${path.extname(r.original).slice(1).toUpperCase()}</a></div></div></div>`).join('')}</section>
 <section class="ar-provenance"><h2>Sources and continuity</h2><p>The <a href="${BASE}brief.md">founding brief</a> retains its original wording. Source reports retain their wording and original files; DOCX reading editions simplify document styling. Labels above are editorial handles, not asserted author identities.</p><p>Research claims in the edited companion have primary-source notes. The full reports have not all received a citation-by-citation replication. New evidence may change this assessment.</p><p><a href="${BASE}research/reports.json">Source manifest and checksums</a> · <a href="https://github.com/Breechay/speedandform/tree/main/the-athletic-life">Version history</a></p></section>`;
 write(BASE+'research/',shell({title:'The Athletic Life',description:'Discoveries, ideas and possibilities for FORM.',route:BASE+'research/',kind:'Research collection',hero:true,body}));
 return {reports:reports.length,pages:reports.length+4};
}
if(require.main===module)console.log(build());
module.exports={render,shell,build,reports};
