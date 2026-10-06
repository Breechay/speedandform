import assert from 'node:assert/strict';
import { forgeSection } from '../private/record.js';

const receipt = {
  received_at: '2026-10-08T10:00:00Z',
  native_payload: {
    sessionName: 'Upper A', planWeekNumber: 4, durationSeconds: 3300,
    feedback: '<b>felt good</b>', completedAt: '2026-10-08T10:00:00Z',
    sets: [
      { movementId: 'cable_rear_delt_fly', movementName: 'Cable Rear-Delt Fly', weight: 25, reps: 12, completedAt: '2026-10-08T09:10:00Z' },
      { movementId: 'cable_rear_delt_fly', movementName: 'Cable Rear-Delt Fly', weight: 25, reps: 11, completedAt: '2026-10-08T09:13:00Z' },
      { movementId: 'dead_bug', movementName: 'Dead Bug', seconds: 30, completedAt: '2026-10-08T09:40:00Z' }
    ]
  }
};
const html = forgeSection({ forgeReceipts: [receipt] });
assert.match(html, /Upper A/);
assert.match(html, /Week 4/);
assert.match(html, /Cable Rear-Delt Fly<\/strong> — 25 lb × 12 reps, 25 lb × 11 reps/);
assert.match(html, /Dead Bug<\/strong> — 30 sec/);
assert.ok(!html.includes('<b>felt good</b>'), 'session feedback is escaped');
assert.equal(forgeSection({ forgeReceipts: [] }), '', 'no receipts, nothing shown');
assert.equal(forgeSection({}), '');
assert.equal(forgeSection({ forgeReceipts: [{ received_at: 'x', native_payload: null }] }), '', 'legacy summary rows are not performed work');
console.log('PASS: Console shows performed Forge sets per session, escapes feedback, ignores legacy summary receipts.');
