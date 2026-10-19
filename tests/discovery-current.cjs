'use strict';
// Current discovery acceptance. Historical September 2026 hash receipts are
// preserved, not enforced as if no October-approved redesign had happened.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../scripts/discovery-catalog.cjs');
const search = require('../js/discovery-search.js');
const share = require('../scripts/share-metadata.cjs');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const routes = new Set(urls);
const index = JSON.parse(read('search-index.json'));

function routeFile(route) {
  const u = new URL(route, share.ORIGIN);
  assert.equal(u.origin, share.ORIGIN, 'Only FORM public origin');
  const slug = decodeURIComponent(u.pathname).replace(/^\/+|\/+$/g, '');
  return (slug ? [slug, slug + '.html', slug + '/index.html'] : ['index.html'])
    .find(file => exists(file) && fs.statSync(path.join(root, file)).isFile());
}

assert.equal(new Set(urls).size, urls.length, 'No duplicate sitemap URLs');
assert.ok(!sitemap.includes('<lastmod>'), 'No invented modification dates');
assert.equal(new Set(index.map(entry => entry.url)).size, index.length, 'Unique search URLs');
assert.equal(index.length, catalog.entries.length, 'Search index follows authored catalog');
const catalogByUrl = new Map(catalog.entries.map(entry => [entry.url, entry]));
for (const entry of index) {
  const source = catalogByUrl.get(entry.url);
  assert.ok(source, 'Catalog owns ' + entry.url);
  assert.ok(entry.title && entry.description, 'Usable index copy: ' + entry.url);
  assert.equal(entry.title, source.title, 'Title source: ' + entry.url);
  assert.equal(entry.description, source.description, 'Description source: ' + entry.url);
  assert.ok(routeFile(entry.url), 'Search route resolves: ' + entry.url);
  assert.doesNotMatch(JSON.stringify(entry), /\b(?:Hideout|free forever|pending approval)\b/i,
    'Retired claims must not enter search');
  assert.doesNotMatch(entry.url,
    /^\/(?:coach|private|auth|record|purchase-success|mockup)(?:\/|$)/,
    'No private or delivery routes in search index');
}
for (const url of urls) {
  const file = routeFile(url);
  assert.ok(file, 'Sitemap route resolves: ' + url);
  const html = read(file);
  assert.equal(share.canonical(html, file), url, 'Current canonical: ' + file);
  const tags = [...share.head(html).matchAll(/<link\b[^>]*>/gi)]
    .filter(tag => share.attrs(tag[0]).rel === 'canonical');
  assert.equal(tags.length, 1, 'Exactly one canonical: ' + file);
  assert.doesNotMatch(share.meta(html, 'robots'), /noindex/i, 'Indexable page: ' + file);
}
for (const route of ['/plans/','/labs/','/labs/speed-that-endures/','/labs/adrian-runner-mass/','/library/easy-days/','/form/']) {
  assert.ok(routes.has(share.ORIGIN + route), 'Required public route ' + route);
}
assert.ok(!urls.some(url =>
  /^https:\/\/speedandform\.com\/(?:search|app|adrian|coach|private)(?:\/|$)/i.test(url)),
  'Excluded utility and private root paths');
assert.doesNotMatch(read('robots.txt'), /Disallow:\s*\/assets\//, 'Published assets crawlable');
const library = read('library.html');
for (const entry of index) assert.ok(library.includes('href="' + entry.url + '"'), 'Searchable without JS: ' + entry.url);
const schemaMatch = library.match(/id="discovery-schema">([\s\S]*?)<\/script>/);
assert.ok(schemaMatch, 'Public Library collection schema');
const schema = JSON.parse(schemaMatch[1]);
assert.equal(schema.mainEntity.itemListElement.length, index.length);
for (const file of ['library.html','search.html','404.html']) {
  const html = read(file);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One H1: ' + file);
  assert.ok(html.includes('role="search"'), 'Usable search in ' + file);
  assert.ok(html.includes('for="discovery-query"'), 'Search field labeled in ' + file);
  for (const href of ['/library','/plans/','/thursday','/coaching/miami/']) {
    assert.ok(html.includes('href="' + href + '"'), file + ' useful route ' + href);
  }
}
assert.equal(share.meta(read('search.html'),'robots'),'noindex,follow');
assert.equal(share.meta(read('404.html'),'robots'),'noindex,follow');
assert.ok(!read('js/discovery-search.js').includes('innerHTML'), 'Never inject search input as HTML');
assert.match(read('_redirects'), /^\/app(?:\.html)?\s+\/form\/\s+301!/m, 'App aliases still redirect to Running');
assert.equal(search.rank(index,'hyrox')[0].url, '/labs/hyrox/');
assert.ok(search.rank(index,'why are my easy runs hard').slice(0,3)
  .some(entry => entry.url === '/library/easy-days/'));
assert.ok(search.rank(index,'threshhold').some(entry => entry.title.includes('Threshold')));
assert.deepEqual(search.rank(index,'zzyyxxxq'), []);
assert.deepEqual(search.rank(index,'the and of'), []);
assert.equal(search.normalize('JOSÉ'),'jose');
console.log('PASS: current discovery: '+index.length+' catalog results, '+urls.length+
  ' verified sitemap URLs, direct HTML access, search safety, navigation and canonical truth.');
