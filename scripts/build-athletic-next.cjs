'use strict';
// What's next: edit the-athletic-life/next/items.json, then run this script.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),BASE='/the-athletic-life/',ROUTE=BASE+'next/',DIR=path.join(ROOT,ROUTE);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const head=(title,description,robots,canonical)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Speed &amp; Form</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#0b0b0b"><link rel="canonical" href="https://speedandform.com${canonical}"><meta name="robots" content="${robots}"><meta property="og:site_name" content="Speed &amp; Form"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | FORM"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://speedandform.com${canonical}"><meta property="og:image" content="https://speedandform.com/media/library/bw-lead-runner-1200.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)} | FORM"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="https://speedandform.com/media/library/bw-lead-runner-1200.webp"><link rel="icon" href="/favicon.ico"><link rel="preload" href="/assets/site/fonts/inter-tight-latin-variable.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/athletic-life.css?v=20261028"><link rel="stylesheet" href="/css/athletic-research.css?v=20261028"><link rel="stylesheet" href="/css/athletic-next.css?v=20261102"></head>`;
const masthead=`<header class="al-header"><a class="al-header-logo" href="/" aria-label="Speed and Form home"><img src="/assets/brand/kit/emblem/sf-emblem-bone.svg" width="96" height="40" alt=""></a><a class="al-home" href="${BASE}">The Athletic Life</a></header>`;
const collection=`<nav class="ar-collection-nav" aria-label="Athletic Life collection"><a href="${BASE}">North star</a><a href="${BASE}discoveries/">First discoveries</a><a href="${BASE}research/">Research</a><a href="${ROUTE}" aria-current="page">What's next</a></nav>`;
function makePage(data){
 const sections=data.sections.map(section=>`<section class="wn-section" aria-labelledby="wn-${esc(section.id)}"><div class="wn-head"><h2 id="wn-${esc(section.id)}">${esc(section.title)}</h2>${section.when?`<span class="wn-when">${esc(section.when)}</span>`:''}</div><ul class="wn-list">${section.items.map(item=>`<li class="wn-item"><h3>${esc(item.title)}</h3><p>${esc(item.line)}</p>${item.when?`<span class="wn-when">${esc(item.when)}</span>`:''}</li>`).join('')}</ul></section>`).join('');
 return `${head("What's next",'What is coming to the FORM app, what we are testing, and what we are thinking about.','index,follow,max-image-preview:large',ROUTE)}
<body class="al-page ar-page wn-page"><a class="al-skip" href="#whats-next">Skip to content</a>${masthead}
<main><header class="ar-opening ar-opening-photo wn-opening"><div><p class="ar-date">Updated ${esc(data.updated)}</p><h1>What's next</h1></div><figure><img src="/media/library/bw-lead-runner-1200.webp" width="1200" height="800" alt="Black and white: a runner leads another down the track toward the camera." fetchpriority="high"></figure></header>
${collection}
<div class="wn-frame" id="whats-next">${sections}
<section class="wn-section wn-ask" aria-labelledby="wn-ask"><h2 id="wn-ask">What should we build?</h2><form class="wn-form" name="whats-next" method="POST" action="${ROUTE}thanks/" data-netlify="true" netlify-honeypot="company"><input type="hidden" name="form-name" value="whats-next"><p class="wn-trap" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p><label class="wn-field"><span>Your idea</span><textarea name="idea" rows="4" maxlength="1000" required></textarea></label><label class="wn-field"><span>Name</span><input name="name" autocomplete="name" maxlength="80"></label><button type="submit">Send</button></form></section></div></main>
<footer class="ar-footer"><a href="${BASE}">The Athletic Life</a><a href="#whats-next">Back to top ↑</a><a href="/">Speed &amp; Form</a></footer></body></html>`;
}
function makeThanks(){
 return `${head('Got it','Thank you.','noindex,follow',ROUTE+'thanks/')}
<body class="al-page ar-page wn-page">${masthead}<main><header class="ar-opening wn-thanks"><div><h1>Got it.</h1><p><a href="${ROUTE}">Back to What's next</a></p></div></header></main></body></html>`;
}
function build(){
 const {transformHtml}=require('./build-site-menu.cjs');
 const data=JSON.parse(fs.readFileSync(path.join(DIR,'items.json'),'utf8'));
 fs.writeFileSync(path.join(DIR,'index.html'),transformHtml(makePage(data),ROUTE.slice(1)+'index.html').replace(/[ \t]+$/gm,''));
 fs.mkdirSync(path.join(DIR,'thanks'),{recursive:true});
 fs.writeFileSync(path.join(DIR,'thanks/index.html'),makeThanks());
 return {items:data.sections.reduce((n,s)=>n+s.items.length,0)};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build,makePage,makeThanks};
