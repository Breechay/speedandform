#!/usr/bin/env node
/* Render the approved Tinius Forge blueprint as a static reading page.
   The native program/version is preserved in program.json. No assignment,
   current position, new prescription or completed record is created here. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'plans/tinius-durable-frame-phase-01');
const program = JSON.parse(fs.readFileSync(path.join(dir, 'program.json'), 'utf8'));
const route = '/plans/tinius-durable-frame-phase-01/';
const study = '/labs/the-durable-frame/';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = value => value.replaceAll('_', '-');
const idFor = (week, session) => `week-${week}-${slug(session)}`;
assert.equal(program.program_id, 'tinius_durable_frame_phase01_v1');
assert.equal(program.weeks.length, 6);
assert.equal(program.provenance.native_file_blob_sha, '8ac710928c4153d0ad1fdb7655726ffccd089176');

// Presentation-only wording. Numeric effort always comes from the authored
// set prescriptions, including where a legacy cue repeats a different number.
const cues = {
  barbell_floor_press: 'Use your current working weight. Keep each repetition controlled.',
  kettlebell_single_arm_row: 'Keep your trunk still. Pull without rotating.',
  half_kneeling_single_arm_kettlebell_press: 'Stay tall. Keep your back from arching.',
  lateral_raise: 'Use your lightest plate or kettlebell so your shoulders do the work.',
  rear_delt_row: 'Keep your elbows wide and your body still.',
  barbell_curl: 'Keep your hips still. Lift without swinging.',
  close_grip_push_up: 'Keep the repetitions controlled. Stop before failure.',
  legs_split_squat_static: 'Raise your rear foot only if you have a stable surface. Keeping it on the floor is fine.',
  romanian_deadlift: 'Lower the weight under control.',
  single_leg_calf_raise: 'Use your full range. Add kettlebell weight only while you can keep that range.',
  suitcase_march: 'Hold the kettlebell at your side without leaning.',
  core_side_plank: 'Keep a straight line from shoulder to ankle.',
  barbell_bent_over_row: 'Keep your torso at the same angle. Use your current working weight.',
  dumbbell_pullover: 'Keep your ribs still as you reach. Avoid turning the movement into a triceps extension.',
  single_arm_kettlebell_press: 'Keep each repetition controlled, especially after Saturday’s long run.',
  shoulder_shrug: 'Pause at the top. Do not roll your shoulders.'
};
const sessions = {
  frame_a: {name:'Frame A', day:'Tuesday', short:'Tue', intro:'Chest, shoulders, back and arms. Run first when practical.'},
  lower_core: {name:'Lower + Core', day:'Thursday', short:'Thu', intro:'Legs, calves and core. Check the running session before you start.'},
  frame_b: {name:'Frame B', day:'Sunday', short:'Sun', intro:'Back, chest, shoulders and arms. Start after you have recovered from Saturday’s long run.'}
};
function effort(exercise) {
  if (exercise.target_seconds !== null) return '';
  const sets = exercise.set_prescriptions;
  const text = set => set.rir_low === set.rir_high ? String(set.rir_low) : `${set.rir_low}–${set.rir_high}`;
  const first = text(sets[0]);
  const last = text(sets[sets.length - 1]);
  return first === last
    ? `Finish each set with about ${first} good reps left.`
    : `Finish the first ${sets.length - 1} sets with about ${first} good reps left. On the last set, leave ${last}.`;
}
function renderExercise(exercise, week, key) {
  assert.equal(exercise.sets, exercise.set_prescriptions.length);
  assert.ok(cues[exercise.movement_id], `Missing plain cue: ${exercise.movement_id}`);
  const timed = exercise.target_seconds !== null;
  const dose = timed ? '30–45 sec' : `${exercise.rep_low}–${exercise.rep_high} reps`;
  const side = exercise.per_side ? ' per side' : '';
  const cue = key === 'frame_b' && exercise.position === 2
    ? 'Choose the floor press or push-up, using the option that works your chest with the equipment you have.'
    : cues[exercise.movement_id];
  const effortText = effort(exercise);
  const attrs = Object.entries({
    'data-movement-id':exercise.movement_id, 'data-position':exercise.position,
    'data-sets':exercise.sets, 'data-rep-low':exercise.rep_low, 'data-rep-high':exercise.rep_high,
    'data-target-seconds':exercise.target_seconds, 'data-rest-sec':exercise.rest_seconds,
    'data-per-side':exercise.per_side
  }).map(([name,value]) => `${name}="${esc(value)}"`).join(' ');
  return `
          <li class="exercise" id="${idFor(week,key)}-move-${exercise.position}" ${attrs}>
            <span class="exercise-number" aria-hidden="true">${String(exercise.position).padStart(2,'0')}</span>
            <div class="exercise-main">
              <h3>${esc(exercise.movement_name)}</h3>
              <p class="exercise-dose">${exercise.sets} ${exercise.sets === 1 ? 'set' : 'sets'} · ${dose}${side}</p>
              <p class="exercise-rest">Rest ${exercise.rest_seconds} sec between sets</p>
              <p class="exercise-cue">${esc(cue)}</p>
              ${effortText ? `<details class="exercise-details"><summary>How hard?</summary><p>${esc(effortText)}</p></details>` : ''}
            </div>
          </li>`;
}
function renderDay(day, week) {
  const meta = sessions[day.session_key];
  assert.ok(meta);
  const condition = day.session_key === 'lower_core' ? `
        <aside class="session-condition" aria-label="Before Thursday strength">
          <p class="condition-title">Before you start</p>
          <p>Do the full session only if you have recovered from Tuesday and today’s run is easy.</p>
          <p>If today has intervals, a tempo run or hill repeats, do only the calf raise, suitcase march and side plank, or skip strength. Do not move missed work to Friday or Saturday.</p>
        </aside>` : '';
  return `
      <article class="session-panel" id="${idFor(week.week_number,day.session_key)}" data-session="${day.session_key}" data-session-id="${esc(day.session_id)}" aria-labelledby="${idFor(week.week_number,day.session_key)}-title">
        <header class="session-heading">
          <p class="eyebrow">Week ${String(week.week_number).padStart(2,'0')} · ${meta.day} · ${day.exercises.length} exercises</p>
          <h2 id="${idFor(week.week_number,day.session_key)}-title" tabindex="-1">${meta.name}</h2>
          <p class="session-intro">${esc(meta.intro)}</p>
        </header>${condition}
        <ol class="exercise-list">${day.exercises.map(e => renderExercise(e,week.week_number,day.session_key)).join('')}
        </ol>
        <div class="session-bottom" data-enhanced-only hidden>
          <button class="share-session" type="button" data-share-session="${idFor(week.week_number,day.session_key)}">Share this session</button>
          <span class="share-status" role="status" aria-live="polite"></span>
          <label class="copy-link-fallback" hidden>Copy this link<input type="text" readonly aria-label="Session link"></label>
        </div>
      </article>`;
}
const panels = program.weeks.map(week => {
  assert.equal(week.days.length, 3);
  assert.deepEqual(week.days.map(d => d.session_key), ['frame_a','lower_core','frame_b']);
  return `
    <section class="week-group" data-week="${week.week_number}" aria-label="Week ${week.week_number}">
      <div class="week-fallback-heading"><h2>Week ${week.week_number} · ${esc(week.label)}</h2><p>${esc(week.instruction)}</p></div>
      ${week.days.map(day => renderDay(day,week)).join('\n')}
    </section>`;
}).join('\n');
const weekNotes = program.weeks.map(week => `<div class="week-note" data-week-note="${week.week_number}"${week.week_number !== 1 ? ' hidden' : ''}><h2 class="week-title">Week ${String(week.week_number).padStart(2,'0')} · ${esc(week.label)}</h2><p>${esc(week.instruction)}</p></div>`).join('\n');
const nav = Object.entries(sessions).map(([key,meta]) => `<a class="session-link" data-session-link="${key}" href="#${idFor(1,key)}"><span class="session-day">${meta.short}</span><span class="session-name">${meta.name}</span></a>`).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#e8e3d9">
  <meta name="robots" content="noindex,nofollow">
  <title>Tinius · Strength sessions | Speed &amp; Form</title>
  <meta name="description" content="Tinius’s six-week strength plan. Exercises, sets, reps and rest for Tuesday, Thursday and Sunday.">
  <link rel="canonical" href="https://speedandform.com${route}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Tinius · Strength sessions">
  <meta property="og:description" content="Your six-week plan, one session at a time.">
  <meta property="og:url" content="https://speedandform.com${route}">
  <link rel="icon" href="/assets/brand/sf-seal.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/site/fonts/inter-tight-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${route}strength.css?v=20261008">
  <script src="${route}strength.js?v=20261008" defer></script>
</head>
<body class="strength-page" data-program-id="${esc(program.program_id)}" data-projection-version="${esc(program.projection_version)}">
<a class="skip-link" href="#sessions">Skip to sessions</a>
<div class="shell">
  <header class="site-header">
    <a class="brand-link" href="/" aria-label="Speed &amp; Form home"><img src="/assets/brand/sf-seal.svg" alt="" width="76" height="32"></a>
    <nav class="header-links" aria-label="Related pages"><a href="${study}">Tinius’s study <span aria-hidden="true">↗</span></a></nav>
  </header>
  <main>
    <header class="page-heading">
      <p class="eyebrow">Tinius · The Durable Frame · Phase 01</p>
      <h1>Strength.</h1>
      <p class="intro">Build muscle and strength around your running.</p>
    </header>
    <div class="plan-layout" id="sessions">
      <aside class="plan-sidebar" aria-label="Choose your session">
        <div class="week-control" data-enhanced-only hidden>
          <label for="week-select">Training week</label>
          <select id="week-select" name="week">
            ${program.weeks.map(w => `<option value="${w.week_number}">Week ${String(w.week_number).padStart(2,'0')} of 06</option>`).join('\n')}
          </select>
        </div>
        <nav class="week-index" aria-label="Training weeks">${program.weeks.map(w => `<a href="#${idFor(w.week_number,'frame_a')}">Week ${w.week_number}</a>`).join(' ')}</nav>
        <nav class="session-nav" aria-label="Strength sessions">${nav}</nav>
        <div class="week-notes" data-enhanced-only hidden>${weekNotes}</div>
      </aside>
      <div class="session-workspace">
        ${panels}
        <details class="plan-guide">
          <summary>Weights, equipment and progression</summary>
          <div class="guide-content">
            <h3>Use the equipment you have.</h3>
            <p>Your adjustable kettlebell, small barbell and plates, mat and bodyweight. No bench is required.</p>
            <h3>Choose a weight you can control.</h3>
            <p>${esc(program.global_rules[0])} Open “How hard?” under an exercise for the number of good reps to leave.</p>
            <h3>When to add weight.</h3>
            <p>${esc(program.global_rules[1])}</p>
            <p>${esc(program.global_rules[2])}</p>
            <h3>Keep your running feeling normal.</h3>
            <p>${esc(program.global_rules[3])}</p>
            <p>${esc(program.global_rules[6])}</p>
          </div>
        </details>
      </div>
    </div>
  </main>
  <footer class="site-footer"><span>Tinius · Six weeks</span><nav aria-label="Footer"><a href="${study}">The study</a><a href="/contact">Contact Brice</a></nav></footer>
</div>
</body>
</html>
`;
fs.writeFileSync(path.join(dir,'index.html'), html.replace(/[\t ]+$/gm,''));
console.log(JSON.stringify({program:program.program_id,weeks:6,sessions:18,exercise_instances:program.weeks.reduce((n,w)=>n+w.days.reduce((m,d)=>m+d.exercises.length,0),0),output:path.relative(root,path.join(dir,'index.html'))}));
