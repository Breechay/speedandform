import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const data = read('private/data.js');
const editorial = read('private/session-editorial-standard.mjs');

test('both Console and Labs share preflight before any write RPC', () => {
  assert.match(data, /export async function authorSession\(payload\) \{\s*await preflightSessionPublication\(payload\)/);
  assert.match(data, /export async function reviseSession\(plannedSessionId, payload\) \{\s*await preflightSessionPublication\(payload, plannedSessionId\)/);
  assert.match(data, /selfAuditSessionCopy\(payload, previous\)/);
  assert.match(data, /prescriptionPresentationIssues\(payload\.title, components \|\| \[\]\)/);
  assert.match(data, /Publication hold:/);
  assert.match(editorial, /changedSessionEditorialIssues/);
});

test('write RPC result is read back without pretending device or feed visibility', () => {
  assert.match(data, /readbackSessionPublication\(data, payload\)/);
  assert.match(data, /readbackSessionPublication\(plannedSessionId, payload, data\)/);
  assert.match(data, /expectedVersionId && latest\.id !== expectedVersionId/);
  assert.match(data, /latest\.title !== String\(payload\.title/);
  assert.match(data, /athleteFeedVerified: false, nativeDeviceVerified: false/);
  assert.match(data, /do not duplicate the write/i);
});
