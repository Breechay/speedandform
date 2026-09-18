import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const graphite = read('private/graphite.css');
const workspace = read('athlete/workspace.css');
const athlete = read('athlete/athlete.js');
const rpdStyles = read('plans/race-pace-durability/styles.css');
const rpdAccessStyles = read('plans/race-pace-durability/access.css');
const rpdSource = read('plans/race-pace-durability/source.js');
const restore = read('plans/race-pace-durability/access/access.js');
const restorePage = read('plans/race-pace-durability/access/index.html');

let checks = 0;
const has = (text, re, message) => { assert.match(text, re, message); checks += 1; };
const lacks = (text, re, message) => { assert.doesNotMatch(text, re, message); checks += 1; };

has(workspace, /\.athlete-tab\{min-height:44px/, 'athlete tabs keep a 44px target');
has(workspace, /\.plan-week-nav button\{width:44px;height:44px/, 'week navigation keeps a 44px target');
has(workspace, /\.text-action\{min-height:44px/, 'text actions keep a 44px target');

has(graphite, /\.record-nav > summary \{[\s\S]*?width: 44px; height: 44px/, 'private record menu keeps a 44px target');
has(graphite, /\.link-button \{ min-height:44px/, 'inline auth action keeps a 44px target');
has(graphite, /\.part-drop \{[\s\S]*?width:44px; height:44px/, 'session part delete keeps a 44px target');
has(graphite, /\.parts-add \{ min-height:44px/, 'session part add keeps a 44px target');
has(graphite, /\.coachReviewChain button \{\n  min-height: 44px;/, 'coach review action keeps a 44px target');

has(athlete, /role="status" aria-live="polite"><span class="sr-only">Loading your training…/, 'athlete loading is announced');
has(athlete, /Your account and training were not changed\./, 'athlete error does not imply data loss');
has(athlete, /Use another account/, 'athlete error has an account recovery route');
lacks(athlete, /is secure, but it has not been matched/, 'pending account copy avoids vague security claim');

has(rpdStyles, /\.topnav a\{min-height:44px/, 'RPD desktop nav is touch sized');
has(rpdStyles, /\.btn\{min-height:44px;height:auto/, 'RPD desktop buttons are touch sized');
has(rpdStyles, /\.circle\{width:44px;height:44px/, 'RPD desktop week arrows are touch sized');
has(rpdStyles, /button:focus-visible,a:focus-visible\{outline:2px solid var\(--lime\)/, 'RPD interactive controls keep visible keyboard focus');
has(rpdStyles, /\.plan-section:focus-visible\{outline:2px solid var\(--lime\)/, 'RPD keyboard plan surface keeps visible focus');
has(rpdAccessStyles, /\.share-icon-btn\{min-width:44px\}/, 'RPD mobile share target is touch sized');
has(rpdAccessStyles, /\.circle\{width:44px;height:44px\}/, 'RPD mobile week arrows are touch sized');

has(rpdSource, /Your training has not changed\. Try again or open your account\. There is no need to make another payment\./, 'RPD failed verification preserves access truth');
has(rpdSource, /id="rpdRetry"/, 'RPD failed verification has retry');
has(restore, /if \(!response\.ok\) \{\n    throw new Error\('Purchase lookup unavailable'\);/, 'restore transport failure is not treated as no purchase');
has(restore, /Nothing was charged or changed/, 'purchase restore failure does not imply payment or access change');
lacks(restore, /Sending a secure link/, 'restore flow uses plain sign-in language');
lacks(restorePage, /secure sign-in link/i, 'restore page uses plain sign-in language');
has(restorePage, />Send sign-in link</, 'restore CTA says what it does');

console.log(`PASS: ${checks} cross-surface accessibility/recovery checks`);
