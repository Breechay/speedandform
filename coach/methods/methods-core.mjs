// Shared, pure sentence/emphasis rules for the private Collective editor.
// A span is only {text, tone}; it cannot contain markup or a line break.
export const TONES = new Set(['muted', 'bright']);

export function joinSpans(spans) {
  return spans.map(span => span.text).join('');
}

export function compactSpans(spans) {
  const result = [];
  for (const part of spans) {
    if (!part.text) continue;
    const tone = TONES.has(part.tone) ? part.tone : 'muted';
    if (result.length && result[result.length - 1].tone === tone) {
      result[result.length - 1].text += part.text;
    } else result.push({ text: part.text, tone });
  }
  return result;
}

// start and end are UTF-16 offsets, exactly like textarea.selectionStart/End.
export function markSelection(spans, start, end, tone) {
  if (!TONES.has(tone)) throw new Error('Unknown emphasis tone');
  const source = compactSpans(spans);
  const length = joinSpans(source).length;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > length || start >= end) return source;
  let at = 0;
  const sections = [];
  for (const part of source) {
    const stop = at + part.text.length;
    const left = Math.max(0, Math.min(part.text.length, start - at));
    const right = Math.max(0, Math.min(part.text.length, end - at));
    if (left > 0) sections.push({ text: part.text.slice(0, left), tone: part.tone });
    if (right > left) sections.push({ text: part.text.slice(left, right), tone });
    if (right < part.text.length) sections.push({ text: part.text.slice(right), tone: part.tone });
    at = stop;
  }
  return compactSpans(sections);
}

export function validateMethodDraft(draft) {
  const sentence = String(draft.statement ?? '').trim();
  if (sentence.length < 20 || sentence.length > 240 || /[\r\n]/.test(sentence) || !sentence.endsWith('.')) {
    return 'Write one complete sentence, 20–240 characters, ending in a period.';
  }
  if (/coach.only|internal.only|private.note|draft|pending.publication|approval.queue|source.system|publish.this|admin.only|rpc|sql|placeholder|lorem ipsum|https?:\/\//i.test(sentence)) {
    return 'Remove internal or administrative language.';
  }
  if (!Array.isArray(draft.spans) || draft.spans.length < 1 || draft.spans.length > 24 ||
      draft.spans.some(s => !s || !TONES.has(s.tone) || !s.text || /[\r\n]/.test(s.text)) ||
      joinSpans(draft.spans) !== sentence) {
    return 'The inline emphasis must account for every character in the sentence.';
  }
  if (!Number.isInteger(draft.font_size) || draft.font_size < 13 || draft.font_size > 17 ||
      !Number.isInteger(draft.muted_gray) || draft.muted_gray < 155 || draft.muted_gray > 200 ||
      !Number.isInteger(draft.bright_gray) || draft.bright_gray < 225 || draft.bright_gray > 255) {
    return 'Typography must remain within the legible Collective range.';
  }
  return null;
}

export function rotationForDay(methods, pinnedKey, dayKey) {
  const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order || a.method_key.localeCompare(b.method_key));
  if (!sorted.length) return null;
  const pinned = sorted.find(m => m.method_key === pinnedKey);
  if (pinned) return pinned;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return sorted[0];
  const days = Math.floor((Date.parse(dayKey + 'T00:00:00Z') - Date.parse('2026-11-03T00:00:00Z')) / 86400000);
  const index = ((days % sorted.length) + sorted.length) % sorted.length;
  return sorted[index];
}
