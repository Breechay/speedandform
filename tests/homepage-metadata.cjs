/* Run: node tests/homepage-metadata.cjs. Uses only Node's standard library. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const head = html.split('</head>')[0];
function meta(key) {
  const matches = [...head.matchAll(/<meta\b[^>]*>/gi)].filter(tag =>
    new RegExp(`(?:name|property)="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(tag[0]));
  assert.equal(matches.length, 1, `Exactly one ${key}`);
  return matches[0][0].match(/content="([^"]*)"/)[1];
}
assert.equal([...head.matchAll(/<title>/g)].length, 1);
assert.match(head, /<title>Running Coach in Miami &amp; Online \| Speed &amp; Form<\/title>/);
assert.equal(meta('og:title'), 'Run better. Get faster. Run farther. | FORM');
assert.equal(meta('twitter:title'), meta('og:title'));
assert.ok(meta('description').length <= 160);
assert.equal(meta('og:description'), meta('twitter:description'));
assert.equal(meta('og:url'), 'https://speedandform.com/');
assert.match(head, /<link rel="canonical" href="https:\/\/speedandform.com\/">/);
assert.equal(meta('og:type'), 'website');
assert.equal(meta('og:locale'), 'en_US');
assert.equal(meta('twitter:card'), 'summary_large_image');
assert.match(meta('robots'), /max-image-preview:large/);
const imageURL = new URL(meta('og:image'));
assert.equal(imageURL.origin, 'https://speedandform.com');
assert.equal(imageURL.pathname, '/og/homepage-run-development-20260916.jpg');
assert.equal(meta('twitter:image'), imageURL.href);
assert.equal(meta('og:image:secure_url'), imageURL.href);
assert.equal(meta('og:image:type'), 'image/jpeg');
assert.equal(meta('og:image:width'), '1200');
assert.equal(meta('og:image:height'), '630');
assert.equal(meta('og:image:alt'), meta('twitter:image:alt'));
assert.ok(meta('og:image:alt').length > 30);
assert.ok(!head.includes('/og/default.jpg'));
const jpeg = fs.readFileSync(path.join(root, imageURL.pathname));
assert.ok(jpeg.length < 300000, 'Share card below 300 KB');
assert.equal(jpeg.readUInt16BE(0), 0xffd8);
let dimensions;
for (let i = 2; i < jpeg.length - 8;) {
  assert.equal(jpeg[i], 0xff, 'Valid JPEG marker');
  const marker = jpeg[i+1];
  if (marker === 0xda || marker === 0xd9) break;
  const size = jpeg.readUInt16BE(i+2);
  if ([0xc0, 0xc1, 0xc2].includes(marker)) {
    dimensions = [jpeg.readUInt16BE(i+7), jpeg.readUInt16BE(i+5)]; break;
  }
  i += size + 2;
}
assert.deepEqual(dimensions, [1200, 630]);
const scripts = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
const schema = JSON.parse(scripts[0][1]);
assert.equal(schema['@context'], 'https://schema.org');
assert.equal(new Set(schema['@graph'].map(n => n['@id'])).size, 4);
assert.deepEqual(schema['@graph'].map(n => n['@type']), ['Organization', 'WebSite', 'WebPage', 'Service']);
assert.equal(schema['@graph'][2].primaryImageOfPage.url, imageURL.href);
assert.ok(!/aggregateRating|reviewCount|streetAddress/.test(scripts[0][1]));
assert.match(html, /<video id="filmA" src="\/media\/run-development.mp4\?v=rd16"/);
assert.match(html, /<script defer src="\/js\/coaching-measurement.js"><\/script>/);
console.log('PASS: unique search/OG/Twitter tags, canonical, schema, original film/measurement, JPEG 1200x630 and size.');
