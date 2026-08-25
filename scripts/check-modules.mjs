// node --check validates syntax only. A call to a function that was never
// imported passes it and fails in the browser — which is exactly how the desk
// shipped throwing "gradeSection is not defined".
//
// This resolves every bare identifier that is called in a module against what
// that module imports or defines, so a missing import fails here instead.
import { readFileSync } from 'node:fs';

const MODULES = [
  'coach/coach.js', 'athlete/athlete.js', 'record/public.js',
  'private/record.js', 'private/data.js', 'private/auth.js',
  'auth/record-callback/callback.js'
];

const GLOBALS = new Set([
  'console', 'document', 'window', 'location', 'history', 'localStorage', 'fetch',
  'setTimeout', 'clearTimeout', 'setInterval', 'requestAnimationFrame', 'crypto',
  'FormData', 'URL', 'URLSearchParams', 'Date', 'Math', 'Number', 'String', 'Boolean',
  'Array', 'Object', 'JSON', 'Promise', 'Error', 'Set', 'Map', 'Intl', 'isNaN',
  'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent', 'alert',
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function', 'super',
  'async', 'await', 'new', 'delete', 'void', 'yield', 'in', 'of', 'do', 'else'
]);

let failed = false;

for (const file of MODULES) {
  // Strip string literals: PostgREST selects like "athletes(id, slug)" look
  // like calls but are query syntax, not JavaScript.
  const raw = readFileSync(file, 'utf8');
  const source = raw.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  const known = new Set(GLOBALS);

  for (const match of source.matchAll(/import\s*\{([^}]+)\}/g)) {
    match[1].split(',').forEach((name) => known.add(name.trim().split(/\s+as\s+/).pop()));
  }
  for (const match of source.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) known.add(match[1]);
  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) known.add(match[1]);
  for (const match of source.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=/g)) {
    match[1].split(',').forEach((name) => known.add(name.trim().split(':').pop().trim()));
  }
  // Parameters, including destructured and defaulted ones.
  for (const match of source.matchAll(/(?:function\s*[\w$]*\s*)?\(([^()]*)\)\s*(?:=>|\{)/g)) {
    match[1].split(',').forEach((part) => {
      const name = part.trim().replace(/^\.\.\./, '').split(/[=:]/)[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) known.add(name);
      for (const inner of part.matchAll(/([A-Za-z_$][\w$]*)\s*(?:=|,|\})/g)) known.add(inner[1]);
    });
  }

  const missing = new Set();
  for (const match of source.matchAll(/(?<![.\w$'"`])([a-z_$][\w$]*)\s*\(/g)) {
    const name = match[1];
    if (!known.has(name)) missing.add(name);
  }

  if (missing.size) {
    failed = true;
    console.error(`${file}: called but never imported or defined -> ${[...missing].join(', ')}`);
  }
}

console.log(failed ? 'REFERENCE CHECK FAILED' : 'reference check passed');
process.exit(failed ? 1 : 0);
