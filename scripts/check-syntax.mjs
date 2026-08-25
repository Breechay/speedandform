// The desk hung on a stray closing brace that three checkers missed, because none
// of them parse. `node --check` also missed it: without --input-type=module it
// does not parse the file the way a browser does.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith('.js') || entry.endsWith('.mjs')) files.push(path);
  }
})('.');

let bad = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--input-type=module', '--check'],
      { input: readFileSync(file), stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    const message = String(error.stderr || error.message).split('\n').slice(0, 4).join('\n');
    console.error(`${file}\n${message}\n`);
    bad++;
  }
}
if (bad) { console.error(`${bad} file(s) do not parse as modules`); process.exit(1); }
console.log(`syntax check passed (${files.length} files)`);
