/* Local, public-catalog search. No third-party search service or query tracking. */
(function(root){
 'use strict';
 const stop=new Set('a an the to of for in on is it i my how what why should do does can with and or are be from at feel'.split(' '));
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function near(a,b){if(a.length<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++;}return n+(i<a.length||j<b.length?1:0)<=1;}
 function rank(entries,query){const q=normalize(query),words=q.split(' ').filter(w=>w.length>1&&!stop.has(w));if(!words.length)return [];
  return entries.map((entry,index)=>{const title=normalize(entry.title),keys=normalize((entry.keywords||[]).join(' ')),body=normalize(entry.description),terms=(title+' '+keys).split(' ');let score=title===q?120:title.includes(q)?65:0;let matched=0;
   words.forEach(w=>{let s=title.includes(w)?20:keys.includes(w)?14:body.includes(w)?4:terms.some(t=>near(w,t))?7:0;if(s)matched++;score+=s;});score+=matched===words.length?18:0;return {entry,score,index};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,40).map(x=>x.entry);
 }
 if(typeof module==='object'&&module.exports)module.exports={normalize,near,rank};
 if(!root.document)return;
 const d=root.document,input=d.getElementById('discovery-query'),form=d.getElementById('discovery-search'),out=d.getElementById('discovery-output'),status=d.getElementById('discovery-status'),clear=d.getElementById('discovery-clear');if(!input||!out)return;
 let entries=[],state='loading',timer,controller;
 function node(tag,text,cls){const e=d.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function setURL(push=false){const u=new URL(root.location);const q=input.value.trim().slice(0,180);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');if(u.href!==root.location.href)root.history[push?'pushState':'replaceState']({},'',u);}
 function action(text,fn){const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;}
 function render(){const q=input.value.trim().slice(0,180);clear.hidden=!q;out.replaceChildren();
  if(state==='loading'){status.textContent='Loading the Library…';return;}
  if(state==='error'){status.textContent='Search is unavailable right now.';const box=node('div',undefined,'discovery-empty');box.append(node('h2','The Library is still open.'),node('p','The search list could not load. Try again, or browse the topics instead.'),action('Try again',load));const a=node('a','Browse the Library');a.href='/library';box.append(a);out.append(box);return;}
  const results=q?rank(entries,q):entries.filter(e=>e.category==='start');status.textContent=q?`${results.length} ${results.length===1?'result':'results'} for “${q}”`:'A few places to start';
  if(!results.length){const box=node('div',undefined,'discovery-empty');box.append(node('h2','Try the idea in a few words.'),node('p','Search for a topic such as “easy running,” “half marathon,” or “strength.” You can also browse the full Library.'));['easy running','half marathon','strength','HYROX'].forEach(s=>box.append(action(s,()=>{input.value=s;setURL(true);render();input.focus();})));const a=node('a','Browse every topic');a.href='/library';box.append(a);out.append(box);return;}
  const list=node('ul',undefined,'discovery-rows');for(const e of results){const li=node('li'),a=node('a',undefined,'discovery-link'),body=node('span');a.href=e.url;body.append(node('span',e.type||'Guide','discovery-result-type'),node('strong',e.title),node('small',e.description));const arrow=node('span','→','discovery-arrow');arrow.setAttribute('aria-hidden','true');a.append(body,arrow);li.append(a);list.append(li);}out.append(list);
 }
 async function load(){if(controller)controller.abort();controller=new AbortController();state='loading';render();const timeout=setTimeout(()=>controller.abort(),8000);try{const r=await fetch('/search-index.json',{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data)||!data.length||data.some(e=>typeof e.title!=='string'||!/^\/(?!\/)/.test(e.url)||typeof e.description!=='string'))throw Error('Invalid search catalog');entries=data;state='ready';}catch(e){state='error';}finally{clearTimeout(timeout);render();}}
 input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{setURL();render();},120);});
 form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);setURL(true);render();});
 clear.addEventListener('click',()=>{clearTimeout(timer);input.value='';setURL();render();input.focus();});
 root.addEventListener('popstate',()=>{input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);render();});
 load();
})(typeof window==='object'?window:globalThis);
