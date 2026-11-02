// A coach-authored session total is a separate fact from its component doses.
// A timed warm-up has no known distance, so a wording or work edit may not
// invent miles from an assumed easy pace.
export function revisedAuthoredTotal(version, originalWork = null, nextWork = null) {
  const authored = version?.prescribed_distance;
  if (authored == null || !Number.isFinite(Number(authored)) || Number(authored) <= 0) return null;

  let total = Number(authored);
  if (!originalWork || nextWork == null || Number(nextWork) === Number(originalWork.distance)) {
    return total;
  }

  const previous = Number(originalWork.distance);
  const next = Number(nextWork);
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return null;

  const sourceUnit = originalWork.distance_unit || version.distance_unit || 'mi';
  const totalUnit = version.distance_unit || 'mi';
  const delta = next - previous;
  if (sourceUnit !== totalUnit && !['mi', 'km'].includes(sourceUnit)) return null;
  const converted = sourceUnit === totalUnit ? delta
    : sourceUnit === 'km' && totalUnit === 'mi' ? delta * 0.621371
    : sourceUnit === 'mi' && totalUnit === 'km' ? delta * 1.609344 : NaN;
  if (!Number.isFinite(converted)) return null;
  total += converted;
  return total > 0 ? Number(total.toFixed(2)) : null;
}
