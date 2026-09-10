/* RAISE THE CEILING — the public plan manifest.
 *
 * One authored Plan, two athlete views. Derived exactly from
 * docs/FORM_RAISE_THE_CEILING_SPEC_v1.md, which was derived from
 * RAISE_THE_CEILING_plan_v4.md. Nothing here is invented.
 *
 * This file is deliberately shaped like the object the database does not have
 * yet:
 *
 *     shared     → Plan Version   (the reusable method)
 *     athletes[] → Assignment     (band, units, deliberate divergence)
 *
 * When the Assignment model exists this migrates into
 * `Plan Version + Simon Assignment + Lisa Assignment` without the page
 * changing. Until then it is the authoritative public manifest, and the
 * renderer reads it — the six weeks are never typed into the HTML.
 *
 * TWO RULES THAT MUST SURVIVE ANY EDIT:
 *
 *  1. Thursday is a fixed FORM standard. Metric rep distances and absolute rep
 *     times stay exactly as authored, for both athletes, in every unit mode.
 *     Never convert them into a per-km or per-mile pace.
 *  2. Lisa's W2 repeat is intentional — she raced HYROX D.C. on Sep 03. Do not
 *     normalize her onto Simon's sequence.
 *
 * Both pace bands are quoted in the units v4 authored them in. Nothing is
 * converted at runtime, so no rounding can drift.
 */

export const plan = {
  slug: 'raise-the-ceiling',
  name: 'Raise the Ceiling',
  weeks: 6,
  standfirst: 'Six weeks. One 10K.',
  question: 'Can a good runner become a better runner without simply running harder?',
  idea: 'Make a fast pace ordinary before asking for a faster one.',
  method: 'Tuesday raises what they can sustain. Thursday keeps faster running available above it. Saturday keeps the endurance underneath.',
  teaching: 'The numbers belong to Simon and Lisa. The question may belong to you.',
  fee: 'Free',
  startsOn: '2026-09-01',
  expressionOn: '2026-10-10',

  /* Mon/Wed/Fri general aerobic and Sun rest-or-HYROX are the athletes' existing
     week. v4 describes them as context, not prescription, so they are not here. */
  authoredDays: ['Tuesday', 'Thursday', 'Saturday'],

  weekDates: ['Sep 01', 'Sep 08', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 06'],

  tuesday: {
    warmUp: '15–20 min easy, then 4 × 20s relaxed strides',
    coolDown: '10 min easy',
    recovery: '3 min float in W2 and W3. 2 min from W4.',
    rule: 'Prefer a session that finishes as strong as it starts. A hot first rep is a warning that the workout is being spent too early.'
  },

  /* Fixed FORM standards. These do not scale to the athlete — variation is
     expressed by how close each athlete gets to a standard that does not move. */
  thursday: [
    { week: 1, date: 'Sep 03', name: 'Filed', reps: null,
      note: 'Already run and filed.' },
    { week: 2, date: 'Sep 10', name: 'Pyramid Intervals', reps: [
      '2 × 300m · 50–52s · 90s',
      '2 × 400m · 1:08–1:12 · 2 min',
      '1 × 600m · 1:42–1:45 · 2:30',
      '2 × 400m · 1:08–1:10 · 2 min',
      '2 × 300m · 50–52s · full recovery' ] },
    { week: 3, date: 'Sep 17', name: 'Speed Demons', reps: [
      '4 × 300m · 50–52s · 2:30',
      '6 × 200m · 32–34s · 90s',
      '8 × 100m · 15–17s · 90s' ] },
    { week: 4, date: 'Sep 24', name: 'Gauntlet', reps: [
      '3 × 600m · 1:48–1:52 · 3 min',
      '2 × 400m · 1:08–1:12 · 2:30',
      '3 × 300m · 48–52s · 2 min',
      '2 × 200m · 29–32s · 2 min',
      '2 × 150m · 20–22s · full recovery' ] },
    { week: 5, date: 'Oct 01', name: 'Nice and Easy', reps: [
      '3 × 200m · 29–32s · 30s',
      '2 × 800m · 2:25–2:30 · 4 min',
      '1 × 400m · 1:08–1:10' ] },
    { week: 6, date: 'Oct 08', name: 'Strides', reps: [
      'Easy running + 4 × 100m relaxed strides · full walk/jog recovery' ] }
  ],
  thursdayNote: 'Named speed sessions use 15 min warm-up and 10 min cool-down. If a week needs less, the coach writes a shorter session on purpose. The standard is never quietly made easier.',

  /* Distance stays the athlete's own normal distance. v4 is explicit: do not
     invent mileage. */
  saturday: [
    { week: 1, title: 'Easy long',  note: 'Conversational throughout.' },
    { week: 2, title: 'Easy long',  note: 'Conversational. No finishing efforts.' },
    { week: 3, title: 'Easy long',  note: 'Conversational. No finishing efforts.' },
    { week: 4, title: 'Long + controlled finish',
      note: 'Final 15–20 min at the Tuesday band. Not faster.' },
    { week: 5, title: 'Easy long',  note: 'No proving.' },
    { week: 6, title: '10K · Oct 10', note: 'The test.' }
  ],
  saturdayNote: 'Easy long runs stay at each athlete’s own normal distance.',

  expression: {
    title: '10K',
    on: 'Saturday, October 10',
    shape: ['15–20 min very easy', '4 × 20s strides', '10K', '10–20 min very easy'],
    course: 'Flat, measured, the same course for both if the schedule allows.',
    conditions: 'Record temperature, humidity and dew point. Miami in October will affect the result, and the result is worthless without the conditions attached.',
    execution: 'Open the first kilometre at your own Tuesday band. Do not open faster. Progress from there if the body allows. The last kilometre should be the fastest.'
    /* v4 carries projections of ~36:20 and ~43:15. They are the coach's private
       read, explicitly not prescribed and not to be chased. They are not in this
       file, and must never reach this page or the app. */
  },

  athletes: [
    {
      id: 'simon',
      name: 'Simon',
      units: 'km',
      band: { km: '3:44 /km', mi: '6:00 /mi' },
      bandKind: 'Working band',
      cue: 'Hold the floor of the effort, not the ceiling. If it feels controlled and slightly boring, that is the session working. Nothing here should require a decision to survive.',
      tuesday: [
        { week: 1, work: '2 × 10 min', note: 'Filed.' },
        { week: 2, work: '2 × 12 min', note: null },
        { week: 3, work: '25 min continuous', note: 'First read.' },
        { week: 4, work: '2 × 12 min', note: '2 min recovery.' },
        { week: 5, work: '25 min continuous', note: 'The same 25 minutes.' },
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
        { week: 2, work: '2 × 10 min', note: 'Post-race re-entry. Repeated on purpose.' },
        { week: 3, work: '2 × 12 min', note: null },
        { week: 4, work: '25 min continuous', note: 'Her first.' },
        { week: 5, work: '25 min continuous', note: 'The same 25 minutes.' },
        { week: 6, work: '1 × 12 min', note: 'A touch, not a session.' }
      ]
    }
  ],

  bothArrive: 'Both arrive at the test with two 25-minute continuous efforts filed at their own band. Different routes. Same destination.'
};
