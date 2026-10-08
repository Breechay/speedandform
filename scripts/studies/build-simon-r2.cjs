'use strict';
// Compatibility entry point for the Study 003 publication build.
// This reads an explicitly approved publication. It never writes the database.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..'),DIR=path.join(ROOT,'labs/the-two-curves'),FILE=path.join(DIR,'index.html');
const A=require(path.join(DIR,'plan-projection.js')),COPY=require('./simon-study-copy.cjs');
const observationPanel=require('./simon-study-panel.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const staticFormat=s=>A.format(s,'km').replace(/\{e:(\d+)\}/g,(_,x)=>x+' m').replace(/\{b1\}/g,'Sep 28').replace(/\{b1end\}/g,'Nov 1').replace(/\{g1\}/g,'Oct 29');
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};

function replaceCopy(html,key,value){
  const open=new RegExp('<([a-z][\\w:-]*)\\b[^>]*\\bdata-i=["\\\']'+escapeRE(key)+'["\\\'][^>]*>','g');
  // A translated span can contain pace spans. Find its balanced closing tag,
  // rather than treating the first nested </span> as the end of the copy.
  const matches=[...html.matchAll(open)].reverse();
  for(const match of matches){
    const bodyStart=match.index+match[0].length,tag=match[1];
    const tags=new RegExp('</?'+tag+'\\b[^>]*>','g');tags.lastIndex=bodyStart;
    let depth=1,end;
    for(let next;(next=tags.exec(html));){
      if(next[0].startsWith('</'))depth--;else if(!next[0].endsWith('/>'))depth++;
      if(!depth){end=next.index;break;}
    }
    assert.notEqual(end,undefined,'Unclosed translated element: '+key);
    html=html.slice(0,bodyStart)+value+html.slice(end);
  }
  return html;
}

function render(html,pub){
  A.validate(pub);
  const beforeImages=[...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>hash(m[1]));
  const observation=/<section\b[^>]*id="observation-led"[^>]*>[\s\S]*?<\/section>/;
  assert.ok(observation.test(html),'Study recovery guidance missing');
  html=html.replace(observation,()=>observationPanel());
  const t0=html.indexOf('const T = '),t1=html.indexOf('const MON = ',t0);
  assert.ok(t0>=0&&t1>t0,'Study translations missing');
  const T=JSON.parse(html.slice(t0+10,t1).trim().replace(/;$/,''));
  Object.assign(T,COPY);
  const current=A.currentCopy(pub);
  T['s2.p'][0]=current['s2.en'];
  delete current['s2.en'];
  Object.assign(T,current);
  // These are the recorded September 4 repetitions, not a current pace range.
  const history=`{p:${366/A.MI}} / {p:${362/A.MI}}`;
  T['pace.history']=[history,history];
  html=html.slice(0,t0)+'const T = '+JSON.stringify(T,null,1)+';\n'+html.slice(t1);

  html=html.replace(/<small data-u="p:227-232">[\s\S]*?<\/small>/,'<small data-i="m.goalnote"></small>');
  html=html.replace(/(<span class="lbl" data-i="k.easy">[\s\S]*?<\/span>)<b[^>]*>[\s\S]*?<\/b>/,'$1<b data-i="pace.easy"></b>');
  html=html.replace(/(<span class="lbl" data-i="k.half">[\s\S]*?<\/span>)<b[^>]*>[\s\S]*?<\/b>/,'$1<b data-i="pace.tuesday"></b>');
  html=html.replace(/(<span class="lbl" data-i="k.thr">[\s\S]*?<\/span>)<b[^>]*>[\s\S]*?<\/b>/,'$1<b data-i="pace.history"></b>');
  html=html.replace(/(<span class="lbl" data-i="k.ceil">[\s\S]*?<\/span>)<b[^>]*>[\s\S]*?<\/b>/,'$1<b data-i="pace.thursday"></b>');
  html=html.replace(/(<tr><td data-i="r6">[^<]*<\/td>)<td(?: [^>]*)?>[\s\S]*?<\/td>/,'$1<td data-i="pace.tuesday"></td>');
  // Preserve the historical workout numbers, while making their date explicit.
  T['e3.p']=T['e3.p'].map((s,i)=>i===0?s.replace('inside the {p:227-232} working band','inside the {p:227-232} band prescribed for that September 29 session'):s.replace('dans la plage de travail {p:227-232}','dans la plage {p:227-232} prescrite pour cette séance du 29 septembre'));
  html=html.replace(/const T = [\s\S]*?(?=const MON = )/,'const T = '+JSON.stringify(T,null,1)+';\n');
  for(const [key,pair] of Object.entries(T)){
    if(typeof pair[0]!=='string')continue;
    html=replaceCopy(html,key,key==='s2.p'?escapeHTML(pair[0]):staticFormat(pair[0]));
  }

  const a0=html.indexOf('const ARC = '),a1=html.indexOf('\n/* ===',a0);
  const arc=vm.runInNewContext('('+html.slice(a0+12,a1).trim().replace(/;$/,'')+')',{}, {timeout:1000});
  arc[0].t={en:'5K test',fr:'Test sur 5 km'};
  arc[0].p={en:'An easy Tuesday, then a 5K on October 29. Record the time, splits and how it felt.',fr:'Un mardi facile, puis un 5 km le 29 octobre. Noter le temps, les passages et les sensations.'};
  arc[1].t={en:'Possible steady 6 km run',fr:'Sortie régulière de 6 km à envisager'};
  arc[1].p={en:'After recovery, Brice may add a steady {d:6} run. Wait for his confirmation and keep it to {d:6}.',fr:'Après récupération, Brice pourra ajouter une sortie régulière de {d:6}. Attendre son accord et garder la distance à {d:6}.'};
  arc[2].when={en:'After both runs',fr:'Après les deux sorties'};
  arc[2].p={en:'Use the running, effort and recovery to choose the next block.',fr:'Utiliser la course, l’effort et la récupération pour choisir le bloc suivant.'};
  arc[3].p={en:'A possible second 5K on Thanksgiving. The event and entry still need confirmation.',fr:'Un deuxième 5 km possible à Thanksgiving. L’épreuve et l’inscription restent à confirmer.'};
  arc[6].t={en:'Review, then build',fr:'Faire le point, puis construire'};
  arc[6].p={en:'Review the autumn running and recovery after HYROX before choosing January’s sessions.',fr:'Faire le point sur la course de l’automne et la récupération après HYROX avant de choisir les séances de janvier.'};
  arc[7].p={en:'February 1 to May 16. Build longer stretches at race pace, then add some race-pace running later in long runs when ready.',fr:'Du 1er février au 16 mai. Allonger les portions à l’allure de course, puis en ajouter en fin de sortie longue quand Simon est prêt.'};
  html=html.slice(0,a0)+'const ARC = '+JSON.stringify(arc,null,1)+';\n'+html.slice(a1);

  if(!html.includes('STUDY003_LIVE_COPY'))html=html.replace('function renderCopy(){',`function renderCopy(){
  // STUDY003_LIVE_COPY: update the summaries as well as the grid.
  const copy=window.FORMSimonPlan.currentCopy(window.FORMSimonPublishedPlan);
  T['s2.p'][0]=copy['s2.en'];delete copy['s2.en'];Object.assign(T,copy);`);
  html=html.replace('if(v) el.innerHTML = fmt(v[L()]);','if(v){if(el.dataset.i===\'s2.p\')el.textContent=v[L()];else el.innerHTML = fmt(v[L()]);}');
  html=html.replace('const body = d.type==="easy" ? (d.lbl?d.lbl[lang]:"") : fmt(d[lang]);','const body = fmt(d[lang]);');
  html=html.replace('${types[d.type]}</span><span class="body">${body}', '${d.label?d.label[lang]:types[d.type]}</span><span class="body">${body}');

  const status=`let publicationState='saved';
let refreshingPublication=false;
function renderPublicationState(){
 const el=document.getElementById('planSource'),button=document.getElementById('refreshPlan');if(!el)return;
 el.dataset.sourceState=publicationState;
 const ver=window.FORMSimonPublishedPlan.payload.version.number;
 if(publicationState==='refreshing')el.textContent=lang==='fr'?'Vérification du plan…':'Checking for plan updates…';
 else if(publicationState==='live')el.textContent=(lang==='fr'?'Plan à jour · version ':'Plan up to date · version ')+ver;
 else if(publicationState==='review_required')el.textContent=lang==='fr'?'La publication doit être mise à jour. Consulte ton plan dans FORM. La copie précédente reste affichée.':'The published copy needs an update. Check your plan in FORM. The previous copy remains visible.';
 else el.textContent=(lang==='fr'?'Copie enregistrée · version ':'Saved plan · version ')+ver+(lang==='fr'?'. Les mises à jour n’ont pas pu être vérifiées.':'. Updates could not be checked.');
 if(button){button.hidden=false;button.disabled=refreshingPublication;button.textContent=refreshingPublication?(lang==='fr'?'Vérification…':'Checking…'):t('refresh');}
}
async function refreshApprovedPublication(){
 if(refreshingPublication)return;
 refreshingPublication=true;publicationState='refreshing';renderPublicationState();
 try{
  const next=await window.FORMSimonPlan.read(AbortSignal.timeout(12000));
  if(next.payload.running.starts_on!==BLOCK01_START||next.payload.version.number<window.FORMSimonPublishedPlan.payload.version.number)throw Error('Public plan is not approved/current');
  B1=window.FORMSimonPlan.fromPublication(next);window.FORMSimonPublishedPlan=next;publicationState='live';
 }catch(e){publicationState=String(e.message).includes('approved/current')?'review_required':'saved';}
 refreshingPublication=false;
 renderCopy();renderGrid();renderPublicationState();
}

`;
  const s0=html.indexOf("let publicationState='saved';"),s1=html.indexOf('function renderAll(){',s0);
  assert.ok(s0>=0&&s1>s0,'Publication refresh entry point missing');
  html=html.slice(0,s0)+status+html.slice(s1);
  if(!html.includes("getElementById('refreshPlan').addEventListener"))html=html.replace('\nrenderAll();\nrefreshApprovedPublication();',"\ndocument.getElementById('refreshPlan').addEventListener('click',refreshApprovedPublication);\nrenderAll();\nrefreshApprovedPublication();");

  const version=pub.payload.version.number;
  const saved=`<!-- STUDY003_SAVED_GRID --><div class="plan-publication"><p class="plan-source" id="planSource" data-source-state="saved" role="status" aria-live="polite">Saved plan · version ${version}.</p><button id="refreshPlan" class="plan-refresh" type="button" data-i="refresh" hidden>Refresh plan</button></div><div class="grid-plan" id="gridPlan" role="table" aria-label="Block 01, every day">${A.fallbackGrid(pub)}</div><!-- END_STUDY003_SAVED_GRID -->`;
  html=html.replace(/<!-- STUDY003_SAVED_GRID -->[\s\S]*?<!-- END_STUDY003_SAVED_GRID -->/,()=>saved);
  if(!html.includes('STUDY003_REFRESH_CONTROL'))html=html.replace('</style>',`/* STUDY003_REFRESH_CONTROL */
.plan-publication{display:flex;flex-wrap:wrap;align-items:center;gap:8px 20px;margin:8px 0 12px}
.plan-publication .plan-source{margin:0;flex:1 1 260px}
.plan-refresh{font:13px/1.4 var(--f-mono);border:1px solid var(--rule-hard);padding:11px 16px;min-height:44px}
.plan-refresh:hover{background:var(--paper-hi)}.plan-refresh:disabled{cursor:wait;opacity:.65}
.plan-note{display:block;margin-top:10px;font:13px/1.5 var(--f-text);color:var(--ink-2)}
.keys b[data-i="pace.history"]{white-space:normal;max-width:17ch}
</style>`);
  html=html.replace(/data-study-revision="[^"]+"/,'data-study-revision="'+pub.revision+'"');
  html=html.replace('FORM Study 003 follows him as the ceiling and the hold rise together.','FORM Study 003 follows his training toward holding a steady pace for longer.');
  html=html.replace('"dateModified":"2026-10-01"','"dateModified":"2026-10-08"');
  assert.deepEqual([...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>hash(m[1])),beforeImages,'Image bytes changed');
  assert.ok(html.includes('scale(.98)')&&html.includes('.reveal{opacity:1'),'Preserve figure and visible content');
  for(const [,attrs,body]of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
    if(attrs.includes('application/ld+json'))JSON.parse(body);else if(body.trim())new vm.Script(body);
  }
  return html;
}

async function main(){
  const source=arg('--publication-file');
  const raw=source?JSON.parse(fs.readFileSync(source,'utf8')):await A.read(AbortSignal.timeout(25000));
  A.validate(raw);
  const expected=arg('--expected-revision');if(expected)assert.equal(raw.revision,expected,'Unexpected approved revision');
  // Keep only fields from the public projection. Never serialize an audit note
  // or private wrapper metadata supplied alongside a read-only snapshot.
  const pub=Object.fromEntries(['state','revision','distance_unit','schema_version','pace_seconds_unit','payload'].map(k=>[k,raw[k]]));
  const html=render(fs.readFileSync(FILE,'utf8'),pub);
  fs.writeFileSync(path.join(DIR,'published-plan.json'),JSON.stringify(pub,null,2)+'\n');
  fs.writeFileSync(path.join(DIR,'published-plan.js'),'/* Generated from approved FORM publication. Do not author here. */\nwindow.FORMSimonPublishedPlan = '+JSON.stringify(pub).replace(/</g,'\\u003c')+';\n');
  fs.writeFileSync(FILE,html);
  console.log(JSON.stringify({revision:pub.revision,version:pub.payload.version.number,totals:pub.payload.weeks.map(w=>w.total_distance),html_sha256:hash(html)}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={render};
