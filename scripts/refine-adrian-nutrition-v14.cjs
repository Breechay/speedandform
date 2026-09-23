// The visual has been materialized and committed after browser acceptance.
// Keep this one-time revision idempotent; no training, records or backend writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../plans/adrian-nutrition-phase-01');
const file=path.join(dir,'index.html');
let html=fs.readFileSync(file,'utf8');
assert(html.includes('data-shopping-revision="1.4"'),'Expected accepted, materialized v1.4 shopping');
assert.equal((html.match(/data-shop-key=/g)||[]).length,20);
assert(html.includes('Keep your established long-run fuel.'));
// The unnumbered source photo shows uncooked penne. Use the publisher's finished-dish hero.
const previous='https://eatinginaninstant.com/wp-content/uploads/2023/02/ip-ground-beef-pasta-1200-768x1083.jpg';
const finished='https://eatinginaninstant.com/wp-content/uploads/2023/02/ip-ground-beef-pasta-3-1200.jpg';
if(html.includes(previous)){html=html.replace(previous,finished);fs.writeFileSync(file,html);}
assert(html.includes(finished));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'review-context.json'),'utf8'));
assert.equal(manifest.intervention_started_at,null);
assert.equal(manifest.training_sources.nutrition_revision_changes_training,false);
console.log('Adrian v1.4 static source verified; finished penne photograph retained; training unchanged.');
