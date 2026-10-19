'use strict';
// Static public navigation. The sitemap owns eligibility; private/account routes
// are never scanned. Run last so every generated page retains the same drawer.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),VERSION='20261019-photographic-drawer';
const PANEL=fs.readFileSync(path.join(__dirname,'site-menu-panel.html'),'utf8').trim();
const TOGGLE='<a class="sf-menu-toggle" href="#site-menu" aria-controls="site-menu" aria-label="Menu"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"/></svg></a>';
const EXCLUDED=/^(?:coach|athlete|auth|account|record|private|studio|form-app|forge-app|tests|docs)(?:\/|\.html)|^(?:form|forge-sculpt)\/(?:train|auth|account)\//;
function collect(root=ROOT){
 const files=new Set(['index.html','search.html','404.html','privacy.html','terms.html']);
 const urls=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>https:\/\/speedandform\.com([^<]*)<\/loc>/g)].map(m=>m[1]);
 for(const app of ['form','forge-sculpt'])for(const page of ['support','privacy','terms'])urls.push(`/${app}/${page}/`);
 for(const url of urls){const route=url.replace(/^\/+|\/+$/g,'');if(!route)continue;if(route==='athletes'){files.add('people/index.html');continue;}for(const file of [route+'.html',route+'/index.html'])if(fs.existsSync(path.join(root,file))){files.add(file);break;}}
 return [...files].filter(file=>!EXCLUDED.test(file)&&fs.existsSync(path.join(root,file))&&(/^(?:search|404)\.html$|^(?:form|forge-sculpt)\/(?:support|privacy|terms)\//.test(file)||!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(fs.readFileSync(path.join(root,file),'utf8')))).sort();
}
// Tiny structural tokenizer: scripts/styles/comments are opaque, and offsets
// let us alter only the existing navigation without reserializing page content.
function elements(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 const tokens=/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi;
 for(const m of html.matchAll(tokens)){
  const token=m[0];if(token.startsWith('<!--')||m[1])continue;
  const tag=token.match(/^<\/?([\w-]+)/)[1].toLowerCase();
  if(token.startsWith('</')){let i=stack.length-1;while(i>=0&&stack[i].tag!==tag)i--;if(i>=0){const node=stack[i];node.close=m.index;node.end=m.index+token.length;stack.length=i;}continue;}
  const node={tag,start:m.index,openEnd:m.index+token.length,open:token,parent:stack.at(-1),close:null};nodes.push(node);
  if(!voids.has(tag)&&!token.endsWith('/>'))stack.push(node);
 }
 return nodes;
}
function addClass(open,name){return /\bclass=["']/.test(open)?open.replace(/\bclass=(["'])([^"']*)\1/,(_,q,c)=>`class=${q}${c} ${name}${q}`):open.replace(/>$/,` class="${name}">`);}
function transformHtml(html,file){
 let next=html.replace(/<!-- Shared site menu -->[\s\S]*?<!-- \/Shared site menu -->\s*/g,'');
 // Adopt the original homepage drawer once; future builds use the fragment.
 if(/id="site-menu"/.test(next)){
  const old=elements(next).find(n=>/\bid="site-menu"/.test(n.open));
  if(!old||!old.end)throw Error('Unclosed menu in '+file);
  next=next.slice(0,old.start)+next.slice(old.end);
 }
 if(!/aria-controls="site-menu"/.test(next)){
  const nodes=elements(next);
  const home=nodes.find(n=>n.tag==='a'&&/href=["'](?:\/|#top|https:\/\/speedandform\.com\/?)["']/.test(n.open)&&/(?:brand|wordmark|nav-home|logo|mark)/.test(n.open));
  let host=home?.parent;
  while(host&&!(['header','nav'].includes(host.tag)||/class=["'][^"']*\b(?:nav|masthead|topbar)\b/.test(host.open)))host=host.parent;
  if(!host||!host.close){
   const mast=`<header class="sf-public-masthead sf-menu-host"><a class="sf-brand" href="/" aria-label="Speed and Form home"></a>${TOGGLE}</header>`;
   if(home?.end)next=next.slice(0,home.start)+mast+next.slice(home.end);
   else next=next.replace(/<body\b[^>]*>/i,m=>m+'\n'+mast);
  }else{
  const inside=nodes.filter(n=>n.start>host.start&&n.close&&n.end<host.end);
  let target=inside.find(n=>n.tag==='nav')||inside.find(n=>/class=["'][^"']*\bactions\b/.test(n.open));
  if(!target){const children=inside.filter(n=>n.parent===host);target=children.length===1&&children[0].tag==='div'?children[0]:host;}
  const contact=inside.find(n=>n.tag==='a'&&n.start>target.start&&n.end<target.end&&/href=["']\/contact(?:\.html|\/)?["']/.test(n.open));
  let open=addClass(target.open,'sf-menu-host');
  // Keep page shortcuts. Contact remains a direct destination in the drawer.
  if(contact)next=next.slice(0,contact.start)+TOGGLE+next.slice(contact.end);
  else next=next.slice(0,target.close)+TOGGLE+next.slice(target.close);
  next=next.slice(0,target.start)+open+next.slice(target.openEnd);
  }
 }
 // Official rounded SF favicon, shared by public menu pages. ICO remains legacy fallback.
 if(!/rel=["']icon["']\s+type=["']image\/svg\+xml["']/.test(next)){
   next=next.replace(/<\/head>/i,'<link rel="icon" type="image/svg+xml" href="/assets/brand/kit/favicon/form-rounded.svg">\n</head>');
 }
 // Styles last: standalone article CSS must not recolor/reflow the drawer.
 if(next.includes('sf-public-masthead')&&!next.includes('/css/sf-brand.css'))next=next.replace(/<\/head>/i,'<link rel="stylesheet" href="/css/sf-brand.css?v=20261001">\n</head>');
 next=next.replace(/<link\b[^>]*href=["']\/css\/sf-menu\.css[^"']*["'][^>]*>\s*/g,'').replace(/<script\b[^>]*src=["']\/js\/sf-menu\.js[^"']*["'][^>]*>\s*<\/script>\s*/g,'');
 next=next.replace(/<\/head>/i,`<link rel="stylesheet" href="/css/sf-menu.css?v=${VERSION}">\n</head>`);
 next=next.replace(/<\/body>/i,`<!-- Shared site menu -->\n${PANEL}\n<!-- /Shared site menu -->\n<script defer src="/js/sf-menu.js?v=${VERSION}"></script>\n</body>`);
 return next;
}
function build(root=ROOT){let changed=0;const pages=collect(root);for(const file of pages){const full=path.join(root,file),before=fs.readFileSync(full,'utf8'),after=transformHtml(before,file);if(before!==after){fs.writeFileSync(full,after);changed++;}}return {pages,changed};}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={collect,transformHtml,build};
