// The em dash rule (VOICE_LAW 3e) applies to copy that renders, not to comments.
// Checking it by hand does not scale past the first time it is forgotten.
import { readFileSync, readdirSync } from 'node:fs';

const files = ['index.html', 'coach/index.html', 'athlete/index.html',
  'supabase/templates/magic_link.html'];
let bad = 0;
for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  text.split('\n').forEach((line, i) => {
    // Comments are not copy. Everything else on the page is.
    if (/^\s*(\/\/|<!--)/.test(line)) return;
    if (line.includes('—') || line.includes('&mdash;')) {
      console.log(`${file}:${i + 1}  ${line.trim().slice(0, 90)}`);
      bad++;
    }
  });
}
if (bad) { console.error(`\n${bad} em dash(es) in rendered copy. VOICE_LAW 3e.`); process.exit(1); }
console.log('copy check passed');
