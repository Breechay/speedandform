'use strict';

// FORM athlete portraits: immutable *filenames*, revalidating cache headers.
// A formerly missing image can remain cached as a 404 after a successful deploy.
// Publish a new asset path first, then link that path in canonical Supabase records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function netlifyHeadersPolicy() {
  const sections = read('_headers').split(/\r?\n/);
  const start = sections.findIndex(line => line === '/assets/athletes/*');
  assert.notEqual(start, -1, '_headers must define an athlete-specific cache policy');
  const generic = sections.findIndex(line => line === '/assets/*');
  assert.ok(generic !== -1 && generic < start,
    'Specific athlete cache policy must appear after the generic asset policy');
  const rules = [];
  for (let i = start + 1; i < sections.length && /^\s/.test(sections[i]); i++) {
    rules.push(sections[i].trim());
  }
  const policy = rules.find(rule => /^Cache-Control:/i.test(rule));
  assert.ok(policy, '_headers athlete policy needs Cache-Control');
  return policy.replace(/^Cache-Control:\s*/i, '');
}

function netlifyTomlPolicy() {
  const sections = read('netlify.toml').split(/(?=^\[\[headers\]\]\s*$)/m);
  const matches = sections.filter(section =>
    /^\[\[headers\]\]\s*\r?\n\s*for\s*=\s*"\/assets\/athletes\/\*"/.test(section)
  );
  assert.equal(matches.length, 1,
    'netlify.toml must have exactly one athlete-specific header block');
  const policy = matches[0].match(/^\s*Cache-Control\s*=\s*"([^"]+)"/m)?.[1];
  assert.ok(policy, 'netlify.toml athlete header needs Cache-Control');
  return policy;
}

function verifyPolicy(policy, source) {
  assert.doesNotMatch(policy, /\bimmutable\b/i,
    source + ': athlete URLs must not use immutable CDN caching');
  const match = policy.match(/(?:^|,)\s*max-age\s*=\s*(\d+)(?:,|$)/i);
  assert.ok(match, source + ': specify a bounded max-age');
  const seconds = Number(match[1]);
  assert.ok(seconds <= 3600, source + ': athlete cache lifetime must be at most one hour');
  assert.match(policy, /\bmust-revalidate\b/i, source + ': must revalidate');
}

const headerPolicy = netlifyHeadersPolicy();
const tomlPolicy = netlifyTomlPolicy();
verifyPolicy(headerPolicy, '_headers');
verifyPolicy(tomlPolicy, 'netlify.toml');
assert.equal(headerPolicy, tomlPolicy,
  'Portrait cache policy must match in _headers and netlify.toml');

const directory = path.join(root, 'assets/athletes');
const portraits = fs.readdirSync(directory, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.(jpe?g|png|webp)$/i.test(entry.name));
assert.ok(portraits.length > 0, 'Expected published athlete portrait files');

for (const entry of portraits) {
  assert.doesNotMatch(entry.name, /[?%#\s]/,
    'Portrait filenames must be clean, without query strings or spaces');
  const data = fs.readFileSync(path.join(directory, entry.name));
  assert.ok(data.length >= 24, entry.name + ': empty or truncated image');
  const extension = path.extname(entry.name).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') {
    assert.ok(data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
      entry.name + ': JPEG magic bytes are missing');
  } else if (extension === '.png') {
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a',
      entry.name + ': PNG magic bytes are missing');
  } else {
    assert.equal(data.subarray(0, 4).toString('ascii'), 'RIFF',
      entry.name + ': invalid WebP RIFF header');
    assert.equal(data.subarray(8, 12).toString('ascii'), 'WEBP',
      entry.name + ': invalid WebP signature');
  }
}

// PR gate: do not modify, delete, or rename paths that may already be cached on phones.
// A repaired portrait must be added under a *new* basename.
const baseSha = process.env.FORM_PORTRAIT_BASE_SHA || '';
if (baseSha) {
  assert.match(baseSha, /^[a-f\d]{40}$/i, 'Invalid PR base SHA');
  const diff = execFileSync('git', [
    'diff', '--name-status', '--no-renames', baseSha + '...HEAD',
    '--', 'assets/athletes'
  ], { cwd: root, encoding: 'utf8' }).trim();
  const invalid = diff.split('\n').filter(Boolean)
    .filter(line => !line.startsWith('A\t'));
  assert.deepEqual(invalid, [],
    'Existing portrait paths cannot be modified/renamed/deleted. Add a versioned filename instead.');
}

console.log('PASS: athlete portraits (' + portraits.length +
  ' valid assets, revalidating CDN policy, published-path preservation)');
