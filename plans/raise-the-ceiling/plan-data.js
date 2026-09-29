/* RAISE THE CEILING — the public plan manifest.
 *
 * One authored Plan, two athlete views. The public page reads this file as the
 * authoritative manifest; the six weeks are never typed into the HTML.
 *
 * Revision — Sep 29, 2026 (Brice): an ankle interruption. Lisa skipped Saturday and holds this
 * Tuesday. Week 03 becomes a hold, she re-enters at her last successful rung (2 × 12), the two
 * 25-minute continuous efforts stay the same ask so their cost can be compared, and the block
 * extends to seven weeks: the 10K moves from Oct 24 to Oct 31. Simon moved to Study 003 on Sep 23;
 * his six-week record stays on the archived study page. This file matches Lisa's canonical
 * FORM assignment (the app), which is the authority.
 *
 * Calendar note — Sep 12, 2026:
 * Week 01 was deliberately rebased to Tue Sep 15 after the athlete-facing link
 * was introduced. Simon enters the rebased block at 2 × 12; Lisa begins at
 * 2 × 10. Their calendar is shared. Their Tuesday entry point does not have to be.
 *
 * TWO RULES THAT MUST SURVIVE ANY EDIT:
 *
 *  1. Thursday is a fixed FORM standard. Metric rep distances and absolute rep
 *     times stay exactly as authored, for both athletes, in every unit mode.
 *     Never convert them into a per-km or per-mile pace.
 *  2. The study raises the ceiling. Do not rewrite it into a durability block.
 *     Tuesday raises sustainable speed, Thursday keeps speed above it, and
 *     Saturday preserves the endurance underneath.
 *
 * Both pace bands are quoted in their authored units. Nothing is converted at
 * runtime, so no rounding can drift.
 */

export const plan = {
  slug: 'raise-the-ceiling',
  name: 'Raise the Ceiling',
  weeks: 7,
  standfirst: 'Seven weeks. One 10K.',
  question: 'Can raising the ceiling make everything underneath easier to use?',
  idea: 'Build speed above the working pace. Repeat the work and see what changes.',
  method: 'Tuesday raises what she can sustain. Thursday keeps speed above it. Saturday builds the endurance underneath it.',
  teaching: 'This is Lisa’s assignment. Revised Sep 29 after an ankle interruption: Week 03 is a hold, and she does not owe the missed sessions. She returns at her last successful rung, 2 × 12, then the same 25-minute continuous ask twice, so its cost can be compared. The 10K moves one week, to October 31.',
  fee: 'Free',
  startsOn: '2026-09-15',
  expressionOn: '2026-10-31',

  /* Mon/Wed/Fri general aerobic and Sun rest-or-HYROX are the athlete's existing
     week. They are context, not prescription, so they are not authored here. */
  authoredDays: ['Tuesday', 'Thursday', 'Saturday'],

  weekDates: ['Sep 15', 'Sep 22', 'Sep 29', 'Oct 06', 'Oct 13', 'Oct 20', 'Oct 27'],

  tuesday: {
    warmUp: '15–20 min easy, then 4 × 20s relaxed strides',
    coolDown: '10 min easy',
    recovery: '3 min easy between reps.',
    rule: 'Prefer a session that finishes as strong as it starts. A hot first rep is a warning that the workout is being spent too early.'
  },

  /* Fixed FORM standards. These do not scale to the athlete — variation is
     expressed by how close she gets to a standard that does not move. */
  thursday: [
    { week: 1, date: 'Sep 17', name: 'Speed Demons', reps: [
      '4 × 300m · 50–52s · 2:30',
      '6 × 200m · 32–34s · 90s',
      '8 × 100m · 15–17s · 90s' ] },
    { week: 2, date: 'Sep 24', name: 'Gauntlet', reps: [
      '3 × 600m · 1:48–1:52 · 3 min',
      '2 × 400m · 1:08–1:12 · 2:30',
      '3 × 300m · 48–52s · 2 min',
      '2 × 200m · 29–32s · 2 min',
      '2 × 150m · 20–22s · full recovery' ] },
    { week: 3, date: 'Oct 01', name: 'Nice and Easy', note: 'Only if easy running is completely comfortable. Otherwise easy or off.', reps: [
      '3 × 200m · 29–32s · 30s',
      '2 × 800m · 2:25–2:30 · 4 min',
      '1 × 400m · 1:08–1:10' ] },
    { week: 4, date: 'Oct 08', name: 'Pyramid Intervals · repeat', note: 'Only if the ankle remains quiet.', reps: [
      '2 × 300m · 50–52s · 90s',
      '2 × 400m · 1:08–1:12 · 2 min',
      '1 × 600m · 1:42–1:45 · 2:30',
      '2 × 400m · 1:08–1:10 · 2 min',
      '2 × 300m · 50–52s · full recovery' ] },
    { week: 5, date: 'Oct 15', name: 'Speed Demons · repeat', reps: [
      '4 × 300m · 50–52s · 2:30',
      '6 × 200m · 32–34s · 90s',
      '8 × 100m · 15–17s · 90s' ] },
    { week: 6, date: 'Oct 22', name: 'Light speed · strides', reps: [
      'Light speed or relaxed strides · keep the legs quick without adding load' ] },
    { week: 7, date: 'Oct 29', name: 'Strides', reps: [
      'Easy running + 4 × 100m relaxed strides · full walk/jog recovery' ] }
  ],
  thursdayNote: 'Named speed sessions use 15 min warm-up and 10 min cool-down. Repeated sessions are deliberate comparisons. The standard is never quietly made easier.',

  saturday: [
    { week: 1, title: 'Easy long',  note: 'Conversational throughout.' },
    { week: 2, title: 'Easy long',  note: 'Conversational. No finishing efforts.' },
    { week: 3, title: 'Long aerobic · 60 min easy', note: 'Only if the ankle is quiet; otherwise off.' },
    { week: 4, title: 'Long aerobic · 75 min easy', note: null },
    { week: 5, title: 'Long aerobic · 90 min',
      note: 'Final 15 min at 7:00–7:10/mi only if completely settled.' },
    { week: 6, title: 'Long aerobic · 75 min easy', note: 'No proving.' },
    { week: 7, title: '10K · Oct 31', note: 'The test.' }
  ],
  saturdayNote: 'Long aerobic runs build back underneath her usual 90–100 minutes after the interruption.',

  expression: {
    title: '10K',
    on: 'Saturday, October 31',
    shape: ['15–20 min very easy', '4 × 20s strides', '10K', '10–20 min very easy'],
    course: 'Flat and measured.',
    conditions: 'Record temperature, humidity and dew point. Miami in October will affect the result, and the result is worthless without the conditions attached.',
    execution: 'Open the first kilometre at your own Tuesday band. Do not open faster. Progress from there if the body allows. The last kilometre should be the fastest.'
  },

  athletes: [
    {
      id: 'lisa',
      name: 'Lisa',
      units: 'mi',
      band: { mi: '7:00–7:10 /mi', km: '4:21–4:25 /km' },
      bandKind: 'Working band',
      cue: 'Drawn from her own August evidence, where the eight-minute sets sat at 7:11 and 7:07. A 6:47 rep shows there is more available. That is deliberately not the band. The band is the study.',
      tuesday: [
        { week: 1, work: '2 × 10 min', note: 'Entry read.' },
        { week: 2, work: '2 × 12 min', note: null },
        { week: 3, work: 'Hold · no threshold', note: 'Ankle. Do not make up the 25 minutes later in the week.' },
        { week: 4, work: '2 × 12 min', note: 'The last successful rung, 3 min easy between.' },
        { week: 5, work: '25 min continuous', note: 'First continuous read.' },
        { week: 6, work: '25 min continuous', note: 'The same 25 minutes.' },
        { week: 7, work: '1 × 12 min', note: 'A touch, not a session.' }
      ]
    }
  ],

  arrives: 'She arrives at the test with two 25-minute continuous efforts filed at her own band, a week later than planned and without having forced the missed work.'
};
