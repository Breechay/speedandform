import assert from 'node:assert/strict';
import { forgeSection, forgeEvidenceSummary } from '../private/record.js';

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

// ── With the session-state views present ─────────────────────────────────────────────────
const record = {
  sessions: [{ id: 's1', currentVersion: { id: 'v2', version_number: 4, title: 'Lower A' },
               versions: [{ id: 'v2', version_number: 4, title: 'Lower A' }, { id: 'v1', version_number: 3, title: 'Lower A' }] },
             { id: 's2', currentVersion: { id: 'w1', version_number: 1, title: 'Upper B' }, versions: [{ id: 'w1', version_number: 1, title: 'Upper B' }] }],
  forgeReceipts: [{ ...receipt, receipt_id: 'r1' }, { ...receipt, receipt_id: 'r-old', received_at: '2026-10-01T10:00:00Z', native_payload: { ...receipt.native_payload, sessionName: 'Lower A', completedAt: '2026-10-01T10:00:00Z', sets: [receipt.native_payload.sets[2]] } }],
  forgeMovements: [
    { receipt_id: 'r1', planned_session_version_id: 'v1', movement_id: 'cable_rear_delt_fly', movement_name: 'Cable Rear-Delt Fly', performed_sets: 2,
      performed: [{ set_index: 0, weight: 25, reps: 12 }, { set_index: 1, weight: 25, reps: 11 }], prescribed_sets: 3, rep_low: 12, rep_high: 18, rep_unit: null, side_word: null, instruction: 'Keep your <chest> supported.' },
    { receipt_id: 'r1', planned_session_version_id: 'v1', movement_id: 'dead_bug', movement_name: 'Dead Bug', performed_sets: 1,
      performed: [{ set_index: 0, weight: null, reps: null, seconds: 30 }], prescribed_sets: 2, target_seconds: 30, target_seconds_high: 45, side_word: 'side' },
    { receipt_id: 'r-old', planned_session_version_id: null, movement_id: 'dead_bug', movement_name: 'Dead Bug', performed_sets: 1, performed: [{ set_index: 0, seconds: 30 }], prescribed_sets: null }
  ],
  forgeState: { last_opened_at: '2026-10-08T09:00:00Z', last_opened_session_id: 's1', last_left_at: '2026-10-08T09:30:00Z', last_left_set_count: 2,
                last_completed_at: '2026-10-05T12:00:00Z', last_completed_session_id: 's1', next_session_id: 's2', next_session_on: '2026-10-09' }
};
const rich = forgeSection(record);
assert.match(rich, /prescribed 3 \u00d7 12\u201318; did 2: 25 lb \u00d7 12, 25 lb \u00d7 11/, 'each movement shows what was prescribed beside what was done');
assert.match(rich, /prescribed 2 \u00d7 30\u201345 sec \/ side; did 1: 30 sec/, 'timed work keeps its range and side');
assert.match(rich, /prescription v3 \(since revised to v4\)/, 'a receipt performed on an older version says the prescription has since changed');
assert.match(rich, /no prescription recorded/, 'work filed before version identity says so rather than inventing a prescription');
assert.ok(!rich.includes('<chest>') && rich.includes('&lt;chest&gt;'), 'the authored instruction is escaped');
assert.match(rich, /Last opened<\/strong> Oct 8 \u00b7 Lower A/, 'where he is: last opened, by name');
assert.match(rich, /Last left part-way<\/strong> Oct 8 \u00b7 2 sets done/, 'a workout left part-way is visible');
assert.match(rich, /Next<\/strong> Oct 9 \u00b7 Upper B/, 'and what is next');
assert.ok(forgeSection({ forgeState: record.forgeState, sessions: record.sessions, forgeReceipts: [] }).includes('Last opened'), 'state shows even before any receipt');
assert.equal(forgeSection({ forgeState: { }, forgeReceipts: [] }), '', 'an empty state shows nothing');
// Views not applied yet: the receipt still renders from its own payload.
const plain = forgeSection({ forgeReceipts: [receipt], forgeMovements: [], forgeState: null });
assert.match(plain, /Cable Rear-Delt Fly<\/strong> \u2014 25 lb \u00d7 12 reps/, 'with no views, the original evidence rendering is unchanged');


// ── The private evidence summary ─────────────────────────────────────────────────────────
const prior = { ...receipt, receipt_id: 'r0', received_at: '2026-10-01T10:00:00Z', native_payload: { ...receipt.native_payload, completedAt: '2026-10-01T10:00:00Z' } };
const summaryRecord = {
  forgeReceipts: [{ ...receipt, receipt_id: 'r1' }, prior],
  forgeMovements: [
    { receipt_id: 'r1', completed_at: '2026-10-08T10:00:00Z', movement_id: 'sq', movement_name: 'Bulgarian Split Squat', performed_sets: 2,
      performed: [{ weight: 30, reps: 7 }, { weight: 30, reps: 6 }], prescribed_sets: 3, rep_low: 6, rep_high: 8, side_word: 'leg' },
    { receipt_id: 'r1', completed_at: '2026-10-08T10:00:00Z', movement_id: 'hold', movement_name: 'Suitcase Hold', performed_sets: 1,
      performed: [{ seconds: 30 }], prescribed_sets: 2, target_seconds: 20, target_seconds_high: 30, side_word: 'side' },
    { receipt_id: 'r1', completed_at: '2026-10-08T10:00:00Z', movement_id: 'new', movement_name: 'New Move', performed_sets: 1, performed: [{ weight: 10, reps: 12 }], prescribed_sets: 2, rep_low: 12, rep_high: 12 },
    { receipt_id: 'r0', completed_at: '2026-10-01T10:00:00Z', movement_id: 'sq', movement_name: 'Bulgarian Split Squat', performed_sets: 2, performed: [{ weight: 25, reps: 7 }, { weight: 25, reps: 6 }], prescribed_sets: 3, rep_low: 6, rep_high: 8, side_word: 'leg' },
    { receipt_id: 'r0', completed_at: '2026-10-01T10:00:00Z', movement_id: 'hold', movement_name: 'Suitcase Hold', performed_sets: 1, performed: [{ seconds: 20 }], prescribed_sets: 2, target_seconds: 20 }
  ]
};
const summary = forgeEvidenceSummary(summaryRecord);
assert.match(summary, /^DRAFT — private evidence summary\. Not published\./, 'it says it is a private draft');
assert.match(summary, /Bulgarian Split Squat: prescribed 3 × 6–8 \/ leg; did 2 \(30 lb × 7, 30 lb × 6\) — \+5 lb vs Oct 1/, 'load progression against the previous time');
assert.match(summary, /Suitcase Hold: prescribed 2 × 20–30 sec \/ side; did 1 \(30 sec\) — \+10 sec vs Oct 1/, 'a hold progression in seconds');
assert.match(summary, /New Move: .*first time recorded/, 'a new movement says so rather than comparing to nothing');
assert.equal(forgeEvidenceSummary({ forgeReceipts: [receipt], forgeMovements: [] }), '', 'no summary without prescription-linked movements');
const page = forgeSection({ ...summaryRecord, sessions: [], forgeState: null });
assert.match(page, /<details class="forge-draft"><summary>Draft for study notes \(private\)<\/summary><pre>DRAFT/, 'offered as selectable private text');
assert.ok(!/<script|onclick|href=/.test(page), 'it publishes nothing and wires nothing');

console.log('PASS: Console shows performed Forge sets per session, escapes feedback, ignores legacy summary receipts.');
