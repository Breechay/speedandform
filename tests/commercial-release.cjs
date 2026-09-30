/* Static contracts for the public commercial release, not layout snapshots. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const routes=['','coaching/miami/','coaching/strength/','analysis/','work/','work/ai-setup/','work/photo-video/'];
const sitemap=fs.readFileSync('sitemap.xml','utf8'),search=JSON.parse(fs.readFileSync('search-index.json','utf8'));
for(const route of routes){
 const file=route+'index.html',html=fs.readFileSync(file,'utf8'),head=html.split('</head>')[0];
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,file+': unique IDs');
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,file+': one main heading');
 assert.equal((head.match(/<title>/g)||[]).length,1,file+': one title');
 assert.ok(head.includes('href="https://speedandform.com/'+route+'"'),file+': canonical');
 assert.equal((head.match(/name="description"/g)||[]).length,1,file+': one description');
 assert.match(head,/max-image-preview:large/);assert.doesNotMatch(head,/noindex/);
 assert.ok(sitemap.includes('https://speedandform.com/'+route+'</loc>'),file+': sitemap');
 if(route)assert.ok(search.some(x=>x.url==='/'+route),file+': on-site search');
 assert.ok(html.includes('sf-brand')&&html.includes('/css/sf-brand.css'),file+': shared identity');
 for(const m of head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
  const schema=JSON.parse(m[1]);assert.equal(schema['@context'],'https://schema.org');
  assert.doesNotMatch(m[1],/aggregateRating|reviewCount|streetAddress/);
 }
 for(const m of html.matchAll(/(?:src|href)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g)){
  const filePath=m[1].replace(/^\//,'');if(!filePath)continue;
  assert.ok([filePath,filePath+'.html',path.join(filePath,'index.html')].some(f=>fs.existsSync(f)),file+': local link '+m[1]);
 }
 assert.ok(!html.includes('STRIPE_SECRET')&&!html.includes('service_role'),file+': no privileged credentials');
}
const home=fs.readFileSync('index.html','utf8');
assert.ok(home.includes('sfSubmitInquiry(inquiry)'));assert.match(home,/receipt.accepted === true/);
assert.match(home,/escapeHTML\(r\[1\]\)/);assert.match(home,/if \(sending\) return/);
assert.ok(home.includes('Run + Strength · $1,800 / 8 weeks'));assert.ok(home.includes('$1,200'));
assert.doesNotMatch(home,/href="\/the-method">Read the method/);
const inquiry=fs.readFileSync('js/commercial-inquiry.js','utf8');
assert.ok(inquiry.includes('AbortController')&&inquiry.includes('15000'));
assert.ok(inquiry.includes('receipt.accepted!==true'));
assert.ok(inquiry.includes("campaign.get('form_qa')==='1'"),'Explicit QA blocks live writes');
assert.ok(inquiry.includes("status.dataset.state='error'"));
console.log('PASS: seven public pages, metadata, schema, sitemap, discovery, local assets, accepted-only receipt and existing prices.');
