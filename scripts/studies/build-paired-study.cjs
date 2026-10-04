#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..'), A=require('../../labs/shared/connected-study.js');
const BASE='labs/same-pace-different-problem', sourcePath='data/studies/paired-study.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(ROOT,p)),{recursive:true});fs.writeFileSync(path.join(ROOT,p),s);};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const T=(en,fr)=>({en,fr});
const elapsed=s=>s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(Math.round(s%60)).padStart(2,'0')}`:A.clock(s);
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
function resolve(registry){
 const b=structuredClone(registry);delete b.approval_basis;
 for(const r of b.records){
  if(r.visibility!=='approved_public')throw Error('Public registry must contain approved excerpts only');
  if(!r.source_ref)continue;
  const ref=r.source_ref;if(!['labs/the-two-curves/evidence.json','data/studies/elijah-evidence.json'].includes(ref.path))throw Error('Unapproved source path');
  const source=read(ref.path)[ref.collection].filter(x=>x.date===ref.date);if(source.length!==1)throw Error('Ambiguous/missing source '+r.id);const s=source[0];
  r.source_hash=hash(s);r.source={url:'/'+ref.path,label:s.source||'Coach-approved athlete evidence manifest',state:s.state||'historical race anchor'};
  if(Array.isArray(s.source_files))r.source.label='Coach-approved Garmin excerpt';
  if(/^https:/.test(r.source.label)){r.source.url=r.source.label;r.source.label='Official result';}
  r.body=T(s.observation||'Official historical result. Race intent and conditions belong in its interpretation.',s.observation?'Extrait approuvé de la source (anglais) : '+s.observation:'Résultat officiel historique. L’intention de course et les conditions font partie de son interprétation.');
  r.facts=[];const fact=(en,fr,value,kind,unit)=>r.facts.push({label:T(en,fr),value,kind,unit});
  if(s.net_seconds||s.seconds)fact('Result','Résultat',elapsed(s.net_seconds||s.seconds),'text');
  if(s.distance_km)fact('Race distance','Distance',s.distance_km,'distance','km');
  if(s.ten_k_best_effort_seconds){fact('10K best effort','Meilleur 10 km',A.clock(s.ten_k_best_effort_seconds),'text');fact('Whole activity','Activité complète',A.clock(s.activity_seconds),'text');fact('GPS distance','Distance GPS',s.activity_distance_mi,'distance','mi');}
  if(s.recorded_work_seconds)fact('Recorded work','Travail enregistré',A.clock(s.recorded_work_seconds),'text');
  if(s.recorded_work_distance_km)fact('Work distance','Distance de travail',s.recorded_work_distance_km,'distance','km');
  if(s.longest_work_piece_seconds)fact('Longest piece','Bloc le plus long',A.clock(s.longest_work_piece_seconds),'text');
  if(s.recorded_work)r.body.en+=' Recorded repetition paces: '+s.recorded_work.map(x=>A.clock(x.pace_s_km)+'/km').join(', ')+'.';
  if(s.athlete_report)r.report=T(typeof s.athlete_report==='string'?s.athlete_report:s.athlete_report.quote,typeof s.athlete_report==='string'?s.athlete_report:s.athlete_report.quote);
  if(s.athlete_note)r.report=T(s.athlete_note,s.athlete_note);
  if(s.next_day_recovery===null||s.next_day_recovery===undefined)r.next=T('Next-day recovery is not established in this source. Missing data is not evidence of poor recovery.','La récupération du lendemain n’est pas établie dans cette source. Une donnée manquante n’indique pas une mauvaise récupération.');
 }
 const byId=new Map(b.records.map(r=>[r.id,r]));
 function basis(r,trail=[]){if(trail.includes(r.id))throw Error('Cyclic record relationship');return hash({revision:r.revision,source:r.source_hash||null,body:r.body,learning:r.learning,next:r.next,deps:(r.depends_on||[]).map(id=>{if(!byId.has(id))throw Error('Orphan '+id);return basis(byId.get(id),[...trail,r.id]);})});}
 const approved=registry.approval_basis||{};
 for(const r of b.records){r.basis_hash=basis(r);r.review_required=!!r.depends_on?.length&&approved[r.id]!==r.basis_hash;}
 A.validateBundle(b);return b;
}
function head(title,url,desc){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${A.esc(title)} | FORM Studies</title><meta name="description" content="${A.esc(desc)}"><link rel="canonical" href="https://speedandform.com${url}"><meta property="og:type" content="article"><meta property="og:title" content="${A.esc(title)}"><meta property="og:description" content="${A.esc(desc)}"><meta property="og:url" content="https://speedandform.com${url}"><meta property="og:image" content="https://speedandform.com/${BASE}/og.png"><meta name="twitter:card" content="summary_large_image"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Mono:wght@400;700&family=Nothing+You+Could+Do&display=swap" rel="stylesheet"><link rel="stylesheet" href="/labs/shared/connected-study.css"><script type="application/ld+json">${json({'@context':'https://schema.org','@type':'Article',headline:title,author:{'@type':'Person',name:'Brice Ikouebe'},datePublished:'2026-10-04',mainEntityOfPage:'https://speedandform.com'+url})}</script></head>`;}
function controls(){return `<div class="cs-controls" aria-label="Reading preferences"><button data-cs-unit="mi" aria-pressed="true">MI</button><button data-cs-unit="km" aria-pressed="false">KM</button></div>`;}
function mast(){return `<header class="cs-mast cs-shell"><a class="cs-logo" href="/labs/" aria-label="Speed and Form Studies home"><img src="/assets/brand/sf-seal.svg" width="56" height="48" alt="Speed and Form"></a><nav class="cs-nav" aria-label="Study navigation"><a href="/${BASE}/">The paired study</a><a href="/labs/the-two-curves/">Simon’s study</a><a href="/labs/">All studies ↗</a></nav>${controls()}</header>`;}
function scripts(b,p){return `<script src="/${BASE}/bundle.js"></script><script src="/${BASE}/plans.js"></script><script src="/labs/shared/connected-study.js"></script>`;}
function foot(){return `<footer class="cs-footer cs-shell"><div><a class="cs-logo" href="/" aria-label="Speed and Form home"><img src="/assets/brand/sf-seal.svg" width="56" height="48" alt="Speed and Form"></a><p>Training, observed.<br>Brice Ikouebe · Speed & Form</p></div><nav class="cs-nav" aria-label="Related pages"><a href="/labs/speed-that-endures/">Speed That Endures ↗</a><a href="/plans/race-pace-durability/">The RPD method ↗</a><a href="/privacy">Privacy</a></nav></footer>`;}
function section(n,id,title,intro,body){return `<section class="cs-section" id="${id}"><div class="cs-section-head"><span class="cs-number">${n}</span><div><h2>${title}</h2><p>${intro}</p></div></div>${body}</section>`;}
function page(b,p){
 const cases=['elijah','simon'].map(a=>{const x=b.athletes[a],v=p.athletes[a].payload;return `<article class="cs-case ${a}" id="${a}"><span class="cs-label">${a==='elijah'?'01 · Near race':'02 · Longer development'}</span><h2>${x.name}</h2><div class="cs-race"><span>${a==='elijah'?'Savannah Half Marathon':'Semi-Marathon de la Loire'}</span><time data-cs-race="${a}">${v.running.race_on}</time></div><h3 data-cs-copy="${a}.focus">${x.focus.en}</h3><p data-cs-copy="${a}.summary">${x.summary.en}</p><p class="cs-note" data-cs-copy="${a}.goal">${x.goal.en}</p><div class="cs-case-links"><a href="#${a}-plan">Current plan <span data-cs-version="${a}">V${v.version.number}</span> ↓</a><a href="${x.study_url}">${a==='elijah'?'Follow Elijah':'The Two Curves'} ↗</a></div></article>`;}).join('');
 const methods=`<div class="cs-method"><div><h3>Two clocks, not two experiments.</h3><p>Elijah needs a clear, recoverable path to November. Simon has time to build more capacity, then extend the distance he can hold at his eventual race pace.</p><div class="cs-timeline"><span class="cs-timeline-label">Elijah</span><div class="cs-track elijah"><span>October → November 14</span><small>Specific work → recovery → Savannah</small></div><span class="cs-timeline-label">Simon</span><div class="cs-track simon"><span>October → May 16</span><small>Establish → HYROX → rebuild → distance → Saumur</small></div></div><a class="cs-quiet-link" href="/labs/the-two-curves/#plan">Follow Simon’s longer road ↗</a></div><aside class="cs-learn"><span class="cs-label">The question underneath</span><h3>How far does the pace stay yours?</h3><p>Shorter work can look excellent. Later, Simon’s specific training will ask for longer continuous distances, then pace after prior running. That is the distance-based logic of <a href="/labs/speed-that-endures/">Speed That Endures</a>.</p><p class="cs-note">A possible near-race-distance rehearsal is a later coaching decision. It is not a workout assigned today, or a guarantee.</p></aside></div>`;
 const plans=`<div class="cs-controls"><button data-cs-refresh>Check published plans ↻</button></div><div class="cs-plan-grid">${['elijah','simon'].map(a=>`<div id="${a}-plan"><h2>${b.athletes[a].name}</h2><div data-cs-plan="${a}">${A.planHTML(a,p.athletes[a],'mi')}</div></div>`).join('')}</div>`;
 const filters=`<div class="cs-filters"><div class="cs-controls" aria-label="Filter by athlete"><button data-cs-filter="all" aria-pressed="true">Both</button><button data-cs-filter="elijah" aria-pressed="false">Elijah</button><button data-cs-filter="simon" aria-pressed="false">Simon</button></div><div class="cs-controls" aria-label="Filter by entry type"><button data-cs-kind="all" aria-pressed="true">All entries</button><button data-cs-kind="observation" aria-pressed="false">Observed</button><button data-cs-kind="analysis" aria-pressed="false">Interpretation</button><button data-cs-kind="decision" aria-pressed="false">Decisions</button></div></div>`;
 return head('Same pace. Different problem.','/'+BASE+'/','Elijah has until November. Simon has until May. A living record of two runners, their plans, and what changes as the evidence arrives.')+`<body class="cs cs-page" data-connected-study data-scope="paired" data-unit="mi">${mast()}<main class="cs-shell"><section class="cs-hero"><div><span class="cs-label">FORM Studies · Elijah + Simon · Paired chapter</span><h1 class="cs-display" data-cs-copy="title">Same pace.<br>Different<br>problem.</h1><p class="cs-intro" data-cs-copy="intro">One runner races in November. The other has until May. The target may look similar. The work should not.</p><a class="cs-quiet-link" href="#journal">Read what changed ↓</a></div><aside class="cs-hero-aside"><div><span class="cs-label">The shared development aim</span><div class="cs-aim">1:20<small> half</small></div><p class="cs-note">An ambition, not a prediction.<br>Neither runner has to defend the number against new evidence.</p></div><div><p class="cs-hand">Same aim.<br>Different work.</p><span class="cs-label">Coach’s notebook · 04 Oct 2026</span></div><div class="cs-issue"><div><span>Part I</span><b>Two athletes</b></div><div><span>Through Savannah</span><b>14 Nov 2026</b></div><div><span>Then</span><b>Simon continues</b></div></div></aside></section><div class="cs-cases">${cases}</div>${section('01','relationship','The same question.<br>Different runway.','A comparison of coaching decisions, not a contest between athletes.',methods)}${section('02','plans','The work, as assigned.','These are approved views of the dated FORM prescriptions. History stays attached to the work that was actually prescribed.',plans)}${section('03','journal','What happened.<br>What we learned.','Every entry belongs to an athlete, a source and a decision. An observation is not the same thing as an explanation.',filters+`<div class="cs-entries" data-cs-journal="">${A.journalHTML(b,p)}</div>`)}${section('04','next','The next useful evidence.','Planned observations remain questions until the work and its recovery are filed.',`<div class="cs-method"><div><h3>Elijah: from training to Savannah.</h3><p>The continuous session and subsequent recovery inform his race strategy. On November 14, the actual race, pacing decisions and recovery close his paired chapter. A date passing will not be recorded as a result.</p><a href="/plans/elijah-savannah-half/">Elijah’s plan and connected entries ↗</a></div><div><h3>Simon: the longer question stays open.</h3><p>The 5K read is followed by a separate six-kilometer observation only after recovery and coach approval. Then the study follows HYROX, the rebuild and a distance-based specific phase toward May.</p><a href="/labs/the-two-curves/">Continue with The Two Curves ↗</a></div></div>`)}<p class="cs-note">This is an observational coaching study, not a randomized trial. It does not isolate a physiological cause or establish that one plan is better for another athlete. Private filings are not published automatically.</p></main>${foot()}${scripts(b,p)}</body></html>`;
}
function embed(b,p,athlete){return `<section class="cs cs-embed" data-connected-study data-athlete="${athlete}" data-unit="${b.athletes[athlete].native_unit}"><p class="cs-crosslink"><a href="/${BASE}/">Same Pace, Different Problem ↗</a> · ${athlete==='simon'?'This record also appears in the Elijah + Simon paired study.':'Elijah’s entries also appear in the paired study.'}</p><div class="cs-controls"><button data-cs-refresh>Check published plan ↻</button></div><div data-cs-plan="${athlete}">${A.planHTML(athlete,p.athletes[athlete],b.athletes[athlete].native_unit)}</div><h2>Connected observations & decisions</h2><div class="cs-entries" data-cs-journal="${athlete}">${A.journalHTML(b,p,athlete,b.athletes[athlete].native_unit)}</div></section>`;}
async function build(){
 let p;
 if(process.argv.includes('--refresh')){p=A.validatePlans(await A.readPlans(AbortSignal.timeout(20000)));if(Object.values(p.athletes).some(x=>x.state!=='published'))throw Error('No matched publication; refusing a new current snapshot');write(BASE+'/plans.json',JSON.stringify(p,null,2)+'\n');}
 else p=A.validatePlans(read(BASE+'/plans.json'));
 const registry=read(sourcePath);let b=resolve(registry);
 if(process.argv.includes('--approve')){registry.approval_basis=Object.fromEntries(b.records.filter(r=>r.depends_on?.length).map(r=>[r.id,r.basis_hash]));write(sourcePath,JSON.stringify(registry,null,2)+'\n');b=resolve(registry);}
 b.copy={title:b.title,intro:T('One runner races in November. The other has until May. The target may look similar. The work should not.','L’un court en novembre. L’autre a jusqu’en mai. La cible se ressemble. Pas le travail.')};
 for(const[a,x]of Object.entries(b.athletes))for(const k of ['focus','summary','goal'])b.copy[a+'.'+k]=x[k];
 b.generated_from={registry:sourcePath,hash:hash(registry)};
 write(BASE+'/bundle.json',JSON.stringify(b,null,2)+'\n');write(BASE+'/bundle.js','window.FORMStudyBundle='+json(b)+';\n');write(BASE+'/plans.js','window.FORMStudyPlans='+json(p)+';\n');
 write(BASE+'/index.html',page(b,p));
 for(const r of b.records){const url='/'+BASE+'/entries/'+r.id+'/';write(BASE+'/entries/'+r.id+'/index.html',head(r.title.en,url,'The shared source, interpretation and relationships behind this study entry.')+`<body class="cs cs-page" data-connected-study data-unit="mi">${mast()}<main class="cs-entry-page"><a href="/${BASE}/#journal">← The shared record</a><div data-cs-entry="${r.id}">${A.entryHTML(r,b,p,'mi','en',true)}</div><p class="cs-note">Record ${r.id} · revision ${r.revision}. This entry is rendered from the same approved record used on the athlete and paired pages.</p></main>${foot()}${scripts(b,p)}</body></html>`);}
 write('plans/elijah-savannah-half/index.html',head('Elijah · Savannah Half Marathon','/plans/elijah-savannah-half/','Elijah’s approved Savannah half-marathon plan, linked observations and coaching decisions.')+`<body class="cs cs-page" data-connected-study data-unit="mi">${mast()}<main class="cs-shell"><h1 class="cs-display" style="font-size:clamp(46px,7vw,88px)">Elijah.<br>The road to Savannah.</h1><p class="cs-intro">The approved plan, the evidence behind it, and the decisions that change it.</p>${embed(b,p,'elijah')}</main>${foot()}${scripts(b,p)}</body></html>`);
 write('plans/elijah-nov-11/index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/plans/elijah-savannah-half/"><link rel="canonical" href="https://speedandform.com/plans/elijah-savannah-half/"><title>Elijah’s Savannah plan</title></head><body><p>The race is November 14. <a href="/plans/elijah-savannah-half/">Open Elijah’s current Savannah plan.</a></p></body></html>`);
 // Simon retains his original hero, cutout, race graphics and bilingual controls.
 // The plan and ongoing journal now use the exact same renderer as the paired page.
 const simonPath='labs/the-two-curves/index.html';let html=fs.readFileSync(path.join(ROOT,simonPath),'utf8');
 if(!html.includes('function renderStatus(){ return;'))html=html.replace('function renderStatus(){','function renderStatus(){ return;');
 html=html.replace(/(<[^>]+id="statusTxt"[^>]*>)[^<]*/, '$1Approved V'+p.athletes.simon.payload.version.number);
 html=html.replace(/(<[^>]+id="statusSub"[^>]*>)[^<]*/, '$1See the dated plan below');
 html=html.replace(/function renderStatus\(\)\{(?: return;)+/,'function renderStatus(){ return;');
 html=html.replace(/let B1\s*=\s*window\.FORMSimonPlan\.fromPublication\([^;]+;/,'let B1=[];');
 html=html.replace('data-i="rb.goal.v"','data-cs-race="simon"');
 if(!html.includes('<!-- CONNECTED_SIMON_START -->')){
  const start=html.indexOf('<section class="sec reveal" id="plan">'),end=html.indexOf('<section class="sec reveal" id="scope">');
  if(start<0||end<start)throw Error('Simon section anchors changed');
  html=html.slice(0,start)+'<!-- CONNECTED_SIMON_START -->\n<!-- CONNECTED_SIMON_END -->\n'+html.slice(end);
  // Removed UI has no residual render authority. Keep historical race renderers.
  for(const fn of ['renderGrid','renderArc','renderPublicationState','refreshApprovedPublication'])html=html.replace(new RegExp('function '+fn+'\\(\\)\\{'),`function ${fn}(){ return;`);
  html=html.replace('function xCalc(){','function xCalc(){ if(!xIn)return;').replace('xIn.addEventListener("input", xCalc);','xIn?.addEventListener("input", xCalc);').replace('document.getElementById("xSwap").addEventListener','document.getElementById("xSwap")?.addEventListener');
  html=html.replace('renderCopy(); renderStatus(); renderGrid(); renderArc(); renderSplits(); renderChart(); renderPublicationState();','renderCopy(); renderStatus(); renderSplits(); renderChart(); document.dispatchEvent(new CustomEvent("form-study-preferences",{detail:{lang,unit}}));');
  html=html.replace('</head>','<link rel="stylesheet" href="/labs/shared/connected-study.css"></head>');
  html=html.replace('</body>',scripts(b,p)+'</body>');
 }
 const replacement=`<!-- CONNECTED_SIMON_START --><section class="sec" id="plan"><div class="shell"><div class="sec-head"><div class="sec-num">02</div><div><h2 class="display">The work & the record</h2><p>The current assignment and the approved observations live together. Changes in either athlete’s paired study come from the same record.</p></div></div>${embed(b,p,'simon')}</div></section><!-- CONNECTED_SIMON_END -->`;
 html=html.replace(/<!-- CONNECTED_SIMON_START -->[\s\S]*?<!-- CONNECTED_SIMON_END -->/,replacement);
 html=html.replace('data-u="p:227-232"','data-i="paired.goalcenter"');
 html=html.replace(/\n  "paired.goalcenter":[^\n]+/g,'');
 html=html.replace(/(const T=\{|const T = \{)/, '$1\n  "paired.goalcenter":["~1:20 development center","~1 h 20, centre de développement"],');
 html=html.replaceAll('data-study-revision="SIMON-003-R3-20261001"','data-study-revision="SIMON-003-R4-20261004"');
 // Hero/current framing must not overwrite the R4 record with old R2/R3 copy.
 const replacements=[['the ceiling and the hold rise together','fresh capacity, longer distance and recovery develop'],['whether the pace you can hold and the speed above it can both move upward','how far you can carry the pace, while developing the capacity above it'],['3:47–3:52/km','A development target'],['Nothing filed yet','Week 1 on file'],['Rien encore consigné','Semaine 1 documentée'],['Thursday repeats before extending.','Thursday supports Tuesday.'],['Les deux courbes doivent monter ensemble.','Les progrès ne doivent pas se faire au détriment de la récupération.']];
 // Only top-level current text. Historical source measurements are rendered from manifests.
 for(const[a,z]of replacements)html=html.replaceAll(a,z);
 html=html.replace(/href="#evidence"/g,'href="#plan"').replace(/href="#record"/g,'href="#plan"');
 write(simonPath,html);
 // Legacy Simon scripts require a valid snapshot even though shared rendering owns the schedule.
 write('labs/the-two-curves/published-plan.json',JSON.stringify(p.athletes.simon,null,2)+'\n');write('labs/the-two-curves/published-plan.js','window.FORMSimonPublishedPlan='+json(p.athletes.simon)+';\n');
 let sitemap=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
 const urls=['/'+BASE+'/', '/plans/elijah-savannah-half/', ...b.records.map(r=>'/'+BASE+'/entries/'+r.id+'/')];
 for(const u of urls)if(!sitemap.includes('https://speedandform.com'+u+'</loc>'))sitemap=sitemap.replace('</urlset>', '<url><loc>https://speedandform.com'+u+'</loc></url>\n</urlset>');
 write('sitemap.xml',sitemap);
 console.log(`Connected study built: ${b.records.length} approved entries; Elijah V${p.athletes.elijah.payload.version.number}, Simon V${p.athletes.simon.payload.version.number}.`);
 return {bundle:b,plans:p};
}
if(require.main===module)build().catch(e=>{console.error(e);process.exit(1);});
module.exports={resolve,build,hash};
