'use strict';
// Public share contract for the current house. The Sept 2026 historical
// screenshot and byte-identity receipt remains in its original test file.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const share = require('../scripts/share-metadata.cjs');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const exists = file => fs.existsSync(path.join(root,file));
const cards = JSON.parse(read('data/public-share.json'));
const required = ['og:title','og:description','og:url','og:image',
  'twitter:card','twitter:title','twitter:description','twitter:image'];
let checked = 0;
for (const [file,card] of Object.entries(cards)) {
  if (!exists(file)) continue;
  const html = read(file);
  if (/noindex/i.test(share.meta(html,'robots'))) continue;
  const head = share.head(html);
  for (const key of required) {
    const tags = [...head.matchAll(/<meta\b[^>]*>/gi)]
      .filter(match => {
        const a = share.attrs(match[0]);
        return (a.property || a.name) === key;
      });
    assert.equal(tags.length,1, file+' unique '+key);
    assert.ok(share.meta(html,key),file+' nonempty '+key);
  }
  assert.equal(share.meta(html,'og:url'), share.canonical(html,file), file+' share URL canonical');
  assert.equal(share.meta(html,'og:image'), share.meta(html,'twitter:image'), file+' image parity');
  assert.equal(share.meta(html,'og:description'), share.meta(html,'twitter:description'), file+' description parity');
  assert.equal(share.meta(html,'og:site_name').replace(/&amp;/g,'&'),'Speed & Form',file+' house signature');
  checked++;
}
assert.ok(checked>=30,'Current approved share cards should cover major public pages');
// Canonical source: a generated share update should survive the next build.
for (const file of ['index.html','plans/index.html']) {
  const card = cards[file];
  const html = read(file);
  assert.ok(card && card.title && card.description && card.image,file+' has authored share data');
  const decoded = s => s.replace(/&amp;/g,'&').replace(/&#39;/g,"'");
  assert.equal(decoded(share.meta(html,'og:description')), card.description, file+' description from owner source');
  assert.equal(decoded(share.meta(html,'twitter:description')), card.description, file+' Twitter description from owner source');
}
console.log('PASS: '+checked+' current public share records with canonical URLs, unique social tags, images and source agreement.');
