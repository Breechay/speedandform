/* Local, public-catalog search. No third-party search service or query tracking. */
(function(root){
 'use strict';
 const stop=new Set('a an the to of for in on is it i my me how what why when where which should do does did can could with and or are be being from at feel feels am im you your get gets getting have has its this that as after before about always so then than'.split(' '));
 const aliases={
  tempo:['threshold'],sore:['pain','recovery'],soreness:['pain','recovery'],injured:['injury','return'],injury:['recovery','pain'],
  beginner:['start'],new:['start'],comeback:['return'],form:['mechanics','gait'],gait:['mechanics','form'],
  gym:['strength'],lifting:['strength'],workout:['session'],workouts:['sessions'],photo:['photography'],photos:['photography'],
  endurance:['durability','long'],schedule:['week'],program:['plan'],programs:['plans'],
  tired:['fatigue','recovery'],food:['fueling','nutrition'],eat:['fueling','nutrition'],carbs:['carbohydrate','fueling'],
  breathless:['breathing','easy'],slowly:['slow','easy'],injuries:['injury'],
  v02max:['vo2max'],v02:['vo2'],vo2:['vo2max'],kilometre:['kilometer'],kilometres:['kilometer']
 };
 const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const singular=w=>({six:'6',eight:'8',twelve:'12',sixteen:'16',running:'run',runs:'run',workouts:'workout',sessions:'session',intervals:'interval',strides:'stride',runners:'runner',shoes:'shoe',plans:'plan',weeks:'week',days:'day',photos:'photo',terms:'term',kilometres:'kilometer',kilometers:'kilometer'})[w]||w;
 const words=s=>normalize(s).split(' ').filter(Boolean).map(singular);
 function near(a,b){if(a.length<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(a.length<=b.length)j++;}return n+(i<a.length||j<b.length?1:0)<=1;}
 function rank(entries,query){
  const q=normalize(String(query||'').slice(0,180));
  let tokens=[...new Set(words(q).filter(w=>(w.length>1||/^\d$/.test(w))&&!stop.has(w)))];
  // A generic word must not make every running page match a specific question.
  const specific=tokens.filter(w=>!['run','running','training','runner'].includes(w));
  if(specific.length)tokens=specific;
  if(!tokens.length)return [];
  return entries.map((entry,index)=>{
   const title=normalize(entry.title),keys=new Set(words((entry.keywords||[]).join(' '))),body=new Set(words(entry.description)),titles=new Set(words(title));
   const questions=(entry.questions||[]).map(normalize),questionWords=new Set(questions.flatMap(words));
   let score=title===q?180:title.includes(q)&&q.length>4?75:0;
   if(questions.includes(q))score+=220;
   let matched=0,exact=0;
   for(const w of tokens){
    const direct=titles.has(w)?30:keys.has(w)?20:questionWords.has(w)?16:body.has(w)?7:0;
    let value=direct;
    if(direct)exact++;
    for(const v of aliases[w]||[])value=Math.max(value,titles.has(singular(v))?17:keys.has(singular(v))?12:body.has(singular(v))?4:0);
    if(!value&&w.length>=5&&[...titles,...keys].some(t=>near(w,t)))value=9;
    if(value)matched++;
    score+=value;
   }
   const coverage=matched/tokens.length;
   // Partial results are useful only if most of the meaningful question matches.
   if(!matched||coverage<.6)return {entry,score:0,index};
   score+=coverage===1?36:0;
   score+=exact===tokens.length?12:0;
   if(entry.type==='Field note'&&/\b(note|article|essay|writing)\b/.test(q))score+=24;
   return {entry,score,index};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,40).map(x=>x.entry);
 }
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
 const families=typeof module==='object'&&module.exports?require('./library-families.js'):root.FORM_LIBRARY_FAMILIES||{};
 if(typeof module==='object'&&module.exports)module.exports={normalize,near,rank,groups:tocOrder};
 if(!root.document)return;
 const d=root.document,input=d.getElementById('discovery-query'),form=d.getElementById('discovery-search'),out=d.getElementById('discovery-output'),status=d.getElementById('discovery-status'),clear=d.getElementById('discovery-clear'),browse=d.getElementById('discovery-browse'),toc=d.getElementById('discovery-toc');if(!input||!out)return;
 const validKinds=new Set(['Lesson','Routine','Shelf']);
 const selectedKind=()=>{const value=new URLSearchParams(root.location.search).get('kind');return validKinds.has(value)?value:'';};
 let entries=[],state='loading',timer,controller,kind=selectedKind();
 const pageLabel=e=>e.kind||e.type||'Page';
 function node(tag,text,cls){const e=d.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function setURL(push=false){const u=new URL(root.location);const q=input.value.trim().slice(0,180);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');if(kind)u.searchParams.set('kind',kind);else u.searchParams.delete('kind');if(u.href!==root.location.href)root.history[push?'pushState':'replaceState']({},'',u);}
 function action(text,fn){const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;}
 function renderBrowse(){
  if(!toc)return;toc.replaceChildren();
  for(const [title,description,match] of tocOrder){
   const items=entries.filter(e=>match(e)&&(!kind||e.kind===kind));if(!items.length)continue;
   const section=node('section',undefined,'discovery-toc-section');section.id='topic-'+normalize(title).replace(/ /g,'-');
   const head=node('div',undefined,'discovery-toc-head');
   const heading=node('h3'),link=node('a',title,'discovery-heading-link');link.href='#'+section.id;heading.append(link);
   head.append(node('p',String(items.length).padStart(2,'0'),'discovery-toc-count'),heading,node('p',description));
   const lists=node('div',undefined,'discovery-toc-family');
   const family=families[items[0].category];
   const sets=family?family.groups.map(g=>({title:g.title,items:items.filter(e=>g.urls.includes(e.url))})):[{items}];
   for(const set of sets){
   if(!set.items.length)continue;
   const list=node('ul',undefined,'discovery-toc-list');
   if(set.title)lists.append(node('h4',set.title,'discovery-subgroup'));
   for(const e of set.items){
    const li=node('li'),a=node('a',undefined,'discovery-toc-link');a.href=e.url;
    a.append(node('span',e.title,'discovery-toc-title'),node('small',pageLabel(e)));
    li.append(a);list.append(li);
   }
   lists.append(list);
   }
   section.append(head,lists);toc.append(section);
  }
 }
 function render(){const q=input.value.trim().slice(0,180);clear.hidden=!q;out.replaceChildren();if(browse)browse.hidden=!!q;
  d.querySelectorAll('[data-library-kind]').forEach(a=>{if(a.dataset.libraryKind===kind)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  if(state==='loading'){status.textContent='Loading the Library…';return;}
  if(state==='error'){status.textContent='Search is unavailable right now.';const box=node('div',undefined,'discovery-empty');box.append(node('h2','The Library is still open.'),node('p','The search list could not load. Try again, or browse the topics instead.'),action('Try again',load));const a=node('a','Browse the Library');a.href='/library';box.append(a);out.append(box);return;}
  const pool=entries.filter(e=>!kind||e.kind===kind);
  if(!q){status.textContent=kind?`Browse ${pool.length} ${kind.toLowerCase()}${pool.length===1?'':'s'} below, or search within this format.`:`Search ${entries.length} public pages, or browse the complete index below.`;renderBrowse();return;}const results=rank(pool,q);status.textContent=`${results.length} ${results.length===1?'result':'results'} for “${q}”${kind?' · '+kind.toLowerCase()+'s':''}`;
  if(!results.length){const box=node('div',undefined,'discovery-empty');box.append(node('h2','No close answer yet.'),node('p','Try a shorter question, such as “threshold pace,” “easy runs,” or “half-marathon plan.” Or browse all the topics below.'));['threshold pace','easy runs','half marathon','strength'].forEach(s=>box.append(action(s,()=>{input.value=s;setURL(true);render();input.focus();})));box.append(action('Browse the complete index',()=>{input.value='';kind='';setURL(true);render();}));out.append(box);return;}
  const groupOrder=[...new Set(results.map(e=>e.kind||'Other pages'))];
  for(const group of groupOrder){const section=node('section',undefined,'discovery-result-group');section.append(node('h2',group==='Other pages'?group:group==='Shelf'?'Shelves':group+'s'));const list=node('ul',undefined,'discovery-rows');for(const e of results.filter(e=>(e.kind||'Other pages')===group)){const li=node('li'),a=node('a',undefined,'discovery-link'),body=node('span');a.href=e.url;body.append(node('span',pageLabel(e),'discovery-result-type'),node('strong',e.title),node('small',e.description));const arrow=node('span','→','discovery-arrow');arrow.setAttribute('aria-hidden','true');a.append(body,arrow);li.append(a);list.append(li);}section.append(list);out.append(section);}
 }
 async function load(){if(controller)controller.abort();controller=new AbortController();state='loading';render();const timeout=setTimeout(()=>controller.abort(),8000);try{const r=await fetch('/search-index.json',{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data)||!data.length||data.some(e=>typeof e.title!=='string'||!/^\/(?!\/)/.test(e.url)||typeof e.description!=='string'))throw Error('Invalid search catalog');entries=data;state='ready';}catch(e){state='error';}finally{clearTimeout(timeout);render();}}
 input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{setURL();render();},120);});
 form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);setURL(true);render();});
 clear.addEventListener('click',()=>{clearTimeout(timer);input.value='';setURL();render();input.focus();});
 d.addEventListener('keydown',e=>{const tag=(e.target&&e.target.tagName||'').toLowerCase();if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!/input|textarea|select/.test(tag)&&!e.target.isContentEditable){e.preventDefault();input.focus();input.select();}if(e.key==='Escape'&&d.activeElement===input&&input.value){clearTimeout(timer);input.value='';setURL();render();}});
 root.addEventListener('popstate',()=>{clearTimeout(timer);input.value=(new URLSearchParams(root.location.search).get('q')||'').slice(0,180);kind=selectedKind();render();});
 d.querySelectorAll('[data-library-kind]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();clearTimeout(timer);kind=a.dataset.libraryKind;setURL(true);render();}));
 d.querySelectorAll('[data-search-example]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();clearTimeout(timer);input.value=new URL(a.href).searchParams.get('q')||'';setURL(true);render();input.focus();}));
 load();
})(typeof window==='object'?window:globalThis);
