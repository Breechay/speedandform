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
  // race pace in this plan and Thursday rotates through different things; a
  // renderer that assumed the calendar would be wrong the first time a plan moved
  // its key days.
  //
  // The Plan is public method, not an athlete prescription. The canonical payload
  // still carries reference pace values so components can be classified, but
  // athlete-facing numbers belong to the athlete assignment. Public notation says
  // "your race-pace band" and "your current threshold" instead of presenting one
  // athlete's numbers as the method.
  const RP_LO = plan.plan.race_pace_low_seconds;
  const RP_HI = plan.plan.race_pace_high_seconds;

  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const span = (c) => {
    if (c.distance != null) {
      if (c.distance_unit === 'km' && +c.distance < 1) return `${Math.round(+c.distance * 1000)}M`;
      return `${+c.distance} ${(c.distance_unit || 'mi').toUpperCase()}`;
    }
    if (c.duration_seconds == null) return '';
    return c.duration_seconds % 60 === 0
      ? `${c.duration_seconds / 60} MIN` : `${c.duration_seconds} S`;
  };
  const isRacePace = (c) => c.pace_low_seconds === RP_LO && c.pace_high_seconds === RP_HI;
  const isStride = (c) => c.shape === 'repetitions' && c.pace_low_seconds == null
    && ((c.duration_seconds != null && c.duration_seconds <= 30)
      || (c.distance_unit === 'km' && c.distance != null && +c.distance <= .15));

  // Notation is semantic, never a generic component arrow. A long run is
  // `16 mi · last 3 @ your race-pace band`, not `13 mi → 3 mi`; strides are
  // `7 mi easy + 4 × 20 s strides`, not `7 mi → 4 × 20 s`.
  // A one-sided pace means two different things depending on which side of race
  // pace it sits. Easy is a ceiling — 8:45 or slower. Threshold is an athlete-
  // relative target and is rendered from the session label rather than leaking a
  // reference value from the generic Plan.
  const band = (c) => {
    if (isRacePace(c)) return 'your race-pace band';
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
  const standardRecovery = (value) => {
    const raw = value.replace(/\s+recovery$/i, '').trim();
    if (/^full$/i.test(raw)) return 'full';
    const seconds = raw.match(/^(\d+)s$/i);
    if (seconds) return `r${seconds[1]}`;
    const minutes = raw.match(/^(\d+)\s+min$/i);
    if (minutes) return `r${minutes[1]}:00`;
    return `r${raw}`;
  };
  const standardRows = (session) => (session.details || '').split('\n').flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s*x\s*(\d+)m\s+in\s+([^/]+?)(?:\s*\/\s*(.+))?$/i);
    if (!match) return [];
    return [{
      work: `${match[1]} × ${match[2]}m · ${match[3].trim().replaceAll('-', '–')}`,
      recovery: match[4] ? standardRecovery(match[4]) : ''
    }];
  });

  function describe(session) {
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
    const isThreshold = /^threshold/i.test(label);

    // A fixed Thursday standard is authored in rep distance + absolute rep
    // time. Its equivalent pace fields exist for structured comparison, not
    // for presentation. The authored detail lines therefore remain the display
    // language and the named workout remains one semantic session.
    if (/^absolute speed standard$/i.test(label)) {
      return { kind: 'absolute', label: '', head: session.title,
        standardRows: standardRows(session), lines: [book, total].filter(Boolean) };
    }

    // Controlled aerobic-power work is effort-authored, not pace-authored.
    // Do not let its structured comparison band replace "controlled hard".
    if (/controlled hard/i.test(session.details || '') && reps) {
      const n = reps.repeat_count > 1 ? `${reps.repeat_count} × ` : '';
      if (/^hills$/i.test(label)) {
        return { kind, label, head: `${n}${lower(reps)} uphill · controlled hard`,
          lines: ['jog down / ~2 min easy', book, total].filter(Boolean) };
      }
      return { kind, label, head: `${n}${lower(reps)} controlled hard`,
        lines: [rest(reps), book, total].filter(Boolean) };
    }

    if (strides) {
      const base = work.find((c) => c.shape === 'continuous');
      return { kind, label, head: `${+session.distance} mi easy + ${
        strides.repeat_count} × ${lower(strides)} strides`,
        lines: [base && band(base) ? `@ ${band(base)}` : '', total].filter(Boolean) };
    }
    if (aerobic) {
      if (rpCont) {
        return { kind, label, head: `${+session.distance} mi`,
          lines: [`last ${+rpCont.distance} mi continuous @ ${band(rpCont)}`,
                  `${+aerobic.distance} mi easy + ${+rpCont.distance} mi race pace`,
                  book, total].filter(Boolean) };
      }
      return { kind, label, head: `${+aerobic.distance} mi easy`,
               lines: [`@ ${band(aerobic)}`] };
    }
    if (rpCont) {
      return { kind, label,
        head: kind === 'race' ? `${+rpCont.distance} mi @ ${band(rpCont)}`
                              : `${+rpCont.distance} mi continuous @ ${band(rpCont)}`,
        lines: [book, total].filter(Boolean) };
    }
    if (reps) {
      const n = reps.repeat_count > 1 ? `${reps.repeat_count} × ` : '';
      const target = isThreshold ? 'your current threshold' : band(reps);
      return { kind, label, head: `${n}${lower(reps)} @ ${target}`,
        lines: [rest(reps), book, total].filter(Boolean) };
    }
    const base = work[0];
    return { kind, label, head: `${+session.distance} mi easy`,
             lines: [base && band(base) ? `@ ${band(base)}` : ''].filter(Boolean) };
  }

  // Lime means one thing: this can establish something. A day earns it by
  // CARRYING race-pace work, not by being titled with it — which is how the
  // Saturday long run that finishes at race pace gets the same mark as Tuesday.
  // W12's ask is exactly that session, and it used to render grey.
  function read(session) {
    const r = describe(session);
    r.racePace = (session?.components || [])
      .some((c) => c.role === 'work' && isRacePace(c));
    return r;
  }

  return { read, clock };
}
