'use strict';
/* Public discovery only. Delivery routes and historical schedules are not a catalog. */
const GROUPS = [
 [
  "start",
  "Start with your question",
  "A useful place to begin, whether you are new to running or building toward a race."
 ],
 [
  "coaching",
  "Work with Brice",
  "Coaching and other ways to work together."
 ],
 [
  "half-marathon",
  "Your half marathon",
  "Choose your starting point, read the plan, and understand the pace."
 ],
 [
  "training",
  "Pace & the training week",
  "Understand what each run is for and how the week fits together."
 ],
 [
  "movement",
  "Running form & strength",
  "Movement, cues and the strength work around your running."
 ],
 [
  "race",
  "Prepare for your race",
  "Practice pacing, fueling and race decisions."
 ],
 [
  "recovery",
  "Recovery & returning",
  "Find guidance for fatigue, interruptions and coming back."
 ],
 [
  "practice",
  "Plans, studies & the practice",
  "See the work itself, follow a plan or join a session."
 ],
 [
  "house",
  "House & access",
  "Contact, brand files and the policies around the site."
 ]
];
const ARCHIVE = ['practice','start','plan','plan-spring-2026','cycles','the-field','competition','plan-speed-emergence','taper-key-biscayne','races/key-biscayne-2026'];
const PRESERVE_ONLY = ['athletes','ledger','app'];
const GALLERY_ALBUMS = require('../track/albums.json').albums.filter(a=>a.published===true).map(a=>'track/'+a.slug+'/');
const NOTE_PAGES = require('./field-notes-content.cjs').filter(n=>n.published===true).map(n=>'field-notes/'+n.slug+'/');
const EXTRA = [...GALLERY_ALBUMS,...NOTE_PAGES,'ask/','','library','plans/race-pace-durability/support/','es/plans/race-pace-durability/','labs/','field-notes','the-method','the-work','training-principles','training-map','principles','mechanics-map','easy-run-standards','pain-map','strength-fixes','threshold','long-run','ghost','ghost/week-1','ghost/week-2','ghost/week-3','ghost/week-4','ghost/week-5','ghost/week-6'];
function fileFor(route) { return !route?'index.html':route.endsWith('/')?route+'index.html':route==='ghost'?'ghost/index.html':route+'.html'; }
// Reconcile the complete October 6 catalog, rather than replacing newer entries
// with the historical rows above. There is one authored record per public URL.
const records=require('./discovery-records.cjs');
const lessons=[...require('./running-lessons-content.cjs'),...require('./movement-lessons-content.cjs').movement];
const lessonKeywords={
 '/how-fast-should-i-run':'how fast running pace effort beginner speed heart rate zones',
 '/easy-run':'easy running slow talk test zone 2 aerobic base conversation',
 '/threshold-training':'threshold tempo lactate comfortably hard cruise intervals pace heart rate workout',
 '/long-run-pace':'long run pacing duration slow fast finish endurance how long how far',
 '/sessions':'types running workouts intervals repetitions strides speed vo2max recovery',
 '/training-week':'running week schedule routine days strength rest three four five',
 '/running-form-errors':'running form gait cadence heel strike overstriding shoulders posture technique',
 '/training-principles':'running training principles consistency progression recovery purpose',
 '/running-terms':'running terms glossary definitions vocabulary tempo threshold vo2max lactate cadence economy intervals strides'
};
const questions={
 '/how-fast-should-i-run':['how fast should i run','what pace should i run'],
 '/easy-run':['how easy should an easy run be','why should i run slowly','does running slowly make me slow','what is zone 2 running'],
 '/library/easy-days/':['why are my easy runs hard','why do my easy runs feel hard','why cant i run slowly'],
 '/threshold-training':['threshold','threshhold','tempo','what is threshold running','what is lactate threshold','what is a tempo run','how fast should a tempo run be','threshold vs tempo','how do i find my threshold pace'],
 '/long-run-pace':['how fast should my long run be','how long should my long run be','should i do a fast finish long run'],
 '/sessions':['what are strides','what are running intervals','types of running workouts','intervals vs threshold'],
 '/training-week':['how many days a week should i run','how do i build a running week','how to combine running and lifting'],
 '/running-form-errors':['how do i improve my running form','should i change my heel strike','do i need 180 cadence','what is cadence'],
 '/running-terms':['what is vo2max','what is running economy','what is lactate','what does 3 x 6 mean','what are running terms'],
 '/training-principles':['how does running training work','how do i improve as a runner'],
 '/recovery':['why am i always tired after running','should i run or rest','how do i recover from running'],
 '/anti-rotation':['what is anti rotation','core exercises for runners','how do i keep my trunk steady'],
 '/strength-activation':['how should i warm up before running','warm up routine'],
 '/strength-routine':['what strength exercises should runners do'],
 '/mobility':['mobility for runners','how do i stretch before running','tight hips','hip stretches','tight ankles','calf stretches'],
 '/pain-map':['achilles','achilles pain','heel pain','where does my achilles hurt'],
 '/fueling':['what should i eat before a run','how many carbs should i take','how do i fuel a long run']
};
const entries=records.map(e=>{
 const g=lessons.find(x=>x.route===e.url);
 const kind=g?.kind||(['/strength','/principles'].includes(e.url)?'Lesson':e.url==='/ghost'||e.type==='Plan'||e.type==='Workouts'?'Routine':['/library','/plans/','/labs/'].includes(e.url)?'Shelf':['Guide','Course','Reference','Map','Method','Essay','Field note'].includes(e.type)?'Lesson':null);
 const row={...e,...(g?{title:g.heading,description:g.description,keywords:lessonKeywords[e.url]?lessonKeywords[e.url].split(' '):[...e.keywords,g.heading]}:{}),...(kind?{kind}:{}),questions:questions[e.url]||[],route:e.url.slice(1),file:fileFor(e.url.slice(1))};
 if(e.url==='/library/easy-days/')row.title='Why do my easy runs feel hard?';
 return row;
});
for(const n of require('./field-notes-content.cjs').filter(n=>n.published===true)){
 const url='/field-notes/'+n.slug+'/';
 entries.push({url,route:url.slice(1),file:fileFor(url.slice(1)),title:n.title,description:n.summary,keywords:['field note','article','essay',...(n.tags||[]),n.title],questions:[],category:'practice',type:'Field note',kind:'Lesson'});
}
if(new Set(entries.map(e=>e.url)).size!==entries.length)throw Error('Duplicate discovery URL');
if(!GROUPS.some(g=>g[0]==='house'))GROUPS.push(['house','House & access','Contact, brand files and the policies around the site.',[]]);
module.exports={GROUPS,ARCHIVE,PRESERVE_ONLY,EXTRA,entries,fileFor};
