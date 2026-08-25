// node --check proves the syntax parses; it does not prove that
// sessionForm.elements.rpeLow refers to a field that exists. That class of bug
// ships silently and breaks the page on open, so check it here.
import { readFileSync } from 'node:fs';

const pages = [
  { html: 'coach/index.html', js: 'coach/coach.js' },
  { html: 'athlete/index.html', js: 'athlete/athlete.js' },
];
const shared = ['private/record.js', 'private/auth.js', 'private/data.js']
  .map((f) => readFileSync(f, 'utf8')).join('\n');

let bad = 0;
for (const page of pages) {
  const html = readFileSync(page.html, 'utf8');
  const js = readFileSync(page.js, 'utf8');
  // Markup also comes from template literals at runtime, so ids and names are
  // collected from both the file and the code that writes into it.
  const source = html + '\n' + js + '\n' + shared;

  const forms = {};
  for (const m of source.matchAll(/<form[^>]*id="(\w+)"([\s\S]*?)<\/form>/g)) {
    forms[m[1]] = new Set([...m[2].matchAll(/\bname="([\w-]+)"/g)].map((x) => x[1]));
  }
  const ids = new Set([...source.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]));

  for (const m of js.matchAll(/\b(\w+Form)\.elements\.(\w+)/g)) {
    const [, form, field] = m;
    if (!forms[form]) { console.log(`${page.js}: no form #${form}`); bad++; continue; }
    if (!forms[form].has(field)) { console.log(`${page.js}: #${form} has no field "${field}"`); bad++; }
  }
  for (const m of js.matchAll(/getElementById\('([\w-]+)'\)/g)) {
    if (!ids.has(m[1])) { console.log(`${page.js}: no element #${m[1]}`); bad++; }
  }
}
if (bad) { console.error(`\n${bad} broken DOM reference(s)`); process.exit(1); }
console.log('DOM reference check passed');
