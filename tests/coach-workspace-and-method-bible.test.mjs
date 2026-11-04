import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const nav = [
  ['/coach/ops/', 'Today'],
  ['/coach/labs/', 'Athletes'],
  ['/coach/console/', 'Programming'],
  ['/coach/miami/', 'Group sessions'],
  ['/coach/runs/', 'Runs']
];

test('every coach work area has the same five human-readable destinations', () => {
  for (const page of ['coach/index.html','coach/ops/index.html',
    'coach/runs/index.html','coach/miami/index.html']) {
    const html = read(page);
    assert.match(html, /aria-label="Coach workspace"/, page);
    for (const [href, name] of nav) {
      assert.ok(html.includes(`href="${href}"`), `${page} missing ${name}`);
    }
    assert.match(html, /coach\/workspace-light\.css\?v=1/, page);
  }
  const labs = read('coach/labs/labs.js');
  for (const [href, name] of nav) {
    assert.ok(labs.includes(`href="${href}"`), `Labs missing ${name}`);
  }
  assert.match(labs, /id="ccRosterSearch"/);
  assert.match(labs, /coach\/console\/\?athlete=\$\{encodeURIComponent\(record\.athlete\.slug\)\}/);
});

test('the public Method Bible is rendered static HTML with a complete anchor index', () => {
  const generated = read('method-bible/index.html');
  const source = read('method-bible/method.md');
  const htmlSections = [...generated.matchAll(/<section class="chapter" id="([^"]+)"/g)].map((m) => m[1]);
  const tocLinks = [...generated.matchAll(/<a href="#([^"]+)"><span>/g)].map((m) => m[1]);
  assert.equal(htmlSections.length, 17);
  assert.equal(new Set(htmlSections).size, 17);
  for (const id of htmlSections) assert.ok(tocLinks.includes(id), `TOC missing ${id}`);
  assert.match(source, /Training to win is not racing the workouts/);
  assert.match(source, /strength, mobility, nourishment, sleep/);
  assert.match(source, /Skill acquisition/);
  assert.match(source, /Recovery cost/);
  assert.match(source, /glutes/i);
  assert.match(generated, /application\/ld\+json/);
  assert.match(generated, /rel="canonical" href="https:\/\/speedandform\.com\/method-bible\/"/);
  assert.match(generated, /rel="alternate" type="text\/markdown"/);
});

test('Method Bible source, site map and agent discovery agree', () => {
  const map = JSON.parse(read('coach/agent-map.json'));
  assert.equal(map.schema_version, 1);
  assert.equal(map.public_method.text, '/method-bible/method.md');
  assert.equal(map.navigation.length, 5);
  assert.match(read('llms.txt'), /method-bible\/method\.md/);
  assert.match(read('sitemap.xml'), /method-bible\//);
  assert.match(read('index.html'), /href="\/method-bible\/"/);
  assert.match(read('the-method.html'), /href="\/method-bible\/"/);
  assert.match(read('training-map.html'), /href="\/method-bible\/"/);
  assert.doesNotMatch(read('training-map.html'), /Speed is not trained directly/);
});

test('public Method Bible follows discovery and sharing release rules', () => {
  const html = read('method-bible/index.html');
  const sitemap = read('sitemap.xml');
  assert.doesNotMatch(sitemap, /<lastmod>/, 'Sitemap must not invent dates');
  assert.doesNotMatch(sitemap, /<loc>[^<]*method-bible\/method\.md<\/loc>/,
    'Sitemap indexes the HTML article; llms.txt owns the plain text route');
  for (const tag of ['og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.ok(html.includes(tag), `Missing social metadata ${tag}`);
  }
  assert.match(html, /https:\/\/speedandform\.com\/og\/public-the-method-20261006\.jpg/);
});

test('a browser reread never misrepresents an external source refresh', () => {
  const ops = read('coach/ops/console.js');
  assert.match(ops, /function refreshIfAged\(/);
  assert.match(ops, /document\.visibilityState !== 'visible'/);
  assert.match(ops, /5 \* 60 \* 1000/);
  assert.match(ops, /source_as_of/);
  assert.match(read('coach/labs/labs.js'), /Refresh failed · previous record shown/);
  assert.match(read('coach/AGENT_OPERATIONS.md'), /browser may reread/i);
});

test('Method Bible HTML rebuild is deterministic', () => {
  const before = read('method-bible/index.html');
  const run = spawnSync('node', ['scripts/build-method-bible.cjs'], {
    cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8'
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(read('method-bible/index.html'), before);
});
