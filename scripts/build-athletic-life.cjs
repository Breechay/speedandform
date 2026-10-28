'use strict';
// The Athletic Life: preserve the approved brief in brief.md; generate only its presentation.
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function inline(src) {
  const saved=[];
  function hold(markup){const key=`QX${saved.length}XQ`;saved.push(markup);return key}
  let s=esc(src);
  s=s.replace(/`([^`]+)`/g,(_m,t)=>hold(`<code>${t}</code>`));
  s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,(_m,label,url)=>hold(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`));
  s=s.replace(/https?:\/\/[^\s<>]+/g,m=>{const url=m.replace(/[.,;:]+$/,"");return hold(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)+m.slice(url.length)});
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,"<em>$1</em>");
  s=s.replace(/QX(\d+)XQ/g,(_m,n)=>saved[Number(n)]??"");
  return s;
}
function renderBrief(md) {
 const ls=md.replace(/\r\n/g,"\n").split("\n");
 const sections=[]; let open=false, blocks=[], buf=[], i=0, list=null;
 function flushP(){if(buf.length){blocks.push(`<p>${inline(buf.join(" ").trim())}</p>`);buf=[]}}
 function finishList(){if(list){blocks.push(`</${list}>`);list=null}}
 function startList(kind){flushP();if(list!==kind){finishList();blocks.push(`<${kind}>`);list=kind}}
 function endSection(){flushP();finishList();if(open){blocks.push("</section>");open=false}}
 while(i<ls.length){
  const raw=ls[i],s=raw.trim();
  if(i<ls.length && !open && !/^## \d+\.\s/.test(s)){i++;continue;}
  const chapter=s.match(/^## (\d+)\.\s+(.+)$/);
  if(chapter){endSection();let id=`chapter-${chapter[1]}`;sections.push({id,title:chapter[2],n:chapter[1]});blocks.push(`<section class="al-chapter" id="${id}" aria-labelledby="${id}-title"><header class="al-chapter-head"><span class="al-chapter-number">${chapter[1].padStart(2,"0")}</span><h2 id="${id}-title">${inline(chapter[2])}</h2></header>`);open=true;i++;continue}
  if(!s){flushP();finishList();i++;continue}
  if(s==="---"){flushP();finishList();i++;continue}
  const h3=s.match(/^###\s+(.+)$/);
  if(h3){flushP();finishList();blocks.push(`<h3>${inline(h3[1])}</h3>`);i++;continue}
  if(s.startsWith("|") && i+1<ls.length && /^\|[\s|:\-]+\|?$/.test(ls[i+1].trim())) {
    flushP();finishList();const cells=v=>v.trim().replace(/^\||\|$/g,"").split("|").map(c=>c.trim());const hd=cells(s),align=cells(ls[i+1]);let table=`<div class="al-table-scroll" role="region" tabindex="0" aria-label="${esc(hd[0])} table"><table><thead><tr>${hd.map((h,j)=>`<th scope="col"${align[j]?.endsWith(":")?' class="number"':""}>${inline(h)}</th>`).join("")}</tr></thead><tbody>`;i+=2;
    while(i<ls.length&&ls[i].trim().startsWith("|")){const row=cells(ls[i]);table+=`<tr>${row.map((v,j)=>`<td${align[j]?.endsWith(":")?' class="number"':""}>${inline(v)}</td>`).join("")}</tr>`;i++}
    table+="</tbody></table></div>";blocks.push(table);continue
  }
  if(/^-\s+/.test(s)){startList("ul");blocks.push(`<li>${inline(s.replace(/^-\s+/,""))}</li>`);i++;continue}
  if(/^\d+\.\s+/.test(s)){startList("ol");blocks.push(`<li>${inline(s.replace(/^\d+\.\s+/,""))}</li>`);i++;continue}
  finishList();buf.push(s);i++;
 }
 endSection();
 return {html:blocks.join("\n"),sections};
}
function makePage(md) {
 const rendered=renderBrief(md);
 const toc=rendered.sections.map(x=>`<a href="#${x.id}"><span>${x.n.padStart(2,"0")}</span>${esc(x.title)}</a>`).join("\n");
 const meta=["Prepared","Founder and coach","Organization","Stage","Research status"].map(label=>{const hit=md.match(new RegExp(`\\*\\*${label}:\\*\\*\\s+([^\\n]+)`));return hit?`<div class="al-meta-item"><dt>${esc(label)}</dt><dd>${inline(hit[1].trim())}</dd></div>`:""}).join("\n");
 const digest=md.length+"-"+rendered.sections.length; // structural guard, not security checksum
 return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Athletic Life | Speed &amp; Form</title>
<meta name="description" content="FORM: the athletic life. An independent strategy, human experience and product opportunity research brief.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://speedandform.com/the-athletic-life/">
<meta name="theme-color" content="#0b0b0b">
<link rel="icon" href="/favicon.ico">
<link rel="preload" href="/assets/site/fonts/inter-tight-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/athletic-life.css?v=20261028">
<meta property="og:type" content="article">
<meta property="og:title" content="The Athletic Life | FORM">
<meta property="og:description" content="Independent Strategy, Human Experience &amp; Product Opportunity Research Brief">
<meta property="og:url" content="https://speedandform.com/the-athletic-life/">
<meta property="og:site_name" content="Speed &amp; Form">
<meta property="og:image" content="https://speedandform.com/og/public-index-20261006.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Athletic Life | FORM">
<meta name="twitter:description" content="Independent Strategy, Human Experience &amp; Product Opportunity Research Brief">
<meta name="twitter:image" content="https://speedandform.com/og/public-index-20261006.jpg">
<meta name="form-brief-source" content="the-athletic-life/brief.md">
<meta name="form-brief-check" content="${digest}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"The Athletic Life","datePublished":"2026-10-28","author":{"@type":"Person","name":"Brice Ikouebe"},"publisher":{"@type":"Organization","name":"Speed & Form"},"mainEntityOfPage":"https://speedandform.com/the-athletic-life/"}</script>
</head>
<body class="al-page">
<a class="al-skip" href="#brief">Skip to the brief</a>
<div class="al-reading-progress" aria-hidden="true"><span id="al-progress"></span></div>
<header class="al-header"><a href="/" class="al-header-logo" aria-label="Speed and Form home"><img src="/assets/brand/kit/emblem/sf-emblem-bone.svg" alt="" width="96" height="40"></a><a class="al-home" href="/">Speed &amp; Form <span aria-hidden="true">↗</span></a></header>
<main>
 <section class="al-hero" id="top" aria-labelledby="al-title">
   <div class="al-hero-wrap">
     <div class="al-hero-copy">
       <p class="al-eyebrow">FORM</p>
       <h1 id="al-title">The Athletic Life<span class="al-period">.</span></h1>
       <p class="al-deck">Independent Strategy, Human Experience &amp; Product Opportunity Research Brief</p>
     </div>
     <figure class="al-hero-photo"><img src="/media/library/bw-group-portrait-1200.webp" alt="FORM athletes in a group portrait" width="1200" height="800" fetchpriority="high"></figure>
   </div>
   <dl class="al-meta">${meta}</dl>
 </section>
 <div class="al-reading-frame" id="brief">
   <div class="al-mobile-index"><details><summary>Contents <span aria-hidden="true">+</span></summary><nav aria-label="Sections">${toc}</nav></details></div>
   <div class="al-columns">
     <aside class="al-aside" aria-label="Article navigation"><div class="al-aside-inner"><div class="al-aside-title">CONTENTS</div><nav aria-label="Sections">${toc}</nav><a class="al-aside-top" href="#top">Back to top ↑</a></div></aside>
     <article class="al-article" aria-label="The Athletic Life full research brief">${rendered.html}</article>
   </div>
 </div>
</main>
<footer class="al-footer"><div class="al-footer-inner"><a class="al-footer-logo" href="/"><img src="/assets/brand/kit/emblem/sf-emblem-bone.svg" alt="Speed and Form" width="132" height="50"></a><a href="#top">Back to top ↑</a><a href="/">Speed &amp; Form ↗</a></div></footer>
<script>
(()=>{const bar=document.getElementById('al-progress');const a=[...document.querySelectorAll('.al-aside nav a')];const chapters=a.map(x=>document.getElementById(x.hash.slice(1))).filter(Boolean);
function update(){const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?Math.min(100,Math.max(0,100*scrollY/max)):0)+'%';let active=chapters[0];for(const node of chapters){if(node.getBoundingClientRect().top<innerHeight*.33)active=node;else break;}for(const link of a)link.toggleAttribute('aria-current',!!active&&link.hash==='#'+active.id);}
let requested=false;addEventListener('scroll',()=>{if(!requested){requested=true;requestAnimationFrame(()=>{requested=false;update()})}},{passive:true});addEventListener('resize',update);update();document.querySelectorAll('.al-mobile-index nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.al-mobile-index details')?.removeAttribute('open')}));})();
</script>
</body></html>`;
}
function build(){const dir=path.join(ROOT,'the-athletic-life');const md=fs.readFileSync(path.join(dir,'brief.md'),'utf8');const html=makePage(md);fs.writeFileSync(path.join(dir,'index.html'),html);return {sections:(md.match(/^## \d+\./gm)||[]).length,bytes:html.length}}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build,renderBrief,makePage};
