'use strict';
// Deliberate static publication. This does not run in the Netlify build or change training data.
const fs=require('node:fs'),path=require('node:path');
const guides=require('./guide-content.cjs'),share=require('./share-metadata.cjs');
const ROOT=path.resolve(__dirname,'..'),VERSION='20260917-p4a';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={effort:'The effort',purpose:'Why it matters',example:'A session example',adjust:'When to adjust',questions:'Common questions',meaning:'What it means',session:'A session example',progress:'How to progress',choose:'Choose the job',duration:'How long',finish:'The finish',prepare:'What to prepare',notice:'What to notice',observations:'Find your observation','hip-bounce-reference':'Cadence practice',compare:'How to compare'};
function render(g,previous){
 const route=share.ORIGIN+g.route;
 const author={'@type':'Person',name:'Brice Ikouebe',url:share.ORIGIN+'/#practice'};
 const schema={'@context':'https://schema.org','@graph':[
 {'@type':'Article','@id':route+'#article',headline:g.heading,description:g.description,url:route,inLanguage:'en-US',author,dateModified:'2026-09-17',mainEntityOfPage:route,image:share.ORIGIN+share.DEFAULT_IMAGE,citation:g.sources.map(s=>s[2]),publisher:{'@type':'Organization',name:'FORM',url:share.ORIGIN}},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Library',item:share.ORIGIN+'/library'},{'@type':'ListItem',position:2,name:g.label,item:route}]}
 ]};
 // Old FAQ/medical claims are replaced with schema that describes the actual article.
 const html=`<!DOCTYPE html>
<html lang="en" data-form-reading="20260916" data-guide="${VERSION}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(g.title)}</title>
<meta name="description" content="${esc(g.description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${route}">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:image" content="${esc(share.meta(previous,'og:image'))}">
<script id="guide-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
<link rel="stylesheet" href="/css/cream-reading.css?v=20260916">
<link rel="stylesheet" href="/css/guide-foundations.css?v=${VERSION}">
<script defer src="/js/guide-tools.js?v=${VERSION}"></script>
</head>
<body>
<a class="guide-skip" href="#main">Skip to content</a>
<header class="guide-wrap guide-header"><a class="guide-brand" href="/" aria-label="FORM home">FORM<span>.</span></a><nav class="site-wayfinding" aria-label="Explore FORM"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/#begin">Work with Brice</a></nav></header>
<main class="guide-wrap" id="main" tabindex="-1">
<header class="guide-hero"><p class="guide-eyebrow"><a href="/library">The running library</a> · ${g.number} / ${esc(g.label)}</p><h1>${esc(g.heading)}</h1><p class="guide-answer">${esc(g.answer)}</p><div class="guide-byline"><span>By <a href="/#practice">Brice Ikouebe</a></span><span>Updated September 17, 2026</span></div></header>
<div class="guide-layout"><aside class="guide-contents" aria-label="In this guide"><p>In this guide</p><nav>${g.sections.map(s=>`<a href="#${s.id}">${labels[s.id]||esc(s.title)}</a>`).join('')}<a href="#sources">Sources &amp; context</a></nav></aside>
<article class="guide-body" aria-label="${esc(g.label)} guide">
${g.sections.map(s=>`<section class="guide-section" id="${s.id}" aria-labelledby="heading-${s.id}"><h2 id="heading-${s.id}">${esc(s.title)}</h2>${s.html}</section>`).join('\n')}
<section class="guide-sources" id="sources"><details><summary>Sources &amp; context</summary><p class="guide-small">The examples and decisions above are FORM coaching guidance. The research below supports the stated principles, not an individual prescription or a guaranteed result.</p><ol>${g.sources.map(([author,title,url,note],i)=>`<li id="source-${i+1}">${esc(author)}<a href="${esc(url)}">${esc(title)}</a><small>${esc(note)}</small></li>`).join('')}</ol></details></section>
<section class="guide-related" aria-labelledby="guide-next"><h2 id="guide-next">Keep learning.</h2><ul>${g.related.map(([url,title,note])=>`<li><a href="${url}"><strong>${esc(title)} →</strong><span>${esc(note)}</span></a></li>`).join('')}</ul></section>
<section class="guide-help"><h2>${esc(g.help)}</h2><p>${esc(g.helpText)}</p><a href="/#begin">Work with Brice →</a></section>
</article></div></main>
<footer class="guide-wrap guide-footer"><p>FORM · Running with Brice.<br>Miami + Remote.</p><nav aria-label="Footer"><a href="/library">Library</a><a href="/track/">Photos &amp; films</a><a href="/privacy.html#website">Privacy</a></nav></footer>
</body>
</html>
`;
 return share.transform(html,g.file,ROOT);
}
function build(){for(const g of guides){const p=path.join(ROOT,g.file);fs.writeFileSync(p,render(g,fs.readFileSync(p,'utf8')));}console.log('Built four reviewed foundation guides. No other page changed.');}
if(require.main===module)build();module.exports={render,build,VERSION};
