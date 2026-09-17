'use strict';
/* Public discovery only. Delivery routes and historical schedules are not a catalog. */
const GROUPS = [
 ['start','Start with your question','A useful place to begin, whether you are new to running or building toward a race.',[
  ['library/from-lifting-to-running/','I lift. How do I start running?','Add running without treating every session like another hard gym day.','beginner starting beginner running lifting'],
  ['library/first-half-marathon-goal/','What is a sensible half-marathon goal?','Choose a starting target from the running you can do now.','first half marathon target goal 13.1'],
  ['library/easy-days/','How easy should an easy run feel?','Understand the role of the runs between your harder sessions.','easy slow zone 2 z2 effort'],
  ['library/when-a-week-goes-wrong/','What should I do after a missed week?','Adjust the next week instead of trying to repay every missed mile.','missed sick busy week interruption'],
 ]],
 ['training','Pace & the training week','Understand what each run is for and how the week fits together.',[
  ['library/half-marathon-week/','How a half-marathon week fits together','The relationship between demanding sessions, easy days, and the long run.','half marathon schedule weekly'],
  ['library/the-two-paces/','Threshold pace and race pace','Two different jobs, and why your training needs both.','two paces threshold race'],
  ['how-fast-should-i-run','How fast should I run?','Pace and effort guidance for the different runs in your week.','pace zones speed'],
  ['easy-run','The easy run','What easy running is for and how to approach it.','easy slow aerobic base'],
  ['threshold-training','Threshold training','A closer look at controlled, sustained running.','tempo lactate threshold'],
  ['long-run-pace','Long-run pacing','The difference between easy and steady work during a longer run.','long run endurance steady finish'],
  ['sessions','Types of running sessions','Compare easy running, threshold, intervals, speed, and the long run.','intervals session workouts'],
  ['training-week','Building a training week','The purpose and placement of different training days.','plan weekly routine'],
  ['training-arc','The longer view','How training emphasis changes across a block of work.','season development progression'],
  ['pacing','Running by effort','Keep the purpose of the run in view when pace changes.','heat hills effort pace'],
  ['running-terms','Running terms, explained','A reference for the vocabulary used throughout the Library.','glossary definitions vocabulary'],
 ]],
 ['movement','Running form & strength','Explore movement, cues, and the strength work around your running.',[
  ['ghost/cues','Running form cues','Short cues from the six-week mechanics practice.','cadence technique stride posture form'],
  ['running-form-errors','Running form: what to look for','A field guide to common observations about running movement.','gait overstride shoulders technique'],
  ['strength','Strength around your running','The role of gym work, routines, and movement preparation.','gym lifting weights'],
  ['strength-routine','A strength routine for runners','A practical routine with the exercises laid out.','durability workout routine legs'],
  ['strength-activation','Before you run','Movement preparation and activation work.','warm up warmup activation'],
  ['mobility','Mobility practice','Movement work to explore alongside training.','stretch range motion flexibility'],
  ['anti-rotation','Anti-rotation work','A short routine focused on trunk control.','core rotation twist'],
  ['library/physique-volume/','Why every area does not get equal volume','How training emphasis shapes a strength program.','hypertrophy muscle physique forge sculpt'],
  ['library/why-phases/','Why a program has phases','Different periods of work give different priorities their turn.','strength phases forge sculpt'],
 ]],
 ['race','Prepare for your race','Plan the effort, practice the decisions, and find the right tools.',[
  ['race-strategy','Race pacing and execution','Think through the beginning, middle, and finish of the race.','racing strategy splits half marathon'],
  ['race-prep','Race-week preparation','A reference for tapering and the decisions before the start.','taper racing preparation'],
  ['split-calculator','Split calculator','Work out splits from your distance and target time.','calculator min mile km kilometer kilometre conversion','Tool'],
  ['fueling','Fueling your training','Food and fueling considerations across different sessions.','nutrition carbs carbohydrate hydration drink'],
  ['shoes','Choosing shoes for the session','Understand the different roles in a running-shoe rotation.','footwear trainers sneakers rotation'],
 ]],
 ['recovery','Recovery & returning','Find the guidance that fits the interruption, not just the old plan.',[
  ['recovery','Recovery between sessions','Rest, easy days, and how the next session fits.','rest fatigue tired recovery'],
  ['sleep','Sleep and training','A closer look at sleep within the training week.','sleep tired rest'],
  ['return','Returning to running','A re-entry guide after time away.','comeback restarting break'],
  ['training-interruptions','When training is interrupted','How to think about a disrupted block of work.','injury missed illness setback'],
  ['avoid-injury','Managing training load','General principles for noticing when training needs adjusting.','pain injury load prevention'],
  ['troubleshooting','When a run is not going well','A reference for noticing and adjusting during a run.','tension uncomfortable rhythm'],
 ]],
 ['practice','Plans, studies & the practice','See the work itself, follow a plan, or join a session.',[
  ['plans/','Find a training plan','Compare the published plans and read their scope before choosing.','training plan programs','Plans'],
  ['plans/race-pace-durability/','Race Pace Durability','A 15-week half-marathon plan. Read Weeks 1–4 before purchasing the full plan.','race pace durability rpd half marathon 15 week','Plan'],
  ['plans/raise-the-ceiling/','Raise the Ceiling','Read the published plan and its weekly work.','raise ceiling threshold','Plan'],
  ['labs/speed-that-endures/','Speed That Endures','Follow the race-pace development study and its evidence.','hope jose durability case study','Study'],
  ['labs/raise-the-ceiling/','Raise the Ceiling: the study','The work, observations, and evidence behind the block.','threshold study evidence','Study'],
  ['labs/hyrox/','HYROX: training and race tools','Explore the course, station work, and race-budget tools.','hyrox hybrid sled ski erg','Guide & tools'],
  ['labs/track/','Track workouts and standards','Browse the authored sessions and their execution standards.','track intervals sprint speed workouts','Workouts'],
  ['thursday','Run with us','Find the current Thursday track-session details and joining information.','miami flamingo south beach group join thursday community','Community'],
  ['notes','A note from the track','One observation, the adjustment, and the athlete’s response.','coaching note evidence form video','Field note'],
  ['form/','FORM running app','Explore the running app and its current store destination.','iphone ios mobile app form','App'],
  ['forge-sculpt/','Breechay Sculpt / Forge','Explore the strength program and its app.','forge breechay sculpt strength app','App'],
 ]],
];
const ARCHIVE = ['practice','start','plan','plan-spring-2026','cycles','the-field','competition','plan-speed-emergence','taper-key-biscayne','races/key-biscayne-2026'];
const PRESERVE_ONLY = ['athletes','ledger','app'];
const EXTRA = ['','library','plans/race-pace-durability/support/','es/plans/race-pace-durability/','labs/','field-notes','the-method','the-work','training-principles','training-map','principles','mechanics-map','easy-run-standards','pain-map','strength-fixes','threshold','long-run','ghost','ghost/week-1','ghost/week-2','ghost/week-3','ghost/week-4','ghost/week-5','ghost/week-6'];
function fileFor(route) { return !route?'index.html':route.endsWith('/')?route+'index.html':route==='ghost'?'ghost/index.html':route+'.html'; }
const entries = GROUPS.flatMap(([group,, , rows]) => rows.map(([route,title,description,keywords,type='Guide'])=>({route,url:'/'+route,file:fileFor(route),title,description,keywords:keywords.split(' '),category:group,type})));
module.exports={GROUPS,ARCHIVE,PRESERVE_ONLY,EXTRA,entries,fileFor};
