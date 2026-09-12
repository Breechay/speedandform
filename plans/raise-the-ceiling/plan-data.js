/* RAISE THE CEILING — the public plan manifest.
 *
 * One authored Plan, two athlete views. The public page reads this file as the
 * authoritative manifest; the six weeks are never typed into the HTML.
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
  weeks: 6,
  standfirst: 'Six weeks. One 10K.',
  question: 'Can raising the ceiling make everything underneath easier to use?',
  idea: 'Make the top end taller so everything underneath feels easier.',
  method: 'Tuesday raises what they can sustain. Thursday keeps speed above it. Saturday builds the endurance underneath it.',
  teaching: 'You don’t get faster by grinding through resistance. You get faster by lifting the ceiling.',
  fee: 'Free',
  startsOn: '2026-09-15',
  expressionOn: '2026-10-24',

  /* Mon/Wed/Fri general aerobic and Sun rest-or-HYROX are the athletes' existing
     week. They are context, not prescription, so they are not authored here. */
  authoredDays: ['Tuesday', 'Thursday', 'Saturday'],

  weekDates: ['Sep 15', 'Sep 22', 'Sep 29', 'Oct 06', 'Oct 13', 'Oct 20'],

  tuesday: {
    warmUp: '15–20 min easy, then 4 × 20s relaxed strides',
    coolDown: '10 min easy',
    recovery: '3 min float through W2. Later broken 2 × 12 work uses 2 min.',
    rule: 'Prefer a session that finishes as strong as it starts. A hot first rep is a warning that the workout is being spent too early.'
  },

  /* Fixed FORM standards. These do not scale to the athlete — variation is
     expressed by how close each athlete gets to a standard that does not move. */
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
    { week: 3, date: 'Oct 01', name: 'Nice and Easy', reps: [
      '3 × 200m · 29–32s · 30s',
      '2 × 800m · 2:25–2:30 · 4 min',
      '1 × 400m · 1:08–1:10' ] },
    { week: 4, date: 'Oct 08', name: 'Pyramid Intervals · repeat', reps: [
      '2 × 300m · 50–52s · 90s',
      '2 × 400m · 1:08–1:12 · 2 min',
      '1 × 600m · 1:42–1:45 · 2:30',
      '2 × 400m · 1:08–1:10 · 2 min',
      '2 × 300m · 50–52s · full recovery' ] },
    { week: 5, date: 'Oct 15', name: 'Speed Demons · repeat', reps: [
      '4 × 300m · 50–52s · 2:30',
      '6 × 200m · 32–34s · 90s',
      '8 × 100m · 15–17s · 90s' ] },
    { week: 6, date: 'Oct 22', name: 'Strides', reps: [
      'Easy running + 4 × 100m relaxed strides · full walk/jog recovery' ] }
  ],
  thursdayNote: 'Named speed sessions use 15 min warm-up and 10 min cool-down. Repeated sessions are deliberate comparisons. The standard is never quietly made easier.',

  /* Distance stays the athlete's own normal distance. Do not invent mileage. */
  saturday: [
    { week: 1, title: 'Easy long',  note: 'Conversational throughout.' },
    { week: 2, title: 'Easy long',  note: 'Conversational. No finishing efforts.' },
    { week: 3, title: 'Easy long',  note: 'Conversational. No finishing efforts.' },
    { week: 4, title: 'Long + controlled finish',
      note: 'Final 15–20 min at the Tuesday band. Not faster.' },
    { week: 5, title: 'Easy long',  note: 'No proving.' },
    { week: 6, title: '10K · Oct 24', note: 'The test.' }
  ],
  saturdayNote: 'Easy long runs stay at each athlete’s own normal distance.',

  expression: {
    title: '10K',
    on: 'Saturday, October 24',
    shape: ['15–20 min very easy', '4 × 20s strides', '10K', '10–20 min very easy'],
    course: 'Flat, measured, the same course for both if the schedule allows.',
    conditions: 'Record temperature, humidity and dew point. Miami in October will affect the result, and the result is worthless without the conditions attached.',
    execution: 'Open the first kilometre at your own Tuesday band. Do not open faster. Progress from there if the body allows. The last kilometre should be the fastest.'
  },

  athletes: [
    {
      id: 'simon',
      name: 'Simon',
      units: 'km',
      band: { km: '3:44 /km', mi: '6:00 /mi' },
      bandKind: 'Working band',
      cue: 'Stay controlled. If the pace feels slightly boring, that is useful. Nothing here should require a decision to survive.',
      tuesday: [
        { week: 1, work: '2 × 12 min', note: 'Repeat. New Week 01.' },
        { week: 2, work: '25 min continuous', note: 'First continuous read in the rebased block.' },
        { week: 3, work: '2 × 12 min', note: '2 min recovery.' },
        { week: 4, work: '25 min continuous', note: 'The same 25 minutes.' },
        { week: 5, work: '25 min continuous', note: 'Repeat the same ask.' },
        { week: 6, work: '1 × 12 min', note: 'A touch, not a session.' }
      ]
    },
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
        { week: 3, work: '25 min continuous', note: 'First continuous read.' },
        { week: 4, work: '2 × 12 min', note: '2 min recovery.' },
        { week: 5, work: '25 min continuous', note: 'The same 25 minutes.' },
        { week: 6, work: '1 × 12 min', note: 'A touch, not a session.' }
      ]
    }
  ],

  bothArrive: 'Both arrive at the test with repeated 25-minute continuous efforts filed at their own band. Different routes. Same destination.'
};
