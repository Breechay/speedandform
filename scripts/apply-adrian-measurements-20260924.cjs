'use strict';
// Scoped, idempotent evidence update. No prescription, nutrition or native changes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sourcePath = 'docs/studies/ADRIAN-MEASUREMENTS-20260924.json';
const pagePath = path.join(root, 'labs/adrian-runner-mass/index.html');
const data = JSON.parse(fs.readFileSync(path.join(root, sourcePath), 'utf8'));
assert.equal(data.study_id, 'FRM-001');
assert.equal(data.measured_on, '2026-09-24');
assert.equal(data.unit, 'in');
assert.deepEqual(data.measurements.map(m => [m.key, m.value]), [['waist',31],['chest',35.75],['arm',11],['thigh',20],['calf',15.75]]);
assert.equal(data.pre_intervention_baseline, false);
function bounds(text) {
  const marker = text.indexOf('const STUDY = ');
  assert(marker >= 0, 'STUDY marker missing');
  const start = text.indexOf('{', marker);
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return [start, i + 1];
  }
  throw new Error('STUDY object did not close');
}
let html = fs.readFileSync(pagePath, 'utf8');
const [start, end] = bounds(html);
const S = JSON.parse(html.slice(start, end));
assert.equal(S.id, 'FRM-001');
const before = structuredClone(S);
const version = '2026.09.24.1';
const row = {
  id: data.record_id,
  date: data.measured_on,
  recordedOn: data.recorded_on,
  label: 'Sep 24',
  unit: data.unit,
  source: 'Athlete self-measurement',
  sourcePath,
  referenceRole: data.reference_role,
  preInterventionBaseline: false,
  standardized: false,
  mass: null,
  ...Object.fromEntries(data.measurements.map(m => [m.key, m.value])),
  fields: data.measurements.map(({value, ...field}) => field),
  conditions: data.conditions,
  change: null,
  note: 'First recorded circumference checkpoint, taken during the block. Not a pre-intervention baseline or evidence of growth.',
  next: data.next_collection
};
const summary = data.measurements.map(m => `${m.label.toLowerCase()} ${m.value} in`).join(' · ');
if (S.version !== version) {
  assert.equal(S.version, '2026.09.22.3', 'Study changed concurrently; review before applying');
  assert.equal(S.measurements.length, 0, 'Existing measurements need reconciliation');
  S.version = version;
  S.measurements.push(row);
  const oldLabels = {waist:'Waist',chest:'Chest',arm:'Upper arm, relaxed',thigh:'Mid-thigh',calf:'Calf'};
  for (const m of data.measurements) {
    let b = S.baseline.find(x => x.k === oldLabels[m.key]);
    if (!b) {
      assert.equal(m.key, 'waist');
      b = {};
      S.baseline.splice(S.baseline.findIndex(x => x.k === 'Chest'), 0, b);
    } else assert.equal(b.v, null, 'Do not overwrite an earlier measured value');
    Object.assign(b, {k:m.label,v:`${m.value} in`,note:'Sep 24, 2026 · self-measured · first checkpoint',s:'report',recordId:data.record_id,measuredOn:data.measured_on});
  }
  const evidence = S.dossier.find(d => d.title === 'Evidence');
  assert(evidence);
  evidence.more = 'Four channels, filed separately. The first circumference checkpoint is recorded; a body-mass trend and standardized comparison photos are still pending.';
  S.archive = [...S.archive, structuredClone(S.currentRead)];
  S.currentRead = {
    date:data.measured_on,
    n:'04',
    body:`Adrian self-measured five circumferences on September 24: ${summary}. This is the first recorded checkpoint, collected during the block, not evidence of growth. The standardized body-mass trend and comparison photos remain pending.`,
    running:before.currentRead.running,
    next:'Confirm tape locations, side and capture conditions before the next comparison. Keep the relaxed arm and thigh measurements consistent. Continue the existing training and nutrition plans; these measurements alone do not change the prescription.'
  };
  const entry = {
    id:'circumferences-20260924',when:'Sep 24, 2026',kind:'Body evidence · athlete report',type:'note',
    title:'First circumference checkpoint filed',
    body:`${summary}. Adrian took these measurements today; Brice confirmed the date and inches. Tape locations, side and capture conditions are not yet documented. The earlier missing-baseline entry stays in the record. This checkpoint does not establish growth or change the training plan.`
  };
  S.timeline.push(entry);
  const completed = new Set(['Waist circumference','Chest circumference','Relaxed upper-arm circumference','Mid-thigh circumference','Calf circumference']);
  assert.equal(S.queue.filter(q => completed.has(q[1])).length, 5);
  S.queue = S.queue.filter(q => !completed.has(q[1]));
  const at = S.queue.findIndex(q => q[0] === 'Body') + 1;
  S.queue.splice(at, 0,
    ['Body','Confirm September 24 tape locations, side and capture conditions'],
    ['Body','Repeat circumferences with the same method; keep arm and thigh relaxed']
  );
  const changed = new Set(['version','baseline','measurements','dossier','archive','currentRead','timeline','queue']);
  for (const k of Object.keys(before)) if (!changed.has(k)) assert.deepEqual(S[k], before[k], 'Protected study field changed: ' + k);
  for (const e of before.timeline) assert.deepEqual(S.timeline.find(x => x.id === e.id), e, 'Historical entry changed');
  for (const a of before.archive) assert(S.archive.some(x => JSON.stringify(x) === JSON.stringify(a)), 'Archive changed');
  assert.deepEqual(S.archive.at(-1), before.currentRead);
  html = html.slice(0, start) + JSON.stringify(S, null, 1) + html.slice(end);
}
function replaceOnce(old, replacement) {
  if (html.includes(replacement)) return;
  assert.equal(html.split(old).length - 1, 1, 'Expected one renderer match: ' + old.slice(0, 100));
  html = html.replace(old, replacement);
}
replaceOnce('Baseline body measurements are still outstanding.', '${S.measurements.length ? "First circumference checkpoint filed on " + fmtDate(S.measurements[0].date) + "." : "Body measurements are pending."}');
replaceOnce('Four cells above are official race data. Five are empty because nothing has been measured yet. They are left empty rather than estimated.', 'Race results and body checkpoints have separate dates. Circumferences are athlete self-measurements, not a pre-intervention baseline. A standardized body-mass average remains pending.');
replaceOnce('Coach observation · nothing measured yet', 'Coach targets · change not yet measured');
replaceOnce('Every bar is hatched because no circumference, no body mass and no standardized photograph has been filed. A bar will fill when there is something to fill it with.', 'The first circumference checkpoint is recorded, but there is no comparable follow-up yet. The bars stay empty because one checkpoint does not establish growth.');
replaceOnce('${none("No body evidence filed","Body mass, circumferences and the standardized photo set are all outstanding. Nothing has been substituted in their place.")}', '${measurementPanel()}');
replaceOnce('Protocol once collection starts', 'Standardized photo protocol');
replaceOnce('<p>${x.text}</p>', '<p>${x.text || [x.body,x.running,x.next].filter(Boolean).join(" ")}</p>');
const marker = '/* ADRIAN CIRCUMFERENCE CHECKPOINT RENDERER */';
if (!html.includes(marker)) {
  const renderer = [
    marker,
    'function measurementPanel(){',
    '  if(!S.measurements.length) return none("Circumferences pending","No circumference checkpoint has been filed.");',
    '  return S.measurements.map(m => `<article class="measure-checkpoint" id="measurements-${m.date.replaceAll("-", "")}">',
    '    <p class="measure-meta">${fmtDate(m.date)} · Inches · ${m.source}</p>',
    '    <h3>First circumference checkpoint</h3>',
    '    <dl class="measure-values">${m.fields.map(f => `<div><dt>${f.label}</dt><dd>${m[f.key]} <span>in</span></dd></div>`).join("")}</dl>',
    '    <p>${m.note}</p>',
    '    <p>${m.next}</p>',
    '    <p class="measure-meta">Standardized body-mass trend and comparison photos remain pending.</p>',
    '  </article>`).join("");',
    '}',
    ''
  ].join('\n');
  replaceOnce('function deep(){', renderer + 'function deep(){');
}
if (!html.includes('id="adrian-measurements-20260924-css"')) {
  const css = '<style id="adrian-measurements-20260924-css">.measure-checkpoint{max-width:760px;margin:0 0 24px}.measure-checkpoint h3{font-size:clamp(24px,3vw,34px);line-height:1.2;margin:8px 0 20px}.measure-checkpoint p{font-size:16px;line-height:1.65;max-width:68ch;margin:16px 0}.measure-checkpoint .measure-meta{font-size:14px;line-height:1.6;color:var(--ink-2)}.measure-values{margin:0 0 22px}.measure-values>div{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid var(--rule)}.measure-values dt{font-size:17px;line-height:1.5}.measure-values dd{margin:0;font-family:var(--f-mono);font-size:20px;font-variant-numeric:tabular-nums;white-space:nowrap}.measure-values dd span{font-size:14px}.datagrid dd.pending{font-size:13px!important;line-height:1.6}</style>\n';
  html = html.replace('</head>', css + '</head>');
}
html = html.replace(/"dateModified"\s*:\s*"2026-09-22"/, '"dateModified":"2026-09-24"');
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/application\/ld\+json/.test(m[1])) JSON.parse(m[2]);
  else if (!/src=/.test(m[1])) new vm.Script(m[2]);
}
const [a,b] = bounds(html);
const result = JSON.parse(html.slice(a,b));
assert.equal(result.version, version);
assert.equal(result.measurements.length, 1);
assert.deepEqual(result.measurements[0], row);
assert.equal(result.baseline.find(x => x.k === 'Body mass').v, null);
assert.equal(result.baseline.find(x => x.k === 'Reported body mass').v, '156 lb');
assert(result.timeline.some(x => x.id === 'baseline-missing' && x.body.includes('No body mass, no circumferences')));
assert(!result.queue.some(q => ['Waist circumference','Chest circumference','Relaxed upper-arm circumference','Mid-thigh circumference','Calf circumference'].includes(q[1])));
assert(!html.includes('No body evidence filed'));
fs.writeFileSync(pagePath, html);
const roadmapPath = path.join(root, 'docs/roadmap/FORM-ROADMAP.md');
let roadmap = fs.readFileSync(roadmapPath, 'utf8');
const heading = '## September 24 - Adrian first circumference checkpoint';
if (!roadmap.includes(heading)) {
  const note = '\n' + heading + '\n\n' +
    'Five self-measured circumferences, taken September 24 and confirmed in inches by Brice. Source: [dated measurement record](../studies/ADRIAN-MEASUREMENTS-20260924.json). The generator updates STUDY.measurements, the athlete summary, body evidence, current read and collection queue together. Historical missing-baseline and prior reading entries are preserved. This is an early-block checkpoint, not a pre-intervention baseline or a growth result. Relaxed thigh is not silently relabeled mid-thigh. Run, strength, nutrition, assignments and native code are unchanged.\n\n' +
    '- [x] Dated source and connected study projections authored.\n' +
    '- [x] Generator validates exact values, missing-value semantics and preserved history/prescriptions.\n' +
    '- [ ] Production verification follows acceptance and promotion; a branch is not live.\n' +
    '- [ ] Confirm tape locations, side and capture conditions for repeat measurements.\n' +
    '- [ ] Standardized mass trend, comparison photos and physical-phone review remain open.\n\n' +
    'Acceptance run: https://github.com/Breechay/speedandform/actions/runs/' + (process.env.GITHUB_RUN_ID || 'local') + '. Tested source commit: ' + (process.env.GITHUB_SHA || 'local working tree') + '.\n\n';
  roadmap = roadmap.replace('\n', '\n' + note);
  fs.writeFileSync(roadmapPath, roadmap);
}
console.log('PASS: exact dated measurements, source parity, no backdated baseline, history and prescriptions preserved.');
