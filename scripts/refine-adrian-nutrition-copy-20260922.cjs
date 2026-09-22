'use strict';
// Editorial refinement requested by Brice. Training and food portions are unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'plans/adrian-nutrition-phase-01/index.html');
let n=fs.readFileSync(file,'utf8');
const edits=[
 ['Tell Brice when food before a run bothers your stomach; do not force it.',''],
 ['Send Brice photos of 2 normal work lunches. We will check the portions without asking you to replace a meal that is already provided.','Take photos of 2 normal work lunches.'],
 ['Keep dinner. When this box repeatedly leaves you too full for dinner, tell Brice so we can reduce the box rather than quietly losing another meal.','Keep dinner.'],
 ['Those rice-and-bean portions are a guide for that dinner, not extras to stack onto a full pasta dinner. Keep the family menu. Send 2 dinner photos so we can fit the portions to what is actually served.','For a pasta dinner, the pasta replaces the rice and beans. Take photos of 2 normal dinners.'],
 ['Send Brice a photo of a normal order so the serving can be checked instead of guessed.','Take a photo of your usual order.'],
 ['Send the nugget package label before we set the portion: 15 nuggets is your reported habit, not a verified protein serving.','Take a photo of the chicken nugget package label.'],
 ['These are coaching selections, not a claim that you named every one as a favorite.',''],
 ['Chili, meatballs, tuna and pizza stay on your list for future variety. We are not asking you to choose a different menu every day. Tell Brice what to add or remove. Your messages update this list; opening the page does not save changes.','Chili, meatballs, tuna and pizza stay on your list for future variety.'],
 [' That routine is accounted for above.',''],
 ['Keep the same food for the day, but ask Brice to place it around your actual start time.','Keep the same food for the day, with the larger meal away from the start of your run.'],
 ['After 7 days, send Brice a short note:','After 7 days, record:'],
 ['Send 2 lunch photos and 2 dinner photos during that week.','Take photos of 2 normal work lunches and 2 normal dinners.'],
 ['Tell Brice before progressing a lift when soreness limits normal movement.','Do not progress a lift while soreness limits normal movement.'],
 [' Do not try to solve that with another shake.',''],
 ['Tell Brice the day you start so your first review can use a real start date.','Record the day you start.'],
 ['This is a meal, not a tiny snack. No exact calories or protein per box are claimed without your ingredient labels.',''],
 ['Before your first serving, tell Brice about any food allergies, relevant medicines or medical constraints. Stop a new powder and report any reaction.','Do not use with an allergy to milk or any other ingredient. Check relevant medicines or medical constraints with a qualified clinician before starting a new supplement. Stop using a new powder if it causes a reaction.'],
];
for(const [from,to] of edits){if(n.includes(from))n=n.replaceAll(from,to);}
n=n.replace(/<nav class="nav"[^>]*>[\s\S]*?<\/nav>/,'');
n=n.replace(/\.nav\{[^}]*\}\.nav a\{[^}]*\}/,'').replace('.nav{display:none}','');
n=n.replaceAll('v1.1','v1.2').replace('<strong>Version:</strong> 1.1','<strong>Version:</strong> 1.2');
n=n.replaceAll('<p class="small"></p>','');
if(!n.includes('id="supplement-notes"')){
 const start=n.indexOf('<p class="small">NSF lists the chocolate product');
 assert(start>=0,'Certification note missing');
 const end=n.indexOf('</p>',start)+4;
 const note=n.slice(start,end);
 n=n.slice(0,start)+'<p class="small">NSF Certified for Sport. Contains milk.</p>'+n.slice(end);
 n=n.replace('<details id="review">','<details id="supplement-notes"><summary>Protein powder details</summary><div class="inside">'+note+'</div></details>\n<details id="review">');
}
assert(!/<nav class="nav"/.test(n),'Top navigation was not removed');
assert(n.includes('Take photos of 2 normal work lunches.'));
assert(!/tell Brice|send Brice|ask Brice/i.test(n),'Unneeded communication instructions remain');
assert(n.includes('Severe or worsening pain'),'Medical warning must remain');
assert(n.includes('Check relevant medicines'),'Supplement precautions must remain');
assert(n.includes('160°F')&&n.includes('165°F'),'Food-safety temperatures must remain');
fs.writeFileSync(file,n);
const dataPath=path.join(root,'docs/studies/ADRIAN-NUTRITION-INTAKE-20260922.json');
let data=JSON.parse(fs.readFileSync(dataPath,'utf8'));data.version='1.2';
data.editorial_revision='Removed top navigation. Direct second-person actions only; photo instructions shortened. Supplement and evidence notes remain in collapsed footer. Food quantities and training assignments unchanged.';
fs.writeFileSync(dataPath,JSON.stringify(data,null,2)+'\n');
const studyPath=path.join(root,'labs/adrian-runner-mass/index.html');let h=fs.readFileSync(studyPath,'utf8');
let start=h.indexOf('const STUDY = ');assert(start>=0);start=h.indexOf('{',start);let level=0,q=false,e=false,end;
for(let i=start;i<h.length;i++){const c=h[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false;continue;}if(c==='"'){q=true;continue;}if(c==='{')level++;if(c==='}'&&--level===0){end=i+1;break;}}
assert(end);const S=JSON.parse(h.slice(start,end));S.intake20260922=data;
h=h.slice(0,start)+JSON.stringify(S,null,1)+h.slice(end);fs.writeFileSync(studyPath,h);
const testPath=path.join(root,'tests/adrian-nutrition-browser.py');let test=fs.readFileSync(testPath,'utf8');
test=test.replace("page.locator('a[href=\"#preferences\"]').click()","assert page.locator('nav.nav').count()==0\n        assert page.get_by_text('Take photos of 2 normal work lunches.',exact=True).count()==1\n        page.locator('#preferences > summary').click()");
fs.writeFileSync(testPath,test);
const roadmap=path.join(root,'docs/roadmap/FORM-ROADMAP.md');let r=fs.readFileSync(roadmap,'utf8');
if(!r.includes('Nutrition 01 v1.2 copy refinement'))r+='\n### Nutrition 01 v1.2 copy refinement\n\nOwner-directed edit: remove top navigation links and repeated coach-contact explanations. Use direct photo instructions. Preserve meal portions, dietary exclusions, food-safety and medical warnings; move supplement detail into a collapsed footer. Updated browser checks use the disclosure itself. This source note is not a production verification.\n';
fs.writeFileSync(roadmap,r);
console.log('Adrian v1.2 copy: no top navigation; concise actions; safety and portions preserved.');
