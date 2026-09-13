// Editorial execution cues. This layer never changes canonical workouts or pace bands.
export function executionCue(week, day, racePace) {
  if (!racePace) return '';
  if (day === 'SAT') return 'Enter the assigned band after the easy running. Settle before pressing. Hold the middle; finish in control without chasing lost seconds.';
  if (week <= 3) return 'Enter each rep at the slower edge of your assigned band. Settle, then hold. Do not sprint the opening or bank time for later.';
  if (week === 4) return 'Start restrained. Settle into your assigned band. Hold it through the final mile; finishing well does not require running faster.';
  if (week === 6) return 'Let the first mile feel restrained. Settle into the band and keep the middle even. Finish with control.';
  if (week === 9) return 'Do not bank time early. The first two miles should leave the next six available. Hold your band instead of chasing a faster average.';
  if (week >= 14) return 'Rehearse the opening you know from training. Settle, hold, then use only the reserve the earlier miles have left.';
  return 'Start at the slower edge of your assigned band. Settle, hold an even rhythm, and finish in control. Do not make up time with a surge.';
}

// Editorial revision shared by web, print and PDF; not an athlete assignment.
export const executionVersion = "2026-09-13";
export const executionGuide = [
  "Enter the slower edge of your assigned band. Find the rhythm. Hold it when you feel good enough to go faster. Finish with control; a fast finish is not required.",
  "Begin with the broken reps. Check how each rep started as well as its average. The continuous sessions rehearse the same behaviour for longer.",
  "Once you can find the band reliably, try a short middle section without looking at pace. Keep the watch recording and compare afterward. Start with one mile; extend only when it stays controlled. This is optional practice, not a pass-or-fail test.",
  "Record the opening split, any drift or correction, effort and reserve. If you opened too fast, that changes how we read a late fade. Your final race strategy comes from these rehearsals, your current assignment and race-day conditions."
];
export const executionExamples = [["W1–3 · Broken reps",1,"TUE"],["W4 · 5 continuous",4,"TUE"],["W6 · 6 continuous",6,"TUE"],["W9 · 8 continuous",9,"TUE"],["W12 · Last 12 after 4 easy",12,"SAT"],["Race week",15,"TUE"]].map(([label,week,day]) => ({label,cue:executionCue(week,day,true)}));
