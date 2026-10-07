// Extracts Adrian's bundled Forge prescription (the generated block in ForgeProgramLibrary.swift)
// into a JSON reference, so the server-side structured exercises can be compared with what the
// app actually ships. Usage: node scripts/extract-forge-adrian-reference.mjs <ForgeProgramLibrary.swift> <git-sha> [out.json]
import fs from 'node:fs';

const [swiftPath, sha, out = 'tests/fixtures/forge-adrian-reference.json'] = process.argv.slice(2);
if (!swiftPath || !sha) { console.error('usage: extract-forge-adrian-reference.mjs <swift> <sha> [out]'); process.exit(2); }

const src = fs.readFileSync(swiftPath, 'utf8');
const start = src.indexOf('// BEGIN GENERATED ADRIAN PROGRAM');
const end = src.indexOf('// END GENERATED ADRIAN PROGRAM');
if (start < 0 || end < 0) throw new Error('generated Adrian block not found');
const block = src.slice(start, end);

const sessions = [];
const days = block.split(/ForgeProgramDay\(/).slice(1);
for (const day of days) {
  const sessionId = /sessionId: "([^"]+)"/.exec(day)[1];
  const sessionName = /sessionName: "([^"]+)"/.exec(day)[1];
  const exercises = day.split(/ForgeProgramExercise\.uniformSets\(/).slice(1).map((ex) => {
    const get = (re) => { const m = re.exec(ex); return m ? m[1] : null; };
    const range = /repRange: ForgeRepRange\((\d+), (\d+)\)/.exec(ex);
    return {
      movementId: get(/movementId: "([^"]+)"/),
      name: get(/name: "([^"]+)"/),
      laterality: get(/laterality: \.(\w+)/),
      setCount: Number(get(/setCount: (\d+)/)),
      repLow: range ? Number(range[1]) : null,
      repHigh: range ? Number(range[2]) : null,
      targetSeconds: get(/targetSeconds: (\d+)/) === null ? null : Number(get(/targetSeconds: (\d+)/))
    };
  });
  sessions.push({ sessionId, sessionName, exercises });
}

fs.writeFileSync(out, JSON.stringify({
  _provenance: { source: 'FORM/Forge/ForgeProgramLibrary.swift generated Adrian block', repo: 'Breechay/FORM-iOS', commit: sha },
  sessions
}, null, 1) + '\n');
console.log(`${sessions.length} sessions, ${sessions.reduce((n, s) => n + s.exercises.length, 0)} exercises -> ${out}`);
