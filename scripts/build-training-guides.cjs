'use strict';
const fs=require('node:fs'),path=require('node:path');
const {render:foundationRender}=require('./build-guides.cjs');
const guides=require('./training-guide-content.cjs');
const ROOT=path.resolve(__dirname,'..'),VERSION='20260917-p4b';
const labels={options:'Fewer or more days',strength:'Add strength',patterns:'Four patterns',placement:'Where it fits',priorities:'The priorities',movement:'Movement or rest',race:'After a race',before:'Before the run',during:'During the run',count:'Count your fuel',fluids:'Fluids',after:'After the run',practice:'Practice your plan'};
function render(g,previous){
 return foundationRender(g,previous)
  .replace(/<aside class="guide-contents"[\s\S]*?<\/aside>/,aside=>aside.replace(/<a href="#([^"]+)">([^<]+)<\/a>/g,(all,id,text)=>`<a href="#${id}">${labels[id]||text}</a>`))
  .replace('data-guide="20260917-p4a"',`data-guide="${VERSION}"`)
  .replace('</head>',`<link rel="stylesheet" href="/css/training-guides.css?v=${VERSION}">\n${g.route==='/fueling'?`<script defer src="/js/training-tools.js?v=${VERSION}"></script>\n`:''}</head>`);
}
function build(){for(const g of guides){const p=path.join(ROOT,g.file);fs.writeFileSync(p,render(g,fs.readFileSync(p,'utf8')));}console.log('Built four training-support guides. No other page changed.');}
if(require.main===module)build();module.exports={guides,render,build,VERSION};
