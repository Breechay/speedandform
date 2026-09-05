// HOW THE PLAN SAYS ITS NUMBERS.
//
// One notation layer, read by the screen and by the print edition. Two copies
// of these rules would be two plans the first time one of them was corrected.
//
// Nothing here decides what KIND of session a day is — that is the session's
// own authored label. This only decides how to say the work.

export function notation(plan) {
  // ─────────────────────────────────────────────────────────────────────────
  // WHAT KIND OF DAY IS THIS.
  //
  // Derived from what the session is made of, never from the weekday. Tuesday is
  // race pace in this plan and Thursday rotates through four different things; a
  // renderer that assumed the calendar would be wrong the first time a plan moved
  // its key days.
  //
  // The bands come from the plan itself, so a plan authored at 7:00–7:15 labels
  // its own work correctly without a line changing here.
  const RP_LO = plan.plan.race_pace_low_seconds;
  const RP_HI = plan.plan.race_pace_high_seconds;

  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const span = (c) => {
    if (c.distance != null) return `${+c.distance} MI`;
    if (c.duration_seconds == null) return '';
    return c.duration_seconds % 60 === 0
      ? `${c.duration_seconds / 60} MIN` : `${c.duration_seconds} S`;
  };
  const isRacePace = (c) => c.pace_low_seconds === RP_LO && c.pace_high_seconds === RP_HI;
  const isStride = (c) => c.shape === 'repetitions' && c.duration_seconds != null
    && c.duration_seconds <= 30 && c.pace_low_seconds == null;

  // Notation is semantic, never a generic component arrow. A long run is
  // `16 mi · last 3 @ 6:30–6:45`, not `13 mi → 3 mi`; strides are
  // `7 mi easy + 4 × 20 s strides`, not `7 mi → 4 × 20 s`.
  // A one-sided pace means two different things depending on which side of race
  // pace it sits. Easy is a ceiling — 8:45 or slower, and slower is never wrong.
  // Threshold is a target the block approaches — ≈6:15. Rendering both as
  // "or slower" told an athlete that a threshold session had no floor.
  const band = (c) => {
    if (c.rpe_low != null) return `RPE ${c.rpe_low}${c.rpe_high ? `–${c.rpe_high}` : ''}`;
    if (c.pace_low_seconds == null) return '';
    if (c.pace_high_seconds) return `${clock(c.pace_low_seconds)}–${clock(c.pace_high_seconds)}`;
    return c.pace_low_seconds > RP_HI
      ? `${clock(c.pace_low_seconds)} or slower`
      : `≈${clock(c.pace_low_seconds)}`;
  };
  const rest = (c) => {
    if (!c.recovery_seconds) return '';
    const t = c.recovery_seconds % 60 === 0
      ? `${c.recovery_seconds / 60} min` : `${c.recovery_seconds} s`;
    return `${t}${c.recovery_kind ? ` ${c.recovery_kind}` : ''}`;
  };
  const lower = (c) => span(c).toLowerCase();

  function read(session) {
    if (!session) return { kind: 'rest', label: 'Rest', head: '—', lines: [] };
    const parts = session.components || [];
    const work = parts.filter((c) => c.role === 'work');
    const wu = parts.find((c) => c.role === 'warm_up');
    const cd = parts.find((c) => c.role === 'cool_down');
    const book = [wu && `WU ${lower(wu)}`, cd && `CD ${lower(cd)}`].filter(Boolean).join(' · ');
    const total = `${+session.distance} mi total`;
    const strides = work.find(isStride);
    const rpCont = work.find((c) => c.shape === 'continuous' && isRacePace(c));
    const aerobic = work.find((c) => c.shape === 'continuous' && !isRacePace(c)
      && c.pace_low_seconds != null && c.pace_low_seconds > RP_HI);
    const reps = work.find((c) => c.shape === 'repetitions' && !isStride(c));

    // The label is the session's own, authored on the plan. Nothing here decides
    // what kind of session this is; it only decides how to say the numbers.
    const label = session.label || '';
    const kind = /race pace finish/i.test(label) ? 'long'
      : /^long run/i.test(label) ? 'long'
      : /^race$/i.test(label) ? 'race'
      : /^race pace/i.test(label) ? 'rp'
      : /aerobic|recovery/i.test(label) ? 'easy' : 'support';

    if (strides) {
      const base = work.find((c) => c.shape === 'continuous');
      return { kind, label, head: `${+session.distance} mi easy + ${
        strides.repeat_count} × ${lower(strides)} strides`,
        lines: [base && band(base) ? `@ ${band(base)}` : '', total].filter(Boolean) };
    }
    if (aerobic) {
      if (rpCont) {
        return { kind, label, head: `${+session.distance} mi`,
          lines: [`last ${+rpCont.distance} mi @ ${band(rpCont)}`,
                  `${+aerobic.distance} mi easy + ${+rpCont.distance} mi race pace`,
                  book, total].filter(Boolean) };
      }
      return { kind, label, head: `${+aerobic.distance} mi easy`,
               lines: [`@ ${band(aerobic)}`] };
    }
    if (rpCont) {
      return { kind, label,
        head: kind === 'race' ? `${+rpCont.distance} mi @ ${band(rpCont)}`
                              : `${+rpCont.distance} mi continuous @ ${band(rpCont)}`,
        lines: [book, total].filter(Boolean) };
    }
    if (reps) {
      const n = reps.repeat_count > 1 ? `${reps.repeat_count} × ` : '';
      return { kind, label, head: `${n}${lower(reps)} @ ${band(reps)}`,
        lines: [rest(reps), book, total].filter(Boolean) };
    }
    const base = work[0];
    return { kind, label, head: `${+session.distance} mi easy`,
             lines: [base && band(base) ? `@ ${band(base)}` : ''].filter(Boolean) };
  }

  return { read, clock };
}
