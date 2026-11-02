'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'the-athletic-life/brief.md'),'utf8');
const built=fs.readFileSync(path.join(root,'the-athletic-life/index.html'),'utf8');
const {makePage,renderBrief}=require('../scripts/build-athletic-life.cjs');
assert.equal(built,makePage(source),'Page is generated from brief.md');
assert.equal((source.match(/^## \d+\./gm)||[]).length,7,'Seven sections');
assert.equal(renderBrief(source).sections.length,7,'All sections are rendered');
assert.equal((built.match(/class="al-chapter"/g)||[]).length,7,'One chapter landmark per section');
for(const phrase of [
 'What could FORM make possible in an athlete',
 'The app is not the whole product.',
 'The coach is the coach.',
 'Nothing is claimed before it is real.',
 'Have people to run with'
])assert.ok(built.includes(phrase),'Keep: '+phrase);
for(const gone of ['Research Brief','codex/','github.com','Athlete records','$500'])assert.ok(!built.includes(gone),'Stays off the public page: '+gone);
assert.doesNotMatch(source,/—/,'No em dashes');
assert.doesNotMatch(fs.readFileSync(path.join(root,'css/athletic-life.css'),'utf8'),/#406e8b|#245b7b|#6f9fc0/i,'Ink and bone only');
assert.match(built,/href="\/the-athletic-life\/next\/"/,"Links What's next");
assert.match(built,/aria-label="Article navigation"/,'Accessible desktop contents');
assert.match(built,/class="al-mobile-index"/,'Accessible phone contents');
assert.match(built,/rel="canonical" href="https:\/\/speedandform\.com\/the-athletic-life\/"/,'Canonical URL correct');
console.log('The Athletic Life: north star source, navigation and ink-and-bone contract verified');
