// The Forge privacy policy must describe the one build that ships: an optional coaching account,
// consented sharing, and nothing the app does not do. Fails if an old cloud-off claim returns.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('forge-sculpt/privacy/index.html', 'utf8');
const text = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ');
let checks = 0;
const has = (s, m) => { assert.ok(text.includes(s), m || `missing: ${s}`); checks += 1; };
const lacks = (s, m) => { assert.ok(!text.includes(s), m || `stale claim: ${s}`); checks += 1; };

lacks('does not require an account or login');
lacks('do not ask for or collect your name, email');
lacks('does not run its own servers');
lacks('the only third party');
lacks('FORGE has no account');
lacks('does not run cloud backup or automatic synchronization for your training data');

has('optional coaching account');
has('Account optional');
has('we collect that email address and an account identifier');
has('Only if you turn on sharing');
has('Profile → Coach account');
has('Request deletion');
has('You can turn sharing off at any time');
has('Supabase hosts the account');
has('never sent');
has('does not use third-party analytics, advertising networks, or tracking identifiers');
has('does not track you across other apps or websites');
const date = /Effective date: ([A-Za-z]+ \d+, \d{4})/.exec(text)?.[1];
assert.ok(date && new Date(date) >= new Date('2026-10-07'), `the effective date must be updated (found ${date})`); checks += 1;
console.log(`PASS: ${checks} Forge privacy policy checks (optional account described; no stale cloud-off claims).`);
