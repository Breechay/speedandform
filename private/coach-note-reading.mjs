import { escapeHtml } from './record.js';

// Private coach notes are append-only evidence of what someone wrote at the
// time. This is a reading projection: it never alters the stored body, invents
// a summary, or discards a sentence. Agent-style reference IDs are provenance,
// not the opening words of the note.
const REFERENCE_HEADER = /^([A-Z][A-Z0-9.]+(?:-[A-Z0-9.]+){2,})\s*(?:\|\s*(\d{4}-\d{2}-\d{2})\s*)?[|·]\s*/;

export function coachNoteReading(value) {
  let body = String(value ?? '').replace(/\r\n?/g, '\n').trim();
  let reference = '';
  let referenceDate = '';
  const header = body.match(REFERENCE_HEADER);
  if (header) {
    reference = header[1];
    referenceDate = header[2] || '';
    body = body.slice(header[0].length).trim();
  }

  const paragraphs = [];
  for (const block of body.split(/\n\s*\n/).filter(Boolean)) {
    const sentences = block.replace(/\s*\n\s*/g, ' ').trim()
      .split(/(?<=[.!?])\s+(?=["“']?[A-Z])/).filter(Boolean);
    let current = '';
    let count = 0;
    for (const sentence of sentences) {
      if (current && (count >= 2 || current.length + sentence.length > 290)) {
        paragraphs.push(current);
        current = '';
        count = 0;
      }
      current += (current ? ' ' : '') + sentence;
      count += 1;
    }
    if (current) paragraphs.push(current);
  }
  return { reference, referenceDate, paragraphs, original: String(value ?? '') };
}

export function coachNoteReadingHtml(value, { createdAt = '' } = {}) {
  const note = coachNoteReading(value);
  const distinctSourceDate = note.referenceDate && note.referenceDate !== String(createdAt).slice(0, 10);
  return `<div class="coachNoteProse">${note.paragraphs.map((paragraph) =>
    `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>${note.reference
      ? `<p class="coachNoteReference">Record reference: <code>${escapeHtml(note.reference)}</code>${distinctSourceDate
        ? ` · Source date: ${escapeHtml(note.referenceDate)}` : ''}</p>`
      : ''}`;
}
