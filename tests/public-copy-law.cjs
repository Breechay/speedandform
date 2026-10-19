'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const pages=['index.html','photos/index.html','people/index.html','runs/index.html','track/index.html','coaching/miami/index.html','form/index.html','forge-sculpt/index.html','library.html','contact.html'];
const banned=[
 /Explore the (?:photographs|training Library|archive)/i,
 /Browse the photographs/i,
 /Open the archive/i,
 /Frames from the track/i,
 /The practice\. Shared standards\./i,
 /From the practice/i,
 /Inside FORM/i,
 /How I coach/i,
 /The mornings\./i,
 /A simple loop/i,
 /Three ways in/i,
 /Five kinds of running/i,
 /Learn it\. Use it\. Come back to it\./i,
 /Plain answers you can use, remember and share\./i,
 /Want the week built around you\?/i
];
const normalize=s=>s.replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const file of pages){
 const html=read(file);
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.replace(/<!-- Shared site menu -->[\s\S]*$/,'');
 const visible=normalize(main);
 for(const re of banned)assert.doesNotMatch(visible,re,file+': no tutorial or page narration');
}
const menu=read('scripts/site-menu-panel.html');
assert.doesNotMatch(menu,/<small\b/i,'Canonical menu has destination names only');
assert.doesNotMatch(normalize(menu),/\bExplore\b|The Team/i,'No ambiguous group label');
for(const route of ['/athletes/','/runs/','/photos/']){
 assert.equal((menu.match(new RegExp('href="'+route+'"','g'))||[]).length,1,'One menu destination '+route);
}
const home=read('index.html'),coaching=read('coaching/miami/index.html'),app=read('coaching/apply/index.html');
assert.match(home,/Run farther\.<br>Feel smoother\.<br>Get stronger/);
assert.match(home,/You can hit the pace\.<br>Can you hold it\?/);
assert.match(home,/Tell me what you want to be capable of\./);
assert.match(home,/home-bend-only/,'Continuous bend survives copy reduction');
assert.doesNotMatch(home,/<div class="questionnaire"/,'Intake does not crowd homepage');
assert.match(app,/class="questionnaire"/,'Functional questionnaire stays on application page');
assert.match(coaching,/>Run better\.</);
assert.match(coaching,/>I look for ease\.</);
assert.match(read('runs/index.html'),/>Run<br>together\.</);
assert.match(read('form/index.html'),/Train for your<br>next race\./);
assert.match(read('forge-sculpt/index.html'),/Build muscle<br>with a plan\./);
assert.match(read('library.html'),/<h1>The Library\.<\/h1>/);
const policy=read('docs/editorial/PUBLIC_COPY_LAW_2026-10-19.md');
assert.match(policy,/Empty space is finished/);
assert.match(policy,/Do not delete a genuinely necessary fact/);
console.log('PASS: public copy law, human voice, original hero-to-chapter bend, unique navigation and preserved commercial workflow.');
