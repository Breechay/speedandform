/* October 12, 2026: the app pages on the house rules. Replaces the frozen Pass 5 source checks, which pinned files that have since changed. docs/BRAND.md, "App pages". */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const visible=h=>h.slice(h.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
const schema=h=>JSON.parse((h.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/)||[])[1]||'{}');
function check(file,{name,store,css,stray}){
  const h=read(file),text=visible(h);
  assert.equal((h.match(/<h1\b/g)||[]).length,1,file+': one headline');
  assert.ok(h.includes('<title>'+name.replace('&','&amp;')),file+': title leads with the product name');
  assert.ok(h.includes(store),file+': App Store link unchanged');
  assert.ok(/class="[^"]*sf-brand[^"]*" href="\/" aria-label="Speed and Form home"><\/a>/.test(h),file+': the SF emblem alone, linking home');
  assert.ok(!stray.test(text),file+': no retired product name on the page');
  const graph=JSON.stringify(schema(h));assert.ok(graph.includes('"name":"'+name+'"'),file+': structured data names the app');
  const sheet=read(css);assert.ok(sheet.includes('"Inter Tight"')&&sheet.includes('"JetBrains Mono"'),css+': house typefaces');
  assert.ok(!/fonts\.googleapis|jost-latin/.test(h+sheet.slice(sheet.indexOf('October 12, 2026'))),file+': no outside fonts');
}
module.exports={check};
