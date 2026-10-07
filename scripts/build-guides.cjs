'use strict';
// Deliberate static publication. This does not run in the Netlify build or change training data.
const fs=require('node:fs'),path=require('node:path');
const guides=require('./guide-content.cjs'),share=require('./share-metadata.cjs');
const ROOT=path.resolve(__dirname,'..'),VERSION='20261006-lessons';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={effort:'The effort',purpose:'Why it matters',example:'A session example',adjust:'When to adjust',questions:'Common questions',meaning:'What it means',session:'A session example',progress:'How to progress',choose:'Choose the job',duration:'How long',finish:'The finish',prepare:'What to prepare',notice:'What to notice',observations:'Find your observation','hip-bounce-reference':'Cadence practice',compare:'How to compare'};
const heading=(id,title)=>`<h2 id="heading-${id}"><a class="section-link" href="#${id}">${esc(title)}</a></h2>`;
function measures(html){return html.split(/(<[^>]+>)/g).map(piece=>piece.startsWith('<')?piece:piece.replace(/\b\d+(?:[.:]\d+)?(?:\s*[–×+]\s*\d+(?:[.:]\d+)?)*(?:\s*(?:minutes?|min|seconds?|sec|repetitions?|miles?|km|days?|weeks?|sets?|bpm))?\b/g,value=>`<span class="lesson-measure">${value}</span>`)).join('');}
function linkedSteps(s){let step=0,question=0;return s.html.replace(/<h3>([^<]+)<\/h3>/g,(_,title)=>{const id=`${s.id}-step-${++step}`;return `<h3 id="${id}"><a class="section-link" href="#${id}">${title}</a></h3>`;}).replace(/<details class="guide-detail">/g,()=>`<details class="guide-detail" id="${s.id}-question-${++question}">`);}
function render(g,previous){
 const route=share.ORIGIN+g.route;
 const updated=g.updated||'2026-09-17';
 const teaching=g.lesson||g.practice;
 const kind=g.kind||(g.practice?'Routine':'Lesson');
 const use=require('./lesson-use.cjs')[g.route];
 const sections=[...g.sections];
 if(kind==='Routine'){const at=sections.findIndex(s=>s.id==='routine'||s.id==='steps');if(at>0)sections.unshift(...sections.splice(at,1));}
 if(teaching&&kind==='Lesson'&&use)sections.push({id:'this-week',title:'Use it this week.',html:`<p>${esc(use.week)}</p>`},{id:'mistakes',title:'Three mistakes to catch.',html:`<ol class="lesson-mistakes">${use.mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`},{id:'fits',title:'Where does it fit?',html:`<p>${esc(use.fits)}</p>`});
 if(teaching&&kind==='Routine'){
  if(!sections.some(s=>s.id==='progress'))sections.push({id:'progress',title:'When should you progress?',html:'<p>Repeat the small amount first. When the movement stays comfortable and your following runs feel manageable, change one thing: a little more range, resistance or work. Keep the cue and normal breathing.</p>'});
  sections.push({id:'stop',title:'When should you stop?',html:'<p>Stop the set if you lose control or must hold your breath. Reduce the amount or choose an easier version. Stop for sharp pain, joint pain or symptoms that change how you move; persistent or recurring symptoms need assessment.</p>'});
 }
 const facts=g.facts?`<section class="routine-overview" id="routine-facts" aria-labelledby="heading-routine-facts">${heading('routine-facts','The routine at a glance.')}<dl class="routine-facts">${g.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="guide-small">An example starting amount. Choose movements you already know; an assigned plan takes priority.</p><button class="routine-print" type="button" data-guide-print hidden>Print this routine</button><noscript><p>Use your browser’s Print command for a paper copy.</p></noscript></section>`:'';
 const family=g.family||(g.route==='/running-form-errors'?'movement':null);
 const familyBlock=family?require('./library-family.cjs').render(family,g.route):'';
 const dateLabel=updated==='2026-10-06'?'October 6, 2026':'September 17, 2026';
 const lessons=g.lesson?require('./running-lessons-content.cjs'):[];
 const at=lessons.findIndex(x=>x.route===g.route);
 const lessonNav=g.lesson?`<nav class="lesson-nav" aria-label="Running basics lessons"><a href="/library#running-basics">Running basics</a><span>${String(at+1).padStart(2,'0')} / ${String(lessons.length).padStart(2,'0')}</span>${at>0?`<a href="${lessons[at-1].route}">Previous lesson</a>`:''}${at<lessons.length-1?`<a href="${lessons[at+1].route}">Next lesson →</a>`:''}</nav>`:'';
 const author={'@type':'Person',name:'Brice Ikouebe',url:share.ORIGIN+'/#practice'};
 const schema={'@context':'https://schema.org','@graph':[
 {'@type':'Article','@id':route+'#article',headline:g.heading,description:g.description,url:route,inLanguage:'en-US',author,dateModified:updated,mainEntityOfPage:route,image:share.meta(previous,'og:image')||share.ORIGIN+share.DEFAULT_IMAGE,citation:g.sources.map(s=>s[2]),publisher:{'@type':'Organization',name:'Speed & Form',url:share.ORIGIN}},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Library',item:share.ORIGIN+'/library'},{'@type':'ListItem',position:2,name:g.label,item:route}]}
 ]};
 // Old FAQ/medical claims are replaced with schema that describes the actual article.
 const html=`<!DOCTYPE html>
<html lang="en" data-form-reading="20261006" data-guide="${VERSION}"${teaching?` data-running-lesson="20261006" data-library-kind="${kind.toLowerCase()}"`:''}${family?` data-library-family="${family}"`:''}>
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
<link rel="stylesheet" href="/css/cream-reading.css?v=20261006">
<link rel="stylesheet" href="/css/guide-foundations.css?v=${VERSION}">
<link rel="stylesheet" href="/css/sf-brand.css?v=20261001">
${teaching?`<link rel="stylesheet" href="/css/running-lessons.css?v=${VERSION}">`:''}
${family?`<link rel="stylesheet" href="/css/library-movement.css?v=${VERSION}">`:''}
${g.route==='/training-week'?'<link rel="stylesheet" href="/css/training-guides.css?v=20261006">':''}
<script defer src="/js/guide-tools.js?v=${VERSION}"></script>
</head>
<body>
<a class="guide-skip" href="#main">Skip to content</a>
<header class="guide-wrap guide-header"><a class="guide-brand sf-brand" href="/" aria-label="Speed and Form home"></a><nav class="site-wayfinding" aria-label="Explore Speed and Form"><a href="/library">Library</a><a href="/plans/">Plans</a><a href="/thursday">Run with us</a><a href="/contact">Contact</a></nav></header>
<main class="guide-wrap" id="main" tabindex="-1">
<header class="guide-hero"><p class="guide-eyebrow"><a href="${family?'/library#movement':'/library'}">${family?'Strength &amp; movement':'The running library'}</a> · ${esc(kind)}${g.number?' '+g.number:''}</p><h1>${esc(g.heading)}</h1><p class="guide-answer">${esc(g.answer)}</p>${kind==='Routine'?`<a class="routine-start-link" href="#${sections[0].id}">Go to the moves →</a>`:''}<div class="guide-byline"><span>By <a href="/#practice">Brice Ikouebe</a></span><span>Updated ${dateLabel}</span></div>${lessonNav}</header>
${facts}<div class="guide-layout"><aside class="guide-contents" aria-label="In this guide"><p>In this guide</p><nav>${sections.map(s=>`<a href="#${s.id}">${teaching?esc(s.title):labels[s.id]||esc(s.title)}</a>`).join('')}${teaching?'<a href="#remember">Remember this</a>':''}<a href="#sources">Sources &amp; context</a></nav></aside>
<article class="guide-body" aria-label="${esc(g.label)} guide">
${sections.map(s=>`<section class="guide-section" id="${s.id}" aria-labelledby="heading-${s.id}">${heading(s.id,s.title)}${g.starting&&['routine','options'].includes(s.id)?`<p class="routine-starting">${measures(esc(g.starting))}</p>`:''}${teaching?measures(linkedSteps(s)):linkedSteps(s)}</section>`).join('\n')}
${teaching?`<section class="lesson-recap" id="remember" aria-labelledby="heading-remember"><p class="lesson-label">The part to take with you</p>${heading('remember','Remember this.')}<ol>${g.remember.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><details class="guide-detail lesson-check" id="check-question"><summary>${esc(g.check[0])}</summary><div><p>${esc(g.check[1])}</p></div></details><p class="lesson-teach">Try explaining the idea to a friend in your own words.</p></section>`:''}
${familyBlock}
<section class="guide-sources" id="sources"><details><summary>Sources &amp; context</summary><p class="guide-small">The examples and decisions above are FORM coaching guidance. The research below supports the stated principles, not an individual prescription or a guaranteed result.</p><ol>${g.sources.map(([author,title,url,note],i)=>`<li id="source-${i+1}">${esc(author)}<a href="${esc(url)}">${esc(title)}</a><small>${esc(note)}</small></li>`).join('')}</ol></details></section>
<section class="guide-related" id="keep-learning" aria-labelledby="heading-keep-learning">${heading('keep-learning','Keep learning.')}<ul>${g.related.map(([url,title,note])=>`<li><a href="${url}"><strong>${esc(title)} →</strong><span>${esc(note)}</span></a></li>`).join('')}</ul></section>
<section class="guide-help" id="coaching">${heading('coaching',g.help)}<p>${esc(g.helpText)}</p><a href="/#begin">Work with Brice →</a></section>
</article></div></main>
<footer class="guide-wrap guide-footer"><a class="sf-brand" href="/" aria-label="Speed and Form home"></a><nav aria-label="Footer"><a href="/library">Library</a><a href="/search">Search</a><a href="/contact">Contact</a><a href="/privacy#website">Privacy</a></nav></footer>
</body>
</html>
`;
 return share.transform(require('./build-cream-reading.cjs').transformHtml(html,g.file),g.file,ROOT);
}
function build(){for(const g of guides){const p=path.join(ROOT,g.file);fs.writeFileSync(p,render(g,fs.readFileSync(p,'utf8')));}console.log('Built four reviewed foundation guides. No other page changed.');}
if(require.main===module)build();module.exports={render,build,VERSION};
