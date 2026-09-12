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
