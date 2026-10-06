'use strict';
// Reviewed public allowlist only. Run after page generators; never scan private rooms.
const fs=require('node:fs'),path=require('node:path');
const share=require('./share-metadata.cjs'),cards=require('../data/public-share.json');
const root=path.resolve(__dirname,'..'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function transform(html,file){const c=cards[file];if(!c)return html;if(/noindex/i.test(share.meta(html,'robots')))throw Error('Refuse noindex '+file);
const canonical=share.canonical(html,file),image=share.ORIGIN+c.image,info=share.imageInfo(root,image);const title=c.title,description=c.description;if(!title||!description)throw Error('Missing copy '+file);
const values={'og:type':share.meta(html,'og:type')||'website','og:title':title,'og:description':description,'og:url':canonical,'og:site_name':'Speed & Form','og:locale':'en_US','og:image':image,'og:image:secure_url':image,'og:image:type':info.type,'og:image:width':info.width,'og:image:height':info.height,'og:image:alt':c.alt,'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':c.alt};
let head=share.head(html).replace(/<!-- (?:\/?FORM share metadata[^>]*|\/?House share metadata[^>]*) -->\s*/g,'');
head=head.split(/(<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>)/gi).map(piece=>/^<(script|style)\b/i.test(piece)?piece:piece.replace(/<meta\b[^>]*>\s*/gi,tag=>{const a=share.attrs(tag);return share.KEYS.includes(a.property||a.name)||a.name==='description'?'':tag;})).join('');
head+=`<meta name="description" content="${esc(description)}">\n<!-- House share metadata: October 6 -->\n`+Object.entries(values).map(([k,v])=>`<meta ${k.startsWith('og:')?'property':'name'}="${k}" content="${esc(v)}">`).join('\n')+'\n<!-- /House share metadata -->\n';
// Only replace the old generic house image in homepage structured data.
if(file==='index.html')head=head.replaceAll('https://speedandform.com/og/speed-and-form-20261001.jpg',image);
return head+html.slice(html.toLowerCase().indexOf('</head>'));}
function build(){for(const f of Object.keys(cards)){const full=path.join(root,f);fs.writeFileSync(full,transform(fs.readFileSync(full,'utf8'),f));}console.log('Refreshed '+Object.keys(cards).length+' public-page previews.');}
if(require.main===module)build();module.exports={build,transform};
