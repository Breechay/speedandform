/* Local, public-catalog search. No third-party search service or query tracking. */
(function(root){
 'use strict';
 const stop=new Set('a an the to of for in on is it i my how what why should do does can with and or are be from at feel'.split(' '));
 const aliases={
  tempo:['threshold'],sore:['pain','recovery'],soreness:['pain','recovery'],injured:['injury','return'],injury:['recovery','pain'],
  beginner:['start'],new:['start'],comeback:['return'],form:['mechanics','gait'],gait:['mechanics','form'],
  gym:['strength'],lifting:['strength'],workout:['session'],workouts:['sessions'],photo:['photography'],photos:['photography'],
  endurance:['durability','long'],schedule:['week','training'],program:['plan'],programs:['plans']
 };
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function near(a,b){if(a.length<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++;}return n+(i<a.length||j<b.length?1:0)<=1;}
 function rank(entries,query){const q=normalize(query),words=q.split(' ').filter(w=>w.length>1&&!stop.has(w));if(!words.length)return [];
  return entries.map((entry,index)=>{const title=normalize(entry.title),keys=normalize((entry.keywords||[]).join(' ')),body=normalize(entry.description),terms=(title+' '+keys).split(' ');let score=title===q?160:title.startsWith(q)?105:title.includes(q)?80:0;if(keys.includes(q))score+=34;if(body.includes(q))score+=12;let matched=0;
   words.forEach(w=>{const variants=[w,...(aliases[w]||[])];let s=0;for(const v of variants)s=Math.max(s,title.includes(v)?24:keys.includes(v)?16:body.includes(v)?5:terms.some(t=>near(v,t))?7:0);if(s)matched++;score+=s;});score+=matched===words.length?28:matched/words.length>=.6?6:-8;score+=entry.type==='Field note'&&/(note|article|essay|writing)/.test(q)?24:0;return {entry,score,index};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,40).map(x=>x.entry);
 }
 if(typeof module==='object'&&module.exports)module.exports={normalize,near,rank};
 if(!root.document)return;
 const d=root.document,input=d.getElementById('discovery-query'),form=d.getElementById('discovery-search'),out=d.getElementById('discovery-output'),status=d.getElementById('discovery-status'),clear=d.getElementById('discovery-clear'),browse=d.getElementById('discovery-browse'),toc=d.getElementById('discovery-toc');if(!input||!out)return;
 let entries=[],state='loading',timer,controller;
 function node(tag,text,cls){const e=d.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function setURL(push=false){const u=new URL(root.location);const q=input.value.trim().slice(0,180);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');if(u.href!==root.location.href)root.history[push?'pushState':'replaceState']({},'',u);}
 function action(text,fn){const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;}
 const tocOrder=[
  ['Start here','Starting, resetting and choosing the right next step.',e=>e.category==='start'],
  ['Work with Brice','Coaching, analysis and other ways to work together.',e=>e.category==='coaching'],
  ['Half marathon','Plans, pacing, readiness and race development.',e=>e.category==='half-marathon'],
  ['Running & training','Effort, sessions, weeks, physiology, method and progression.',e=>e.category==='training'],
  ['Strength & movement','Strength, mechanics, mobility and running form.',e=>e.category==='movement'],
  ['Racing & fueling','Race execution, fueling, shoes and practical tools.',e=>e.category==='race'],
  ['Recovery & return','Fatigue, pain, interruptions, load and coming back.',e=>e.category==='recovery'],
  ['Studies & evidence','Living athlete studies and the questions being tested in practice.',e=>e.category==='practice'&&['Study','Studies'].includes(e.type)],
  ['Field Notes & practice','Writing, photographs, community and the public running practice.',e=>e.category==='practice'&&['Field note','Gallery','Community'].includes(e.type)],
  ['Plans, apps & tools','Published plans, FORM products and practical training tools.',e=>e.category==='practice'&&!['Study','Studies','Field note','Gallery','Community'].includes(e.type)],
  ['House & access','Contact, brand files, questions and the policies around the site.',e=>e.category==='house']
 ];
 function renderBrowse(){
  if(!toc)return;toc.replaceChildren();
  for(const [title,description,match] of tocOrder){
   const items=entries.filter(match);if(!items.length)continue;
   const section=node('section',undefined,'discovery-toc-section');
   const head=node('div',undefined,'discovery-toc-head');
   head.append(node('p',String(items.length).padStart(2,'0'),'discovery-toc-count'),node('h3',title),node('p',description));
   const list=node('ul',undefined,'discovery-toc-list');
   for(const e of items){
    const li=node('li'),a=node('a',undefined,'discovery-toc-link');a.href=e.url;
    a.append(node('span',e.title,'discovery-toc-title'),node('small',e.type||'Guide'));
    li.append(a);list.append(li);
   }
   section.append(head,list);toc.append(section);
  }
 }
 function render(){const q=input.value.trim().slice(0,180);clear.hidden=!q;out.replaceChildren();if(browse)browse.hidden=!!q;
  if(state==='loading'){status.textContent='Loading the Library…';return;}
  if(state==='error'){status.textContent='Search is unavailable right now.';const box=node('div',undefined,'discovery-empty');box.append(node('h2','The Library is still open.'),node('p','The search list could not load. Try again, or browse the topics instead.'),action('Try again',load));const a=node('a','Browse the Library');a.href='/library';box.append(a);out.append(box);return;}
  if(!q){status.textContent=`Search ${entries.length} public pages, or browse the complete index below.`;renderBrowse();return;}const results=rank(entries,q);status.textContent=`${results.length} ${results.length===1?'result':'results'} for “${q}”`;
  if(!results.length){const box=node('div',undefined,'discovery-empty');box.append(node('h2','Try the idea in a few words.'),node('p','Search for a topic such as “easy running,” “half marathon,” or “strength.” You can also browse the full Library.'));['easy running','half marathon','strength','HYROX'].forEach(s=>box.append(action(s,()=>{input.value=s;setURL(true);render();input.focus();})));const a=node('a','Browse every topic');a.href='/library';box.append(a);out.append(box);return;}
  const list=node('ul',undefined,'discovery-rows');for(const e of results){const li=node('li'),a=node('a',undefined,'discovery-link'),body=node('span');a.href=e.url;body.append(node('span',e.type||'Guide','discovery-result-type'),node('strong',e.title),node('small',e.description));const arrow=node('span','→','discovery-arrow');arrow.setAttribute('aria-hidden','true');a.append(body,arrow);li.append(a);list.append(li);}out.append(list);
 }
 async function load(){if(controller)controller.abort();controller=new AbortController();state='loading';render();const timeout=setTimeout(()=>controller.abort(),8000);try{const r=await fetch('/search-index.json',{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data)||!data.length||data.some(e=>typeof e.title!=='string'||!/^\/(?!\/)/.test(e.url)||typeof e.description!=='string'))throw Error('Invalid search catalog');entries=data;state='ready';}catch(e){state='error';}finally{clearTimeout(timeout);render();}}
 input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{setURL();render();},120);});
 form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);setURL(true);render();});
 clear.addEventListener('click',()=>{clearTimeout(timer);input.value='';setURL();render();input.focus();});
 d.addEventListener('keydown',e=>{const tag=(e.target&&e.target.tagName||'').toLowerCase();if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!/input|textarea|select/.test(tag)){e.preventDefault();input.focus();input.select();}if(e.key==='Escape'&&d.activeElement===input&&input.value){input.value='';setURL();render();}});
 root.addEventListener('popstate',()=>{input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);render();});
 load();
})(typeof window==='object'?window:globalThis);
