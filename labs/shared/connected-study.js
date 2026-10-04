/* One approved public record graph and one guarded plan read for every study.
   No athlete memberships, private filings, auth tokens or coach notes are fetched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FORMConnectedStudy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MI=1.609344, BASE='/labs/same-pace-different-problem/', RPC='https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/paired_study_plans', KEY='sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(v,lang='en')=>typeof v==='string'?v:(v?.[lang]??v?.en??'');
const clock=v=>{const s=Math.round(v);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const distance=(v,from,to=from)=>{const n=from===to?v:from==='mi'?v*MI:v/MI;return `${Number(n.toFixed(from===to?2:1))} ${to}`;};
const pace=(low,high,unit)=>low==null?'':clock(low/(unit==='km'?MI:1))+(high!=null?'–'+clock(high/(unit==='km'?MI:1)):'+')+'/'+unit;
function validatePlans(raw){
 if(!raw||raw.schema_version!==1||!raw.athletes)throw Error('Unrecognized plan response');
 for(const name of ['elijah','simon']){
  const r=raw.athletes[name];if(!r||!['published','review_required','unavailable'].includes(r.state))throw Error('Invalid publication state');
  if(r.state!=='published'){if(r.payload)throw Error('Unapproved plan leaked');continue;}
  const p=r.payload,expected=name==='simon'?'simon-ceiling-durability-01':'elijah-nov11-half';
  if(r.pace_seconds_unit!=='mi'||!['mi','km'].includes(r.distance_unit)||(r.athlete_slug?r.athlete_slug!==name:p?.plan?.slug!==expected)||!Number.isInteger(p.version.number)||!Array.isArray(p.weeks))throw Error('Wrong athlete/units');
  for(const w of p.weeks){if(!Array.isArray(w.sessions)||new Set(w.sessions.map(s=>s.day)).size!==w.sessions.length)throw Error('Duplicate/invalid day');
   if(Math.abs(w.sessions.reduce((n,s)=>n+s.distance,0)-w.total_distance)>.01)throw Error('Week total mismatch');
   for(const s of w.sessions){if(!Array.isArray(s.components)||!Number.isFinite(s.distance)||s.distance<0)throw Error('Invalid session');for(const c of s.components){for(const k of ['distance','duration_seconds','repeat_count','pace_low_seconds','pace_high_seconds','recovery_seconds'])if(c[k]!=null&&(!Number.isFinite(c[k])||c[k]<=0))throw Error('Invalid component');}}
  }
 }
 return raw;
}
function validateBundle(b){
 if(b?.schema_version!==1||!Array.isArray(b.records)||!b.athletes)throw Error('Unrecognized public record');
 const ids=new Set();for(const r of b.records){if(!/^[a-z0-9-]+$/.test(r.id)||ids.has(r.id)||r.visibility!=='approved_public')throw Error('Private or duplicate record');ids.add(r.id);if(!['observation','analysis','decision','question'].includes(r.kind))throw Error('Invalid record kind');}
 for(const r of b.records)for(const id of r.depends_on||[])if(!ids.has(id))throw Error('Orphan relationship');return b;
}
const when=(d,l='en')=>new Date(d+'T12:00:00Z').toLocaleDateString(l==='fr'?'fr-FR':'en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
function component(c,unit,lang='en'){
 const label={warm_up:lang==='fr'?'Échauffement':'Warm-up',cool_down:lang==='fr'?'Retour au calme':'Cooldown',work:''}[c.role]||'';
 const amount=c.distance!=null?distance(c.distance,c.distance_unit,unit):c.duration_seconds!=null?(c.duration_seconds<60?c.duration_seconds+' s':Number((c.duration_seconds/60).toFixed(1))+' min'):'';
 const repeat=c.repeat_count?c.repeat_count+' × ':'';
 const p=pace(c.pace_low_seconds,c.pace_high_seconds,unit);
 return [label,repeat+amount,p?'@ '+p:'',c.recovery_seconds?(lang==='fr'?' · récupération ':' · recovery ')+clock(c.recovery_seconds)+(c.recovery_kind==='easy'?(lang==='fr'?' très facile':' very easy'):''):''].filter(Boolean).join(' ');
}
function stateMessage(state,lang){return text({en:state==='live'?'Approved plan checked against the dated FORM sessions.':state==='review_required'?'Update awaiting matched publication. The saved plan below is not confirmed current.':state==='unavailable'?'Public plan unavailable. Follow your assigned FORM plan.':'Saved approved copy. Live connection not yet confirmed.',fr:state==='live'?'Plan publié vérifié avec les séances datées de FORM.':state==='review_required'?'Mise à jour en attente de publication concordante. La copie ci-dessous n’est pas confirmée actuelle.':state==='unavailable'?'Plan public indisponible. Suivre le plan attribué dans FORM.':'Copie publiée enregistrée. Connexion actuelle non confirmée.'},lang);}
function planHTML(name,raw,unit,lang='en',state='saved',full=true){
 if(!raw||raw.state!=='published')return `<p class="cs-state" role="status">${esc(stateMessage(raw?.state||'unavailable',lang))}</p>`;
 const p=raw.payload;unit=unit||raw.distance_unit;
 let h=`<div class="cs-plan" data-plan-athlete="${name}" data-plan-version="${p.version.number}" data-state="${esc(state)}"><p class="cs-state" role="status">${esc(stateMessage(state,lang))} <span>V${p.version.number} · ${esc(when(p.running.published_at.slice(0,10),lang))}</span></p><div class="cs-plan-heading"><h3>${esc(p.running.race_name)}</h3><strong>${esc(when(p.running.race_on,lang))}</strong></div>`;
 const days={MON:['Monday','Lundi'],TUE:['Tuesday','Mardi'],WED:['Wednesday','Mercredi'],THU:['Thursday','Jeudi'],FRI:['Friday','Vendredi'],SAT:['Saturday','Samedi'],SUN:['Sunday','Dimanche']};
 const now= new Date().toISOString().slice(0,10);
 const dayIndex=['MON','TUE','WED','THU','FRI','SAT','SUN'];
 const current=(p.weeks.find(w=>w.sessions.some(s=>new Date(Date.parse(p.running.starts_on)+(w.week_number-1)*604800000+dayIndex.indexOf(s.day)*86400000).toISOString().slice(0,10)>=now))||p.weeks[p.weeks.length-1]).week_number;
 for(const w of p.weeks){
  const date=new Date(Date.parse(p.running.starts_on)+(w.week_number-1)*604800000).toISOString().slice(0,10);
  h+=`<details class="cs-week" ${w.week_number===current?'open':''}><summary><span>${lang==='fr'?'Semaine':'Week'} ${String(w.week_number).padStart(2,'0')} <small>${esc(when(date,lang))} · ${esc(w.phase)}</small></span><b>${esc(distance(w.total_distance,raw.distance_unit,unit))} <small>${lang==='fr'?'prévision':'planned'}</small></b></summary><div class="cs-week-body">`;
  for(const s of w.sessions){h+=`<article class="cs-session ${s.role==='key'?'is-key':''}"><div class="cs-day">${days[s.day][lang==='fr'?1:0]}<small>${esc(distance(s.distance,raw.distance_unit,unit))}</small></div><div><h4>${esc(s.title)}</h4><p class="cs-anatomy">${s.components.map(c=>esc(component(c,unit,lang))).join('<br>')}</p><details class="cs-instructions"><summary>${lang==='fr'?'Consignes du coach (anglais)':'Coach instructions'}</summary><p>${esc(s.details||s.intent)}</p></details></div></article>`;}
  const missing=Object.keys(days).filter(d=>!w.sessions.some(s=>s.day===d));
  if(missing.length)h+=`<p class="cs-note">${missing.map(d=>days[d][lang==='fr'?1:0]).join(', ')}: ${lang==='fr'?'aucune séance prescrite.':'no session assigned.'}</p>`;
  h+='</div></details>';
 }
 return h+`<p class="cs-note">${lang==='fr'?'Les totaux sont des estimations. Les échauffements et récupérations chronométrés peuvent modifier la distance réelle. Ne pas ajouter de kilomètres pour atteindre un total.':'Totals are planning estimates. Timed warm-ups and recoveries affect actual distance. Do not add miles merely to reach a total.'}</p></div>`;
}
function factsHTML(r,unit,lang){
 if(!r.facts)return '';
 return `<dl class="cs-facts">${r.facts.map(f=>`<div><dt>${esc(text(f.label,lang))}</dt><dd>${esc(f.kind==='pace'?pace(f.value,f.high,unit):f.kind==='distance'?distance(f.value,f.unit,unit):f.value)}</dd></div>`).join('')}</dl>`;
}
function recordState(r,plans){
 if(r.review_required)return 'review';
 for(const [a,v]of Object.entries(r.plan_refs||{})){
  const live=plans?.athletes?.[a];if(live&&live.state!=='published')return 'review';
  if(live?.payload?.version.number!==undefined&&live.payload.version.number!==v)return 'historical';
 }
 return 'recorded';
}
function entryHTML(r,b,plans,unit='mi',lang='en',expanded=false){
 const labels={observation:['Observed','Observé'],analysis:['Coach interpretation','Lecture du coach'],decision:['Decision','Décision'],question:['Open question','Question ouverte']};
 const state=recordState(r,plans),related=b.records.filter(x=>(x.depends_on||[]).includes(r.id));
 return `<article class="cs-entry" id="entry-${r.id}" data-entry-id="${r.id}" data-record-revision="${r.revision}" data-record-state="${state}"><div class="cs-entry-meta"><span>${esc(when(r.date,lang))}</span><span>${r.athletes.map(a=>esc(b.athletes[a].name)).join(' + ')} · ${labels[r.kind][lang==='fr'?1:0]}</span></div><h3><a href="${BASE}entries/${r.id}/">${esc(text(r.title,lang))}</a></h3>${state==='review'?`<p class="cs-warning">${lang==='fr'?'La source a changé. Cette interprétation doit être revue.':'The source changed. This interpretation needs review.'}</p>`:state==='historical'?`<p class="cs-note">${lang==='fr'?'Décision historique. Le plan actuel figure ci-dessus.':'Historical decision. The current prescription appears above.'}</p>`:''}${factsHTML(r,unit,lang)}<p>${esc(text(r.body,lang))}</p>${r.report?`<blockquote>${esc(text(r.report,lang))}</blockquote>`:''}${r.learning?`<div class="cs-read"><span>${lang==='fr'?'Ce que nous retenons':'What we take from it'}</span><p>${esc(text(r.learning,lang))}</p></div>`:''}${r.next?`<div class="cs-next"><span>${lang==='fr'?'La suite':'What happens next'}</span><p>${esc(text(r.next,lang))}</p></div>`:''}${r.source?`<p class="cs-source">${lang==='fr'?'Source':'Source'}: <a href="${esc(r.source.url)}">${esc(r.source.label)}</a> · ${esc(r.source.state||'approved excerpt')}</p>`:''}<div class="cs-relations">${Object.entries(r.plan_refs||{}).map(([a,v])=>`<a href="${b.athletes[a].plan_url}">${b.athletes[a].name} · ${lang==='fr'?'décision du plan':'plan decision'} V${v} → ${lang==='fr'?'plan actuel':'current plan'}</a>`).join('')}${r.athletes.map(a=>`<a href="${b.athletes[a].study_url}">${b.athletes[a].name} · ${lang==='fr'?'son étude':'individual context'} ↗</a>`).join('')}${(r.depends_on||[]).map(id=>{const dep=b.records.find(x=>x.id===id);return `<a href="${BASE}entries/${id}/">${lang==='fr'?'À partir de':'Based on'}: ${esc(text(dep.title,lang))} ↗</a>`;}).join('')}${related.map(x=>`<a href="${BASE}entries/${x.id}/">${lang==='fr'?'A éclairé':'Informed'}: ${esc(text(x.title,lang))} ↗</a>`).join('')}</div></article>`;
}
function journalHTML(b,plans,filter='all',unit='mi',lang='en',kind='all'){
 const rec=b.records.filter(r=>(filter==='all'||r.athletes.includes(filter))&&(kind==='all'||r.kind===kind)).sort((a,b)=>b.date.localeCompare(a.date)||['question','analysis','decision','observation'].indexOf(a.kind)-['question','analysis','decision','observation'].indexOf(b.kind));
 const recent=rec.filter(r=>r.date>='2026-09-28'),older=rec.filter(r=>r.date<'2026-09-28');
 return (recent.map(r=>entryHTML(r,b,plans,unit,lang)).join('')+(older.length?`<details class="cs-history"><summary>${lang==='fr'?'Références historiques':'Earlier reference evidence'} · ${older.length}</summary><div class="cs-entries">${older.map(r=>entryHTML(r,b,plans,unit,lang)).join('')}</div></details>`:''))||`<p>${lang==='fr'?'Aucune entrée approuvée pour ce filtre.':'No approved entries for this filter.'}</p>`;
}
async function readPlans(signal){const r=await fetch(RPC,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal});if(!r.ok)throw Error('Public plan unavailable');return validatePlans(await r.json());}
function boot(){
 const root=document.querySelector('[data-connected-study]');if(!root)return;
 let b=window.FORMStudyBundle, saved=window.FORMStudyPlans,live=null, lang=document.documentElement.lang==='fr'?'fr':'en';
 let unit=new URLSearchParams(location.search).get('unit')||root.dataset.unit||'mi';if(!['mi','km'].includes(unit))unit='mi';
 let filter=new URLSearchParams(location.search).get('athlete')||root.dataset.athlete||'all';if(!['all','elijah','simon'].includes(filter))filter='all';let kind='all', busy=false,lastRead=0;
 validateBundle(b);validatePlans(saved);
 function render(){
  root.querySelectorAll('[data-cs-copy]').forEach(e=>{const v=b.copy?.[e.dataset.csCopy];if(v)e.textContent=text(v,lang);});
  root.querySelectorAll('[data-cs-plan]').forEach(e=>{const a=e.dataset.csPlan,state=live?.athletes?.[a]?.state;e.innerHTML=planHTML(a,state==='published'||state==='unavailable'?live.athletes[a]:saved.athletes[a],unit,lang,state==='published'?'live':state||'saved');});
  root.querySelectorAll('[data-cs-journal]').forEach(e=>e.innerHTML=journalHTML(b,live||saved,e.dataset.csJournal||filter,unit,lang,kind));
  root.querySelectorAll('[data-cs-entry]').forEach(e=>{const r=b.records.find(x=>x.id===e.dataset.csEntry);e.innerHTML=r?entryHTML(r,b,live||saved,unit,lang,true):'<p>Entry unavailable.</p>';});
  root.querySelectorAll('[data-cs-unit]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.csUnit===unit)));
  root.querySelectorAll('[data-cs-filter]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.csFilter===filter)));
  root.querySelectorAll('[data-cs-kind]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.csKind===kind)));
  root.querySelectorAll('[data-cs-lang]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.csLang===lang)));
  document.querySelectorAll('[data-cs-race]').forEach(e=>{const a=e.dataset.csRace,p=(live?.athletes?.[a]?.state==='published'?live:saved).athletes[a].payload;e.textContent=when(p.running.race_on,lang);});
  document.querySelectorAll('[data-cs-version]').forEach(e=>{const a=e.dataset.csVersion;e.textContent='V'+(live?.athletes?.[a]?.payload||saved.athletes[a].payload).version.number;});
  if(root.dataset.athlete==='simon'){const st=document.getElementById('statusTxt'),sub=document.getElementById('statusSub');if(st)st.textContent=(lang==='fr'?'Plan V':'Plan V')+(live?.athletes?.simon?.payload||saved.athletes.simon.payload).version.number;if(sub)sub.textContent=lang==='fr'?'Voir les séances datées':'See the dated plan below';}
  if(root.dataset.scope==='paired'&&lang==='fr')root.querySelectorAll('[data-english-editorial]').forEach(e=>e.lang='en');
 }
 root.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.csUnit){unit=t.dataset.csUnit;render();}if(t.dataset.csFilter){filter=t.dataset.csFilter;render();}if(t.dataset.csKind){kind=t.dataset.csKind;render();}if(t.dataset.csLang){lang=t.dataset.csLang;document.documentElement.lang=lang;render();}if(t.hasAttribute('data-cs-refresh'))refresh(true);
 });
 async function refresh(force=false){if(busy||(!force&&Date.now()-lastRead<30000))return;busy=true;try{live=await readPlans(AbortSignal.timeout(12000));}catch(_){live=null;}try{const r=await fetch(BASE+'bundle.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(r.ok)b=validateBundle(await r.json());}catch(_){}lastRead=Date.now();busy=false;render();}
 render();refresh();document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('focus',()=>refresh());
 // Existing Simon controls remain the authority for that page's language/units.
 document.addEventListener('form-study-preferences',e=>{unit=e.detail.unit;lang=e.detail.lang;render();});
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();}
return {esc,text,clock,distance,pace,validatePlans,validateBundle,component,planHTML,entryHTML,journalHTML,recordState,readPlans,boot};
});
