'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'the-athletic-life/brief.md'),'utf8');
const built=fs.readFileSync(path.join(root,'the-athletic-life/index.html'),'utf8');
const {makePage,renderBrief}=require('../scripts/build-athletic-life.cjs');
assert.equal(built,makePage(source),'Page is generated exactly from the authoritative verbatim brief source');
assert.equal((source.match(/^## \d+\./gm)||[]).length,15,'Original contains fifteen full sections');
assert.equal(renderBrief(source).sections.length,15,'All fifteen sections are rendered');
assert.equal((built.match(/class="al-chapter"/g)||[]).length,15,'One chapter landmark per section');
assert.equal((built.match(/class="al-meta-item"/g)||[]).length,5,'All original publication metadata retained');
for(const phrase of [
 'How can we meaningfully improve the lives of the athletes and people already connected to FORM?',
 'Do not assume that the answer is more features.',
 'The app is not the entire product. It is the surface of a broader service.',
 'What could FORM make possible in an athlete',
 'Those are database counts, not claims about app engagement',
 'Privacy','The quality bar for the answer'
])assert.ok(built.includes(phrase), 'Preserve substantive sentence: '+phrase);
assert.match(built,/href="#chapter-15"/,'Contents reaches the final section');
assert.match(built,/aria-label="Article navigation"/,'Accessible desktop contents');
assert.match(built,/class="al-mobile-index"/,'Accessible phone contents');
assert.match(built,/href="https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/40256835\/"/,'Original research links preserved');
assert.match(built,/rel="canonical" href="https:\/\/speedandform\.com\/the-athletic-life\/"/,'Canonical URL correct');
assert.doesNotMatch(built,/<h1[^>]*>The Athletic Life\.<\/h1>/,'Title remains verbatim');
console.log('The Athletic Life: verbatim source, chapter/metadata navigation and reading-page contract verified');
