import assert from 'node:assert/strict';
import { markSelection, joinSpans, compactSpans, validateMethodDraft, rotationForDay } from './methods-core.mjs';

const copy = 'We develop speed early so we have more speed to draw from as we build the endurance to sustain it.';
let spans = [{ text: copy, tone: 'muted' }];
const start = copy.indexOf('more speed to draw from');
spans = markSelection(spans, start, start + 'more speed to draw from'.length, 'bright');
assert.deepEqual(spans.map(x => x.tone), ['muted', 'bright', 'muted']);
assert.equal(joinSpans(spans), copy);
assert.deepEqual(markSelection(spans, start, start + 4, 'muted').length, 3);
assert.deepEqual(compactSpans([{ text: 'We ', tone: 'muted' }, { text: 'run.', tone: 'muted' }]), [{ text: 'We run.', tone: 'muted' }]);
assert.equal(validateMethodDraft({ statement: copy, spans, font_size: 14, muted_gray: 166, bright_gray: 240 }), null);
assert.match(validateMethodDraft({ statement: copy, spans: [{ text: '<b>bad</b>', tone: 'bright' }], font_size: 14, muted_gray: 166, bright_gray: 240 }), /every character/);
assert.match(validateMethodDraft({ statement: 'An internal\nnote.', spans, font_size: 14, muted_gray: 166, bright_gray: 240 }), /one complete/);
const methods = [1, 2, 3].map(i => ({ method_key: `quote_${i}`, sort_order: i }));
assert.equal(rotationForDay(methods, null, '2026-11-03').method_key, 'quote_1');
assert.equal(rotationForDay(methods, null, '2026-11-04').method_key, 'quote_2');
assert.equal(rotationForDay(methods, 'quote_3', '2026-11-03').method_key, 'quote_3');
console.log('Collective Method editor: selection, validation, daily cycle and pin passed.');
